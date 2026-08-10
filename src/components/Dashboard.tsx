import React, { useState } from "react";
import { Wishlist, WishlistItem, Language, UserProfile } from "../types";
import { 
  Gift, Plus, Trash2, Calendar, Link2, ExternalLink, ShieldAlert,
  Share2, Check, Sparkles, LogOut, Eye, EyeOff, CheckCircle2, Lock, Landmark,
  MessageSquare, Copy, PartyPopper, CheckSquare, ListCollapse, HelpCircle, Heart,
  MapPin, Clock, Store, ChevronRight, X, Download
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toPersianDigits, formatTomanToWords } from "../utils";

interface DashboardProps {
  user: UserProfile;
  onLogout: () => void;
  language: Language;
  wishlists: Wishlist[];
  onUpdateWishlists: (updated: Wishlist[]) => void;
}

// Pre-seeded Partner stores list with their Iranian color palettes
const PARTNER_STORES = [
  {
    id: "digikala",
    nameFa: "دیجی‌کالا",
    nameEn: "Digikala",
    url: "https://www.digikala.com",
    shortLogo: "DK",
    colorClass: "bg-red-500/10 text-red-500 border-red-500/20",
    descFa: "بزرگترین فروشگاه آنلاین ایران با بیش از ۴ میلیون تنوع کالا",
    descEn: "Iran's largest marketplace with over 4 million products",
    tagFa: "ارسال سریع",
    tagEn: "Fast delivery",
  },
  {
    id: "technolife",
    nameFa: "تکنولایف",
    nameEn: "Technolife",
    url: "https://www.technolife.ir",
    shortLogo: "TL",
    colorClass: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    descFa: "تخصصی‌ترین مرجع خرید آنلاین گوشی موبایل و لوازم دیجیتال",
    descEn: "Premier store for mobile phones and digital gadgets",
    tagFa: "کد تخفیف",
    tagEn: "Discount code",
  }
];

export default function Dashboard({ user, onLogout, language, wishlists, onUpdateWishlists }: DashboardProps) {
  const [activeWishlistId, setActiveWishlistId] = useState<string | null>(
    wishlists.length > 0 ? wishlists[0].id : null
  );

  // Time filters: all, upcoming, past
  const [timeFilter, setTimeFilter] = useState<"all" | "upcoming" | "past">("all");

  // Simulation mode: Owner vs Friend Guest view
  const [isFriendView, setIsFriendView] = useState(false);
  const [friendName, setFriendName] = useState("");
  const [isFriendNameEntered, setIsFriendNameEntered] = useState(false);

  // New Wishlist Fields
  const [showNewListModal, setShowNewListModal] = useState(false);
  const [newListTitle, setNewListTitle] = useState("");
  const [newListDate, setNewListDate] = useState("");
  const [newListOccasion, setNewListOccasion] = useState<Wishlist["occasionType"]>("birthday");

  // New Item Fields
  const [newItemTitle, setNewItemTitle] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [newItemLink, setNewItemLink] = useState("");
  const [newItemNotes, setNewItemNotes] = useState("");
  const [newItemPriority, setNewItemPriority] = useState<WishlistItem["priority"]>("medium");

  // Share Modal & Invitation Composer state
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedShareList, setSelectedShareList] = useState<Wishlist | null>(null);
  const [activeShareTemplate, setActiveShareTemplate] = useState<"friendly" | "elegant" | "simple">("friendly");
  const [includeEventDetails, setIncludeEventDetails] = useState(false);
  const [eventTime, setEventTime] = useState("");
  const [eventAddress, setEventAddress] = useState("");
  const [eventLocationUrl, setEventLocationUrl] = useState("");
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [shareTab, setShareTab] = useState<"text" | "qr">("text");
  const [qrDownloading, setQrDownloading] = useState(false);

  const isFa = language === "fa";

  // Filter wishlists based on date logic or mock upcoming/past
  const filteredWishlists = wishlists.filter((wl) => {
    if (timeFilter === "all") return true;
    if (timeFilter === "upcoming") {
      return wl.id !== "wl_yalda"; // Mock future lists
    }
    return wl.id === "wl_yalda"; // Mock past list
  });

  const activeWishlist = wishlists.find((w) => w.id === (activeWishlistId || (wishlists.length > 0 ? wishlists[0].id : null)));

  // Math stats helper for active list
  const totalItems = activeWishlist?.items.length || 0;
  const reservedItems = activeWishlist?.items.filter((i) => i.isReserved).length || 0;
  const reservedPercent = totalItems > 0 ? Math.round((reservedItems / totalItems) * 100) : 0;
  const totalPrice = activeWishlist?.items.reduce((sum, item) => sum + (item.price || 0), 0) || 0;
  const highPriorityCount = activeWishlist?.items.filter((i) => i.priority === "high").length || 0;

  // Handler: Add new wishlist
  const handleAddNewList = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListTitle.trim()) return;

    const newList: Wishlist = {
      id: "wl_" + Date.now(),
      title: newListTitle,
      occasionDate: newListDate || new Date().toISOString().split("T")[0],
      occasionType: newListOccasion,
      items: [],
    };

    onUpdateWishlists([newList, ...wishlists]);
    setActiveWishlistId(newList.id);
    setNewListTitle("");
    setNewListDate("");
    setNewListOccasion("birthday");
    setShowNewListModal(false);
  };

  // Handler: Delete wishlist
  const handleDeleteWishlist = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(isFa ? "آیا از حذف این لیست آرزو مطمئن هستید؟" : "Are you sure you want to delete this wishlist?")) {
      const updated = wishlists.filter((wl) => wl.id !== id);
      onUpdateWishlists(updated);
      if (activeWishlistId === id && updated.length > 0) {
        setActiveWishlistId(updated[0].id);
      }
    }
  };

  // Handler: Add new item to currently active wishlist
  const handleAddNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWishlist || !newItemTitle.trim()) return;

    const newItem: WishlistItem = {
      id: "item_" + Date.now(),
      title: newItemTitle,
      price: newItemPrice ? parseInt(newItemPrice) : undefined,
      link: newItemLink || undefined,
      notes: newItemNotes || undefined,
      priority: newItemPriority,
      isReserved: false,
    };

    const updated = wishlists.map((wl) => {
      if (wl.id === activeWishlist.id) {
        return {
          ...wl,
          items: [newItem, ...wl.items],
        };
      }
      return wl;
    });

    onUpdateWishlists(updated);
    
    // Reset form
    setNewItemTitle("");
    setNewItemPrice("");
    setNewItemLink("");
    setNewItemNotes("");
    setNewItemPriority("medium");
  };

  // Handler: Delete item from currently active wishlist
  const handleDeleteItem = (itemId: string) => {
    if (!activeWishlist) return;
    const updated = wishlists.map((wl) => {
      if (wl.id === activeWishlist.id) {
        return {
          ...wl,
          items: wl.items.filter((item) => item.id !== itemId),
        };
      }
      return wl;
    });
    onUpdateWishlists(updated);
  };

  // Handler: Friend claim reservation toggle
  const handleReserveItem = (itemId: string) => {
    if (!activeWishlist) return;
    const nameToUse = friendName.trim() || (isFa ? "مهمان صمیمی" : "Special Guest");

    const updated = wishlists.map((wl) => {
      if (wl.id === activeWishlist.id) {
        return {
          ...wl,
          items: wl.items.map((item) => {
            if (item.id === itemId) {
              return {
                ...item,
                isReserved: true,
                reservedBy: nameToUse,
              };
            }
            return item;
          }),
        };
      }
      return wl;
    });

    onUpdateWishlists(updated);
  };

  // Handler: Friend un-reserve toggle
  const handleUnreserveItem = (itemId: string) => {
    if (!activeWishlist) return;
    const updated = wishlists.map((wl) => {
      if (wl.id === activeWishlist.id) {
        return {
          ...wl,
          items: wl.items.map((item) => {
            if (item.id === itemId) {
              return {
                ...item,
                isReserved: false,
                reservedBy: undefined,
              };
            }
            return item;
          }),
        };
      }
      return wl;
    });
    onUpdateWishlists(updated);
  };

  // Compose shareable text and copy it
  const handleCopyShareLink = (wishlistId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const wl = wishlists.find((w) => w.id === wishlistId);
    if (!wl) return;

    setSelectedShareList(wl);
    setShowShareModal(true);
    setShareTab("text"); // Reset tab
  };

  const handleDownloadQR = async (wishlistId: string) => {
    try {
      setQrDownloading(true);
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(`https://giftino.ir/registry/${wishlistId}`)}`;
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `giftino-registry-${wishlistId}-qr.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      window.open(`https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(`https://giftino.ir/registry/${wishlistId}`)}`, "_blank");
    } finally {
      setQrDownloading(false);
    }
  };

  const copyComposedText = () => {
    if (!selectedShareList) return;

    let text = "";
    if (activeShareTemplate === "friendly") {
      text = isFa
        ? `سلام دوستان عزیز! ❤️\nمن برای مناسبت پیش‌رو [${selectedShareList.title}] یک لیست آرزوی اختصاصی در پلتفرم گیفتینو ساختم تا اگر دوست داشتین کادو بگیرین، چیزی باشه که بهش واقعاً احتیاج دارم و جلو کادوهای تکراری گرفته بشه 🎁✨\n\nلیست من رو از این لینک ببینید و هر کدوم رو که خواستین رزرو کنین:\n🔗 https://giftino.ir/registry/${selectedShareList.id}`
        : `Hi friends! ❤️\nI've created a custom wishlist for [${selectedShareList.title}] on Giftino so you can easily see what I actually need! ✨\n\nCheck it out and claim gifts here:\n🔗 https://giftino.ir/registry/${selectedShareList.id}`;
    } else if (activeShareTemplate === "elegant") {
      text = isFa
        ? `بزرگواران و یاران گرامی،\nبه مناسبت فرارسیدن [${selectedShareList.title}]، مفتخرم تا لیست هدایای مدنظر خود را که به صورت اختصاصی در سامانه گیفتینو ثبت گردیده، با شما به اشتراک بگذارم. مایه سرافرازی است اگر کادوهای پیشنهادی را بررسی و در صورت تمایل رزرو بفرمایید 🌸💫\n\nپیوند اختصاصی لیست:\n🔗 https://giftino.ir/registry/${selectedShareList.id}`
        : `Dear friends & family,\nOn the occasion of [${selectedShareList.title}], I am pleased to share my registry on Giftino. Your warm presence is the greatest gift, but if you wish to surprise me with a gesture, please view the link:\n🔗 https://giftino.ir/registry/${selectedShareList.id}`;
    } else {
      text = isFa
        ? `لیست کادوهای من برای [${selectedShareList.title}]:\n🔗 https://giftino.ir/registry/${selectedShareList.id}\nکد تخفیف Digikala همکار پلتفرم: GIFTINO`
        : `My wishlist for [${selectedShareList.title}]:\n🔗 https://giftino.ir/registry/${selectedShareList.id}\nPromo coupon code: GIFTINO`;
    }

    if (includeEventDetails) {
      text += isFa
        ? `\n\n📍 جزئیات مهمانی:\n- ساعت: ${eventTime || "ساعت مراسم"}\n- آدرس: ${eventAddress || "محل برگزاری"}\n- موقعیت نقشه: ${eventLocationUrl || "لینک لوکیشن"}`
        : `\n\n📍 Event Logistics:\n- Time: ${eventTime || "Event Time"}\n- Venue: ${eventAddress || "Venue Location"}\n- Location Link: ${eventLocationUrl || "Map URL"}`;
    }

    navigator.clipboard.writeText(text);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      
      {/* LEFT SUB-PANEL (4 cols on desktop) */}
      <div className="lg:col-span-4 space-y-6">
        
        {/* Wishlists Sidebar card selection */}
        <div id="tour-wishlists" className="bg-zinc-900/60 border border-zinc-900 p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-zinc-400 uppercase tracking-wider">
              {isFa ? "جشن‌ها و مناسبت‌ها" : "Events & Lists"}
            </h3>
            <button
              onClick={() => setShowNewListModal(true)}
              className="inline-flex items-center gap-1 bg-[#10b981] hover:bg-emerald-400 text-zinc-950 px-2.5 py-1 rounded-xl text-[10px] font-black transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isFa ? "جدید" : "New List"}</span>
            </button>
          </div>

          {/* Time Filter Tabs */}
          <div className="flex bg-zinc-950 p-1 rounded-xl text-[10px] font-bold border border-zinc-900">
            {(["all", "upcoming", "past"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setTimeFilter(filter)}
                className={`flex-1 py-1.5 rounded-lg text-center transition-all cursor-pointer text-[9px] ${
                  timeFilter === filter
                    ? "bg-zinc-900 text-[#10b981] shadow-sm font-extrabold"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {filter === "all" ? (isFa ? "همه مناسبت‌ها" : "All") : filter === "upcoming" ? (isFa ? "آینده" : "Upcoming") : (isFa ? "گذشته" : "Past")}
              </button>
            ))}
          </div>

          {/* Seeded wishlists list */}
          <div className="space-y-2">
            {filteredWishlists.length === 0 ? (
              <div className="text-center py-10 bg-zinc-950/20 rounded-2xl border border-dashed border-zinc-900">
                <Gift className="w-6 h-6 text-zinc-700 mx-auto mb-2" />
                <p className="text-[10px] text-zinc-500">
                  {isFa ? "جشن یا لیستی یافت نشد" : "No wishlists found"}
                </p>
              </div>
            ) : (
              filteredWishlists.map((wl) => {
                const isActive = activeWishlist?.id === wl.id;
                const reservedCount = wl.items.filter((i) => i.isReserved).length;

                return (
                  <div
                    key={wl.id}
                    onClick={() => {
                      setActiveWishlistId(wl.id);
                    }}
                    className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 relative group flex items-center justify-between ${
                      isActive 
                        ? "bg-zinc-900 border-[#10b981] shadow-sm text-white" 
                        : "bg-zinc-900/20 border-zinc-900 hover:bg-zinc-900/60 hover:border-zinc-800"
                    }`}
                  >
                    <div className="space-y-1 min-w-0 pr-2">
                      <h4 className="text-xs font-extrabold text-white truncate">
                        {wl.title}
                      </h4>
                      <div className="flex items-center gap-1.5 text-[9px] text-zinc-500 font-mono">
                        <Calendar className="w-3 h-3" />
                        <span>{wl.occasionDate}</span>
                        <span>•</span>
                        <span>{wl.items.length} {isFa ? "کادو" : "items"}</span>
                      </div>
                      
                      {reservedCount > 0 && (
                        <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#10b981]/10 text-[9px] font-bold text-[#10b981] border border-emerald-500/10 mt-1">
                          <Lock className="w-2.5 h-2.5" />
                          <span>
                            {reservedCount} {isFa ? "رزرو شده" : "Claimed"}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Quick list actions */}
                    <div className="flex items-center gap-1 opacity-80 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        onClick={(e) => handleCopyShareLink(wl.id, e)}
                        className="p-1.5 hover:bg-zinc-800 text-zinc-500 hover:text-white rounded-lg transition-colors"
                        title={isFa ? "ارسال دعوت‌نامه" : "Share invite"}
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteWishlist(wl.id, e)}
                        className="p-1.5 hover:bg-rose-500/10 text-zinc-500 hover:text-rose-400 rounded-lg transition-colors"
                        title={isFa ? "حذف لیست" : "Delete list"}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Affiliate Quick Stores Card */}
        <div className="bg-zinc-900/60 border border-zinc-900 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#10b981]/10 rounded-lg">
              <Store className="w-4 h-4 text-[#10b981]" />
            </div>
            <div>
              <h4 className="text-xs font-black text-white">
                {isFa ? "همکاران فروشگاهی گیفتی‌نو 🛒" : "Platform Partner Stores 🛒"}
              </h4>
              <p className="text-[9px] text-zinc-500 font-medium">
                {isFa ? "خرید مستقیم کادو با تخفیف اختصاصی" : "Affiliate purchase coupons integrated"}
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            {PARTNER_STORES.map((store) => (
              <a
                key={store.id}
                href={store.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 rounded-xl border border-zinc-900 hover:border-zinc-800 bg-zinc-950/40 hover:bg-zinc-900/40 transition-all duration-200 group"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[10px] shadow-sm shrink-0 ${store.colorClass}`}>
                      {store.shortLogo}
                    </div>
                    <div className="min-w-0">
                      <h5 className="text-[11px] font-extrabold text-white flex items-center gap-1.5 flex-wrap">
                        <span>{isFa ? store.nameFa : store.nameEn}</span>
                        <span className="text-[8px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 font-bold border border-amber-500/10">
                          {isFa ? store.tagFa : store.tagEn}
                        </span>
                      </h5>
                      <p className="text-[9px] text-zinc-500 truncate mt-0.5">
                        {isFa ? store.descFa : store.descEn}
                      </p>
                    </div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-zinc-600 group-hover:text-[#10b981] transition-colors shrink-0" />
                </div>
              </a>
            ))}
          </div>

          {/* Coupon discount promotion info */}
          <div className="bg-[#10b981]/5 rounded-xl p-3 border border-emerald-500/10 text-center space-y-1">
            <p className="text-[10px] text-[#10b981] font-extrabold">
              {isFa ? "🎁 کد تخفیف انحصاری: GIFTINO" : "🎁 Coupon Code: GIFTINO"}
            </p>
            <p className="text-[8.5px] text-zinc-500 leading-relaxed">
              {isFa 
                ? "مهمان‌ها با ثبت کد تخفیف خرید خود، مضاف بر دریافت تخفیف، به تأمین مالی سرورهای گیفتی‌نو کمک می‌کنند." 
                : "Enter this code during checkout for direct platform discounts on partners."}
            </p>
          </div>
        </div>

      </div>

      {/* RIGHT MAIN PANEL (8 cols on desktop) */}
      <div className="lg:col-span-8 space-y-6">
        {activeWishlist ? (
          <div className="space-y-6">
            
            {/* Active Wishlist Header */}
            <div className="bg-zinc-900/60 border border-zinc-900 rounded-2xl p-6 relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-[#10b981]/10 text-[#10b981] uppercase tracking-wider border border-emerald-500/20 font-mono">
                      {activeWishlist.occasionType}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">#{activeWishlist.id}</span>
                  </div>
                  <h2 className="text-lg font-black text-white">{activeWishlist.title}</h2>
                  <p className="text-xs text-zinc-400 font-mono flex items-center gap-1.5 mt-0.5">
                    <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                    <span>{isFa ? "برگزاری:" : "Date:"} {activeWishlist.occasionDate}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {/* Share button */}
                  <button
                    id="tour-share-btn"
                    onClick={(e) => handleCopyShareLink(activeWishlist.id, e)}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5 text-[#10b981]" />
                    <span>{isFa ? "کپی و اشتراک‌گذاری" : "Copy Invite"}</span>
                  </button>
                </div>
              </div>

              {/* Dynamic stats grid row */}
              {totalItems > 0 && (
                <div className="mt-6 pt-5 border-t border-zinc-900 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-900">
                    <span className="text-[9px] text-zinc-500 font-bold block uppercase tracking-wider">{isFa ? "کل آرزوها" : "Total Wishes"}</span>
                    <span className="text-sm font-black text-white font-mono">
                      {isFa ? toPersianDigits(totalItems) : totalItems}
                    </span>
                  </div>

                  <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-900">
                    <span className="text-[9px] text-zinc-500 font-bold block uppercase tracking-wider">{isFa ? "رزرو شده" : "Reserved"}</span>
                    <span className="text-sm font-black text-[#10b981] font-mono flex items-center gap-1">
                      {isFa ? toPersianDigits(reservedItems) : reservedItems}
                      <span className="text-[9px] text-zinc-500">({isFa ? toPersianDigits(reservedPercent) : reservedPercent}%)</span>
                    </span>
                  </div>

                  <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-900">
                    <span className="text-[9px] text-zinc-500 font-bold block uppercase tracking-wider">{isFa ? "ارزش تقریبی" : "Est. Value"}</span>
                    <span className="text-[11px] font-black text-[#10b981] truncate block">
                      {totalPrice > 0 
                        ? (isFa ? toPersianDigits(totalPrice.toLocaleString()) + " ت" : totalPrice.toLocaleString() + " T")
                        : (isFa ? "رایگان" : "Unset")}
                    </span>
                  </div>

                  <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-900">
                    <span className="text-[9px] text-zinc-500 font-bold block uppercase tracking-wider">{isFa ? "اولویت بالا" : "High Priority"}</span>
                    <span className="text-sm font-black text-rose-400 font-mono">
                      {isFa ? toPersianDigits(highPriorityCount) : highPriorityCount}
                    </span>
                  </div>
                </div>
              )}

              {/* Progress bar */}
              {totalItems > 0 && (
                <div className="mt-4 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] text-zinc-500 font-bold">
                    <span>{isFa ? "درصد رزرو هدیه‌ها" : "Completion Progress"}</span>
                    <span className="font-mono text-[#10b981]">{isFa ? toPersianDigits(reservedPercent) : reservedPercent}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-950 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#10b981] transition-all duration-500 rounded-full" 
                      style={{ width: `${reservedPercent}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* RENDERING LIST ITEMS ACCORDING TO VIEW MODE */}
            <div className="space-y-4">
              <h3 className="text-xs font-black text-zinc-400 uppercase tracking-wider">
                {isFa ? "اقلام ثبت شده در لیست" : "Registry Items"}
              </h3>

              {totalItems === 0 && (
                <div className="bg-zinc-900/10 border border-dashed border-zinc-900 rounded-2xl py-12 text-center">
                  <Gift className="w-8 h-8 text-zinc-800 mx-auto mb-3" />
                  <p className="text-xs text-zinc-500">
                    {isFa ? "آرزویی در این لیست ثبت نشده است. همین حالا اولین را اضافه کنید!" : "This wishlist is empty! Fill it up."}
                  </p>
                </div>
              )}

              {/* OWNER VIEW: ADD NEW ITEM CARD */}
              {!isFriendView && (
                <div className="bg-zinc-900/40 border border-zinc-900 rounded-2xl p-5 space-y-4">
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-[#10b981]" />
                    <span>{isFa ? "افزودن آرزوی سریع" : "Quick Add Wish Desire"}</span>
                  </h4>

                  <form onSubmit={handleAddNewItem} className="grid grid-cols-1 md:grid-cols-12 gap-3">
                    <div className="md:col-span-5">
                      <input
                        type="text"
                        required
                        placeholder={isFa ? "عنوان آرزو... (مثال: ادکلن لالیک)" : "Wish item title... (e.g., Perfume)"}
                        value={newItemTitle}
                        onChange={(e) => setNewItemTitle(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#10b981]"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <input
                        type="number"
                        placeholder={isFa ? "قیمت (تومان)" : "Price (T)"}
                        value={newItemPrice}
                        onChange={(e) => setNewItemPrice(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#10b981] font-mono"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <select
                        value={newItemPriority}
                        onChange={(e) => setNewItemPriority(e.target.value as any)}
                        className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-2 py-2 text-xs text-zinc-300 outline-none focus:border-[#10b981]"
                      >
                        <option value="high">{isFa ? "فوری" : "High"}</option>
                        <option value="medium">{isFa ? "متوسط" : "Medium"}</option>
                        <option value="low">{isFa ? "کم" : "Low"}</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <button
                        type="submit"
                        className="w-full py-2 bg-[#10b981] hover:bg-emerald-400 text-zinc-950 font-black text-xs rounded-xl cursor-pointer"
                      >
                        {isFa ? "افزودن" : "Add"}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* THE ITEMS LIST GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeWishlist.items.map((item) => {
                  return (
                    <div
                      key={item.id}
                      className={`p-5 rounded-2xl border transition-all flex flex-col justify-between relative ${
                        item.isReserved 
                          ? isFriendView 
                            ? "bg-zinc-900/30 border-zinc-900 opacity-60" 
                            : "bg-emerald-500/5 border-[#10b981]/60"
                          : "bg-zinc-900/50 border-zinc-900 hover:border-zinc-850"
                      }`}
                    >
                      {/* Priority Tag floating */}
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="text-xs font-black text-white leading-relaxed">{item.title}</h4>
                        <span className={`text-[8.5px] font-extrabold uppercase px-2 py-0.5 rounded shrink-0 ${
                          item.priority === "high" 
                            ? "bg-rose-500/15 text-rose-400 border border-rose-500/10" 
                            : item.priority === "medium" 
                              ? "bg-amber-500/15 text-amber-400 border border-amber-500/10" 
                              : "bg-blue-500/15 text-blue-400 border border-blue-500/10"
                        }`}>
                          {isFa 
                            ? (item.priority === "high" ? "اولویت بالا" : item.priority === "medium" ? "اولویت متوسط" : "اولویت کم")
                            : item.priority}
                        </span>
                      </div>

                      <div className="space-y-1.5 mt-2">
                        {item.price && (
                          <p className="text-xs font-mono text-[#10b981] font-bold">
                            {isFa ? toPersianDigits(item.price.toLocaleString()) + " " + "تومان" : item.price.toLocaleString() + " Toman"}
                          </p>
                        )}
                        {item.notes && (
                          <p className="text-[10px] text-zinc-400 bg-zinc-950/40 p-2.5 rounded-xl border border-zinc-900/60 leading-relaxed">
                            {item.notes}
                          </p>
                        )}
                      </div>

                      {/* BOTTOM OPERATIONS: Owner vs Guest */}
                      <div className="pt-4 mt-4 border-t border-zinc-900 flex flex-wrap items-center justify-between gap-3">
                        
                        {/* Direct Shop Link */}
                        {item.link ? (
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] font-bold text-[#10b981] hover:underline flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>{isFa ? "مشاهده لینک خرید" : "View Shop"}</span>
                          </a>
                        ) : (
                          <span className="text-[9px] text-zinc-500">{isFa ? "فاقد لینک مستقیم" : "No link"}</span>
                        )}

                        {/* Owner Controls (Can delete and see who reserved!) */}
                        {!isFriendView ? (
                          <div className="flex items-center gap-2">
                            {item.isReserved ? (
                              <span className="text-[9.5px] font-bold text-[#10b981] bg-[#10b981]/10 px-2 py-1 rounded border border-emerald-500/10">
                                ✔️ {isFa ? `رزرو شده توسط ${item.reservedBy}` : `Reserved by ${item.reservedBy}`}
                              </span>
                            ) : (
                              <span className="text-[9px] text-zinc-500 font-medium">{isFa ? "در انتظار کادو دادن" : "Available"}</span>
                            )}
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="p-1.5 hover:bg-rose-500/10 text-zinc-500 hover:text-rose-400 rounded-lg transition-colors"
                              title={isFa ? "حذف کادو" : "Remove"}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          /* Friend Guest Controls */
                          <div>
                            {item.isReserved ? (
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-zinc-500 font-bold">🔒 {isFa ? "رزرو شد" : "Claimed"}</span>
                                <button
                                  onClick={() => handleUnreserveItem(item.id)}
                                  className="text-[9px] text-rose-400 hover:underline cursor-pointer"
                                >
                                  {isFa ? "لغو رزرو" : "Cancel"}
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  if (!friendName.trim()) {
                                    setIsFriendNameEntered(false);
                                    alert(isFa ? "لطفاً ابتدا نام مهمان را در کادر بالای کادوها وارد کنید." : "Please type your name above first.");
                                    return;
                                  }
                                  handleReserveItem(item.id);
                                }}
                                className="px-3.5 py-1 bg-[#10b981] text-zinc-950 hover:bg-emerald-400 rounded-xl text-[10px] font-black transition-all cursor-pointer"
                              >
                                {isFa ? "🎁 رزرو کردن کادو" : "🎁 Claim Gift"}
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Partner search tools for fast shopping */}
                      <div className="mt-3 pt-2.5 border-t border-zinc-900/30 flex items-center gap-2 flex-wrap">
                        <span className="text-[8px] text-zinc-500">{isFa ? "🛒 سرچ سریع همکاران:" : "🛒 Quick search:"}</span>
                        <div className="flex gap-1.5">
                          <a
                            href={`https://www.digikala.com/search/?q=${encodeURIComponent(item.title)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[8px] px-2 py-0.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded border border-red-500/10"
                          >
                            Digikala
                          </a>
                          <a
                            href={`https://technolife.ir/product/list?search=${encodeURIComponent(item.title)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[8px] px-2 py-0.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded border border-blue-500/10"
                          >
                            Technolife
                          </a>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        ) : (
          <div className="text-center py-20 bg-zinc-900/20 border border-zinc-900 rounded-2xl">
            <Gift className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
            <h3 className="text-base font-extrabold text-white">{isFa ? "هیچ لیست آرزویی وجود ندارد" : "No Active Wishlist"}</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">
              {isFa ? "برای شروع اولین لیست را بسازید." : "Please click on the add button to form a customized registry."}
            </p>
          </div>
        )}
      </div>

      {/* ======================================= */}
      {/* MODAL: CREATE WISHLIST                  */}
      {/* ======================================= */}
      {showNewListModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-full max-w-md space-y-5"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-white">{isFa ? "ایجاد لیست مناسبت جدید" : "Create New Wishlist"}</h3>
              <button onClick={() => setShowNewListModal(false)} className="text-zinc-500 hover:text-white p-1 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddNewList} className="space-y-4">
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 block uppercase">{isFa ? "عنوان لیست" : "List Title"}</label>
                <input
                  type="text"
                  required
                  placeholder={isFa ? "مثال: تولد ۲۶ سالگی من" : "e.g., My Graduation Celebration"}
                  value={newListTitle}
                  onChange={(e) => setNewListTitle(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-[#10b981]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 block uppercase">{isFa ? "تاریخ برگزاری مناسبت" : "Occasion Date"}</label>
                <input
                  type="date"
                  value={newListDate}
                  onChange={(e) => setNewListDate(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-[#10b981] font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 block uppercase">{isFa ? "نوع مناسبت" : "Occasion Type"}</label>
                <select
                  value={newListOccasion}
                  onChange={(e) => setNewListOccasion(e.target.value as any)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-[#10b981]"
                >
                  <option value="birthday">{isFa ? "تولد (Birthday)" : "Birthday"}</option>
                  <option value="wedding">{isFa ? "عروسی (Wedding)" : "Wedding"}</option>
                  <option value="yalda">{isFa ? "شب یلدا (Yalda)" : "Yalda"}</option>
                  <option value="norouz">{isFa ? "عید نوروز (Norouz)" : "Norouz"}</option>
                  <option value="graduation">{isFa ? "فارغ‌التحصیلی (Graduation)" : "Graduation"}</option>
                  <option value="other">{isFa ? "سایر جشن‌ها (Other)" : "Other"}</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#10b981] text-zinc-950 hover:bg-emerald-400 font-extrabold text-xs rounded-xl shadow transition-all"
              >
                {isFa ? "✔️ ایجاد لیست جدید" : "✔️ Create List"}
              </button>

            </form>
          </motion.div>
        </div>
      )}

      {/* ======================================= */}
      {/* MODAL: SHARE INVITATION COMPOSE        */}
      {/* ======================================= */}
      {showShareModal && selectedShareList && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-full max-w-lg space-y-5"
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-sm font-black text-white">{isFa ? "اشتراک‌گذاری و دعوت‌نامه لیست" : "Share Wishlist & Invitation"}</h3>
              <button onClick={() => setShowShareModal(false)} className="text-zinc-500 hover:text-white p-1 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* TAB SELECTOR */}
            <div className="grid grid-cols-2 gap-2 bg-zinc-950 p-1 border border-zinc-850 rounded-2xl text-[10px] font-bold">
              <button
                type="button"
                onClick={() => setShareTab("text")}
                className={`py-2 rounded-xl text-center cursor-pointer transition-all ${
                  shareTab === "text"
                    ? "bg-zinc-900 text-[#10b981] font-extrabold shadow-sm"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {isFa ? "📋 متن دعوت‌نامه" : "📋 Invitation Text"}
              </button>
              <button
                type="button"
                onClick={() => setShareTab("qr")}
                className={`py-2 rounded-xl text-center cursor-pointer transition-all ${
                  shareTab === "qr"
                    ? "bg-zinc-900 text-[#10b981] font-extrabold shadow-sm"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {isFa ? "📱 بارکد اختصاصی (QR)" : "📱 Personal QR Code"}
              </button>
            </div>

            {shareTab === "text" ? (
              <>
                {/* Template choices */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">{isFa ? "انتخاب لحن پیام" : "Message Tone"}</label>
                  <div className="grid grid-cols-3 gap-2 bg-zinc-950 p-1 border border-zinc-800 rounded-xl text-[9px] font-bold">
                    {[
                      { id: "friendly", label: isFa ? "دوستانه" : "Friendly" },
                      { id: "elegant", label: isFa ? "مجلسی/رسمی" : "Elegant" },
                      { id: "simple", label: isFa ? "ساده/کوتاه" : "Simple" }
                    ].map((tpl) => (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => setActiveShareTemplate(tpl.id as any)}
                        className={`py-1.5 rounded-lg text-center cursor-pointer transition-all ${
                          activeShareTemplate === tpl.id
                            ? "bg-zinc-900 text-[#10b981] font-extrabold"
                            : "text-zinc-500 hover:text-zinc-300"
                        }`}
                      >
                        {tpl.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Event Logistics Switch */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase">{isFa ? "درج مشخصات زمان و مکان مهمانی" : "Include Venue Logistics"}</span>
                    <input
                      type="checkbox"
                      checked={includeEventDetails}
                      onChange={(e) => setIncludeEventDetails(e.target.checked)}
                      className="w-4 h-4 accent-[#10b981]"
                    />
                  </div>

                  {includeEventDetails && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="grid grid-cols-1 gap-3 p-4 bg-zinc-950 border border-zinc-800 rounded-2xl"
                    >
                      <div className="space-y-1">
                        <span className="text-[9px] text-zinc-500">{isFa ? "ساعت مهمانی (مثال: ۱۸:۰۰ الی ۲۲:۰۰)" : "Time of event"}</span>
                        <input 
                          type="text" 
                          placeholder="e.g., 6:00 PM" 
                          value={eventTime}
                          onChange={(e) => setEventTime(e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-850 rounded-lg p-2 text-xs text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] text-zinc-500">{isFa ? "آدرس پستی مراسم" : "Physical Address"}</span>
                        <input 
                          type="text" 
                          placeholder="e.g., Suite 12, Main St." 
                          value={eventAddress}
                          onChange={(e) => setEventAddress(e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-850 rounded-lg p-2 text-xs text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] text-zinc-500">{isFa ? "لینک نقشه گوگل یا بلد (اختیاری)" : "Map Link (Optional)"}</span>
                        <input 
                          type="url" 
                          placeholder="https://maps.google.com/..." 
                          value={eventLocationUrl}
                          onChange={(e) => setEventLocationUrl(e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-850 rounded-lg p-2 text-xs text-white"
                        />
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="pt-4 border-t border-zinc-800 flex items-center justify-between gap-3">
                  <span className="text-[9px] text-zinc-500">
                    {isFa ? "دعوت‌نامه شامل پیوند امن است." : "Invitation includes secure link."}
                  </span>
                  <button
                    type="button"
                    onClick={copyComposedText}
                    className="px-5 py-2.5 bg-[#10b981] hover:bg-emerald-400 text-zinc-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedSuccess ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>{isFa ? "کپی شد!" : "Copied!"}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>{isFa ? "کپی دعوت‌نامه" : "Copy Invitation"}</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-4 py-2 flex flex-col items-center">
                {/* QR Code Card */}
                <div className="bg-white p-4 rounded-3xl shadow-[0_10px_30px_rgba(16,185,129,0.15)] border-4 border-zinc-950 flex flex-col items-center justify-center relative group">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`https://giftino.ir/registry/${selectedShareList.id}`)}`}
                    alt="Giftino QR Barcode"
                    referrerPolicy="no-referrer"
                    className="w-40 h-40 object-contain"
                  />
                  {/* Subtle Giftino branding inside QR Container */}
                  <div className="mt-2 text-[9px] font-black tracking-widest text-zinc-950 font-mono uppercase">
                    GIFTINO SECURE QR
                  </div>
                </div>

                <div className="text-center space-y-1 px-4 max-w-sm">
                  <p className="text-[11px] font-black text-white">
                    {isFa ? "بارکد اختصاصی هوشمند لیست" : "Exclusive Smart QR Barcode"}
                  </p>
                  <p className="text-[9px] text-zinc-400 leading-relaxed">
                    {isFa
                      ? "دوستان شما می‌توانند با دوربین گوشی خود این بارکد (کد QR) را اسکن کرده و مستقیماً وارد این لیست شوند. همچنین می‌توانید تصویر را دانلود و چاپ کنید!"
                      : "Friends can scan this QR barcode with their phone cameras to open this registry directly. You can also download or print this code!"}
                  </p>
                  <div className="pt-1.5 text-[8px] font-mono text-emerald-400 bg-emerald-950/20 py-1 px-3.5 rounded-full inline-block border border-emerald-900/40">
                    https://giftino.ir/registry/{selectedShareList.id}
                  </div>
                </div>

                {/* Download button */}
                <div className="pt-2 w-full border-t border-zinc-800 flex items-center justify-between gap-3">
                  <span className="text-[9px] text-zinc-500">
                    {isFa ? "بارکد با فرمت باکیفیت PNG" : "Barcode in high-quality PNG"}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDownloadQR(selectedShareList.id)}
                    disabled={qrDownloading}
                    className="px-5 py-2.5 bg-[#10b981] hover:bg-emerald-400 disabled:bg-zinc-800 text-zinc-950 disabled:text-zinc-600 font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    {qrDownloading ? (
                      <span>{isFa ? "در حال آماده‌سازی..." : "Downloading..."}</span>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        <span>{isFa ? "دانلود تصویر بارکد" : "Download Barcode"}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

          </motion.div>
        </div>
      )}

    </div>
  );
}
