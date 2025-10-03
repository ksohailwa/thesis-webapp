const mongoose = require('mongoose');


const ResultSchema = new mongoose.Schema({
participantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Participant' },
experimentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Experiment' },
itemId: String,
phase: String,
response_raw: String,
response_normalized: String,
levenshtein: Number,
normalized_score: Number,
attempts: Number,
time_on_item_seconds: Number,
metadata: { type: Object, default: {} },
createdAt: { type: Date, default: Date.now }
});


module.exports = mongoose.model('Result', ResultSchema);