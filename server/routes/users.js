const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// @route   GET /api/users
// @desc    Get all users (for team management)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const users = await User.find().select('-__v').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error fetching users' });
  }
});

// @route   PUT /api/users/:id/role
// @desc    Update user role
// @access  Private (Admin only)
router.put('/:id/role', [auth, roleCheck('admin')], async (req, res) => {
  try {
    const { role } = req.body;
    if (!['admin', 'member'].includes(role)) {
      return res.status(400).json({ message: 'Role must be admin or member' });
    }

    // Prevent changing own role
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot change your own role' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ message: 'Server error updating role' });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete a user
// @access  Private (Admin only)
router.delete('/:id', [auth, roleCheck('admin')], async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error deleting user' });
  }
});

module.exports = router;
