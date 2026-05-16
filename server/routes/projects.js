const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Project = require('../models/Project');
const Task = require('../models/Task');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// @route   GET /api/projects
// @desc    Get all projects (user's projects)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    let projects;
    if (req.user.role === 'admin') {
      projects = await Project.find()
        .populate('owner', 'name email avatar')
        .populate('members', 'name email avatar role')
        .populate('taskCount')
        .sort({ createdAt: -1 });
    } else {
      projects = await Project.find({
        $or: [
          { owner: req.user._id },
          { members: req.user._id }
        ]
      })
        .populate('owner', 'name email avatar')
        .populate('members', 'name email avatar role')
        .populate('taskCount')
        .sort({ createdAt: -1 });
    }

    // Get task stats for each project
    const projectsWithStats = await Promise.all(projects.map(async (project) => {
      const taskStats = await Task.aggregate([
        { $match: { project: project._id } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);
      
      const stats = { todo: 0, 'in-progress': 0, review: 0, done: 0 };
      taskStats.forEach(s => { stats[s._id] = s.count; });
      
      return {
        ...project.toJSON(),
        taskStats: stats,
        totalTasks: Object.values(stats).reduce((a, b) => a + b, 0)
      };
    }));

    res.json(projectsWithStats);
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ message: 'Server error fetching projects' });
  }
});

// @route   POST /api/projects
// @desc    Create a new project
// @access  Private (Admin only)
router.post('/', [auth, roleCheck('admin')], [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Project name must be 2-100 characters'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
  body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Color must be a valid hex color')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
    }

    const { name, description, color, members } = req.body;

    const project = await Project.create({
      name,
      description,
      color: color || '#6366f1',
      owner: req.user._id,
      members: members || []
    });

    const populated = await Project.findById(project._id)
      .populate('owner', 'name email avatar')
      .populate('members', 'name email avatar role');

    res.status(201).json({ ...populated.toJSON(), taskStats: { todo: 0, 'in-progress': 0, review: 0, done: 0 }, totalTasks: 0 });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ message: 'Server error creating project' });
  }
});

// @route   GET /api/projects/:id
// @desc    Get project by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email avatar')
      .populate('members', 'name email avatar role');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check access (admin can see all, members can see their projects)
    if (req.user.role !== 'admin' && 
        !project.owner._id.equals(req.user._id) && 
        !project.members.some(m => m._id.equals(req.user._id))) {
      return res.status(403).json({ message: 'Access denied to this project' });
    }

    // Get tasks for this project
    const tasks = await Task.find({ project: project._id })
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .sort({ createdAt: -1 });

    // Task stats
    const taskStats = { todo: 0, 'in-progress': 0, review: 0, done: 0 };
    tasks.forEach(t => { taskStats[t.status]++; });

    res.json({
      ...project.toJSON(),
      tasks,
      taskStats,
      totalTasks: tasks.length
    });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ message: 'Server error fetching project' });
  }
});

// @route   PUT /api/projects/:id
// @desc    Update project
// @access  Private (Admin only)
router.put('/:id', [auth, roleCheck('admin')], [
  body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Project name must be 2-100 characters'),
  body('description').optional().trim().isLength({ max: 500 }),
  body('status').optional().isIn(['active', 'completed', 'archived']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const { name, description, status, color, members } = req.body;
    if (name) project.name = name;
    if (description !== undefined) project.description = description;
    if (status) project.status = status;
    if (color) project.color = color;
    if (members) project.members = members;

    await project.save();

    const populated = await Project.findById(project._id)
      .populate('owner', 'name email avatar')
      .populate('members', 'name email avatar role');

    res.json(populated);
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ message: 'Server error updating project' });
  }
});

// @route   DELETE /api/projects/:id
// @desc    Delete project and its tasks
// @access  Private (Admin only)
router.delete('/:id', [auth, roleCheck('admin')], async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Delete all tasks associated with this project
    await Task.deleteMany({ project: project._id });
    await Project.findByIdAndDelete(req.params.id);

    res.json({ message: 'Project and associated tasks deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ message: 'Server error deleting project' });
  }
});

// @route   POST /api/projects/:id/members
// @desc    Add members to project
// @access  Private (Admin only)
router.post('/:id/members', [auth, roleCheck('admin')], [
  body('members').isArray({ min: 1 }).withMessage('Members array is required')
], async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const { members } = req.body;
    
    // Add new members (avoid duplicates)
    members.forEach(memberId => {
      if (!project.members.includes(memberId)) {
        project.members.push(memberId);
      }
    });

    await project.save();

    const populated = await Project.findById(project._id)
      .populate('owner', 'name email avatar')
      .populate('members', 'name email avatar role');

    res.json(populated);
  } catch (error) {
    console.error('Add members error:', error);
    res.status(500).json({ message: 'Server error adding members' });
  }
});

// @route   DELETE /api/projects/:id/members/:userId
// @desc    Remove member from project
// @access  Private (Admin only)
router.delete('/:id/members/:userId', [auth, roleCheck('admin')], async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    project.members = project.members.filter(m => !m.equals(req.params.userId));
    await project.save();

    const populated = await Project.findById(project._id)
      .populate('owner', 'name email avatar')
      .populate('members', 'name email avatar role');

    res.json(populated);
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ message: 'Server error removing member' });
  }
});

module.exports = router;
