const express = require('express');
const User = require('../models/User');
const { protect, superAdminOnly } = require('../middleware/auth');

const router = express.Router();

// Every /api/users route requires a logged-in super-admin
router.use(protect, superAdminOnly);

/**
 * GET /api/users - list all admin accounts (password hashes excluded)
 */
router.get('/', async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * POST /api/users - create a new admin account
 */
router.post('/', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const exists = await User.findOne({ email: (email || '').toLowerCase() });
    if (exists) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }
    const user = await User.create({ name, email, password, role });
    res.status(201).json({ _id: user._id, name: user.name, email: user.email, role: user.role });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/**
 * PUT /api/users/:id - update name/email/role, and password if provided
 */
router.put('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('+password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { name, email, role, password } = req.body;
    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (password) user.password = password; // re-hashed by the pre-save hook

    await user.save();
    res.json({ _id: user._id, name: user.name, email: user.email, role: user.role });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/**
 * DELETE /api/users/:id - remove an admin (cannot delete yourself)
 */
router.delete('/:id', async (req, res) => {
  try {
    if (req.params.id === String(req.user._id)) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
