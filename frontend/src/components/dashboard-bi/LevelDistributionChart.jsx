import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const LevelDistributionChart = ({ data }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-[360px]">
    <h3 className="text-base font-bold text-slate-800 mb-4">Volume par Niveau Académique</h3>
    <ResponsiveContainer width="100%" height="85%">
      <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <XAxis dataKey="level" axisLine={false} tickLine={false} className="text-xs font-medium text-slate-600" />
        <YAxis axisLine={false} tickLine={false} className="text-xs font-medium text-slate-600" />
        <Tooltip cursor={{ fill: '#F8FAFC' }} contentStyle={{ borderRadius: '12px', borderColor: '#E2E8F0', fontSize: '12px' }} />
        <Bar dataKey="count" fill="#389FAA" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

export default LevelDistributionChart;