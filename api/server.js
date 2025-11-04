'use strict';
require('dotenv').config();
console.log('📦 Loaded Gmail user:', process.env.GMAIL_USER);


const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const db = require('./models'); // ✅ this imports the Sequelize setup you showed

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));

// mount password routes
app.use('/api/password', require('./routes/password'));

// existing routes (if available)
app.use('/api/users', require('./routes/users'));
app.use('/api/courses', require('./routes/courses'));

// health check
app.get('/', (req, res) => res.json({ message: 'API running successfully' }));

const PORT = process.env.PORT || 5000;

// start server
db.sequelize.sync().then(() => {
  app.listen(PORT, () => console.log(`✅ Server listening on port ${PORT}`));
});
