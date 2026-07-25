import React from 'react';
import { Eye, Download, Star } from 'lucide-react';

const TopProjectsTable = ({ projects }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
    <h3 className="text-base font-bold text-slate-800 mb-4">🏆 Projets les Plus Impactants</h3>
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <th className="pb-3">Projet</th>
            <th className="pb-3">Auteur</th>
            <th className="pb-3 text-center">Vues</th>
            <th className="pb-3 text-center">Téléchargements</th>
            <th className="pb-3 text-right">Score Nora</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50 text-xs font-medium text-slate-700">
          {projects.map((p) => (
            <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
              <td className="py-3 font-semibold text-slate-900">{p.title}</td>
              <td className="py-3 text-slate-500">{p.author}</td>
              <td className="py-3 text-center">
                <span className="inline-flex items-center gap-1 text-slate-600">
                  <Eye size={13} /> {p.views}
                </span>
              </td>
              <td className="py-3 text-center">
                <span className="inline-flex items-center gap-1 text-slate-600">
                  <Download size={13} /> {p.downloads}
                </span>
              </td>
              <td className="py-3 text-right">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 text-amber-700 rounded-md font-bold">
                  <Star size={11} fill="currentColor" /> {p.nora_score ? p.nora_score.toFixed(1) : 'N/A'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default TopProjectsTable;