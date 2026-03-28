import React from 'react';
import { Card, Statistic, Row, Col } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';

const StatsCard = ({ title, value, suffix = '', prefix = '', valueStyle = {}, trend = null }) => {
  return (
    <Card>
      <Statistic
        title={title}
        value={value}
        suffix={suffix}
        prefix={prefix}
        valueStyle={valueStyle}
      />
      {trend && (
        <div style={{ marginTop: '8px', fontSize: '12px' }}>
          {trend > 0 ? (
            <ArrowUpOutlined style={{ color: '#52c41a', marginRight: '4px' }} />
          ) : (
            <ArrowDownOutlined style={{ color: '#f5222d', marginRight: '4px' }} />
          )}
          <span>{Math.abs(trend)}% vs last period</span>
        </div>
      )}
    </Card>
  );
};

export default StatsCard;
