import React from 'react';

const StatCard = ({ title, value, icon: Icon, colorClass, badgeText }) => (
  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</p>
      <h3 className="text-2xl font-bold text-slate-800 mt-1">{value?.toLocaleString() || 0}</h3>
      {badgeText && (
        <span className="inline-block mt-2 text-[11px] font-medium text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
          {badgeText}
        </span>
      )}
    </div>
    <div className={`p-3 rounded-xl ${colorClass}`}>
      <Icon size={22} />
    </div>
  </div>
);

export default StatCard;