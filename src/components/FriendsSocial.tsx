import React, { useState, useEffect } from "react";
import { UserProfile, Wishlist, WishlistItem, Language } from "../types";
import { 
  Users, Search, UserCheck, UserPlus, Sparkles, ChevronRight, Gift, 
  ExternalLink, Calendar, Heart, Globe, X, ArrowLeft, RefreshCw 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toPersianDigits, formatTomanToWords } from "../utils";
import { PriceSearchModal } from "./PriceSearchModal";
import { ExpertBadge } from "./ExpertBadge";

interface DemoFriend {
  id: string;
  name: string;
  username: string;
  avatar: string;
  wishlists: Wishlist[];
  isAdvisor?: boolean;
  advisorCategory?: string;
  advisorBadge?: string;
}

interface FriendsSocialProps {
  user: UserProfile;
  followingIds: string[];
  onToggleFollow: (id: string) => void;
  language: Language;
  onClaimItem: (friendId: string, listId: string, itemId: string) => void;
  onUnclaimItem: (friendId: string, listId: string, itemId: string) => void;
}

const DEMO_SUGGESTED_PEOPLE: DemoFriend[] = [
  {
    id: "f_maryam",
    name: "مریم رضایی",
    username: "maryam_rezai",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120",
    isAdvisor: false,
    wishlists: [
      {
        id: "wl_maryam_birthday",
        title: "تولد ۲۷ سالگی مریم 🎂",
        occasionDate: "2026-08-15",
        occasionType: "birthday",
        items: [
          {
            id: "it_maryam_1",
            title: "شمع معطر اسطوخودوس برند هوم",
            price: 250000,
            link: "https://www.digikala.com/search/?q=شمع+اسطوخودوس",
            notes: "رنگ بنفش ملایم با رایحه ملایم فرانسوی باشه لطفا.",
            priority: "medium",
            isReserved: false
          },
          {
            id: "it_maryam_2",
            title: "ماگ سرامیکی دست‌ساز طرح کهکشان",
            price: 320000,
            link: "https://www.digikala.com/search/?q=ماگ+سرامیکی+دست‌ساز",
            notes: "ترجیحاً از کارهای گالری دستین آرت باشه.",
            priority: "high",
            isReserved: true,
            reservedBy: "امیر حسینی"
          },
          {
            id: "it_maryam_3",
            title: "کتاب اثر مرکب نوشته دارن هاردی",
            price: 120000,
            link: "https://www.digikala.com/search/?q=کتاب+اثر+مرکب",
            notes: "ترجمه لطیف احمدپور نشر شریف عالیه.",
            priority: "low",
            isReserved: false
          }
        ]
      }
    ]
  },
  {
    id: "f_amir",
    name: "امیر حسینی",
    username: "amir_h",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120",
    isAdvisor: false,
    wishlists: [
      {
        id: "wl_amir_tech",
        title: "پروژه هوم آفیس امیر 💻",
        occasionDate: "2026-09-01",
        occasionType: "other",
        items: [
          {
            id: "it_amir_1",
            title: "ماوس ارگونومیک بی‌سیم رپو Rapoo EV200",
            price: 980000,
            link: "https://technolife.ir/product/list?search=EV200",
            notes: "برای برطرف شدن مچ درد طولانی کار نیاز دارم.",
            priority: "high",
            isReserved: false
          },
          {
            id: "it_amir_2",
            title: "پایه نگهدارنده مانیتور دو بازو هیدرولیکی",
            price: 1850000,
            link: "https://www.digikala.com/search/?q=پایه+نگهدارنده+مانیتور",
            notes: "برند باراد باشه مقاومت بالایی داره.",
            priority: "medium",
            isReserved: false
          }
        ]
      }
    ]
  },
  {
    id: "f_mina",
    name: "مینا کریمی",
    username: "mina_k",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=120",
    isAdvisor: false,
    wishlists: [
      {
        id: "wl_mina_house",
        title: "جهیزیه و جابجایی خانه مینا 🏡",
        occasionDate: "2026-10-10",
        occasionType: "wedding",
        items: [
          {
            id: "it_mina_1",
            title: "ست قوری و فنجان پیرکس پیرکس چای‌ساز",
            price: 450000,
            link: "https://www.digikala.com/search/?q=ست+قوری+پیرکس",
            notes: "فیلتر تفاله فنری داشته باشه.",
            priority: "medium",
            isReserved: false
          },
          {
            id: "it_mina_2",
            title: "رو تختی دو نفره بهاره طرح کتان",
            price: 2400000,
            notes: "رنگ‌های نود یا طوسی خیلی روشن.",
            priority: "high",
            isReserved: false
          }
        ]
      }
    ]
  }
];

export default function FriendsSocial({
  user,
  followingIds,
  onToggleFollow,
  language,
  onClaimItem,
  onUnclaimItem
}: FriendsSocialProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);

  const [socialSubTab, setSocialSubTab] = useState<"following" | "sent_invites" | "received_invites">("following");

  // Invite friends input states
  const [inviteName, setInviteName] = useState("");
  const [invitePhone, setInvitePhone] = useState("");
  const [inviteSuccessMsg, setInviteSuccessMsg] = useState("");

  const [sentInvites, setSentInvites] = useState(() => {
    const saved = localStorage.getItem("giftino_sent_invites");
    if (saved) return JSON.parse(saved);
    if (user.isDemo) {
      return [
        { id: "invite_1", name: "علی مهدوی", phone: "09121111111", status: "pending", invitedAt: "۱۴۰۵/۰۴/۱۵" },
        { id: "invite_2", name: "شایان رضایی", phone: "09122222222", status: "pending", invitedAt: "۱۴۰۵/۰۴/۱۶" }
      ];
    }
    return [];
  });

  const [receivedInvites, setReceivedInvites] = useState(() => {
    const saved = localStorage.getItem("giftino_received_invites");
    if (saved) return JSON.parse(saved);
    if (user.isDemo) {
      return [
        { id: "rec_1", name: "مرضیه قاسمی (خواهر)", phone: "09123333333", avatar: "🌸", hasRegistered: true, isFollowed: false, suggestedId: "f_maryam" },
        { id: "rec_2", name: "پوریا زارع (دوست)", phone: "09124444444", avatar: "⚽", hasRegistered: true, isFollowed: false, suggestedId: "f_amir" }
      ];
    }
    return [];
  });

  // Initialize friends state with persistence so claims are saved and updated correctly!
  const [friends, setFriends] = React.useState<DemoFriend[]>(() => {
    const saved = localStorage.getItem("giftino_friends_data");
    if (saved) return JSON.parse(saved);
    return DEMO_SUGGESTED_PEOPLE;
  });

  // Fetch registered users from PostgreSQL via API to synchronize friends list
  useEffect(() => {
    const fetchDbUsers = async () => {
      try {
        const { auth } = await import("../lib/firebase.ts");
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };

        const currentUser = auth.currentUser;
        if (currentUser) {
          const token = await currentUser.getIdToken();
          headers["Authorization"] = `Bearer ${token}`;
        } else if (user && user.uid) {
          headers["x-demo-user-uid"] = user.uid;
          headers["x-demo-user-name"] = encodeURIComponent(user.name);
          if (user.email) headers["x-demo-user-email"] = encodeURIComponent(user.email);
        }

        const response = await fetch("/api/users", { headers });
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.users) {
            setFriends((prevFriends) => {
              const merged = [...prevFriends];
              for (const dbUser of data.users) {
                const idx = merged.findIndex((f) => f.id === dbUser.id || f.id === dbUser.uid);
                if (idx > -1) {
                  // Keep the existing lists but merge attributes
                  merged[idx] = { ...merged[idx], ...dbUser };
                } else {
                  merged.push(dbUser);
                }
              }
              return merged;
            });
          }
        }
      } catch (err) {
        console.error("Failed to fetch live users directory:", err);
      }
    };

    fetchDbUsers();
  }, [user]);

  // Price search engine modal state
  const [priceSearchOpen, setPriceSearchOpen] = useState(false);
  const [priceSearchQuery, setPriceSearchQuery] = useState("");
  const [priceSearchTargetPrice, setPriceSearchTargetPrice] = useState<number | undefined>(undefined);

  // Group gifting and cooperative purchase states
  const [expandedGroupGiftId, setExpandedGroupGiftId] = useState<string | null>(null);
  const [isStartingGroupGift, setIsStartingGroupGift] = useState<string | null>(null);
  const [coordCard, setCoordCard] = useState("");
  const [coordBank, setCoordBank] = useState("بانک ملی");
  const [coordAccount, setCoordAccount] = useState("");
  const [coordInitialAmount, setCoordInitialAmount] = useState("");

  const [joinAmount, setJoinAmount] = useState("");
  const [joinRefNumber, setJoinRefNumber] = useState("");
  const [joinSuccessMsg, setJoinSuccessMsg] = useState<string | null>(null);
  const [groupGiftError, setGroupGiftError] = useState<string | null>(null);
  const [joinErrorMsg, setJoinErrorMsg] = useState<string | null>(null);

  const isFa = language === "fa";

  const renderAvatar = (avatar: string | undefined, name: string, sizeClass = "w-10 h-10") => {
    const isUrl = avatar?.startsWith("http") || avatar?.startsWith("/") || avatar?.startsWith("data:");
    if (isUrl) {
      return (
        <div className={`${sizeClass} rounded-full overflow-hidden border border-zinc-800 shrink-0`}>
          <img
            src={avatar}
            alt={name}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
      );
    }
    return (
      <div className={`${sizeClass} rounded-full bg-zinc-800 border border-zinc-750 flex items-center justify-center text-lg shrink-0 select-none`}>
        <span>{avatar || "👤"}</span>
      </div>
    );
  };

  const triggerSmsInvite = (name: string, phone: string) => {
    const appUrl = window.location.origin;
    const senderName = user?.name || "";
    const smsText = isFa
      ? `سلام ${name} عزیز! 🎁\nمن عضو گیفتی‌نو (دفترچه دیجیتال آرزوها و مناسبت‌های کادو) شدم تا بتونیم لیست آرزوهای همدیگه رو ببینیم و کادوهای دلخواهمون رو رزرو کنیم.\nخوشحال میشم با کلیک روی لینک زیر به من ملحق بشی:\n${appUrl}\n\nدوستدار تو، ${senderName}`
      : `Hi ${name}! 🎁\nI've joined Giftino, the digital wishlist and gift occasion planner. Let's share our wishlists and plan surprises together!\nJoin me here:\n${appUrl}\n\nBest, ${senderName}`;

    const separator = /iPad|iPhone|iPod/.test(navigator.userAgent) ? '&' : '?';
    const smsUrl = `sms:${phone}${separator}body=${encodeURIComponent(smsText)}`;
    
    try {
      window.location.href = smsUrl;
    } catch (err) {
      console.error("Failed to trigger SMS client:", err);
    }
  };

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !invitePhone.trim()) return;

    const newInvite = {
      id: "invite_" + Date.now(),
      name: inviteName.trim(),
      phone: invitePhone.trim(),
      status: "pending",
      invitedAt: new Date().toLocaleDateString("fa-IR")
    };

    const updated = [newInvite, ...sentInvites];
    setSentInvites(updated);
    localStorage.setItem("giftino_sent_invites", JSON.stringify(updated));

    const nameToInvite = inviteName.trim();
    const phoneToInvite = invitePhone.trim();

    setInviteName("");
    setInvitePhone("");
    setInviteSuccessMsg(isFa ? "🎁 پیامک دعوت آماده شد! در حال باز کردن برنامه پیامک گوشی شما..." : "🎁 Invitation ready! Opening your SMS application...");
    
    // Trigger native SMS composer on mobile devices
    setTimeout(() => {
      triggerSmsInvite(nameToInvite, phoneToInvite);
      setInviteSuccessMsg("");
    }, 1500);
  };

  const handleClaim = (friendId: string, listId: string, itemId: string, isGroup = false, groupInfo?: any) => {
    const todayStr = "2026-07-08";
    const updated = friends.map((f) => {
      if (f.id === friendId) {
        const updatedLists = f.wishlists.map((l) => {
          if (l.id === listId) {
            const updatedItems = l.items.map((item) => {
              if (item.id === itemId) {
                return { 
                  ...item, 
                  isReserved: true, 
                  reservedBy: isGroup ? "خرید گروهی (مشارکتی)" : user.name,
                  reservationDate: todayStr,
                  isPurchased: false,
                  isGroupGift: isGroup,
                  groupGiftInfo: groupInfo || undefined
                };
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
    setFriends(updated);
    localStorage.setItem("giftino_friends_data", JSON.stringify(updated));
    onClaimItem(friendId, listId, itemId);
  };

  const handleStartGroupGift = (friendId: string, listId: string, itemId: string, price: number) => {
    if (!coordCard.trim() || !coordAccount.trim() || !coordInitialAmount.trim()) {
      setGroupGiftError(isFa ? "⚠️ لطفا تمامی فیلدها (شماره کارت، نام صاحب حساب و مبلغ سهم اولیه) را تکمیل کنید." : "⚠️ Please fill in all bank details and initial contribution.");
      return;
    }

    setGroupGiftError(null);
    const initAmount = parseInt(coordInitialAmount.replace(/,/g, "")) || 0;
    const groupInfo = {
      coordinatorName: user.name,
      coordinatorCard: coordCard.trim(),
      coordinatorBank: coordBank,
      coordinatorAccount: coordAccount.trim(),
      targetAmount: price,
      collectedAmount: initAmount,
      contributors: [
        { name: user.name, amount: initAmount, isPaid: true, refNumber: "مدیر گروه (واریز اولیه)" }
      ]
    };

    handleClaim(friendId, listId, itemId, true, groupInfo);
    setIsStartingGroupGift(null);
    setCoordCard("");
    setCoordAccount("");
    setCoordInitialAmount("");
  };

  const handleJoinGroup = (friendId: string, listId: string, itemId: string) => {
    if (!joinAmount.trim() || !joinRefNumber.trim()) {
      setJoinErrorMsg(isFa ? "⚠️ لطفا مبلغ سهم خود و شماره پیگیری را وارد کنید." : "⚠️ Please enter the amount and transaction ID.");
      return;
    }

    setJoinErrorMsg(null);

    const amountNum = parseInt(joinAmount.replace(/,/g, "")) || 0;
    const updated = friends.map((f) => {
      if (f.id === friendId) {
        const updatedLists = f.wishlists.map((l) => {
          if (l.id === listId) {
            const updatedItems = l.items.map((item) => {
              if (item.id === itemId && item.isGroupGift && item.groupGiftInfo) {
                const contributors = item.groupGiftInfo.contributors || [];
                const updatedContributors = [
                  ...contributors,
                  { name: user.name, amount: amountNum, isPaid: false, refNumber: joinRefNumber.trim() }
                ];
                return {
                  ...item,
                  groupGiftInfo: {
                    ...item.groupGiftInfo,
                    contributors: updatedContributors
                  }
                };
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

    setFriends(updated);
    localStorage.setItem("giftino_friends_data", JSON.stringify(updated));

    // Also update claimedItems in localStorage and state so it shows up in their dashboard
    const friend = updated.find(f => f.id === friendId);
    const list = friend?.wishlists.find(l => l.id === listId);
    const item = list?.items.find(i => i.id === itemId);
    if (item) {
      const savedClaims = localStorage.getItem("giftino_claimed_items") || "[]";
      let claims = JSON.parse(savedClaims);
      claims = claims.filter((c: any) => !(c.friendId === friendId && c.item.id === itemId));
      claims.push({
        friendId,
        friendName: friend?.name || "",
        friendAvatar: friend?.avatar || "",
        listId,
        listTitle: list?.title || "",
        item
      });
      localStorage.setItem("giftino_claimed_items", JSON.stringify(claims));
    }

    onClaimItem(friendId, listId, itemId);
    setJoinAmount("");
    setJoinRefNumber("");
    setJoinSuccessMsg(isFa ? "✍️ تراکنش کارت‌به‌کارت شما ثبت شد! پس از تایید مدیر، سهم شما اعمال می‌شود." : "✍️ Payment registered! Contribution is pending coordinator's approval.");
    setTimeout(() => setJoinSuccessMsg(null), 5000);
  };

  const handleUnclaim = (friendId: string, listId: string, itemId: string) => {
    const updated = friends.map((f) => {
      if (f.id === friendId) {
        const updatedLists = f.wishlists.map((l) => {
          if (l.id === listId) {
            const updatedItems = l.items.map((item) => {
              if (item.id === itemId) {
                return { 
                  ...item, 
                  isReserved: false, 
                  reservedBy: undefined, 
                  reservationDate: undefined,
                  isPurchased: false,
                  isGroupGift: false,
                  groupGiftInfo: undefined 
                };
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
    setFriends(updated);
    localStorage.setItem("giftino_friends_data", JSON.stringify(updated));
    onUnclaimItem(friendId, listId, itemId);
  };

  const followedFriends = friends.filter((f) => followingIds.includes(f.id));
  const suggestedFriends = friends.filter((f) => {
    const matchesSearch = f.name.includes(searchQuery) || f.username.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const activeFriend = friends.find((f) => f.id === selectedFriendId);
  const activeList = activeFriend?.wishlists.find((l) => l.id === selectedListId);

  return (
    <div className="space-y-6 select-none" style={{ direction: isFa ? "rtl" : "ltr" }}>
      
      <AnimatePresence mode="wait">
        {activeList && activeFriend ? (
          /* Friend's Wishlist Details Overlay */
          <motion.div
            key="friend-list-details"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Back to Friend Profile */}
            <button
              onClick={() => setSelectedListId(null)}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 hover:border-emerald-500/40 text-zinc-300 hover:text-emerald-400 rounded-xl text-xs font-black cursor-pointer transition-all shadow-sm"
            >
              <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
              <span>{isFa ? `بازگشت به لیست‌های ${activeFriend.name}` : `Back to ${activeFriend.name}'s Lists`}</span>
            </button>

            {/* Header info */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-3">
              <span className="text-[9px] bg-amber-500/10 text-amber-400 font-bold px-2.5 py-0.5 rounded-full border border-amber-500/20 font-mono">
                {activeList.occasionType.toUpperCase()}
              </span>
              <h2 className="text-lg font-black text-white">{activeList.title}</h2>
              <p className="text-[11px] text-zinc-500 flex items-center gap-1 font-mono">
                <Calendar className="w-3.5 h-3.5" />
                <span>{activeList.occasionDate}</span>
              </p>
              <div className="text-[10px] text-zinc-400 pt-1 leading-normal">
                {isFa 
                  ? "💡 در لیست زیر هر کادویی که قصد خریدش را دارید رزرو کنید. به دوستتان اطلاع داده نخواهد شد تا اثر سورپرایز حفظ شود!" 
                  : "💡 Claim any gift you intend to buy below. It stays secret from your friend to keep it a surprise!"}
              </div>
            </div>

            {/* List Items */}
            <div className="space-y-4">
              <h3 className="text-xs font-black text-zinc-400 uppercase tracking-wider">{isFa ? "هدایای مورد نیاز" : "Requested Gifts"}</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {activeList.items.map((item) => {
                  const isClaimedByMe = item.isReserved && item.reservedBy === user.name;
                  
                  return (
                    <div
                      key={item.id}
                      className={`p-5 rounded-3xl border transition-all flex flex-col justify-between relative ${
                        item.isReserved 
                          ? isClaimedByMe 
                            ? "bg-emerald-500/5 border-[#10b981]" 
                            : "bg-zinc-950 border-zinc-900 opacity-60" 
                          : "bg-zinc-900 border-zinc-800 hover:border-zinc-700"
                      }`}
                    >
                      <div className="space-y-2.5">
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="text-xs font-extrabold text-white leading-snug">{item.title}</h4>
                          <span className={`text-[8.5px] font-bold px-2 py-0.5 rounded uppercase ${
                            item.priority === "high" 
                              ? "bg-rose-500/15 text-rose-400 border border-rose-500/20" 
                              : item.priority === "medium" 
                                ? "bg-amber-500/15 text-amber-400 border border-amber-500/20" 
                                : "bg-blue-500/15 text-blue-400 border border-blue-500/20"
                          }`}>
                            {isFa ? (item.priority === "high" ? "ضروری" : item.priority === "medium" ? "متوسط" : "کم") : item.priority}
                          </span>
                        </div>

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

                      {/* Buy Redirect & Reservation Toggle */}
                      <div className="pt-4 mt-4 border-t border-zinc-950 flex items-center justify-between gap-3">
                        <div className="flex flex-col gap-1">
                          {item.link ? (
                            <a
                              href={item.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] font-bold text-[#10b981] hover:underline flex items-center gap-1"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>{isFa ? "مشاهده لینک خرید" : "Buy Link"}</span>
                            </a>
                          ) : (
                            <span className="text-[9px] text-zinc-500">{isFa ? "فاقد لینک مستقیم" : "No Link"}</span>
                          )}
                          <button
                            onClick={() => {
                              setPriceSearchQuery(item.title);
                              setPriceSearchTargetPrice(item.price);
                              setPriceSearchOpen(true);
                            }}
                            className="text-[10px] font-bold text-amber-400 hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-none p-0 outline-none text-left"
                          >
                            <span>🔍</span>
                            <span>{isFa ? "جستجو و مقایسه قیمت" : "Search & Compare Prices"}</span>
                          </button>
                        </div>

                        <div className="flex flex-col gap-2">
                          {item.isReserved ? (
                            item.isGroupGift ? (
                              <div className="flex flex-col items-end gap-1.5">
                                <span className="text-[9px] font-extrabold text-[#10b981] bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                                  <span>👥</span>
                                  <span>{isFa ? "خرید مشارکتی فعال" : "Group Buy Active"}</span>
                                </span>
                                <button
                                  onClick={() => setExpandedGroupGiftId(expandedGroupGiftId === item.id ? null : item.id)}
                                  className="text-[9.5px] font-bold text-zinc-400 hover:text-white underline cursor-pointer"
                                >
                                  {expandedGroupGiftId === item.id 
                                    ? (isFa ? "بستن جزئیات 🔼" : "Hide Details 🔼") 
                                    : (isFa ? "مشاهده و مشارکت 🔽" : "Join & View 🔽")}
                                </button>
                              </div>
                            ) : isClaimedByMe ? (
                              <button
                                onClick={() => handleUnclaim(activeFriend.id, activeList.id, item.id)}
                                className="px-3 py-1 bg-rose-500/15 text-rose-400 border border-rose-500/20 rounded-xl text-[10px] font-bold cursor-pointer"
                              >
                                {isFa ? "لغو رزرو من" : "Cancel Claim"}
                              </button>
                            ) : (
                              <span className="text-[10px] text-zinc-500 font-bold">🔒 {isFa ? "رزرو شده" : "Reserved"}</span>
                            )
                          ) : (
                            <div className="flex items-center gap-1.5">
                              {item.price ? (
                                <>
                                  <button
                                    onClick={() => handleClaim(activeFriend.id, activeList.id, item.id)}
                                    className="px-2.5 py-1.5 bg-[#10b981] hover:bg-emerald-400 text-zinc-950 font-black text-[9.5px] rounded-xl transition-all cursor-pointer"
                                    title={isFa ? "خرید کامل به صورت انفرادی" : "Claim full gift yourself"}
                                  >
                                    🎁 {isFa ? "رزرو انفرادی" : "Solo Claim"}
                                  </button>
                                  <button
                                    onClick={() => {
                                      setIsStartingGroupGift(isStartingGroupGift === item.id ? null : item.id);
                                      setCoordCard("");
                                      setCoordAccount("");
                                      setCoordInitialAmount("");
                                    }}
                                    className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white font-bold text-[9.5px] rounded-xl border border-zinc-700/60 transition-all cursor-pointer"
                                  >
                                    👥 {isFa ? "خرید گروهی" : "Group Buy"}
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => handleClaim(activeFriend.id, activeList.id, item.id)}
                                  className="px-3.5 py-1.5 bg-[#10b981] hover:bg-emerald-400 text-zinc-950 font-black text-[10px] rounded-xl transition-all cursor-pointer"
                                >
                                  🎁 {isFa ? "رزرو هدیه" : "Claim Gift"}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* START GROUP GIFT COMPACT FORM */}
                      {isStartingGroupGift === item.id && (
                        <div className="mt-4 p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 space-y-3">
                          <div className="flex items-center justify-between">
                            <h5 className="text-[10.5px] font-black text-amber-400 flex items-center gap-1">
                              <span>👥</span>
                              <span>{isFa ? "راه‌اندازی گروه خرید مشارکتی" : "Start Collaborative Gift Group"}</span>
                            </h5>
                            <button 
                              onClick={() => setIsStartingGroupGift(null)} 
                              className="text-[10px] text-zinc-500 hover:text-white font-bold"
                            >
                              ✕
                            </button>
                          </div>
                          
                          <p className="text-[9.5px] text-zinc-400 leading-normal">
                            {isFa 
                              ? "شما هماهنگ‌کننده مالی می‌شوید. شماره کارت خود را ثبت کنید تا بقیه اعضا سهم خود را برایتان کارت‌به‌کارت کنند." 
                              : "You will be the financial organizer. Register your card for other friends to transfer their share to you."}
                          </p>

                          <div className="space-y-2 text-right">
                            <div>
                              <label className="block text-[8px] font-bold text-zinc-400 mb-1">{isFa ? "شماره کارت بانکی (۱۶ رقم)" : "16-Digit Card Number"}</label>
                              <input 
                                type="text"
                                maxLength={19}
                                placeholder="---- ---- ---- ----"
                                value={coordCard}
                                onChange={(e) => {
                                  // Auto-format card number with hyphens
                                  let v = e.target.value.replace(/\D/g, "");
                                  let formatted = v.match(/.{1,4}/g)?.join("-") || v;
                                  setCoordCard(formatted);
                                }}
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-[10.5px] text-white font-mono placeholder-zinc-600 outline-none focus:border-amber-500/40"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[8px] font-bold text-zinc-400 mb-1">{isFa ? "نام بانک" : "Bank Name"}</label>
                                <select 
                                  value={coordBank}
                                  onChange={(e) => setCoordBank(e.target.value)}
                                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-2 py-1.5 text-[10.5px] text-white outline-none focus:border-amber-500/40"
                                >
                                  <option value="بانک ملی">بانک ملی</option>
                                  <option value="بانک ملت">بانک ملت</option>
                                  <option value="بانک صادرات">بانک صادرات</option>
                                  <option value="بانک تجارت">بانک تجارت</option>
                                  <option value="بانک سامان">بانک سامان</option>
                                  <option value="بانک پارسیان">بانک پارسیان</option>
                                  <option value="بانک پاسارگاد">بانک پاسارگاد</option>
                                  <option value="بانک سپه">بانک سپه</option>
                                  <option value="بلو بانک">بلو بانک (سامان)</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-[8px] font-bold text-zinc-400 mb-1">{isFa ? "نام صاحب حساب" : "Account Holder"}</label>
                                <input 
                                  type="text"
                                  placeholder={isFa ? "مثال: علی صبوری" : "e.g. Ali Sabouri"}
                                  value={coordAccount}
                                  onChange={(e) => setCoordAccount(e.target.value)}
                                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-[10.5px] text-white outline-none focus:border-amber-500/40"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-[8px] font-bold text-zinc-400 mb-1">
                                {isFa ? "مبلغ سهم واریزی اولیه شما (تومان)" : "Your Initial Share Contribution (Tomans)"}
                              </label>
                              <input 
                                type="text"
                                placeholder={isFa ? "مثال: ۵۰,۰۰۰" : "e.g. 50,000"}
                                value={coordInitialAmount}
                                onChange={(e) => {
                                  let val = e.target.value.replace(/\D/g, "");
                                  if (val) {
                                    setCoordInitialAmount(parseInt(val).toLocaleString());
                                  } else {
                                    setCoordInitialAmount("");
                                  }
                                }}
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-[10.5px] text-white font-mono outline-none focus:border-amber-500/40"
                              />
                              {coordInitialAmount && (
                                <p className="text-[8.5px] text-[#10b981] mt-1 font-bold">
                                  {isFa ? formatTomanToWords(parseInt(coordInitialAmount.replace(/,/g, ""))) + " تومان" : ""}
                                </p>
                              )}
                            </div>

                            {groupGiftError && (
                              <div className="p-2.5 text-[9.5px] font-extrabold text-rose-400 bg-rose-500/10 rounded-xl border border-rose-500/10 text-center leading-normal">
                                {groupGiftError}
                              </div>
                            )}

                            <button
                              onClick={() => handleStartGroupGift(activeFriend.id, activeList.id, item.id, item.price || 0)}
                              className="w-full mt-2 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black text-[10.5px] rounded-xl transition-all cursor-pointer shadow-md"
                            >
                              🚀 {isFa ? "راه‌اندازی گروه و واریز اولین سهم" : "Launch Group & Save Coordinator Card"}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* DISPLAY ACTIVE GROUP GIFT DETAILS */}
                      {item.isGroupGift && expandedGroupGiftId === item.id && item.groupGiftInfo && (
                        <div className="mt-4 p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 space-y-3.5">
                          {/* Progress bar */}
                          {(() => {
                            const collected = item.groupGiftInfo.collectedAmount || 0;
                            const target = item.groupGiftInfo.targetAmount || item.price || 0;
                            const pct = Math.min(100, Math.round((collected / target) * 100));
                            return (
                              <div className="space-y-1">
                                <div className="flex justify-between text-[9px] font-bold">
                                  <span className="text-zinc-400">{isFa ? "پیشرفت جمع‌آوری:" : "Collection Progress:"}</span>
                                  <span className="text-amber-400 font-mono">
                                    {isFa ? toPersianDigits(collected.toLocaleString()) : collected.toLocaleString()} / {isFa ? toPersianDigits(target.toLocaleString()) : target.toLocaleString()} تومان ({isFa ? toPersianDigits(pct) : pct}%)
                                  </span>
                                </div>
                                <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden border border-zinc-800">
                                  <div 
                                    className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full rounded-full transition-all duration-500" 
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })()}

                          {/* Bank details */}
                          <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800/60 text-right space-y-1 relative">
                            <span className="text-[8px] bg-amber-500/10 text-amber-400 font-bold px-1.5 py-0.2 rounded border border-amber-500/10 absolute left-2.5 top-2.5">
                              {isFa ? "شماره کارت مشترک" : "Card Info"}
                            </span>
                            <p className="text-[8px] text-zinc-500 font-bold">{isFa ? "هماهنگ‌کننده گروه کادو:" : "Gift Organizer:"}</p>
                            <p className="text-[10px] text-zinc-300 font-bold">{item.groupGiftInfo.coordinatorName}</p>
                            <p className="text-[11.5px] text-white font-mono font-black mt-1 select-all tracking-wider">
                              {item.groupGiftInfo.coordinatorCard}
                            </p>
                            <p className="text-[9.5px] text-zinc-400">
                              {item.groupGiftInfo.coordinatorBank} - {isFa ? "به نام" : "Owner:"} {item.groupGiftInfo.coordinatorAccount}
                            </p>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(item.groupGiftInfo!.coordinatorCard);
                                alert(isFa ? "📋 شماره کارت هماهنگ‌کننده کپی شد!" : "📋 Card number copied!");
                              }}
                              className="mt-1 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg text-[9px] font-bold cursor-pointer transition-colors"
                            >
                              {isFa ? "📋 کپی شماره کارت" : "📋 Copy Card Number"}
                            </button>
                          </div>

                          {/* Contributors List */}
                          <div className="space-y-1.5">
                            <h6 className="text-[9px] font-black text-zinc-400">{isFa ? "مشارکت‌کنندگان شبکه دوستان:" : "Contributors:"}</h6>
                            <div className="max-h-24 overflow-y-auto space-y-1 text-right">
                              {(item.groupGiftInfo.contributors || []).map((c: any, index: number) => (
                                <div key={index} className="flex items-center justify-between p-1.5 rounded-lg bg-zinc-900/40 text-[9px]">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-zinc-300 font-black">{c.name}</span>
                                    {c.name === user.name && (
                                      <span className="text-[7.5px] bg-[#10b981]/15 text-[#10b981] px-1 rounded">{isFa ? "من" : "Me"}</span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-zinc-300 font-bold">{isFa ? toPersianDigits(c.amount.toLocaleString()) : c.amount.toLocaleString()} تومان</span>
                                    {c.isPaid ? (
                                      <span className="text-[8px] text-emerald-400 font-bold flex items-center gap-0.5">
                                        <span>✅</span>
                                        <span>{isFa ? "واریز شد" : "Paid"}</span>
                                      </span>
                                    ) : (
                                      <span className="text-[8px] text-amber-500 font-bold flex items-center gap-0.5">
                                        <span>⏳</span>
                                        <span>{isFa ? "در انتظار تایید" : "Pending"}</span>
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* JOIN COMPACT FORM */}
                          {(() => {
                            const isAlreadyContributor = (item.groupGiftInfo.contributors || []).some((c: any) => c.name === user.name && !c.isPaid);
                            if (item.groupGiftInfo.coordinatorName === user.name) {
                              return (
                                <p className="text-[8.5px] text-amber-400 bg-amber-400/5 p-2 rounded-xl text-center leading-normal">
                                  {isFa 
                                    ? "👑 شما مدیر این گروه هستید. تایید کارت‌به‌کارت دوستان را از بخش «رزرو شده‌ها» در منوی اصلی انجام دهید." 
                                    : "👑 You are the coordinator of this group. Approve pending card-to-card payments from the 'Claimed' tab."}
                                </p>
                              );
                            }
                            if (isAlreadyContributor) {
                              return (
                                <p className="text-[8.5px] text-amber-500 bg-amber-500/5 p-2 rounded-xl text-center leading-normal">
                                  {isFa 
                                    ? "⏳ تراکنش شما ثبت شده است. منتظر تایید شماره کارت توسط هماهنگ‌کننده باشید." 
                                    : "⏳ Your transfer was submitted. Awaiting approval from the group coordinator."}
                                </p>
                              );
                            }
                            return (
                              <div className="space-y-2 text-right border-t border-zinc-900/60 pt-2.5">
                                <h6 className="text-[9.5px] font-black text-amber-400">{isFa ? "سهم خود را کارت‌به‌کارت کنید:" : "Transfer your share:"}</h6>
                                <p className="text-[8.5px] text-zinc-500">
                                  {isFa 
                                    ? "مبلغ مشارکت را به شماره کارت بالا واریز کنید و کد پیگیری بانک را در فرم زیر وارد نمایید." 
                                    : "Transfer your share to the card above and enter your transaction ref number below."}
                                </p>
                                
                                {joinSuccessMsg && (
                                  <div className="p-2 text-[9px] font-black text-emerald-400 bg-emerald-500/10 rounded-xl">
                                    {joinSuccessMsg}
                                  </div>
                                )}

                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-[8px] text-zinc-400 mb-1">{isFa ? "مبلغ مشارکت (تومان)" : "Amount (Toman)"}</label>
                                    <input 
                                      type="text"
                                      placeholder="۵۰,۰۰۰"
                                      value={joinAmount}
                                      onChange={(e) => {
                                        let val = e.target.value.replace(/\D/g, "");
                                        setJoinAmount(val ? parseInt(val).toLocaleString() : "");
                                      }}
                                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-[10px] text-white font-mono outline-none"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[8px] text-zinc-400 mb-1">{isFa ? "شماره پیگیری بانک (۶ رقم)" : "Bank Ref Number"}</label>
                                    <input 
                                      type="text"
                                      placeholder="123456"
                                      value={joinRefNumber}
                                      onChange={(e) => setJoinRefNumber(e.target.value.replace(/\D/g, ""))}
                                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-[10px] text-white font-mono outline-none"
                                    />
                                  </div>
                                </div>

                                {joinErrorMsg && (
                                  <div className="p-2 text-[9px] font-black text-rose-400 bg-rose-500/10 rounded-xl border border-rose-500/10 text-center">
                                    {joinErrorMsg}
                                  </div>
                                )}

                                <button
                                  onClick={() => handleJoinGroup(activeFriend.id, activeList.id, item.id)}
                                  className="w-full mt-1.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-amber-400 hover:text-amber-300 font-extrabold text-[10px] rounded-xl border border-amber-500/20 transition-all cursor-pointer"
                                >
                                  ✍️ {isFa ? "ثبت فیش واریز سهم من" : "Register Share Receipt"}
                                </button>
                              </div>
                            );
                          })()}
                        </div>
                      )}

                      {/* Partner store quick searches */}
                      <div className="mt-3 pt-2.5 border-t border-zinc-950 flex flex-wrap items-center gap-1.5">
                        <span className="text-[8px] text-zinc-500">{isFa ? "🛒 خرید سریع با تخفیف:" : "🛒 Quick shop partner:"}</span>
                        <a
                          href={`https://www.digikala.com/search/?q=${encodeURIComponent(item.title)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[8px] font-bold text-red-400 hover:underline transition-colors"
                        >
                          {isFa ? "دیجی‌کالا" : "Digikala"}
                        </a>
                        <span className="text-[8px] text-zinc-700">•</span>
                        <a
                          href={`https://basalam.com/search?q=${encodeURIComponent(item.title)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[8px] font-bold text-amber-500 hover:underline transition-colors"
                        >
                          {isFa ? "باسلام" : "Basalam"}
                        </a>
                        <span className="text-[8px] text-zinc-700">•</span>
                        <a
                          href={`https://technolife.ir/product/list?search=${encodeURIComponent(item.title)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[8px] font-bold text-blue-400 hover:underline transition-colors"
                        >
                          {isFa ? "تکنولایف" : "Technolife"}
                        </a>
                        <span className="text-[8px] text-zinc-700">•</span>
                        <a
                          href={`https://snappshop.ir/search?q=${encodeURIComponent(item.title)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[8px] font-bold text-emerald-400 hover:underline transition-colors"
                        >
                          {isFa ? "اسنپ‌شاپ" : "SnappShop"}
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        ) : activeFriend ? (
          /* Friend's Profile Overviews */
          <motion.div
            key="friend-profile"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Back button */}
            <button
              onClick={() => setSelectedFriendId(null)}
              className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-[#10b981] font-bold cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
              <span>{isFa ? "بازگشت به جستجوی دوستان" : "Back to Search"}</span>
            </button>

            {/* Profile bio banner */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex flex-col sm:flex-row items-center gap-5">
              {renderAvatar(activeFriend.avatar, activeFriend.name, "w-14 h-14")}

              <div className="text-center sm:text-left min-w-0 flex-1 space-y-1">
                <h2 className="text-base font-black text-white flex items-center gap-1.5 justify-center sm:justify-start flex-wrap">
                  <span>{activeFriend.name}</span>
                  <ExpertBadge
                    isAdvisor={activeFriend.isAdvisor}
                    category={activeFriend.advisorCategory}
                    badgeTitle={activeFriend.advisorBadge}
                    language={language}
                    variant="pill"
                    size="xs"
                  />
                </h2>
                <p className="text-xs text-[#10b981] font-mono">@{activeFriend.username}</p>
                <p className="text-[11px] text-zinc-500">{isFa ? "عضو پلتفرم هدیه و آرزوی گیفتی‌نو" : "Verified registry member"}</p>
              </div>

              <button
                onClick={() => onToggleFollow(activeFriend.id)}
                className={`py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  followingIds.includes(activeFriend.id)
                    ? "bg-zinc-950 border-zinc-850 text-zinc-400 hover:text-white"
                    : "bg-[#10b981] text-zinc-950 border-[#10b981] hover:bg-emerald-400"
                }`}
              >
                {followingIds.includes(activeFriend.id) ? (isFa ? "✓ دنبال می‌کنید" : "✓ Following") : (isFa ? "دنبال کردن" : "Follow")}
              </button>
            </div>

            {/* Wishlists */}
            <div className="space-y-4">
              <h3 className="text-xs font-black text-zinc-400 uppercase tracking-wider">{isFa ? "مناسبت‌ها و آرزوها" : "Active Registries"}</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {activeFriend.wishlists.map((wl) => (
                  <div
                    key={wl.id}
                    onClick={() => setSelectedListId(wl.id)}
                    className="bg-zinc-900 border border-zinc-800 hover:border-[#10b981]/50 rounded-3xl p-5 flex items-center justify-between cursor-pointer group transition-all"
                  >
                    <div className="space-y-1">
                      <h4 className="text-xs font-black text-white group-hover:text-[#10b981] transition-colors">{wl.title}</h4>
                      <p className="text-[10px] text-zinc-500 font-mono">{wl.occasionDate}</p>
                      <span className="text-[9px] bg-[#10b981]/10 text-[#10b981] px-2 py-0.5 rounded-md border border-emerald-500/10 inline-block font-mono">
                        {isFa ? `${toPersianDigits(wl.items.length)} آرزو` : `${wl.items.length} Wishes`}
                      </span>
                    </div>

                    <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:translate-x-1 transition-transform rtl:rotate-180" />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          /* Friends Lookup and Social empty state */
          <motion.div
            key="social-search"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Top Search bar */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-zinc-400 block uppercase tracking-wider">{isFa ? "یافتن دوستان" : "Find People"}</label>
              <div className="relative flex items-center bg-zinc-900 border border-zinc-800 focus-within:border-[#10b981] rounded-2xl p-1 transition-all">
                <div className="p-3 text-zinc-500 shrink-0">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder={isFa ? "جستجوی نام یا نام کاربری..." : "Search name or username..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full py-2.5 pr-3 pl-3 bg-transparent text-xs text-white outline-none"
                />
              </div>
            </div>

            {/* If a query is active, show matching results */}
            {searchQuery ? (
              <div className="space-y-3">
                <h3 className="text-xs font-black text-zinc-400 uppercase">{isFa ? "نتایج جستجو" : "Search Results"}</h3>
                {suggestedFriends.length === 0 ? (
                  <p className="text-xs text-zinc-500 text-center py-6">{isFa ? "هیچ کاربری یافت نشد." : "No members found."}</p>
                ) : (
                  <div className="space-y-2">
                    {suggestedFriends.map((f) => (
                      <div
                        key={f.id}
                        onClick={() => setSelectedFriendId(f.id)}
                        className="bg-zinc-900 border border-zinc-800 hover:border-zinc-750 p-4 rounded-3xl flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {renderAvatar(f.avatar, f.name, "w-10 h-10")}
                          <div>
                            <h4 className="text-xs font-black text-white flex items-center gap-1.5 flex-wrap">
                              <span>{f.name}</span>
                              <ExpertBadge
                                isAdvisor={f.isAdvisor}
                                category={f.advisorCategory}
                                badgeTitle={f.advisorBadge}
                                language={language}
                                variant="inline"
                                size="xs"
                              />
                            </h4>
                            <p className="text-[10px] text-zinc-500 font-mono">@{f.username}</p>
                          </div>
                        </div>

                        <ChevronRight className="w-4 h-4 text-zinc-600 rtl:rotate-180" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* No Search Query, show Followed Friends list */
              <div className="space-y-6">
                
                {/* Horizontal Segmented Controller for Social Subtabs */}
                <div className="flex bg-zinc-900/60 p-1.5 rounded-2xl border border-zinc-800/80 text-xs font-bold w-full">
                  <button
                    onClick={() => setSocialSubTab("following")}
                    className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      socialSubTab === "following" 
                        ? "bg-zinc-800 text-[#10b981] shadow-md border border-zinc-700/40" 
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>{isFa ? "دنبال‌شوندگان" : "Following"}</span>
                    {followedFriends.length > 0 && (
                      <span className="text-[9px] bg-zinc-950 px-1.5 py-0.5 rounded-full font-mono">
                        {toPersianDigits(followedFriends.length)}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => setSocialSubTab("sent_invites")}
                    className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      socialSubTab === "sent_invites" 
                        ? "bg-zinc-800 text-[#10b981] shadow-md border border-zinc-700/40" 
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>{isFa ? "دعوت‌های من" : "My Invites"}</span>
                    {sentInvites.length > 0 && (
                      <span className="text-[9px] bg-zinc-950 px-1.5 py-0.5 rounded-full font-mono">
                        {toPersianDigits(sentInvites.length)}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => setSocialSubTab("received_invites")}
                    className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      socialSubTab === "received_invites" 
                        ? "bg-zinc-800 text-[#10b981] shadow-md border border-zinc-700/40" 
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>{isFa ? "دعوت از من" : "Invited Me"}</span>
                    {receivedInvites.filter(i => !i.isFollowed).length > 0 && (
                      <span className="text-[9px] bg-rose-500/10 text-rose-400 px-1.5 py-0.5 rounded-full font-mono">
                        {toPersianDigits(receivedInvites.filter(i => !i.isFollowed).length)}
                      </span>
                    )}
                  </button>
                </div>

                {/* SUBTAB 1: Following List */}
                {socialSubTab === "following" && (
                  <div className="space-y-4">
                    {followedFriends.length === 0 ? (
                      /* High Fidelity empty state illustration - Matching Screenshot 2 exactly! */
                      <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-8 text-center space-y-6">
                        {/* Handcrafted clean cartoon Vector illustration using CSS */}
                        <div className="w-44 h-28 bg-zinc-900 rounded-3xl mx-auto flex items-center justify-center relative overflow-hidden border border-zinc-850">
                          {/* Avatar bubbles with connection line */}
                          <div className="absolute top-1/2 left-10 -translate-y-1/2 w-10 h-10 rounded-full bg-[#10b981]/20 border border-emerald-400/20 flex items-center justify-center text-lg">
                            👩‍💻
                          </div>
                          <div className="absolute top-1/2 right-10 -translate-y-1/2 w-10 h-10 rounded-full bg-amber-500/20 border border-amber-400/20 flex items-center justify-center text-lg animate-pulse">
                            👨‍🎨
                          </div>
                          <div className="w-16 h-0.5 border-t-2 border-dashed border-zinc-800" />
                          <div className="absolute bottom-2 bg-emerald-500/10 text-[#10b981] text-[7.5px] px-2 py-0.5 rounded border border-emerald-500/20 font-bold">
                            GIFTINO MATCH
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <h4 className="text-xs font-black text-white">
                            {isFa ? "هنوز هیچ دوستی را دنبال نکرده‌اید" : "Follow Friends"}
                          </h4>
                          <p className="text-[10px] text-zinc-500 max-w-xs mx-auto leading-relaxed">
                            {isFa 
                              ? "وقتی دوستان خود را دنبال کنید، لیست آرزوها و مناسبت‌های کادوی آن‌ها در اینجا ظاهر می‌شود تا کادوهای دلخواهشان را رزرو کنید." 
                              : "Once your friends add new items, their lists will appear here. Find people to follow!"}
                          </p>
                        </div>

                        {/* Suggestions Section */}
                        <div className="space-y-2.5 pt-4 border-t border-zinc-900">
                          <h5 className="text-[9.5px] text-zinc-400 uppercase font-black text-left rtl:text-right">
                            {isFa ? "پیشنهاد اعضای محبوب جهت دنبال کردن:" : "Popular accounts on Giftino:"}
                          </h5>
                          <div className="space-y-2">
                            {DEMO_SUGGESTED_PEOPLE.map((person) => {
                              const isAlreadyFollowing = followingIds.includes(person.id);
                              return (
                                <div
                                  key={person.id}
                                  className="bg-zinc-900 border border-zinc-850 p-3.5 rounded-2xl flex items-center justify-between"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    {renderAvatar(person.avatar, person.name, "w-8 h-8")}
                                    <div className="text-left rtl:text-right min-w-0">
                                      <h6 className="text-[11px] font-bold text-white leading-tight truncate flex items-center gap-1 flex-wrap">
                                        <span>{person.name}</span>
                                        <ExpertBadge
                                          isAdvisor={person.isAdvisor}
                                          category={person.advisorCategory}
                                          badgeTitle={person.advisorBadge}
                                          language={language}
                                          variant="inline"
                                          size="xs"
                                        />
                                      </h6>
                                      <p className="text-[9px] text-zinc-500 font-mono">@{person.username}</p>
                                    </div>
                                  </div>

                                  <button
                                    onClick={() => onToggleFollow(person.id)}
                                    className={`py-1 px-3 hover:text-white text-[10px] font-bold rounded-lg transition-colors cursor-pointer ${
                                      isAlreadyFollowing 
                                        ? "bg-zinc-800 text-zinc-400 border border-zinc-700/40" 
                                        : "bg-[#10b981] hover:bg-emerald-400 text-zinc-950 font-black"
                                    }`}
                                  >
                                    {isAlreadyFollowing ? (isFa ? "✓ دنبال می‌کنید" : "✓ Following") : (isFa ? "+ دنبال کردن" : "+ Follow")}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                      </div>
                    ) : (
                      /* Followed list rendering */
                      <div className="space-y-3">
                        <h3 className="text-xs font-black text-zinc-400 uppercase tracking-wider">{isFa ? "دوستان شما" : "Friends You Follow"}</h3>
                        <div className="space-y-2">
                          {followedFriends.map((f) => (
                            <div
                              key={f.id}
                              onClick={() => setSelectedFriendId(f.id)}
                              className="bg-zinc-900 border border-zinc-800 hover:border-[#10b981]/40 p-4 rounded-3xl flex items-center justify-between cursor-pointer transition-all"
                            >
                              <div className="flex items-center gap-3">
                                {renderAvatar(f.avatar, f.name, "w-10 h-10")}
                                <div>
                                  <h4 className="text-xs font-black text-white flex items-center gap-1.5 flex-wrap">
                                    <span>{f.name}</span>
                                    <ExpertBadge
                                      isAdvisor={f.isAdvisor}
                                      category={f.advisorCategory}
                                      badgeTitle={f.advisorBadge}
                                      language={language}
                                      variant="inline"
                                      size="xs"
                                    />
                                  </h4>
                                  <p className="text-[10px] text-zinc-500 font-mono">@{f.username}</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="text-[9px] bg-[#10b981]/15 text-[#10b981] px-2.5 py-0.5 rounded-full border border-emerald-500/15 font-mono">
                                  {isFa ? `${toPersianDigits(f.wishlists.length)} مناسبت` : `${f.wishlists.length} Events`}
                                </span>
                                <ChevronRight className="w-4 h-4 text-zinc-600 rtl:rotate-180" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* SUBTAB 2: Sent Invites (دعوت‌شده‌ها توسط شما) */}
                {socialSubTab === "sent_invites" && (
                  <div className="space-y-5">
                    {/* Interactive Invitation Form */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 space-y-4">
                      <div>
                        <h4 className="text-xs font-black text-white flex items-center gap-2">
                          <span>✉️</span>
                          <span>{isFa ? "دعوت دوست جدید به گیفتی‌نو" : "Invite a New Friend"}</span>
                        </h4>
                        <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">
                          {isFa 
                            ? "نام و شماره دوست خود را وارد کنید. سیستم یک پیامک دعوت هوشمند حاوی آدرس وب‌سایت ارسال می‌کند تا پس از ثبت نام به شبکه شما متصل شود!" 
                            : "Enter your friend's details. The platform will simulate triggering an elegant digital referral SMS invite."}
                        </p>
                      </div>

                      <form onSubmit={handleSendInvite} className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-bold text-zinc-400 uppercase">{isFa ? "نام دوست" : "Friend Name"}</label>
                            <input
                              type="text"
                              required
                              placeholder={isFa ? "مثال: علی صبوری" : "e.g., Ali Sabouri"}
                              value={inviteName}
                              onChange={(e) => setInviteName(e.target.value)}
                              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-[#10b981] font-medium"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[9px] font-bold text-zinc-400 uppercase">{isFa ? "شماره موبایل" : "Mobile Phone"}</label>
                            <input
                              type="tel"
                              required
                              placeholder={isFa ? "مثال: 09123456789" : "e.g., 09123456789"}
                              value={invitePhone}
                              onChange={(e) => setInvitePhone(e.target.value)}
                              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-[#10b981] font-mono text-left rtl:text-right"
                            />
                          </div>
                        </div>

                        {inviteSuccessMsg && (
                          <div className="p-3 bg-[#10b981]/10 text-[#10b981] text-[10.5px] font-bold rounded-xl border border-emerald-500/10 flex items-center gap-1.5 font-medium">
                            <span>🚀</span>
                            <span>{inviteSuccessMsg}</span>
                          </div>
                        )}

                        <button
                          type="submit"
                          className="w-full py-2.5 bg-[#10b981] hover:bg-emerald-400 text-zinc-950 font-black text-xs rounded-xl transition-all cursor-pointer"
                        >
                          {isFa ? "🎁 ارسال دعوت‌نامه پیامکی" : "Send SMS Invitation"}
                        </button>
                      </form>
                    </div>

                    {/* Sent Invites List */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-black text-zinc-400 uppercase tracking-wider">{isFa ? "دعوت‌های ارسال شده توسط شما" : "Sent Invitations"}</h4>
                      
                      {sentInvites.length === 0 ? (
                        <p className="text-xs text-zinc-500 text-center py-6 bg-zinc-950/40 border border-dashed border-zinc-900 rounded-3xl">
                          {isFa ? "هنوز کسی را دعوت نکرده‌اید." : "No pending invitations sent yet."}
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {sentInvites.map((inv: any) => (
                            <div
                              key={inv.id}
                              className="bg-zinc-900 border border-zinc-800 p-4 rounded-3xl flex items-center justify-between"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-2xl bg-zinc-950 border border-zinc-850 flex items-center justify-center text-zinc-400 font-bold text-xs font-mono">
                                  ✉️
                                </div>
                                <div className="space-y-0.5">
                                  <h5 className="text-xs font-extrabold text-white">{inv.name}</h5>
                                  <p className="text-[10px] text-zinc-500 font-mono">{inv.phone}</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  <span className="text-[8.5px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/10 font-bold">
                                    {isFa ? "منتظر ثبت‌نام" : "Pending RSVP"}
                                  </span>
                                  <p className="text-[8px] text-zinc-500 font-mono mt-0.5">{isFa ? `دعوت: ${inv.invitedAt}` : `Sent: ${inv.invitedAt}`}</p>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setInviteSuccessMsg(isFa ? "🔄 در حال باز کردن پیامک یادآوری..." : "🔄 Opening SMS app to resend invitation...");
                                    setTimeout(() => {
                                      triggerSmsInvite(inv.name, inv.phone);
                                      setInviteSuccessMsg("");
                                    }, 1500);
                                  }}
                                  className="p-1.5 bg-zinc-800 hover:bg-zinc-750 text-zinc-400 hover:text-[#10b981] rounded-lg transition-colors cursor-pointer"
                                  title={isFa ? "ارسال مجدد پیامک" : "Resend Invite"}
                                >
                                  <RefreshCw className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* SUBTAB 3: Received Invites (دعوت از من / افرادی که شما را دعوت کرده‌اند) */}
                {socialSubTab === "received_invites" && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xs font-black text-white flex items-center gap-2">
                        <span>🤝</span>
                        <span>{isFa ? "کسانی که شما را دعوت کرده‌اند" : "Received Invitations"}</span>
                      </h4>
                      <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">
                        {isFa 
                          ? "کاربران زیر شما را با وارد کردن شماره موبایل به گیفتی‌نو دعوت کرده‌اند. با تایید دعوت، بلافاصله در لیست دوستان هم قرار می‌گیرید!" 
                          : "These users invited you via phone. Accept their invitation to instantly mutual follow each other!"}
                      </p>
                    </div>

                    {receivedInvites.length === 0 ? (
                      <p className="text-xs text-zinc-500 text-center py-8 bg-zinc-950/40 border border-dashed border-zinc-900 rounded-3xl">
                        {isFa ? "هیچ دعوت‌نامه‌ای از طرف دیگران دریافت نشده است." : "No incoming invitations found."}
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {receivedInvites.map((rec: any) => {
                          const isAlreadyFollowing = followingIds.includes(rec.suggestedId);
                          return (
                            <div
                              key={rec.id}
                              className="bg-zinc-900 border border-zinc-850 p-4 rounded-3xl flex items-center justify-between"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-zinc-950 border border-zinc-850 flex items-center justify-center text-lg shadow-sm">
                                  {rec.avatar || "👤"}
                                </div>
                                <div className="space-y-0.5">
                                  <h5 className="text-xs font-extrabold text-white">{rec.name}</h5>
                                  <p className="text-[10px] text-[#10b981] font-mono">@{rec.phone}</p>
                                </div>
                              </div>

                              <div>
                                {isAlreadyFollowing ? (
                                  <span className="text-[10px] bg-emerald-500/10 text-[#10b981] px-3 py-1 rounded-xl border border-emerald-500/20 font-bold flex items-center gap-1">
                                    ✓ {isFa ? "قبول شد" : "Accepted"}
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onToggleFollow(rec.suggestedId);
                                      const updated = receivedInvites.map((i: any) => i.id === rec.id ? { ...i, isFollowed: true } : i);
                                      setReceivedInvites(updated);
                                      localStorage.setItem("giftino_received_invites", JSON.stringify(updated));
                                    }}
                                    className="px-3.5 py-1.5 bg-[#10b981] hover:bg-emerald-400 text-zinc-950 font-black text-[10px] rounded-xl transition-all cursor-pointer"
                                  >
                                    🤝 {isFa ? "قبول دعوت و دنبال کردن" : "Accept & Follow"}
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

              </div>
            )}

          </motion.div>
        )}
      </AnimatePresence>

      <PriceSearchModal
        isOpen={priceSearchOpen}
        onClose={() => setPriceSearchOpen(false)}
        initialQuery={priceSearchQuery}
        targetPrice={priceSearchTargetPrice}
        language={language}
      />

    </div>
  );
}
