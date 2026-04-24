import { useState, useCallback } from 'react';
import chatbotService from '../services/chatbot.service';

export const useChatbot = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const sendMessage = useCallback(async (message) => {
    try {
      setLoading(true);
      setError(null);
      const response = await chatbotService.sendMessage(message);
      setMessages((prev) => [
        ...prev,
        { type: 'user', content: message },
        { type: 'assistant', content: response.message },
      ]);
      return response;
    } catch (err) {
      setError(err.message || 'Failed to send message');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return { messages, loading, error, sendMessage, clearMessages };
};

export default useChatbot;