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

// ===== SIT-IN REQUESTS =====

// Student submits a sit-in request (pending admin approval)
router.post('/request', async (req, res) => {
  const { studentId, studentName, purpose, lab, pcNumber } = req.body;
  try {
    // Block if already has active sit-in
    const [active] = await db.query("SELECT id FROM sitins WHERE studentId = ? AND status = 'active'", [studentId]);
    if (active.length > 0) return res.json({ error: 'You already have an active sit-in session.' });

    // Block if already has pending request
    const [pending] = await db.query("SELECT id FROM sitin_requests WHERE studentId = ? AND status = 'pending'", [studentId]);
    if (pending.length > 0) return res.json({ error: 'You already have a pending sit-in request. Please wait for admin approval.' });

    // Check remaining sessions
    const [users] = await db.query('SELECT remainingSessions FROM users WHERE idNumber = ?', [studentId]);
    if (!users.length || users[0].remainingSessions <= 0) return res.json({ error: 'No remaining sessions.' });

    await db.query(
      `INSERT INTO sitin_requests (studentId, studentName, purpose, lab, pcNumber, status) VALUES (?, ?, ?, ?, ?, 'pending')`,
      [studentId, studentName, purpose, lab, pcNumber || null]
    );
    res.json({ success: true });
  } catch (err) { res.json({ error: err.message }); }
});

// Get all pending sit-in requests (admin)
router.get('/requests', async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM sitin_requests ORDER BY createdAt DESC");
    res.json(rows);
  } catch (err) { res.json({ error: err.message }); }
});

// Get pending request for a specific student
router.get('/request/student/:idNumber', async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM sitin_requests WHERE studentId = ? ORDER BY createdAt DESC LIMIT 1", [req.params.idNumber]);
    res.json(rows[0] || null);
  } catch (err) { res.json({ error: err.message }); }
});

// Admin approves a sit-in request
router.post('/request/:id/approve', async (req, res) => {
  try {
    const [reqs] = await db.query("SELECT * FROM sitin_requests WHERE id = ? AND status = 'pending'", [req.params.id]);
    if (!reqs.length) return res.json({ error: 'Request not found or already processed.' });
    const r = reqs[0];

    // Check remaining sessions
    const [users] = await db.query('SELECT remainingSessions FROM users WHERE idNumber = ?', [r.studentId]);
    if (!users.length || users[0].remainingSessions <= 0) return res.json({ error: 'Student has no remaining sessions.' });

    // Check PC not occupied
    if (r.pcNumber) {
      const [occupied] = await db.query("SELECT id FROM sitins WHERE status = 'active' AND lab = ? AND pcNumber = ?", [r.lab, r.pcNumber]);
      if (occupied.length > 0) return res.json({ error: `PC #${r.pcNumber} in ${r.lab} is already occupied.` });
    }

    const now = new Date();
    await db.query(
      `INSERT INTO sitins (studentId, studentName, purpose, lab, pcNumber, timeIn, status, date) VALUES (?, ?, ?, ?, ?, ?, 'active', ?)`,
      [r.studentId, r.studentName, r.purpose, r.lab, r.pcNumber, now, now.toLocaleDateString()]
    );
    await db.query('UPDATE users SET remainingSessions = remainingSessions - 1 WHERE idNumber = ?', [r.studentId]);
    await db.query("UPDATE sitin_requests SET status = 'approved' WHERE id = ?", [req.params.id]);

    res.json({ success: true });
  } catch (err) { res.json({ error: err.message }); }
});

// Admin rejects a sit-in request
router.post('/request/:id/reject', async (req, res) => {
  try {
    const [reqs] = await db.query("SELECT id FROM sitin_requests WHERE id = ? AND status = 'pending'", [req.params.id]);
    if (!reqs.length) return res.json({ error: 'Request not found or already processed.' });
    await db.query("UPDATE sitin_requests SET status = 'rejected' WHERE id = ?", [req.params.id]);
    res.json({ success: true });
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
