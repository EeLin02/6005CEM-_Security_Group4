const auth = require('basic-auth');
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const speakeasy = require('speakeasy');
const jwt = require('jsonwebtoken');

const secret = process.env.JWT_SECRET;

/**
 * Middleware to authenticate user credentials and apply progressive lockout.
 */
async function authenticateUser(req, res, next) {
  let message;
  const credentials = auth(req);

  if (credentials) {
    const user = await User.findOne({ where: { emailAddress: credentials.name } });

    if (user) {
      // Check if account is locked
      if (user.lockUntil && user.lockUntil > new Date()) {
        const remainingMs = user.lockUntil - new Date();
        const remainingMinutes = Math.ceil(remainingMs / 60000);
        const unlockTime = user.lockUntil.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        return res.status(403).json({
          message: `Your account is temporarily locked.`,
          details: `It will unlock automatically at ${unlockTime} (${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''} remaining).`,
          unlockTime: user.lockUntil,
          remainingMinutes
        });
      }

      // Validate password
      const authenticated = bcrypt.compareSync(credentials.pass, user.password);

      if (authenticated) {
        console.log(`✅ Authentication successful for ${credentials.name}`);

        // Reset lock status after successful login
        user.loginAttempts = 0;
        user.lockUntil = null;
        await user.save();

        // 2FA check: if user has secretKey, verify token
        if (user.secretKey) {
          const token = req.headers['x-2fa-token'] || req.body.token;

          if (!token) {
            // No token provided, prompt for 2FA token
            return res.status(402).json({ message: '2FA required.', userId: user.id });
          }

          // Verify 2FA token
          const verified = speakeasy.totp.verify({
            secret: user.secretKey,
            encoding: 'base32',
            token: token,
            window: 1 // allow token window (adjust as needed)
          });

          if (!verified) {
            // Invalid 2FA token
            return res.status(401).json({ message: 'Invalid 2FA token.' });
          }
        }

        // ✅ 2FA passed or not enabled - authentication complete
        req.currentUser = user;
        return next();
      } else {
        // Failed login attempt - increment loginAttempts and possibly lock account
        user.loginAttempts += 1;

        // Progressive lockout duration calculation
        const attempt = user.loginAttempts;
        let lockDurationMinutes = 0;

        if (attempt >= 5 && attempt < 8) lockDurationMinutes = 5;
        else if (attempt >= 8 && attempt < 10) lockDurationMinutes = 10;
        else if (attempt >= 10 && attempt < 12) lockDurationMinutes = 30;
        else if (attempt >= 12 && attempt < 15) lockDurationMinutes = 60;
        else if (attempt >= 15) lockDurationMinutes = 180;

        if (lockDurationMinutes > 0) {
          user.lockUntil = new Date(Date.now() + lockDurationMinutes * 60 * 1000);
          console.warn(`🔒 Account locked for ${user.emailAddress} (${lockDurationMinutes} mins) after ${attempt} failed attempts.`);
        }

        await user.save();

        message = `Authentication failed for user ${credentials.name}`;
        console.warn(`❌ ${message}`);
        return res.status(401).json({ message });
      }
    } else {
      message = `User not found for ${credentials.name}`;
      console.warn(`❌ ${message}`);
      return res.status(401).json({ message });
    }
  } else {
    message = 'Auth header not found.';
    console.warn(`⚠️ ${message}`);
    return res.status(401).json({ message });
  }
}

module.exports = { authenticateUser };
