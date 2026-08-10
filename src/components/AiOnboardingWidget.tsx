import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, Check, ChevronLeft, Clock, Share2, Plus, 
  Gift, User, Calendar, X, Copy, Send, Heart, ArrowRight,
  Bell, AlertCircle, Wand2
} from "lucide-react";
import { UserProfile, Wishlist, WishlistItem, Language } from "../types";

export interface OnboardingState {
  step: number; // 1: Profile, 2: Create List, 3: Add Item, 4: Share & Invite, 5: Completed
  status: "active" | "paused_10m" | "paused_next_visit" | "completed";
  pausedAt?: number;
  remindAt?: number;
  createdListId?: string;
  addedItemTitle?: string;
}

interface AiOnboardingWidgetProps {
  language: Language;
  user: UserProfile | null;
  wishlists: Wishlist[];
  followingFriendIds: string[];
  onUpdateUser: (updated: UserProfile) => void;
  onCreateWishlist: (title: string, occasionType: string, date?: string) => Wishlist;
  onAddWishlistItem: (listId: string, item: { title: string; price?: number; priority: "high" | "medium" | "low"; notes?: string }) => void;
  onSwitchTab: (tab: string) => void;
  onOpenAiAssistant: () => void;
}

export const AiOnboardingWidget: React.FC<AiOnboardingWidgetProps> = ({
  language,
  user,
  wishlists,
  followingFriendIds,
  onUpdateUser,
  onCreateWishlist,
  onAddWishlistItem,
  onSwitchTab,
  onOpenAiAssistant,
}) => {
  const isFa = language === "fa";

  // Load or initialize onboarding state
  const [onboardingState, setOnboardingState] = useState<OnboardingState>(() => {
    try {
      const saved = localStorage.getItem("giftino_ai_onboarding_state");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    // Default initial step: If user has no lists, start at step 1
    return {
      step: 1,
      status: "active"
    };
  });

  const [isMinimized, setIsMinimized] = useState(false);

  // Form inputs for current step
  const [nameInput, setNameInput] = useState(user?.name || "");
  const [birthdayInput, setBirthdayInput] = useState(user?.birthday || "");
  const [customOccasionInput, setCustomOccasionInput] = useState("");
  const [customItemInput, setCustomItemInput] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [showPacingOptions, setShowPacingOptions] = useState(false);

  // Check 10-minute timer wakeup
  useEffect(() => {
    if (onboardingState.status === "paused_10m" && onboardingState.remindAt) {
      const remaining = onboardingState.remindAt - Date.now();
      if (remaining <= 0) {
        // Timer expired! Resume onboarding automatically
        updateState({ status: "active" });
        setIsMinimized(false);
      } else {
        const timer = setTimeout(() => {
          updateState({ status: "active" });
          setIsMinimized(false);
        }, remaining);
        return () => clearTimeout(timer);
      }
    }
  }, [onboardingState.status, onboardingState.remindAt]);

  const updateState = (patch: Partial<OnboardingState>) => {
    setOnboardingState((prev) => {
      const next = { ...prev, ...patch };
      localStorage.setItem("giftino_ai_onboarding_state", JSON.stringify(next));
      return next;
    });
  };

  // If already completed or explicitly closed forever
  if (onboardingState.status === "completed") {
    return null;
  }

  // Handle Pause Options
  const handlePause10Min = () => {
    const remindAt = Date.now() + 10 * 60 * 1000; // 10 minutes from now
    updateState({ status: "paused_10m", remindAt, pausedAt: Date.now() });
    setShowPacingOptions(false);
    setIsMinimized(true);
  };

  const handlePauseNextVisit = () => {
    updateState({ status: "paused_next_visit", pausedAt: Date.now() });
    setShowPacingOptions(false);
    setIsMinimized(true);
  };

  // Step 1: Save Profile
  const handleStep1Submit = () => {
    if (user) {
      const updatedProfile = {
        ...user,
        name: nameInput.trim() || user.name || "کاربر عزیز",
        birthday: birthdayInput || user.birthday,
      };
      onUpdateUser(updatedProfile);
    }
    updateState({ step: 2 });
  };

  // Step 2: Create List
  const handleStep2CreateList = (title: string, occasionType: string) => {
    const newList = onCreateWishlist(title, occasionType);
    updateState({ step: 3, createdListId: newList.id });
  };

  // Step 3: Add Item
  const handleStep3AddItem = (title: string, price?: number) => {
    const listId = onboardingState.createdListId || wishlists[0]?.id;
    if (listId) {
      onAddWishlistItem(listId, {
        title,
        price,
        priority: "high",
        notes: isFa ? "اضافه شده در راه اندازی هوشمند" : "Added during smart onboarding",
      });
    }
    updateState({ step: 4, addedItemTitle: title });
  };

  // Step 4: Finish Onboarding
  const handleStep4Finish = () => {
    updateState({ step: 5, status: "completed" });
  };

  const shareUrl = `${window.location.origin}?wishlist=${onboardingState.createdListId || wishlists[0]?.id || "my"}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleTelegramShare = () => {
    const text = encodeURIComponent(
      isFa
        ? `سلام! لیست کادوها و آرزوهای من توی گیفتی‌نو آماده شد 🎁✨ می‌تونی از اینجا ببینی چی دوست دارم:\n${shareUrl}`
        : `Hey! Check out my wishlist on Giftino 🎁✨:\n${shareUrl}`
    );
    window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${text}`, "_blank");
  };

  // If paused or minimized, render a sleek floating banner chip
  if (isMinimized || onboardingState.status === "paused_10m" || onboardingState.status === "paused_next_visit") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-24 left-4 z-40 max-w-xs bg-zinc-900/95 border border-[#10b981]/40 rounded-2xl p-2.5 shadow-2xl backdrop-blur-xl flex items-center gap-2.5 cursor-pointer hover:border-[#10b981] transition-all group"
        onClick={() => {
          updateState({ status: "active" });
          setIsMinimized(false);
        }}
      >
        <div className="w-8 h-8 rounded-xl bg-[#10b981]/20 text-[#10b981] flex items-center justify-center font-bold text-xs shrink-0 animate-pulse">
          🤖
        </div>
        <div className="flex-1 min-w-0 text-right">
          <p className="text-[10px] font-black text-white flex items-center gap-1">
            <span>{isFa ? "ادامه راه‌اندازی با هوش مصنوعی" : "Resume AI Setup"}</span>
            <span className="w-2 h-2 rounded-full bg-[#10b981] animate-ping" />
          </p>
          <p className="text-[9px] text-zinc-400 truncate">
            {isFa ? `گام ${onboardingState.step} از ۴: ساخت لیست و اشتراک` : `Step ${onboardingState.step} of 4`}
          </p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsMinimized(false);
            updateState({ status: "active" });
          }}
          className="px-2 py-1 bg-[#10b981] text-zinc-950 font-black text-[9px] rounded-lg group-hover:scale-105 transition-transform"
        >
          {isFa ? "ادامه" : "Resume"}
        </button>
      </motion.div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="fixed bottom-22 sm:bottom-6 left-4 right-4 sm:left-6 sm:max-w-md z-[99] bg-zinc-950/95 border border-zinc-800 hover:border-zinc-700 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] backdrop-blur-2xl p-4 space-y-3 text-right"
        style={{ direction: isFa ? "rtl" : "ltr" }}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30 flex items-center justify-center font-black text-sm shadow-inner">
              🤖
            </div>
            <div>
              <h3 className="text-xs font-black text-white flex items-center gap-1.5">
                <span>{isFa ? "دستیار هوشمند راه‌اندازی" : "Smart AI Setup Assistant"}</span>
                <span className="text-[8px] bg-[#10b981]/20 text-[#10b981] px-1.5 py-0.5 rounded-full font-bold">
                  {isFa ? `گام ${onboardingState.step} از ۴` : `Step ${onboardingState.step}/4`}
                </span>
              </h3>
              <p className="text-[9px] text-zinc-400 font-medium">
                {isFa ? "تنظیم گام‌به‌گام و سریع بدون تلف شدن وقت" : "Step-by-step fast onboarding"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Pause / Remind later button */}
            <button
              onClick={() => setShowPacingOptions(!showPacingOptions)}
              className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 rounded-xl text-[9.5px] font-bold flex items-center gap-1 transition-all cursor-pointer"
              title={isFa ? "تنظیم زمان ادامه" : "Pacing options"}
            >
              <Clock className="w-3 h-3 text-amber-400" />
              <span>{isFa ? "ادامه بدیم؟" : "Pause?"}</span>
            </button>

            {/* Minimize */}
            <button
              onClick={() => setIsMinimized(true)}
              className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-xl border border-zinc-800 transition-all cursor-pointer"
              title={isFa ? "کوچک‌سازی" : "Minimize"}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
          <motion.div
            className="bg-gradient-to-r from-[#10b981] to-emerald-400 h-full rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: `${(onboardingState.step / 4) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Pacing Popup Menu */}
        <AnimatePresence>
          {showPacingOptions && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-zinc-900/90 border border-amber-500/30 rounded-2xl p-3 space-y-2 overflow-hidden text-xs"
            >
              <p className="text-[10px] text-amber-300 font-bold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{isFa ? "دوست داری الان ادامه بدیم یا بعداً یادآوری کنم؟" : "Shall we continue or remind you later?"}</span>
              </p>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <button
                  onClick={() => setShowPacingOptions(false)}
                  className="py-1.5 bg-[#10b981] text-zinc-950 font-bold rounded-xl hover:bg-emerald-400 transition-colors cursor-pointer"
                >
                  {isFa ? "همین الان ادامه بریم 🚀" : "Continue now 🚀"}
                </button>
                <button
                  onClick={handlePause10Min}
                  className="py-1.5 bg-zinc-800 hover:bg-zinc-700 text-amber-300 border border-amber-500/30 font-bold rounded-xl transition-colors cursor-pointer"
                >
                  {isFa ? "۱۰ دقیقه دیگه یادآوری کن ⏰" : "Remind in 10 mins ⏰"}
                </button>
                <button
                  onClick={handlePauseNextVisit}
                  className="col-span-2 py-1.5 bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 font-bold rounded-xl transition-colors cursor-pointer"
                >
                  {isFa ? "توی مراجعه بعدی ادامه بدیم 🌙" : "Continue on next visit 🌙"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* STEP 1: Profile & Name */}
        {onboardingState.step === 1 && (
          <div className="space-y-3">
            <div className="bg-zinc-900/60 p-3 rounded-2xl border border-zinc-850 space-y-1">
              <p className="text-xs text-white font-bold leading-relaxed">
                {isFa
                  ? `سلام ${user?.name || "دوست عزیز"}! 👋 من دستیار هوشمندت هستم.`
                  : `Hello ${user?.name || "friend"}! 👋 I'm your AI assistant.`}
              </p>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                {isFa
                  ? "بیایید تو ۳ حرکت، پروفایلت رو کامل کنیم و اولین لیست کادوهای دلخواهت رو بسازیم تا دوستات غافلگیرت کنن!"
                  : "Let's set up your profile and first wishlist in 3 quick steps so your friends can surprise you!"}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-400 block">
                {isFa ? "نام کامل یا مستعار شما:" : "Your Name / Nickname:"}
              </label>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder={isFa ? "مثلاً: علی رضایی" : "e.g., Alex Johnson"}
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-[#10b981] px-3 py-2 rounded-xl text-xs font-bold text-white outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-400 block">
                {isFa ? "تاریخ تولد یا مناسبت اصلی (اختیاری):" : "Birthday / Key Date (Optional):"}
              </label>
              <input
                type="text"
                value={birthdayInput}
                onChange={(e) => setBirthdayInput(e.target.value)}
                placeholder={isFa ? "مثلاً: ۱۵ مرداد یا 2026-08-15" : "e.g., Aug 15"}
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-[#10b981] px-3 py-2 rounded-xl text-xs font-bold text-white outline-none transition-all"
              />
            </div>

            <button
              onClick={handleStep1Submit}
              className="w-full py-2.5 bg-[#10b981] hover:bg-emerald-400 text-zinc-950 font-black text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>{isFa ? "تأیید و رفتن به گام ۲ (ساخت لیست)" : "Confirm & Go to Step 2"}</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 2: Create First Wishlist */}
        {onboardingState.step === 2 && (
          <div className="space-y-3">
            <div className="bg-zinc-900/60 p-3 rounded-2xl border border-zinc-850 space-y-1">
              <p className="text-xs text-white font-bold leading-relaxed">
                {isFa ? "عالی شد! 🎉 حالا برای چه مناسبتی دوست داری لیست کادو بسازی؟" : "Great! 🎉 Which occasion is this wishlist for?"}
              </p>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                {isFa ? "یکی از پیشنهادات زیر رو انتخاب کن یا عنوان دلخواهت رو بنویس:" : "Pick one below or type custom title:"}
              </p>
            </div>

            {/* Quick Choice Preset Chips */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => handleStep2CreateList("تولد من 🎂", "birthday")}
                className="p-2.5 bg-zinc-900 hover:bg-[#10b981]/20 hover:border-[#10b981] text-zinc-200 border border-zinc-800 rounded-2xl text-right font-bold transition-all cursor-pointer flex items-center gap-2"
              >
                <span className="text-base">🎂</span>
                <span className="text-[11px]">{isFa ? "تولد من" : "My Birthday"}</span>
              </button>

              <button
                onClick={() => handleStep2CreateList("کادوهای دلخواهم ✨", "other")}
                className="p-2.5 bg-zinc-900 hover:bg-[#10b981]/20 hover:border-[#10b981] text-zinc-200 border border-zinc-800 rounded-2xl text-right font-bold transition-all cursor-pointer flex items-center gap-2"
              >
                <span className="text-base">✨</span>
                <span className="text-[11px]">{isFa ? "کادوهای دلخواهم" : "Wishlist"}</span>
              </button>

              <button
                onClick={() => handleStep2CreateList("جشن شب یلدا 🍉", "yalda")}
                className="p-2.5 bg-zinc-900 hover:bg-[#10b981]/20 hover:border-[#10b981] text-zinc-200 border border-zinc-800 rounded-2xl text-right font-bold transition-all cursor-pointer flex items-center gap-2"
              >
                <span className="text-base">🍉</span>
                <span className="text-[11px]">{isFa ? "شب یلدا" : "Yalda Night"}</span>
              </button>

              <button
                onClick={() => handleStep2CreateList("سالگرد ازدواج 💑", "anniversary")}
                className="p-2.5 bg-zinc-900 hover:bg-[#10b981]/20 hover:border-[#10b981] text-zinc-200 border border-zinc-800 rounded-2xl text-right font-bold transition-all cursor-pointer flex items-center gap-2"
              >
                <span className="text-base">💑</span>
                <span className="text-[11px]">{isFa ? "سالگرد" : "Anniversary"}</span>
              </button>
            </div>

            {/* Custom Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={customOccasionInput}
                onChange={(e) => setCustomOccasionInput(e.target.value)}
                placeholder={isFa ? "عنوان دلخواه... (مثلاً: فارغ‌التحصیلی)" : "Custom title..."}
                className="flex-1 bg-zinc-900 border border-zinc-800 focus:border-[#10b981] px-3 py-2 rounded-xl text-xs font-bold text-white outline-none transition-all"
              />
              <button
                disabled={!customOccasionInput.trim()}
                onClick={() => handleStep2CreateList(customOccasionInput.trim(), "other")}
                className="px-4 py-2 bg-[#10b981] hover:bg-emerald-400 disabled:bg-zinc-800 text-zinc-950 font-black text-xs rounded-xl transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                {isFa ? "ساخت" : "Create"}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Add First Item */}
        {onboardingState.step === 3 && (
          <div className="space-y-3">
            <div className="bg-zinc-900/60 p-3 rounded-2xl border border-zinc-850 space-y-1">
              <p className="text-xs text-white font-bold leading-relaxed">
                {isFa ? "لیستت ساخته شد! 🎁 حالا چی دوست داری اولین هدیه باشه؟" : "List created! 🎁 What gift would you like first?"}
              </p>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                {isFa ? "می‌تونی از هدیه‌های پیشنهادی زیر انتخاب کنی یا اسمش رو بنویسی:" : "Pick from instant recommendations or write one:"}
              </p>
            </div>

            {/* AI Instant Suggestions */}
            <div className="space-y-1.5 text-xs">
              <button
                onClick={() => handleStep3AddItem("هدفون بی‌سیم انکر Soundcore P20i", 1250000)}
                className="w-full p-2.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-[#10b981]/50 rounded-xl text-right font-bold transition-all cursor-pointer flex items-center justify-between text-zinc-200"
              >
                <div className="flex items-center gap-2">
                  <span>🎧</span>
                  <span>هدفون بی‌سیم انکر Soundcore</span>
                </div>
                <span className="text-[10px] text-[#10b981] font-mono">۱,۲۵۰,۰۰۰ تومان</span>
              </button>

              <button
                onClick={() => handleStep3AddItem("قهوه‌ساز موکاپات برقی رومولو", 1200000)}
                className="w-full p-2.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-[#10b981]/50 rounded-xl text-right font-bold transition-all cursor-pointer flex items-center justify-between text-zinc-200"
              >
                <div className="flex items-center gap-2">
                  <span>☕</span>
                  <span>قهوه‌ساز موکاپات برقی</span>
                </div>
                <span className="text-[10px] text-[#10b981] font-mono">۱,۲۰ص,۰۰۰ تومان</span>
              </button>

              <button
                onClick={() => handleStep3AddItem("ساعت هوشمند می بند ۸ شیائومی", 2100000)}
                className="w-full p-2.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-[#10b981]/50 rounded-xl text-right font-bold transition-all cursor-pointer flex items-center justify-between text-zinc-200"
              >
                <div className="flex items-center gap-2">
                  <span>⌚</span>
                  <span>ساعت هوشمند می بند ۸</span>
                </div>
                <span className="text-[10px] text-[#10b981] font-mono">۲,۱۰۰,۰۰۰ تومان</span>
              </button>
            </div>

            {/* Custom Item Form */}
            <div className="flex gap-2">
              <input
                type="text"
                value={customItemInput}
                onChange={(e) => setCustomItemInput(e.target.value)}
                placeholder={isFa ? "نام هدیه دلخواه... (مثلاً: ماگ سرامیکی)" : "Custom item name..."}
                className="flex-1 bg-zinc-900 border border-zinc-800 focus:border-[#10b981] px-3 py-2 rounded-xl text-xs font-bold text-white outline-none transition-all"
              />
              <button
                disabled={!customItemInput.trim()}
                onClick={() => handleStep3AddItem(customItemInput.trim())}
                className="px-4 py-2 bg-[#10b981] hover:bg-emerald-400 disabled:bg-zinc-800 text-zinc-950 font-black text-xs rounded-xl transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                {isFa ? "افزودن" : "Add"}
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Share Link & Invite Friends */}
        {onboardingState.step === 4 && (
          <div className="space-y-3">
            <div className="bg-zinc-900/60 p-3 rounded-2xl border border-zinc-850 space-y-1">
              <p className="text-xs text-white font-bold leading-relaxed flex items-center gap-1.5">
                <span>فوق‌العاده بود! ✨ همه چیز آماده است.</span>
                <Sparkles className="w-4 h-4 text-amber-400" />
              </p>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                {isFa
                  ? "حالا لینک اختصاصی لیستت رو برای دوستات بفرست تا بدونن چی خوشحالت میکنه و برات رزرو کنن!"
                  : "Now share your custom link with friends so they know what you love!"}
              </p>
            </div>

            {/* Link Box */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-2.5 flex items-center justify-between gap-2">
              <p className="text-[10px] text-emerald-400 font-mono truncate dir-ltr select-all flex-1">
                {shareUrl}
              </p>
              <button
                onClick={handleCopyLink}
                className={`px-3 py-1.5 rounded-xl font-black text-[10px] transition-all flex items-center gap-1 shrink-0 cursor-pointer ${
                  isCopied
                    ? "bg-emerald-500 text-zinc-950"
                    : "bg-zinc-800 hover:bg-zinc-700 text-white"
                }`}
              >
                {isCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>{isFa ? "کپی شد" : "Copied"}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>{isFa ? "کپی لینک" : "Copy"}</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Social Share Buttons */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={handleTelegramShare}
                className="py-2.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isFa ? "ارسال در تلگرام" : "Share Telegram"}</span>
              </button>

              <button
                onClick={() => {
                  onSwitchTab("friends");
                  handleStep4Finish();
                }}
                className="py-2.5 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{isFa ? "شبکه دوستان" : "Friends Feed"}</span>
              </button>
            </div>

            <button
              onClick={handleStep4Finish}
              className="w-full py-2.5 bg-[#10b981] hover:bg-emerald-400 text-zinc-950 font-black text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{isFa ? "پایان راه‌اندازی و ورود به اپ" : "Finish & Explore App"}</span>
            </button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
