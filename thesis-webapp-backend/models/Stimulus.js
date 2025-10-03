const mongoose = require('mongoose');


const StimulusSchema = new mongoose.Schema({
experimentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Experiment' },
storyId: String,
title: Object, // { en: '', de: '' }
paragraphs: Array,
target_words: Array,
translation_source: Object,
validation: Object,
createdAt: { type: Date, default: Date.now }
});


module.exports = mongoose.model('Stimulus', StimulusSchema);