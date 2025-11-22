'use strict';

const express = require('express');
const morgan = require('morgan');
const { sequelize } = require('./models');
const cors = require('cors');
const cookieParser = require('cookie-parser'); // ✅ ADD THIS
require('dotenv').config();

const enableGlobalErrorLogging = process.env.ENABLE_GLOBAL_ERROR_LOGGING === 'true';
const userRouter = require('./routes/users');
const courseRouter = require('./routes/courses');

const app = express();

app.use(morgan('dev'));

// ✅ CRITICAL: Enable CORS with credentials
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200,
}));

// ✅ CRITICAL: Add cookie parser BEFORE routes
app.use(cookieParser());

// set up Express to work with JSON
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the REST API project!',
  });
});

// Add routes
app.use('/api/users', userRouter);
app.use('/api/courses', courseRouter);

// send 404 if no other route matched
app.use((req, res) => {
  res.status(404).json({
    message: 'Route Not Found',
  });
});

// setup a global error handler
app.use((err, req, res, next) => {
  if (enableGlobalErrorLogging) {
    console.error(`Global error handler: ${JSON.stringify(err.stack)}`);
  }

  res.status(err.status || 500).json({
    message: err.message,
    error: {},
  });
});

// set our port
app.set('port', process.env.PORT || 5000);

// Test the database connection
(async () => {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database: ', error);
  }
})();

// start listening on our port
sequelize.sync().then(() => {
  const server = app.listen(app.get('port'), () => {
    console.log(`Express server is listening on port ${server.address().port}`);
  });
});

