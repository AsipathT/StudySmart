const chatbot = require('./src/services/chatbot.service');
require('dotenv').config();

async function testAIIntegration() {
  console.log('🧪 Testing AI Integration...\n');

  // Test data for performance advice
  const testData = {
    studentName: 'John',
    gpa: 2.1,
    attendance: 60,
    completedAssignments: '5/10',
    riskLevel: 'HIGH',
    question: 'How can I improve my performance?',
    history: []
  };

  try {
    console.log('📊 Testing Performance Advice...');
    console.log('Input:', JSON.stringify(testData, null, 2));

    const advice = await chatbot.getPerformanceAdvice(testData);
    console.log('✅ AI Response:', advice);
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  // Test general chatbot query
  try {
    console.log('💬 Testing General Chat Query...');
    const query = 'How can I improve my study habits?';
    console.log('Input:', query);

    const response = await chatbot.processQuery('test-student', query, {});
    console.log('✅ AI Response:', response);
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  console.log('🔧 Current Configuration:');
  console.log('- AI Service:', process.env.AI_SERVICE || 'openai');
  console.log('- OpenAI Key Set:', !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-openai-api-key-here');
  console.log('- Gemini Key Set:', !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your-gemini-api-key-here');
  console.log('- Fallback Available: Yes (rule-based responses)');
  console.log('');
}

// Run the test
testAIIntegration().catch(console.error);