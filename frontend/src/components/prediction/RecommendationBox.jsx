import React from 'react';
import { Card, Alert, List, Button, Space } from 'antd';
import { BookOutlined, CheckCircleOutlined } from '@ant-design/icons';

const RecommendationBox = ({ recommendations, onApply }) => {
  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  return (
    <Card
      title={
        <Space>
          <BookOutlined />
          <span>Recommended Actions</span>
        </Space>
      }
      className="recommendation-box"
    >
      <List
        dataSource={recommendations}
        renderItem={(item, index) => (
          <List.Item
            key={index}
            extra={
              <Button
                type="primary"
                size="small"
                onClick={() => onApply && onApply(item)}
              >
                Apply
              </Button>
            }
          >
            <List.Item.Meta
              avatar={<CheckCircleOutlined style={{ color: '#52c41a', fontSize: '16px' }} />}
              title={item.title || `Recommendation ${index + 1}`}
              description={item.description || item.content}
            />
          </List.Item>
        )}
      />
    </Card>
  );
};

export default RecommendationBox;
