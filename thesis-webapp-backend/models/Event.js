const mongoose = require('mongoose');


const EventSchema = new mongoose.Schema({
participantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Participant' },
experimentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Experiment' },
sessionId: String,
eventType: String,
locale: String,
payload: Object,
createdAt: { type: Date, default: Date.now }
});


module.exports = mongoose.model('Event', EventSchema);