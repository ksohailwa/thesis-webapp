const mongoose = require('mongoose');


const ParticipantSchema = new mongoose.Schema({
userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
participant_code: { type: String, required: true, unique: true },
role: { type: String, default: 'student' },
locale: { type: String, default: 'en' },
timezone: String,
consent: { given: Boolean, timestamp: Date, lang: String },
demographics: { type: Object },
createdAt: { type: Date, default: Date.now }
});


module.exports = mongoose.model('Participant', ParticipantSchema);