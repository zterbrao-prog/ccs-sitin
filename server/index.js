require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const sessionStore = new MySQLStore({
  host:     process.env.MYSQLHOST     || 'localhost',
  user:     process.env.MYSQLUSER     || 'root',
  password: process.env.MYSQLPASSWORD || '112002',
  database: process.env.MYSQLDATABASE || 'ccs_sitin',
  port:     process.env.MYSQLPORT     || 3306,
  clearExpired: true,
  checkExpirationInterval: 900000,
  expiration: 28800000
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: true, credentials: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'ccs-sitin-secret-key',
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: { maxAge: 1000 * 60 * 60 * 8 }
}));

app.use(express.static(path.join(__dirname, '../public')));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/sitins', require('./routes/sitins'));
app.use('/api/users', require('./routes/users'));
app.use('/api', require('./routes/misc'));

app.get('*', (req, res) => {
  if (req.path.includes('.')) return res.status(404).send('Not found');
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
  console.log(`\n✅ CCS Sit-In System running at: http://localhost:${PORT}\n`);
});
