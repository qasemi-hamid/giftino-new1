import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Send, Gift } from "lucide-react";

interface Option {
  label: string;
  actionText?: string;
  targetTab?: string;
  actionType?: string;
  actionArgs?: any;
}

interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
  options?: Option[];
  timestamp: Date;
}

interface AiAssistantProps {
  language: "fa" | "en";
  activeTab: string;
  wishlists: any[];
  userProfile: any;
  onSwitchTab: (tab: string) => void;
  onAddGift: (gift: { title: string; price?: number; priority: "high" | "medium" | "low"; notes?: string }) => void;
  onAutoAddFullWishlist?: (wishlist: any) => void;
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
  onAutoAddFullWishlist,
  onOpenPriceCompare,
  onToggleLanguage,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isFa = language === "fa";

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isThinking]);

  // Initial Welcome Message with Step-by-Step Options
  useEffect(() => {
    const welcomeText = isFa
      ? `سلام ${userProfile?.name || "عزیز"}! من دستیار و مشاور هوشمند ۰ تا ۱۰۰ گیفتی‌نو هستم. 🎁⚡

من می‌تونم صفر تا صد کارها رو برات انجام بدم! از ساخت اتوماتیک لیست آرزوها تا انتخاب کادوهای بازار و دعوت از دوستان. کدوم مسیر رو می‌خوای ادامه بدی؟`
      : `Hello ${userProfile?.name || "there"}! I am your 0-100 AI Assistant for Giftino. 🎁⚡

I can handle everything automatically—from building complete wishlists to curating top gifts and inviting friends. Which path would you like to take?`;

    const initialOptions: Option[] = isFa
      ? [
          { label: "⚡ ساخت اتوماتیک ۰ تا ۱۰۰ لیست آرزوها با دستیار", actionType: "trigger_auto_wizard" },
          { label: "🎁 می‌خوام برای کس دیگه‌ای کادو بخرم", actionText: "می‌خوام برای کس دیگه‌ای کادو بخرم" },
          { label: "📋 می‌خوام خودم دستی لیست آرزو بسازم", actionText: "می‌خوام لیست آرزوی خودم رو بسازم و شیر کنم" },
          { label: "🔐 راهنمای ورود، ثبت‌نام و مدیریت حساب", actionText: "راهنمای کامل ورود و حساب کاربری" },
          { label: "❓ چطور گیفتی‌نو کار می‌کنه؟ (رفع ابهامات)", actionText: "راهنمایی کامل سازوکار گیفتی‌نو" },
        ]
      : [
          { label: "⚡ 0-100 Auto Create Wishlist with AI", actionType: "trigger_auto_wizard" },
          { label: "🎁 Buy a gift for a friend", actionText: "I want to buy a gift for a friend" },
          { label: "📋 Create my wishlist manually", actionText: "I want to create my wishlist" },
          { label: "🔐 Login, Auth & Account Guide", actionText: "Login and account guide" },
          { label: "❓ How Giftino works", actionText: "How Giftino works" },
        ];

    setMessages([
      {
        id: "welcome",
        sender: "bot",
        text: welcomeText,
        options: initialOptions,
        timestamp: new Date(),
      },
    ]);
  }, [language, userProfile]);

  const handleOptionClick = (opt: Option) => {
    if (opt.actionType === "trigger_auto_wizard") {
      handleTriggerAutoWizard();
      return;
    }
    if (opt.actionType === "auto_create_wishlist") {
      handleRunAutoCreate(opt.actionArgs?.occasion, opt.actionArgs?.interests);
      return;
    }
    if (opt.actionType === "copy_link" && opt.actionArgs?.link) {
      navigator.clipboard.writeText(opt.actionArgs.link);
      setCopiedLink(opt.actionArgs.link);
      setTimeout(() => setCopiedLink(null), 2500);
      return;
    }
    if (opt.actionText) {
      handleSendMessage(opt.actionText);
    }
    if (opt.targetTab) {
      onSwitchTab(opt.targetTab);
    }
    if (opt.actionType === "open_price_compare" && opt.actionArgs?.query) {
      onOpenPriceCompare(opt.actionArgs.query);
    }
  };

  const handleTriggerAutoWizard = () => {
    const userMsg: Message = {
      id: Math.random().toString(),
      sender: "user",
      text: isFa ? "⚡ ساخت اتوماتیک ۰ تا ۱۰۰ لیست آرزوها با دستیار" : "⚡ 0-100 Auto Create Wishlist with AI",
      timestamp: new Date(),
    };

    const botMsg: Message = {
      id: Math.random().toString(),
      sender: "bot",
      text: isFa
        ? `⚡ **ساخت اتوماتیک ۰ تا ۱۰۰ لیست آرزوها با هوش مصنوعی** 🎁

کافیه مناسبت و سبک کادوهای مورد علاقه‌ت رو انتخاب کنی یا برام بنویسی.
من ۵ کادوی ممتاز بازار ایران (با قیمت واقعی و لینک خرید) رو برات پیدا می‌کنم، لیستت رو می‌سازم و لینک اختصاصی دعوت رو آمادت می‌کنم!

کدوم مناسبت رو برات بسازم؟`
        : `⚡ **0-100 Auto Wishlist Creation** 🎁

Select your occasion and interest profile. I will pick 5 curated gifts with live market pricing, create your wishlist, and generate your personal share link!`,
      options: isFa
        ? [
            {
              label: "🎂 تولدم (علاقه‌مندی: دیجیتال، عطر و کتاب)",
              actionType: "auto_create_wishlist",
              actionArgs: { occasion: "تولدم", interests: "دیجیتال، عطر و کتاب" },
            },
            {
              label: "💍 جشن عروسی (علاقه‌مندی: لوازم منزل و دکور)",
              actionType: "auto_create_wishlist",
              actionArgs: { occasion: "جشن عروسی", interests: "لوازم خانه و دکوراسیون" },
            },
            {
              label: "🏠 جهیزیه و منزل جدید (علاقه‌مندی: وسایل کافه و آشپزخانه)",
              actionType: "auto_create_wishlist",
              actionArgs: { occasion: "جهیزیه و منزل جدید", interests: "قهوه‌ساز، وسایل کافه، آشپزخانه" },
            },
            {
              label: "🎓 موفقیت کاری / هوم‌آفیس (علاقه‌مندی: تجهیزات کار و گیمینگ)",
              actionType: "auto_create_wishlist",
              actionArgs: { occasion: "موفقیت کاری و هوم‌آفیس", interests: "کیبورد مکانیکال، ماوس، هندزفری" },
            },
          ]
        : [
            {
              label: "🎂 Birthday (Tech, Cologne, Books)",
              actionType: "auto_create_wishlist",
              actionArgs: { occasion: "My Birthday", interests: "Gadgets, Cologne, Books" },
            },
            {
              label: "💍 Wedding (Home Decor & Living)",
              actionType: "auto_create_wishlist",
              actionArgs: { occasion: "Wedding Registry", interests: "Home decor, Kitchen" },
            },
          ],
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg, botMsg]);
  };

  const handleRunAutoCreate = async (occasion?: string, interests?: string) => {
    const occLabel = occasion || (isFa ? "تولدم" : "Birthday");
    const userMsg: Message = {
      id: Math.random().toString(),
      sender: "user",
      text: isFa
        ? `⚡ ساخت اتوماتیک لیست [${occLabel}] با علاقه: ${interests || "تکنولوژی و سبک زندگی"}`
        : `⚡ Auto create list [${occLabel}] with interests: ${interests || "Gadgets"}`,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsThinking(true);

    try {
      const response = await fetch("/api/auto-create-wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          occasion: occLabel,
          interests: interests || "دیجیتال، عطر، کتاب، کافه",
          userName: userProfile?.name || "من",
          language,
        }),
      });

      const data = await response.json();

      if (data.success && data.wishlist) {
        const wl = data.wishlist;
        if (onAutoAddFullWishlist) {
          onAutoAddFullWishlist(wl);
        }

        const itemsFormatted = wl.items
          .map(
            (it: any, i: number) =>
              `${i + 1}️⃣ **${it.title}** (~${(it.price || 0).toLocaleString()} تومان)\n   • 💡 ${it.notes}`
          )
          .join("\n\n");

        const shareUrl = `https://giftino.ir/registry/${wl.id}`;

        const botMsg: Message = {
          id: Math.random().toString(),
          sender: "bot",
          text: isFa
            ? `🎉 **لیست آرزوهای شما با موفقیت ۰ تا ۱۰۰ ساخته شد!** ⚡🎁

📌 **عنوان لیست:** ${wl.title}
📅 **تاریخ مناسبت:** ${wl.occasionDate}

✨ **۵ کادوی هوشمند و انتخاب‌شده توسط دستیار:**

${itemsFormatted}

---

🔗 **لینک اختصاصی لیست شما برای ارسال به دوستان:**
\`${shareUrl}\`

همه کادوها به لیست شما افزوده شدند و رزرو آن‌ها کاملاً محرمانه انجام می‌شود تا روز مناسبت سورپریز بشید! 🤫`
            : `🎉 **Wishlist created automatically from 0 to 100!** ⚡🎁

📌 **Title:** ${wl.title}
📅 **Date:** ${wl.occasionDate}

✨ **5 Curated Gifts Picked by AI:**

${itemsFormatted}

---

🔗 **Share Link:**
\`${shareUrl}\``,
          options: isFa
            ? [
                { label: "📋 مشاهده لیست ساخته شده در برنامه", targetTab: "my-lists" },
                { label: "🔗 کپی لینک اختصاصی لیست", actionType: "copy_link", actionArgs: { link: shareUrl } },
                { label: "📩 ارسال دعوت پیامکی به دوستان", targetTab: "friends" },
              ]
            : [
                { label: "📋 View New Wishlist", targetTab: "my-lists" },
                { label: "🔗 Copy Share Link", actionType: "copy_link", actionArgs: { link: shareUrl } },
              ],
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, botMsg]);
      } else {
        throw new Error();
      }
    } catch (err) {
      const errorMsg: Message = {
        id: Math.random().toString(),
        sender: "bot",
        text: isFa
          ? "متأسفانه در دریافت اطلاعات کادوها خطایی رخ داد. لطفاً مجدداً تلاش کنید."
          : "Failed to automatically create wishlist. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isThinking) return;

    if (
      textToSend.includes("اتوماتیک") ||
      textToSend.includes("صفر تا ۱۰۰") ||
      textToSend.includes("۰ تا ۱۰۰") ||
      textToSend.includes("خودکار")
    ) {
      handleRunAutoCreate("تولدم", textToSend);
      return;
    }

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
          options: data.options || undefined,
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
          }, 600);
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
      {/* Ultra-Minimal Glassy Transparent Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 15 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="w-[calc(100vw-2.5rem)] sm:w-[380px] h-[520px] bg-slate-950/80 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden mb-3"
          >
            {/* Minimal Header (Gift Icon + Title Only) */}
            <div className="px-5 py-4 bg-white/[0.03] border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-[#10b981] flex items-center justify-center shrink-0 shadow-sm">
                  <Gift className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-white tracking-wide">
                  {isFa ? "مشاور هوشمند گیفتی‌نو" : "Giftino AI Advisor"}
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer"
                title={isFa ? "بستن" : "Close"}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-transparent no-scrollbar">
              {messages.map((msg) => (
                <div key={msg.id} className="space-y-2">
                  <div
                    className={`flex ${
                      msg.sender === "user" ? "justify-end" : "justify-start"
                    } items-start gap-2.5`}
                  >
                    {msg.sender === "bot" && (
                      <div className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/20 text-[#10b981] flex items-center justify-center shrink-0 mt-0.5">
                        <Gift className="w-3 h-3" />
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed whitespace-pre-line shadow-sm ${
                        msg.sender === "user"
                          ? "bg-[#10b981] text-zinc-950 font-bold rounded-tr-none"
                          : "bg-white/[0.06] backdrop-blur-md text-zinc-100 border border-white/10 rounded-tl-none"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>

                  {/* Interactive Options / Quick-Reply Buttons */}
                  {msg.sender === "bot" && msg.options && msg.options.length > 0 && (
                    <div className="mr-8 flex flex-col gap-1.5 pt-1">
                      {msg.options.map((opt, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleOptionClick(opt)}
                          className="w-full text-right px-3.5 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 text-emerald-300 hover:text-emerald-200 rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer flex items-center justify-between group active:scale-[0.98]"
                        >
                          <span className="truncate">{opt.label}</span>
                          <span className="text-emerald-400 group-hover:translate-x-[-2px] transition-transform text-[11px]">
                            ←
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {isThinking && (
                <div className="flex justify-start items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/20 text-[#10b981] flex items-center justify-center shrink-0">
                    <Gift className="w-3 h-3 animate-pulse" />
                  </div>
                  <div className="bg-white/[0.06] backdrop-blur-md border border-white/10 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-[#10b981] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-[#10b981] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-[#10b981] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(inputValue);
              }}
              className="p-3.5 bg-white/[0.02] border-t border-white/10 flex gap-2"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={isFa ? "پیام خود را بنویسید..." : "Type your message..."}
                className="flex-1 bg-zinc-900/70 border border-white/10 focus:border-[#10b981]/50 px-3.5 py-2.5 rounded-xl text-xs font-medium text-white outline-none transition-all placeholder-zinc-500 text-right"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isThinking}
                className="p-2.5 bg-[#10b981] hover:bg-emerald-400 disabled:opacity-40 text-zinc-950 rounded-xl transition-all shadow-md cursor-pointer disabled:cursor-not-allowed shrink-0 flex items-center justify-center"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Glassy Floating Gift Trigger Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="h-12 w-12 rounded-2xl bg-zinc-950/80 backdrop-blur-2xl border border-white/15 text-emerald-400 shadow-[0_8px_25px_rgba(16,185,129,0.25)] hover:border-emerald-500/40 hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] flex items-center justify-center relative cursor-pointer transition-all duration-200"
        title={isFa ? "مشاور هوشمند گیفتی‌نو" : "Giftino AI Advisor"}
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
