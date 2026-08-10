import React, { useState, useEffect } from "react";
import { UserProfile, Wishlist, WishlistItem, Language } from "../types";
import { 
  Gift, Plus, Calendar, Trash2, Share2, Eye, EyeOff, X, Settings, 
  ChevronRight, Lock, Sparkles, FolderHeart, Heart, ExternalLink, RefreshCw,
  LayoutList, LayoutGrid, Check, Bell, Menu, Download
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toPersianDigits, formatTomanToWords } from "../utils";
import { PriceSearchModal } from "./PriceSearchModal";
import { AdvisorPortalModal } from "./AdvisorPortalModal";
import { ExpertBadge } from "./ExpertBadge";

interface ProfileViewProps {
  user: UserProfile;
  setUser: (user: UserProfile) => void;
  wishlists: Wishlist[];
  onUpdateWishlists: (updated: Wishlist[]) => void;
  language: Language;
  onOpenSettings: () => void;
  onOpenAddWish: () => void;
  onNavigateToTab?: (tab: string) => void;
  tourStep?: number;
  onOpenAvatarPicker: () => void;
  showCreateModal: boolean;
  setShowCreateModal: (show: boolean) => void;
  autoOpenAdvisorModal?: boolean;
  onResetAutoOpenAdvisorModal?: () => void;
}

const COLLAGE_IMAGES = [
  "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&q=80&w=200",
  "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&q=80&w=200",
  "https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&q=80&w=200",
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=200"
];

const GIFT_PREVIEW_IMAGES = [
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=300", 
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=300", 
  "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=300", 
  "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&q=80&w=300", 
  "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&q=80&w=300", 
  "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=300", 
  "https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&q=80&w=300", 
  "https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&q=80&w=300"  
];

const getProductImage = (title: string, index: number) => {
  const t = title.toLowerCase();
  
  if (t.includes("کیبورد") || t.includes("keyboard") || t.includes("keychron")) {
    return "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&q=80&w=300";
  }
  if (t.includes("قهوه") || t.includes("coffee") || t.includes("موکاپات") || t.includes("اسپرسو")) {
    return "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=300";
  }
  if (t.includes("کتاب") || t.includes("book") || t.includes("جامعه") || t.includes("رمان")) {
    return "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=300";
  }
  if (t.includes("حافظ") || t.includes("pomegranate") || t.includes("انار")) {
    return "https://images.unsplash.com/photo-1607344645866-009c320c5ab8?auto=format&fit=crop&q=80&w=300";
  }
  if (t.includes("ماگ") || t.includes("mug") || t.includes("سرامیکی") || t.includes("فنجان") || t.includes("cup")) {
    return "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&q=80&w=300";
  }
  if (t.includes("شام") || t.includes("رستوران") || t.includes("غذا") || t.includes("dinner") || t.includes("food")) {
    return "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=300";
  }
  if (t.includes("گلدان") || t.includes("گل") || t.includes("گیاه") || t.includes("flower") || t.includes("plant") || t.includes("vase") || t.includes("pot")) {
    return "https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&q=80&w=300";
  }
  if (t.includes("ساعت") || t.includes("watch") || t.includes("clock") || t.includes("مچ")) {
    return "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=300";
  }
  if (t.includes("کفش") || t.includes("کتونی") || t.includes("shoes") || t.includes("sneakers") || t.includes("کتانی")) {
    return "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=300";
  }
  if (t.includes("هدفون") || t.includes("هندزفری") || t.includes("headphone") || t.includes("headset") || t.includes("هدست") || t.includes("airpods") || t.includes("ایرباد")) {
    return "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=300";
  }
  if (t.includes("عینک") || t.includes("sunglasses") || t.includes("glasses")) {
    return "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&q=80&w=300";
  }
  if (t.includes("کیف") || t.includes("کوله") || t.includes("bag") || t.includes("backpack") || t.includes("wallet")) {
    return "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=300";
  }
  if (t.includes("شمع") || t.includes("candle")) {
    return "https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&q=80&w=300";
  }
  if (t.includes("عطر") || t.includes("ادکلن") || t.includes("perfume") || t.includes("cologne") || t.includes("اسپری")) {
    return "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&q=80&w=300";
  }
  if (t.includes("گوشی") || t.includes("موبایل") || t.includes("phone") || t.includes("mobile") || t.includes("آیفون") || t.includes("iphone")) {
    return "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=300";
  }
  if (t.includes("اسباب بازی") || t.includes("اسباب‌بازی") || t.includes("عروسک") || t.includes("toy") || t.includes("doll") || t.includes("lego") || t.includes("لگو") || t.includes("بازی فکری") || t.includes("پازل") || t.includes("barbie") || t.includes("باربی")) {
    return "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&q=80&w=300";
  }
  return GIFT_PREVIEW_IMAGES[index % GIFT_PREVIEW_IMAGES.length];
};

function WishlistCollage({ listIndex }: { listIndex: number }) {
  const img1 = GIFT_PREVIEW_IMAGES[(listIndex * 3) % GIFT_PREVIEW_IMAGES.length];
  const img2 = GIFT_PREVIEW_IMAGES[(listIndex * 3 + 1) % GIFT_PREVIEW_IMAGES.length];
  const img3 = GIFT_PREVIEW_IMAGES[(listIndex * 3 + 2) % GIFT_PREVIEW_IMAGES.length];

  return (
    <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 border border-zinc-800 flex gap-[2px] bg-zinc-950">
      <div className="w-1/2 h-full overflow-hidden">
        <img 
          src={img1} 
          alt="Gift collage 1" 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>
      <div className="w-1/2 h-full flex flex-col gap-[2px]">
        <div className="h-1/2 overflow-hidden">
          <img 
            src={img2} 
            alt="Gift collage 2" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="h-1/2 overflow-hidden">
          <img 
            src={img3} 
            alt="Gift collage 3" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>
    </div>
  );
}

export default function ProfileView({
  user,
  setUser,
  wishlists,
  onUpdateWishlists,
  language,
  onOpenSettings,
  onOpenAddWish,
  onNavigateToTab,
  tourStep,
  onOpenAvatarPicker,
  showCreateModal,
  setShowCreateModal,
  autoOpenAdvisorModal,
  onResetAutoOpenAdvisorModal
}: ProfileViewProps) {
  const isFa = language === "fa";
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newOccasion, setNewOccasion] = useState<Wishlist["occasionType"]>("birthday");
  
  // Giftful segmented views
  const [viewMode, setViewMode] = useState<"lists" | "items" | "claimed">("lists");
  const [showPastListsModal, setShowPastListsModal] = useState(false);
  const [localClaimedItems, setLocalClaimedItems] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("giftino_claimed_items");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem("giftino_claimed_items");
      if (saved) setLocalClaimedItems(JSON.parse(saved));
    } catch (e) {
      console.log(e);
    }
  }, [viewMode]);
  
  // Surprise mode / Guest view simulator state
  const [isGuestView, setIsGuestView] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestNameConfirmed, setGuestNameConfirmed] = useState(false);

  // Price search engine modal state
  const [priceSearchOpen, setPriceSearchOpen] = useState(false);
  const [priceSearchQuery, setPriceSearchQuery] = useState("");
  const [priceSearchTargetPrice, setPriceSearchTargetPrice] = useState<number | undefined>(undefined);

  // Advisor Portal Modal state
  const [showAdvisorModal, setShowAdvisorModal] = useState(false);

  useEffect(() => {
    if (autoOpenAdvisorModal) {
      setShowAdvisorModal(true);
      if (onResetAutoOpenAdvisorModal) {
        onResetAutoOpenAdvisorModal();
      }
    }
  }, [autoOpenAdvisorModal, onResetAutoOpenAdvisorModal]);

  // If tourStep is 3, make sure a wishlist is selected so the share button is visible!
  useEffect(() => {
    if (tourStep === 3 && !selectedListId && wishlists.length > 0) {
      setSelectedListId(wishlists[0].id);
    }
  }, [tourStep, selectedListId, wishlists]);

  // Invite share popup state
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareList, setShareList] = useState<Wishlist | null>(null);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [sharedInvite, setSharedInvite] = useState(() => localStorage.getItem("giftino_shared_invite") === "true");
  const [customInviteText, setCustomInviteText] = useState("");
  const [showPostcardShareOptions, setShowPostcardShareOptions] = useState(false);
  const [postcardTab, setPostcardTab] = useState<"text" | "qr">("text");
  const [downloadingProfileQR, setDownloadingProfileQR] = useState(false);

  // Secret suggestion modal state
  const [showSecretModal, setShowSecretModal] = useState(false);
  const [secretTitle, setSecretTitle] = useState("");
  const [secretPrice, setSecretPrice] = useState("");
  const [secretLink, setSecretLink] = useState("");
  const [secretNotes, setSecretNotes] = useState("");
  const [secretPriority, setSecretPriority] = useState<"high" | "medium" | "low">("medium");

  useEffect(() => {
    if (!shareList) return;
    const baseText = isFa 
      ? `این یک کارت پستالِ راز است... 🔒 آرزوهای من برای [${shareList.title}] درون این پیوند پنهان شده است:`
      : `This is a secret postcard... 🔒 My wishes for [${shareList.title}] are hidden inside this link:`;
    setCustomInviteText(baseText);
  }, [shareList, isFa]);
  const derivedUsername = user.phone === "09123456789" ? "hamidrezaghasemi" : user.name.toLowerCase().replace(/\s+/g, "");

  const nowStr = new Date().toISOString().split("T")[0];
  const activeWishlists = wishlists.filter(wl => wl.occasionDate >= nowStr);
  const pastWishlists = wishlists.filter(wl => wl.occasionDate < nowStr);

  const handleCreateList = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newList: Wishlist = {
      id: "wl_" + Date.now(),
      title: newTitle.trim(),
      occasionDate: newDate || new Date().toISOString().split("T")[0],
      occasionType: newOccasion,
      items: []
    };

    onUpdateWishlists([newList, ...wishlists]);
    setSelectedListId(newList.id);
    setNewTitle("");
    setNewDate("");
    setNewOccasion("birthday");
    setShowCreateModal(false);
  };

  const handleDeleteList = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmMsg = isFa 
      ? "آیا از حذف این لیست آرزو اطمینان دارید؟ تمام اقلام داخل آن حذف خواهد شد." 
      : "Are you sure you want to delete this wishlist? All items will be removed.";
    if (confirm(confirmMsg)) {
      const updated = wishlists.filter((wl) => wl.id !== id);
      onUpdateWishlists(updated);
      if (selectedListId === id) setSelectedListId(null);
    }
  };

  const handleDeleteItem = (listId: string, itemId: string) => {
    // Before deleting, push it to local storage "recently deleted" so they can restore it in settings!
    const wl = wishlists.find((w) => w.id === listId);
    if (wl) {
      const itemToDelete = wl.items.find((it) => it.id === itemId);
      if (itemToDelete) {
        const deletedStorage = localStorage.getItem("giftino_recently_deleted") || "[]";
        const deletedArr = JSON.parse(deletedStorage);
        deletedArr.push({
          item: itemToDelete,
          listId,
          listTitle: wl.title,
          deletedAt: new Date().toISOString()
        });
        localStorage.setItem("giftino_recently_deleted", JSON.stringify(deletedArr));
      }
    }

    const updated = wishlists.map((w) => {
      if (w.id === listId) {
        return {
          ...w,
          items: w.items.filter((item) => item.id !== itemId)
        };
      }
      return w;
    });
    onUpdateWishlists(updated);
  };

  const handleCreateSecretSuggestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!secretTitle.trim() || !selectedListId) return;

    const guestNameToUse = guestName.trim() || (isFa ? "مهمان ناشناس" : "Anonymous Guest");
    const parsedPrice = secretPrice ? parseInt(secretPrice.replace(/,/g, "")) : undefined;

    const newSecretItem: WishlistItem = {
      id: "item_secret_" + Date.now(),
      title: secretTitle.trim(),
      price: parsedPrice,
      link: secretLink.trim() || undefined,
      notes: secretNotes.trim() || undefined,
      priority: secretPriority,
      isReserved: true, // Auto-reserved by the guest who suggested it
      reservedBy: guestNameToUse,
      isSecret: true,
      addedBy: guestNameToUse
    };

    const updated = wishlists.map((w) => {
      if (w.id === selectedListId) {
        return {
          ...w,
          items: [newSecretItem, ...w.items]
        };
      }
      return w;
    });

    onUpdateWishlists(updated);
    setSecretTitle("");
    setSecretPrice("");
    setSecretLink("");
    setSecretNotes("");
    setSecretPriority("medium");
    setShowSecretModal(false);
  };

  const handleReserveItem = (listId: string, itemId: string) => {
    const nameToUse = guestName.trim() || (isFa ? "مهمان ناشناس" : "Anonymous Guest");
    const updated = wishlists.map((w) => {
      if (w.id === listId) {
        return {
          ...w,
          items: w.items.map((item) => {
            if (item.id === itemId) {
              return { ...item, isReserved: true, reservedBy: nameToUse };
            }
            return item;
          })
        };
      }
      return w;
    });
    onUpdateWishlists(updated);
  };

  const handleUnreserveItem = (listId: string, itemId: string) => {
    const updated = wishlists.map((w) => {
      if (w.id === listId) {
        return {
          ...w,
          items: w.items.map((item) => {
            if (item.id === itemId) {
              return { ...item, isReserved: false, reservedBy: undefined };
            }
            return item;
          })
        };
      }
      return w;
    });
    onUpdateWishlists(updated);
  };

  const handleCopyInviteText = () => {
    if (!shareList) return;
    const registryLink = `https://giftino.ir/registry/${shareList.id}`;
    const fullText = `${customInviteText}\n🔗 ${registryLink}`;

    navigator.clipboard.writeText(fullText);
    setCopiedInvite(true);
    localStorage.setItem("giftino_shared_invite", "true");
    setSharedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2000);
  };

  const handleSystemShare = async () => {
    if (!shareList) return;
    const registryLink = `https://giftino.ir/registry/${shareList.id}`;
    const fullText = `${customInviteText}\n🔗 ${registryLink}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareList.title,
          text: fullText,
        });
        localStorage.setItem("giftino_shared_invite", "true");
        setSharedInvite(true);
      } catch (err) {
        console.log("Error sharing:", err);
      }
    } else {
      handleCopyInviteText();
    }
  };

  const activeList = wishlists.find((w) => w.id === selectedListId);
  const secretItems = activeList ? activeList.items.filter((item) => item.isSecret) : [];
  const displayedItems = activeList 
    ? (isGuestView ? activeList.items : activeList.items.filter((item) => !item.isSecret))
    : [];

  const checkListOccasion = wishlists.length > 0;
  const checkListAddGift = wishlists.some(wl => wl.items.length > 0);
  const checkListShare = sharedInvite;
  const checkListFollow = (() => {
    try {
      return JSON.parse(localStorage.getItem("giftino_following_friends") || "[]").length > 0;
    } catch {
      return false;
    }
  })();
  const checkListInvite = (() => {
    try {
      return JSON.parse(localStorage.getItem("giftino_sent_invites") || "[]").length > 0;
    } catch {
      return false;
    }
  })();
  const checkListClaim = (() => {
    try {
      return JSON.parse(localStorage.getItem("giftino_claimed_items") || "[]").length > 0;
    } catch {
      return false;
    }
  })();

  const adoptionSteps = [
    {
      id: 1,
      title: isFa ? "ایجاد مناسبت" : "Create Occasion",
      desc: isFa ? "ساخت یک مناسبت مثل تولد یا سالگرد" : "Create a wishlist registry",
      completed: checkListOccasion,
      action: () => setShowCreateModal(true),
      icon: "📋"
    },
    {
      id: 2,
      title: isFa ? "انتخاب هدیه" : "Add Wishes",
      desc: isFa ? "ثبت هدیه دلخواه با قیمت و لینک" : "Add products you desire",
      completed: checkListAddGift,
      action: onOpenAddWish,
      icon: "🎁"
    },
    {
      id: 3,
      title: isFa ? "اشتراک‌گذاری" : "Share Registry",
      desc: isFa ? "اشتراک‌گذاری لینک یا ساخت دعوت‌نامه" : "Share with friends or family",
      completed: checkListShare,
      action: () => {
        if (wishlists.length > 0) {
          setShareList(wishlists[0]);
          setShowShareModal(true);
        } else {
          setShowCreateModal(true);
        }
      },
      icon: "🔗"
    },
    {
      id: 4,
      title: isFa ? "دنبال کردن دوستان" : "Follow Friend",
      desc: isFa ? "فالو کردن دوست با آیدی در شبکه" : "Follow your friends' profiles",
      completed: checkListFollow,
      action: () => onNavigateToTab?.("friends"),
      icon: "👥"
    },
    {
      id: 5,
      title: isFa ? "ارسال دعوت‌نامه" : "Send SMS Invite",
      desc: isFa ? "دعوت دوست جدید به برنامه با پیامک" : "Invite new loved ones via SMS",
      completed: checkListInvite,
      action: () => onNavigateToTab?.("friends"),
      icon: "✉️"
    },
    {
      id: 6,
      title: isFa ? "رزرو هدیه دوست" : "Claim a Gift",
      desc: isFa ? "رزرو هدیه از لیست دوست بدون اطلاع او" : "Reserve an item from friend list",
      completed: checkListClaim,
      action: () => onNavigateToTab?.("friends"),
      icon: "🔒"
    }
  ];

  const completedCount = adoptionSteps.filter(s => s.completed).length;
  const progressPercent = Math.round((completedCount / adoptionSteps.length) * 100);

  return (
    <div className="space-y-6">
      
      {/* Giftful Logo at the top left of the scroll content (scrolls up out of view on mobile) */}
      <div className="flex justify-between items-center w-full px-2 pt-2 md:hidden">
        <span className="font-serif text-2xl font-black text-[#10b981] tracking-tight cursor-pointer select-none">
          giftful
        </span>
        <div className="w-24" /> {/* spacer for the floating capsule */}
      </div>
      
      {/* If a specific wishlist is selected, show its high-fidelity detail view */}
      <AnimatePresence mode="wait">
        {activeList ? (
          <motion.div
            key="list-details"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Back button */}
            <button
              onClick={() => { setSelectedListId(null); setIsGuestView(false); setGuestNameConfirmed(false); }}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 hover:border-emerald-500/40 text-zinc-300 hover:text-emerald-400 rounded-xl text-xs font-black cursor-pointer transition-all shadow-sm"
            >
              <ChevronRight className="w-4 h-4 rotate-180 rtl:rotate-0" />
              <span>{isFa ? "بازگشت به پروفایل" : "Back to Profile"}</span>
            </button>

            {/* List Details Card */}
            <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/80 shadow-[0_8px_32px_rgba(0,0,0,0.4)] rounded-3xl p-6 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                  <span className="text-[9px] bg-emerald-500/10 text-[#10b981] font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/20 font-mono">
                    {activeList.occasionType.toUpperCase()}
                  </span>
                  <h2 className="text-xl font-black text-white">{activeList.title}</h2>
                  <p className="text-xs text-zinc-500 flex items-center gap-1.5 font-mono">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{activeList.occasionDate}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    id="tour-share-btn"
                    onClick={() => { setShareList(activeList); setShowShareModal(true); }}
                    className="flex-1 sm:flex-initial py-2 px-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>{isFa ? "ارسال دعوت‌نامه" : "Share Registry"}</span>
                  </button>
                  
                  <button
                    onClick={(e) => handleDeleteList(activeList.id, e)}
                    className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/10 rounded-xl transition-all cursor-pointer"
                    title={isFa ? "حذف لیست" : "Delete List"}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Stats progress */}
              {activeList.items.length > 0 && (
                <div className="pt-4 border-t border-zinc-800 space-y-2">
                  <div className="flex justify-between items-center text-[10px] text-zinc-400 font-bold">
                    <span>{isFa ? "کادوهای رزرو شده" : "Reserved Gifts Progress"}</span>
                    <span className="text-[#10b981] font-mono">
                      {toPersianDigits(activeList.items.filter(i => i.isReserved).length)} / {toPersianDigits(activeList.items.length)}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-950 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#10b981] transition-all duration-300"
                      style={{ width: `${(activeList.items.filter(i => i.isReserved).length / activeList.items.length) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Secret items notification for wishlist owner */}
            {!isGuestView && secretItems.length > 0 && (
              <div className="bg-amber-500/5 border border-amber-500/10 p-5 rounded-3xl space-y-2 relative overflow-hidden">
                <div className="absolute top-[-20%] right-[-10%] w-32 h-32 rounded-full bg-amber-500/5 blur-xl pointer-events-none" />
                <h3 className="text-xs font-black text-amber-400 flex items-center gap-2 relative z-10">
                  <span>🤫</span>
                  <span>{isFa ? "شما پیشنهادهای مخفی دارید!" : "You have secret suggestions!"}</span>
                </h3>
                <p className="text-[10px] text-zinc-300 leading-relaxed relative z-10">
                  {isFa 
                    ? `دوستان شما تعداد ${toPersianDigits(secretItems.length)} پیشنهاد کادوی مخفی برای شما ثبت کرده‌اند! این کادوها برای محافظت از سوپرایز شما پنهان شده‌اند، اما سایر مهمانان می‌توانند آن‌ها را ببینند تا از خرید تکراری جلوگیری شود. ✨` 
                    : `Your friends have suggested ${secretItems.length} secret gifts for you! These are hidden from you to keep them a surprise, but other guests can see them to prevent double gifting. ✨`}
                </p>
              </div>
            )}

            {/* List items block */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-black text-white">{isFa ? "آرزوهای ثبت شده" : "Wishlist Items"}</h3>
                {!isGuestView ? (
                  <button
                    onClick={onOpenAddWish}
                    className="inline-flex items-center gap-1.5 text-xs text-[#10b981] hover:underline font-bold"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{isFa ? "افزودن کادو جدید" : "Add Gift"}</span>
                  </button>
                ) : (
                  guestNameConfirmed && (
                    <button
                      onClick={() => setShowSecretModal(true)}
                      className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:underline font-bold px-3 py-1.5 rounded-xl bg-amber-400/5 hover:bg-amber-400/10 border border-amber-400/10 transition-all cursor-pointer"
                    >
                      <span>💡</span>
                      <span>{isFa ? "ثبت پیشنهاد مخفی" : "Suggest Secret Gift"}</span>
                    </button>
                  )
                )}
              </div>

              {displayedItems.length === 0 ? (
                <div className="bg-zinc-900/30 border border-dashed border-zinc-800 rounded-3xl p-12 text-center space-y-3">
                  <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center text-zinc-500 mx-auto text-xl">
                    🎁
                  </div>
                  <p className="text-xs text-zinc-500 max-w-xs mx-auto leading-relaxed">
                    {isFa 
                      ? "این لیست هنوز خالی است! دکمه بالا را بزنید یا به اکسپلور سر بزنید و هدیه‌های خاص اضافه کنید." 
                      : "No wishes here yet! Go to Add Wish, or Browse Explore to fill your list."}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {displayedItems.map((item) => {
                    const isReservedByMe = isGuestView && guestNameConfirmed && item.isReserved && item.reservedBy === guestName;
                    return (
                      <div
                        key={item.id}
                        className={`p-5 rounded-3xl border transition-all flex flex-col justify-between relative ${
                          item.isReserved 
                            ? isGuestView 
                              ? isReservedByMe 
                                ? "bg-emerald-500/5 border-[#10b981]" 
                                : "bg-zinc-900/40 border-zinc-900 opacity-60" 
                              : "bg-emerald-500/5 border-emerald-500/20"
                            : "bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/80 hover:border-zinc-700/80 hover:scale-[1.02] active:scale-[0.98] hover:bg-zinc-900/70 shadow-[0_8px_20px_rgba(0,0,0,0.25)]"
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex justify-between items-start gap-2">
                            <h4 className="text-xs font-black text-white leading-snug flex items-center gap-1.5">
                              {item.title}
                            </h4>
                            <div className="flex items-center gap-1">
                              {item.isSecret && (
                                <span className="text-[8px] font-extrabold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/10 flex items-center gap-0.5">
                                  <span>🤫</span>
                                  <span>{isFa ? "مخفی" : "Secret"}</span>
                                </span>
                              )}
                              <span className={`text-[8.5px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider ${
                                item.priority === "high" 
                                  ? "bg-rose-500/10 text-rose-400 border border-rose-500/10" 
                                  : item.priority === "medium" 
                                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/10" 
                                    : "bg-blue-500/10 text-blue-400 border border-blue-500/10"
                              }`}>
                                {isFa 
                                  ? (item.priority === "high" ? "ضروری" : item.priority === "medium" ? "متوسط" : "کم")
                                  : item.priority}
                              </span>
                            </div>
                          </div>

                          {item.price && (
                            <p className="text-[11px] font-mono font-black text-[#10b981]">
                              {isFa ? toPersianDigits(item.price.toLocaleString()) + " تومان" : item.price.toLocaleString() + " Tomans"}
                            </p>
                          )}

                          {item.notes && (
                            <p className="text-[10px] text-zinc-400 bg-zinc-950/40 p-2.5 rounded-xl border border-zinc-900/60 leading-relaxed">
                              {item.notes}
                            </p>
                          )}
                        </div>

                        {/* Direct store redirect */}
                        <div className="pt-4 mt-4 border-t border-zinc-900/60 flex items-center justify-between gap-3">
                          <div className="flex flex-col gap-1">
                            {item.link ? (
                              <a
                                href={item.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] font-bold text-[#10b981] hover:underline flex items-center gap-1"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>{isFa ? "مشاهده و خرید" : "Buy Link"}</span>
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

                          {/* Action Button: Delete if owner, Reserve/Unreserve if guest */}
                          {!isGuestView ? (
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                              {item.isReserved ? (
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                                    🔒 {isFa ? "رزرو شده (سورپرایز 🤫)" : "Reserved (Surprise 🤫)"}
                                  </span>
                                  <button
                                    onClick={() => {
                                      const savedNotifs = localStorage.getItem("giftino_notifications") || "[]";
                                      const notifs = JSON.parse(savedNotifs);
                                      if (!notifs.some((n: any) => n.itemId === item.id)) {
                                        notifs.push({
                                          itemId: item.id,
                                          itemTitle: item.title,
                                          sentAt: new Date().toISOString()
                                        });
                                        localStorage.setItem("giftino_notifications", JSON.stringify(notifs));
                                      }
                                      alert(isFa 
                                        ? `🔔 پیام یادآوری ناشناس برای خریدار کادوی «${item.title}» ارسال شد تا رزرو خود را تایید یا تمدید کند!` 
                                        : `🔔 Anonymous reminder sent successfully to the buyer of "${item.title}"!`);
                                    }}
                                    className="px-2 py-0.8 bg-amber-500 hover:bg-amber-400 text-zinc-950 text-[8.5px] font-black rounded-lg transition-colors cursor-pointer flex items-center gap-0.5"
                                    title={isFa ? "ارسال یادآوری به خریدار کادو" : "Remind buyer to complete or extend reservation"}
                                  >
                                    <span>🔔</span>
                                    <span>{isFa ? "یادآوری" : "Remind"}</span>
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[9px] text-zinc-500 font-bold uppercase">{isFa ? "آزاد" : "Available"}</span>
                              )}
                              
                              <button
                                onClick={() => handleDeleteItem(activeList.id, item.id)}
                                className="p-1.5 hover:bg-rose-500/10 text-zinc-500 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                                title={isFa ? "حذف آرزو" : "Remove"}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div>
                              {item.isReserved ? (
                                isReservedByMe ? (
                                  <button
                                    onClick={() => handleUnreserveItem(activeList.id, item.id)}
                                    className="px-3 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl text-[10px] font-bold transition-all cursor-pointer"
                                  >
                                    {isFa ? "لغو رزرو کادو" : "Cancel Claim"}
                                  </button>
                                ) : (
                                  <span className="text-[10px] text-zinc-500 font-bold">🔒 {isFa ? "رزرو شده" : "Reserved"}</span>
                                )
                              ) : (
                                <button
                                  onClick={() => {
                                    if (!guestName.trim() || !guestNameConfirmed) {
                                      setIsGuestView(true);
                                      alert(isFa ? "لطفاً ابتدا نام خود را در بالای کادر وارد کنید." : "Please enter your name as a guest above first.");
                                      return;
                                    }
                                    handleReserveItem(activeList.id, item.id);
                                  }}
                                  className="px-3.5 py-1 bg-[#10b981] text-zinc-950 font-black text-[10px] rounded-xl hover:bg-emerald-400 transition-all cursor-pointer"
                                >
                                  {isFa ? "🎁 رزرو کردن کادو" : "🎁 Claim Gift"}
                                </button>
                              )}
                            </div>
                          )}
                        </div>

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
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="profile-summary"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6 relative"
          >
            {/* Centered User Bio Section */}
            <div className="flex flex-col items-center text-center py-4 space-y-3">
              {/* Center circular avatar */}
              <div 
                onClick={onOpenAvatarPicker}
                className="relative cursor-pointer group"
                title={isFa ? "تغییر آواتار" : "Change Avatar"}
              >
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#10b981]/15 via-zinc-900 to-amber-500/10 border-[3px] border-zinc-800 group-hover:border-[#10b981] flex items-center justify-center font-black text-4xl text-white overflow-hidden shadow-xl transition-all relative">
                  {user.avatar ? (
                    user.avatar.startsWith("http") ? (
                      <img src={user.avatar} className="w-full h-full object-cover" referrerPolicy="no-referrer" alt={user.name} />
                    ) : (
                      <span>{user.avatar}</span>
                    )
                  ) : user.phone === "09123456789" ? (
                    <span>🦁</span>
                  ) : (
                    <span className="text-xl font-black text-zinc-300">{user.name.slice(0, 2).toUpperCase()}</span>
                  )}

                  {/* Quick hover overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] text-emerald-400 font-extrabold transition-opacity">
                    {isFa ? "تغییر" : "Edit"}
                  </div>
                </div>
                <div className="absolute bottom-0 right-0 w-6 h-6 bg-[#10b981] text-zinc-950 text-[11px] rounded-full border-2 border-zinc-950 flex items-center justify-center font-bold shadow-md">
                  ✏️
                </div>
              </div>

              {/* Name and Username */}
              <div className="space-y-1 flex flex-col items-center">
                <h1 className="text-xl font-black text-white tracking-tight leading-none">
                  {user.name}
                </h1>
                <p className="text-xs text-zinc-500 font-mono">@{derivedUsername}</p>
              </div>

              {/* 3-State Switcher capsule pill */}
              <div className="bg-zinc-900/60 p-1 rounded-full border border-zinc-800/80 flex items-center gap-1 shadow-inner relative">
                {/* Lists Mode Button */}
                <button
                  onClick={() => setViewMode("lists")}
                  className={`px-4 py-2 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                    viewMode === "lists" 
                      ? "bg-zinc-800 text-[#10b981] shadow-sm border border-zinc-700/30" 
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                  title={isFa ? "نمای لیست‌ها" : "Lists View"}
                >
                  <LayoutList className="w-4 h-4" />
                </button>

                {/* Items Mode Button */}
                <button
                  onClick={() => setViewMode("items")}
                  className={`px-4 py-2 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                    viewMode === "items" 
                      ? "bg-zinc-800 text-[#10b981] shadow-sm border border-zinc-700/30" 
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                  title={isFa ? "نمای تمام کادوها" : "All Wishes View"}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>

                {/* Claimed/Reserved Mode Button */}
                <button
                  onClick={() => setViewMode("claimed")}
                  className={`px-4 py-2 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                    viewMode === "claimed" 
                      ? "bg-zinc-800 text-[#10b981] shadow-sm border border-zinc-700/30" 
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                  title={isFa ? "کادوهای رزرو شده" : "Claimed Wishes View"}
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* SEGMENT SUBVIEWS LOOP */}
            <div className="pt-2">
              
              {/* MODE 1: LISTS VIEW */}
              {viewMode === "lists" && (() => {
                const nowStr = new Date().toISOString().split("T")[0];
                const activeWishlists = wishlists.filter(wl => wl.occasionDate >= nowStr);
                const pastWishlists = wishlists.filter(wl => wl.occasionDate < nowStr);

                return (
                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-zinc-400 uppercase tracking-wider">
                      {isFa ? "لیست‌های فعال" : "Active Wishlists"}
                    </h3>

                    <div id="tour-wishlists" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Active wishlists mapped to collages */}
                      {activeWishlists.map((wl, idx) => {
                        const itemsCount = wl.items.length;
                        return (
                          <div
                            key={wl.id}
                            onClick={() => setSelectedListId(wl.id)}
                            className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/80 hover:border-[#10b981]/50 hover:bg-zinc-900/75 hover:scale-[1.02] active:scale-[0.98] rounded-3xl overflow-hidden p-4 flex items-center gap-4 transition-all duration-300 cursor-pointer group select-none shadow-[0_8px_24px_rgba(0,0,0,0.3)]"
                          >
                            {/* Collage visualizer on left */}
                            <WishlistCollage listIndex={idx} />

                            {/* Details Side */}
                            <div className="min-w-0 flex-1 space-y-1">
                              <h4 className="text-xs font-black text-white group-hover:text-[#10b981] transition-colors truncate">
                                {wl.title}
                              </h4>
                              <p className="text-[10px] text-zinc-500 font-mono flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span>{wl.occasionDate}</span>
                              </p>
                              <p className="text-[10px] font-bold text-[#10b981]">
                                {isFa 
                                  ? `${toPersianDigits(itemsCount.toString())} آرزو` 
                                  : `${itemsCount} Wishes`}
                              </p>
                            </div>

                            <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:translate-x-1 transition-transform rtl:rotate-180 shrink-0" />
                          </div>
                        );
                      })}

                      {/* Past Lists Card */}
                      <div 
                        onClick={() => setShowPastListsModal(true)}
                        className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/80 hover:border-[#10b981]/50 hover:bg-zinc-900/75 hover:scale-[1.02] active:scale-[0.98] rounded-3xl p-4 flex items-center gap-4 transition-all duration-300 cursor-pointer group shadow-[0_8px_24px_rgba(0,0,0,0.3)] select-none"
                      >
                        <div className="w-16 h-16 rounded-2xl bg-zinc-950/80 border border-zinc-850 flex items-center justify-center shrink-0 group-hover:bg-zinc-900 transition-all">
                          <span className="text-2xl">⏳</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-black text-white group-hover:text-[#10b981] transition-colors">
                            {isFa ? "لیست‌های گذشته" : "Past Lists"}
                          </h4>
                          <p className="text-[10px] text-zinc-500 mt-0.5">
                            {isFa 
                              ? `${toPersianDigits(pastWishlists.length.toString())} لیست قدیمی` 
                              : `${pastWishlists.length} Past List${pastWishlists.length !== 1 ? 's' : ''}`
                            }
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:translate-x-1 transition-transform rtl:rotate-180 shrink-0" />
                      </div>

                      {/* Create Wishlist trigger card */}
                      <div
                        onClick={() => setShowCreateModal(true)}
                        className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/80 hover:border-[#10b981]/60 hover:bg-zinc-900/75 hover:scale-[1.02] active:scale-[0.98] rounded-3xl p-4 flex items-center gap-4 transition-all duration-300 cursor-pointer group shadow-[0_8px_24px_rgba(0,0,0,0.3)] select-none"
                      >
                        <div className="w-16 h-16 rounded-2xl bg-[#10b981]/10 flex items-center justify-center shrink-0 border border-emerald-500/10 group-hover:bg-[#10b981]/20 transition-all">
                          <Plus className="w-6 h-6 text-[#10b981]" />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-white">{isFa ? "ایجاد لیست آرزوی جدید" : "Create Wishlist"}</h4>
                          <p className="text-[10px] text-zinc-500 mt-0.5">
                            {isFa ? "کادوی تولد، عروسی یا مناسبت‌های خاص" : "Add event registry details"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* MODE 2: ALL ITEMS GRID VIEW */}
              {viewMode === "items" && (() => {
                const nowStr = new Date().toISOString().split("T")[0];
                const activeWishlists = wishlists.filter(wl => wl.occasionDate >= nowStr);
                const allWishes = activeWishlists.flatMap(wl => 
                  wl.items.map(item => ({
                    ...item,
                    listId: wl.id,
                    listTitle: wl.title
                  }))
                );

                return (
                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-zinc-400 uppercase tracking-wider">
                      {isFa ? "تمام کادوهای شما" : "All Gift Wishes"}
                    </h3>

                    {allWishes.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 px-6 text-center space-y-4">
                        <div className="w-16 h-16 rounded-full border-2 border-dashed border-zinc-850 flex items-center justify-center text-zinc-500">
                          <Gift className="w-8 h-8" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-sm font-black text-white">
                            {isFa ? "هنوز آرزویی اضافه نکرده‌اید" : "No wishes added yet"}
                          </h3>
                          <p className="text-[10px] text-zinc-500">
                            {isFa ? "برای شروع یک کادو یا آرزوی جدید به یکی از لیست‌های خود اضافه کنید." : "Create or select a wishlist above to add your first gift desire."}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {allWishes.map((item, idx) => {
                          const productImg = getProductImage(item.title, idx);
                          return (
                            <div
                              key={item.id}
                              onClick={() => setSelectedListId(item.listId)}
                              className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/80 hover:border-emerald-500/30 hover:scale-[1.01] rounded-3xl overflow-hidden flex flex-col transition-all cursor-pointer shadow-md select-none group"
                            >
                              {/* Product Image preview box */}
                              <div className="aspect-square w-full overflow-hidden bg-zinc-950 relative border-b border-zinc-850">
                                <img src={productImg} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={item.title} referrerPolicy="no-referrer" />
                                <span className="absolute top-2 right-2 text-[8px] bg-black/70 text-zinc-300 font-extrabold px-2 py-0.5 rounded-full backdrop-blur-sm border border-zinc-800">
                                  {item.listTitle}
                                </span>
                              </div>

                              <div className="p-3 space-y-1.5 flex-1 flex flex-col justify-between">
                                <div className="space-y-1">
                                  <h4 className="text-[11px] font-black text-white truncate group-hover:text-[#10b981] transition-colors leading-tight">
                                    {item.title}
                                  </h4>
                                  {item.price && (
                                    <p className="text-[10px] font-mono font-black text-[#10b981]">
                                      {isFa ? toPersianDigits(item.price.toLocaleString()) + " تومان" : item.price.toLocaleString() + " Tomans"}
                                    </p>
                                  )}
                                </div>

                                <div className="flex items-center justify-between pt-2 border-t border-zinc-900/60 mt-2">
                                  <span className={`text-[8px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider ${
                                    item.priority === "high" 
                                      ? "bg-rose-500/10 text-rose-400 border border-rose-500/10" 
                                      : item.priority === "medium" 
                                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/10" 
                                        : "bg-blue-500/10 text-blue-400 border border-blue-500/10"
                                  }`}>
                                    {isFa 
                                      ? (item.priority === "high" ? "ضروری" : item.priority === "medium" ? "متوسط" : "کم")
                                      : item.priority}
                                  </span>

                                  {item.isReserved ? (
                                    <span className="text-[8.5px] font-black text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/10">
                                      🔒 {isFa ? "رزرو شده" : "Reserved"}
                                    </span>
                                  ) : (
                                    <span className="text-[8.5px] text-zinc-500 font-bold uppercase">{isFa ? "آزاد" : "Available"}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* MODE 3: CLAIMED/RESERVED VIEW */}
              {viewMode === "claimed" && (
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-zinc-400 uppercase tracking-wider">
                    {isFa ? "کادوهایی که برای دیگران رزرو کرده‌اید" : "Claimed for Friends"}
                  </h3>

                  {localClaimedItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-6 text-center space-y-4">
                      <div className="w-16 h-16 rounded-full border-2 border-zinc-850 flex items-center justify-center text-zinc-500">
                        <Check className="w-8 h-8" />
                      </div>
                      <div className="space-y-1 max-w-sm">
                        <h3 className="text-sm font-black text-white">
                          {isFa ? "هنوز کادویی رزرو نکرده‌اید" : "No wishes claimed yet"}
                        </h3>
                        <p className="text-[10px] text-zinc-500 leading-relaxed">
                          {isFa 
                            ? "به لیست آرزوی دوستان و خانواده سر بزنید و کادوهایی که دوست دارید برایشان بخرید را رزرو کنید." 
                            : "Visit your friends & family lists and claim items you'd like to buy for them."
                          }
                        </p>
                      </div>
                      <button
                        onClick={() => onNavigateToTab?.("friends")}
                        className="mt-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-xs font-bold text-[#10b981] rounded-xl transition-all cursor-pointer"
                      >
                        {isFa ? "🔍 جستجوی لیست دوستان" : "🔍 Browse Friends Lists"}
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {localClaimedItems.map((claimed, idx) => {
                        const item = claimed.item;
                        const productImg = getProductImage(item.title, idx);
                        return (
                          <div 
                            key={item.id}
                            className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800 rounded-3xl overflow-hidden p-4 flex gap-4 hover:border-emerald-500/30 transition-all shadow-md group"
                          >
                            {/* Item Image */}
                            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-850 shrink-0">
                              <img src={productImg} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={item.title} />
                            </div>

                            <div className="flex-1 min-w-0 space-y-1">
                              {/* Friend info badge */}
                              <div className="flex items-center gap-1">
                                <span className="text-[8px] bg-[#10b981]/10 text-[#10b981] font-bold px-2 py-0.5 rounded-full border border-emerald-500/10">
                                  {isFa ? `برای: ${claimed.friendName}` : `For: ${claimed.friendName}`}
                                </span>
                              </div>

                              <h4 className="text-xs font-black text-white truncate group-hover:text-[#10b981] transition-colors">{item.title}</h4>
                              {item.price && (
                                <p className="text-[10px] font-mono font-black text-[#10b981]">
                                  {isFa ? toPersianDigits(item.price.toLocaleString()) + " تومان" : item.price.toLocaleString() + " Tomans"}
                                </p>
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

            {/* PAST LISTS MODAL */}
            {showPastListsModal && (
              <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                <div className="bg-zinc-900 border border-zinc-850 rounded-3xl p-6 w-full max-w-sm space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
                    <h3 className="text-xs font-black text-white flex items-center gap-1.5">
                      <span>⏳</span>
                      <span>{isFa ? "لیست‌های گذشته" : "Past Wishlists"}</span>
                    </h3>
                    <button 
                      onClick={() => setShowPastListsModal(false)} 
                      className="text-zinc-500 hover:text-white p-1.5 bg-zinc-950 rounded-full border border-zinc-850 transition-all cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {pastWishlists.length === 0 ? (
                    <p className="text-[10px] text-zinc-500 text-center py-6">
                      {isFa ? "هیچ لیست قدیمی وجود ندارد" : "No past lists found"}
                    </p>
                  ) : (
                    <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                      {pastWishlists.map((wl, idx) => (
                        <div
                          key={wl.id}
                          onClick={() => {
                            setSelectedListId(wl.id);
                            setShowPastListsModal(false);
                          }}
                          className="bg-zinc-950/50 p-3 rounded-2xl border border-zinc-850 flex items-center gap-3 hover:border-[#10b981]/40 cursor-pointer group transition-all"
                        >
                          <WishlistCollage listIndex={idx + 4} />
                          <div className="min-w-0 flex-1">
                            <h4 className="text-[11px] font-black text-white group-hover:text-[#10b981] truncate">{wl.title}</h4>
                            <p className="text-[9px] text-zinc-500 font-mono">{wl.occasionDate}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

          </motion.div>
        )}
      </AnimatePresence>

      {/* CREATE LIST MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-900 border border-zinc-850 rounded-3xl p-6 w-full max-w-sm space-y-4"
          >
            <div className="flex justify-between items-center pb-1 border-b border-zinc-800">
              <h3 className="text-xs font-black text-white">{isFa ? "مناسبت جدید بسازید" : "New Wishlist Event"}</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-zinc-500 hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateList} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 block uppercase">{isFa ? "نام مناسبت" : "Event Title"}</label>
                <input
                  type="text"
                  required
                  placeholder={isFa ? "مثال: تولد ۲۶ سالگی من" : "e.g., Housewarming party"}
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-[#10b981]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 block uppercase">{isFa ? "تاریخ برگزاری" : "Occasion Date"}</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-[#10b981] font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 block uppercase">{isFa ? "دسته‌بندی" : "Category"}</label>
                <select
                  value={newOccasion}
                  onChange={(e) => setNewOccasion(e.target.value as any)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-zinc-300 outline-none focus:border-[#10b981]"
                >
                  <option value="birthday">{isFa ? "تولد (Birthday)" : "Birthday"}</option>
                  <option value="wedding">{isFa ? "عروسی (Wedding)" : "Wedding"}</option>
                  <option value="yalda">{isFa ? "شب یلدا" : "Yalda Night"}</option>
                  <option value="nowruz">{isFa ? "عید نوروز" : "Nowruz"}</option>
                  <option value="graduation">{isFa ? "فارغ‌التحصیلی" : "Graduation"}</option>
                  <option value="other">{isFa ? "غیره" : "Other"}</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#10b981] text-zinc-950 font-black text-xs rounded-xl shadow-md hover:bg-emerald-400 transition-all cursor-pointer"
              >
                {isFa ? "➕ ساخت لیست جدید" : "➕ Create List"}
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* SHARE INVITATION POPUP */}
      {showShareModal && shareList && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="w-full max-w-[360px] space-y-4"
          >
            {/* Header: Close button with mysterious label */}
            <div className="flex justify-between items-center px-1">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">
                {isFa ? "اشتراک‌گذاری و دعوت‌نامه" : "Share & Invitation"}
              </span>
              <button 
                onClick={() => { setShowShareModal(false); setShareList(null); setShowPostcardShareOptions(false); setPostcardTab("text"); }} 
                className="text-zinc-500 hover:text-white transition-colors p-1.5 bg-zinc-900 rounded-full border border-zinc-800"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* TAB SELECTOR */}
            <div className="grid grid-cols-2 gap-2 bg-zinc-900 p-1 border border-zinc-800 rounded-2xl text-[10px] font-bold">
              <button
                type="button"
                onClick={() => { setPostcardTab("text"); setShowPostcardShareOptions(false); }}
                className={`py-1.5 rounded-xl text-center cursor-pointer transition-all ${
                  postcardTab === "text"
                    ? "bg-zinc-800 text-[#10b981] font-extrabold shadow-sm"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {isFa ? "✉️ کارت پستال" : "✉️ Postcard"}
              </button>
              <button
                type="button"
                onClick={() => setPostcardTab("qr")}
                className={`py-1.5 rounded-xl text-center cursor-pointer transition-all ${
                  postcardTab === "qr"
                    ? "bg-zinc-800 text-[#10b981] font-extrabold shadow-sm"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {isFa ? "📱 بارکد دعوت (QR)" : "📱 Invite QR"}
              </button>
            </div>

            {postcardTab === "text" ? (
              /* THE DIGITAL POSTCARD */
              <div className="bg-zinc-950 border-2 border-zinc-800 rounded-3xl p-5 relative overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.8)] aspect-[1.35] flex flex-col justify-between min-h-[240px]">
                {/* Real-life high-quality festive celebration background photo with subtle dark blend */}
                <img 
                  src="https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=600&auto=format&fit=crop"
                  alt="Celebration Sparkles Background"
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-screen pointer-events-none select-none"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/20 via-zinc-950/40 to-zinc-950 pointer-events-none" />

                {/* Starry ambient background lights */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/5 blur-3xl rounded-full pointer-events-none" />
                
                {!showPostcardShareOptions ? (
                  <>
                    {/* Postcard Top Section */}
                    <div className="flex justify-between items-start z-10">
                      {/* Stamp/Seal on the top left */}
                      <div className="flex flex-col items-start">
                        <span className="text-[9px] text-zinc-500 font-serif italic select-none">
                          Giftino Mail
                        </span>
                        <div className="w-16 h-px bg-gradient-to-r from-zinc-800 to-transparent mt-0.5" />
                      </div>

                      {/* Classic Postage Stamp on the top right (Jagged Edge aesthetic) */}
                      <div className="border border-dashed border-zinc-700/80 p-1.5 rounded bg-zinc-900/50 flex flex-col items-center justify-center w-11 h-13 relative rotate-3 select-none">
                        <div className="absolute inset-0 border border-zinc-800/40 rounded" />
                        <span className="text-base">🔒</span>
                        <span className="text-[7px] text-zinc-500 font-mono mt-0.5 font-bold">SECRET</span>
                      </div>
                    </div>

                    {/* Postcard Body (Minimal, mysterious) */}
                    <div className="text-center my-auto space-y-1 z-10 px-2">
                      <p className="text-[13px] font-serif italic text-zinc-300 select-none">
                        {isFa ? "« یک نفر آرزوهایش را اینجا پنهان کرده... »" : "“Someone has hidden their wishes here...”"}
                      </p>
                      <p className="text-[8px] text-zinc-600 font-mono uppercase tracking-widest select-none">
                        {isFa ? "فقط برای چشمانِ تو" : "For your eyes only"}
                      </p>
                    </div>

                    {/* Postcard Address Lines with Interactive Link Buttons */}
                    <div className="relative pt-1 border-t border-zinc-900/80 z-10">
                      {/* Simulated handwritten address lines */}
                      <div className="space-y-1.5 select-none opacity-20">
                        <div className="border-b border-dashed border-zinc-850 w-full h-3" />
                        <div className="border-b border-dashed border-zinc-850 w-full h-3" />
                      </div>

                      {/* Interactive Button Grid */}
                      <div className="absolute inset-x-0 top-1 flex gap-2">
                        <button
                          onClick={handleCopyInviteText}
                          className="flex-1 bg-zinc-950/90 hover:bg-zinc-950 border border-zinc-800/80 hover:border-emerald-500/30 rounded-2xl p-2.5 flex items-center justify-center gap-1.5 shadow-xl transition-all group cursor-pointer text-[10px]"
                        >
                          <span className="text-xs shrink-0 group-hover:animate-pulse">🔑</span>
                          <span className="text-zinc-400 group-hover:text-white font-black">
                            {copiedInvite ? (isFa ? "کپی شد! ✔️" : "Copied! ✔️") : (isFa ? "کپی راز" : "Copy Secret")}
                          </span>
                        </button>

                        <button
                          onClick={() => setShowPostcardShareOptions(true)}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 rounded-2xl p-2.5 flex items-center justify-center gap-1.5 shadow-xl transition-all group cursor-pointer text-[10px] font-black"
                        >
                          <span className="text-xs shrink-0 group-hover:scale-110 transition-transform">✉️</span>
                          <span>{isFa ? "ارسال راز..." : "Send Secret..."}</span>
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Share View Section */}
                    <div className="flex justify-between items-center z-10 border-b border-zinc-900/60 pb-2">
                      <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">
                        {isFa ? "گیرنده راز" : "Receiver of secret"}
                      </span>
                      <button
                        onClick={() => setShowPostcardShareOptions(false)}
                        className="px-2 py-0.5 text-[8px] font-bold text-zinc-400 hover:text-white bg-zinc-950 border border-zinc-850 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <span>{isFa ? "← برگشت" : "← Back"}</span>
                      </button>
                    </div>

                    {/* Wax Seal Icons for Sharing inside Card */}
                    <div className="text-center my-auto space-y-3 z-10">
                      <div className="grid grid-cols-4 gap-2 px-1">
                        {/* SMS Seal */}
                        <button
                          onClick={() => {
                            const registryLink = `https://giftino.ir/registry/${shareList.id}`;
                            const fullText = isFa 
                              ? `این یک کارت پستالِ راز است... 🔒 آرزوهای من درون این پیوند پنهان شده است:\n🔗 ${registryLink}`
                              : `This is a secret postcard... 🔒 My wishes are hidden inside this link:\n🔗 ${registryLink}`;
                            const url = `sms:?body=${encodeURIComponent(fullText)}`;
                            localStorage.setItem("giftino_shared_invite", "true");
                            setSharedInvite(true);
                            window.open(url, "_blank");
                          }}
                          className="flex flex-col items-center gap-1.5 group cursor-pointer"
                        >
                          <div className="w-11 h-11 rounded-full bg-amber-950/20 border border-amber-500/20 hover:border-amber-500/50 flex items-center justify-center text-amber-400 text-sm shadow-md transition-all group-hover:scale-105 active:scale-95">
                            💬
                          </div>
                          <span className="text-[8px] text-zinc-500 font-bold group-hover:text-zinc-400">
                            {isFa ? "پیامک" : "SMS"}
                          </span>
                        </button>

                        {/* Telegram Seal */}
                        <button
                          onClick={() => {
                            const registryLink = `https://giftino.ir/registry/${shareList.id}`;
                            const text = isFa 
                              ? `این یک کارت پستالِ راز است... 🔒 آرزوهای من درون این پیوند پنهان شده است:`
                              : `This is a secret postcard... 🔒 My wishes are hidden inside this link:`;
                            const url = `https://t.me/share/url?url=${encodeURIComponent(registryLink)}&text=${encodeURIComponent(text)}`;
                            localStorage.setItem("giftino_shared_invite", "true");
                            setSharedInvite(true);
                            window.open(url, "_blank");
                          }}
                          className="flex flex-col items-center gap-1.5 group cursor-pointer"
                        >
                          <div className="w-11 h-11 rounded-full bg-sky-950/20 border border-sky-500/20 hover:border-sky-500/50 flex items-center justify-center text-sky-400 text-sm shadow-md transition-all group-hover:scale-105 active:scale-95">
                            ✈️
                          </div>
                          <span className="text-[8px] text-zinc-500 font-bold group-hover:text-zinc-400">
                            {isFa ? "تلگرام" : "Telegram"}
                          </span>
                        </button>

                        {/* WhatsApp Seal */}
                        <button
                          onClick={() => {
                            const registryLink = `https://giftino.ir/registry/${shareList.id}`;
                            const fullText = isFa 
                              ? `این یک کارت پستالِ راز است... 🔒 آرزوهای من درون این پیوند پنهان شده است:\n🔗 ${registryLink}`
                              : `This is a secret postcard... 🔒 My wishes are hidden inside this link:\n🔗 ${registryLink}`;
                            const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(fullText)}`;
                            localStorage.setItem("giftino_shared_invite", "true");
                            setSharedInvite(true);
                            window.open(url, "_blank");
                          }}
                          className="flex flex-col items-center gap-1.5 group cursor-pointer"
                        >
                          <div className="w-11 h-11 rounded-full bg-emerald-950/20 border border-emerald-500/20 hover:border-emerald-500/50 flex items-center justify-center text-emerald-400 text-sm shadow-md transition-all group-hover:scale-105 active:scale-95">
                            🟢
                          </div>
                          <span className="text-[8px] text-zinc-500 font-bold group-hover:text-zinc-400">
                            {isFa ? "واتساپ" : "WhatsApp"}
                          </span>
                        </button>

                        {/* System Native Share Seal */}
                        <button
                          onClick={handleSystemShare}
                          className="flex flex-col items-center gap-1.5 group cursor-pointer"
                        >
                          <div className="w-11 h-11 rounded-full bg-purple-950/20 border border-purple-500/20 hover:border-purple-500/50 flex items-center justify-center text-purple-400 text-sm shadow-md transition-all group-hover:scale-105 active:scale-95">
                            📤
                          </div>
                          <span className="text-[8px] text-zinc-500 font-bold group-hover:text-zinc-400">
                            {isFa ? "سایر" : "Other"}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Secret signature lock design */}
                    <div className="flex justify-center select-none opacity-20 z-10">
                      <span className="text-[7px] font-mono text-zinc-500 tracking-widest uppercase">
                        - SECURED WITH LOVE -
                      </span>
                    </div>
                  </>
                )}
              </div>
            ) : (
              /* THE QR CODE BARCODE CARD */
              <div className="bg-zinc-950 border-2 border-zinc-800 rounded-3xl p-5 relative overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.8)] flex flex-col justify-between items-center min-h-[250px] space-y-3">
                <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-zinc-950/95 to-zinc-900 pointer-events-none" />

                {/* Stamp/Seal on the top left */}
                <div className="flex justify-between items-center w-full z-10 border-b border-zinc-900 pb-1.5">
                  <span className="text-[9px] text-zinc-500 font-serif italic select-none">
                    Giftino Barcode Card
                  </span>
                  <span className="text-[8px] font-mono text-emerald-400 bg-emerald-950/20 px-2 py-0.5 rounded-full border border-emerald-900/40">
                    SCAN TO CONNECT
                  </span>
                </div>

                <div className="bg-white p-3 rounded-2xl shadow-[0_10px_25px_rgba(16,185,129,0.15)] border-2 border-zinc-950 flex flex-col items-center justify-center relative group z-10">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(`https://giftino.ir/registry/${shareList.id}`)}`}
                    alt="Giftino Registry Barcode"
                    referrerPolicy="no-referrer"
                    className="w-28 h-28 object-contain"
                  />
                </div>

                <div className="text-center space-y-1.5 z-10 w-full px-1">
                  <p className="text-[10px] text-zinc-400 leading-relaxed">
                    {isFa
                      ? "دوستان شما می‌توانند با اسکن این بارکد، فوراً آرزوهای شما را تماشا یا رزرو کنند!"
                      : "Scan with any phone camera to view or claim gifts instantly!"}
                  </p>
                  
                  {/* Download button inside the postcard frame */}
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        setDownloadingProfileQR(true);
                        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(`https://giftino.ir/registry/${shareList.id}`)}`;
                        const response = await fetch(qrUrl);
                        const blob = await response.blob();
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `giftino-${shareList.id}-qr.png`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        window.URL.revokeObjectURL(url);
                      } catch (err) {
                        window.open(`https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(`https://giftino.ir/registry/${shareList.id}`)}`, "_blank");
                      } finally {
                        setDownloadingProfileQR(false);
                      }
                    }}
                    disabled={downloadingProfileQR}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 text-zinc-950 disabled:text-zinc-600 rounded-xl text-[10px] font-black shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {downloadingProfileQR ? (
                      <span>{isFa ? "در حال آماده‌سازی..." : "Preparing..."}</span>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        <span>{isFa ? "دانلود بارکد اختصاصی" : "Download Barcode"}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Secret Suggestion Modal */}
      {showSecretModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl text-right"
          >
            <div className="flex justify-between items-center pb-3 border-b border-zinc-800/80">
              <button
                onClick={() => setShowSecretModal(false)}
                className="text-zinc-500 hover:text-white transition-colors cursor-pointer text-sm font-bold"
              >
                ✕
              </button>
              <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                <span>💡</span>
                <span>{isFa ? "ثبت پیشنهاد کادوی مخفی" : "Suggest a Secret Gift"}</span>
              </h3>
            </div>

            <p className="text-[10px] text-zinc-400 leading-relaxed">
              {isFa
                ? "این پیشنهاد به صورت مخفی ثبت می‌شود. صاحب لیست آن را نخواهد دید تا غافلگیر شود، اما بقیه دوستان برای جلوگیری از خرید تکراری می‌توانند آن را ببینند و رزرو کنند. این کادو به طور خودکار به نام شما رزرو می‌شود."
                : "This suggestion is saved secretly. The list owner won't see it to protect the surprise, but other friends can see and reserve it. It is automatically marked as reserved by you."}
            </p>

            <form onSubmit={handleCreateSecretSuggestion} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-400 block">
                  {isFa ? "عنوان هدیه پیشنهادی (ضروری):" : "Suggested Gift Title (Required):"}
                </label>
                <input
                  type="text"
                  required
                  placeholder={isFa ? "مثلاً: عطر دیور ساواج" : "e.g., Dior Sauvage"}
                  value={secretTitle}
                  onChange={(e) => setSecretTitle(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-2xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-400 block">
                    {isFa ? "قیمت تقریبی (تومان - اختیاری):" : "Estimated Price (Optional):"}
                  </label>
                  <input
                    type="text"
                    placeholder={isFa ? "مثلاً: ۳,۵۰۰,۰۰۰" : "e.g., 3,500,000"}
                    value={secretPrice}
                    onChange={(e) => setSecretPrice(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-850 rounded-2xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400 transition-colors font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-400 block">
                    {isFa ? "اولویت هدیه:" : "Priority:"}
                  </label>
                  <select
                    value={secretPriority}
                    onChange={(e) => setSecretPriority(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-850 rounded-2xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400 transition-colors"
                  >
                    <option value="high">{isFa ? "ضروری (بالا)" : "High"}</option>
                    <option value="medium">{isFa ? "معمولی (متوسط)" : "Medium"}</option>
                    <option value="low">{isFa ? "تفریحی (کم)" : "Low"}</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-400 block">
                  {isFa ? "لینک خرید آنلاین (اختیاری):" : "Purchase Link (Optional):"}
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={secretLink}
                  onChange={(e) => setSecretLink(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-2xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400 transition-colors text-left font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-400 block">
                  {isFa ? "یادداشت یا توضیحات اضافه:" : "Notes / Descriptions:"}
                </label>
                <textarea
                  placeholder={isFa ? "مثلاً: سایز مدیوم یا رنگ مشکی" : "e.g., Size M, black color"}
                  value={secretNotes}
                  onChange={(e) => setSecretNotes(e.target.value)}
                  rows={2}
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-2xl p-3 text-xs text-zinc-300 focus:outline-none focus:border-amber-400 transition-colors resize-none leading-relaxed"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black text-xs rounded-2xl transition-all cursor-pointer shadow-lg shadow-amber-400/10"
                >
                  {isFa ? "ثبت پیشنهاد و رزرو خودکار" : "Add Secret Gift & Reserve"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowSecretModal(false)}
                  className="px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs rounded-2xl transition-all cursor-pointer"
                >
                  {isFa ? "انصراف" : "Cancel"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      <PriceSearchModal
        isOpen={priceSearchOpen}
        onClose={() => setPriceSearchOpen(false)}
        initialQuery={priceSearchQuery}
        targetPrice={priceSearchTargetPrice}
        language={language}
      />

      <AdvisorPortalModal
        isOpen={showAdvisorModal}
        onClose={() => setShowAdvisorModal(false)}
        user={user}
        onUpdateUser={setUser}
        language={language}
        onCreateCuratedGuide={(title, category) => {
          // create a new curated wishlist
          const newWl: Wishlist = {
            id: "wl_curated_" + Date.now(),
            title: `⭐ ${title}`,
            occasionDate: new Date().toISOString().split("T")[0],
            occasionType: "other",
            items: [],
          };
          onUpdateWishlists([newWl, ...wishlists]);
          setShowAdvisorModal(false);
        }}
      />

    </div>
  );
}
