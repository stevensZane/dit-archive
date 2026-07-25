import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const NoraInsightsChart = ({ data }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-[360px]">
    <h3 className="text-base font-bold text-slate-800 mb-2">🤖 Interactions IA Nora par Filière</h3>
    <ResponsiveContainer width="100%" height="85%">
      <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <XAxis dataKey="program" axisLine={false} tickLine={false} className="text-xs font-medium text-slate-600" />
        <YAxis axisLine={false} tickLine={false} className="text-xs font-medium text-slate-600" />
        <Tooltip contentStyle={{ borderRadius: '12px', borderColor: '#E2E8F0', fontSize: '12px' }} />
        <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
        <Bar dataKey="total_questions" name="Questions posées" fill="#004751" radius={[6, 6, 0, 0]} />
        <Bar dataKey="negative_feedbacks" name="Retours négatifs" fill="#F43F5E" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

export default NoraInsightsChart;