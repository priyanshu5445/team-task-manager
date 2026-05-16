const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Task = require('../models/Task');
const Project = require('../models/Project');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// @route   GET /api/tasks
// @desc    Get all tasks (filtered by user role)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { status, priority, project, assignedTo, search, sort } = req.query;
    let filter = {};

    // Role-based filtering
    if (req.user.role !== 'admin') {
      const userProjects = await Project.find({
        $or: [{ owner: req.user._id }, { members: req.user._id }]
      }).select('_id');
      filter.project = { $in: userProjects.map(p => p._id) };
    }

    // Apply filters
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (project) filter.project = project;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Sort options
    let sortOption = { createdAt: -1 };
    if (sort === 'dueDate') sortOption = { dueDate: 1 };
    if (sort === 'priority') sortOption = { priority: -1 };
    if (sort === 'status') sortOption = { status: 1 };

    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('project', 'name color')
      .sort(sortOption);

    res.json(tasks);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ message: 'Server error fetching tasks' });
  }
});

// @route   GET /api/tasks/stats
// @desc    Get task statistics for dashboard
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    let matchFilter = {};
    
    if (req.user.role !== 'admin') {
      const userProjects = await Project.find({
        $or: [{ owner: req.user._id }, { members: req.user._id }]
      }).select('_id');
      matchFilter.project = { $in: userProjects.map(p => p._id) };
    }

    const [statusStats, priorityStats, overdueCount, recentTasks] = await Promise.all([
      // Status distribution
      Task.aggregate([
        { $match: matchFilter },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      // Priority distribution
      Task.aggregate([
        { $match: matchFilter },
        { $group: { _id: '$priority', count: { $sum: 1 } } }
      ]),
      // Overdue tasks
      Task.countDocuments({
        ...matchFilter,
        dueDate: { $lt: new Date() },
        status: { $ne: 'done' }
      }),
      // Recent tasks
      Task.find(matchFilter)
        .populate('assignedTo', 'name email avatar')
        .populate('project', 'name color')
        .sort({ createdAt: -1 })
        .limit(5)
    ]);

    const stats = {
      total: 0,
      byStatus: { todo: 0, 'in-progress': 0, review: 0, done: 0 },
      byPriority: { low: 0, medium: 0, high: 0, urgent: 0 },
      overdue: overdueCount,
      recentTasks
    };

    statusStats.forEach(s => {
      stats.byStatus[s._id] = s.count;
      stats.total += s.count;
    });
    priorityStats.forEach(p => {
      stats.byPriority[p._id] = p.count;
    });

    res.json(stats);
  } catch (error) {
    console.error('Get task stats error:', error);
    res.status(500).json({ message: 'Server error fetching task stats' });
  }
});

// @route   POST /api/tasks
// @desc    Create a new task
// @access  Private
router.post('/', auth, [
  body('title').trim().isLength({ min: 2, max: 200 }).withMessage('Task title must be 2-200 characters'),
  body('description').optional().trim().isLength({ max: 1000 }),
  body('project').isMongoId().withMessage('Valid project ID is required'),
  body('assignedTo').optional().isMongoId().withMessage('Valid user ID is required'),
  body('status').optional().isIn(['todo', 'in-progress', 'review', 'done']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  body('dueDate').optional().isISO8601().withMessage('Valid date is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
    }

    const { title, description, project, assignedTo, status, priority, dueDate } = req.body;

    // Verify project exists
    const projectDoc = await Project.findById(project);
    if (!projectDoc) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check access (admin can create in any project, member only in their projects)
    if (req.user.role !== 'admin' && 
        !projectDoc.owner.equals(req.user._id) && 
        !projectDoc.members.includes(req.user._id)) {
      return res.status(403).json({ message: 'You are not a member of this project' });
    }

    const task = await Task.create({
      title,
      description,
      project,
      assignedTo: assignedTo || null,
      createdBy: req.user._id,
      status: status || 'todo',
      priority: priority || 'medium',
      dueDate: dueDate || null
    });

    const populated = await Task.findById(task._id)
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('project', 'name color');

    res.status(201).json(populated);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Server error creating task' });
  }
});

// @route   PUT /api/tasks/:id
// @desc    Update a task
// @access  Private
router.put('/:id', auth, [
  body('title').optional().trim().isLength({ min: 2, max: 200 }),
  body('description').optional().trim().isLength({ max: 1000 }),
  body('status').optional().isIn(['todo', 'in-progress', 'review', 'done']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  body('dueDate').optional({ nullable: true }).isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Members can update status of tasks assigned to them; admins can update anything
    if (req.user.role !== 'admin') {
      const project = await Project.findById(task.project);
      if (!project.owner.equals(req.user._id) && 
          !project.members.includes(req.user._id)) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    const { title, description, status, priority, assignedTo, dueDate } = req.body;
    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (status) task.status = status;
    if (priority) task.priority = priority;
    if (assignedTo !== undefined) task.assignedTo = assignedTo;
    if (dueDate !== undefined) task.dueDate = dueDate;

    await task.save();

    const populated = await Task.findById(task._id)
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('project', 'name color');

    res.json(populated);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ message: 'Server error updating task' });
  }
});

// @route   DELETE /api/tasks/:id
// @desc    Delete a task
// @access  Private (Admin or task creator)
router.delete('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Only admin or task creator can delete
    if (req.user.role !== 'admin' && !task.createdBy.equals(req.user._id)) {
      return res.status(403).json({ message: 'Only admin or task creator can delete tasks' });
    }

    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Server error deleting task' });
  }
});

module.exports = router;
