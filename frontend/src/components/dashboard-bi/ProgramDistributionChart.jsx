import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const PALETTE = ['#004751', '#3B82F6', '#6366F1', '#10B981', '#F59E0B'];

const ProgramDistributionChart = ({ data }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-[360px]">
    <h3 className="text-base font-bold text-slate-800 mb-2">🎓 Projets par Filière</h3>
    <ResponsiveContainer width="100%" height="85%">
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="program"
          cx="50%"
          cy="45%"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={4}
        >
          {data.map((_, index) => (
            <Cell key={`program-cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={{ borderRadius: '12px', borderColor: '#E2E8F0', fontSize: '12px' }} />
        <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
      </PieChart>
    </ResponsiveContainer>
  </div>
);

export default ProgramDistributionChart;