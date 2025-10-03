const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Event = require('../models/Event');
const Result = require('../models/TaskResult');
const Participant = require('../models/Participant');

// Generate a secure delayed recall session link
router.post('/generate-link', async (req, res) => {
  try {
    const { participantId, experimentId, delayHours = 48 } = req.body;
    
    if (!participantId || !experimentId) {
      return res.status(400).json({ error: 'participantId and experimentId are required' });
    }

    // Generate a secure session token
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const scheduledTime = new Date(Date.now() + (delayHours * 60 * 60 * 1000));
    
    // Store the scheduled session in database
    const sessionRecord = await Result.create({
      participantId,
      experimentId,
      itemId: 'delayed-recall-session-scheduled',
      phase: 'delayed_recall_scheduled',
      response_raw: sessionToken,
      response_normalized: 'scheduled',
      levenshtein: 0,
      normalized_score: 0,
      attempts: 1,
      time_on_item_seconds: 0,
      metadata: {
        sessionToken,
        scheduledTime,
        delayHours,
        linkGenerated: new Date(),
        status: 'pending'
      }
    });

    // Log the link generation event
    await Event.create({
      participantId,
      experimentId,
      eventType: 'delayed_recall_link_generated',
      payload: {
        sessionToken: sessionToken.substring(0, 8) + '...', // Only log first 8 chars for security
        delayHours,
        scheduledTime,
        recordId: sessionRecord._id
      }
    });

    // Generate the complete URL
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const delayedRecallUrl = `${baseUrl}/delayed-recall?participantId=${participantId}&experimentId=${experimentId}&token=${sessionToken}`;
    
    res.json({
      success: true,
      delayedRecallUrl,
      scheduledTime,
      delayHours,
      sessionToken: sessionToken.substring(0, 8) + '...',
      recordId: sessionRecord._id,
      instructions: {
        sendToParticipant: `Please complete your follow-up memory test at: ${delayedRecallUrl}`,
        schedulingNote: `Send this link in ${delayHours} hours (at ${scheduledTime.toISOString()})`
      }
    });

  } catch (error) {
    console.error('Error generating delayed recall link:', error);
    res.status(500).json({ error: 'Failed to generate delayed recall link' });
  }
});

// Validate a delayed recall session token
router.post('/validate-session', async (req, res) => {
  try {
    const { participantId, experimentId, sessionToken } = req.body;
    
    if (!participantId || !experimentId || !sessionToken) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Find the scheduled session
    const sessionRecord = await Result.findOne({
      participantId,
      experimentId,
      itemId: 'delayed-recall-session-scheduled',
      response_raw: sessionToken,
      'metadata.status': 'pending'
    });

    if (!sessionRecord) {
      return res.status(404).json({ 
        error: 'Invalid or expired session token',
        valid: false 
      });
    }

    const scheduledTime = new Date(sessionRecord.metadata.scheduledTime);
    const now = new Date();
    const hoursEarly = (scheduledTime - now) / (1000 * 60 * 60);
    
    // Allow access if within reasonable window (e.g., 6 hours early to 24 hours late)
    const allowEarlyHours = 6;
    const allowLateHours = 24;
    
    if (hoursEarly > allowEarlyHours) {
      return res.status(403).json({
        error: `Session not yet available. Please return in ${Math.ceil(hoursEarly - allowEarlyHours)} hours.`,
        valid: false,
        scheduledTime: scheduledTime,
        canAccessAt: new Date(now.getTime() + ((hoursEarly - allowEarlyHours) * 60 * 60 * 1000))
      });
    }

    if (hoursEarly < -allowLateHours) {
      return res.status(410).json({
        error: 'Session has expired. Please contact the researcher.',
        valid: false,
        expired: true
      });
    }

    // Mark session as started
    await Result.updateOne(
      { _id: sessionRecord._id },
      { 
        $set: { 
          'metadata.status': 'started',
          'metadata.accessedAt': now 
        } 
      }
    );

    // Log session access
    await Event.create({
      participantId,
      experimentId,
      eventType: 'delayed_recall_session_accessed',
      payload: {
        sessionToken: sessionToken.substring(0, 8) + '...',
        scheduledTime,
        actualAccessTime: now,
        hoursDelay: -hoursEarly
      }
    });

    res.json({
      valid: true,
      sessionInfo: {
        scheduledTime,
        actualAccessTime: now,
        delayHours: Math.abs(hoursEarly),
        status: 'active'
      }
    });

  } catch (error) {
    console.error('Error validating delayed recall session:', error);
    res.status(500).json({ error: 'Failed to validate session' });
  }
});

// Get delayed recall sessions for a participant
router.get('/sessions/:participantId', async (req, res) => {
  try {
    const { participantId } = req.params;
    const { experimentId } = req.query;

    const query = {
      participantId,
      itemId: 'delayed-recall-session-scheduled'
    };
    
    if (experimentId) {
      query.experimentId = experimentId;
    }

    const sessions = await Result.find(query).sort({ createdAt: -1 });
    
    const sessionInfo = sessions.map(session => ({
      id: session._id,
      experimentId: session.experimentId,
      scheduledTime: session.metadata.scheduledTime,
      status: session.metadata.status,
      createdAt: session.createdAt,
      delayHours: session.metadata.delayHours,
      sessionToken: session.response_raw.substring(0, 8) + '...'
    }));

    res.json({
      participantId,
      sessions: sessionInfo,
      totalSessions: sessionInfo.length
    });

  } catch (error) {
    console.error('Error fetching delayed recall sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Mark a delayed recall session as completed
router.post('/complete-session', async (req, res) => {
  try {
    const { participantId, experimentId, sessionToken, completionData } = req.body;
    
    if (!participantId || !experimentId || !sessionToken) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Find and update the session record
    const updateResult = await Result.updateOne(
      { 
        participantId,
        experimentId,
        itemId: 'delayed-recall-session-scheduled',
        response_raw: sessionToken 
      },
      { 
        $set: { 
          'metadata.status': 'completed',
          'metadata.completedAt': new Date(),
          'metadata.completionData': completionData || {}
        } 
      }
    );

    if (updateResult.matchedCount === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Log session completion
    await Event.create({
      participantId,
      experimentId,
      eventType: 'delayed_recall_session_completed',
      payload: {
        sessionToken: sessionToken.substring(0, 8) + '...',
        completedAt: new Date(),
        completionData: completionData || {}
      }
    });

    res.json({
      success: true,
      message: 'Session marked as completed',
      completedAt: new Date()
    });

  } catch (error) {
    console.error('Error completing delayed recall session:', error);
    res.status(500).json({ error: 'Failed to complete session' });
  }
});

// Generate bulk delayed recall links for multiple participants
router.post('/generate-bulk-links', async (req, res) => {
  try {
    const { participantIds, experimentId, delayHours = 48 } = req.body;
    
    if (!Array.isArray(participantIds) || participantIds.length === 0 || !experimentId) {
      return res.status(400).json({ error: 'participantIds array and experimentId are required' });
    }

    const links = [];
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    for (const participantId of participantIds) {
      try {
        const sessionToken = crypto.randomBytes(32).toString('hex');
        const scheduledTime = new Date(Date.now() + (delayHours * 60 * 60 * 1000));
        
        // Store the scheduled session
        const sessionRecord = await Result.create({
          participantId,
          experimentId,
          itemId: 'delayed-recall-session-scheduled',
          phase: 'delayed_recall_scheduled',
          response_raw: sessionToken,
          response_normalized: 'scheduled',
          levenshtein: 0,
          normalized_score: 0,
          attempts: 1,
          time_on_item_seconds: 0,
          metadata: {
            sessionToken,
            scheduledTime,
            delayHours,
            linkGenerated: new Date(),
            status: 'pending',
            bulkGenerated: true
          }
        });

        const delayedRecallUrl = `${baseUrl}/delayed-recall?participantId=${participantId}&experimentId=${experimentId}&token=${sessionToken}`;
        
        links.push({
          participantId,
          delayedRecallUrl,
          scheduledTime,
          sessionToken: sessionToken.substring(0, 8) + '...',
          recordId: sessionRecord._id
        });

        // Log bulk generation
        await Event.create({
          participantId,
          experimentId,
          eventType: 'delayed_recall_bulk_generated',
          payload: {
            sessionToken: sessionToken.substring(0, 8) + '...',
            delayHours,
            scheduledTime,
            recordId: sessionRecord._id
          }
        });

      } catch (error) {
        console.error(`Error generating link for participant ${participantId}:`, error);
        links.push({
          participantId,
          error: 'Failed to generate link',
          errorMessage: error.message
        });
      }
    }

    res.json({
      success: true,
      totalRequested: participantIds.length,
      totalGenerated: links.filter(link => !link.error).length,
      delayHours,
      links,
      scheduledTime: new Date(Date.now() + (delayHours * 60 * 60 * 1000)),
      instructions: `Send these links to participants in ${delayHours} hours`
    });

  } catch (error) {
    console.error('Error generating bulk delayed recall links:', error);
    res.status(500).json({ error: 'Failed to generate bulk links' });
  }
});

module.exports = router;
