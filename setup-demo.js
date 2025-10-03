#!/usr/bin/env node
const axios = require('axios');

const BASE_URL = 'http://localhost:4000';

async function setupDemo() {
  console.log('🧪 Setting up Demo Experiment with Content...\n');

  try {
    // Login as the teacher account you already have
    console.log('1. Logging in with existing teacher account...');
    const loginResponse = await axios.post(`${BASE_URL}/v1/auth/login`, {
      email: 'test@example.com',
      password: 'test123'
    });
    console.log('✅ Logged in successfully');
    const token = loginResponse.data.token;

    // Create an experiment  
    console.log('\n2. Creating experiment...');
    const experimentResponse = await axios.post(`${BASE_URL}/v1/experiments`, {
      title: 'Cognitive Offloading Demo Study',
      languages: ['en'],
      design: {},
      hint_rules: { min_attempts_before_hint: 3, time_before_auto_hint_seconds: 120 }
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const experimentId = experimentResponse.data._id;
    console.log('✅ Experiment created:', experimentId);

    // Upload targets and generate story
    console.log('\n3. Generating story with target words...');
    const uploadResponse = await axios.post(`${BASE_URL}/v1/experiments/${experimentId}/upload-targets`, {
      targets: ['memory', 'learning', 'cognitive', 'research', 'student'],
      languages: ['en']
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Story generated:', uploadResponse.data.message);

    // Test fetching stimuli
    console.log('\n4. Verifying stimuli are accessible...');
    const stimuliResponse = await axios.get(`${BASE_URL}/v1/experiments/${experimentId}/stimuli?lang=en`);
    console.log('✅ Stimuli found:', stimuliResponse.data.length, 'stories');

    console.log('\n🎉 Demo Setup Complete!');
    console.log('\n📝 Experiment Details:');
    console.log(`   ID: ${experimentId}`);
    console.log(`   Title: ${experimentResponse.data.title}`);

    console.log('\n🔗 Participant URLs:');
    const baseUrl = 'http://localhost:3000';
    console.log(`   Treatment: ${baseUrl}/experiment?experimentId=${experimentId}&mode=treatment`);
    console.log(`   Control:   ${baseUrl}/experiment?experimentId=${experimentId}&mode=control`);

    console.log('\n📊 Research Dashboard:');
    console.log(`   Login: ${baseUrl}/teacher/login`);
    console.log(`   Email: test@example.com`);
    console.log(`   Password: test123`);

    return {
      experimentId,
      treatmentUrl: `${baseUrl}/experiment?experimentId=${experimentId}&mode=treatment`,
      controlUrl: `${baseUrl}/experiment?experimentId=${experimentId}&mode=control`
    };

  } catch (error) {
    console.error('\n❌ Setup failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', error.response.data);
    } else {
      console.error('Network error:', error.message);
    }
    console.error('\nTroubleshooting:');
    console.error('• Make sure backend is running on http://localhost:4000');
    console.error('• Check if you can login at http://localhost:3000/teacher/login');
  }
}

if (require.main === module) {
  setupDemo();
}
