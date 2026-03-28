import React from 'react';
import { Card, Statistic, Progress, Space, Tag } from 'antd';
import { RiseOutlined, FallOutlined } from '@ant-design/icons';

const PredictedScoreCard = ({ subject, predictedScore, currentScore, trend }) => {
  const improvement = predictedScore - (currentScore || 0);
  const isPositive = improvement >= 0;

  return (
    <Card className="predicted-score-card" hoverable>
      <Space direction="vertical" style={{ width: '100%' }}>
        <h3>{subject}</h3>
        <Progress
          type="circle"
          percent={predictedScore}
          format={(percent) => `${percent}%`}
          width={80}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Statistic
            title="Predicted Score"
            value={predictedScore}
            suffix="%"
            valueStyle={{ color: '#1890ff' }}
          />
          <Statistic
            title="Current Score"
            value={currentScore || 0}
            suffix="%"
          />
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {isPositive ? (
            <>
              <RiseOutlined style={{ color: '#52c41a', fontSize: '16px' }} />
              <Tag color="green">+{improvement.toFixed(1)}%</Tag>
            </>
          ) : (
            <>
              <FallOutlined style={{ color: '#f5222d', fontSize: '16px' }} />
              <Tag color="red">{improvement.toFixed(1)}%</Tag>
            </>
          )}
        </div>
      </Space>
    </Card>
  );
};

export default PredictedScoreCard;
