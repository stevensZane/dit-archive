import React, { useState, useEffect, useRef } from "react";
import { Sparkles, PanelLeftClose, PanelLeftOpen, Plus } from "lucide-react";
import api from "../api/axios";
import Navbar from "../navigations/Navbar";
import SidebarItem from "./SidebarItem";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";

const NoraChat = () => {
  const [chats, setChats] = useState(() => {
    const saved = localStorage.getItem("nora_chats");
    return saved ? JSON.parse(saved) : [];
  });

  const [activeChatId, setActiveChatId] = useState(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [attachedFile, setAttachedFile] = useState(null);
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);

  const activeChat = chats.find((c) => c.id === activeChatId);

  useEffect(() => {
    if (chats.length === 0) {
      handleNewChat();
    } else if (!activeChatId) {
      setActiveChatId(chats[0].id);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("nora_chats", JSON.stringify(chats));
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chats]);

  const handleNewChat = () => {
    const newChat = {
      id: Date.now(),
      title: "Nouvelle discussion",
      messages: [
        {
          role: "nora",
          content:
            "Bonjour ! Je suis Nora. Comment puis-je vous aider aujourd'hui ?",
        },
      ],
    };
    setChats([newChat, ...chats]);
    setActiveChatId(newChat.id);
  };

  const deleteChat = (id) => {
    const updated = chats.filter((c) => c.id !== id);
    setChats(updated);
    if (activeChatId === id && updated.length > 0)
      setActiveChatId(updated[0].id);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if ((!input.trim() && !attachedFile) || isLoading || !activeChatId) return;

    const userQuery = input;
    const userMessage = {
      role: "user",
      content: userQuery || `Fichier envoyé : ${attachedFile.name}`,
      fileName: attachedFile?.name,
    };

    const updatedChats = chats.map((chat) => {
      if (chat.id === activeChatId) {
        const isFirstMessage = chat.messages.length <= 1;
        return {
          ...chat,
          title: isFirstMessage
            ? userQuery.substring(0, 25) || "Fichier joint"
            : chat.title,
          messages: [...chat.messages, userMessage],
        };
      }
      return chat;
    });

    setChats(updatedChats);
    setInput("");
    setAttachedFile(null);
    setIsLoading(true);

    try {
      const response = await api.post("/chatbot/ask", {
        query: userQuery,
        history: activeChat.messages.slice(-5),
      });

      const noraResponse = {
        role: "nora",
        content: response.data.answer,
        sources: response.data.sources || [],
      };

      setChats((prev) =>
        prev.map((chat) =>
          chat.id === activeChatId
            ? { ...chat, messages: [...chat.messages, noraResponse] }
            : chat,
        ),
      );
    } catch (error) {
      setChats((prev) =>
        prev.map((chat) =>
          chat.id === activeChatId
            ? {
                ...chat,
                messages: [
                  ...chat.messages,
                  {
                    role: "nora",
                    content: "Erreur de connexion. Veuillez réessayer.",
                  },
                ],
              }
            : chat,
        ),
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
      {/* SIDEBAR */}
      <aside
        className={`bg-[#0F172A] transition-all duration-300 ease-in-out flex flex-col border-r border-white/5 ${
          isSidebarOpen ? "w-[280px]" : "w-0"
        }`}
      >
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#004751] rounded-lg flex items-center justify-center">
              <Sparkles size={16} className="text-white" />
            </div>
            <span className="font-bold text-white tracking-tight">Nora AI</span>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="text-slate-500 hover:text-white transition-colors"
          >
            <PanelLeftClose size={18} />
          </button>
        </div>

        <div className="px-4 mb-4">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center gap-2 px-3 py-2.5 bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 rounded-xl text-sm font-semibold transition-all group"
          >
            <Plus
              size={16}
              className="group-hover:rotate-90 transition-transform"
            />
            Nouvelle discussion
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 space-y-1 custom-scrollbar">
          <p className="text-[10px] font-black text-slate-500 uppercase px-3 py-4 tracking-widest">
            Récent
          </p>
          {chats.map((chat) => (
            <SidebarItem
              key={chat.id}
              chat={chat}
              active={activeChatId === chat.id}
              onClick={() => setActiveChatId(chat.id)}
              onDelete={deleteChat}
            />
          ))}
        </div>

        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 px-3 py-2 text-slate-400 text-xs font-medium">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            System Status: Online
          </div>
        </div>
      </aside>

      {/* CHAT CONTAINER */}
      <main className="flex-1 flex flex-col relative h-full bg-white">
        <Navbar />

        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100 bg-white/80 backdrop-blur-md z-20">
          <div className="flex items-center gap-4">
            {!isSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="text-slate-500 hover:text-slate-800 transition-colors"
              >
                <PanelLeftOpen size={20} />
              </button>
            )}
          </div>
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
        <ChatInput
          input={input}
          setInput={setInput}
          handleSend={handleSend}
          isLoading={isLoading}
          attachedFile={attachedFile}
          setAttachedFile={setAttachedFile}
          fileInputRef={fileInputRef}
        />
      </main>
    </div>
  );
};

export default NoraChat;
