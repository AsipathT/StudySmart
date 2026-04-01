const axios = require('axios');
require('dotenv').config();

async function testGeminiKey(apiKey) {
  console.log('🔍 Testing Gemini API key...');

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        contents: [{
          parts: [{
            text: 'Hello, respond with just "OK" if you can read this.'
          }]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 10
        }
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    const reply = response.data.candidates[0].content.parts[0].text.trim();
    console.log('✅ Gemini API key is VALID!');
    console.log('Response:', reply);
    return true;

  } catch (error) {
    console.log('❌ Gemini API key is INVALID');
    console.log('Error:', error.response?.data?.error?.message || error.message);
    return false;
  }
}

// Test with provided key or prompt for new one
async function main() {
  const currentKey = process.env.GEMINI_API_KEY;

  if (currentKey && currentKey !== 'your-gemini-api-key-here') {
    console.log('Testing current key from .env file...');
    const isValid = await testGeminiKey(currentKey);

    if (!isValid) {
      console.log('\n❌ Current key is invalid. Please get a new one from:');
      console.log('https://makersuite.google.com/app/apikey');
      console.log('\nThen update your .env file with:');
      console.log('GEMINI_API_KEY=your-new-key-here');
      console.log('AI_SERVICE=gemini');
    }
  } else {
    console.log('❌ No Gemini API key found in .env file');
    console.log('\n📝 To get a Gemini API key:');
    console.log('1. Go to: https://makersuite.google.com/app/apikey');
    console.log('2. Sign in with Google account');
    console.log('3. Click "Create API key"');
    console.log('4. Copy the key and add to .env:');
    console.log('   GEMINI_API_KEY=your-key-here');
    console.log('   AI_SERVICE=gemini');
  }
}

main().catch(console.error);