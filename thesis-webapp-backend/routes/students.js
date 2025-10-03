const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const TaskResult = require('../models/TaskResult'); // your results model

// Get a student's results
router.get('/me/results', requireAuth, requireRole('student'), async (req, res) => {
  try {
    const results = await TaskResult.find({ participantId: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

module.exports = router;
