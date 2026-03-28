import React from 'react';
import { Row, Col, Card } from 'antd';
import ChatInterface from '../components/chatbot/ChatInterface';
import { useAuth } from '../hooks/useAuth';

const ChatbotPage = () => {
  const { user } = useAuth();

  return (
    <div style={{ padding: 24 }}>
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <ChatInterface 
            studentId={user?.studentId}
            fullScreen={false}
          />
        </Col>
        
        <Col xs={24} lg={8}>
          <Card title="About AI Assistant">
            <p>
              <strong>StudySmart AI Assistant</strong> can help you with:
            </p>
            <ul>
              <li>Personalized study tips based on your performance</li>
              <li>Performance predictions and insights</li>
              <li>Exam preparation strategies</li>
              <li>Time management advice</li>
              <li>Stress management techniques</li>
              <li>Subject-specific recommendations</li>
            </ul>
            <p>
              The assistant learns from your data to provide increasingly 
              personalized advice over time.
            </p>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ChatbotPage;