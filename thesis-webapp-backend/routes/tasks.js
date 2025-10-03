const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const Result = require('../models/TaskResult');
const Stimulus = require('../models/Stimulus');
const scoring = require('../utils/scoring');


// Submit attempt (blank)
router.post('/submit-attempt', async (req, res) => {
try {
const ev = req.body;
// Log event
await Event.create({ participantId: ev.participantId, experimentId: ev.experimentId, sessionId: ev.sessionId, eventType: 'blank_submit', locale: ev.locale, payload: ev });
res.json({ ok: true });
} catch (err) {
console.error(err);
res.status(500).json({ error: 'server error' });
}
});


// Reveal hint endpoint - server checks attempt counts and time (very simple logic here)
router.post('/reveal-hint', async (req, res) => {
try {
const { participantId, experimentId, storyId, targetWordIndex, attemptCount, firstAttemptAt, hint_rules } = req.body;
// Basic rule: allow if attemptCount >= minAttempts OR time elapsed >= timeBeforeAutoHint
const now = Date.now();
const elapsed = firstAttemptAt ? (now - new Date(firstAttemptAt).getTime())/1000 : 0;
const minAttempts = hint_rules?.min_attempts_before_hint ?? 3;
const timeBefore = hint_rules?.time_before_auto_hint_seconds ?? 120;
let allowed = false; let reason='';
if ((attemptCount || 0) >= minAttempts) allowed = true; else if (elapsed >= timeBefore) allowed = true; else reason = 'not_allowed_yet';
if (allowed) {
const hint = { hintType: 'letter', hintText: 'first letter revealed (mock)' };
await Event.create({ participantId, experimentId, eventType: 'hint_revealed', payload: { storyId, targetWordIndex, hint } });
return res.json({ allowed: true, hint });
}
return res.json({ allowed: false, reason, retryAfterAttempts: minAttempts - (attemptCount||0), retryAfterSeconds: Math.max(0, timeBefore - elapsed) });
} catch (err) {
console.error(err);
res.status(500).json({ error: 'server error' });
}
});


// Submit delayed or immediate result -- scoring done here
router.post('/submit-result', async (req, res) => {
try {
const { participantId, experimentId, itemId, phase='immediate', response, correct, attempts=1, time_on_item_seconds=0, metadata={} } = req.body;
const normalized = scoring.normalizeForScoring(response, 'en');
const corrNorm = scoring.normalizeForScoring(correct, 'en');
const lev = scoring.levenshteinDistance(normalized, corrNorm);
const normScore = scoring.normalizedScore(lev, corrNorm.length, normalized.length);
const r = await Result.create({ participantId, experimentId, itemId, phase, response_raw: response, response_normalized: normalized, levenshtein: lev, normalized_score: normScore, attempts, time_on_item_seconds, metadata });
await Event.create({ participantId, experimentId, eventType: 'result_submitted', payload: { itemId, phase, response, attempts, time_on_item_seconds, metadata } });
res.json({ ok: true, result: r });
} catch (err) {
console.error(err);
res.status(500).json({ error: 'server error' });
}
});


// Paas submission
router.post('/submit-paas', async (req, res) => {
try {
const { participantId, experimentId, phase, score } = req.body;
await Event.create({ participantId, experimentId, eventType: 'paas_submit', payload: { phase, score } });
res.json({ ok: true });
} catch (err) {
console.error(err);
res.status(500).json({ error: 'server error' });
}
});


module.exports = router;