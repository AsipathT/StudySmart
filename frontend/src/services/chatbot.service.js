import api from './api';

class ChatbotService {
  /**
   * Send message to chatbot
   */
  async sendMessage(message, studentId = null) {
    const response = await api.post('/chatbot/message', {
      message,
      studentId,
    });
    return response.data;
  }

  /**
   * Get conversation history
   */
  async getHistory() {
    const response = await api.get('/chatbot/history');
    return response.data;
  }

  /**
   * Clear conversation history
   */
  async clearHistory() {
    const response = await api.delete('/chatbot/history');
    return response.data;
  }

  /**
   * Get suggested questions
   */
  async getSuggestions() {
    const response = await api.get('/chatbot/suggestions');
    return response.data;
  }
}

export default new ChatbotService();