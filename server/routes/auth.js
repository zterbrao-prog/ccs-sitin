const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db');

// LOGIN
router.post('/login', async (req, res) => {
  const { idNumber, password } = req.body;
  if (!idNumber || !password) return res.json({ error: 'ID number and password are required.' });

  try {
    const [rows] = await db.query('SELECT * FROM users WHERE idNumber = ?', [idNumber]);
    if (rows.length === 0) return res.json({ error: 'Invalid ID number or password.' });

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.json({ error: 'Invalid ID number or password.' });

    // Store in session (exclude password)
    const { password: _, ...safeUser } = user;
    req.session.user = safeUser;
    return res.json({ success: true, user: safeUser });
  } catch (err) {
    return res.json({ error: 'Server error: ' + err.message });
  }
});

// REGISTER
router.post('/register', async (req, res) => {
  const { idNumber, password, firstName, lastName, middleName, email, address } = req.body;
  if (!idNumber || !password || !firstName || !lastName || !email) {
    return res.json({ error: 'Please fill in all required fields.' });
  }
  if (password.length < 6) return res.json({ error: 'Password must be at least 6 characters.' });

  try {
    const [existing] = await db.query('SELECT id FROM users WHERE idNumber = ?', [idNumber]);
    if (existing.length > 0) return res.json({ error: 'ID Number already registered.' });

    const hashed = await bcrypt.hash(password, 10);
    await db.query(
      `INSERT INTO users (idNumber, password, firstName, lastName, middleName, email, address, role, remainingSessions)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'student', 30)`,
      [idNumber, hashed, firstName, lastName, middleName || '', email, address || '']
    );
    return res.json({ success: true });
  } catch (err) {
    return res.json({ error: 'Server error: ' + err.message });
  }
});

// LOGOUT
router.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// GET CURRENT SESSION
router.get('/me', (req, res) => {
  if (!req.session.user) return res.json({ user: null });
  return res.json({ user: req.session.user });
});

module.exports = router;
