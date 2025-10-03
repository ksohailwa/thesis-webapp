const mongoose = require('mongoose');


const ExperimentSchema = new mongoose.Schema({
title: String,
createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
languages: [String],
design: { type: Object, default: {} },
hint_rules: { type: Object, default: {} },
delayed_window_hours: { type: Object, default: { min:48, max:72 } },
status: { type: String, default: 'draft' },
createdAt: { type: Date, default: Date.now }
});


module.exports = mongoose.model('Experiment', ExperimentSchema);