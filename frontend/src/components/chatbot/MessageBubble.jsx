import React from 'react';
import { Avatar, Typography, Space } from 'antd';
import { RobotOutlined, UserOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import { formatDistanceToNow } from 'date-fns';
import './MessageBubble.css';

const { Text } = Typography;

const MessageBubble = ({ message }) => {
  const isAssistant = message.role === 'assistant';

  return (
    <div className={`message-bubble ${isAssistant ? 'assistant' : 'user'}`}>
      <Space align="start" size="middle">
        <Avatar
          icon={isAssistant ? <RobotOutlined /> : <UserOutlined />}
          style={{
            backgroundColor: isAssistant ? '#1890ff' : '#52c41a',
          }}
        />
        
        <div className="message-content">
          <div className="message-header">
            <Text strong>{isAssistant ? 'AI Assistant' : 'You'}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
            </Text>
          </div>
          
          <div className={`message-text ${message.isError ? 'error' : ''}`}>
            <ReactMarkdown>
              {message.content}
            </ReactMarkdown>
          </div>
        </div>
      </Space>
    </div>
  );
};

export default MessageBubble;