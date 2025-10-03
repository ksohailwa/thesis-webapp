require('dotenv').config();
const mongoose = require('mongoose');
const Experiment = require('../models/Experiment');
const Stimulus = require('../models/Stimulus');

async function seed() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to MongoDB');

    // Create default experiment with specific ID
    const defaultExperimentId = '507f1f77bcf86cd799439011';
    
    // Check if experiment already exists
    const existingExperiment = await Experiment.findById(defaultExperimentId);
    
    if (!existingExperiment) {
      const experiment = new Experiment({
        _id: defaultExperimentId,
        title: 'Default Gap Fill Experiment',
        createdBy: '507f1f77bcf86cd799439012', // dummy user ID
        languages: ['en'],
        design: { type: 'gap_fill' },
        hint_rules: { min_attempts_before_hint: 3 },
        status: 'active'
      });
      
      await experiment.save();
      console.log('Created default experiment');

      // Create sample stimulus
      const stimulus = new Stimulus({
        experimentId: defaultExperimentId,
        storyId: 'story_001',
        title: { en: 'Sample Story' },
        paragraphs: [{
          text: 'This is a sample text with some target words like computer and programming that will be turned into gaps.',
          order: 1
        }],
        target_words: [
          { word: 'computer', difficulty: 1 },
          { word: 'programming', difficulty: 2 }
        ],
        translation_source: { en: 'manual' },
        validation: { en: { approved: true } }
      });
      
      await stimulus.save();
      console.log('Created sample stimulus');
    } else {
      console.log('Default experiment already exists');
    }

    console.log('Seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();
