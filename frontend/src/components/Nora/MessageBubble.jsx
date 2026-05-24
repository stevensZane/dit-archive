import React from 'react';
import { User, ExternalLink } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import NoraAvatar from './NoraAvatar';

const MessageBubble = ({ msg }) => {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-8 animate-in fade-in slide-in-from-bottom-2`}>
      <div className={`flex gap-4 max-w-[85%] ${isUser ? 'flex-row-reverse' : ''}`}>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
          isUser ? 'bg-slate-800 text-white' : 'bg-white border border-slate-100 text-[#004751]'
        }`}>
          {isUser ? <User size={18} /> : <NoraAvatar size="sm" />}
        </div>
        <div className="space-y-2">
          <div className={`px-5 py-3.5 rounded-[1.5rem] text-[15px] leading-relaxed shadow-sm border ${
            isUser 
              ? 'bg-[#004751] text-white border-transparent rounded-tr-none' 
              : 'bg-white text-slate-700 border-slate-100 rounded-tl-none'
          }`}>
            {msg.fileName && (
              <div className={`prose prose-sm max-w-none ${isUser ? 'prose-invert' : 'prose-slate'} 
              prose-ul:list-disc prose-ul:ml-4 prose-li:my-0 mb-2`}>
                <ReactMarkdown>{`📄 **Fichier joint :** ${msg.fileName}`}</ReactMarkdown>
              </div>
            )}
            <div className={`prose prose-sm max-w-none prose-li:list-disc ${isUser ? 'prose-invert' : 'prose-slate'}`}>
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>
          </div>
          {msg.sources?.length > 0 && (
            <div className="flex flex-wrap gap-2 px-2">
              {msg.sources.map((source, i) => (
                <a key={i} href={source.url} target="_blank" rel="noreferrer" 
                   className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-100 rounded-full text-[10px] font-bold text-slate-500 hover:text-[#004751] transition-all">
                  <ExternalLink size={10} /> {source.title}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;