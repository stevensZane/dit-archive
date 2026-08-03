import React from 'react';
import { Award, ThumbsUp, FolderGit2 } from 'lucide-react';

const TopStudentsLeaderboard = ({ students }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
    <h3 className="text-base font-bold text-slate-800 mb-4">Leaderboard des Étudiants Top Performance</h3>
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <th className="pb-3">Rang & Étudiant</th>
            <th className="pb-3 text-center">Niveau</th>
            <th className="pb-3 text-center">Ligue</th>
            <th className="pb-3 text-center">Projets</th>
            <th className="pb-3 text-center">Likes Reçus</th>
            <th className="pb-3 text-right">Points BI</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50 text-xs font-medium text-slate-700">
          {students.map((s, idx) => (
            <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
              <td className="py-3 flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  idx === 0 ? 'bg-amber-100 text-amber-700' :
                  idx === 1 ? 'bg-slate-200 text-slate-700' :
                  idx === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-50 text-slate-500'
                }`}>
                  {idx + 1}
                </span>
                <div>
                  <p className="font-semibold text-slate-900">{s.name}</p>
                  <p className="text-[10px] text-slate-400">{s.rank_title}</p>
                </div>
              </td>
              <td className="py-3 text-center font-bold text-slate-600">{s.level}</td>
              <td className="py-3 text-center">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 rounded-md text-[11px] font-semibold text-slate-700">
                  {s.league?.badge} {s.league?.name}
                </span>
              </td>
              <td className="py-3 text-center">
                <span className="inline-flex items-center gap-1 text-slate-600">
                  <FolderGit2 size={13} /> {s.project_count}
                </span>
              </td>
              <td className="py-3 text-center">
                <span className="inline-flex items-center gap-1 text-slate-600">
                  <ThumbsUp size={13} /> {s.likes}
                </span>
              </td>
              <td className="py-3 text-right font-bold text-[#004751]">
                <span className="inline-flex items-center gap-1">
                  <Award size={13} /> {s.points} pts
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default TopStudentsLeaderboard;