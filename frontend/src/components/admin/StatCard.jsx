import React from 'react';

const StatCard = ({ icon, label, value }) => {
    return (
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-6 group hover:border-purple-100 transition-all duration-300">
            {/* L'icône avec un petit effet de scale au hover */}
            <div className="p-4 rounded-2xl bg-slate-50 group-hover:bg-purple-50 group-hover:text-purple-600 transition-colors duration-300">
                {icon}
            </div>
            
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">
                    {label}
                </p>
                <p className="text-3xl font-black text-slate-900 tracking-tighter">
                    {value}
                </p>
            </div>
        </div>
    );
};

export default StatCard;