import React, { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import apiInstance from "../../utils/axios";
import ImageWithFallback from "./ImageWithFallback";
import UserData from "../plugin/UserData";
import {
  Bot,
  Sparkles,
  Send,
  X,
  RefreshCw,
  ShoppingBag,
  ArrowUpRight,
  ChevronDown,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  Headphones,
  RotateCcw,
} from "lucide-react";

const ROLE_PROMPTS = {
  customer: [
    "📦 Track my latest order status",
    "🔥 Best deals & top discounts today",
    "👟 Best running shoes with good cushion",
    "🔄 How do I request a return or refund?",
  ],
  vendor: [
    "📊 How do I add a new product?",
    "💰 Check my payout & earnings status",
    "📈 Tips to improve my shop sales",
    "⚠️ Help with low stock management",
  ],
  admin: [
    "🛡️ Pending vendor approval status",
    "📈 Today's platform revenue & orders",
    "🔍 Check flagged items & refunds",
    "⚙️ System health & vendor moderation",
  ],
};

const INITIAL_GREETINGS = {
  customer:
    "হাই! AxuraShop-এ স্বাগতম। 🌟 আমি আপনার এআই সেলস ও সাপোর্ট অ্যাসিস্ট্যান্ট।\n\nবাজেট, পছন্দের পণ্য, অর্ডারের অবস্থান বা পলিসি সম্পর্কে যেকোনো প্রশ্ন করতে পারেন। কীভাবে সাহায্য করতে পারি?",
  vendor:
    "Welcome to the AxuraShop Vendor AI Assistant! 💼\n\nI can help you monitor product listings, review payout guidelines, and optimize your store performance. What would you like to review?",
  admin:
    "AxuraShop Operations Assistant online. 🛡️\n\nAsk me about recent system metrics, pending vendor verifications, or moderation workflows.",
};

const MAX_CHAR_LIMIT = 500;

const AIChatWidget = () => {
  const userData = UserData();
  const currentRole = useMemo(() => {
    if (userData?.is_superuser) return "admin";
    if (userData?.is_vendor) return "vendor";
    return "customer";
  }, [userData]);

  const storageKey = `axura_ai_chat_${currentRole}`;

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback to initial
    }
    return [
      {
        id: "msg-0",
        role: "assistant",
        content: INITIAL_GREETINGS[currentRole] || INITIAL_GREETINGS.customer,
        products: [],
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ];
  });

  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [copiedId, setCopiedId] = useState(null);
  const [feedback, setFeedback] = useState({}); // { [msgId]: 'up' | 'down' }
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [lastError, setLastError] = useState(null);

  const messagesEndRef = useRef(null);
  const messageListRef = useRef(null);
  const textareaRef = useRef(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    } catch {
      // ignore
    }
  }, [messages, storageKey]);

  // Handle scroll events to display scroll-to-latest button
  const handleScroll = () => {
    if (!messageListRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messageListRef.current;
    const distanceToBottom = scrollHeight - scrollTop - clientHeight;
    setShowScrollBottom(distanceToBottom > 150);
  };

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, loading, isOpen]);

  // Focus & Escape key handling
  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      setTimeout(() => textareaRef.current?.focus(), 150);

      const handleKeyDown = (e) => {
        if (e.key === "Escape") {
          setIsOpen(false);
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen]);

  // Auto-grow textarea
  const handleInputChange = (e) => {
    const val = e.target.value;
    if (val.length <= MAX_CHAR_LIMIT) {
      setInputText(val);
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
      }
    }
  };

  const handleSendMessage = async (textToSend = null) => {
    const text = (textToSend || inputText).trim();
    if (!text || loading) return;

    setLastError(null);
    const userMessage = {
      id: `usr-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInputText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    setLoading(true);

    const historyPayload = nextMessages.slice(-4).map((m) => ({
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
          id: `bot-${Date.now()}`,
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
      const errMsg = "দুঃখিত, সংযোগে কিছুটা সমস্যা হচ্ছে। অনুগ্রহ করে একটু পর আবার চেষ্টা করুন।";
      setLastError(text);
      const botError = {
        id: `err-${Date.now()}`,
        role: "assistant",
        isError: true,
        content: errMsg,
        products: [],
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, botError]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    const reset = [
      {
        id: `msg-${Date.now()}`,
        role: "assistant",
        content: INITIAL_GREETINGS[currentRole] || INITIAL_GREETINGS.customer,
        products: [],
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ];
    setMessages(reset);
    setLastError(null);
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // ignore
    }
  };

  const handleCopy = (id, text) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFeedback = (id, type) => {
    setFeedback((prev) => ({
      ...prev,
      [id]: prev[id] === type ? null : type,
    }));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const starterChips = ROLE_PROMPTS[currentRole] || ROLE_PROMPTS.customer;

  return (
    <>
      {/* ------------------------------------------------------------------ */}
      {/* FLOATING TRIGGER BUTTON                                            */}
      {/* Positioned bottom-[76px] on mobile to clear MobileBottomNav (64px) */}
      {/* ------------------------------------------------------------------ */}
      {!isOpen && (
        <aside aria-label="AI Assistant Floating Widget">
          <button
            onClick={() => setIsOpen(true)}
            className="fixed bottom-[78px] right-4 md:bottom-6 md:right-6 z-50 group flex items-center justify-center w-14 h-14 md:w-auto md:h-auto md:px-5 md:py-3.5 rounded-full aspect-square md:aspect-auto bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-700 text-white shadow-2xl shadow-indigo-600/40 hover:shadow-indigo-600/60 hover:scale-108 active:scale-95 transition-all duration-300 border-2 border-white/25 focus:outline-none focus:ring-4 focus:ring-indigo-300 cursor-pointer"
            aria-label="Open AI Assistant"
            style={{ borderRadius: "9999px" }}
          >
            {/* Pulsing online beacon */}
            <span className="absolute top-2 right-2 md:relative md:top-auto md:right-auto flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400" />
            </span>

            <Bot className="w-6 h-6 md:w-5 md:h-5 text-white group-hover:rotate-12 transition-transform" />
            <span className="hidden md:inline text-xs font-bold tracking-wide ml-2">
              AI Assistant
            </span>
            <Sparkles className="hidden md:inline w-3.5 h-3.5 text-amber-300 animate-pulse ml-1" />

            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold shadow-md animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>
        </aside>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* CHAT WINDOW / FULL-SCREEN SHEET ON MOBILE                          */}
      {/* ------------------------------------------------------------------ */}
      {isOpen && (
        <section
          aria-label="AxuraShop AI Assistant Conversation"
          className="fixed inset-0 md:inset-auto md:bottom-6 md:right-6 z-50 flex flex-col w-full h-[100dvh] md:w-[410px] md:h-[620px] md:max-h-[88vh] bg-white md:rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        >
          {/* HEADER */}
          <header className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-4 py-3.5 sm:px-5 sm:py-4 flex items-center justify-between border-b border-white/10 shrink-0 select-none">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/30">
                  <Bot className="w-5 h-5" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-slate-900" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs sm:text-sm font-bold tracking-tight text-white">
                    Axura AI Assistant
                  </h3>
                  <span className="px-1.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 text-[9px] font-bold uppercase tracking-wider">
                    {currentRole}
                  </span>
                </div>
                <p className="text-[10px] text-slate-300 flex items-center gap-1">
                  Bangla, Banglish & English
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleClearChat}
                title="Restart Chat"
                className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Restart conversation"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Close Assistant"
                className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Close Assistant"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </header>

          {/* MESSAGE FEED (Accessible aria-live region) */}
          <div
            ref={messageListRef}
            onScroll={handleScroll}
            aria-live="polite"
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/70 text-xs relative"
          >
            {messages.map((m) => {
              const isUser = m.role === "user";
              return (
                <div
                  key={m.id || m.timestamp}
                  className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                >
                  {/* Bubble Container */}
                  <div
                    className={`max-w-[88%] sm:max-w-[82%] rounded-2xl px-4 py-3 leading-relaxed shadow-xs ${
                      isUser
                        ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-tr-xs"
                        : m.isError
                        ? "bg-rose-50 text-rose-900 border border-rose-200 rounded-tl-xs"
                        : "bg-white text-slate-800 border border-slate-200/90 rounded-tl-xs"
                    }`}
                  >
                    <p className="whitespace-pre-line text-xs font-normal selection:bg-indigo-200 selection:text-indigo-900">
                      {m.content}
                    </p>

                    <div
                      className={`flex items-center justify-between gap-3 mt-2 pt-1 border-t ${
                        isUser
                          ? "border-white/10 text-indigo-200"
                          : "border-slate-100 text-slate-400"
                      }`}
                    >
                      <span className="text-[10px]">{m.timestamp}</span>

                      {!isUser && (
                        <div className="flex items-center gap-1.5 ml-auto">
                          <button
                            type="button"
                            onClick={() => handleCopy(m.id, m.content)}
                            title="Copy text"
                            className="p-1 hover:text-slate-700 rounded transition-colors"
                            aria-label="Copy reply"
                          >
                            {copiedId === m.id ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleFeedback(m.id, "up")}
                            title="Helpful"
                            className={`p-1 rounded transition-colors ${
                              feedback[m.id] === "up" ? "text-indigo-600 font-bold" : "hover:text-slate-700"
                            }`}
                            aria-label="Thumbs up"
                          >
                            <ThumbsUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleFeedback(m.id, "down")}
                            title="Not helpful"
                            className={`p-1 rounded transition-colors ${
                              feedback[m.id] === "down" ? "text-rose-600 font-bold" : "hover:text-slate-700"
                            }`}
                            aria-label="Thumbs down"
                          >
                            <ThumbsDown className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Retry button for error states */}
                  {m.isError && lastError && (
                    <button
                      type="button"
                      onClick={() => handleSendMessage(lastError)}
                      className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold text-rose-600 hover:text-rose-700 underline px-1"
                    >
                      <RefreshCw className="w-3 h-3" /> Retry sending question
                    </button>
                  )}

                  {/* Product Recommendation Cards (RAG) */}
                  {m.products && m.products.length > 0 && (
                    <div className="w-full mt-2.5 space-y-2 max-w-[95%]">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 pl-1">
                        <ShoppingBag className="w-3 h-3 text-indigo-600" /> Matching Catalog Items:
                      </span>
                      <div className="grid grid-cols-1 gap-2">
                        {m.products.map((prod) => (
                          <Link
                            key={prod.id}
                            to={`/detail/${prod.slug}/`}
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-3 p-2.5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all group"
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
              );
            })}

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
                    Axura AI is researching...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />

            {/* SCROLL TO BOTTOM BUTTON */}
            {showScrollBottom && (
              <button
                type="button"
                onClick={() => scrollToBottom(true)}
                className="sticky bottom-2 left-1/2 -translate-x-1/2 bg-white/95 border border-slate-200 text-slate-700 text-[11px] font-semibold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1 hover:bg-slate-100 transition-all z-10"
                aria-label="Scroll to newest message"
              >
                <ChevronDown className="w-3.5 h-3.5" /> Newest message
              </button>
            )}
          </div>

          {/* ROLE-AWARE SUGGESTION CHIPS */}
          {messages.length <= 3 && !loading && (
            <div className="px-3 py-2 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
              {starterChips.map((prompt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSendMessage(prompt)}
                  className="whitespace-nowrap px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 text-[11px] font-semibold transition-colors border border-slate-200/60 min-h-[36px]"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* TALK TO HUMAN AGENT QUICK ACTION */}
          <div className="px-4 py-1.5 bg-slate-50/90 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
            <span className="flex items-center gap-1">
              <Headphones className="w-3.5 h-3.5 text-indigo-500" /> Need human support?
            </span>
            <a
              href="mailto:support@axurashop.com"
              className="text-indigo-600 font-semibold hover:underline"
            >
              Email Support Team
            </a>
          </div>

          {/* INPUT BAR */}
          <div className="p-3 bg-white border-t border-slate-200 shrink-0 pb-[max(env(safe-area-inset-bottom,0px),12px)]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-end gap-2"
            >
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  rows={1}
                  placeholder="Ask in Bangla, Banglish, English..."
                  value={inputText}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  disabled={loading}
                  aria-label="Type your message"
                  className="w-full resize-none max-h-28 px-4 py-2.5 rounded-2xl bg-slate-100 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-xs text-slate-800 placeholder-slate-400 outline-none transition-all leading-normal min-h-[44px]"
                />
                <span className="absolute bottom-1 right-2 text-[9px] text-slate-400 select-none">
                  {inputText.length}/{MAX_CHAR_LIMIT}
                </span>
              </div>

              <button
                type="submit"
                disabled={!inputText.trim() || loading}
                className="w-11 h-11 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/30 transition-all shrink-0 min-h-[44px] min-w-[44px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </section>
      )}
    </>
  );
};

export default AIChatWidget;
