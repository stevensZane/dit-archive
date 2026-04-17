// import React, { useState, useEffect, useRef } from 'react';
// import { Send, Sparkles, RefreshCw, User, Bot, ExternalLink } from 'lucide-react'; // Ajout de ExternalLink
// import ReactMarkdown from 'react-markdown';
// import api from './api/axios';
// import Navbar from './Navbar';

// const NoraChat = () => {
//   const [messages, setMessages] = useState(() => {
//     const savedChat = localStorage.getItem('nora_chat_history');
//     return savedChat ? JSON.parse(savedChat) : [{
//       role: 'nora',
//       content: "Je suis Nora. Je connais chaque projet archivé au DIT. Posez-moi une question technique ou demandez-moi de trouver un projet spécifique."
//     }];
//   });

//   const [input, setInput] = useState("");
//   const [isLoading, setIsLoading] = useState(false);
//   const scrollRef = useRef(null);

//   useEffect(() => {
//     if (messages.length > 0) {
//       localStorage.setItem('nora_chat_history', JSON.stringify(messages));
//     }
//     scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
//   }, [messages]);

//   const handleSend = async (e) => {
//     e.preventDefault();
//     if (!input.trim() || isLoading) return;

//     const userQuery = input;
//     const userMessage = { role: 'user', content: userQuery };
    
//     setMessages(prev => [...prev, userMessage]);
//     setInput("");
//     setIsLoading(true);

//     try {
//       const response = await api.post('/chatbot/ask', { 
//         query: userQuery, 
//         history: messages.slice(-3) 
//       });

//       const noraMessage = { 
//         role: 'nora', 
//         content: response.data.answer,
//         sources: response.data.sources || [] // Stockage des sources
//       };

//       setMessages(prev => [...prev, noraMessage]);

//     } catch (error) {
//       console.error("Erreur Nora:", error);
//       setMessages(prev => [...prev, { 
//         role: 'nora', 
//         content: "Désolée, je n'ai pas pu accéder à mes archives pour le moment." 
//       }]);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const resetChat = () => {
//     if (window.confirm("Voulez-vous effacer la conversation et recommencer ?")) {
//       localStorage.removeItem('nora_chat_history');
//       setMessages([{
//         role: 'nora',
//         content: "Je suis Nora. Je connais chaque projet archivé au DIT. Posez-moi une question technique ou demandez-moi de trouver un projet spécifique."
//       }]);
//     }
//   };

//   return (
//     <>
//       <Navbar/>
//       <div className="flex flex-col h-[85vh] max-w-5xl mx-auto bg-white rounded-[2rem] border border-gray-100 overflow-hidden">
        
//         {/* HEADER */}
//         <div className="px-8 py-6 flex justify-between items-center border-b border-gray-50">
//           <div className="flex items-center gap-4">
//             <div className="relative">
//               <div className="w-12 h-12 bg-[#004751] rounded-2xl flex items-center justify-center">
//                 <Sparkles size={22} className="text-white" />
//               </div>
//               <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
//             </div>
//             <div>
//               <h1 className="text-xl font-black text-[#004751] tracking-tight">Nora</h1>
//               <div className="flex items-center gap-1.5">
//                 <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Intelligence Archive</span>
//               </div>
//             </div>
//           </div>

//           <button 
//             onClick={resetChat}
//             className="group flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-100 text-gray-400 hover:text-[#E91E63] hover:border-[#E91E63]/20 hover:bg-[#E91E63]/5 transition-all duration-300"
//           >
//             <RefreshCw size={16} className="group-hover:rotate-180 transition-transform duration-500" />
//             <span className="text-xs font-bold uppercase tracking-tighter">Nouvelle discussion</span>
//           </button>
//         </div>

//         {/* ZONE DE CHAT */}
//         <div className="flex-1 overflow-y-auto px-8 py-8 space-y-8 bg-[#fdfdfd]">
//           {messages.map((msg, idx) => (
//             <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
//               <div className={`flex gap-4 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                
//                 <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-1 ${msg.role === 'user' ? 'bg-gray-100 text-gray-400' : 'bg-[#E91E63]/10 text-[#E91E63]'}`}>
//                   {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
//                 </div>

//                 <div className={`px-6 py-4 rounded-3xl text-[15px] leading-relaxed shadow-sm ${
//                   msg.role === 'user' 
//                   ? 'bg-[#004751] text-white rounded-tr-none' 
//                   : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'
//                 }`}>
//                   {/* Contenu Markdown */}
//                   <div className="markdown-container
//                     prose prose-sm prose-slate max-w-none 
//                     prose-p:leading-relaxed 
//                     prose-headings:text-[#004751] 
//                     prose-strong:text-[#E91E63] 
//                     prose-strong:font-bold
//                     prose-ul:list-disc
//                   ">
//                     <ReactMarkdown>{msg.content}</ReactMarkdown>
//                   </div>

//                   {/* Affichage des SOURCES */}
//                   {msg.role === 'nora' && msg.sources && msg.sources.length > 0 && (
//                     <div className="mt-4 pt-3 border-t border-gray-50">
//                       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Sources consultées :</p>
//                       <div className="flex flex-wrap gap-2">
//                         {msg.sources.map((source, i) => (
//                           <a 
//                             key={i}
//                             href={source.url} 
//                             target="_blank" 
//                             rel="noopener noreferrer"
//                             className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 hover:bg-[#E91E63]/5 hover:text-[#E91E63] text-[#004751] rounded-lg border border-gray-100 transition-all duration-200 text-xs font-medium"
//                           >
//                             <ExternalLink size={12} />
//                             {source.title}
//                           </a>
//                         ))}
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             </div>
//           ))}  
//           {isLoading && (
//             <div className="flex justify-start pl-12">
//               <div className="flex gap-1">
//                 <div className="w-1.5 h-1.5 bg-[#E91E63] rounded-full animate-bounce"></div>
//                 <div className="w-1.5 h-1.5 bg-[#E91E63] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
//                 <div className="w-1.5 h-1.5 bg-[#E91E63] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
//               </div>
//             </div>
//           )}
//           <div ref={scrollRef} />
//         </div>

//         {/* ZONE DE SAISIE */}
//         <div className="p-8 bg-white">
//           <form onSubmit={handleSend} className="relative group">
//             <textarea
//               rows="1"
//               className="w-full pl-6 pr-16 py-5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#004751]/10 outline-none transition-all resize-none text-gray-700 placeholder:text-gray-400"
//               placeholder="Demander n'importe quoi sur les archives..."
//               value={input}
//               onChange={(e) => setInput(e.target.value)}
//               onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend(e)}
//             />
//             <button
//               type="submit"
//               disabled={isLoading || !input.trim()}
//               className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center bg-[#004751] text-white rounded-xl hover:bg-[#E91E63] disabled:bg-gray-200 disabled:text-gray-400 transition-all duration-300 shadow-lg shadow-[#004751]/10"
//             >
//               <Send size={18} />
//             </button>
//           </form>
//           <div className="mt-4 flex justify-center gap-6 text-[10px] font-bold text-gray-300 uppercase tracking-widest">
//               <span>Nora peut faire des erreurs. Vérifiez les rapports originaux.</span>
//               <span>DIT Archive AI • Knowledge Base v1.0</span>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// };

// export default NoraChat;

import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, RefreshCw, User, Bot, ExternalLink, Plus, Paperclip, X, File, code, BookOpen, Search } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import api from './api/axios';
import Navbar from './Navbar';

const NoraChat = () => {
  const [messages, setMessages] = useState(() => {
    const savedChat = localStorage.getItem('nora_chat_history');
    return savedChat ? JSON.parse(savedChat) : [{
      role: 'nora',
      content: "Je suis Nora. Je connais chaque projet archivé au DIT. Posez-moi une question technique ou demandez-moi de trouver un projet spécifique."
    }];
  });

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('nora_chat_history', JSON.stringify(messages));
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if ((!input.trim() && !attachedFile) || isLoading) return;

    const userQuery = input;
    const userMessage = { 
      role: 'user', 
      content: userQuery,
      hasFile: !!attachedFile,
      fileName: attachedFile?.name 
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setAttachedFile(null);
    setIsLoading(true);

    try {
      const response = await api.post('/chatbot/ask', { 
        query: userQuery, 
        history: messages.slice(-3) 
      });

      setMessages(prev => [...prev, { 
        role: 'nora', 
        content: response.data.answer,
        sources: response.data.sources || [] 
      }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'nora', 
        content: "Désolée, mon système de recherche est momentanément indisponible." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setAttachedFile(file);
    setShowMenu(false);
  };

  return (
    <>
      <Navbar />
      <div className="max-w-5xl mx-auto mt-24 mb-10 h-[82vh] flex flex-col bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        
        {/* HEADER AMÉLIORÉ */}
        <div className="px-8 py-5 flex justify-between items-center bg-white/80 backdrop-blur-md border-b border-slate-50 z-10">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="absolute inset-0 bg-[#004751] blur-lg opacity-20 group-hover:opacity-40 transition-opacity"></div>
              <div className="relative w-12 h-12 bg-[#004751] rounded-2xl flex items-center justify-center">
                <Sparkles size={22} className="text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-800 tracking-tight leading-none mb-1">Nora AI</h1>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">DIT Intelligence Core</span>
            </div>
          </div>

          <button 
            onClick={() => setMessages([{ role: 'nora', content: "Conversation réinitialisée. Comment puis-je vous aider ?" }])}
            className="p-3 rounded-xl text-slate-400 hover:text-[#E91E63] hover:bg-[#E91E63]/5 transition-all"
            title="Nouvelle discussion"
          >
            <RefreshCw size={20} />
          </button>
        </div>

        {/* ZONE DE CHAT AVEC BULLLES ÉLÉGANTES */}
        <div className="flex-1 overflow-y-auto px-6 md:px-12 py-8 space-y-10 bg-[#FBFCFE]">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex gap-4 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                  msg.role === 'user' ? 'bg-slate-800 text-white' : 'bg-white border border-slate-100 text-[#E91E63]'
                }`}>
                  {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
                </div>

                <div className="space-y-2">
                  <div className={`px-6 py-4 rounded-[2rem] text-[15px] leading-relaxed shadow-sm ${
                    msg.role === 'user' 
                    ? 'bg-[#004751] text-white rounded-tr-none' 
                    : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none'
                  }`}>
                    {msg.fileName && (
                      <div className="mb-3 flex items-center gap-2 bg-black/10 px-3 py-2 rounded-lg text-xs font-medium">
                        <FileCode size={14} /> {msg.fileName}
                      </div>
                    )}
                    <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-strong:text-[#E91E63]">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  </div>

                  {/* Sources style "Chips" */}
                  {msg.role === 'nora' && msg.sources?.length > 0 && (
                    <div className="flex flex-wrap gap-2 px-2">
                      {msg.sources.map((source, i) => (
                        <a key={i} href={source.url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-100 rounded-full text-[11px] font-bold text-slate-500 hover:text-[#004751] hover:border-[#004751] transition-all">
                          <ExternalLink size={10} /> {source.title}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start pl-14">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-[#E91E63] rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-[#E91E63] rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-2 h-2 bg-[#E91E63] rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        {/* ZONE DE SAISIE "FLOATING" */}
        <div className="p-6 bg-white border-t border-slate-50">
          <div className="relative max-w-4xl mx-auto">
            
            {/* Prévisualisation fichier */}
            {attachedFile && (
              <div className="absolute -top-14 left-0 flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-xl text-xs animate-in slide-in-from-bottom-2">
                <Paperclip size={14} />
                <span className="max-w-[150px] truncate">{attachedFile.name}</span>
                <button onClick={() => setAttachedFile(null)} className="ml-2 hover:text-red-400">
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Menu d'actions rapides (Plus) */}
            {showMenu && (
              <div className="absolute bottom-20 left-0 w-64 bg-white border border-slate-100 rounded-2xl shadow-2xl p-2 animate-in fade-in zoom-in-95 z-20">
                <p className="text-[10px] font-black text-slate-400 uppercase p-3 tracking-widest">Actions rapides</p>
                <button onClick={() => { setInput("Quels sont les derniers projets React ?"); setShowMenu(false); }} className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl text-sm font-medium text-slate-600">
                  <Search size={16} className="text-[#004751]" /> Rechercher technos
                </button>
                <button onClick={() => fileInputRef.current.click()} className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl text-sm font-medium text-slate-600">
                  <Paperclip size={16} className="text-[#E91E63]" /> Joindre un document
                </button>
              </div>
            )}

            <form onSubmit={handleSend} className="relative flex items-end gap-3 bg-slate-50 p-3 rounded-[2rem] border border-slate-100 focus-within:border-[#004751]/20 transition-all">
              <button 
                type="button"
                onClick={() => setShowMenu(!showMenu)}
                className={`p-3 rounded-2xl transition-all ${showMenu ? 'bg-[#004751] text-white rotate-45' : 'bg-white text-slate-400 hover:text-slate-600 shadow-sm'}`}
              >
                <Plus size={22} />
              </button>

              <textarea
                rows="1"
                placeholder="Demandez n'importe quoi à Nora..."
                className="flex-1 bg-transparent border-none focus:ring-0 resize-none py-3 text-slate-700 font-medium placeholder:text-slate-400"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend(e)}
              />

              <button
                type="submit"
                disabled={isLoading || (!input.trim() && !attachedFile)}
                className="p-4 bg-[#004751] text-white rounded-2xl hover:bg-[#E91E63] disabled:bg-slate-200 disabled:text-slate-400 transition-all shadow-lg shadow-[#004751]/10"
              >
                <Send size={20} />
              </button>
            </form>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.txt"
            />

            <div className="mt-4 flex justify-center gap-8 text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">
               <span className="flex items-center gap-1"><BookOpen size={10}/> Knowledge v1.4</span>
               <span>DIT Archive Proprietary AI</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default NoraChat;