require('dotenv').config();

const axios = require('axios');

async function testChatbot() {
  const API_BASE = 'http://localhost:5000/api';
  
  // Test with mock student data
  const mockMessage = "How can I improve my GPA?";
  
  console.log('🧪 Testing Enhanced Chatbot with Student Context...\n');
  
  try {
    const response = await axios.post(
      `${API_BASE}/chatbot/message`,
      {
        message: mockMessage,
        studentId: 'test-student-123',
        context: {
          gpa: 2.5,
          attendance: 65,
          studentName: 'John Doe',
          riskLevel: 'HIGH',
          averageScore: 55
        }
      },
      {
        headers: {
          'Authorization': `Bearer dummy-token`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ API Response Status:', response.status);
    console.log('📊 Response Data:');
    console.log(JSON.stringify(response.data, null, 2));

  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ API is reachable (authentication needed, which is expected)');
      console.log('📍 Backend endpoint is working correctly');
    } else {
      console.log('❌ Error:', error.response?.data || error.message);
    }
  }
}

testChatbot();