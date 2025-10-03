const express = require('express');
const router = express.Router();
const Participant = require('../models/Participant');
const { v4: uuidv4 } = require('uuid');


// Register participant
router.post('/register', async (req, res) => {
try {
const { consent, locale='en', timezone, demographics, email } = req.body;
const code = 'P-' + uuidv4().slice(0,8);
const p = await Participant.create({ participant_code: code, consent, locale, timezone, demographics });
res.status(201).json({ participantId: p._id, participant_code: p.participant_code });
} catch (err) {
console.error(err);
res.status(500).json({ error: 'server error' });
}
});


module.exports = router;