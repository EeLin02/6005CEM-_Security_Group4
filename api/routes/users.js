'use strict';

const express = require('express');
const bcrypt = require('bcryptjs');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const jwt = require('jsonwebtoken');

const secret = process.env.JWT_SECRET;
const { User } = require('../models');
const { authenticateUser } = require('../middleware/auth-user');
const { verifyJWT } = require('../middleware/verify-jwt');
const { asyncHandler } = require('../middleware/async-handler');

const router = express.Router();

// ✅ GET /api/users → return the current authenticated user (uses Basic Auth)
router.get('/', authenticateUser, asyncHandler(async (req, res) => {
  const user = req.currentUser;
  const userResult = await User.findOne({
    where: { emailAddress: user.emailAddress },
    attributes: { exclude: ['password', 'createdAt', 'updatedAt'] }
  });
  res.json(userResult);
}));

// ✅ POST /api/users → create a new user (NO auth needed)
router.post('/', asyncHandler(async (req, res) => {
  try {
    const user = req.body;

    if (!user.password || user.password.length < 8) {
      return res.status(400).json({
        errors: ['Password must be at least 8 characters long.']
      });
    }

    // Hash password before saving
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
    console.error('🧱 Error creating user:', error);
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
      attributes: ['id', 'firstName', 'lastName', 'emailAddress']
    });
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
}));

// ✅ PUT /api/users → update an existing user (uses JWT)
router.put('/', verifyJWT, asyncHandler(async (req, res) => {
  try {
    const user = req.currentUser; // from JWT
    const { firstName, lastName, password, oldPassword } = req.body;

    const updatedFields = {};

    // If password is being updated
    if (password) {
      if (!oldPassword) {
        return res.status(400).json({ message: 'Old password is required to change your password.' });
      }

      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Incorrect old password.' });
      }

      if (password.length < 8) {
        return res.status(400).json({
          errors: ['Password must be at least 8 characters long']
        });
      }
      updatedFields.password = await bcrypt.hash(password, parseInt(process.env.SALT_ROUNDS || '10'));
    }

    // If profile info is being updated
    if (firstName !== undefined) {
      updatedFields.firstName = firstName;
    }
    if (lastName !== undefined) {
      updatedFields.lastName = lastName;
    }

    if (Object.keys(updatedFields).length > 0) {
      await user.update(updatedFields);
    }

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

// ✅ POST /api/users/verify-password → verify user's password (uses Basic Auth)
router.post('/verify-password', authenticateUser, asyncHandler(async (req, res) => {
  try {
    const user = req.currentUser;
    const { password } = req.body;

    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password verification result (isMatch):', isMatch);

    res.status(200).json({ isMatch });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}));

// ✅ POST /api/users/verify-2fa → verify 2fa token (NO auth needed)
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
      token
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

// 🔐 POST /api/users/login-2fa → verify 2fa token for login AND issue JWT cookie
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
      token
    });

    if (isVerified) {
      // ✅ Generate JWT token
      const jwtToken = jwt.sign(
        {
          userId: user.id,
          emailAddress: user.emailAddress,
          is2faAuthenticated: true
        },
        secret,
        { expiresIn: '1h' }
      );

      // 🍪 SET HttpOnly COOKIE (CRITICAL!)
      res.cookie('jwtToken', jwtToken, {
        httpOnly: true,        // ✅ NOT accessible from JavaScript
        secure: false,         // Set to `true` in production (HTTPS only)
        sameSite: 'strict',    // ✅ CSRF protection
        maxAge: 3600000        // 1 hour
      });

      console.log('🍪 HttpOnly cookie set with JWT token');

      const userResult = await User.findOne({
        where: { id: userId },
        attributes: { exclude: ['password', 'secretKey', 'createdAt', 'updatedAt'] }
      });

      // ✅ Return user data (token is in secure cookie, NOT response body)
      res.status(200).json({
        user: userResult,
        message: 'Login successful - JWT saved in secure HttpOnly cookie'
      });
    } else {
      res.status(401).json({ message: 'Invalid 2FA token.' });
    }
  } catch (error) {
    console.error('❌ Error in login-2fa:', error);
    res.status(500).json({ error: error.message });
  }
}));

module.exports = router;
