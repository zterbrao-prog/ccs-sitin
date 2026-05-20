const express = require('express');
const router = express.Router();
const db = require('../db');

// GET ALL SIT-INS
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM sitins ORDER BY createdAt DESC');
    res.json(rows);
  } catch (err) { res.json({ error: err.message }); }
});

// GET ACTIVE SIT-INS
router.get('/active', async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM sitins WHERE status = 'active'");
    res.json(rows);
  } catch (err) { res.json({ error: err.message }); }
});

// GET SIT-INS BY STUDENT
router.get('/student/:idNumber', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM sitins WHERE studentId = ? ORDER BY createdAt DESC', [req.params.idNumber]);
    res.json(rows);
  } catch (err) { res.json({ error: err.message }); }
});

// START SIT-IN
router.post('/start', async (req, res) => {
  const { studentId, studentName, purpose, lab, pcNumber } = req.body;
  try {
    // Check if already active
    const [active] = await db.query("SELECT id FROM sitins WHERE studentId = ? AND status = 'active'", [studentId]);
    if (active.length > 0) return res.json({ error: 'Student already has an active sit-in session.' });

    // Check remaining sessions
    const [users] = await db.query('SELECT remainingSessions FROM users WHERE idNumber = ?', [studentId]);
    if (!users.length || users[0].remainingSessions <= 0) return res.json({ error: 'No remaining sessions.' });

    // Check if PC is occupied
    if (pcNumber) {
      const [occupied] = await db.query("SELECT id FROM sitins WHERE status = 'active' AND lab = ? AND pcNumber = ?", [lab, pcNumber]);
      if (occupied.length > 0) return res.json({ error: `PC #${pcNumber} in ${lab} is already occupied.` });

      const now = Date.now();
      const [reserved] = await db.query('SELECT id FROM pc_reservations WHERE lab = ? AND pcNumber = ? AND expiresAt > ?', [lab, pcNumber, now]);
      if (reserved.length > 0) return res.json({ error: `PC #${pcNumber} in ${lab} is reserved.` });
    }

    const now = new Date();
    await db.query(
      `INSERT INTO sitins (studentId, studentName, purpose, lab, pcNumber, timeIn, status, date)
       VALUES (?, ?, ?, ?, ?, ?, 'active', ?)`,
      [studentId, studentName, purpose, lab, pcNumber || null, now, now.toLocaleDateString()]
    );

    // Deduct session
    await db.query('UPDATE users SET remainingSessions = remainingSessions - 1 WHERE idNumber = ?', [studentId]);

    // Update session data
    if (req.session.user && req.session.user.idNumber === studentId) {
      req.session.user.remainingSessions = users[0].remainingSessions - 1;
    }

    res.json({ success: true });
  } catch (err) { res.json({ error: err.message }); }
});

// END SIT-IN
router.post('/end/:id', async (req, res) => {
  try {
    await db.query("UPDATE sitins SET status = 'done', timeOut = ? WHERE id = ?", [new Date(), req.params.id]);
    res.json({ success: true });
  } catch (err) { res.json({ error: err.message }); }
});

module.exports = router;
