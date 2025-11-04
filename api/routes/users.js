'use strict';
const express = require('express');
const bcrypt = require('bcryptjs'); // ✅ For password hashing
const { User } = require('../models');
const { authenticateUser } = require('../middleware/auth-user');
const { asyncHandler } = require('../middleware/async-handler');

const router = express.Router();

// ✅ GET /api/users → return the current authenticated user
router.get('/', authenticateUser, asyncHandler(async (req, res) => {
  const user = req.currentUser;

  const userResult = await User.findOne({
    where: { emailAddress: user.emailAddress },
    attributes: { exclude: ['password', 'createdAt', 'updatedAt'] }
  });

  res.json(userResult);
}));

// ✅ POST /api/users → create a new user
router.post('/', asyncHandler(async (req, res) => {
  try {
    const user = req.body;

    // ✅ Validate password rules
    if (!user.password || user.password.length < 8) {
      return res.status(400).json({
        errors: ['Password must be at least 8 characters long.']
      });
    }

    // ✅ Hash the password before saving
    user.password = await bcrypt.hash(user.password, 10);

    await User.create(user);
    res.status(201).location('/').end();
  } catch (error) {
      console.error('🧱 Error creating user:', error); // <--- ADD THIS

    if (
      error.name === 'SequelizeValidationError' ||
      error.name === 'SequelizeUniqueConstraintError'
    ) {
      const errors = error.errors.map(err => err.message);
      res.status(400).json({ errors });
    } else {
      console.error('Unexpected error creating user:', error);
      res.status(400).json({ error: error.message });
    }
  }
}));

// 🔍 DEBUG ROUTE — check all users (temporary for testing)
router.get('/all', asyncHandler(async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'firstName', 'lastName', 'emailAddress'],
    });
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
}));

module.exports = router;
