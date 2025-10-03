const express = require('express');
const router = express.Router();
const Experiment = require('../models/Experiment');
const Stimulus = require('../models/Stimulus');
const llmMock = require('../utils/llm_mock');
const { requireAuth, requireRole } = require('../middleware/auth')


// List experiments (public for students to see available experiments)
router.get('/', async (req, res) => {
try {
const list = await Experiment.find({}).sort({ createdAt: -1 })
res.json(list)
} catch (err) { console.error(err); res.status(500).json({ error: 'server error' }) }
})


// Get single experiment (teacher/admin only)
router.get('/:id', requireAuth, requireRole('teacher','admin'), async (req, res) => {
try {
const exp = await Experiment.findById(req.params.id)
if (!exp) return res.status(404).json({ error: 'not found' })
res.json(exp)
} catch (err) { console.error(err); res.status(500).json({ error: 'server error' }) }
})
// Create experiment (teacher/admin only)
router.post('/', requireAuth, requireRole('teacher','admin'), async (req, res) => {
try {
const data = req.body
data.createdBy = req.user.userId
const exp = await Experiment.create(data)
res.status(201).json(exp)
} catch (err) { console.error(err); res.status(500).json({ error: 'server error' }) }
})


// Upload targets + generate stories (teacher/admin only)
router.post('/:id/upload-targets', requireAuth, requireRole('teacher','admin'), async (req, res) => {
try {
const { id } = req.params
const { targets = [], languages=['en'] } = req.body
if (!Array.isArray(targets) || targets.length === 0) return res.status(400).json({ error: 'targets required' })
for (const lang of languages) {
const story = llmMock.generateStory({ language: lang, targetWords: targets });
await Stimulus.create({
experimentId: id,
storyId: story.storyId,
title: { [lang]: story.title },
paragraphs: story.paragraphs,
target_words: story.target_words,
translation_source: { [lang]: 'llm_mock' },
validation: { [lang]: { approved: true } }
})
}
res.json({ ok: true, message: 'targets stored and stories generated (mock)' })
} catch (err) { console.error(err); res.status(500).json({ error: 'server error' }) }
})


// Public: list stimuli (students can fetch)
router.get('/:id/stimuli', async (req, res) => {
try {
const { id } = req.params;
const s = await Stimulus.find({ experimentId: id }).sort({ createdAt: -1 })
res.json(s)
} catch (err) { console.error(err); res.status(500).json({ error: 'server error' }) }
})


module.exports = router