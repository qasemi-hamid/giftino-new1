import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BadgeCheck, ShieldCheck, Sparkles, Star, Award, CheckCircle2, ChevronDown, X } from "lucide-react";
import { Language } from "../types";
import { toPersianDigits } from "../utils";

export interface ExpertBadgeProps {
  isAdvisor?: boolean;
  category?: string;
  badgeTitle?: string;
  variant?: "inline" | "pill" | "badge" | "card";
  size?: "xs" | "sm" | "md" | "lg";
  language?: Language;
  interactive?: boolean;
  showCategoryText?: boolean;
  className?: string;
  rating?: number;
  followersCount?: number;
}

// Category icon & color theme mappings
const CATEGORY_THEMES: Record<string, { icon: string; color: string; border: string; bg: string; text: string }> = {
  "پیشنهاددهنده برتر": {
    icon: "🛍️",
    color: "from-amber-500 to-emerald-500",
    border: "border-amber-500/30",
    bg: "bg-amber-500/10",
    text: "text-amber-400"
  },
  "گجت و تکنولوژی": {
    icon: "💻",
    color: "from-blue-500 to-cyan-400",
    border: "border-blue-500/30",
    bg: "bg-blue-500/10",
    text: "text-blue-400"
  },
  "مد و زیبایی": {
    icon: "👗",
    color: "from-pink-500 to-rose-400",
    border: "border-pink-500/30",
    bg: "bg-pink-500/10",
    text: "text-pink-400"
  },
  "قهوه و کافه": {
    icon: "☕",
    color: "from-amber-600 to-orange-500",
    border: "border-amber-600/30",
    bg: "bg-amber-600/10",
    text: "text-amber-500"
  },
  "کتاب و ادبیات": {
    icon: "📚",
    color: "from-emerald-500 to-teal-400",
    border: "border-emerald-500/30",
    bg: "bg-emerald-500/10",
    text: "text-emerald-400"
  },
  "جهیزیه و خانه": {
    icon: "🏡",
    color: "from-purple-500 to-indigo-400",
    border: "border-purple-500/30",
    bg: "bg-purple-500/10",
    text: "text-purple-400"
  },
  "ورزش و سفر": {
    icon: "⚽",
    color: "from-lime-500 to-emerald-500",
    border: "border-lime-500/30",
    bg: "bg-lime-500/10",
    text: "text-lime-400"
  },
  "بازی و سرگرمی": {
    icon: "🎮",
    color: "from-violet-500 to-fuchsia-500",
    border: "border-violet-500/30",
    bg: "bg-violet-500/10",
    text: "text-violet-400"
  }
};

const DEFAULT_THEME = {
  icon: "👑",
  color: "from-emerald-500 to-blue-500",
  border: "border-emerald-500/30",
  bg: "bg-emerald-500/10",
  text: "text-emerald-400"
};

export const ExpertBadge: React.FC<ExpertBadgeProps> = ({
  isAdvisor = true,
  category = "پیشنهاددهنده برتر",
  badgeTitle,
  variant = "inline",
  size = "sm",
  language = "fa",
  interactive = true,
  showCategoryText = true,
  className = "",
  rating = 4.9,
  followersCount = 1280
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const isFa = language === "fa";

  if (!isAdvisor && !category) return null;

  const theme = CATEGORY_THEMES[category] || DEFAULT_THEME;
  const displayTitle = badgeTitle || (isFa ? "کیوریتور رسمی" : "Verified Curator");
  const displayCategory = category || (isFa ? "پیشنهاددهنده برتر" : "Top Curator");

  // Size sizing classes
  const iconSizes = {
    xs: "w-3 h-3 text-[9px]",
    sm: "w-3.5 h-3.5 text-[10px]",
    md: "w-4 h-4 text-xs",
    lg: "w-5 h-5 text-sm"
  };

  const badgePadding = {
    xs: "px-1.5 py-0.5 text-[9px]",
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-2.5 py-1 text-xs",
    lg: "px-3 py-1.5 text-sm"
  };

  const handleToggleTooltip = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (interactive) {
      setShowTooltip(!showTooltip);
    }
  };

  return (
    <div className={`relative inline-flex items-center shrink-0 select-none ${className}`}>
      {/* VARIANT 1: INLINE VERIFIED BADGE (Checkmark icon next to name) */}
      {variant === "inline" && (
        <button
          type="button"
          onClick={handleToggleTooltip}
          className={`inline-flex items-center gap-1 group transition-transform active:scale-95 cursor-pointer ${
            interactive ? "hover:opacity-90" : ""
          }`}
          title={isFa ? `نشان تخصصی: ${displayCategory}` : `Expert Badge: ${displayCategory}`}
        >
          {/* Badge Icon Shield */}
          <span className="relative flex items-center justify-center">
            <span className="absolute inset-0 rounded-full bg-blue-500/20 blur-[2px] animate-pulse" />
            <span className="w-4 h-4 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400 text-white flex items-center justify-center font-black text-[9px] shadow-sm border border-blue-300/40 relative z-10">
              ✓
            </span>
          </span>

          {showCategoryText && (
            <span className={`font-extrabold ${theme.text} bg-zinc-900/80 ${theme.border} border px-1.5 py-0.5 rounded-md text-[9.5px] flex items-center gap-1 shadow-sm`}>
              <span className="text-[10px]">{theme.icon}</span>
              <span>{displayCategory}</span>
            </span>
          )}
        </button>
      )}

      {/* VARIANT 2: PILL BADGE */}
      {variant === "pill" && (
        <button
          type="button"
          onClick={handleToggleTooltip}
          className={`inline-flex items-center gap-1.5 ${badgePadding[size]} rounded-full font-black bg-gradient-to-r ${theme.bg} border ${theme.border} ${theme.text} shadow-sm backdrop-blur-md cursor-pointer transition-all hover:scale-[1.02] active:scale-95`}
        >
          <span className="relative flex items-center justify-center">
            <BadgeCheck className={`${iconSizes[size]} text-blue-400 fill-blue-500/20`} />
          </span>
          <span className="text-[10px]">{theme.icon}</span>
          <span className="truncate">{displayCategory}</span>
          {interactive && <ChevronDown className="w-3 h-3 opacity-60" />}
        </button>
      )}

      {/* VARIANT 3: FULL BADGE CARD */}
      {variant === "badge" && (
        <div
          onClick={handleToggleTooltip}
          className={`p-2.5 rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border ${theme.border} shadow-md flex items-center gap-2.5 cursor-pointer hover:border-emerald-500/50 transition-all`}
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-emerald-500 flex items-center justify-center text-white font-black text-sm shadow-md shrink-0">
            {theme.icon}
          </div>
          <div className="min-w-0 text-right rtl:text-right">
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-black text-white">{displayTitle}</span>
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <p className={`text-[9px] font-bold ${theme.text}`}>{displayCategory}</p>
          </div>
        </div>
      )}

      {/* VARIANT 4: MINI CARD */}
      {variant === "card" && (
        <div 
          onClick={handleToggleTooltip}
          className="bg-zinc-950/80 border border-zinc-800/90 rounded-xl p-2 flex items-center gap-2 cursor-pointer hover:border-blue-500/40 transition-all"
        >
          <span className="text-base">{theme.icon}</span>
          <div className="text-right">
            <span className="text-[9.5px] font-black text-white block">{displayCategory}</span>
            <span className="text-[8px] text-zinc-400 font-medium block">{isFa ? "نشان تخصصی تایید شده" : "Verified Expert"}</span>
          </div>
        </div>
      )}

      {/* INTERACTIVE POPOVER TOOLTIP */}
      <AnimatePresence>
        {showTooltip && (
          <>
            {/* Backdrop for easy outside click */}
            <div 
              className="fixed inset-0 z-40 bg-black/20" 
              onClick={(e) => { e.stopPropagation(); setShowTooltip(false); }} 
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 8 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-full mb-2 right-0 rtl:right-0 ltr:left-0 z-50 w-64 p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 shadow-[0_15px_40px_rgba(0,0,0,0.8)] text-right space-y-2.5 backdrop-blur-xl"
              style={{ direction: isFa ? "rtl" : "ltr" }}
            >
              {/* Tooltip Header */}
              <div className="flex items-center justify-between pb-2 border-b border-zinc-850">
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 border border-blue-400/40 flex items-center justify-center">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                  <div>
                    <h5 className="text-[10px] font-black text-white flex items-center gap-1">
                      <span>{isFa ? "نشان تخصصی تایید شده" : "Verified Expert Badge"}</span>
                    </h5>
                    <span className="text-[8px] text-blue-400 font-mono font-bold block">
                      {isFa ? "شناسه کیوریتور رسمی گیفتی‌نو" : "Official Giftino Curator"}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowTooltip(false)}
                  className="text-zinc-500 hover:text-white p-1 rounded-full hover:bg-zinc-900 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Body details */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between bg-zinc-900/60 p-2 rounded-xl border border-zinc-850">
                  <span className="text-[9.5px] text-zinc-400 font-bold">{isFa ? "حوزه تخصصی:" : "Specialty:"}</span>
                  <span className={`text-[10px] font-black ${theme.text} flex items-center gap-1`}>
                    <span>{theme.icon}</span>
                    <span>{displayCategory}</span>
                  </span>
                </div>

                <p className="text-[9px] text-zinc-300 leading-relaxed font-medium bg-zinc-900/40 p-2 rounded-xl border border-zinc-900">
                  {isFa
                    ? `این کاربر به عنوان ${displayCategory} فعالیت دارد و راهنماها و پیشنهادهای کادوی او توسط الگوریتم گیفتی‌نو ارزیابی و تایید شده است.`
                    : `This user is verified in the category of ${displayCategory}. Their gift guides are curated and verified.`}
                </p>
              </div>

              {/* Footer Metrics */}
              <div className="pt-2 border-t border-zinc-850 flex items-center justify-between text-[9px]">
                <div className="flex items-center gap-1 text-amber-400 font-bold">
                  <Star className="w-3 h-3 fill-amber-400" />
                  <span>{isFa ? `${toPersianDigits(rating)} (امتیاز تخصصی)` : `${rating} Rating`}</span>
                </div>
                <div className="text-zinc-400 font-mono">
                  <span>{isFa ? `${toPersianDigits(followersCount.toLocaleString())} دنبال‌کننده` : `${followersCount} Followers`}</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ExpertBadge;
