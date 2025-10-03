#!/usr/bin/env node
const axios = require('axios');

const BASE_URL = 'http://localhost:4000';

async function createDemoExperiment() {
  console.log('🧪 Creating Demo Cognitive Learning Experiment...\n');

  try {
    // 1. Register a teacher/researcher account
    console.log('1. Creating researcher account...');
    const teacherData = {
      email: `researcher-${Date.now()}@university.edu`,
      password: 'research123',
      role: 'teacher',
      name: 'Dr. Research'
    };
    
    const teacherResponse = await axios.post(`${BASE_URL}/v1/auth/register`, teacherData);
    console.log('✅ Researcher account created:', teacherResponse.data.user.name);
    const token = teacherResponse.data.token;

    // 2. Create an experiment
    console.log('\n2. Creating experiment...');
    const experimentData = {
      title: 'Cognitive Offloading Study - Demo',
      languages: ['en'],
      design: { condition_assignment: 'manual' },
      hint_rules: { 
        min_attempts_before_hint: 2, 
        time_before_auto_hint_seconds: 90 
      }
    };
    
    const experimentResponse = await axios.post(`${BASE_URL}/v1/experiments`, experimentData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Experiment created:', experimentResponse.data._id);
    const experimentId = experimentResponse.data._id;

    // 3. Generate content with target words
    console.log('\n3. Generating story content...');
    const contentData = {
      targets: ['memory', 'learning', 'cognitive', 'effort', 'generation'],
      languages: ['en']
    };
    
    const contentResponse = await axios.post(`${BASE_URL}/v1/experiments/${experimentId}/upload-targets`, contentData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Story content generated:', contentResponse.data.message);

    // 4. Generate participant URLs
    const frontendUrl = 'http://localhost:3000';
    const treatmentUrl = `${frontendUrl}/experiment?experimentId=${experimentId}&mode=treatment`;
    const controlUrl = `${frontendUrl}/experiment?experimentId=${experimentId}&mode=control`;

    console.log('\n🎉 Demo Experiment Ready!');
    console.log('\n📊 Research Dashboard:');
    console.log(`   ${frontendUrl}/teacher/login`);
    console.log(`   Email: ${teacherData.email}`);
    console.log(`   Password: ${teacherData.password}`);

    console.log('\n👥 Participant Links:');
    console.log(`   Treatment: ${treatmentUrl}`);
    console.log(`   Control:   ${controlUrl}`);

    console.log('\n🔬 What to Test:');
    console.log('   • Prior knowledge baseline assessment');
    console.log('   • Gap-fill learning task with condition differences');
    console.log('   • Paas mental effort scale collection');
    console.log('   • Transcription task with behavioral tracking');
    console.log('   • Delayed recall link generation');

    console.log('\n📈 Analytics Dashboard:');
    console.log('   • Login to research dashboard');
    console.log('   • Switch to "🧠 Behavioral Analytics" tab');
    console.log('   • Select your experiment to monitor real-time data');

    return {
      experimentId,
      treatmentUrl,
      controlUrl,
      teacherCredentials: teacherData
    };

  } catch (error) {
    console.error('\n❌ Demo creation failed:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data || error.message);
    console.error('\nMake sure the backend server is running on port 4000');
  }
}

// Run demo creation if this file is executed directly
if (require.main === module) {
  createDemoExperiment();
}

module.exports = { createDemoExperiment };
