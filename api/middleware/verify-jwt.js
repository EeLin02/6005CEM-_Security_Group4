const jwt = require('jsonwebtoken');
const { User } = require('../models');

const secret = process.env.JWT_SECRET;

// ✅ Middleware to verify JWT token from HttpOnly cookie
async function verifyJWT(req, res, next) {
  try {
    // ✅ Read JWT from HttpOnly cookie (NOT from Authorization header)
    const token = req.cookies.jwtToken;

    console.log('🔍 Cookies received:', req.cookies); // Debug log
    console.log('🔐 JWT Token:', token ? '✅ Found' : '❌ Not found'); // Debug log

    if (!token) {
      console.log('❌ No token in cookies');
      return res.status(401).json({ message: 'No token provided - please login' });
    }

    // Verify the token
    jwt.verify(token, secret, async (err, decoded) => {
      if (err) {
        console.error('❌ Token verification failed:', err.message);
        return res.status(403).json({ message: 'Invalid or expired token' });
      }

      console.log('✅ Token verified for user:', decoded.userId);

      // Fetch user from database
      try {
        const user = await User.findByPk(decoded.userId);

        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }

        // Attach user to request
        req.currentUser = user;
        next();
      } catch (error) {
        console.error('❌ Database error:', error.message);
        return res.status(500).json({ message: 'Server error' });
      }
    });
  } catch (error) {
    console.error('❌ Token verification error:', error.message);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

module.exports = { verifyJWT };
