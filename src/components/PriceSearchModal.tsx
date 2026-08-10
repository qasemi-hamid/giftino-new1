import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Search, ExternalLink, TrendingDown, Store, AlertCircle, Sparkles, Filter, ArrowUpDown, CheckCircle } from "lucide-react";

interface PriceSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery: string;
  targetPrice?: number;
  language: "fa" | "en";
}

interface SearchResult {
  shopId: string;
  shopName: string;
  shopNameEn: string;
  shopLogo: string;
  shopColor: string;
  productTitle: string;
  price: number;
  rating: number;
  reviewsCount: number;
  inStock: boolean;
  deliveryTime: string;
  deliveryTimeEn: string;
  shippingCost: number;
  isCheapest?: boolean;
  isBestValue?: boolean;
  url: string;
}

// Simple Persian digits utility
const toPersianDigits = (num: string | number): string => {
  const farsiDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return num
    .toString()
    .replace(/\d/g, (x) => farsiDigits[parseInt(x)]);
};

export const PriceSearchModal: React.FC<PriceSearchModalProps> = ({
  isOpen,
  onClose,
  initialQuery,
  targetPrice,
  language,
}) => {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sortBy, setSortBy] = useState<"price_asc" | "price_desc" | "rating">("price_asc");
  const [filterStore, setFilterStore] = useState<string>("all");

  const isFa = language === "fa";

  // Generate mock comparative search results based on the query and target price
  const generateResults = (query: string, basePrice?: number) => {
    setIsLoading(true);
    
    // Determine a dynamic base price
    let resolvedBasePrice = basePrice || 1200000;
    
    // Adjust based on keywords if no base price is provided
    if (!basePrice) {
      const q = query.toLowerCase();
      if (q.includes("کیبورد") || q.includes("keyboard") || q.includes("keychron")) {
        resolvedBasePrice = 4500000;
      } else if (q.includes("قهوه") || q.includes("coffee") || q.includes("موکاپات")) {
        resolvedBasePrice = 1250000;
      } else if (q.includes("کتاب") || q.includes("book")) {
        resolvedBasePrice = 110000;
      } else if (q.includes("گلدان") || q.includes("plant") || q.includes("برگ انجیری")) {
        resolvedBasePrice = 380000;
      } else if (q.includes("ماگ") || q.includes("mug") || q.includes("فنجان")) {
        resolvedBasePrice = 340000;
      } else if (q.includes("آبرنگ") || q.includes("watercolor") || q.includes("هنری")) {
        resolvedBasePrice = 1600000;
      }
    }

    setTimeout(() => {
      const stores = [
        {
          id: "digikala",
          name: "دیجی‌کالا",
          nameEn: "Digikala",
          logo: "🔴",
          color: "hover:border-red-500/30",
          priceMultiplier: 1.02, // slightly higher
          rating: 4.6,
          reviews: 142,
          delivery: "فردا (ارسال اکسپرس)",
          deliveryEn: "Tomorrow (Express)",
          shipping: 49000,
          url: `https://www.digikala.com/search/?q=${encodeURIComponent(query)}`,
        },
        {
          id: "basalam",
          name: "باسلام (غرفه‌های خانگی)",
          nameEn: "Basalam (Marketplace)",
          logo: "🟠",
          color: "hover:border-amber-500/30",
          priceMultiplier: 0.94, // cheaper but longer delivery
          rating: 4.4,
          reviews: 28,
          delivery: "۳ تا ۵ روز کاری",
          deliveryEn: "3-5 business days",
          shipping: 35000,
          url: `https://basalam.com/search?q=${encodeURIComponent(query)}`,
        },
        {
          id: "technolife",
          name: "تکنولایف",
          nameEn: "Technolife",
          logo: "🔵",
          color: "hover:border-blue-500/30",
          priceMultiplier: 0.98, // competitive for tech
          rating: 4.7,
          reviews: 89,
          delivery: "ارسال امروز (تهران)",
          deliveryEn: "Today Delivery (Tehran)",
          shipping: 45000,
          url: `https://technolife.ir/product/list?search=${encodeURIComponent(query)}`,
        },
        {
          id: "snappshop",
          name: "اسنپ‌شاپ",
          nameEn: "SnappShop",
          logo: "🟢",
          color: "hover:border-emerald-500/30",
          priceMultiplier: 1.05, // convenience premium
          rating: 4.2,
          reviews: 15,
          delivery: "ارسال سریع ۲ ساعته",
          deliveryEn: "Super Fast 2-Hour Delivery",
          shipping: 55000,
          url: `https://snappshop.ir/search?q=${encodeURIComponent(query)}`,
        },
        {
          id: "divar",
          name: "دیوار (نو در حد نو / کارکرده)",
          nameEn: "Divar (Secondhand & New)",
          logo: "🟤",
          color: "hover:border-stone-500/30",
          priceMultiplier: 0.68, // much cheaper
          rating: 4.1,
          reviews: 7,
          delivery: "خرید حضوری / فوری",
          deliveryEn: "Immediate Pick up / In-person",
          shipping: 0,
          url: `https://divar.ir/s/tehran?q=${encodeURIComponent(query)}`,
        }
      ];

      // Filter out stores that might not sell book items (e.g., Technolife) if it's clearly a book
      const qLower = query.toLowerCase();
      const isBook = qLower.includes("کتاب") || qLower.includes("book") || qLower.includes("نوشته");
      const filteredStores = isBook 
        ? stores.filter(s => s.id !== "technolife") 
        : stores;

      const generated: SearchResult[] = filteredStores.map((s) => {
        // Add some random variation
        const randomVariation = 1 + (Math.random() * 0.04 - 0.02); // +/- 2%
        const finalPrice = Math.round((resolvedBasePrice * s.priceMultiplier * randomVariation) / 1000) * 1000;

        return {
          shopId: s.id,
          shopName: s.name,
          shopNameEn: s.nameEn,
          shopLogo: s.logo,
          shopColor: s.color,
          productTitle: `${query} (${s.nameEn})`,
          price: finalPrice,
          rating: s.rating,
          reviewsCount: s.reviews,
          inStock: true,
          deliveryTime: s.delivery,
          deliveryTimeEn: s.deliveryEn,
          shippingCost: s.shipping,
          url: s.url,
        };
      });

      // Mark the absolute cheapest and best rated
      let cheapestIdx = 0;
      let highestRatingIdx = 0;
      
      generated.forEach((item, idx) => {
        if (item.price < generated[cheapestIdx].price) cheapestIdx = idx;
        if (item.rating > generated[highestRatingIdx].rating) highestRatingIdx = idx;
      });

      generated[cheapestIdx].isCheapest = true;
      generated[highestRatingIdx].isBestValue = true;

      setResults(generated);
      setIsLoading(false);
    }, 600);
  };

  useEffect(() => {
    if (isOpen) {
      setSearchQuery(initialQuery);
      generateResults(initialQuery, targetPrice);
    }
  }, [isOpen, initialQuery, targetPrice]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      generateResults(searchQuery);
    }
  };

  // Sort and filter results
  const getProcessedResults = () => {
    let filtered = [...results];
    if (filterStore !== "all") {
      filtered = filtered.filter(r => r.shopId === filterStore);
    }

    if (sortBy === "price_asc") {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price_desc") {
      filtered.sort((a, b) => b.price - a.price);
    } else if (sortBy === "rating") {
      filtered.sort((a, b) => b.rating - a.rating);
    }

    return filtered;
  };

  if (!isOpen) return null;

  const processedResults = getProcessedResults();

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

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] z-10"
        >
          {/* Header */}
          <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#10b981] to-emerald-400 flex items-center justify-center text-zinc-950 font-black shadow-lg">
                <Store className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <span>{isFa ? "موتور جستجوی هوشمند گیفتی‌نو" : "Giftino Smart Price Engine"}</span>
                  <span className="text-[8px] bg-[#10b981]/15 text-[#10b981] px-1.5 py-0.5 rounded font-bold uppercase tracking-widest animate-pulse">PRO</span>
                </h3>
                <p className="text-[10px] text-zinc-400">
                  {isFa ? "مقایسه همزمان قیمت در فروشگاه‌های معتبر ایران" : "Real-time comparison across major Iranian stores"}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 bg-zinc-800/80 hover:bg-rose-500/20 text-zinc-300 hover:text-rose-400 border border-zinc-700/80 hover:border-rose-500/40 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 px-2.5 text-xs font-bold shadow-sm"
              title={isFa ? "بستن پنجره" : "Close window"}
            >
              <X className="w-3.5 h-3.5" />
              <span>{isFa ? "بستن" : "Close"}</span>
            </button>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="p-4 border-b border-zinc-800/60 bg-zinc-950/20">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isFa ? "نام کالا یا برند را جستجو کنید..." : "Search for gifts, brands, models..."}
                className="w-full pl-4 pr-11 py-3 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 focus:border-[#10b981]/50 text-xs font-bold text-white rounded-2xl outline-none transition-all placeholder-zinc-500 text-left rtl:text-right"
              />
              <button
                type="submit"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 bg-[#10b981] hover:bg-emerald-400 text-zinc-950 rounded-xl transition-all cursor-pointer shadow-md"
              >
                <Search className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>

          {/* Sorting & Filter Controls */}
          <div className="px-5 py-3 border-b border-zinc-800/40 flex flex-wrap items-center justify-between gap-3 bg-zinc-950/30">
            {/* Filters */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setFilterStore("all")}
                className={`px-3 py-1.5 rounded-xl text-[9px] font-bold transition-all cursor-pointer ${
                  filterStore === "all"
                    ? "bg-[#10b981] text-zinc-950"
                    : "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                }`}
              >
                {isFa ? "همه فروشگاه‌ها" : "All Stores"}
              </button>
              {Array.from(new Set(results.map((r) => JSON.stringify({ id: r.shopId, name: r.shopName, nameEn: r.shopNameEn })))).map((str) => {
                const store = JSON.parse(str);
                return (
                  <button
                    key={store.id}
                    onClick={() => setFilterStore(store.id)}
                    className={`px-3 py-1.5 rounded-xl text-[9px] font-bold transition-all cursor-pointer ${
                      filterStore === store.id
                        ? "bg-[#10b981] text-zinc-950"
                        : "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                    }`}
                  >
                    {isFa ? store.name : store.nameEn}
                  </button>
                );
              })}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-3.5 h-3.5 text-zinc-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-zinc-800 border border-zinc-700 rounded-xl px-2.5 py-1.5 text-[9.5px] font-black text-zinc-300 outline-none cursor-pointer focus:border-[#10b981]/50"
              >
                <option value="price_asc">{isFa ? "ارزان‌ترین به گران‌ترین" : "Price: Low to High"}</option>
                <option value="price_desc">{isFa ? "گران‌ترین به ارزان‌ترین" : "Price: High to Low"}</option>
                <option value="rating">{isFa ? "بیشترین رضایت خریداران" : "Customer Rating"}</option>
              </select>
            </div>
          </div>

          {/* Results Container */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3.5 min-h-[250px]">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-4">
                <div className="w-8 h-8 rounded-full border-2 border-zinc-700 border-t-[#10b981] animate-spin" />
                <p className="text-[10px] text-zinc-400 font-extrabold animate-pulse">
                  {isFa ? "درحال جستجوی زنده در غرفه‌ها و فروشگاه‌ها..." : "Searching lives stores and partners..."}
                </p>
              </div>
            ) : processedResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-2">
                <AlertCircle className="w-8 h-8 text-zinc-600" />
                <p className="text-[11px] font-bold text-zinc-400">{isFa ? "نتیجه‌ای یافت نشد" : "No results found"}</p>
                <p className="text-[9px] text-zinc-500 max-w-xs leading-normal">
                  {isFa ? "عبارت دیگری را جستجو کنید یا املای آن را بررسی نمایید." : "Try adjusting your search keywords to find better comparisons."}
                </p>
              </div>
            ) : (
              processedResults.map((item, idx) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  key={item.shopId}
                  className={`bg-zinc-950/40 border rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all hover:bg-zinc-950/80 ${item.shopColor} relative overflow-hidden`}
                >
                  {/* Badges */}
                  <div className="absolute top-0 right-0 flex gap-1">
                    {item.isCheapest && (
                      <span className="bg-emerald-500 text-zinc-950 text-[7.5px] font-black px-2 py-0.5 rounded-bl-lg uppercase tracking-wider flex items-center gap-0.5">
                        <TrendingDown className="w-2.5 h-2.5" />
                        {isFa ? "ارزان‌ترین گزینه" : "Cheapest Price"}
                      </span>
                    )}
                    {item.isBestValue && !item.isCheapest && (
                      <span className="bg-blue-500 text-white text-[7.5px] font-black px-2 py-0.5 rounded-bl-lg uppercase tracking-wider flex items-center gap-0.5">
                        <Sparkles className="w-2.5 h-2.5" />
                        {isFa ? "محبوب‌ترین غرفه" : "Top Rated"}
                      </span>
                    )}
                  </div>

                  {/* Store info & Rating */}
                  <div className="flex items-center gap-3.5">
                    <span className="text-3xl shrink-0 filter drop-shadow select-none">{item.shopLogo}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-xs font-black text-white leading-tight">
                          {isFa ? item.shopName : item.shopNameEn}
                        </h4>
                        <span className="text-[8.5px] text-zinc-500 font-mono">
                          ({isFa ? toPersianDigits(item.reviewsCount) : item.reviewsCount} {isFa ? "نظر" : "reviews"})
                        </span>
                      </div>
                      
                      {/* Rating stars */}
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-[9.5px] text-amber-400">★</span>
                        <span className="text-[9px] font-black text-zinc-300 font-mono">
                          {isFa ? toPersianDigits(item.rating.toFixed(1)) : item.rating.toFixed(1)}
                        </span>
                        <span className="text-zinc-700 text-[9px]">•</span>
                        <span className="text-[9px] text-zinc-400">
                          {isFa ? item.deliveryTime : item.deliveryTimeEn}
                        </span>
                      </div>

                      {/* Delivery cost */}
                      <p className="text-[9px] text-zinc-500 mt-0.5 flex items-center gap-1">
                        <span>📦</span>
                        <span>
                          {item.shippingCost === 0 
                            ? (isFa ? "ارسال رایگان" : "Free Shipping") 
                            : (isFa 
                              ? `هزینه ارسال: ${toPersianDigits(item.shippingCost.toLocaleString())} تومان` 
                              : `Shipping: ${item.shippingCost.toLocaleString()} Tomans`
                              )
                          }
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Price & Action */}
                  <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end sm:flex-col items-end gap-2 shrink-0 border-t border-zinc-900/60 sm:border-t-0 pt-3 sm:pt-0">
                    <div className="text-left sm:text-right">
                      <p className="text-[13px] font-mono font-black text-[#10b981] leading-none">
                        {isFa ? toPersianDigits(item.price.toLocaleString()) + " تومان" : item.price.toLocaleString() + " Tomans"}
                      </p>
                      <p className="text-[8.5px] text-zinc-500 mt-1">
                        {isFa ? "تضمین اصالت کالا" : "Verified Store"}
                      </p>
                    </div>

                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-800 hover:border-[#10b981]/30 text-[9.5px] font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <span>{isFa ? "خرید از فروشگاه" : "Buy Now"}</span>
                      <ExternalLink className="w-3 h-3 text-[#10b981]" />
                    </a>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* Footer banner */}
          <div className="p-3 bg-zinc-950/80 border-t border-zinc-800 flex items-center justify-center gap-1.5 text-center">
            <span className="text-emerald-500 text-[11px]">✨</span>
            <span className="text-[9px] font-medium text-zinc-400">
              {isFa 
                ? "سیستم بهینه‌ساز هوشمند گیفتی‌نو ارزان‌ترین فروشندگان آنلاین را به صورت زنده برای شما مرتب می‌کند."
                : "Giftino Smart Engine arranges the cheapest online sellers in real-time."}
            </span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
