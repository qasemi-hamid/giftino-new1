import React, { useState, useEffect } from "react";
import { UserProfile, Wishlist, WishlistItem, Language } from "../types";
import { 
  CheckCircle, Trash2, ExternalLink, RefreshCw, Calendar, Lock, Clock,
  AlertTriangle, Check, UserCheck, CreditCard, ChevronDown, ChevronUp, Share2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toPersianDigits, formatTomanToWords } from "../utils";

interface ClaimedItem {
  friendId: string;
  friendName: string;
  friendAvatar: string;
  listId: string;
  listTitle: string;
  item: WishlistItem;
}

interface ClaimedItemsProps {
  user: UserProfile;
  language: Language;
  claimedItems: ClaimedItem[];
  onUnclaimItem: (friendId: string, listId: string, itemId: string) => void;
}

export default function ClaimedItems({
  user,
  language,
  claimedItems,
  onUnclaimItem
}: ClaimedItemsProps) {
  const isFa = language === "fa";

  const [localClaims, setLocalClaims] = useState<ClaimedItem[]>([]);
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);
  const [purchaseTrackingInput, setPurchaseTrackingInput] = useState<{ [itemId: string]: string }>({});
  const [showPurchaseFormId, setShowPurchaseFormId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  // Load claims and notifications from localStorage
  useEffect(() => {
    const savedClaims = localStorage.getItem("giftino_claimed_items");
    if (savedClaims) {
      setLocalClaims(JSON.parse(savedClaims));
    } else {
      setLocalClaims(claimedItems);
    }

    const savedNotifs = localStorage.getItem("giftino_notifications");
    if (savedNotifs) {
      setNotifications(JSON.parse(savedNotifs));
    }
  }, [claimedItems]);

  // Sync back helper
  const syncToStorage = (updatedClaims: ClaimedItem[]) => {
    setLocalClaims(updatedClaims);
    localStorage.setItem("giftino_claimed_items", JSON.stringify(updatedClaims));

    // Also sync to friends list
    const savedFriends = localStorage.getItem("giftino_friends_data");
    if (savedFriends) {
      const friends = JSON.parse(savedFriends);
      const updatedFriends = friends.map((f: any) => {
        // Find if this friend has any claimed items we updated
        const matchClaims = updatedClaims.filter(c => c.friendId === f.id);
        if (matchClaims.length > 0) {
          const updatedLists = f.wishlists.map((l: any) => {
            const listClaims = matchClaims.filter(c => c.listId === l.id);
            if (listClaims.length > 0) {
              const updatedItems = l.items.map((item: any) => {
                const claimMatch = listClaims.find(c => c.item.id === item.id);
                if (claimMatch) {
                  return claimMatch.item;
                }
                return item;
              });
              return { ...l, items: updatedItems };
            }
            return l;
          });
          return { ...f, wishlists: updatedLists };
        }
        return f;
      });
      localStorage.setItem("giftino_friends_data", JSON.stringify(updatedFriends));
    }
  };

  // 1. Approve collaborator payment
  const handleApprovePayment = (friendId: string, listId: string, itemId: string, contributorName: string) => {
    const updated = localClaims.map((claim) => {
      if (claim.friendId === friendId && claim.listId === listId && claim.item.id === itemId) {
        const item = claim.item;
        if (item.isGroupGift && item.groupGiftInfo) {
          const contributors = item.groupGiftInfo.contributors || [];
          let addedAmount = 0;
          const updatedContributors = contributors.map((c: any) => {
            if (c.name === contributorName && !c.isPaid) {
              addedAmount = c.amount;
              return { ...c, isPaid: true };
            }
            return c;
          });

          return {
            ...claim,
            item: {
              ...item,
              groupGiftInfo: {
                ...item.groupGiftInfo,
                contributors: updatedContributors,
                collectedAmount: (item.groupGiftInfo.collectedAmount || 0) + addedAmount
              }
            }
          };
        }
      }
      return claim;
    });

    syncToStorage(updated);
    setStatusMsg({
      text: isFa ? `✅ پرداخت ${contributorName} با موفقیت تایید شد و به سهم گروه اضافه گردید!` : `✅ Payment from ${contributorName} successfully approved!`,
      type: "success"
    });
    setTimeout(() => setStatusMsg(null), 5000);
  };

  // 2. Mark item as purchased
  const handleConfirmPurchase = (friendId: string, listId: string, itemId: string) => {
    const trackingCode = purchaseTrackingInput[itemId]?.trim();
    if (!trackingCode) {
      setStatusMsg({
        text: isFa ? "⚠️ لطفا شماره پیگیری یا فیش خرید را وارد کنید." : "⚠️ Please enter the purchase reference/tracking number.",
        type: "error"
      });
      setTimeout(() => setStatusMsg(null), 5000);
      return;
    }

    const updated = localClaims.map((claim) => {
      if (claim.friendId === friendId && claim.listId === listId && claim.item.id === itemId) {
        return {
          ...claim,
          item: {
            ...claim.item,
            isPurchased: true,
            purchaseRefNumber: trackingCode
          }
        };
      }
      return claim;
    });

    syncToStorage(updated);
    setShowPurchaseFormId(null);
    setStatusMsg({
      text: isFa ? "🎉 خرید هدیه با موفقیت تایید نهایی شد! قفل دائمی فعال گردید و به دوستتان تقدیم خواهد شد." : "🎉 Purchase verified and locked permanently!",
      type: "success"
    });
    setTimeout(() => setStatusMsg(null), 5000);
  };

  // 3. Extend reservation by 48h
  const handleExtendReservation = (friendId: string, listId: string, itemId: string) => {
    const updated = localClaims.map((claim) => {
      if (claim.friendId === friendId && claim.listId === listId && claim.item.id === itemId) {
        return {
          ...claim,
          item: {
            ...claim.item,
            reservationDate: "2026-07-08", // reset to active starting point
            isExtended: true
          }
        };
      }
      return claim;
    });

    syncToStorage(updated);
    setStatusMsg({
      text: isFa ? "🔄 مهلت رزرو موقت شما با موفقیت ۲ روز دیگر (۴۸ ساعت) تمدید شد!" : "🔄 Reservation lock extended by 48 hours successfully!",
      type: "success"
    });
    setTimeout(() => setStatusMsg(null), 5000);
  };

  // 4. Release reservation early
  const handleReleaseReservation = (friendId: string, listId: string, itemId: string) => {
    const confirmMsg = isFa 
      ? "آیا از لغو رزرو این هدیه اطمینان دارید؟ با این کار دیگران می‌توانند آن را رزرو کنند." 
      : "Are you sure you want to cancel your reservation for this gift? Others will be able to claim it.";
    
    if (window.confirm(confirmMsg)) {
      onUnclaimItem(friendId, listId, itemId);
      const filtered = localClaims.filter(c => !(c.friendId === friendId && c.listId === listId && c.item.id === itemId));
      setLocalClaims(filtered);
      localStorage.setItem("giftino_claimed_items", JSON.stringify(filtered));
    }
  };

  // Check if item has a pending owner-reminder
  const getItemNotification = (itemId: string) => {
    return notifications.find(n => n.itemId === itemId);
  };

  // Dismiss notification
  const handleDismissNotification = (itemId: string) => {
    const updated = notifications.filter(n => n.itemId !== itemId);
    setNotifications(updated);
    localStorage.setItem("giftino_notifications", JSON.stringify(updated));
  };

  return (
    <div className="space-y-6 select-none" style={{ direction: isFa ? "rtl" : "ltr" }}>
      
      <div className="text-center space-y-1.5">
        <h2 className="text-xl font-black text-white">{isFa ? "کادوهای رزرو شده من" : "Claimed Items"}</h2>
        <p className="text-xs text-zinc-400">
          {isFa ? "هدایایی که متعهد به خرید انفرادی یا مشارکتی آن‌ها شده‌اید." : "Gifts you have committed to buy individually or as a group."}
        </p>
      </div>

      <AnimatePresence>
        {statusMsg && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`p-3.5 rounded-2xl text-xs font-bold text-center border ${
              statusMsg.type === "success"
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/15"
                : statusMsg.type === "error"
                  ? "bg-rose-500/10 text-rose-400 border-rose-500/15"
                  : "bg-zinc-800 text-zinc-300 border-zinc-700"
            }`}
          >
            {statusMsg.text}
          </motion.div>
        )}
      </AnimatePresence>

      {localClaims.length === 0 ? (
        <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-10 text-center space-y-6">
          <div className="w-40 h-32 mx-auto relative flex items-center justify-center bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-850">
            <div className="w-14 h-14 bg-amber-500/10 border-2 border-dashed border-amber-400/40 rounded-full flex items-center justify-center text-2xl animate-bounce">
              🔭
            </div>
            <div className="absolute bottom-2 text-[8px] font-mono text-zinc-500 uppercase tracking-wider">
              SEARCHING REGISTRIES
            </div>
          </div>

          <div className="space-y-1.5">
            <h4 className="text-xs font-black text-white">
              {isFa ? "هنوز کادویی را رزرو نکرده‌اید" : "You haven't claimed any wishes yet!"}
            </h4>
            <p className="text-[10px] text-zinc-500 max-w-xs mx-auto leading-relaxed">
              {isFa 
                ? "به پروفایل دوستان خود بروید و هدیه‌ای که می‌خواهید برایشان بخرید را رزرو کنید تا کادوهای تکراری نگیرند." 
                : "Browse your friends' profiles, select a gift you want to get them, and reserve it to make their day!"}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-xs font-black text-zinc-400 uppercase tracking-wider">
            {isFa ? "هدایای تعهد داده شده شما" : "Your active claims"}
          </h3>

          <div className="space-y-4">
            {localClaims.map(({ friendId, friendName, friendAvatar, listId, listTitle, item }) => {
              const hasPing = getItemNotification(item.id);
              const isCoordinator = item.isGroupGift && item.groupGiftInfo?.coordinatorName === user.name;
              
              // Expiration calculations
              const isGroup = item.isGroupGift;
              const isPurchased = item.isPurchased;
              const isExtended = item.isExtended;

              return (
                <div
                  key={item.id}
                  className={`bg-zinc-900 border p-5 rounded-3xl flex flex-col justify-between relative overflow-hidden transition-all ${
                    isPurchased 
                      ? "border-emerald-500/30 bg-emerald-950/5" 
                      : hasPing 
                        ? "border-amber-500/40 animate-pulse bg-amber-950/5" 
                        : "border-zinc-800 hover:border-zinc-700"
                  }`}
                >
                  {/* Warning Notification Alert Banner inside the card */}
                  {hasPing && !isPurchased && (
                    <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 animate-bounce" />
                      <div className="flex-1 space-y-1">
                        <p className="text-[10px] font-black text-amber-300">
                          {isFa 
                            ? `🔔 یادآوری از طرف دوستت (${friendName})!` 
                            : `🔔 Reminder from your friend (${friendName})!`}
                        </p>
                        <p className="text-[9px] text-zinc-300 leading-normal">
                          {isFa 
                            ? "سلام! دوستت منتظر این هدیه است. مهلت رزرو موقت رو به پایان است، لطفا خرید خود را تایید یا تمدید کنید." 
                            : "Your friend is looking forward to this gift! Please verify purchase or extend claim."}
                        </p>
                        <button
                          onClick={() => handleDismissNotification(item.id)}
                          className="text-[8px] font-bold text-amber-400 hover:underline cursor-pointer"
                        >
                          {isFa ? "فهمیدم، بستن پیام" : "Dismiss"}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Friend banner header */}
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-950">
                    <div className="flex items-center gap-2">
                      {friendAvatar?.startsWith("http") || friendAvatar?.startsWith("/") || friendAvatar?.startsWith("data:") ? (
                        <img src={friendAvatar} alt={friendName} className="w-6 h-6 rounded-full object-cover shrink-0" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-750 flex items-center justify-center text-xs shrink-0 select-none">
                          <span>{friendAvatar || "👤"}</span>
                        </div>
                      )}
                      <span className="text-[10px] font-bold text-white">
                        {isFa ? `برای ${friendName}` : `For ${friendName}`}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        ({listTitle})
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {isGroup ? (
                        <span className="text-[8px] bg-amber-500/10 text-amber-400 font-black px-2 py-0.5 rounded-full border border-amber-500/20 flex items-center gap-0.5">
                          <span>👥</span>
                          <span>{isFa ? "مشارکتی" : "GROUP GIFT"}</span>
                        </span>
                      ) : (
                        <span className="text-[8px] bg-blue-500/10 text-blue-400 font-black px-2 py-0.5 rounded-full border border-blue-500/20 flex items-center gap-0.5">
                          <span>🎁</span>
                          <span>{isFa ? "تک‌نفره" : "INDIVIDUAL"}</span>
                        </span>
                      )}

                      {isPurchased ? (
                        <span className="text-[8px] bg-emerald-500/10 text-[#10b981] font-black px-2 py-0.5 rounded-full border border-emerald-500/20">
                          {isFa ? "خریداری شد ✅" : "PURCHASED ✅"}
                        </span>
                      ) : (
                        <span className="text-[8px] bg-zinc-800 text-zinc-400 font-black px-2 py-0.5 rounded-full border border-zinc-700/60">
                          {isFa ? "رزرو موقت ⏳" : "TEMPORARY LOCK ⏳"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Gift Info */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-extrabold text-white">{item.title}</h4>
                    {item.price && (
                      <p className="text-[11px] font-mono font-black text-[#10b981]">
                        {isFa ? toPersianDigits(item.price.toLocaleString()) + " تومان" : item.price.toLocaleString() + " Tomans"}
                      </p>
                    )}
                    {item.notes && (
                      <p className="text-[10px] text-zinc-400 bg-zinc-950/40 p-2.5 rounded-xl border border-zinc-900/40 leading-relaxed">
                        {item.notes}
                      </p>
                    )}
                  </div>

                  {/* Group progress or countdown timers */}
                  {!isPurchased && (
                    <div className="mt-4 p-3 bg-zinc-950 rounded-2xl border border-zinc-850 space-y-2.5">
                      {!isGroup ? (
                        // Individual countdown info
                        <div className="flex items-center justify-between text-[9px]">
                          <div className="flex items-center gap-1.5 text-zinc-400">
                            <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span>
                              {isFa 
                                ? isExtended 
                                  ? "⏳ تمدید شده: ۴۷ ساعت فرصت تا آزادسازی خودکار" 
                                  : "⏳ مهلت قفل موقت: ۲۳ ساعت باقی‌مانده" 
                                : isExtended 
                                  ? "⏳ Extended: 47 hours remaining" 
                                  : "⏳ Time Left: 23 hours remaining"}
                            </span>
                          </div>
                          <button
                            onClick={() => handleExtendReservation(friendId, listId, item.id)}
                            className="text-[#10b981] hover:underline font-bold text-[8.5px] cursor-pointer flex items-center gap-1"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>{isFa ? "تمدید قفل (۴۸ساعت)" : "Extend"}</span>
                          </button>
                        </div>
                      ) : (
                        // Group progress indicators
                        <div className="space-y-2">
                          {(() => {
                            const collected = item.groupGiftInfo?.collectedAmount || 0;
                            const target = item.groupGiftInfo?.targetAmount || item.price || 0;
                            const pct = Math.min(100, Math.round((collected / target) * 100));
                            return (
                              <div className="space-y-1">
                                <div className="flex justify-between text-[8.5px] font-bold">
                                  <span className="text-zinc-500">{isFa ? "وضعیت صندوق مشارکتی:" : "Progress:"}</span>
                                  <span className="text-amber-400 font-mono">
                                    {isFa ? toPersianDigits(collected.toLocaleString()) : collected.toLocaleString()} / {isFa ? toPersianDigits(target.toLocaleString()) : target.toLocaleString()} تومان ({isFa ? toPersianDigits(pct) : pct}%)
                                  </span>
                                </div>
                                <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                                  <div className="bg-amber-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                                </div>
                              </div>
                            );
                          })()}

                          {/* Coordinator Controls toggle details */}
                          <div className="border-t border-zinc-900/60 pt-2 flex items-center justify-between">
                            <span className="text-[8.5px] text-zinc-400 font-bold">
                              {isCoordinator 
                                ? (isFa ? "👑 هماهنگ‌کننده گروه: شما" : "👑 Coordinator: You") 
                                : `${isFa ? "مدیر گروه:" : "Organizer:"} ${item.groupGiftInfo?.coordinatorName}`}
                            </span>
                            <button
                              onClick={() => setExpandedGroupId(expandedGroupId === item.id ? null : item.id)}
                              className="text-[8px] text-[#10b981] font-bold flex items-center gap-0.5 cursor-pointer"
                            >
                              <span>{expandedGroupId === item.id ? "بستن لیست" : "مشاهده و تایید فیش‌ها"}</span>
                              {expandedGroupId === item.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                          </div>

                          {/* Expansion Panel */}
                          {expandedGroupId === item.id && item.groupGiftInfo && (
                            <div className="mt-2.5 pt-2.5 border-t border-zinc-900/60 space-y-3">
                              {/* Coordinator card copy */}
                              <div className="bg-zinc-900 p-2 rounded-xl text-right text-[8.5px] flex items-center justify-between">
                                <span className="text-zinc-400">{isFa ? "شماره کارت گروه:" : "Group Card:"}</span>
                                <span className="font-mono text-zinc-300 font-bold">{item.groupGiftInfo.coordinatorCard}</span>
                              </div>

                              {/* Contributors list and payment approval for coordinator */}
                              <div className="space-y-1.5 text-right">
                                <p className="text-[8px] text-zinc-500 font-bold">{isFa ? "تراکنش‌های واریزی دوستان:" : "Friend transfers:"}</p>
                                <div className="space-y-1">
                                  {(item.groupGiftInfo.contributors || []).map((c: any, index: number) => (
                                    <div key={index} className="flex items-center justify-between p-2 rounded-xl bg-zinc-900/50 text-[9px]">
                                      <div className="flex flex-col text-right">
                                        <span className="text-zinc-300 font-bold">{c.name}</span>
                                        <span className="text-[7.5px] text-zinc-500 font-mono">کد پیگیری: {c.refNumber}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="font-mono text-zinc-200">{isFa ? toPersianDigits(c.amount.toLocaleString()) : c.amount.toLocaleString()} تومان</span>
                                        {c.isPaid ? (
                                          <span className="text-[8.5px] text-emerald-400 font-bold">✅ تایید شد</span>
                                        ) : isCoordinator ? (
                                          <button
                                            onClick={() => handleApprovePayment(friendId, listId, item.id, c.name)}
                                            className="px-2 py-0.8 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-[8px] rounded transition-colors cursor-pointer"
                                          >
                                            {isFa ? "تایید واریز" : "Approve"}
                                          </button>
                                        ) : (
                                          <span className="text-[8px] text-amber-500 font-bold">⏳ در انتظار تایید</span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Purchased static display code */}
                  {isPurchased && item.purchaseRefNumber && (
                    <div className="mt-3 p-2.5 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl text-[9px] text-[#10b981] font-bold flex items-center justify-between">
                      <span>{isFa ? "کد پیگیری خرید نهایی ثبت شده:" : "Tracking ref:"}</span>
                      <span className="font-mono">{item.purchaseRefNumber}</span>
                    </div>
                  )}

                  {/* Footer redirection/unclaim */}
                  <div className="pt-4 mt-4 border-t border-zinc-950 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2.5">
                      {item.link ? (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] font-bold text-[#10b981] hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>{isFa ? "خرید مستقیم کادو" : "Purchase Link"}</span>
                        </a>
                      ) : (
                        <span className="text-[9px] text-zinc-500">{isFa ? "فاقد لینک مستقیم" : "No Link"}</span>
                      )}
                      <a
                        href={`https://torob.com/search/?query=${encodeURIComponent(item.title)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-bold text-amber-400 hover:underline flex items-center gap-1"
                      >
                        <span>🔍</span>
                        <span>{isFa ? "مقایسه در ترب" : "Torob"}</span>
                      </a>
                    </div>

                    <div className="flex items-center gap-2 justify-end">
                      {!isPurchased && (
                        <>
                          <button
                            onClick={() => handleReleaseReservation(friendId, listId, item.id)}
                            className="py-1.5 px-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/10 rounded-xl text-[10px] font-bold cursor-pointer transition-colors"
                          >
                            {isFa ? "لغو رزرو" : "Unclaim"}
                          </button>

                          {(!isGroup || isCoordinator) && (
                            <button
                              onClick={() => {
                                if (showPurchaseFormId === item.id) {
                                  setShowPurchaseFormId(null);
                                } else {
                                  setShowPurchaseFormId(item.id);
                                  setPurchaseTrackingInput(prev => ({ ...prev, [item.id]: "" }));
                                }
                              }}
                              className="py-1.5 px-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-[10px] rounded-xl transition-all cursor-pointer"
                            >
                              {isFa ? "ثبت خرید نهایی" : "Confirm Bought"}
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* CONFIRM PURCHASE TEXT AREA */}
                  {showPurchaseFormId === item.id && (
                    <div className="mt-3.5 p-3.5 rounded-2xl bg-zinc-950 border border-zinc-850 space-y-3">
                      <div className="flex justify-between items-center">
                        <label className="block text-[9px] font-bold text-zinc-400">
                          {isFa 
                            ? "کد پیگیری کارت‌به‌کارت یا شماره مرسوله پست را وارد کنید:" 
                            : "Enter tracking reference / postal transaction code:"}
                        </label>
                        <button 
                          onClick={() => setShowPurchaseFormId(null)} 
                          className="text-[9px] text-zinc-500"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder={isFa ? "مثال: فیش ۴۱۲۳۵۶ یا کد مرسوله" : "e.g. Receipt 412356 or postal code"}
                          value={purchaseTrackingInput[item.id] || ""}
                          onChange={(e) => setPurchaseTrackingInput(prev => ({ ...prev, [item.id]: e.target.value }))}
                          className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-[10.5px] text-white outline-none focus:border-emerald-500/40"
                        />
                        <button
                          onClick={() => handleConfirmPurchase(friendId, listId, item.id)}
                          className="py-1.5 px-4 bg-[#10b981] hover:bg-emerald-400 text-zinc-950 font-black text-[10px] rounded-xl cursor-pointer"
                        >
                          {isFa ? "تایید" : "Save"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
