import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Send, Gift } from "lucide-react";

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

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isFa = language === "fa";

  const suggestions = isFa
    ? [
        "💡 پیشنهاد کادو تولد تا ۱ میلیون",
        "🎁 هدیه مناسب برای دوست صمیمی",
      ]
    : [
        "💡 Birthday gift idea under 100k",
        "🎁 Gift for a close friend",
      ];

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isThinking]);

  // Welcome message on load or language change
  useEffect(() => {
    const welcomeText = isFa
      ? `سلام ${userProfile?.name || "عزیز"}! من مشاور هوشمند انتخاب هدیه هستم. 🎁

می‌توانم به شما کمک کنم مناسب‌ترین کادو را برای دوستان و عزیزان خود پیدا کنید.`
      : `Hello ${userProfile?.name || "there"}! I am your AI Gift Advisor. 🎁

I can help you find the perfect gift for any occasion or loved one.`;

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
          ? "متأسفانه در برقراری ارتباط با هوش مصنوعی مشکلی پیش آمد. لطفاً دوباره تلاش کنید."
          : "Something went wrong connecting to the AI Advisor. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="fixed bottom-20 md:bottom-6 right-5 z-50 flex flex-col items-end">
      {/* Glassy Minimal Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="w-[calc(100vw-2.5rem)] sm:w-[350px] h-[460px] bg-zinc-950/85 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.7)] flex flex-col overflow-hidden mb-3"
          >
            {/* Window Header */}
            <div className="px-4 py-3 bg-white/[0.03] backdrop-blur-md border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[#10b981] flex items-center justify-center shrink-0">
                  <Gift className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">
                    {isFa ? "مشاور هوشمند هدیه" : "Smart Gift Advisor"}
                  </h3>
                  <p className="text-[10px] text-zinc-400">
                    {isFa ? "راهنمای تخصصی انتخاب کادو" : "AI Gift Assistant"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer"
                title={isFa ? "بستن" : "Close"}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-zinc-950/20">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"} items-start gap-2`}
                >
                  {msg.sender === "bot" && (
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/20 text-[#10b981] flex items-center justify-center shrink-0 mt-0.5">
                      <Gift className="w-3 h-3" />
                    </div>
                  )}
                  <div
                    className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-line shadow-sm ${
                      msg.sender === "user"
                        ? "bg-[#10b981] text-zinc-950 font-bold rounded-tr-none"
                        : "bg-white/[0.06] backdrop-blur-md text-zinc-100 border border-white/10 rounded-tl-none"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}

              {isThinking && (
                <div className="flex justify-start items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/20 text-[#10b981] flex items-center justify-center shrink-0">
                    <Gift className="w-3 h-3 animate-pulse" />
                  </div>
                  <div className="bg-white/[0.06] backdrop-blur-md border border-white/10 rounded-2xl rounded-tl-none px-4 py-2.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-[#10b981] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-[#10b981] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-[#10b981] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestions */}
            {messages.length < 3 && (
              <div className="px-3 py-2 bg-white/[0.02] border-t border-white/5 flex gap-1.5 overflow-x-auto no-scrollbar whitespace-nowrap">
                {suggestions.map((sug, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      const cleanText = sug.replace(/^[^\s]+\s/, "");
                      handleSendMessage(cleanText);
                    }}
                    className="px-2.5 py-1 bg-white/[0.05] hover:bg-emerald-500/10 text-[11px] font-medium text-emerald-300 hover:text-emerald-200 rounded-xl border border-white/10 hover:border-emerald-500/30 transition-all cursor-pointer inline-flex items-center shrink-0"
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
              className="p-3 bg-white/[0.03] backdrop-blur-md border-t border-white/10 flex gap-2"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={isFa ? "سؤال یا ایده هدیه بنویسید..." : "Ask for a gift idea..."}
                className="flex-1 bg-zinc-900/60 border border-white/10 focus:border-[#10b981]/50 px-3.5 py-2 rounded-xl text-xs font-medium text-white outline-none transition-all placeholder-zinc-500 text-right"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isThinking}
                className="p-2 bg-[#10b981] hover:bg-emerald-400 disabled:opacity-40 text-zinc-950 rounded-xl transition-all shadow-md cursor-pointer disabled:cursor-not-allowed shrink-0 flex items-center justify-center"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Glassy Floating Gift Button Trigger */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="h-12 w-12 rounded-2xl bg-zinc-950/80 backdrop-blur-xl border border-white/15 text-emerald-400 shadow-[0_8px_25px_rgba(16,185,129,0.2)] hover:border-emerald-500/40 hover:shadow-[0_0_30px_rgba(16,185,129,0.35)] flex items-center justify-center relative cursor-pointer transition-all duration-200"
        title={isFa ? "مشاور هوشمند هدیه" : "Smart Gift Advisor"}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -45, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 45, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="text-white relative"
            >
              <X className="w-5 h-5 font-bold" />
            </motion.div>
          ) : (
            <motion.div
              key="gift"
              initial={{ rotate: 45, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -45, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex items-center justify-center text-[#10b981] relative"
            >
              <Gift className="w-5 h-5" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
};

