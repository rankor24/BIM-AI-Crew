import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { TaskCompletionData } from '../types';

interface ProductivityChartProps {
  data: TaskCompletionData[];
}

const ProductivityChart: React.FC<ProductivityChartProps> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" stroke="#64748B" />
        <YAxis allowDecimals={false} label={{ value: 'Tasks', angle: -90, position: 'insideLeft', fill: '#64748B' }} stroke="#64748B" />
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            border: '1px solid #E2E8F0',
            borderRadius: '0.5rem',
          }}
        />
        <Legend />
        <Bar dataKey="tasksCompleted" fill="#3B82F6" name="Tasks Completed" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default ProductivityChart;