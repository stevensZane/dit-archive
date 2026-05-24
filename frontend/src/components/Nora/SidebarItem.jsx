import React from 'react';
import { MessageSquare, Trash2 } from 'lucide-react';

const SidebarItem = ({ chat, active, onClick, onDelete }) => (
  <div 
    onClick={onClick}
    className={`group flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 ${
      active ? 'bg-white/10 text-white shadow-sm' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
    }`}
  >
    <div className="flex items-center gap-3 overflow-hidden">
      <MessageSquare size={16} className={active ? 'text-[#E91E63]' : 'text-slate-500'} />
      <span className="text-sm font-medium truncate">{chat.title || "Nouvelle discussion"}</span>
    </div>
    <button 
      onClick={(e) => { e.stopPropagation(); onDelete(chat.id); }}
      className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity"
    >
      <Trash2 size={14} />
    </button>
  </div>
);

export default SidebarItem;