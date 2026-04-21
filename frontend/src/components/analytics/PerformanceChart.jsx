import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card } from 'antd';

const PerformanceChart = ({ data = [] }) => {
  return (
    <Card 
      title={<span style={{ fontWeight: 700, fontSize: '15px', color: '#0f172a' }}>Performance Over Time</span>}
      style={{
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        background: 'linear-gradient(135deg, #ffffff 0%, rgba(248, 250, 252, 0.8) 100%)',
      }}
    >
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="date" stroke="#64748b" style={{ fontSize: '12px' }} />
          <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
          <Tooltip 
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
            }}
          />
          <Legend 
            wrapperStyle={{ fontSize: '13px', fontWeight: 600 }}
          />
          <Line 
            type="monotone" 
            dataKey="score" 
            stroke="#f59e0b"
            strokeWidth={3}
            dot={{ fill: '#f59e0b', r: 5 }}
            activeDot={{ r: 7 }}
            isAnimationActive={true}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default PerformanceChart;
