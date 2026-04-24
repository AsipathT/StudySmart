import React from 'react';
import { Card, Statistic, Row, Col } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';

const StatsCard = ({ title, value, suffix = '', prefix = '', valueStyle = {}, trend = null }) => {
  return (
    <Card
      style={{
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        background: 'linear-gradient(135deg, #ffffff 0%, rgba(248, 250, 252, 0.8) 100%)',
        transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'pointer',
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
      <Statistic
        title={
          <span style={{
            fontSize: '12px',
            fontWeight: 600,
            color: '#475569',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            {title}
          </span>
        }
        value={value}
        suffix={suffix}
        prefix={prefix}
        valueStyle={{ fontSize: '28px', fontWeight: 700, color: '#0f172a', ...valueStyle }}
      />
      {trend && (
        <div style={{ marginTop: '12px', fontSize: '13px', fontWeight: 600 }}>
          {trend > 0 ? (
            <>
              <ArrowUpOutlined style={{ color: '#16a34a', marginRight: '6px', fontSize: '14px' }} />
              <span style={{ color: '#16a34a' }}>{Math.abs(trend)}% vs last period</span>
            </>
          ) : (
            <>
              <ArrowDownOutlined style={{ color: '#dc2626', marginRight: '6px', fontSize: '14px' }} />
              <span style={{ color: '#dc2626' }}>{Math.abs(trend)}% vs last period</span>
            </>
          )}
        </div>
      )}
    </Card>
  );
};

export default StatsCard;
