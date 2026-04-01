require('dotenv').config();

const axios = require('axios');

async function testOpenAIKey() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || apiKey === 'your-openai-api-key-here') {
    console.log('❌ OpenAI API key not set or is placeholder');
    return;
  }

  console.log('🔑 Testing OpenAI API key...');

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: 'Hello, just testing the API. Respond with "API test successful".'
          }
        ],
        max_tokens: 10,
        temperature: 0.1
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const result = response.data.choices[0].message.content.trim();
    console.log('✅ OpenAI API test successful!');
    console.log('Response:', result);

  } catch (error) {
    console.log('❌ OpenAI API test failed:');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
    } else {
      console.log('Error:', error.message);
    }
  }
}

testOpenAIKey();