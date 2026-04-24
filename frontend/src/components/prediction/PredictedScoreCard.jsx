import React from 'react';
import { Card, Progress, Space, Tag } from 'antd';
import { RiseOutlined, FallOutlined, TrophyOutlined, FireOutlined } from '@ant-design/icons';
import './PredictedScoreCard.css';

const PredictedScoreCard = ({ subject, predictedScore, currentScore, trend, confidence }) => {
  const improvement = predictedScore - (currentScore || 0);
  const isPositive = improvement >= 0;
  
  // Score color logic
  const getScoreColor = (score) => {
    if (score >= 75) return '#16a34a';
    if (score >= 55) return '#f59e0b';
    return '#dc2626';
  };

  const scoreColor = getScoreColor(predictedScore);
  const currentColor = getScoreColor(currentScore || 0);

  // Grade calculation
  const getGrade = (score) => {
    if (score >= 85) return 'A+';
    if (score >= 75) return 'A';
    if (score >= 65) return 'B+';
    if (score >= 55) return 'B';
    if (score >= 45) return 'C';
    if (score >= 35) return 'D';
    return 'F';
  };

  return (
    <Card
      className="predicted-score-card"
      hoverable
      style={{
        borderRadius: '18px',
        border: `2px solid ${scoreColor}20`,
        background: `linear-gradient(135deg, #ffffff 0%, ${scoreColor}08 100%)`,
        transition: 'all 350ms cubic-bezier(0.16, 1, 0.3, 1)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Animated background accent */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '200px',
          height: '200px',
          background: `radial-gradient(circle, ${scoreColor}15 0%, transparent 70%)`,
          animation: 'float 8s ease-in-out infinite',
          pointerEvents: 'none',
        }}
      />

      <Space direction="vertical" style={{ width: '100%', position: 'relative', zIndex: 1 }} size={20}>
        {/* Subject Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: '16px',
                fontWeight: 800,
                color: '#0f172a',
                letterSpacing: '-0.3px',
                marginBottom: '4px',
              }}
            >
              {subject?.split(' - ')[0] || subject}
            </h3>
            <div
              style={{
                fontSize: '12px',
                color: '#64748b',
                fontWeight: 500,
                fontFamily: "'Space Mono', monospace",
              }}
            >
              {subject?.split(' - ')[1] || ''}
            </div>
          </div>
          {confidence && (
            <Tag
              style={{
                background: `${scoreColor}15`,
                border: `1.5px solid ${scoreColor}40`,
                color: scoreColor,
                fontWeight: 700,
                fontSize: '11px',
                padding: '2px 10px',
                borderRadius: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              {confidence}
            </Tag>
          )}
        </div>

        {/* Main Gauge */}
        <div style={{ textAlign: 'center', padding: '12px 0' }}>
          <Progress
            type="circle"
            percent={predictedScore}
            width={120}
            strokeWidth={10}
            strokeColor={{
              '0%': scoreColor,
              '100%': scoreColor === '#16a34a' ? '#22c55e' : scoreColor === '#f59e0b' ? '#fbbf24' : '#ef4444',
            }}
            trailColor="#e2e8f0"
            format={(percent) => (
              <div>
                <div
                  style={{
                    fontSize: '32px',
                    fontWeight: 900,
                    color: scoreColor,
                    lineHeight: 1,
                    fontFamily: "'Space Mono', monospace",
                    marginBottom: '4px',
                  }}
                >
                  {percent}%
                </div>
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: 700,
                    color: scoreColor,
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                  }}
                >
                  {getGrade(percent)}
                </div>
              </div>
            )}
          />
        </div>

        {/* Score Comparison */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            padding: '16px',
            background: 'rgba(248, 250, 252, 0.8)',
            borderRadius: '14px',
            border: '1.5px solid #e2e8f0',
          }}
        >
          {/* Current Score */}
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: '11px',
                color: '#64748b',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '6px',
              }}
            >
              Current
            </div>
            <div
              style={{
                fontSize: '24px',
                fontWeight: 800,
                color: currentColor,
                fontFamily: "'Space Mono', monospace",
              }}
            >
              {currentScore || 0}%
            </div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: currentColor }}>
              {getGrade(currentScore || 0)}
            </div>
          </div>

          {/* Predicted Score */}
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: '11px',
                color: '#64748b',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '6px',
              }}
            >
              Predicted
            </div>
            <div
              style={{
                fontSize: '24px',
                fontWeight: 800,
                color: scoreColor,
                fontFamily: "'Space Mono', monospace",
              }}
            >
              {predictedScore}%
            </div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: scoreColor }}>
              {getGrade(predictedScore)}
            </div>
          </div>
        </div>

        {/* Improvement Indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            padding: '12px 16px',
            background: isPositive
              ? 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)'
              : 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
            borderRadius: '12px',
            border: `1.5px solid ${isPositive ? '#86efac' : '#fca5a5'}`,
          }}
        >
          {isPositive ? (
            <>
              <RiseOutlined style={{ color: '#16a34a', fontSize: '20px' }} />
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#16a34a' }}>
                  +{improvement.toFixed(1)}%
                </div>
                <div style={{ fontSize: '11px', color: '#15803d', fontWeight: 600 }}>Improvement Expected</div>
              </div>
              <FireOutlined style={{ color: '#16a34a', fontSize: '20px' }} />
            </>
          ) : (
            <>
              <FallOutlined style={{ color: '#dc2626', fontSize: '20px' }} />
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#dc2626' }}>
                  {improvement.toFixed(1)}%
                </div>
                <div style={{ fontSize: '11px', color: '#b91c1c', fontWeight: 600 }}>Action Required</div>
              </div>
            </>
          )}
        </div>

        {/* Performance Indicator */}
        {predictedScore >= 75 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              justifyContent: 'center',
              padding: '8px',
              background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
              borderRadius: '10px',
              border: '1.5px solid #fbbf24',
            }}
          >
            <TrophyOutlined style={{ color: '#d97706', fontSize: '16px' }} />
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#92400e' }}>On Track for Excellence!</span>
          </div>
        )}
      </Space>
    </Card>
  );
};

export default PredictedScoreCard;