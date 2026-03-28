const axios = require('axios');

class ChatbotService {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.conversations = new Map(); // Store conversation history
  }

  /**
   * Process student query
   * @param {string} studentId - Student ID
   * @param {string} message - User message
   * @param {Object} context - Student context (performance data)
   * @returns {Promise<string>} Bot response
   */
  async processQuery(studentId, message, context = {}) {
    try {
      // Get or create conversation
      if (!this.conversations.has(studentId)) {
        this.conversations.set(studentId, []);
      }
      
      const conversation = this.conversations.get(studentId);
      
      // Build context-aware prompt
      const prompt = this.buildPrompt(message, context, conversation);
      
      // Get response from OpenAI (or use rule-based fallback)
      let response;
      if (this.apiKey && this.apiKey !== 'your-openai-api-key-for-chatbot') {
        response = await this.getOpenAIResponse(prompt);
      } else {
        response = this.getRuleBasedResponse(message, context);
      }
      
      // Update conversation
      conversation.push({ role: 'user', content: message });
      conversation.push({ role: 'assistant', content: response });
      
      // Keep only last 10 messages
      if (conversation.length > 20) {
        this.conversations.set(studentId, conversation.slice(-20));
      }
      
      return response;
    } catch (error) {
      console.error('Chatbot error:', error);
      return this.getFallbackResponse();
    }
  }

  /**
   * Build prompt with context
   */
  buildPrompt(message, context, conversation) {
    let prompt = `You are StudySmart AI Assistant, helping students with their academic performance.
Current student context:
- Average score: ${context.averageScore || 'N/A'}%
- Subjects: ${context.subjects?.join(', ') || 'N/A'}
- Study hours: ${context.totalStudyHours || 0} hours

Recent conversation:
${conversation.slice(-4).map(msg => `${msg.role}: ${msg.content}`).join('\n')}

Student: ${message}
Assistant:`;
    
    return prompt;
  }

  /**
   * Get response from OpenAI
   */
  async getOpenAIResponse(prompt) {
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful academic assistant for students. Provide concise, practical advice about studying, performance improvement, and exam preparation.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 300,
          temperature: 0.7
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI API error:', error);
      return this.getRuleBasedResponse(prompt, {});
    }
  }

  /**
   * Rule-based fallback responses
   */
  getRuleBasedResponse(message, context) {
    const lowerMsg = message.toLowerCase();
    
    if (lowerMsg.includes('study tip') || lowerMsg.includes('how to study')) {
      return this.getStudyTips(context);
    } else if (lowerMsg.includes('prediction') || lowerMsg.includes('predict')) {
      return this.getPredictionAdvice(context);
    } else if (lowerMsg.includes('improve') || lowerMsg.includes('better')) {
      return this.getImprovementAdvice(context);
    } else if (lowerMsg.includes('exam') || lowerMsg.includes('test') || lowerMsg.includes('quiz')) {
      return this.getExamAdvice();
    } else if (lowerMsg.includes('time management')) {
      return this.getTimeManagementAdvice();
    } else if (lowerMsg.includes('stress') || lowerMsg.includes('anxiety')) {
      return this.getStressManagementAdvice();
    } else {
      return this.getGeneralResponse();
    }
  }

  getStudyTips(context) {
    const avg = context.averageScore || 70;
    if (avg < 60) {
      return "Based on your current performance, I recommend focusing on understanding fundamental concepts first. Try the Pomodoro technique: study in 25-minute focused blocks with 5-minute breaks. Would you like specific tips for any subject?";
    } else if (avg < 75) {
      return "You're doing well! To boost your scores further, try active recall techniques - quiz yourself on material without looking at notes. Also, teaching concepts to others helps reinforce learning.";
    } else {
      return "Excellent work! To maintain your high performance, focus on practice problems and past exam papers. Consider helping peers - teaching is one of the best ways to deepen understanding.";
    }
  }

  getPredictionAdvice(context) {
    if (context.predictedScore) {
      return `Our prediction model estimates you could score around ${context.predictedScore}% in your next assessment. To improve this, try to study ${context.recommendedHours || 5} more hours focusing on weak areas.`;
    }
    return "I can help predict your performance! Please upload some quiz scores and study session data first, then try the prediction feature.";
  }

  getImprovementAdvice(context) {
    return "To improve your scores, try these strategies:\n1. Review mistakes from previous assessments\n2. Create a study schedule with specific goals\n3. Use active learning techniques (practice problems, teaching others)\n4. Form study groups with classmates\n5. Take regular breaks to maintain focus";
  }

  getExamAdvice() {
    return "Exam preparation tips:\n• Start early and study in chunks\n• Practice with past papers under timed conditions\n• Focus on understanding concepts, not memorization\n• Get adequate sleep before the exam\n• Read questions carefully and manage your time during the exam";
  }

  getTimeManagementAdvice() {
    return "Effective time management:\n• Use a planner or digital calendar\n• Prioritize tasks based on importance and deadlines\n• Break large tasks into smaller, manageable chunks\n• Set specific study goals for each session\n• Review and adjust your schedule weekly";
  }

  getStressManagementAdvice() {
    return "Managing academic stress:\n• Take regular breaks during study sessions\n• Practice deep breathing or meditation\n• Exercise regularly - even short walks help\n• Maintain a healthy sleep schedule\n• Talk to friends, family, or counselors about concerns";
  }

  getGeneralResponse() {
    return "I'm here to help with your studies! You can ask me about:\n• Study tips and techniques\n• Performance predictions\n• Exam preparation\n• Time management\n• Stress management\n• Specific subjects or topics";
  }

  getFallbackResponse() {
    return "I'm having trouble processing your request right now. Please try again later or ask a different question about your studies.";
  }
}

module.exports = new ChatbotService();