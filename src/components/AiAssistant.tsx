import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, X, Send, Bot, User, ArrowLeft, ArrowRight, MessageSquare, ListPlus, ShieldCheck, Wand2, Cpu, Zap, BrainCircuit, Gift } from "lucide-react";

interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: Date;
}

interface AiAssistantProps {
  language: "fa" | "en";
  activeTab: string;
  wishlists: any[];
  userProfile: any;
  onSwitchTab: (tab: string) => void;
  onAddGift: (gift: { title: string; price?: number; priority: "high" | "medium" | "low"; notes?: string }) => void;
  onOpenPriceCompare: (query: string) => void;
  onToggleLanguage: () => void;
}

export const AiAssistant: React.FC<AiAssistantProps> = ({
  language,
  activeTab,
  wishlists,
  userProfile,
  onSwitchTab,
  onAddGift,
  onOpenPriceCompare,
  onToggleLanguage,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [hasNewUpdate, setHasNewUpdate] = useState(true);
  const [selectedIcon, setSelectedIcon] = useState<"gift" | "wand" | "bot" | "sparkles" | "cpu">(() => {
    return (localStorage.getItem("giftino_ai_icon") as any) || "gift";
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isFa = language === "fa";

  const handleSelectIcon = (iconKey: "gift" | "wand" | "bot" | "sparkles" | "cpu") => {
    setSelectedIcon(iconKey);
    localStorage.setItem("giftino_ai_icon", iconKey);
  };

  const suggestions = isFa
    ? [
        "💡 پیشنهاد هدیه تولد برای رفیقم تا ۱ میلیون",
        "🔍 مقایسه قیمت 'کیبورد مکانیکال'",
        "📋 یه آرزوی جدید به لیستم اضافه کن",
        "👥 برو به بخش شبکه دوستان",
      ]
    : [
        "💡 Gift idea for friend under 100k",
        "🔍 Compare 'mechanical keyboard' price",
        "📋 Add a new wish to my list",
        "👥 Go to Friends Feed",
      ];

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setHasNewUpdate(false);
    }
  }, [messages, isOpen, isThinking]);

  // Welcome message on load or language change
  useEffect(() => {
    const welcomeText = isFa
      ? `سلام ${userProfile?.name || "عزیز"}! من دستیار هوشمند گیفتی‌نو هستم. ✨

چطور می‌توانم کمکتان کنم؟ من می‌توانم:
- هدیه‌های فوق‌العاده برای دوستانتان پیشنهاد دهم.
- قیمت کادوها را در فروشگاه‌ها مقایسه کنم.
- برایتان کادو اضافه کنم یا تب‌ها را جابجا کنم!
`
      : `Hello ${userProfile?.name || "there"}! I'm your Giftino AI Assistant. ✨

How can I help you today? I can:
- Brainstorm amazing gift ideas.
- Compare live prices across top stores.
- Automatically add wishes to your lists or switch tabs!`;

    setMessages([
      {
        id: "welcome",
        sender: "bot",
        text: welcomeText,
        timestamp: new Date(),
      }
    ]);
  }, [language, userProfile]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isThinking) return;

    const userMsg: Message = {
      id: Math.random().toString(),
      sender: "user",
      text: textToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsThinking(true);

    try {
      const response = await fetch("/api/assistant-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          language,
          currentWishlists: wishlists,
          activeTab,
          userProfile,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const botMsg: Message = {
          id: Math.random().toString(),
          sender: "bot",
          text: data.text,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, botMsg]);

        // If an action was specified, execute it!
        if (data.action) {
          const { type, args } = data.action;
          setTimeout(() => {
            if (type === "switch_tab" && args?.tab) {
              onSwitchTab(args.tab);
            } else if (type === "add_gift" && args?.title) {
              onAddGift({
                title: args.title,
                price: args.price,
                priority: args.priority || "medium",
                notes: args.notes,
              });
            } else if (type === "open_price_compare" && args?.query) {
              onOpenPriceCompare(args.query);
            } else if (type === "change_language") {
              onToggleLanguage();
            }
          }, 800);
        }
      } else {
        throw new Error();
      }
    } catch (err) {
      const errorMsg: Message = {
        id: Math.random().toString(),
        sender: "bot",
        text: isFa
          ? "متأسفانه در برقراری ارتباط با مغز هوش مصنوعی مشکلی پیش آمد. لطفاً اینترنت خود را بررسی کنید یا دوباره تلاش فرمایید."
          : "Oops! Something went wrong connecting to the AI brain. Please check your connection or try again shortly.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsThinking(false);
    }
  };

  const renderAiIcon = (key: string, sizeClass = "w-5 h-5") => {
    switch (key) {
      case "gift":
        return <Gift className={sizeClass} />;
      case "wand":
        return <Wand2 className={sizeClass} />;
      case "bot":
        return <Bot className={sizeClass} />;
      case "cpu":
        return <Cpu className={sizeClass} />;
      case "sparkles":
      default:
        return <Sparkles className={sizeClass} />;
    }
  };

  return (
    <div className="fixed bottom-22 md:bottom-6 right-5 z-50 flex flex-col items-end">
      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 50, x: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 50, x: 20 }}
            className="w-[calc(100vw-2rem)] sm:w-[380px] h-[520px] bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden mb-4"
          >
            {/* Window Header */}
            <div className="p-3.5 bg-zinc-950 border-b border-zinc-800 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-zinc-900 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shadow-md">
                    {renderAiIcon(selectedIcon, "w-4 h-4")}
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-white flex items-center gap-1.5">
                      <span>{isFa ? "دستیار هوشمند گیفتی‌نو" : "Giftino AI Assistant"}</span>
                      <span className="text-[7.5px] bg-[#10b981]/15 text-[#10b981] px-1.5 py-0.5 rounded font-black uppercase tracking-wider">LIVE</span>
                    </h3>
                    <p className="text-[9px] text-zinc-500 font-medium">
                      {isFa ? "مشاور انتخاب کادو و مقایسه قیمت" : "Gift Advisor & Price Compare"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 bg-zinc-900 hover:bg-rose-500/20 text-zinc-300 hover:text-rose-400 border border-zinc-800 hover:border-rose-500/40 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 px-2.5 text-[10px] font-bold shadow-sm"
                  title={isFa ? "بستن پنجره" : "Close window"}
                >
                  <X className="w-3.5 h-3.5" />
                  <span>{isFa ? "بستن" : "Close"}</span>
                </button>
              </div>

              {/* Symbol selector bar */}
              <div className="flex items-center justify-between bg-zinc-900/80 px-2.5 py-1.5 rounded-xl border border-zinc-800/80 text-[10px]">
                <span className="text-zinc-400 text-[9px] font-bold">{isFa ? "نماد آیکون:" : "AI Symbol:"}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleSelectIcon("gift")}
                    className={`p-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                      selectedIcon === "gift"
                        ? "bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/40"
                        : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
                    }`}
                    title={isFa ? "هدیه جادویی" : "Magic Gift"}
                  >
                    <Gift className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleSelectIcon("wand")}
                    className={`p-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                      selectedIcon === "wand"
                        ? "bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/40"
                        : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
                    }`}
                    title={isFa ? "چوب جادویی" : "Magic Wand"}
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleSelectIcon("bot")}
                    className={`p-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                      selectedIcon === "bot"
                        ? "bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/40"
                        : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
                    }`}
                    title={isFa ? "ربات هوشمند" : "AI Bot"}
                  >
                    <Bot className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleSelectIcon("sparkles")}
                    className={`p-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                      selectedIcon === "sparkles"
                        ? "bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/40"
                        : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
                    }`}
                    title={isFa ? "جرقه و درخشش" : "Sparkles"}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleSelectIcon("cpu")}
                    className={`p-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                      selectedIcon === "cpu"
                        ? "bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/40"
                        : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
                    }`}
                    title={isFa ? "پردازنده / موتور" : "AI Core"}
                  >
                    <Cpu className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-900/50">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"} items-start gap-2.5`}
                >
                  {msg.sender === "bot" && (
                    <div className="w-6 h-6 rounded-lg bg-[#10b981]/15 text-[#10b981] flex items-center justify-center text-[10px] shrink-0 border border-[#10b981]/10">
                      🤖
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-[11px] leading-relaxed whitespace-pre-line shadow-sm ${
                      msg.sender === "user"
                        ? "bg-[#10b981] text-zinc-950 font-bold rounded-tr-none"
                        : "bg-zinc-800/60 text-zinc-100 border border-zinc-800 rounded-tl-none"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}

              {isThinking && (
                <div className="flex justify-start items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-[#10b981]/15 text-[#10b981] flex items-center justify-center text-[10px] shrink-0">
                    🤖
                  </div>
                  <div className="bg-zinc-800/40 border border-zinc-800 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-[#10b981] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-[#10b981] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-[#10b981] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Action Suggestions */}
            {messages.length < 3 && (
              <div className="p-2 bg-zinc-950/40 border-t border-zinc-800/30 flex gap-1.5 overflow-x-auto no-scrollbar scroll-smooth whitespace-nowrap">
                {suggestions.map((sug, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      // Strip emoji prefix for search logic or keep it
                      const cleanText = sug.replace(/^[^\s]+\s/, "");
                      handleSendMessage(cleanText);
                    }}
                    className="px-2.5 py-1.5 bg-zinc-800/50 hover:bg-zinc-800 text-[10px] font-bold text-zinc-300 hover:text-white rounded-xl border border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer inline-flex items-center gap-1 shrink-0"
                  >
                    <span>{sug}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(inputValue);
              }}
              className="p-3 bg-zinc-950 border-t border-zinc-800 flex gap-2"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={isFa ? "پیامی بنویسید یا دستوری دهید..." : "Type a message or issue a command..."}
                className="flex-1 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 focus:border-[#10b981]/50 px-3.5 py-2 rounded-2xl text-[11px] font-bold text-white outline-none transition-all placeholder-zinc-500 text-left rtl:text-right"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isThinking}
                className="p-2 bg-[#10b981] hover:bg-emerald-400 disabled:bg-zinc-800 text-zinc-950 disabled:text-zinc-500 rounded-xl transition-all shadow-md cursor-pointer disabled:cursor-not-allowed shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button Trigger */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        className="h-12 w-12 rounded-2xl bg-zinc-950/90 backdrop-blur-2xl text-emerald-400 shadow-[0_8px_30px_rgba(16,185,129,0.25)] hover:shadow-[0_0_35px_rgba(16,185,129,0.45)] flex items-center justify-center relative cursor-pointer group overflow-hidden transition-all duration-300 p-[1.5px]"
        title={isFa ? "دستیار هوشمند گیفتی‌نو" : "Giftino AI Assistant"}
      >
        {/* Rotating border light effect (sweeps around border frame every 3.5s) */}
        <div 
          className="absolute -inset-[150%] animate-spin bg-[conic-gradient(from_0deg,transparent_0_240deg,#10b981_320deg,#6ee7b7_360deg)] opacity-90 group-hover:opacity-100 transition-opacity" 
          style={{ animationDuration: '3.5s', animationTimingFunction: 'linear' }}
        />

        {/* Inner background mask layer */}
        <div className="absolute inset-[1.5px] rounded-[14px] bg-zinc-950/95 backdrop-blur-2xl z-0" />

        {/* Glow ambient background inside mask */}
        <span className="absolute inset-[1.5px] bg-emerald-500/10 group-hover:bg-emerald-500/25 transition-all duration-300 rounded-[14px] z-[1]" />


        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -45, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 45, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="z-10 text-white relative"
            >
              <X className="w-5 h-5 font-black" />
            </motion.div>
          ) : (
            <motion.div
              key="bot"
              initial={{ rotate: 45, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -45, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="z-10 flex items-center justify-center text-emerald-400 group-hover:text-emerald-300 relative"
            >
              {renderAiIcon(selectedIcon, "w-5 h-5")}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
};
