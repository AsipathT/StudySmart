import React from 'react';
import { Card, Progress, Space, Tag } from 'antd';

const SubjectCard = ({ subject, score = 0, trend = null }) => {
  return (
    <Card className="subject-card" hoverable>
      <Space direction="vertical" style={{ width: '100%' }}>
        <h3>{subject}</h3>
        <Progress type="circle" percent={score} width={80} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Score: {score}%</span>
          {trend && (
            <Tag color={trend > 0 ? 'green' : 'red'}>
              {trend > 0 ? '+' : ''}{trend}%
            </Tag>
          )}
        </div>
      </Space>
    </Card>
  );
};

export default SubjectCard;
