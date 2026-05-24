import React from 'react';
import { Send, Plus, X, FileText } from 'lucide-react';

const ChatInput = ({ 
  input, 
  setInput, 
  handleSend, 
  isLoading, 
  attachedFile, 
  setAttachedFile, 
  fileInputRef 
}) => {
  return (
    <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white to-transparent">
      <div className="max-w-3xl mx-auto relative">
        
        {/* File Preview */}
        {attachedFile && (
          <div className="absolute -top-12 left-0 flex items-center gap-2 bg-slate-800 text-white px-3 py-1.5 rounded-lg text-xs animate-in slide-in-from-bottom-2">
            <FileText size={14} />
            <span className="max-w-[120px] truncate">{attachedFile.name}</span>
            <X size={14} className="cursor-pointer" onClick={() => setAttachedFile(null)} />
          </div>
        )}

        <form onSubmit={handleSend} className="relative flex items-center bg-slate-50 border border-slate-200 rounded-[1.5rem] p-1.5 focus-within:bg-white focus-within:ring-4 focus-within:ring-[#004751]/5 focus-within:border-[#004751]/20 transition-all duration-300">
          <button 
            type="button"
            onClick={() => fileInputRef.current.click()}
            className="p-3 text-slate-400 hover:text-[#004751] hover:bg-slate-100 rounded-full transition-colors"
          >
            <Plus size={22} />
          </button>
          
          <input 
            type="text"
            placeholder="Posez une question à Nora..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-[15px] text-slate-700 font-medium px-2 py-3"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />

          <button
            type="submit"
            disabled={isLoading || (!input.trim() && !attachedFile)}
            className={`p-3 rounded-2xl transition-all shadow-lg ${
              input.trim() || attachedFile ? 'bg-[#004751] text-white shadow-[#004751]/20' : 'bg-slate-200 text-slate-400 shadow-none'
            }`}
          >
            <Send size={20} />
          </button>
        </form>
        
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          onChange={(e) => setAttachedFile(e.target.files[0] || null)}
        />
        <div className="mt-3 text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest opacity-60">
            Nora AI peut faire des erreurs. Vérifiez les informations importantes.
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;