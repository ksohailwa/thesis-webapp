require('dotenv').config();
const mongoose = require('mongoose');
const TaskResult = require('../models/TaskResult');
const Participant = require('../models/Participant');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

async function generateSampleResults() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to MongoDB');

    const defaultExperimentId = '507f1f77bcf86cd799439011';

    // Create sample participants (users with student role)
    const participants = [];
    
    for (let i = 1; i <= 5; i++) {
      const email = `student${i}@example.com`;
      
      // Check if user already exists
      let user = await User.findOne({ email });
      
      if (!user) {
        const hash = await bcrypt.hash('password123', 10);
        user = await User.create({
          email,
          password_hash: hash,
          role: 'student',
          name: `Student ${i}`
        });
        console.log(`Created user: ${email}`);
      }

      // Create participant record
      let participant = await Participant.findOne({ email });
      if (!participant) {
        participant = await Participant.create({
          email,
          consent: { given: true, timestamp: new Date() },
          locale: 'en',
          timezone: 'UTC',
          participant_code: `STUD${i.toString().padStart(3, '0')}`,
          experiments: [defaultExperimentId]
        });
        console.log(`Created participant: ${email}`);
      }

      participants.push(participant);
    }

    // Generate sample task results
    const targetWords = ['computer', 'programming', 'software', 'algorithm', 'database'];
    const sampleResponses = [
      { correct: 'computer', responses: ['computer', 'compter', 'computr', 'computer'] },
      { correct: 'programming', responses: ['programming', 'programing', 'progamming', 'programming'] },
      { correct: 'software', responses: ['software', 'sofware', 'software', 'softwar'] },
      { correct: 'algorithm', responses: ['algorithm', 'algoritm', 'algorithem', 'algorithm'] },
      { correct: 'database', responses: ['database', 'databse', 'data base', 'database'] }
    ];

    // Clear existing results for this experiment
    await TaskResult.deleteMany({ experimentId: defaultExperimentId });
    console.log('Cleared existing results');

    let resultCount = 0;
    
    // Generate results for each participant
    for (const participant of participants) {
      for (let wordIndex = 0; wordIndex < targetWords.length; wordIndex++) {
        const wordData = sampleResponses[wordIndex];
        const response = wordData.responses[Math.floor(Math.random() * wordData.responses.length)];
        
        // Calculate scoring
        const normalized_response = response.toLowerCase().trim();
        const correct_normalized = wordData.correct.toLowerCase().trim();
        
        // Simple Levenshtein distance calculation
        const levenshteinDistance = (a, b) => {
          const matrix = [];
          for (let i = 0; i <= b.length; i++) matrix[i] = [i];
          for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
          
          for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
              if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
              } else {
                matrix[i][j] = Math.min(
                  matrix[i - 1][j - 1] + 1,
                  matrix[i][j - 1] + 1,
                  matrix[i - 1][j] + 1
                );
              }
            }
          }
          return matrix[b.length][a.length];
        };
        
        const lev = levenshteinDistance(normalized_response, correct_normalized);
        const maxLen = Math.max(normalized_response.length, correct_normalized.length);
        const normalized_score = maxLen > 0 ? Math.max(0, (maxLen - lev) / maxLen) : 1;
        
        const result = await TaskResult.create({
          participantId: participant._id,
          experimentId: defaultExperimentId,
          itemId: `story_001-word_${wordIndex}`,
          phase: 'immediate',
          response_raw: response,
          response_normalized: normalized_response,
          levenshtein: lev,
          normalized_score,
          attempts: Math.floor(Math.random() * 3) + 1,
          time_on_item_seconds: Math.floor(Math.random() * 30) + 10
        });
        
        resultCount++;
      }
    }

    console.log(`Generated ${resultCount} sample results for experiment ${defaultExperimentId}`);
    console.log('Sample data generation completed successfully');
    
    // Display summary
    const stats = await TaskResult.aggregate([
      { $match: { experimentId: defaultExperimentId } },
      { 
        $group: {
          _id: null,
          count: { $sum: 1 },
          avgScore: { $avg: '$normalized_score' },
          avgTime: { $avg: '$time_on_item_seconds' }
        }
      }
    ]);
    
    if (stats.length > 0) {
      console.log('\nGenerated Statistics:');
      console.log(`Total Results: ${stats[0].count}`);
      console.log(`Average Score: ${(stats[0].avgScore * 100).toFixed(1)}%`);
      console.log(`Average Time: ${stats[0].avgTime.toFixed(1)}s`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error generating sample results:', error);
    process.exit(1);
  }
}

generateSampleResults();
