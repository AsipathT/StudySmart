import React from 'react';
import { Card, List, Button, Space, Tag } from 'antd';
import {
  BookOutlined,
  CheckCircleOutlined,
  RocketOutlined,
  BulbOutlined,
  ThunderboltOutlined,
  FireOutlined,
} from '@ant-design/icons';
import './RecommendationBox.css';

const RecommendationBox = ({ recommendations, onApply }) => {
  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  // Icon mapping based on recommendation type
  const getRecommendationIcon = (item, index) => {
    const text = (item.description || item.content || item.title || '').toLowerCase();
    
    if (text.includes('urgent') || text.includes('critical')) {
      return <FireOutlined style={{ color: '#dc2626', fontSize: '18px' }} />;
    }
    if (text.includes('study') || text.includes('hours')) {
      return <BookOutlined style={{ color: '#f59e0b', fontSize: '18px' }} />;
    }
    if (text.includes('track') || text.includes('maintain')) {
      return <CheckCircleOutlined style={{ color: '#16a34a', fontSize: '18px' }} />;
    }
    if (text.includes('improve') || text.includes('trend')) {
      return <ThunderboltOutlined style={{ color: '#7c3aed', fontSize: '18px' }} />;
    }
    
    return <BulbOutlined style={{ color: '#2563eb', fontSize: '18px' }} />;
  };

  const getPriorityColor = (item) => {
    const text = (item.description || item.content || item.title || '').toLowerCase();
    if (text.includes('urgent') || text.includes('fail') || text.includes('below')) {
      return { bg: '#fef2f2', border: '#fca5a5', accent: '#dc2626' };
    }
    if (text.includes('improve') || text.includes('more')) {
      return { bg: '#fffbeb', border: '#fde68a', accent: '#f59e0b' };
    }
    return { bg: '#eff6ff', border: '#bfdbfe', accent: '#2563eb' };
  };

  return (
    <Card
      title={
        <Space>
          <RocketOutlined style={{ color: '#f59e0b', fontSize: '18px' }} />
          <span style={{ fontWeight: 800, fontSize: '16px', color: '#0f172a', letterSpacing: '-0.3px' }}>
            Personalized Recommendations
          </span>
        </Space>
      }
      className="recommendation-box"
      style={{
        borderRadius: '18px',
        border: '2px solid rgba(245, 158, 11, 0.3)',
        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, #ffffff 100%)',
        transition: 'all 350ms cubic-bezier(0.16, 1, 0.3, 1)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative background */}
      <div
        style={{
          position: 'absolute',
          top: '-50px',
          right: '-50px',
          width: '200px',
          height: '200px',
          background: 'radial-gradient(circle, rgba(245, 158, 11, 0.1) 0%, transparent 70%)',
          pointerEvents: 'none',
          animation: 'pulse 4s ease-in-out infinite',
        }}
      />

      <List
        dataSource={recommendations}
        renderItem={(item, index) => {
          const colors = getPriorityColor(item);
          return (
            <List.Item
              key={index}
              className="recommendation-item"
              style={{
                padding: '16px',
                marginBottom: '12px',
                background: colors.bg,
                border: `1.5px solid ${colors.border}`,
                borderRadius: '14px',
                transition: 'all 300ms cubic-bezier(0.16, 1, 0.3, 1)',
                position: 'relative',
                overflow: 'hidden',
              }}
              extra={
                onApply && (
                  <Button
                    type="primary"
                    size="small"
                    onClick={() => onApply(item)}
                    icon={<CheckCircleOutlined />}
                    style={{
                      background: colors.accent,
                      borderColor: colors.accent,
                      fontWeight: 700,
                      borderRadius: '10px',
                      fontSize: '13px',
                      height: '36px',
                      padding: '0 16px',
                      transition: 'all 250ms ease',
                      boxShadow: `0 2px 8px ${colors.accent}40`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = `0 6px 16px ${colors.accent}50`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = `0 2px 8px ${colors.accent}40`;
                    }}
                  >
                    Apply
                  </Button>
                )
              }
            >
              <List.Item.Meta
                avatar={
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      background: '#ffffff',
                      border: `2px solid ${colors.accent}30`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      boxShadow: `0 4px 12px ${colors.accent}20`,
                    }}
                  >
                    {getRecommendationIcon(item, index)}
                  </div>
                }
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '14px' }}>
                      {item.title || `Recommendation ${index + 1}`}
                    </span>
                    {index === 0 && (
                      <Tag
                        style={{
                          background: `${colors.accent}20`,
                          border: `1px solid ${colors.accent}40`,
                          color: colors.accent,
                          fontWeight: 700,
                          fontSize: '10px',
                          padding: '1px 8px',
                          borderRadius: '8px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}
                      >
                        Priority
                      </Tag>
                    )}
                  </div>
                }
                description={
                  <span
                    style={{
                      color: '#475569',
                      fontSize: '13px',
                      lineHeight: '1.6',
                      fontWeight: 500,
                    }}
                  >
                    {item.description || item.content}
                  </span>
                }
              />
            </List.Item>
          );
        }}
      />

      {/* Footer tip */}
      <div
        style={{
          marginTop: '16px',
          padding: '12px 16px',
          background: 'rgba(59, 130, 246, 0.08)',
          borderRadius: '12px',
          border: '1.5px solid rgba(59, 130, 246, 0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <BulbOutlined style={{ color: '#2563eb', fontSize: '16px', flexShrink: 0 }} />
        <span style={{ fontSize: '12px', color: '#475569', fontWeight: 500, lineHeight: '1.5' }}>
          <strong>Pro Tip:</strong> Acting on these recommendations can improve your predicted score by up to 15%.
        </span>
      </div>
    </Card>
  );
};

export default RecommendationBox;