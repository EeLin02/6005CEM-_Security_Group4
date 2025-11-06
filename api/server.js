'use strict';
require('dotenv').config();
console.log('📦 Loaded Gmail user:', process.env.GMAIL_USER);

const express = require('express');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
// const csurf = require('csurf'); // optional if you use cookies for auth
const db = require('./models'); // Sequelize setup

const app = express();

// ==========================
// 🔒 SECURITY MIDDLEWARES
// ==========================

// Helmet for secure HTTP headers (includes X-Frame-Options, X-Content-Type-Options, etc.)
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["'self'"],
        "script-src": ["'self'"],
        "style-src": ["'self'", "https:", "'unsafe-inline'"],
        "img-src": ["'self'", "data:", "https:"],
        "connect-src": ["'self'", "http://localhost:5000"],
      },
    },
    referrerPolicy: { policy: "no-referrer" },
  })
);

// Parse JSON & cookies
app.use(express.json());
app.use(cookieParser());

// Strict CORS setup
app.use(
  cors({
    origin: ['http://localhost:3000'], // add production URL later
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
    optionsSuccessStatus: 204,
  })
);

// Rate limiting (anti-brute force)
const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 20, // limit each IP to 20 requests per 10 mins for auth routes
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts. Please try again later.' },
});
app.use('/api/users/login', authLimiter);
app.use('/api/password', authLimiter);

const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 200, // 200 requests per minute for general API
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', generalLimiter);

// ==========================
// 🧩 ROUTES
// ==========================

// password reset & auth
app.use('/api/password', require('./routes/password'));

// user & course endpoints
app.use('/api/users', require('./routes/users'));
app.use('/api/courses', require('./routes/courses'));

// health check
app.get('/', (req, res) => res.json({ message: 'API running successfully' }));

// ==========================
// ⚠️ GLOBAL ERROR HANDLING
// ==========================
app.use((err, req, res, next) => {
  console.error('❌ Global error:', err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
  });
});

// ==========================
// 🚀 SERVER INIT
// ==========================
const PORT = process.env.PORT || 5000;

db.sequelize
  .sync()
  .then(() => {
    app.listen(PORT, () =>
      console.log(`✅ Server listening securely on port ${PORT}`)
    );
  })
  .catch((err) => {
    console.error('❌ Database connection failed:', err);
  });