#!/usr/bin/env node
const axios = require('axios');

const BASE_URL = 'http://localhost:4000';

async function testBackend() {
  console.log('🧪 Testing Cognitive Learning Study Backend...\n');

  try {
    // Test 1: Basic health check
    console.log('1. Testing health check...');
    const healthResponse = await axios.get(`${BASE_URL}/`);
    console.log('✅ Health check:', healthResponse.data);

    // Test 2: Register a test participant
    console.log('\n2. Testing participant registration...');
    const participantData = {
      name: 'Test Participant',
      email: `test-${Date.now()}@example.com`,
      age: 25,
      language: 'en',
      consent: true
    };
    
    const registerResponse = await axios.post(`${BASE_URL}/v1/participants/register`, participantData);
    console.log('✅ Participant registered:', registerResponse.data.participantId);
    const participantId = registerResponse.data.participantId;

    // Test 3: Submit a Paas rating
    console.log('\n3. Testing Paas submission...');
    const paasData = {
      participantId: participantId,
      experimentId: '507f1f77bcf86cd799439011',
      phase: 'mid-task',
      score: 5
    };
    
    const paasResponse = await axios.post(`${BASE_URL}/v1/tasks/submit-paas`, paasData);
    console.log('✅ Paas submitted:', paasResponse.data);

    // Test 4: Submit a task result
    console.log('\n4. Testing result submission...');
    const resultData = {
      participantId: participantId,
      experimentId: '507f1f77bcf86cd799439011',
      itemId: 'test-word-1',
      phase: 'baseline_knowledge',
      response: 'test response',
      correct: 'correct answer'
    };
    
    const resultResponse = await axios.post(`${BASE_URL}/v1/tasks/submit-result`, resultData);
    console.log('✅ Result submitted:', resultResponse.data);

    // Test 5: Submit an attempt (behavioral logging)
    console.log('\n5. Testing attempt logging...');
    const attemptData = {
      participantId: participantId,
      experimentId: '507f1f77bcf86cd799439011',
      storyId: 'test-story',
      paragraphIndex: 0,
      blankIndex: 1,
      attemptText: 'test',
      attemptNumber: 1,
      timeOnBlankSeconds: 15,
      locale: 'en',
      metadata: {
        hintsUsed: 2,
        isCorrect: false,
        eventType: 'gap_fill_attempt'
      }
    };
    
    const attemptResponse = await axios.post(`${BASE_URL}/v1/tasks/submit-attempt`, attemptData);
    console.log('✅ Attempt logged:', attemptResponse.data);

    console.log('\n🎉 All backend tests passed! The cognitive learning study API is working correctly.');

  } catch (error) {
    console.error('\n❌ Backend test failed:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data || error.message);
    console.error('\nMake sure the backend server is running on port 4000');
    console.error('Start it with: cd thesis-webapp-backend && npm run dev');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testBackend();
}

module.exports = { testBackend };
