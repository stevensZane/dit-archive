import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const TEAL_GRADIENT = ['#004751', '#0D5C67', '#1A727D', '#288894', '#389FAA', '#4BB6C1', '#62CDD8', '#7EE5EF'];

const TechDistributionChart = ({ data }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-[360px]">
    <h3 className="text-base font-bold text-slate-800 mb-4">Stack Technologique</h3>
    <ResponsiveContainer width="100%" height="85%">
      <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20, top: 0, bottom: 0 }}>
        <XAxis type="number" hide />
        <YAxis dataKey="technology" type="category" axisLine={false} tickLine={false} className="text-xs font-medium text-slate-600" width={90} />
        <Tooltip cursor={{ fill: '#F8FAFC' }} contentStyle={{ borderRadius: '12px', borderColor: '#E2E8F0', fontSize: '12px' }} />
        <Bar dataKey="count" radius={[0, 8, 8, 0]}>
          {data.map((_, index) => (
            <Cell key={`tech-cell-${index}`} fill={TEAL_GRADIENT[index % TEAL_GRADIENT.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  </div>
);

export default TechDistributionChart;