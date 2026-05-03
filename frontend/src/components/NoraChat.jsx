// import React, { useState, useEffect, useRef } from 'react';
// import { Send, Sparkles, RefreshCw, User, Bot, ExternalLink, Plus, Paperclip, X, File, Code, BookOpen, Search } from 'lucide-react';
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
//   const [attachedFile, setAttachedFile] = useState(null);
//   const [showMenu, setShowMenu] = useState(false);
//   const scrollRef = useRef(null);
//   const fileInputRef = useRef(null);

//   useEffect(() => {
//     localStorage.setItem('nora_chat_history', JSON.stringify(messages));
//     scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
//   }, [messages]);

//   const handleSend = async (e) => {
//     e.preventDefault();
//     if ((!input.trim() && !attachedFile) || isLoading) return;

//     const userQuery = input;
//     const userMessage = { 
//       role: 'user', 
//       content: userQuery,
//       hasFile: !!attachedFile,
//       fileName: attachedFile?.name 
//     };
    
//     setMessages(prev => [...prev, userMessage]);
//     setInput("");
//     setAttachedFile(null);
//     setIsLoading(true);

//     try {
//       const response = await api.post('/chatbot/ask', { 
//         query: userQuery, 
//         history: messages.slice(-3) 
//       });

//       setMessages(prev => [...prev, { 
//         role: 'nora', 
//         content: response.data.answer,
//         sources: response.data.sources || [] 
//       }]);
//     } catch (error) {
//       setMessages(prev => [...prev, { 
//         role: 'nora', 
//         content: "Désolée, mon système de recherche est momentanément indisponible." 
//       }]);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleFileChange = (e) => {
//     const file = e.target.files[0];
//     if (file) setAttachedFile(file);
//     setShowMenu(false);
//   };

//   return (
//     <>
//       <Navbar />
//       <div className="max-w-5xl mx-auto mt-24 mb-10 h-[82vh] flex flex-col bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        
//         {/* HEADER AMÉLIORÉ */}
//         <div className="px-8 py-5 flex justify-between items-center bg-white/80 backdrop-blur-md border-b border-slate-50 z-10">
//           <div className="flex items-center gap-4">
//             <div className="relative group">
//               <div className="absolute inset-0 bg-[#004751] blur-lg opacity-20 group-hover:opacity-40 transition-opacity"></div>
//               <div className="relative w-12 h-12 bg-[#004751] rounded-2xl flex items-center justify-center">
//                 <Sparkles size={22} className="text-white" />
//               </div>
//               <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
//             </div>
//             <div>
//               <h1 className="text-lg font-black text-slate-800 tracking-tight leading-none mb-1">Nora AI</h1>
//               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">DIT Intelligence Core</span>
//             </div>
//           </div>

//           <button 
//             onClick={() => setMessages([{ role: 'nora', content: "Conversation réinitialisée. Comment puis-je vous aider ?" }])}
//             className="p-3 rounded-xl text-slate-400 hover:text-[#E91E63] hover:bg-[#E91E63]/5 transition-all"
//             title="Nouvelle discussion"
//           >
//             <RefreshCw size={20} />
//           </button>
//         </div>

//         {/* ZONE DE CHAT AVEC BULLLES ÉLÉGANTES */}
//         <div className="flex-1 overflow-y-auto px-6 md:px-12 py-8 space-y-10 bg-[#FBFCFE]">
//           {messages.map((msg, idx) => (
//             <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
//               <div className={`flex gap-4 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                
//                 <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
//                   msg.role === 'user' ? 'bg-slate-800 text-white' : 'bg-white border border-slate-100 text-[#E91E63]'
//                 }`}>
//                   {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
//                 </div>

//                 <div className="space-y-2">
//                   <div className={`px-6 py-4 rounded-[2rem] text-[15px] leading-relaxed shadow-sm ${
//                     msg.role === 'user' 
//                     ? 'bg-[#004751] text-white rounded-tr-none' 
//                     : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none'
//                   }`}>
//                     {msg.fileName && (
//                       <div className="mb-3 flex items-center gap-2 bg-black/10 px-3 py-2 rounded-lg text-xs font-medium">
//                         <FileCode size={14} /> {msg.fileName}
//                       </div>
//                     )}
//                     <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-strong:text-[#E91E63]">
//                       <ReactMarkdown>{msg.content}</ReactMarkdown>
//                     </div>
//                   </div>

//                   {/* Sources style "Chips" */}
//                   {msg.role === 'nora' && msg.sources?.length > 0 && (
//                     <div className="flex flex-wrap gap-2 px-2">
//                       {msg.sources.map((source, i) => (
//                         <a key={i} href={source.url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-100 rounded-full text-[11px] font-bold text-slate-500 hover:text-[#004751] hover:border-[#004751] transition-all">
//                           <ExternalLink size={10} /> {source.title}
//                         </a>
//                       ))}
//                     </div>
//                   )}
//                 </div>
//               </div>
//             </div>
//           ))}
//           {isLoading && (
//             <div className="flex justify-start pl-14">
//               <div className="flex gap-1.5">
//                 <div className="w-2 h-2 bg-[#E91E63] rounded-full animate-bounce"></div>
//                 <div className="w-2 h-2 bg-[#E91E63] rounded-full animate-bounce [animation-delay:0.2s]"></div>
//                 <div className="w-2 h-2 bg-[#E91E63] rounded-full animate-bounce [animation-delay:0.4s]"></div>
//               </div>
//             </div>
//           )}
//           <div ref={scrollRef} />
//         </div>

//         {/* ZONE DE SAISIE "FLOATING" */}
//         <div className="p-6 bg-white border-t border-slate-50">
//           <div className="relative max-w-4xl mx-auto">
            
//             {/* Prévisualisation fichier */}
//             {attachedFile && (
//               <div className="absolute -top-14 left-0 flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-xl text-xs animate-in slide-in-from-bottom-2">
//                 <Paperclip size={14} />
//                 <span className="max-w-[150px] truncate">{attachedFile.name}</span>
//                 <button onClick={() => setAttachedFile(null)} className="ml-2 hover:text-red-400">
//                   <X size={14} />
//                 </button>
//               </div>
//             )}

//             {/* Menu d'actions rapides (Plus) */}
//             {showMenu && (
//               <div className="absolute bottom-20 left-0 w-64 bg-white border border-slate-100 rounded-2xl shadow-2xl p-2 animate-in fade-in zoom-in-95 z-20">
//                 <p className="text-[10px] font-black text-slate-400 uppercase p-3 tracking-widest">Actions rapides</p>
//                 <button onClick={() => { setInput("Quels sont les derniers projets React ?"); setShowMenu(false); }} className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl text-sm font-medium text-slate-600">
//                   <Search size={16} className="text-[#004751]" /> Rechercher technos
//                 </button>
//                 <button onClick={() => fileInputRef.current.click()} className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl text-sm font-medium text-slate-600">
//                   <Paperclip size={16} className="text-[#E91E63]" /> Joindre un document
//                 </button>
//               </div>
//             )}

//             <form onSubmit={handleSend} className="relative flex items-end gap-3 bg-slate-50 p-3 rounded-[2rem] border border-slate-100 focus-within:border-[#004751]/20 transition-all">
//               <button 
//                 type="button"
//                 onClick={() => setShowMenu(!showMenu)}
//                 className={`p-3 rounded-2xl transition-all ${showMenu ? 'bg-[#004751] text-white rotate-45' : 'bg-white text-slate-400 hover:text-slate-600 shadow-sm'}`}
//               >
//                 <Plus size={22} />
//               </button>

//               <textarea
//                 rows="1"
//                 placeholder="Demandez n'importe quoi à Nora..."
//                 className="flex-1 bg-transparent border-none focus:ring-0 resize-none py-3 text-slate-700 font-medium placeholder:text-slate-400"
//                 value={input}
//                 onChange={(e) => setInput(e.target.value)}
//                 onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend(e)}
//               />

//               <button
//                 type="submit"
//                 disabled={isLoading || (!input.trim() && !attachedFile)}
//                 className="p-4 bg-[#004751] text-white rounded-2xl hover:bg-[#E91E63] disabled:bg-slate-200 disabled:text-slate-400 transition-all shadow-lg shadow-[#004751]/10"
//               >
//                 <Send size={20} />
//               </button>
//             </form>
            
//             <input 
//               type="file" 
//               ref={fileInputRef} 
//               className="hidden" 
//               onChange={handleFileChange}
//               accept=".pdf,.doc,.docx,.txt"
//             />

//             <div className="mt-4 flex justify-center gap-8 text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">
//                <span className="flex items-center gap-1"><BookOpen size={10}/> Knowledge v1.4</span>
//                <span>DIT Archive Proprietary AI</span>
//             </div>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// };

// export default NoraChat;

import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Sparkles, User, Bot, ExternalLink, Plus, 
  Paperclip, X, FileText, Search, MessageSquare, 
  Trash2, PanelLeftClose, PanelLeftOpen, Hash
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import api from './api/axios';
import Navbar from './Navbar';
import ChatHeader from './ChatHeader';
import NoraAvatar from './NoraAvatar';

// --- COMPOSANTS INTERNES ---

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
              <div className="mb-3 flex items-center gap-2 bg-black/10 px-3 py-1.5 rounded-lg text-xs font-medium">
                <FileText size={14} /> {msg.fileName}
              </div>
            )}
            <div className={`prose prose-sm max-w-none ${isUser ? 'prose-invert' : 'prose-slate'}`}>
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

// --- COMPOSANT PRINCIPAL ---

const NoraChat = () => {
  const [chats, setChats] = useState(() => {
    const saved = localStorage.getItem('nora_chats');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [activeChatId, setActiveChatId] = useState(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [attachedFile, setAttachedFile] = useState(null);
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);

  const activeChat = chats.find(c => c.id === activeChatId);

  // Initialisation : créer un chat si vide
  useEffect(() => {
    if (chats.length === 0) {
      handleNewChat();
    } else if (!activeChatId) {
      setActiveChatId(chats[0].id);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('nora_chats', JSON.stringify(chats));
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chats]);

  const handleNewChat = () => {
    const newChat = {
      id: Date.now(),
      title: "Nouvelle discussion",
      messages: [{ role: 'nora', content: "Bonjour ! Je suis Nora. Comment puis-je vous aider aujourd'hui ?" }]
    };
    setChats([newChat, ...chats]);
    setActiveChatId(newChat.id);
  };

  const deleteChat = (id) => {
    const updated = chats.filter(c => c.id !== id);
    setChats(updated);
    if (activeChatId === id && updated.length > 0) setActiveChatId(updated[0].id);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if ((!input.trim() && !attachedFile) || isLoading || !activeChatId) return;

    const userQuery = input;
    const userMessage = { 
      role: 'user', 
      content: userQuery,
      fileName: attachedFile?.name 
    };

    // Mise à jour locale pour affichage immédiat
    const updatedChats = chats.map(chat => {
      if (chat.id === activeChatId) {
        const isFirstMessage = chat.messages.length <= 1;
        return {
          ...chat,
          title: isFirstMessage ? userQuery.substring(0, 25) : chat.title,
          messages: [...chat.messages, userMessage]
        };
      }
      return chat;
    });

    setChats(updatedChats);
    setInput("");
    setAttachedFile(null);
    setIsLoading(true);

    try {
      const response = await api.post('/chatbot/ask', { 
        query: userQuery, 
        history: activeChat.messages.slice(-5) 
      });

      const noraResponse = { 
        role: 'nora', 
        content: response.data.answer,
        sources: response.data.sources || [] 
      };

      setChats(prev => prev.map(chat => 
        chat.id === activeChatId ? { ...chat, messages: [...chat.messages, noraResponse] } : chat
      ));
    } catch (error) {
      setChats(prev => prev.map(chat => 
        chat.id === activeChatId ? { 
          ...chat, 
          messages: [...chat.messages, { role: 'nora', content: "Erreur de connexion. Veuillez réessayer." }] 
        } : chat
      ));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
      {/* SIDEBAR - Style ChatGPT/Notion */}
      <aside className={`bg-[#0F172A] transition-all duration-300 ease-in-out flex flex-col border-r border-white/5 ${
        isSidebarOpen ? 'w-[280px]' : 'w-0'
      }`}>
        {/* Header Sidebar */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#004751] rounded-lg flex items-center justify-center">
              <Sparkles size={16} className="text-white" />
            </div>
            <span className="font-bold text-white tracking-tight">Nora AI</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="text-slate-500 hover:text-white transition-colors">
            <PanelLeftClose size={18} />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="px-4 mb-4">
          <button 
            onClick={handleNewChat}
            className="w-full flex items-center gap-2 px-3 py-2.5 bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 rounded-xl text-sm font-semibold transition-all group"
          >
            <Plus size={16} className="group-hover:rotate-90 transition-transform" />
            Nouvelle discussion
          </button>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto px-2 space-y-1 custom-scrollbar">
          <p className="text-[10px] font-black text-slate-500 uppercase px-3 py-4 tracking-widest">Récent</p>
          {chats.map(chat => (
            <SidebarItem 
              key={chat.id} 
              chat={chat} 
              active={activeChatId === chat.id}
              onClick={() => setActiveChatId(chat.id)}
              onDelete={deleteChat}
            />
          ))}
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 px-3 py-2 text-slate-400 text-xs font-medium">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            System Status: Online
          </div>
        </div>
      </aside>

      {/* CHAT CONTAINER */}
      <main className="flex-1 flex flex-col relative h-full bg-white">
        {/* Top Header Navigation */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100 bg-white/80 backdrop-blur-md z-20">
          <div className="flex items-center gap-4">
            {!isSidebarOpen && (
              <button onClick={() => setIsSidebarOpen(true)} className="text-slate-500 hover:text-slate-800 transition-colors">
                <PanelLeftOpen size={20} />
              </button>
            )}
            <div className="flex flex-col">
              <h1 className="text-sm font-bold text-slate-800 uppercase tracking-tight">
                {activeChat?.title || "Conversation"}
              </h1>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
                <Hash size={10} /> DIT Intelligence Core
              </span>
            </div>
          </div>
          <ChatHeader />
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto px-4 md:px-0">
          <div className="max-w-3xl mx-auto pt-10 pb-32">
            {activeChat?.messages.map((msg, idx) => (
              <MessageBubble key={idx} msg={msg} />
            ))}
            {isLoading && (
              <div className="flex justify-start pl-12 gap-1.5 items-center">
                <div className="w-1.5 h-1.5 bg-[#E91E63] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-1.5 h-1.5 bg-[#E91E63] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-1.5 h-1.5 bg-[#E91E63] rounded-full animate-bounce"></div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </div>

        {/* Input Area */}
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
                disabled={isLoading || !input.trim()}
                className={`p-3 rounded-2xl transition-all shadow-lg ${
                  input.trim() ? 'bg-[#004751] text-white shadow-[#004751]/20' : 'bg-slate-200 text-slate-400 shadow-none'
                }`}
              >
                <Send size={20} />
              </button>
            </form>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={(e) => setAttachedFile(e.target.files[0])}
            />
            <div className="mt-3 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest opacity-60">
                Nora AI peut faire des erreurs. Vérifiez les informations importantes.
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default NoraChat;