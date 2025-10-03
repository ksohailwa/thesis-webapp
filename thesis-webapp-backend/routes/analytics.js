const express = require('express');
const router = express.Router();
const TaskResult = require('../models/TaskResult');
const Participant = require('../models/Participant');
const { requireAuth, requireRole } = require('../middleware/auth');

// Get analytics for a specific experiment (teachers only)
router.get('/experiments/:experimentId', requireAuth, requireRole('teacher', 'admin'), async (req, res) => {
  try {
    const { experimentId } = req.params;
    
    // Get all results for this experiment
    const results = await TaskResult.find({ experimentId })
      .populate('participantId', 'email')
      .sort({ createdAt: -1 });

    // Calculate statistics
    const totalParticipants = await Participant.countDocuments({ 
      experiments: experimentId 
    });

    const uniqueParticipants = [...new Set(results.map(r => r.participantId?.toString()))].length;
    const completedSessions = results.length;
    
    // Calculate average score (normalized_score is between 0 and 1)
    const validScores = results.filter(r => r.normalized_score != null);
    const averageScore = validScores.length > 0 
      ? (validScores.reduce((sum, r) => sum + r.normalized_score, 0) / validScores.length) * 100
      : 0;

    // Get recent results with participant info
    const recentResults = results.slice(0, 50).map(result => ({
      id: result._id,
      participant: result.participantId?.email || 'Anonymous',
      score: Math.round((result.normalized_score || 0) * 100),
      attempts: result.attempts || 1,
      timeSpent: result.time_on_item_seconds || 0,
      completed: result.createdAt,
      itemId: result.itemId,
      response: result.response_raw
    }));

    // Calculate score distribution
    const scoreRanges = {
      excellent: validScores.filter(r => r.normalized_score >= 0.8).length,
      good: validScores.filter(r => r.normalized_score >= 0.6 && r.normalized_score < 0.8).length,
      needsImprovement: validScores.filter(r => r.normalized_score < 0.6).length
    };

    // Calculate average time on task
    const validTimes = results.filter(r => r.time_on_item_seconds != null);
    const averageTimeOnTask = validTimes.length > 0
      ? validTimes.reduce((sum, r) => sum + r.time_on_item_seconds, 0) / validTimes.length
      : 0;

    res.json({
      totalParticipants: uniqueParticipants,
      completedSessions,
      averageScore: Math.round(averageScore * 10) / 10,
      averageTimeOnTask: Math.round(averageTimeOnTask * 10) / 10,
      recentResults,
      scoreDistribution: scoreRanges,
      totalResults: results.length
    });

  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Get participant progress (students can see their own, teachers can see all)
router.get('/participants/:participantId', requireAuth, async (req, res) => {
  try {
    const { participantId } = req.params;
    const { experimentId } = req.query;

    // Check permissions - students can only see their own data
    if (req.user.role === 'student' && req.user.participantId !== participantId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const query = { participantId };
    if (experimentId) {
      query.experimentId = experimentId;
    }

    const results = await TaskResult.find(query)
      .sort({ createdAt: -1 })
      .limit(100);

    const progress = results.map(result => ({
      experimentId: result.experimentId,
      itemId: result.itemId,
      score: Math.round((result.normalized_score || 0) * 100),
      attempts: result.attempts || 1,
      timeSpent: result.time_on_item_seconds || 0,
      completed: result.createdAt,
      response: result.response_raw
    }));

    res.json({
      participantId,
      totalAttempts: results.length,
      averageScore: results.length > 0 
        ? Math.round((results.reduce((sum, r) => sum + (r.normalized_score || 0), 0) / results.length) * 100)
        : 0,
      progress
    });

  } catch (error) {
    console.error('Participant analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch participant analytics' });
  }
});

// Export experiment data as CSV
router.get('/experiments/:experimentId/export', requireAuth, requireRole('teacher', 'admin'), async (req, res) => {
  try {
    const { experimentId } = req.params;
    const { format } = req.query;

    const results = await TaskResult.find({ experimentId })
      .populate('participantId', 'email')
      .sort({ createdAt: -1 });

    if (format === 'csv') {
      const csvData = results.map(result => ({
        'Participant Email': result.participantId?.email || 'Anonymous',
        'Item ID': result.itemId,
        'Response': result.response_raw,
        'Normalized Response': result.response_normalized,
        'Score': result.normalized_score ? Math.round(result.normalized_score * 100) : 0,
        'Attempts': result.attempts || 1,
        'Time (seconds)': result.time_on_item_seconds || 0,
        'Phase': result.phase,
        'Completed At': result.createdAt
      }));

      res.json(csvData);
    } else {
      res.json(results);
    }

  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

module.exports = router;
