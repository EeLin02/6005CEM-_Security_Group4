const express = require('express');
require('dotenv').config(); // ✅ Load environment variables
const crypto = require('crypto');
const { Op } = require('sequelize');
const { User, PasswordResetToken } = require('../models');
const nodemailer = require('nodemailer');

const router = express.Router();

// =============================
// POST /api/password/forgot
// =============================
router.post('/forgot', async (req, res) => {
  try {
    const { emailAddress } = req.body;
    console.log('📩 Forgot password request received for:', emailAddress);

    if (!emailAddress) return res.status(400).json({ error: 'Email is required' });

    // 1️⃣ Find user by email
    const user = await User.findOne({ where: { emailAddress } });
    if (!user) {
      console.log('⚠️ No user found with that email, returning 200 to avoid enumeration');
      return res.json({ message: 'If that email exists, a reset link has been generated.' });
    }

    // 2️⃣ Generate token and expiry
    const token = crypto.randomBytes(20).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await PasswordResetToken.create({ userId: user.id, token, expiresAt });
    const link = `http://localhost:3000/reset-password?token=${token}`;
    console.log('🔗 Reset link generated:', link);

    // 3️⃣ Gmail transporter setup
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    // Verify Gmail SMTP connection
    await transporter.verify()
      .then(() => console.log('✅ Gmail SMTP connected successfully'))
      .catch(err => console.error('❌ Gmail SMTP connection failed:', err));

    // 4️⃣ Define email content
    const mailOptions = {
      from: `"Support" <${process.env.GMAIL_USER}>`,
      to: emailAddress,
      subject: 'Password Reset Link',
      html: `
        <p>Hello,</p>
        <p>You requested to reset your password.</p>
        <p><a href="${link}">Click here to reset your password</a></p>
        <p>This link will expire in 15 minutes.</p>
      `,
    };

    // 5️⃣ Send email
    console.log('📧 Attempting to send mail...');
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Mail sent successfully:', info.response);

    return res.json({ message: 'If that email exists, a reset link has been generated.' });
  } catch (err) {
    console.error('❌ Error in forgot password route:', err);
    return res.status(500).json({ error: 'Failed to process reset request' });
  }
});

// =============================
// POST /api/password/reset
// =============================
router.post('/reset', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword)
      return res.status(400).json({ error: 'Token and newPassword required' });

    // ✅ Manual validation before touching Sequelize
    if (newPassword.length < 8 || newPassword.length > 100) {
      return res.status(400).json({ error: 'Password must be between 8 and 100 characters.' });
    }

    const record = await PasswordResetToken.findOne({
      where: {
        token,
        used: false,
        expiresAt: { [Op.gt]: new Date() }
      }
    });

    if (!record)
      return res.status(400).json({ error: 'Invalid or expired token' });

    const user = await User.findByPk(record.userId);
    if (!user)
      return res.status(404).json({ error: 'User not found' });

    // ✅ Hash password
    const bcrypt = require('bcryptjs');
    user.password = await bcrypt.hash(newPassword, 10);

    await user.save();

    record.used = true;
    await record.save();

    console.log(`✅ Password reset successful for user ${user.emailAddress}`);
    return res.json({ message: 'Password has been reset successfully' });

  } catch (err) {
    console.error('❌ Error in password reset route:', err);
    return res.status(500).json({ error: 'Failed to reset password' });
  }
});

module.exports = router;
