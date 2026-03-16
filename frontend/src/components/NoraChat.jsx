// import React, { useState, useEffect, useRef } from 'react';
// import { Send, Sparkles, RefreshCw, User, Bot } from 'lucide-react';
// import ReactMarkdown from 'react-markdown';
// import api from './api/axios';
// import Navbar from './Navbar';

// const NoraChat = () => {

//   const [messages, setMessages] = useState(() => {
//       const savedChat = localStorage.getItem('nora_chat_history');
//       return savedChat ? JSON.parse(savedChat) : [{
//         role: 'nora',
//         content: "Je suis Nora. Je connais chaque projet archivé au DIT. Posez-moi une question technique ou demandez-moi de trouver un projet spécifique."
//       }];
//     });

//     const [input, setInput] = useState("");
//     const [isLoading, setIsLoading] = useState(false);
//     const scrollRef = useRef(null);

//     // 2. SAUVEGARDE (On ne fait que sauvegarder ici)
//     useEffect(() => {
//       if (messages.length > 0) {
//         localStorage.setItem('nora_chat_history', JSON.stringify(messages));
//       }
//       scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
//     }, [messages]);

//     const handleSend = async (e) => {
//       e.preventDefault();
//       if (!input.trim() || isLoading) return;

//       const userQuery = input;
//       const userMessage = { role: 'user', content: userQuery };
      
//       // 1. Mise à jour immédiate de l'UI
//       setMessages(prev => [...prev, userMessage]);
//       setInput("");
//       setIsLoading(true);

//       try {
//         // 2. Appel au backend avec historique léger (-3)
//         const response = await api.post('/chatbot/ask', { 
//           query: userQuery, 
//           history: messages.slice(-3) 
//         });

//         // 3. Construction du message de Nora avec ses sources
//         const noraMessage = { 
//           role: 'nora', 
//           content: response.data.answer,
//           sources: response.data.sources || [] // On récupère les sources du backend
//         };

//         setMessages(prev => [...prev, noraMessage]);

//       } catch (error) {
//         console.error("Erreur Nora:", error);
//         setMessages(prev => [...prev, { 
//           role: 'nora', 
//           content: "Désolée, je n'ai pas pu accéder à mes archives pour le moment." 
//         }]);
//       } finally {
//         setIsLoading(false);
//       }
//     };

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
//     <div className="flex flex-col h-[85vh] max-w-5xl mx-auto bg-white rounded-[2rem] border border-gray-100 overflow-hidden">
      
//       {/* HEADER MINIMALISTE */}
//       <div className="px-8 py-6 flex justify-between items-center border-b border-gray-50">
//         <div className="flex items-center gap-4">
//           <div className="relative">
//             <div className="w-12 h-12 bg-[#004751] rounded-2xl flex items-center justify-center">
//               <Sparkles size={22} className="text-white" />
//             </div>
//             <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
//           </div>
//           <div>
//             <h1 className="text-xl font-black text-[#004751] tracking-tight">Nora</h1>
//             <div className="flex items-center gap-1.5">
//               <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Intelligence Archive</span>
//             </div>
//           </div>
//         </div>

//         <button 
//           onClick={resetChat}
//           className="group flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-100 text-gray-400 hover:text-[#E91E63] hover:border-[#E91E63]/20 hover:bg-[#E91E63]/5 transition-all duration-300"
//         >
//           <RefreshCw size={16} className="group-hover:rotate-180 transition-transform duration-500" />
//           <span className="text-xs font-bold uppercase tracking-tighter">Nouvelle discussion</span>
//         </button>
//       </div>

//       {/* ZONE DE CHAT */}
//       <div className="flex-1 overflow-y-auto px-8 py-8 space-y-8 bg-[#fdfdfd]">
//         {messages.map((msg, idx) => (
//           <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
//             <div className={`flex gap-4 max-w-[75%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              
//               {/* Avatar simple */}
//               <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-1 ${msg.role === 'user' ? 'bg-gray-100 text-gray-400' : 'bg-[#E91E63]/10 text-[#E91E63]'}`}>
//                 {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
//               </div>

//               {/* Bulle */}
//               <div className={`px-6 py-4 rounded-3xl text-[15px] leading-relaxed shadow-sm ${
//                 msg.role === 'user' 
//                 ? 'bg-[#004751] text-white rounded-tr-none' 
//                 : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'
//               }`}>
//                 <ReactMarkdown>{msg.content}</ReactMarkdown> 
//               </div>
//             </div>
//           </div>
//         ))}  
//         {isLoading && (
//           <div className="flex justify-start pl-12">
//             <div className="flex gap-1">
//               <div className="w-1.5 h-1.5 bg-[#E91E63] rounded-full animate-bounce"></div>
//               <div className="w-1.5 h-1.5 bg-[#E91E63] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
//               <div className="w-1.5 h-1.5 bg-[#E91E63] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
//             </div>
//           </div>
//         )}
//         <div ref={scrollRef} />
//       </div>

//       {/* ZONE DE SAISIE */}
//       <div className="p-8 bg-white">
//         <form onSubmit={handleSend} className="relative group">
//           <textarea
//             rows="1"
//             className="w-full pl-6 pr-16 py-5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#004751]/10 outline-none transition-all resize-none text-gray-700 placeholder:text-gray-400"
//             placeholder="Demander n'importe quoi sur les archives..."
//             value={input}
//             onChange={(e) => setInput(e.target.value)}
//             onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend(e)}
//           />
//           <button
//             type="submit"
//             disabled={isLoading || !input.trim()}
//             className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center bg-[#004751] text-white rounded-xl hover:bg-[#E91E63] disabled:bg-gray-200 disabled:text-gray-400 transition-all duration-300 shadow-lg shadow-[#004751]/10"
//           >
//             <Send size={18} />
//           </button>
//         </form>
//         <div className="mt-4 flex justify-center gap-6 text-[10px] font-bold text-gray-300 uppercase tracking-widest">
//             <span>Nora peut faire des erreurs. Vérifiez les informations dans les rapports originaux.</span>
//            <span>DIT Archive AI</span>
//            <span>•</span>
//            <span>Knowledge Base v1.0</span>
//         </div>
//       </div>
//     </div>
    
//     </>
//   );
// };

// export default NoraChat;

import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, RefreshCw, User, Bot, ExternalLink } from 'lucide-react'; // Ajout de ExternalLink
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
  const scrollRef = useRef(null);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('nora_chat_history', JSON.stringify(messages));
    }
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userQuery = input;
    const userMessage = { role: 'user', content: userQuery };
    
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await api.post('/chatbot/ask', { 
        query: userQuery, 
        history: messages.slice(-3) 
      });

      const noraMessage = { 
        role: 'nora', 
        content: response.data.answer,
        sources: response.data.sources || [] // Stockage des sources
      };

      setMessages(prev => [...prev, noraMessage]);

    } catch (error) {
      console.error("Erreur Nora:", error);
      setMessages(prev => [...prev, { 
        role: 'nora', 
        content: "Désolée, je n'ai pas pu accéder à mes archives pour le moment." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const resetChat = () => {
    if (window.confirm("Voulez-vous effacer la conversation et recommencer ?")) {
      localStorage.removeItem('nora_chat_history');
      setMessages([{
        role: 'nora',
        content: "Je suis Nora. Je connais chaque projet archivé au DIT. Posez-moi une question technique ou demandez-moi de trouver un projet spécifique."
      }]);
    }
  };

  return (
    <>
      <Navbar/>
      <div className="flex flex-col h-[85vh] max-w-5xl mx-auto bg-white rounded-[2rem] border border-gray-100 overflow-hidden">
        
        {/* HEADER */}
        <div className="px-8 py-6 flex justify-between items-center border-b border-gray-50">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 bg-[#004751] rounded-2xl flex items-center justify-center">
                <Sparkles size={22} className="text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
            </div>
            <div>
              <h1 className="text-xl font-black text-[#004751] tracking-tight">Nora</h1>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Intelligence Archive</span>
              </div>
            </div>
          </div>

          <button 
            onClick={resetChat}
            className="group flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-100 text-gray-400 hover:text-[#E91E63] hover:border-[#E91E63]/20 hover:bg-[#E91E63]/5 transition-all duration-300"
          >
            <RefreshCw size={16} className="group-hover:rotate-180 transition-transform duration-500" />
            <span className="text-xs font-bold uppercase tracking-tighter">Nouvelle discussion</span>
          </button>
        </div>

        {/* ZONE DE CHAT */}
        <div className="flex-1 overflow-y-auto px-8 py-8 space-y-8 bg-[#fdfdfd]">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
              <div className={`flex gap-4 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-1 ${msg.role === 'user' ? 'bg-gray-100 text-gray-400' : 'bg-[#E91E63]/10 text-[#E91E63]'}`}>
                  {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>

                <div className={`px-6 py-4 rounded-3xl text-[15px] leading-relaxed shadow-sm ${
                  msg.role === 'user' 
                  ? 'bg-[#004751] text-white rounded-tr-none' 
                  : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'
                }`}>
                  {/* Contenu Markdown */}
                  <div className="markdown-container
                    prose prose-sm prose-slate max-w-none 
                    prose-p:leading-relaxed 
                    prose-headings:text-[#004751] 
                    prose-strong:text-[#E91E63] 
                    prose-strong:font-bold
                    prose-ul:list-disc
                  ">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>

                  {/* Affichage des SOURCES */}
                  {msg.role === 'nora' && msg.sources && msg.sources.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-gray-50">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Sources consultées :</p>
                      <div className="flex flex-wrap gap-2">
                        {msg.sources.map((source, i) => (
                          <a 
                            key={i}
                            href={source.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 hover:bg-[#E91E63]/5 hover:text-[#E91E63] text-[#004751] rounded-lg border border-gray-100 transition-all duration-200 text-xs font-medium"
                          >
                            <ExternalLink size={12} />
                            {source.title}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}  
          {isLoading && (
            <div className="flex justify-start pl-12">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-[#E91E63] rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-[#E91E63] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-1.5 h-1.5 bg-[#E91E63] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        {/* ZONE DE SAISIE */}
        <div className="p-8 bg-white">
          <form onSubmit={handleSend} className="relative group">
            <textarea
              rows="1"
              className="w-full pl-6 pr-16 py-5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#004751]/10 outline-none transition-all resize-none text-gray-700 placeholder:text-gray-400"
              placeholder="Demander n'importe quoi sur les archives..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend(e)}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center bg-[#004751] text-white rounded-xl hover:bg-[#E91E63] disabled:bg-gray-200 disabled:text-gray-400 transition-all duration-300 shadow-lg shadow-[#004751]/10"
            >
              <Send size={18} />
            </button>
          </form>
          <div className="mt-4 flex justify-center gap-6 text-[10px] font-bold text-gray-300 uppercase tracking-widest">
              <span>Nora peut faire des erreurs. Vérifiez les rapports originaux.</span>
              <span>DIT Archive AI • Knowledge Base v1.0</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default NoraChat;