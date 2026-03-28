import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card } from 'antd';

const PerformanceChart = ({ data = [] }) => {
  return (
    <Card title="Performance Over Time">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="score" stroke="#1890ff" />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default PerformanceChart;
