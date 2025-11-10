'use strict';
const express = require('express');
const bcrypt = require('bcryptjs'); // ✅ For password hashing
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
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
    user.password = await bcrypt.hash(user.password, parseInt(process.env.SALT_ROUNDS || '10'));

    const secretKey = speakeasy.generateSecret();
    user.secretKey = secretKey.base32;

    const newUser = await User.create(user);

    const qrCodeUrl = await qrcode.toDataURL(secretKey.otpauth_url);

    res.status(201).json({
      message: 'User created successfully. Please scan the QR code to set up 2FA.',
      secret: secretKey.base32,
      qrCodeUrl,
      userId: newUser.id
    });
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

// PUT /api/users -> update an existing user
router.put('/', authenticateUser, asyncHandler(async (req, res) => {
  try {
    const user = req.currentUser;
    const updatedUser = req.body;

    console.log('--- DEBUG: Current User ---');
    console.log(user);
    console.log('--- DEBUG: Updated User Data from Body ---');
    console.log(updatedUser);

    if (updatedUser.password) {
      updatedUser.password = await bcrypt.hash(updatedUser.password, parseInt(process.env.SALT_ROUNDS || '10'));
      console.log('--- DEBUG: Updated User Data After Hashing ---');
      console.log(updatedUser);
    }

    const [updateCount] = await User.update(updatedUser, {
      where: { id: user.id }
    });

    console.log('--- DEBUG: Sequelize Update Result ---');
    console.log({ updateCount });

    res.status(204).end();
  } catch (error) {
    if (
      error.name === 'SequelizeValidationError' ||
      error.name === 'SequelizeUniqueConstraintError'
    ) {
      const errors = error.errors.map(err => err.message);
      res.status(400).json({ errors });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
}));

// POST /api/users/verify-password -> verify user's password
router.post('/verify-password', authenticateUser, asyncHandler(async (req, res) => {
  try {
    const user = req.currentUser;
    const { password } = req.body;

    const isMatch = await bcrypt.compare(password, user.password);

    res.status(200).json({ isMatch });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}));

// POST /api/users/verify-2fa -> verify 2fa token
router.post('/verify-2fa', asyncHandler(async (req, res) => {
  try {
    const { userId, token } = req.body;
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const isVerified = speakeasy.totp.verify({
      secret: user.secretKey,
      encoding: 'base32',
      token,
    });

    if (isVerified) {
      res.status(200).json({ message: '2FA verification successful.' });
    } else {
      res.status(401).json({ message: 'Invalid 2FA token.' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}));

// POST /api/users/login-2fa -> verify 2fa token for login
router.post('/login-2fa', asyncHandler(async (req, res) => {
  try {
    const { userId, token } = req.body;
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const isVerified = speakeasy.totp.verify({
      secret: user.secretKey,
      encoding: 'base32',
      token,
    });

    if (isVerified) {
      const userResult = await User.findOne({
        where: { id: userId },
        attributes: { exclude: ['password', 'secretKey', 'createdAt', 'updatedAt'] }
      });
      res.status(200).json(userResult);
    } else {
      res.status(401).json({ message: 'Invalid 2FA token.' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}));

module.exports = router;
