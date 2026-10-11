import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import apiInstance from "../../utils/axios";
import ImageWithFallback from "./ImageWithFallback";
import {
  Bot,
  Sparkles,
  Send,
  X,
  RefreshCw,
  ShoppingBag,
  ArrowUpRight,
  ChevronDown,
  MessageSquare,
  Sparkle,
} from "lucide-react";

const INITIAL_GREETING = {
  role: "assistant",
  content:
    "হাই! LuxeStore-এ আপনাকে স্বাগতম। 🌟 আমি আপনার পার্সোনাল এআই সেলস অ্যাসিস্ট্যান্ট।\n\nআপনি আমাকে আপনার বাজেট, পছন্দের পণ্য, স্পেসিফিকেশন বা শিপিং সম্পর্কে **বাংলা, বাংলিশ (Banglish) বা English**—যেকোনো ভাষায় জিজ্ঞেস করতে পারেন! কীভাবে সাহায্য করতে পারি?",
  products: [],
  timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
};

const STARTER_PROMPTS = [
  "🔥 5000 টাকার মধ্যে সেরা হেডফোন কোনটা?",
  "⌚ Best smartwatches with long battery",
  "👟 Casual sneakers & running shoes",
  "📦 Delivery charge koto ar kobe delivery pabo?",
];

const AIChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([INITIAL_GREETING]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const handleSendMessage = async (textToSend = null) => {
    const text = (textToSend || inputText).trim();
    if (!text || loading) return;

    const userMessage = {
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setLoading(true);

    // Format conversation history for API
    const historyPayload = messages.slice(-4).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const res = await apiInstance.post("ai/chat/", {
        message: text,
        history: historyPayload,
      });

      if (res.data?.reply) {
        const botMessage = {
          role: "assistant",
          content: res.data.reply,
          products: res.data.products || [],
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, botMessage]);
        if (!isOpen) setUnreadCount((prev) => prev + 1);
      }
    } catch (err) {
      console.error("AI Chat Error:", err);
      const errorMessage = {
        role: "assistant",
        content:
          "দুঃখিত, সংযোগে কিছুটা সমস্যা হচ্ছে। অনুগ্রহ করে একটু পর আবার চেষ্টা করুন অথবা শপ ব্রাউজ করুন।",
        products: [],
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([INITIAL_GREETING]);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 font-sans">
      {/* ------------------------------------------------------------------ */}
      {/* FLOATING TRIGGER BUTTON                                            */}
      {/* ------------------------------------------------------------------ */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-3 px-5 py-3.5 rounded-full bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 text-white shadow-xl shadow-indigo-600/40 hover:shadow-2xl hover:shadow-indigo-600/60 hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer border border-white/20"
          aria-label="Open AI Assistant"
        >
          {/* Animated Glow Dot */}
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400" />
          </span>

          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-indigo-100 group-hover:rotate-12 transition-transform duration-300" />
            <span className="text-xs font-extrabold tracking-wide hidden sm:inline">
              Luxe AI Assistant
            </span>
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
          </div>

          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold shadow-md animate-bounce">
              {unreadCount}
            </span>
          )}
        </button>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* CHAT WINDOW / DRAWER                                               */}
      {/* ------------------------------------------------------------------ */}
      {isOpen && (
        <div className="w-[92vw] sm:w-[410px] h-[580px] max-h-[85vh] bg-white rounded-3xl shadow-2xl border border-slate-200/80 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-250">
          {/* HEADER */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-white/10 shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/30">
                  <Bot className="w-5 h-5" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-slate-900" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-bold tracking-tight text-white">
                    Luxe AI Assistant
                  </h3>
                  <span className="px-1.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 text-[9px] font-bold uppercase tracking-wider">
                    RAG 1.5
                  </span>
                </div>
                <p className="text-[10px] text-slate-300 flex items-center gap-1">
                  Speaks Bangla, Banglish & English
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleClearChat}
                title="Restart Chat"
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Minimize"
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* MESSAGE FEED */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/60 text-xs">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${
                  m.role === "user" ? "items-end" : "items-start"
                }`}
              >
                {/* Bubble Container */}
                <div
                  className={`max-w-[86%] rounded-2xl px-4 py-3 leading-relaxed shadow-xs ${
                    m.role === "user"
                      ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-tr-xs"
                      : "bg-white text-slate-800 border border-slate-200/90 rounded-tl-xs"
                  }`}
                >
                  <p className="whitespace-pre-line text-xs font-normal">
                    {m.content}
                  </p>

                  <span
                    className={`block text-[9px] mt-1.5 text-right font-medium ${
                      m.role === "user" ? "text-indigo-200" : "text-slate-400"
                    }`}
                  >
                    {m.timestamp}
                  </span>
                </div>

                {/* Product Recommendation Cards (if returned by RAG) */}
                {m.products && m.products.length > 0 && (
                  <div className="w-full mt-2.5 space-y-2 max-w-[95%]">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 pl-1">
                      <ShoppingBag className="w-3 h-3 text-indigo-600" /> Recommended for You:
                    </span>
                    <div className="grid grid-cols-1 gap-2">
                      {m.products.map((prod) => (
                        <Link
                          key={prod.id}
                          to={`/detail/${prod.slug}/`}
                          onClick={() => setIsOpen(false)}
                          className="flex items-center gap-3 p-2.5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all group cursor-pointer"
                        >
                          <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-100">
                            <ImageWithFallback
                              src={prod.image}
                              alt={prod.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-bold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
                              {prod.title}
                            </h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs font-extrabold text-indigo-600">
                                ${prod.price}
                              </span>
                              {prod.old_price && (
                                <span className="text-[10px] text-slate-400 line-through">
                                  ${prod.old_price}
                                </span>
                              )}
                              <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-emerald-50 text-emerald-700 font-bold ml-auto">
                                In Stock
                              </span>
                            </div>
                          </div>
                          <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* TYPING INDICATOR */}
            {loading && (
              <div className="flex items-start gap-2 max-w-[85%]">
                <div className="w-7 h-7 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-xs px-4 py-3 shadow-xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.15s]" />
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.3s]" />
                  <span className="text-[11px] font-semibold text-slate-500 ml-1.5">
                    Luxe AI is thinking...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* STARTER PROMPTS PILLS (show only if 1 or 2 messages) */}
          {messages.length <= 2 && !loading && (
            <div className="px-4 py-2 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
              {STARTER_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(prompt)}
                  className="whitespace-nowrap px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 text-[11px] font-semibold transition-colors cursor-pointer border border-slate-200/60"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* INPUT BAR */}
          <div className="p-3 bg-white border-t border-slate-200 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                placeholder="Ask in Bangla, Banglish, English..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-100 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-xs text-slate-800 placeholder-slate-400 outline-none transition-all"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || loading}
                className="w-10 h-10 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/30 transition-all cursor-pointer shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <p className="text-[9px] text-center text-slate-400 mt-1.5">
              Powered by Vector RAG & Gemini • Fast real-time catalog recommendations
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIChatWidget;
