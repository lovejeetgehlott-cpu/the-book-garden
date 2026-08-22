const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect, superAdminOnly } = require('../middleware/auth');

const router = express.Router();

// Sign a JWT that embeds the user id; expires in 7 days
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

/**
 * POST /api/auth/login
 * Public. Validates credentials and returns a JWT plus the user profile.
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // password has select:false, so request it explicitly
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.json({
      token: signToken(user._id),
      user: { _id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * POST /api/auth/register
 * Protected, super-admin only. Creates a new admin account.
 */
router.post('/register', protect, superAdminOnly, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const exists = await User.findOne({ email: (email || '').toLowerCase() });
    if (exists) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    const user = await User.create({ name, email, password, role });
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/**
 * GET /api/auth/me
 * Protected. Returns the currently logged-in user (used to restore sessions).
 */
router.get('/me', protect, (req, res) => {
  const { _id, name, email, role } = req.user;
  res.json({ _id, name, email, role });
});

module.exports = router;
