const express = require('express');
const router = express.Router();
const db = require('../db');

// ===== ANNOUNCEMENTS =====
router.get('/announcements', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM announcements ORDER BY createdAt DESC');
    res.json(rows);
  } catch (err) { res.json({ error: err.message }); }
});

router.post('/announcements', async (req, res) => {
  const { title, message } = req.body;
  const now = new Date();
  try {
    await db.query('INSERT INTO announcements (title, message, date, time) VALUES (?, ?, ?, ?)',
      [title, message, now.toLocaleDateString(), now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })]);
    res.json({ success: true });
  } catch (err) { res.json({ error: err.message }); }
});

router.delete('/announcements/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM announcements WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.json({ error: err.message }); }
});

// ===== FEEDBACK =====
router.get('/feedback', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM feedback ORDER BY createdAt DESC');
    res.json(rows);
  } catch (err) { res.json({ error: err.message }); }
});

router.get('/feedback/:idNumber', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM feedback WHERE studentId = ? ORDER BY createdAt DESC', [req.params.idNumber]);
    res.json(rows);
  } catch (err) { res.json({ error: err.message }); }
});

router.post('/feedback', async (req, res) => {
  const { studentId, studentName, message } = req.body;
  const now = new Date();
  try {
    await db.query('INSERT INTO feedback (studentId, studentName, message, date, time) VALUES (?, ?, ?, ?, ?)',
      [studentId, studentName, message, now.toLocaleDateString(), now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })]);
    res.json({ success: true });
  } catch (err) { res.json({ error: err.message }); }
});

// ===== REWARDS =====
router.get('/rewards', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM rewards ORDER BY createdAt DESC');
    res.json(rows);
  } catch (err) { res.json({ error: err.message }); }
});

router.get('/rewards/:idNumber', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM rewards WHERE studentId = ? ORDER BY createdAt DESC', [req.params.idNumber]);
    res.json(rows);
  } catch (err) { res.json({ error: err.message }); }
});

router.post('/rewards', async (req, res) => {
  const { studentId, points, reason } = req.body;
  const now = new Date();
  try {
    await db.query('INSERT INTO rewards (studentId, points, reason, date, time) VALUES (?, ?, ?, ?, ?)',
      [studentId, parseInt(points), reason, now.toLocaleDateString(), now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })]);
    res.json({ success: true });
  } catch (err) { res.json({ error: err.message }); }
});

// ===== LEADERBOARD =====
router.get('/leaderboard', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT s.studentId as idNumber, s.studentName as name,
             COUNT(*) as totalSessions,
             COALESCE(SUM(r.points), 0) as totalPoints
      FROM sitins s
      LEFT JOIN rewards r ON r.studentId = s.studentId
      WHERE s.status = 'done'
      GROUP BY s.studentId, s.studentName
      ORDER BY totalSessions DESC, totalPoints DESC
      LIMIT 10
    `);
    res.json(rows);
  } catch (err) { res.json({ error: err.message }); }
});

// ===== ANALYTICS =====
router.get('/analytics', async (req, res) => {
  try {
    const [total] = await db.query('SELECT COUNT(*) as count FROM sitins');
    const [active] = await db.query("SELECT COUNT(*) as count FROM sitins WHERE status = 'active'");
    const [roomUsage] = await db.query('SELECT lab, COUNT(*) as count FROM sitins GROUP BY lab ORDER BY count DESC');
    const [topStudents] = await db.query('SELECT studentId as id, studentName as name, COUNT(*) as sessions FROM sitins GROUP BY studentId, studentName ORDER BY sessions DESC LIMIT 10');
    res.json({
      totalSessions: total[0].count,
      activeSessions: active[0].count,
      roomUsage: roomUsage.map(r => [r.lab, r.count]),
      topStudents
    });
  } catch (err) { res.json({ error: err.message }); }
});

// ===== PC RESERVATIONS =====
router.get('/reservations', async (req, res) => {
  try {
    const now = Date.now();
    const [rows] = await db.query('SELECT * FROM pc_reservations WHERE expiresAt > ?', [now]);
    res.json(rows);
  } catch (err) { res.json({ error: err.message }); }
});

router.post('/reservations', async (req, res) => {
  const { lab, pcNumber, studentId, minutes = 15 } = req.body;
  const now = Date.now();
  const expiresAt = now + minutes * 60 * 1000;
  try {
    const [existing] = await db.query('SELECT id FROM pc_reservations WHERE lab = ? AND pcNumber = ? AND expiresAt > ?', [lab, pcNumber, now]);
    if (existing.length > 0) return res.json({ error: `PC #${pcNumber} is already reserved.` });
    await db.query('INSERT INTO pc_reservations (lab, pcNumber, studentId, reservedAt, expiresAt) VALUES (?, ?, ?, ?, ?)',
      [lab, pcNumber, studentId, now, expiresAt]);
    res.json({ success: true });
  } catch (err) { res.json({ error: err.message }); }
});

router.delete('/reservations/:lab/:pcNumber/:studentId', async (req, res) => {
  const { lab, pcNumber, studentId } = req.params;
  try {
    await db.query('DELETE FROM pc_reservations WHERE lab = ? AND pcNumber = ? AND studentId = ?', [lab, pcNumber, studentId]);
    res.json({ success: true });
  } catch (err) { res.json({ error: err.message }); }
});

module.exports = router;
