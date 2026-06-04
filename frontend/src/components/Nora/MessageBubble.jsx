import React, { useState } from 'react';
import { User, Copy, Check, ThumbsUp, ThumbsDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import api from '../api/axios';
import NoraAvatar from './NoraAvatar';

const MessageBubble = ({ msg, chat_id }) => {
  const isUser = msg.role === 'user';
  const [feedback, setFeedback] = useState(null); // 'positive', 'negative' ou null
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFeedback = async (type) => {
    if (feedback === type) return;
    setFeedback(type);

    try {
      await api.post('/chatbot/feedback', {
        chat_id: chat_id,
        has_negative_feedback: type === 'negative'
      });
    } catch (error) {
      console.error("Erreur lors de l'envoi du feedback", error);
    }
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-8 animate-in fade-in slide-in-from-bottom-2`}>
      <div className={`flex gap-4 max-w-[85%] ${isUser ? 'flex-row-reverse' : ''}`}>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
          isUser ? 'bg-slate-800 text-white' : 'bg-white border border-slate-100 text-[#004751]'
        }`}>
          {isUser ? <User size={18} /> : <NoraAvatar size="sm" />}
        </div>
        <div className="space-y-2">
          <div className={`px-5 py-4 rounded-[1.5rem] text-[15px] leading-relaxed shadow-sm border ${
            isUser 
              ? 'bg-[#004751] text-white border-transparent rounded-tr-none' 
              : 'bg-white text-slate-700 border-slate-100 rounded-tl-none'
          }`}>
            {msg.fileName && (
              <div className={`prose prose-sm max-w-none ${isUser ? 'prose-invert' : 'prose-slate'} mb-3`}>
                <ReactMarkdown>{`📄 **Fichier joint :** ${msg.fileName}`}</ReactMarkdown>
              </div>
            )}
            
            {/* 🎨 ZONE DE RENDU EXTÉRIEURE INTÉGRANT LES CLASSES SUR-MESURE */}
            <div className={`prose max-w-none 
              ${isUser ? 'prose-invert text-white' : 'prose-slate text-slate-700'}
              
              /* Style des Titres (H3) */
              prose-h3:text-base prose-h3:font-black prose-h3:text-[#004751] prose-h3:mt-4 prose-h3:mb-2 prose-h3:flex prose-h3:items-center prose-h3:gap-2
              
              /* Forçage et aération des listes à puces */
              prose-ul:list-disc prose-ul:pl-5 prose-ul:my-2 prose-ul:space-y-2
              prose-li:my-0 prose-li:leading-relaxed
              
              /* Mise en valeur colorée des éléments en **Gras** chez Nora */
              ${!isUser ? 'prose-strong:text-[#004751] prose-strong:font-extrabold prose-strong:bg-[#004751]/5 prose-strong:px-1.5 prose-strong:py-0.5 prose-strong:rounded-md' : 'prose-strong:text-white prose-strong:font-bold'}
              
              /* Paragraphes fluides */
              prose-p:mb-3 prose-p:leading-relaxed
            `}>
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>
          </div>

          {/* PETITE BARRE D'ACTIONS UNIQUE POUR NORA (Copie + Likes) */}
          {!isUser && (
            <div className="flex items-center gap-3 px-3 text-slate-400 text-xs transition-opacity duration-200">
              <button 
                onClick={handleCopy}
                className="flex items-center gap-1 hover:text-slate-600 transition-colors"
                title="Copier la réponse"
              >
                {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                <span>{copied ? 'Copié' : 'Copier'}</span>
              </button>
              
              <span className="text-slate-200">|</span>

              <button 
                onClick={() => handleFeedback('positive')}
                className={`hover:text-emerald-600 transition-colors ${feedback === 'positive' ? 'text-emerald-500 font-bold scale-110' : ''}`}
              >
                <ThumbsUp size={12} />
              </button>

              <button 
                onClick={() => handleFeedback('negative')}
                className={`hover:text-red-600 transition-colors ${feedback === 'negative' ? 'text-red-500 font-bold scale-110' : ''}`}
              >
                <ThumbsDown size={12} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;