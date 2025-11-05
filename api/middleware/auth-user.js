const auth = require('basic-auth');
const bcrypt = require('bcrypt');
const { User } = require('../models');

/**
 * Middleware to authenticate user credentials and apply progressive lockout.
 */
exports.authenticateUser = async (req, res, next) => {
  let message;
  const credentials = auth(req);

  if (credentials) {
    const user = await User.findOne({ where: { emailAddress: credentials.name } });

    if (user) {
      //  Check if account is locked
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
        console.log(`Authentication successful for ${credentials.name}`);

        // Reset lock status
        user.loginAttempts = 0;
        user.lockUntil = null;
        await user.save();

        req.currentUser = user;
        return next();
      } else {
        //  Failed login attempt
        user.loginAttempts += 1;

        // Determine lockout duration based on failed attempts
        const attempt = user.loginAttempts;
        let lockDurationMinutes = 0;

        // Progressive lockout schedule (exponential)
        if (attempt >= 5 && attempt < 8) lockDurationMinutes = 5;      // 5 min
        else if (attempt >= 8 && attempt < 10) lockDurationMinutes = 10; // 10 min
        else if (attempt >= 10 && attempt < 12) lockDurationMinutes = 30; // 30 min
        else if (attempt >= 12 && attempt < 15) lockDurationMinutes = 60; // 1 hour
        else if (attempt >= 15) lockDurationMinutes = 180;               // 3 hours (max cap)

        if (lockDurationMinutes > 0) {
          user.lockUntil = new Date(Date.now() + lockDurationMinutes * 60 * 1000);
          console.warn(`Account locked for ${user.emailAddress} (${lockDurationMinutes} mins) after ${attempt} failed attempts.`);
        }

        await user.save();
        message = `Authentication failed for user ${credentials.name}`;
      }
    } else {
      message = `User ${credentials.name} not found.`;
    }
  } else {
    message = 'Auth header not found.';
  }

  if (message) {
    console.warn(message);
    res.status(401).json({ message });
  }
};
