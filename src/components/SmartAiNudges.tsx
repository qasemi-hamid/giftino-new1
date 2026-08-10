import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Bell, AlertCircle, Sparkles, Check, Share2, 
  UserPlus, Gift, ShoppingBag, ArrowRight, X, Clock
} from "lucide-react";
import { Wishlist, Language, UserProfile } from "../types";

export interface SmartNudge {
  id: string;
  type: "reserved_unbought" | "no_wishlist" | "empty_wishlist" | "unshared_wishlist" | "no_friends" | "upcoming_occasion";
  titleFa: string;
  titleEn: string;
  descFa: string;
  descEn: string;
  actionTextFa: string;
  actionTextEn: string;
  badge: string;
  targetTab?: string;
  payload?: any;
}

interface SmartAiNudgesProps {
  language: Language;
  user: UserProfile | null;
  wishlists: Wishlist[];
  claimedItems: any[];
  followingFriendIds: string[];
  onExecuteNudgeAction: (nudge: SmartNudge) => void;
  onDismissNudge: (id: string) => void;
}

export function generateSmartNudges(
  language: Language,
  user: UserProfile | null,
  wishlists: Wishlist[],
  claimedItems: any[],
  followingFriendIds: string[]
): SmartNudge[] {
  const isFa = language === "fa";
  const nudges: SmartNudge[] = [];

  // 1. Reserved but Unbought Items (Highest priority!)
  const unboughtClaimed = claimedItems.filter((ci) => !ci.isCompleted);
  if (unboughtClaimed.length > 0) {
    const firstItem = unboughtClaimed[0];
    nudges.push({
      id: `nudge_unbought_${firstItem.item.id}`,
      type: "reserved_unbought",
      titleFa: "کادوی رزرو شده هنوز خریداری نشده! 🛍️",
      titleEn: "Reserved gift not marked purchased! 🛍️",
      descFa: `شما «${firstItem.item.title}» را برای ${firstItem.friendName} رزرو کرده‌اید. آیا خرید آن انجام شده است؟`,
      descEn: `You reserved "${firstItem.item.title}" for ${firstItem.friendName}. Has it been purchased?`,
      actionTextFa: "تکمیل و علامت خرید",
      actionTextEn: "Mark Purchased",
      badge: "تعهد رزرو",
      targetTab: "claimed",
      payload: firstItem,
    });
  }

  // 2. No Wishlists created
  if (wishlists.length === 0) {
    nudges.push({
      id: "nudge_no_wishlist",
      type: "no_wishlist",
      titleFa: "هنوز لیست آرزو نداری! 🎁✨",
      titleEn: "You haven't created a wishlist yet! 🎁✨",
      descFa: "با ساخت اولین لیست، دوستات دقیقاً می‌دونن چی برای تولد یا مناسبت‌هات هدیه بخرن.",
      descEn: "Create your first list so friends know what to get you for your celebration.",
      actionTextFa: "ساخت هوشمند لیست",
      actionTextEn: "Create Smart List",
      badge: "راه‌اندازی",
      targetTab: "my-lists",
    });
  } else {
    // 3. Check if all wishlists are empty
    const totalItems = wishlists.reduce((acc, wl) => acc + (wl.items?.length || 0), 0);
    if (totalItems === 0) {
      nudges.push({
        id: "nudge_empty_wishlist",
        type: "empty_wishlist",
        titleFa: "لیست آرزوی شما خالی است! 📝",
        titleEn: "Your wishlist is empty! 📝",
        descFa: "کادوی دلخواهت چیه؟ با هوش مصنوعی چند پیشنهاد جذاب به لیستت اضافه کن.",
        descEn: "What gifts do you love? Use AI to add creative items to your registry.",
        actionTextFa: "پیشنهاد کادو با هوش مصنوعی",
        actionTextEn: "AI Gift Recommendations",
        badge: "افزودن آرزو",
        targetTab: "explore",
      });
    }

    // 4. Check if wishlists haven't been shared
    const isShared = localStorage.getItem("giftino_wishlist_shared_v1");
    if (!isShared) {
      nudges.push({
        id: "nudge_unshared_wishlist",
        type: "unshared_wishlist",
        titleFa: "لیستت رو برای دوستات بفرست! 🔗",
        titleEn: "Share your wishlist with friends! 🔗",
        descFa: "هنوز لینک لیست آرزوهات رو به دوستات نفرستادی! ارسال کن تا سورپرایزت کنن.",
        descEn: "You haven't shared your link with friends yet! Send it to let them know.",
        actionTextFa: "کپی لینک و اشتراک",
        actionTextEn: "Copy Link & Share",
        badge: "اشتراک‌گذاری",
        targetTab: "my-lists",
      });
    }
  }

  // 5. No friends followed
  if (followingFriendIds.length === 0) {
    nudges.push({
      id: "nudge_no_friends",
      type: "no_friends",
      titleFa: "شبکه دوستانت خالیه! 👥",
      titleEn: "Your friends network is empty! 👥",
      descFa: "دوستات رو دنبال کن تا لیست آرزوهاشون رو ببینی و بدون استرس براشون کادو بخری.",
      descEn: "Follow friends to see their registries and pick gifts stress-free.",
      actionTextFa: "دنبال کردن دوستان",
      actionTextEn: "Find Friends",
      badge: "شبکه دوستان",
      targetTab: "friends",
    });
  }

  // 6. Upcoming Occasions (within 10 days)
  const today = new Date();
  wishlists.forEach((wl) => {
    if (wl.occasionDate) {
      const occDate = new Date(wl.occasionDate);
      const diffTime = occDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays <= 10) {
        nudges.push({
          id: `nudge_occ_${wl.id}`,
          type: "upcoming_occasion",
          titleFa: `مناسبت «${wl.title}» نزدیکه! ⏳`,
          titleEn: `Occasion "${wl.title}" is coming up! ⏳`,
          descFa: `فقط ${diffDays} روز تا برگزاری باقی مونده. کادوهات تکمیل شده؟`,
          descEn: `Only ${diffDays} days left. Are your gifts ready?`,
          actionTextFa: "بررسی لیست",
          actionTextEn: "Review List",
          badge: "یادآوری مناسبت",
          targetTab: "my-lists",
          payload: wl,
        });
      }
    }
  });

  return nudges;
}

export const SmartAiNudgesPanel: React.FC<SmartAiNudgesProps> = ({
  language,
  user,
  wishlists,
  claimedItems,
  followingFriendIds,
  onExecuteNudgeAction,
  onDismissNudge,
}) => {
  const isFa = language === "fa";
  const nudges = generateSmartNudges(language, user, wishlists, claimedItems, followingFriendIds);

  if (nudges.length === 0) {
    return (
      <div className="p-4 text-center space-y-2">
        <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto text-lg">
          ✨
        </div>
        <p className="text-xs font-bold text-white">
          {isFa ? "همه چیز منظم و مرتبه!" : "Everything is on track!"}
        </p>
        <p className="text-[10px] text-zinc-400">
          {isFa ? "دستیار هوشمند تمام وظایف و رزروها رو زیر نظر داره." : "Smart AI Assistant is monitoring all your tasks."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5 p-1">
      <div className="flex items-center justify-between px-2 text-xs font-bold text-zinc-400">
        <span className="flex items-center gap-1.5 text-emerald-400 font-black">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isFa ? "پیام‌ها و یادآوری‌های دستیار هوشمند" : "AI Smart Nudges"}</span>
        </span>
        <span className="text-[10px] bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full font-mono">
          {nudges.length} {isFa ? "مورد" : "items"}
        </span>
      </div>

      <div className="space-y-2 max-h-72 overflow-y-auto no-scrollbar">
        {nudges.map((nudge) => (
          <motion.div
            key={nudge.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-zinc-900/90 border border-zinc-800 hover:border-emerald-500/40 p-3 rounded-2xl space-y-2 transition-all relative group shadow-md"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {nudge.badge}
                </span>
                <h4 className="text-xs font-black text-white leading-tight">
                  {isFa ? nudge.titleFa : nudge.titleEn}
                </h4>
              </div>

              <button
                onClick={() => onDismissNudge(nudge.id)}
                className="text-zinc-500 hover:text-zinc-300 p-1 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
                title={isFa ? "رد کردن" : "Dismiss"}
              >
                <X className="w-3 h-3" />
              </button>
            </div>

            <p className="text-[10.5px] text-zinc-300 leading-relaxed font-sans font-medium text-right">
              {isFa ? nudge.descFa : nudge.descEn}
            </p>

            <div className="pt-1 flex justify-end">
              <button
                onClick={() => onExecuteNudgeAction(nudge)}
                className="px-3 py-1.5 bg-[#10b981] hover:bg-emerald-400 text-zinc-950 font-black text-[10px] rounded-xl transition-all shadow-sm flex items-center gap-1 cursor-pointer"
              >
                <span>{isFa ? nudge.actionTextFa : nudge.actionTextEn}</span>
                <ArrowRight className="w-3 h-3 rtl:rotate-180" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
