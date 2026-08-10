import React, { useState } from "react";
import { UserProfile, Language } from "../types";
import { X, Sparkles, RefreshCw, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AvatarPickerProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  setUser: (user: UserProfile) => void;
  language: Language;
}

export const AVATAR_CATEGORIES = [
  {
    id: "fruits",
    nameFa: "میوه‌ها 🍎",
    nameEn: "Fruits 🍎",
    items: [
      { emoji: "🍎", labelFa: "سیب سرخ", labelEn: "Red Apple", bg: "from-red-500/20 to-rose-600/10 border-red-500/20" },
      { emoji: "🍓", labelFa: "توت فرنگی", labelEn: "Strawberry", bg: "from-pink-500/20 to-rose-500/10 border-pink-500/20" },
      { emoji: "🍉", labelFa: "هندوانه", labelEn: "Watermelon", bg: "from-emerald-500/20 to-red-500/10 border-emerald-500/20" },
      { emoji: "🍒", labelFa: "گیلاس", labelEn: "Cherry", bg: "from-rose-600/20 to-red-700/10 border-rose-600/20" },
      { emoji: "🍑", labelFa: "هلو", labelEn: "Peach", bg: "from-orange-400/20 to-amber-500/10 border-orange-400/20" },
      { emoji: "🍋", labelFa: "لیمو ترش", labelEn: "Lemon", bg: "from-yellow-400/20 to-amber-400/10 border-yellow-400/20" },
      { emoji: "🍍", labelFa: "آناناس", labelEn: "Pineapple", bg: "from-yellow-500/20 to-orange-500/10 border-yellow-500/20" },
      { emoji: "🥑", labelFa: "آووکادو", labelEn: "Avocado", bg: "from-green-500/20 to-emerald-600/10 border-green-500/20" },
      { emoji: "🍇", labelFa: "انگور", labelEn: "Grape", bg: "from-purple-500/20 to-indigo-600/10 border-purple-500/20" },
      { emoji: "🥥", labelFa: "نارگیل", labelEn: "Coconut", bg: "from-amber-800/20 to-zinc-700/10 border-amber-800/20" },
    ]
  },
  {
    id: "flowers",
    nameFa: "گل‌ها 🌸",
    nameEn: "Flowers 🌸",
    items: [
      { emoji: "🌸", labelFa: "شکوفه گیلاس", labelEn: "Cherry Blossom", bg: "from-pink-400/20 to-rose-400/10 border-pink-400/20" },
      { emoji: "🌹", labelFa: "رز قرمز", labelEn: "Red Rose", bg: "from-red-600/20 to-rose-700/10 border-red-600/20" },
      { emoji: "🌻", labelFa: "آفتابگردان", labelEn: "Sunflower", bg: "from-yellow-400/20 to-amber-500/10 border-yellow-400/20" },
      { emoji: "🌷", labelFa: "لاله صورتی", labelEn: "Tulip", bg: "from-pink-500/20 to-purple-500/10 border-pink-500/20" },
      { emoji: "🌺", labelFa: "ختمی", labelEn: "Hibiscus", bg: "from-red-500/20 to-pink-500/10 border-red-500/20" },
      { emoji: "🌼", labelFa: "بابونه", labelEn: "Daisy", bg: "from-yellow-200/20 to-zinc-400/10 border-yellow-200/20" },
      { emoji: "🍀", labelFa: "شبدر چهارپر", labelEn: "Four Leaf Clover", bg: "from-green-400/20 to-emerald-500/10 border-green-400/20" },
      { emoji: "🌵", labelFa: "کاکتوس", labelEn: "Cactus", bg: "from-emerald-600/20 to-teal-700/10 border-emerald-600/20" },
    ]
  },
  {
    id: "animals",
    nameFa: "حیوانات 🦁",
    nameEn: "Animals 🦁",
    items: [
      { emoji: "🦁", labelFa: "شیر سلطان", labelEn: "Lion", bg: "from-amber-500/20 to-yellow-600/10 border-amber-500/20" },
      { emoji: "🐯", labelFa: "ببر وحشی", labelEn: "Tiger", bg: "from-orange-500/20 to-amber-600/10 border-orange-500/20" },
      { emoji: "🐻", labelFa: "خرس قهوه‌ای", labelEn: "Bear", bg: "from-amber-800/20 to-amber-950/10 border-amber-800/20" },
      { emoji: "🐼", labelFa: "پاندا", labelEn: "Panda", bg: "from-zinc-100/10 to-zinc-800/20 border-zinc-500/20" },
      { emoji: "🐨", labelFa: "کوآلا", labelEn: "Koala", bg: "from-zinc-400/20 to-slate-500/10 border-zinc-400/20" },
      { emoji: "🦊", labelFa: "روباه مکار", labelEn: "Fox", bg: "from-orange-600/20 to-red-500/10 border-orange-600/20" },
      { emoji: "🐰", labelFa: "خرگوش باهوش", labelEn: "Rabbit", bg: "from-pink-100/20 to-zinc-300/10 border-pink-100/20" },
      { emoji: "🐱", labelFa: "پیشی ملوس", labelEn: "Cat", bg: "from-amber-400/20 to-orange-400/10 border-amber-400/20" },
      { emoji: "🐶", labelFa: "هاپو باوفا", labelEn: "Dog", bg: "from-yellow-600/20 to-amber-800/10 border-yellow-600/20" },
      { emoji: "🦄", labelFa: "تک‌شاخ جادویی", labelEn: "Unicorn", bg: "from-purple-400/20 to-pink-500/10 border-purple-400/20" },
      { emoji: "🦌", labelFa: "گوزن زیبا", labelEn: "Deer", bg: "from-amber-700/20 to-yellow-800/10 border-amber-700/20" },
      { emoji: "🦉", labelFa: "جغد دانا", labelEn: "Owl", bg: "from-indigo-900/20 to-slate-800/10 border-indigo-900/20" },
    ]
  }
];

export default function AvatarPicker({ isOpen, onClose, user, setUser, language }: AvatarPickerProps) {
  const [activeTab, setActiveTab] = useState<string>("fruits");
  const isFa = language === "fa";

  if (!isOpen) return null;

  const currentCategory = AVATAR_CATEGORIES.find((cat) => cat.id === activeTab) || AVATAR_CATEGORIES[0];

  const handleSelectAvatar = (emoji: string) => {
    setUser({
      ...user,
      avatar: emoji,
    });
    onClose();
  };

  const handleRandomize = () => {
    const allItems = AVATAR_CATEGORIES.flatMap((cat) => cat.items);
    const randomItem = allItems[Math.floor(Math.random() * allItems.length)];
    handleSelectAvatar(randomItem.emoji);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm"
        />

        {/* Modal content container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md overflow-hidden relative z-10 flex flex-col max-h-[90vh]"
          style={{ direction: isFa ? "rtl" : "ltr" }}
        >
          {/* Header */}
          <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">✨</span>
              <h3 className="text-sm font-black text-white">
                {isFa ? "انتخاب آواتار پروفایل" : "Select Profile Avatar"}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Current selected Avatar visualization */}
          <div className="p-5 bg-zinc-950/40 flex items-center justify-between gap-4 border-b border-zinc-800/50">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center font-black text-2xl text-white shadow-inner select-none overflow-hidden">
                {user.avatar ? (
                  user.avatar.startsWith("http") ? (
                    <img src={user.avatar} className="w-full h-full object-cover" referrerPolicy="no-referrer" alt={user.name} />
                  ) : (
                    user.avatar
                  )
                ) : "👤"}
              </div>
              <div className="space-y-1">
                <p className="text-xs font-black text-white">
                  {isFa ? "آواتار فعلی شما" : "Your Current Avatar"}
                </p>
                <p className="text-[10px] text-zinc-500">
                  {user.avatar 
                    ? (isFa ? "یک آواتار شاد و باحال انتخاب کردید" : "You have selected a fun avatar")
                    : (isFa ? "هنوز آواتاری انتخاب نکرده‌اید" : "No custom avatar chosen yet")
                  }
                </p>
              </div>
            </div>

            <button
              onClick={handleRandomize}
              className="px-3.5 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-[#10b981] border border-emerald-500/15 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
              <span>{isFa ? "تصادفی" : "Random"}</span>
            </button>
          </div>

          {/* Tab bar */}
          <div className="flex border-b border-zinc-800 p-2 bg-zinc-950/20 gap-1 text-[10px] font-bold">
            {AVATAR_CATEGORIES.map((cat) => {
              const isActive = activeTab === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveTab(cat.id)}
                  className={`flex-1 py-2 rounded-xl transition-all cursor-pointer text-center ${
                    isActive 
                      ? "bg-zinc-800 text-[#10b981] border border-zinc-700/50" 
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {isFa ? cat.nameFa : cat.nameEn}
                </button>
              );
            })}
          </div>

          {/* Grid of Avatars */}
          <div className="p-5 overflow-y-auto max-h-[300px] grid grid-cols-4 sm:grid-cols-5 gap-3.5">
            {currentCategory.items.map((item, idx) => {
              const isSelected = user.avatar === item.emoji;
              return (
                <button
                  key={idx}
                  onClick={() => handleSelectAvatar(item.emoji)}
                  className={`relative aspect-square rounded-2xl bg-gradient-to-tr ${item.bg} border hover:scale-105 transition-all flex flex-col items-center justify-center cursor-pointer group`}
                >
                  {/* Emoji itself */}
                  <span className="text-3xl select-none group-hover:scale-110 transition-transform duration-200">
                    {item.emoji}
                  </span>

                  {/* Tiny check badge if selected */}
                  {isSelected && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center text-zinc-950 border border-zinc-900">
                      <Check className="w-2.5 h-2.5 stroke-[4px]" />
                    </span>
                  )}

                  {/* Label tooltip or tiny subtitle (Only visible on hover or compact) */}
                  <span className="absolute bottom-1 text-[7px] text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-950/80 px-1 rounded truncate max-w-[90%] pointer-events-none">
                    {isFa ? item.labelFa : item.labelEn}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Footer message */}
          <div className="p-4 border-t border-zinc-800/80 bg-zinc-950/40 text-center">
            <p className="text-[9.5px] text-zinc-500">
              {isFa 
                ? "💡 آواتار انتخابی شما در تمامی لیست‌های آرزو و بخش‌های اجتماعی نمایش داده می‌شود." 
                : "💡 Your chosen avatar will be displayed across your wishlists and social feeds."}
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
