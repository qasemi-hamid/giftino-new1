import React, { useState } from "react";
import { Wishlist, WishlistItem, Language, UserProfile } from "../types";
import { 
  Sparkles, Search, Plus, ExternalLink, ChevronRight, HelpCircle,
  ArrowLeft, TrendingUp, TrendingDown, Check, Compass, SlidersHorizontal,
  X, Filter, ShoppingBag, Brain, Tag, Layers, UserCheck, ShieldCheck,
  Share2, Users, Award, Star, MessageSquare, CheckCircle2, User
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toPersianDigits } from "../utils";
import AIGiftAdvisor from "./AIGiftAdvisor";

interface ExploreIdeasProps {
  wishlists: Wishlist[];
  onUpdateWishlists: (updated: Wishlist[]) => void;
  language: Language;
  onOpenAdvisorPortal?: () => void;
  user?: UserProfile;
}

interface CuratedItem {
  id: string;
  title: string;
  price?: number;
  image: string;
  brand: string;
  category?: string;
  recipient?: string;
  rank?: number;
  trend?: "up" | "down" | "stable";
}

interface Creator {
  id: string;
  name: string;
  badge: string;
  tagline: string;
  avatar: string;
  bannerImage: string;
  isCurrentUser?: boolean;
  followersCount?: number;
  matchRate?: number;
  items: CuratedItem[];
}

interface GuideCategory {
  id: string;
  title: string;
  titleFa: string;
  categoryKey: string;
  bgColor: string;
  textColor: string;
  image: string;
  items: CuratedItem[];
}

// 1. BRAND LOGOS & STORES
const TOP100_BRANDS = [
  { name: "Apple", nameFa: "اپل", iconKey: "Apple", bg: "bg-zinc-800/90 text-white border-zinc-700", verified: true, category: "Tech", tagline: "گجت‌ها و هندزفری‌های پرچمدار" },
  { name: "Xiaomi", nameFa: "شیائومی", iconKey: "Xiaomi", bg: "bg-orange-500/15 text-orange-400 border-orange-500/30", verified: true, category: "Smart Life", tagline: "ساعت و گجت‌های هوشمند" },
  { name: "Anker", nameFa: "انکر", iconKey: "Anker", bg: "bg-blue-500/15 text-blue-400 border-blue-500/30", verified: true, category: "Audio & Power", tagline: "اسپیکر و پاوربانک حرفه‌ای" },
  { name: "Baseus", nameFa: "باسئوس", iconKey: "Baseus", bg: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30", verified: true, category: "Gadgets", tagline: "لوازم جانبی هوشمند" },
  { name: "Cosrx", nameFa: "کوزارکس", iconKey: "Cosrx", bg: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30", verified: true, category: "Skincare", tagline: "روتین پوستی و آبرسان کره‌ای" },
  { name: "JBL", nameFa: "جی‌بی‌ال", iconKey: "JBL", bg: "bg-orange-600/15 text-orange-400 border-orange-600/30", verified: true, category: "Audio", tagline: "اسپیکرهای ضدآب و بیس دار" },
  { name: "Wacaco", nameFa: "واکاکو", iconKey: "Wacaco", bg: "bg-amber-600/15 text-amber-400 border-amber-600/30", verified: true, category: "Coffee", tagline: "اسپرسوساز مسافرتی و همراه" },
  { name: "IKEA", nameFa: "ایکیا", iconKey: "IKEA", bg: "bg-blue-600/15 text-blue-300 border-blue-600/30", verified: true, category: "Home", tagline: "دکوراسیون و اکسسوری مینیمال" }
];

const BRAND_LOGOS: Record<string, React.ReactNode> = {
  Apple: (
    <div className="w-8 h-8 rounded-xl bg-zinc-950 border border-zinc-700/80 flex items-center justify-center p-1.5 shadow-md shrink-0">
      <svg className="w-5 h-5 fill-current text-white" viewBox="0 0 170 170">
        <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.34.13-9.16-1.9-14.49-6.09-3.26-2.65-7.13-7.29-11.62-13.92-7.14-10.51-12.73-21.97-16.78-34.39-4.05-12.42-6.08-23.99-6.08-34.72 0-14.72 3.73-26.68 11.19-35.88 7.46-9.2 16.63-13.9 27.52-14.1 4.88-.13 10.05 1.14 15.52 3.82 5.47 2.68 9.38 4.08 11.72 4.2 2.12-.12 6.13-1.57 12.03-4.35 5.9-2.78 10.89-4.01 14.97-3.69 10.87.52 19.8 4.58 26.79 12.18-9.68 5.83-14.36 13.88-14.04 24.16.33 8.37 3.65 15.42 9.97 21.15 6.32 5.73 13.82 8.92 22.5 9.57-2.39 7.08-5.65 14.28-9.78 21.61zM119.22 31.84c0-7.39 2.72-14.51 8.16-21.36 5.44-6.85 12.13-10.48 20.08-10.48.22.98.33 1.85.33 2.61 0 7.28-2.77 14.39-8.31 21.33-5.54 6.94-12.28 10.63-20.22 11.07-.04-1.07-.04-2.13-.04-3.17z"/>
      </svg>
    </div>
  ),
  Xiaomi: (
    <div className="w-8 h-8 rounded-xl bg-[#FF6900] flex items-center justify-center font-black text-white text-[12px] tracking-tight shadow-md border border-orange-400/40 shrink-0">
      mi
    </div>
  ),
  Anker: (
    <div className="h-8 px-2 rounded-xl bg-[#00A4E4] text-white font-black text-[9.5px] tracking-widest uppercase flex items-center justify-center shadow-md border border-sky-300/40 shrink-0">
      ANKER
    </div>
  ),
  Baseus: (
    <div className="h-8 px-2 rounded-xl bg-[#FFCC00] text-zinc-950 font-black text-[9.5px] tracking-wider uppercase flex items-center justify-center shadow-md border border-yellow-300/60 shrink-0">
      Baseus
    </div>
  ),
  Cosrx: (
    <div className="h-8 px-2 rounded-xl bg-white text-zinc-950 font-black text-[9.5px] tracking-widest uppercase flex items-center justify-center shadow-md border border-zinc-200 shrink-0">
      COSRX
    </div>
  ),
  JBL: (
    <div className="h-8 px-2 rounded-xl bg-[#FF3300] text-white font-black text-[12px] tracking-tight flex items-center justify-center shadow-md border border-orange-400/40 shrink-0">
      JBL
    </div>
  ),
  Wacaco: (
    <div className="h-8 px-1.5 rounded-xl bg-[#3E2723] text-amber-200 font-black text-[9px] tracking-wider uppercase flex items-center justify-center shadow-md border border-amber-600/50 shrink-0">
      WACACO
    </div>
  ),
  IKEA: (
    <div className="h-8 px-2 rounded-xl bg-[#0051BA] text-[#FFDA1A] font-black text-[10.5px] tracking-wider uppercase flex items-center justify-center shadow-md border border-blue-400/40 shrink-0">
      IKEA
    </div>
  )
};

// 2. FEATURED CURATORS & TOP CONTRIBUTORS (Giftful Style)
const CREATORS_LIST: Creator[] = [
  {
    id: "c_tech_geek",
    name: "آرش نیازی",
    badge: "✓ پیشنهادهای گجت و تکنولوژی",
    tagline: "راهنمای تخصصی خرید گجت، ساعت و هندزفری باارزش",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
    bannerImage: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=400",
    items: [
      { id: "cg_1", title: "هدفون بی‌سیم انکر Soundcore P20i", price: 1250000, brand: "Anker", category: "tech", image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&q=80&w=300" },
      { id: "cg_2", title: "پاوربانک ۲۰۰۰۰ فست شارژ باسئوس", price: 1850000, brand: "Baseus", category: "tech", image: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&q=80&w=300" },
      { id: "cg_3", title: "ساعت هوشمند می بند ۸ شیائومی", price: 2100000, brand: "Xiaomi", category: "tech", image: "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&q=80&w=300" }
    ]
  },
  {
    id: "c_beauty_care",
    name: "سارا حسینی",
    badge: "✓ پیشنهادهای زیبایی و سلامت",
    tagline: "بهترین انتخاب‌های روتین پوستی، عطر و زیبایی",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150",
    bannerImage: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=400",
    items: [
      { id: "cb_1", title: "سرم آبرسان حلزون کوزارکس COSRX", price: 1150000, brand: "Cosrx", category: "beauty", image: "https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&q=80&w=300" },
      { id: "cb_2", title: "ست براش ۱۰ تکه حرفه‌ای آرایشی", price: 580000, brand: "Real Techniques", category: "beauty", image: "https://images.unsplash.com/photo-1596462572706-576566b1124c?auto=format&fit=crop&q=80&w=300" },
      { id: "cb_3", title: "عطر مینیاتوری زنانه لومیر ۵۰ میل", price: 1950000, brand: "Lumiere", category: "beauty", image: "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&q=80&w=300" }
    ]
  },
  {
    id: "c_coffee_home",
    name: "امیر پوریا",
    badge: "✓ پیشنهادهای خانه و کافه",
    tagline: "هدایای گرم و اصیل برای عاشقان قهوه و سبک زندگی",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=150",
    bannerImage: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&q=80&w=400",
    items: [
      { id: "ch_1", title: "مینی اسپرسوساز واکاکو مدل نانواسپرسو", price: 3400000, brand: "Wacaco", category: "home", image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=300" },
      { id: "ch_2", title: "تراول ماگ درجه‌دار استیل ضدزنگ", price: 480000, brand: "Thermos", category: "home", image: "https://images.unsplash.com/photo-1577937927133-66ef06acdf18?auto=format&fit=crop&q=80&w=300" },
      { id: "ch_3", title: "شمع معطر سرامیکی دست‌ساز با رایحه وانیل", price: 320000, brand: "Lumiere", category: "home", image: "https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&q=80&w=300" }
    ]
  }
];

// 3. TOP 100 TRENDING ITEMS
const TOP100_ITEMS: CuratedItem[] = [
  {
    id: "t_1",
    title: "ایرپاد پرو ۲ اپل (Apple AirPods Pro 2)",
    price: 11800000,
    brand: "Apple",
    category: "tech",
    recipient: "spouse",
    image: "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&q=80&w=400",
    rank: 1,
    trend: "up"
  },
  {
    id: "t_2",
    title: "ساعت هوشمند مچ‌بند شیائومی بند ۸",
    price: 2200000,
    brand: "Xiaomi",
    category: "tech",
    recipient: "friend",
    image: "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&q=80&w=400",
    rank: 2,
    trend: "up"
  },
  {
    id: "t_3",
    title: "اسپرسوساز مسافرتی دستی واکاکو نانواسپرسو",
    price: 3500000,
    brand: "Wacaco",
    category: "home",
    recipient: "parents",
    image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=400",
    rank: 3,
    trend: "up"
  },
  {
    id: "t_4",
    title: "سرم حلزون آبرسان پیشرفته کوزارکس",
    price: 1150000,
    brand: "Cosrx",
    category: "beauty",
    recipient: "spouse",
    image: "https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&q=80&w=400",
    rank: 4,
    trend: "down"
  },
  {
    id: "t_5",
    title: "تراول ماگ استیل درجه‌دار قفل‌دار ۵۰۰ میل",
    price: 490000,
    brand: "Thermos",
    category: "home",
    recipient: "friend",
    image: "https://images.unsplash.com/photo-1577937927133-66ef06acdf18?auto=format&fit=crop&q=80&w=400",
    rank: 5,
    trend: "up"
  },
  {
    id: "t_6",
    title: "پاوربانک فست شارژ ۲۰۰۰۰ میلی‌آمپر باسئوس",
    price: 1890000,
    brand: "Baseus",
    category: "tech",
    recipient: "friend",
    image: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&q=80&w=400",
    rank: 6,
    trend: "up"
  },
  {
    id: "t_7",
    title: "ست هدایای چرم طبیعی کیف پول و کمربند",
    price: 1450000,
    brand: "LeatherCo",
    category: "fashion",
    recipient: "parents",
    image: "https://images.unsplash.com/photo-1627124118123-fe654447c3b7?auto=format&fit=crop&q=80&w=400",
    rank: 7,
    trend: "stable"
  },
  {
    id: "t_8",
    title: "اسپیکر بلوتوثی ضدآب قابل حمل JBL Go 3",
    price: 2400000,
    brand: "JBL",
    category: "tech",
    recipient: "teen",
    image: "https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&q=80&w=400",
    rank: 8,
    trend: "up"
  }
];

// 4. CATEGORY GUIDES
const CATEGORY_GUIDES: GuideCategory[] = [
  {
    id: "g_tech",
    title: "Tech & Gadgets",
    titleFa: "گجت‌ها و تکنولوژی روز",
    categoryKey: "tech",
    bgColor: "#1e293b",
    textColor: "#ffffff",
    image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=400",
    items: [
      { id: "gi_t1", title: "ساعت هوشمند می بند ۸ شیائومی", price: 2100000, brand: "Xiaomi", image: "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&q=80&w=300" },
      { id: "gi_t2", title: "پاوربانک ۲۰۰۰۰ فست شارژ باسئوس", price: 1850000, brand: "Baseus", image: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&q=80&w=300" },
      { id: "gi_t3", title: "اسپیکر بلوتوثی قابل حمل ضدآب", price: 2400000, brand: "JBL", image: "https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&q=80&w=300" }
    ]
  },
  {
    id: "g_beauty",
    title: "Beauty & Skincare",
    titleFa: "زیبایی، عطر و مراقبت پوستی",
    categoryKey: "beauty",
    bgColor: "#be185d",
    textColor: "#ffffff",
    image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=400",
    items: [
      { id: "gi_b1", title: "سرم حلزون آبرسان پیشرفته کوزارکس", price: 1150000, brand: "Cosrx", image: "https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&q=80&w=300" },
      { id: "gi_b2", title: "ست براش آرایشی ۱۰ عددی حرفه‌ای", price: 580000, brand: "Real Techniques", image: "https://images.unsplash.com/photo-1596462572706-576566b1124c?auto=format&fit=crop&q=80&w=300" }
    ]
  },
  {
    id: "g_coffee",
    title: "Coffee & Home",
    titleFa: "قهوه، ماگ و خانه مینیمال",
    categoryKey: "home",
    bgColor: "#78350f",
    textColor: "#ffffff",
    image: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&q=80&w=400",
    items: [
      { id: "gi_c1", title: "اسپرسوساز مسافرتی واکاکو نانوپرسو", price: 3400000, brand: "Wacaco", image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=300" }
    ]
  }
];

export default function ExploreIdeas({
  wishlists,
  onUpdateWishlists,
  language,
  onOpenAdvisorPortal,
  user
}: ExploreIdeasProps) {
  const [viewMode, setViewMode] = useState<"feed" | "top100" | "advisor">("feed");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Active Filter States
  const [selectedRecipient, setSelectedRecipient] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedBudget, setSelectedBudget] = useState<string>("all");
  const [activeBrandFilter, setActiveBrandFilter] = useState<string | null>(null);

  // Selected Detail Modal Item
  const [previewItem, setPreviewItem] = useState<CuratedItem | null>(null);

  // Connection states
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [selectedGuide, setSelectedGuide] = useState<GuideCategory | null>(null);
  const [addingTargetListId, setAddingTargetListId] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [followedCreators, setFollowedCreators] = useState<Record<string, boolean>>({});

  const isFa = language === "fa";

  // Build Dynamic Current User Advisor Profile if user is advisor
  const userAdvisorItems: CuratedItem[] = wishlists.flatMap(w => 
    w.items.map((it) => ({
      id: `user_item_${it.id}`,
      title: it.title,
      price: it.price,
      brand: "انتخاب ویژه",
      image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=300",
      category: "tech"
    }))
  );

  const userCreatorCard: Creator | null = (user && user.isAdvisor) ? {
    id: `user_advisor_${user.phone || 'me'}`,
    name: user.name || "کیوریتور گیفتی‌نو",
    badge: `✓ ${user.advisorCategory || 'پیشنهاددهنده برتر'}`,
    tagline: user.advisorBio || "کیوریتور و مشاور تخصصی انتخاب بهترین هدیه‌های مدرن",
    avatar: user.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
    bannerImage: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=400",
    isCurrentUser: true,
    followersCount: user.advisorMetrics?.followersCount || 1420,
    matchRate: user.advisorMetrics?.matchRate || 98,
    items: userAdvisorItems.length > 0 ? userAdvisorItems : [
      { id: "u_1", title: "ساعت هوشمند می بند ۸ شیائومی", price: 2100000, brand: "Xiaomi", category: "tech", image: "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&q=80&w=300" },
      { id: "u_2", title: "پاوربانک ۲۰۰۰۰ فست شارژ باسئوس", price: 1850000, brand: "Baseus", category: "tech", image: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&q=80&w=300" }
    ]
  } : null;

  const displayCreatorsList = userCreatorCard ? [userCreatorCard, ...CREATORS_LIST] : CREATORS_LIST;

  const handleToggleFollow = (creatorId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFollowedCreators(prev => ({
      ...prev,
      [creatorId]: !prev[creatorId]
    }));
  };

  const handleAddItemToWishlist = (item: { title: string; price?: number }) => {
    if (wishlists.length === 0) {
      alert(isFa ? "ابتدا باید یک لیست آرزو در پروفایل خود بسازید!" : "Please create a wishlist in your Profile first!");
      return;
    }

    const listId = addingTargetListId || wishlists[0].id;
    const newItem: WishlistItem = {
      id: "item_curated_" + Date.now(),
      title: item.title,
      price: item.price,
      notes: isFa ? "برگزیده شده از بخش ایده‌های کادویی گیفتی‌نو." : "Picked from trending gift ideas.",
      priority: "medium",
      isReserved: false
    };

    const updated = wishlists.map((w) => {
      if (w.id === listId) {
        return {
          ...w,
          items: [newItem, ...w.items]
        };
      }
      return w;
    });

    onUpdateWishlists(updated);
    setSuccessMsg(isFa ? "✨ کادو با موفقیت به لیست آرزو اضافه شد!" : "✨ Wish connected to your list!");
    setTimeout(() => {
      setSuccessMsg("");
      setPreviewItem(null);
    }, 1500);
  };

  // Filter Items Based on Active Category & Search
  const filterItemMatches = (item: CuratedItem) => {
    if (selectedCategory !== "all" && item.category !== selectedCategory) return false;
    if (selectedRecipient !== "all" && item.recipient && item.recipient !== selectedRecipient) return false;
    if (selectedBudget === "under1m" && item.price && item.price > 1000000) return false;
    if (selectedBudget === "1m-3m" && item.price && (item.price < 1000000 || item.price > 3000000)) return false;
    if (selectedBudget === "over3m" && item.price && item.price < 3000000) return false;
    if (activeBrandFilter && item.brand.toLowerCase() !== activeBrandFilter.toLowerCase()) return false;

    if (searchQuery.trim()) {
      const term = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(term) ||
        item.brand.toLowerCase().includes(term)
      );
    }
    return true;
  };

  const filteredTop100 = TOP100_ITEMS.filter(filterItemMatches);

  const activeCuratedItems = selectedCreator 
    ? selectedCreator.items.filter(filterItemMatches) 
    : selectedGuide 
      ? selectedGuide.items.filter(filterItemMatches) 
      : [];
  
  const activeCuratedName = selectedCreator 
    ? selectedCreator.name 
    : selectedGuide 
      ? (isFa ? selectedGuide.titleFa : selectedGuide.title) 
      : "";

  const activeFiltersCount = (selectedCategory !== "all" ? 1 : 0) + 
                            (selectedRecipient !== "all" ? 1 : 0) + 
                            (selectedBudget !== "all" ? 1 : 0) + 
                            (activeBrandFilter ? 1 : 0);

  const resetFilters = () => {
    setSelectedCategory("all");
    setSelectedRecipient("all");
    setSelectedBudget("all");
    setActiveBrandFilter(null);
    setSearchQuery("");
  };

  return (
    <div className="space-y-6 select-none pb-28 sm:pb-32" style={{ direction: isFa ? "rtl" : "ltr" }}>
      
      {/* HEADER MODE TOGGLE BAR */}
      <div className="bg-zinc-900/80 border border-zinc-850 p-1.5 rounded-2xl flex items-center justify-between text-xs font-bold gap-1 shadow-lg">
        <button
          onClick={() => setViewMode("feed")}
          className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            viewMode === "feed"
              ? "bg-[#10b981] text-zinc-950 font-black shadow-md"
              : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>{isFa ? "ایده‌های کادو" : "Curated Ideas"}</span>
        </button>

        <button
          onClick={() => setViewMode("top100")}
          className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            viewMode === "top100"
              ? "bg-[#10b981] text-zinc-950 font-black shadow-md"
              : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>{isFa ? "۱۰۰ ترند برتر" : "Top 100 Trending"}</span>
        </button>

        <button
          onClick={() => setViewMode("advisor")}
          className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            viewMode === "advisor"
              ? "bg-[#10b981] text-zinc-950 font-black shadow-md"
              : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
          }`}
        >
          <Brain className="w-4 h-4" />
          <span>{isFa ? "مشاور AI" : "AI Advisor"}</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {viewMode === "feed" ? (
          <motion.div
            key="feed"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-5"
          >
            {/* COMPACT SEARCH & SMART EXPANDABLE FILTER BAR */}
            <div className="space-y-2.5 bg-zinc-900/60 border border-zinc-800 p-3 rounded-2xl shadow-lg">
              {/* Top Row: Search Input + Advanced Filter Toggle */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1 flex items-center bg-zinc-950 border border-zinc-800 focus-within:border-[#10b981] rounded-xl p-0.5 transition-all">
                  <div className="p-2 text-zinc-500 shrink-0">
                    <Search className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    placeholder={isFa ? "جستجوی کادو، برند یا ایده..." : "Search gifts, brands..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full py-1.5 pr-1 pl-3 bg-transparent text-xs text-white outline-none placeholder:text-zinc-600 font-medium"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")} className="p-1.5 text-zinc-500 hover:text-white">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <button
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                    showAdvancedFilters || activeFiltersCount > 0
                      ? "bg-[#10b981]/20 text-[#10b981] border-[#10b981]/60 shadow-sm"
                      : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
                  }`}
                  title={isFa ? "فیلتر هوشمند" : "Smart Filters"}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span className="text-[11px]">{isFa ? "فیلترها" : "Filters"}</span>
                  {activeFiltersCount > 0 && (
                    <span className="w-4 h-4 rounded-full bg-[#10b981] text-zinc-950 text-[9px] font-black flex items-center justify-center">
                      {toPersianDigits(String(activeFiltersCount))}
                    </span>
                  )}
                </button>
              </div>

              {/* Single Horizontal Category Pill Bar */}
              <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none items-center">
                {[
                  { key: "all", label: isFa ? "همه دسته‌ها" : "All" },
                  { key: "tech", label: isFa ? "📱 گجت" : "Tech" },
                  { key: "beauty", label: isFa ? "💄 زیبایی" : "Beauty" },
                  { key: "home", label: isFa ? "☕ خانه و کافه" : "Home & Coffee" },
                  { key: "fashion", label: isFa ? "👜 پوشاک" : "Fashion" }
                ].map((c) => (
                  <button
                    key={c.key}
                    onClick={() => setSelectedCategory(selectedCategory === c.key ? "all" : c.key)}
                    className={`py-1 px-3 rounded-xl text-[10.5px] font-bold border transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                      selectedCategory === c.key
                        ? "bg-[#10b981] text-zinc-950 border-[#10b981] font-black shadow-sm"
                        : "bg-zinc-950/80 border-zinc-800/80 text-zinc-400 hover:text-white hover:border-zinc-700"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              {/* Collapsible Smart Filter Drawer */}
              <AnimatePresence>
                {showAdvancedFilters && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden pt-2 border-t border-zinc-800/80 space-y-3"
                  >
                    {/* Recipient Filter */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-zinc-400 block">
                        {isFa ? "کادو برای چه کسی؟" : "Gift Recipient:"}
                      </span>
                      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                        {[
                          { key: "all", label: "همه" },
                          { key: "spouse", label: "همسر / عاشقانه" },
                          { key: "friend", label: "دوست صمیمی" },
                          { key: "parents", label: "پدر و مادر" },
                          { key: "teen", label: "نوجوان و جوان" }
                        ].map((r) => (
                          <button
                            key={r.key}
                            onClick={() => setSelectedRecipient(selectedRecipient === r.key ? "all" : r.key)}
                            className={`py-1 px-2.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer whitespace-nowrap ${
                              selectedRecipient === r.key
                                ? "bg-[#10b981]/20 text-[#10b981] border-[#10b981]"
                                : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white"
                            }`}
                          >
                            {r.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Budget Filter */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-zinc-400 block">
                        {isFa ? "محدوده قیمت:" : "Budget:"}
                      </span>
                      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                        {[
                          { key: "all", label: "همه قیمت‌ها" },
                          { key: "under1m", label: "زیر ۱ میلیون" },
                          { key: "1m-3m", label: "۱ تا ۳ میلیون" },
                          { key: "over3m", label: "بالای ۳ میلیون" }
                        ].map((b) => (
                          <button
                            key={b.key}
                            onClick={() => setSelectedBudget(selectedBudget === b.key ? "all" : b.key)}
                            className={`py-1 px-2.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer whitespace-nowrap ${
                              selectedBudget === b.key
                                ? "bg-[#10b981]/20 text-[#10b981] border-[#10b981]"
                                : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white"
                            }`}
                          >
                            {b.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Brand Filter active pill */}
                    {activeBrandFilter && (
                      <div className="flex items-center justify-between text-xs bg-zinc-950 p-2 rounded-xl border border-emerald-500/30">
                        <span className="text-zinc-300 text-[10px] font-bold">
                          {isFa ? `برند انتخاب شده: ${activeBrandFilter}` : `Brand: ${activeBrandFilter}`}
                        </span>
                        <button
                          onClick={() => setActiveBrandFilter(null)}
                          className="text-rose-400 hover:text-rose-300 text-[10px] font-bold flex items-center gap-1"
                        >
                          <X className="w-3 h-3" />
                          <span>{isFa ? "حذف برند" : "Clear Brand"}</span>
                        </button>
                      </div>
                    )}

                    {/* Clear All Filters */}
                    {activeFiltersCount > 0 && (
                      <div className="flex justify-end pt-1">
                        <button
                          onClick={resetFilters}
                          className="text-[10px] text-rose-400 hover:text-rose-300 font-bold underline cursor-pointer flex items-center gap-1"
                        >
                          <X className="w-3 h-3" />
                          <span>{isFa ? "پاک کردن تمام فیلترها" : "Reset All Filters"}</span>
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* FEATURED SHOPPING GUIDES GRID */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#10b981]" />
                  <span>{isFa ? "دفترچه‌های راهنمای انتخاب کادو" : "Shopping Guides"}</span>
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {CATEGORY_GUIDES.map((guide) => (
                  <div
                    key={guide.id}
                    onClick={() => setSelectedGuide(guide)}
                    className="h-36 relative rounded-2xl overflow-hidden cursor-pointer select-none group transition-all duration-300 hover:scale-[1.02] shadow-lg shadow-black/40 border border-white/10"
                    style={{ backgroundColor: guide.bgColor }}
                  >
                    <img 
                      src={guide.image} 
                      alt={guide.title} 
                      className="absolute inset-0 w-full h-full opacity-60 object-cover object-center transition-transform duration-500 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-zinc-950/20 z-10" />

                    <div className="absolute inset-0 p-3.5 flex flex-col justify-center items-start z-20">
                      <h4 className="text-white font-black text-sm leading-tight drop-shadow-md">
                        {isFa ? guide.titleFa : guide.title}
                      </h4>
                      <p className="text-[9px] text-zinc-300 font-medium pt-1 max-w-[60%]">
                        {isFa ? `${toPersianDigits(String(guide.items.length))} کادوی پیشنهادی` : `${guide.items.length} items`}
                      </p>
                    </div>

                    <div className="absolute bottom-3 left-3 z-20 w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm flex items-center justify-center text-white transition-colors">
                      <Plus className="w-3.5 h-3.5" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* OFFICIAL BRANDS & STORES SECTION (Giftful Benchmark) */}
            <div className="space-y-3 pt-3">
              <div className="flex justify-between items-center px-1">
                <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <ShoppingBag className="w-3.5 h-3.5 text-[#10b981]" />
                  <span>{isFa ? "برندهای برتر و فروشگاه‌های رسمی" : "Featured Brands & Official Stores"}</span>
                </h3>
                <span className="text-[9px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span>✓</span>
                  <span>{isFa ? "تضمین اصالت" : "Verified Stores"}</span>
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {TOP100_BRANDS.map((brand) => (
                  <button
                    key={brand.name}
                    onClick={() => {
                      setActiveBrandFilter(brand.name);
                      setViewMode("top100");
                    }}
                    className={`p-3 rounded-2xl border text-right transition-all cursor-pointer hover:scale-[1.02] flex flex-col justify-between space-y-2 shadow-md ${brand.bg}`}
                  >
                    <div className="flex items-center justify-between">
                      {BRAND_LOGOS[brand.iconKey] || (
                        <div className="w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center font-bold text-white text-xs">
                          {brand.name[0]}
                        </div>
                      )}
                      <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-black/50 border border-white/10 text-white flex items-center gap-0.5 shadow-sm">
                        <span className="text-emerald-400 font-bold">✓</span>
                        <span>{brand.category}</span>
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-black text-white">{isFa ? brand.nameFa : brand.name}</span>
                        <span className="text-[9px] text-zinc-400 font-bold">({brand.name})</span>
                      </div>
                      <p className="text-[8.5px] text-zinc-300 font-medium pt-0.5 line-clamp-1">
                        {brand.tagline}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* FEATURED CURATORS & POPULAR IDEAS */}
            <div className="space-y-3 pt-3">
              <div className="flex justify-between items-center px-1">
                <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isFa ? "پیشنهاددهندگان محبوب کادو" : "Top Curators"}</span>
                </h3>
              </div>
              
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x">
                {displayCreatorsList.map((creator) => {
                  const isFollowing = followedCreators[creator.id];

                  return (
                    <div
                      key={creator.id}
                      onClick={() => setSelectedCreator(creator)}
                      className={`min-w-[180px] max-w-[180px] p-3 rounded-2xl cursor-pointer transition-all hover:scale-[1.02] flex flex-col space-y-2.5 shrink-0 snap-start relative overflow-hidden group shadow-lg ${
                        creator.isCurrentUser 
                          ? "bg-gradient-to-b from-emerald-950/80 via-zinc-900 to-zinc-950 border-2 border-emerald-500 shadow-[0_10px_30px_rgba(16,185,129,0.2)]" 
                          : "bg-zinc-900/90 border border-zinc-800 hover:border-emerald-500/50"
                      }`}
                    >
                      {/* Current User Ribbon Badge */}
                      {creator.isCurrentUser && (
                        <div className="absolute top-2 left-2 z-20 bg-[#10b981] text-zinc-950 text-[8px] font-black px-2 py-0.5 rounded-full shadow-md flex items-center gap-1">
                          <Star className="w-2.5 h-2.5 fill-zinc-950" />
                          <span>{isFa ? "حساب شما" : "Your Store"}</span>
                        </div>
                      )}

                      <div className="w-full h-22 rounded-xl overflow-hidden relative bg-zinc-800">
                        <img 
                          src={creator.bannerImage} 
                          alt={creator.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80" 
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                        
                        {/* Avatar Overlap */}
                        <div className="absolute bottom-1.5 right-1.5 flex items-center gap-1.5">
                          <img 
                            src={creator.avatar} 
                            alt={creator.name} 
                            className="w-7 h-7 rounded-full border-2 border-[#10b981] object-cover shadow-md"
                            referrerPolicy="no-referrer"
                          />
                          <span className="bg-emerald-500/90 text-zinc-950 font-black px-1.5 py-0.5 rounded text-[8px] shadow">
                            {creator.badge}
                          </span>
                        </div>
                      </div>

                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1 min-w-0">
                            <span className="text-[11px] font-black text-white truncate">{creator.name}</span>
                            <div className="w-3.5 h-3.5 bg-blue-500 rounded-full flex items-center justify-center text-[7px] text-white font-bold shrink-0">✓</div>
                          </div>

                          {!creator.isCurrentUser && (
                            <button
                              onClick={(e) => handleToggleFollow(creator.id, e)}
                              className={`text-[8px] font-bold px-2 py-0.5 rounded-full border transition-all shrink-0 cursor-pointer ${
                                isFollowing
                                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                                  : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700"
                              }`}
                            >
                              {isFollowing ? (isFa ? "دنبال شد" : "Following") : (isFa ? "+ دنبال" : "+ Follow")}
                            </button>
                          )}
                        </div>

                        <p className="text-[8.5px] text-zinc-400 leading-tight line-clamp-2">
                          {creator.tagline}
                        </p>

                        <div className="pt-1 flex items-center justify-between text-[8px] font-bold text-emerald-400">
                          <span>{isFa ? `${toPersianDigits(String(creator.items.length))} کادوی پیشنهادی` : `${creator.items.length} Gifts`}</span>
                          <ChevronRight className="w-3 h-3 text-emerald-400 rtl:rotate-180" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* QUICK AI BANNER */}
            <div 
              onClick={() => setViewMode("advisor")}
              className="bg-gradient-to-r from-emerald-950/80 via-zinc-900 to-zinc-950 border border-emerald-500/30 p-4 rounded-2xl flex items-center justify-between cursor-pointer hover:border-emerald-400 transition-all shadow-lg"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-[#10b981] flex items-center justify-center shrink-0 border border-emerald-500/30">
                  <Brain className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white">
                    {isFa ? "هنوز کادوی مد نظرت رو پیدا نکردی؟" : "Can't decide on a gift?"}
                  </h4>
                  <p className="text-[10px] text-zinc-400 font-medium pt-0.5">
                    {isFa ? "از هوش مصنوعی جمینای بر اساس سن، بودجه و نسبت مشاوره بگیر" : "Ask Gemini AI Advisor"}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-[#10b981] shrink-0" />
            </div>

          </motion.div>
        ) : viewMode === "top100" ? (
          /* TOP 100 TRENDING SCREEN */
          <motion.div
            key="top100"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
              <div>
                <h2 className="text-sm font-black text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                  <span>{isFa ? "۱۰۰ ترند برتر کادو در ایران" : "Top 100 Trending Gifts"}</span>
                </h2>
                <p className="text-[9.5px] text-zinc-400 font-medium">
                  {isFa ? "محبوب‌ترین و پرتقاضاترین محصولات هدیه" : "Top gifts updated daily"}
                </p>
              </div>

              {activeFiltersCount > 0 && (
                <button onClick={resetFilters} className="text-[10px] text-rose-400 font-bold hover:underline">
                  {isFa ? "پاک کردن فیلترها" : "Clear Filters"}
                </button>
              )}
            </div>

            {/* Brand Filter Row */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setActiveBrandFilter(null)}
                className={`py-1 px-3 rounded-full text-[9.5px] font-bold border transition-all cursor-pointer whitespace-nowrap ${
                  activeBrandFilter === null 
                    ? "bg-[#10b981] text-zinc-950 border-[#10b981]" 
                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                }`}
              >
                {isFa ? "همه برندها" : "All Brands"}
              </button>
              {TOP100_BRANDS.map((br) => (
                <button
                  key={br.name}
                  onClick={() => setActiveBrandFilter(activeBrandFilter === br.name ? null : br.name)}
                  className={`py-1 px-3 rounded-full text-[9.5px] font-bold border transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                    activeBrandFilter === br.name 
                      ? "bg-[#10b981] text-zinc-950 border-[#10b981]" 
                      : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                  }`}
                >
                  <span>{br.name}</span>
                </button>
              ))}
            </div>

            {/* 2-Column Product Grid */}
            <div className="grid grid-cols-2 gap-3.5">
              {filteredTop100.length === 0 ? (
                <div className="col-span-2 py-12 text-center space-y-2">
                  <p className="text-xs text-zinc-500 italic">
                    {isFa ? "هیچ محصولی با فیلترهای انتخابی شما پیدا نشد." : "No gifts matched your filter."}
                  </p>
                  <button onClick={resetFilters} className="text-xs text-[#10b981] font-bold underline">
                    {isFa ? "نمایش همه کادوها" : "Show All Gifts"}
                  </button>
                </div>
              ) : (
                filteredTop100.map((item) => (
                  <div 
                    key={item.id}
                    onClick={() => setPreviewItem(item)}
                    className="bg-zinc-900/60 border border-zinc-850 p-3 rounded-2xl flex flex-col justify-between space-y-2 transition-all hover:border-zinc-750 cursor-pointer group"
                  >
                    <div className="w-full aspect-square bg-white rounded-xl flex items-center justify-center p-3 relative overflow-hidden shadow-sm">
                      <img 
                        src={item.image} 
                        alt={item.title} 
                        className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=400";
                        }}
                      />
                      
                      <div className="absolute top-2 left-2 bg-zinc-950/90 text-white px-2 py-0.5 rounded-md text-[9px] font-mono font-black border border-zinc-800">
                        #{isFa ? toPersianDigits(String(item.rank)) : item.rank}
                      </div>

                      <div className="absolute bottom-2 right-2 flex items-center gap-0.5 bg-zinc-950/90 text-white px-1.5 py-0.5 rounded text-[8px] font-mono font-bold">
                        {item.trend === "up" ? (
                          <span className="text-emerald-400">▲</span>
                        ) : (
                          <span className="text-rose-400">▼</span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[8px] uppercase tracking-wider text-zinc-500 font-bold block">
                        {item.brand}
                      </span>
                      <h4 className="text-[10.5px] font-bold text-white truncate leading-snug">
                        {item.title}
                      </h4>

                      <div className="flex items-center justify-between pt-1">
                        {item.price && (
                          <span className="text-[10px] font-mono font-black text-[#10b981]">
                            {isFa ? toPersianDigits(item.price.toLocaleString()) + " تومان" : item.price.toLocaleString() + " T"}
                          </span>
                        )}
                        <span className="p-1 bg-zinc-950 text-[#10b981] border border-zinc-800 rounded-lg group-hover:bg-[#10b981] group-hover:text-zinc-950 transition-colors">
                          <Plus className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        ) : (
          /* DEDICATED AI ADVISOR SCREEN */
          <motion.div
            key="advisor"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <AIGiftAdvisor language={language} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ITEM PREVIEW & ACTION MODAL */}
      <AnimatePresence>
        {previewItem && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center p-3 sm:p-4 z-[100000] overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 w-full max-w-sm space-y-4 relative shadow-2xl my-auto text-right max-h-[85vh] overflow-y-auto"
            >
              <button 
                onClick={() => { setPreviewItem(null); setSuccessMsg(""); }} 
                className="absolute top-4 left-4 p-1.5 bg-zinc-800/90 hover:bg-rose-500/20 text-zinc-300 hover:text-rose-400 border border-zinc-700/80 hover:border-rose-500/40 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 px-2.5 text-xs font-bold z-10 shadow-md"
                title={isFa ? "بستن پنجره" : "Close window"}
              >
                <X className="w-3.5 h-3.5" />
                <span>{isFa ? "بستن" : "Close"}</span>
              </button>

              <div className="w-full h-44 bg-white rounded-2xl flex items-center justify-center p-4 relative overflow-hidden mt-6 sm:mt-0">
                <img 
                  src={previewItem.image} 
                  alt={previewItem.title} 
                  className="max-h-full max-w-full object-contain" 
                  referrerPolicy="no-referrer" 
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=400";
                  }}
                />
                <span className="absolute top-2.5 right-2.5 bg-zinc-950/90 text-[#10b981] px-2 py-0.5 rounded-lg text-[9px] font-bold">
                  {previewItem.brand}
                </span>
              </div>

              <div className="space-y-1">
                <h3 className="text-sm font-black text-white leading-snug">{previewItem.title}</h3>
                {previewItem.price && (
                  <p className="text-xs font-mono font-black text-[#10b981]">
                    {isFa ? toPersianDigits(previewItem.price.toLocaleString()) + " تومان" : previewItem.price.toLocaleString() + " T"}
                  </p>
                )}
              </div>

              {/* Wishlist Selector Panel */}
              <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-2xl space-y-2">
                {successMsg ? (
                  <p className="text-xs text-emerald-400 font-bold text-center py-2">{successMsg}</p>
                ) : (
                  <>
                    <label className="text-[10px] font-bold text-zinc-400 block">
                      {isFa ? "افزودن به کدام لیست آرزو؟" : "Select Target Wishlist:"}
                    </label>
                    <select
                      value={addingTargetListId}
                      onChange={(e) => setAddingTargetListId(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-2 text-xs text-white outline-none focus:border-[#10b981]"
                    >
                      {wishlists.map((wl) => (
                        <option key={wl.id} value={wl.id}>
                          {wl.title}
                        </option>
                      ))}
                    </select>

                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => handleAddItemToWishlist(previewItem)}
                        className="flex-1 py-2 bg-[#10b981] hover:bg-emerald-400 text-zinc-950 font-black text-xs rounded-xl transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" />
                        <span>{isFa ? "افزودن به لیست آرزو" : "Add to Wishlist"}</span>
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* External Price Check */}
              <a
                href={`https://torob.com/search/?query=${encodeURIComponent(previewItem.title)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 bg-zinc-950 border border-zinc-800 hover:border-amber-500/50 text-amber-400 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2"
              >
                <Search className="w-3.5 h-3.5" />
                <span>{isFa ? "استعلام قیمت در ترب و دیجی‌کالا" : "Check Prices on Torob"}</span>
              </a>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* RICH ADVISOR & CURATOR STOREFRONT DRAWER */}
      <AnimatePresence>
        {(selectedCreator || selectedGuide) && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center p-3 sm:p-4 z-[100000] overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-md shadow-[0_25px_80px_rgba(0,0,0,0.95)] my-auto text-right flex flex-col max-h-[85vh] overflow-hidden relative"
              style={{ direction: isFa ? "rtl" : "ltr" }}
            >
              {/* Creator Header Banner */}
              {selectedCreator ? (
                <div className="relative h-28 bg-zinc-900 shrink-0">
                  <img
                    src={selectedCreator.bannerImage}
                    alt={selectedCreator.name}
                    className="w-full h-full object-cover opacity-80"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />

                  <button 
                    onClick={() => { setSelectedCreator(null); setSelectedGuide(null); }} 
                    className="absolute top-3 left-3 p-2 bg-zinc-900/90 hover:bg-zinc-800 text-white rounded-xl border border-zinc-700/80 transition-all cursor-pointer z-20 shadow-md"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div className="absolute -bottom-5 right-4 flex items-end gap-3 z-10">
                    <img
                      src={selectedCreator.avatar}
                      alt={selectedCreator.name}
                      className="w-14 h-14 rounded-2xl border-2 border-[#10b981] object-cover shadow-xl bg-zinc-900"
                      referrerPolicy="no-referrer"
                    />
                    <div className="mb-1">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-black text-white">{selectedCreator.name}</h3>
                        <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-[8px] text-white font-bold">✓</div>
                      </div>
                      <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded-md font-bold">
                        {selectedCreator.badge}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-gradient-to-r from-emerald-950 via-zinc-900 to-zinc-950 border-b border-zinc-800 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#10b981]" />
                    <h3 className="text-xs font-black text-white">{activeCuratedName}</h3>
                  </div>
                  <button 
                    onClick={() => { setSelectedCreator(null); setSelectedGuide(null); }} 
                    className="p-1.5 bg-zinc-900 text-zinc-400 hover:text-white rounded-xl border border-zinc-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Creator Stats & Actions Header */}
              {selectedCreator && (
                <div className="p-4 pt-7 border-b border-zinc-850 space-y-3 shrink-0 bg-zinc-900/40">
                  <p className="text-[11px] text-zinc-300 leading-relaxed">
                    {selectedCreator.tagline}
                  </p>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-3 text-[10px] text-zinc-400 font-bold">
                      <span className="flex items-center gap-1 text-white">
                        <Users className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{toPersianDigits((selectedCreator.followersCount || 1420).toLocaleString())} {isFa ? "دنبال‌کننده" : "Followers"}</span>
                      </span>

                      <span className="flex items-center gap-1 text-emerald-400">
                        <Star className="w-3.5 h-3.5 fill-emerald-400" />
                        <span>%{toPersianDigits(String(selectedCreator.matchRate || 98))} {isFa ? "تطابق کادو" : "Match"}</span>
                      </span>
                    </div>

                    {selectedCreator.isCurrentUser ? (
                      <button
                        onClick={() => {
                          setSelectedCreator(null);
                          if (onOpenAdvisorPortal) onOpenAdvisorPortal();
                        }}
                        className="px-3 py-1.5 bg-[#10b981] hover:bg-emerald-400 text-zinc-950 text-[10px] font-black rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>{isFa ? "مدیریت حساب" : "Manage Account"}</span>
                      </button>
                    ) : (
                      <button
                        onClick={(e) => handleToggleFollow(selectedCreator.id, e)}
                        className={`px-3 py-1.5 text-[10px] font-black rounded-xl border transition-all cursor-pointer flex items-center gap-1 ${
                          followedCreators[selectedCreator.id]
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                            : "bg-[#10b981] text-zinc-950 border-[#10b981]"
                        }`}
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>
                          {followedCreators[selectedCreator.id] 
                            ? (isFa ? "دنبال می‌کنید ✓" : "Following ✓") 
                            : (isFa ? "دنبال کردن" : "Follow")}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Scrollable Curated Recommendations Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-24">
                <p className="text-[10px] font-black text-emerald-400 flex items-center gap-1">
                  <Award className="w-3.5 h-3.5" />
                  <span>{isFa ? "لیست پیشنهادهای برگزیده:" : "Recommended Gifts:"}</span>
                </p>

                {activeCuratedItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 p-3 rounded-2xl flex items-center gap-3 transition-all"
                  >
                    <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center overflow-hidden p-1 shrink-0">
                      <img 
                        src={item.image} 
                        alt={item.title} 
                        className="max-h-full max-w-full object-contain" 
                        referrerPolicy="no-referrer" 
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=400";
                        }}
                      />
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <span className="text-[8px] uppercase tracking-wider text-zinc-500 font-bold block">{item.brand}</span>
                      <h4 className="text-[11px] font-bold text-white leading-snug truncate">{item.title}</h4>
                      {item.price && (
                        <p className="text-[10px] font-mono text-[#10b981] font-bold">
                          {isFa ? toPersianDigits(item.price.toLocaleString()) + " تومان" : item.price.toLocaleString() + " T"}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-1 shrink-0">
                      <button
                        onClick={() => setPreviewItem(item)}
                        className="p-1.5 bg-[#10b981] text-zinc-950 font-bold rounded-xl text-[10px] flex items-center gap-1 transition-all cursor-pointer shadow-sm hover:scale-105"
                        title={isFa ? "افزودن به لیست آرزو" : "Add to Wishlist"}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">{isFa ? "افزودن" : "Add"}</span>
                      </button>

                      <a
                        href={`https://torob.com/search/?query=${encodeURIComponent(item.title)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 bg-zinc-950 border border-zinc-800 text-amber-400 hover:border-amber-500/50 rounded-xl text-[9px] font-bold flex items-center gap-1 transition-all"
                        title={isFa ? "خرید مستقیم از فروشگاه" : "Affiliate Buy Link"}
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span className="hidden sm:inline">{isFa ? "خرید" : "Buy"}</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
