const express = require('express');
const router = express.Router();
const db = require('../db');

// GET ALL USERS
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, idNumber, firstName, lastName, middleName, email, address, role, course, courseLevel, remainingSessions FROM users');
    res.json(rows);
  } catch (err) { res.json({ error: err.message }); }
});

// GET ONE USER
router.get('/:idNumber', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, idNumber, firstName, lastName, middleName, email, address, role, course, courseLevel, remainingSessions FROM users WHERE idNumber = ?', [req.params.idNumber]);
    if (!rows.length) return res.json({ error: 'User not found.' });
    res.json(rows[0]);
  } catch (err) { res.json({ error: err.message }); }
});

// UPDATE USER
router.put('/:idNumber', async (req, res) => {
  const { firstName, lastName, middleName, email, address, course, courseLevel, remainingSessions } = req.body;
  try {
    await db.query(
      `UPDATE users SET firstName=?, lastName=?, middleName=?, email=?, address=?, course=?, courseLevel=?, remainingSessions=? WHERE idNumber=?`,
      [firstName, lastName, middleName, email, address, course, courseLevel, remainingSessions, req.params.idNumber]
    );
    if (req.session.user && req.session.user.idNumber === req.params.idNumber) {
      req.session.user = { ...req.session.user, firstName, lastName, middleName, email, address, course, courseLevel, remainingSessions };
    }
    res.json({ success: true });
  } catch (err) { res.json({ error: err.message }); }
});

// RESET SESSIONS
router.post('/:idNumber/reset-sessions', async (req, res) => {
  const count = req.body.count || 30;
  try {
    await db.query('UPDATE users SET remainingSessions = ? WHERE idNumber = ?', [count, req.params.idNumber]);
    res.json({ success: true });
  } catch (err) { res.json({ error: err.message }); }
});

module.exports = router;
