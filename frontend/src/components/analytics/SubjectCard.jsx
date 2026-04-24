import React from 'react';
import { Card, Progress, Space, Tag } from 'antd';

const SubjectCard = ({ subject, score = 0, trend = null }) => {
  const scoreColor = score >= 75 ? '#16a34a' : score >= 55 ? '#d97706' : '#dc2626';
  
  return (
    <Card 
      className="subject-card"
      hoverable
      style={{
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        background: 'linear-gradient(135deg, #ffffff 0%, rgba(248, 250, 252, 0.8) 100%)',
        transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 10px 32px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.08)';
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.borderColor = '#f59e0b';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = '#e2e8f0';
      }}
    >
      <Space direction="vertical" style={{ width: '100%' }} size={16}>
        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
          {subject}
        </h3>
        <div style={{ textAlign: 'center' }}>
          <Progress 
            type="circle"
            percent={score}
            width={80}
            strokeColor={scoreColor}
            trailColor="#e2e8f0"
            format={percent => (
              <span style={{ fontSize: '20px', fontWeight: 700, color: scoreColor }}>
                {percent}%
              </span>
            )}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', color: '#475569', fontWeight: 500 }}>Score: {score}%</span>
          {trend && (
            <Tag 
              color={trend > 0 ? '#f0fdf4' : '#fef2f2'}
              style={{
                color: trend > 0 ? '#16a34a' : '#dc2626',
                fontWeight: 700,
                fontSize: '12px',
                border: `1px solid ${trend > 0 ? '#86efac' : '#fca5a5'}`
              }}
            >
              {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
            </Tag>
          )}
        </div>
      </Space>
    </Card>
  );
};

export default SubjectCard;
