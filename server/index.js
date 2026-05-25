const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: true, credentials: true }));
app.use(session({
  secret: 'ccs-sitin-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 8 }
}));

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api/auth',   require('./routes/auth'));
app.use('/api/sitins', require('./routes/sitins'));
app.use('/api/users',  require('./routes/users'));
app.use('/api',        require('./routes/misc'));

// Test DB connection on startup
db.query('SELECT 1').then(() => {
  console.log('✅ MySQL connected successfully.');
}).catch(err => {
  console.error('❌ MySQL connection FAILED:', err.message);
  console.error('   Check your password in server/db.js');
});

app.listen(PORT, () => {
  console.log(`\n✅ CCS Sit-In System running at: http://localhost:${PORT}`);
  console.log(`   Admin login: ID = admin | Password = admin123\n`);
});
