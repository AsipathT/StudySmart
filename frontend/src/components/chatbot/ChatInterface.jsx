import React, { useState, useRef, useEffect } from 'react';
import { Card, Input, Button, Space, Typography, Spin, Alert, Tag } from 'antd';
import {
  SendOutlined,
  RobotOutlined,
  UserOutlined,
  BulbOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import MessageBubble from './MessageBubble';
import chatbotService from '../../services/chatbot.service';
import './ChatInterface.css';

const { Text } = Typography;
const { TextArea } = Input;

const ChatInterface = ({ studentId, onClose, fullScreen }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    loadSuggestions();
    // Add welcome message
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: "👋 Hi! I'm your StudySmart AI Assistant. I can help you with study tips, performance predictions, exam preparation, and more. What would you like to know?",
        timestamp: new Date(),
      },
    ]);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadSuggestions = async () => {
    try {
      const result = await chatbotService.getSuggestions();
      if (result.success) {
        setSuggestions(result.data.suggestions);
      }
    } catch (error) {
      console.error('Failed to load suggestions:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || loading) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);
    setShowSuggestions(false);

    try {
      const response = await chatbotService.sendMessage(inputMessage, studentId);
      
      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data.message,
        timestamp: new Date(response.data.timestamp),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please try again later.",
        timestamp: new Date(),
        isError: true,
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setInputMessage(suggestion);
    handleSendMessage();
  };

  return (
    <Card
      className={`chat-interface ${fullScreen ? 'fullscreen' : ''}`}
      title={
        <Space>
          <RobotOutlined style={{ color: '#1890ff' }} />
          <Text strong>AI Study Assistant</Text>
          <Tag color="blue">Beta</Tag>
        </Space>
      }
      extra={
        onClose && (
          <Button type="text" icon={<CloseOutlined />} onClick={onClose} />
        )
      }
    >
      <div className="chat-messages">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        
        {loading && (
          <div className="loading-indicator">
            <Spin size="small" />
            <Text type="secondary">AI is thinking...</Text>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="suggestions-container">
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Text type="secondary">
              <BulbOutlined /> Suggested questions:
            </Text>
            <div className="suggestions-grid">
              {suggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  size="small"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="suggestion-button"
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </Space>
        </div>
      )}

      <div className="chat-input">
        <TextArea
          ref={inputRef}
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask me anything about your studies..."
          autoSize={{ minRows: 1, maxRows: 4 }}
          disabled={loading}
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={handleSendMessage}
          loading={loading}
          disabled={!inputMessage.trim()}
        />
      </div>
    </Card>
  );
};

export default ChatInterface;