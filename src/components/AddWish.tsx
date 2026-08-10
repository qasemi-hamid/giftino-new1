import React, { useState } from "react";
import { Wishlist, WishlistItem, Language } from "../types";
import { 
  Plus, Search, Globe, Chrome, X, Check, ArrowRight, Sparkles, Loader2,
  Clipboard, Camera, Image, Upload
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toPersianDigits, formatTomanToWords } from "../utils";

interface AddWishProps {
  wishlists: Wishlist[];
  onUpdateWishlists: (updated: Wishlist[]) => void;
  language: Language;
  onNavigateToExplore: () => void;
  onSuccessRedirect: () => void;
}

export default function AddWish({
  wishlists,
  onUpdateWishlists,
  language,
  onNavigateToExplore,
  onSuccessRedirect
}: AddWishProps) {
  const [pasteUrl, setPasteUrl] = useState("");
  const [showExtensionBanner, setShowExtensionBanner] = useState(true);
  const [showFullForm, setShowFullForm] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Search by Photo Simulation states
  const [showPhotoSheet, setShowPhotoSheet] = useState(false);
  const [photoAnalyzing, setPhotoAnalyzing] = useState(false);
  const [showPhotoSelector, setShowPhotoSelector] = useState(false);

  // Form Fields
  const [targetListId, setTargetListId] = useState(wishlists.length > 0 ? wishlists[0].id : "");
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [priority, setPriority] = useState<WishlistItem["priority"]>("medium");
  const [successMsg, setSuccessMsg] = useState("");

  const isFa = language === "fa";

  // Simulate clipboard reading
  const handleClipboardPaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim().startsWith("http")) {
        setPasteUrl(text.trim());
      } else {
        setPasteUrl("https://www.digikala.com/product/dkp-129381/apple-watch-ultra-2");
      }
    } catch (e) {
      // Fallback
      setPasteUrl("https://www.technolife.ir/product-8271/haylou-wireless-headphone-max-pro");
    }
  };

  // Quick link auto-detection simulator
  const handleNextWithLink = () => {
    if (!pasteUrl.trim()) {
      alert(isFa ? "لطفاً ابتدا لینک محصول را وارد کنید." : "Please paste a product link first.");
      return;
    }

    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setShowFullForm(true);

      const url = pasteUrl.toLowerCase();
      if (url.includes("digikala.com")) {
        setTitle(isFa ? "ساعت هوشمند طرح اپل‌واچ کینگ‌ور ⌚" : "Smart Watch Series Apple Design ⌚");
        setPrice("1850000");
        setNotes(isFa ? "از تخفیف شگفت‌انگیز همکار دیجی‌کالا انتخاب شد." : "Selected from Digikala partner deals.");
      } else if (url.includes("technolife.ir")) {
        setTitle(isFa ? "هدفون بی‌سیم هایلو مکس پرو 🎧" : "Haylou Wireless Headphone Max Pro 🎧");
        setPrice("1450000");
        setNotes(isFa ? "رنگ سورمه‌ای یا مشکی مات ترجیحاً." : "Navy blue or matte black preferred.");
      } else {
        setTitle(isFa ? "کالای پیوند شده با ارزش 🔗" : "Linked Curated Desire 🔗");
        setNotes(isFa ? `پیوند ارسالی: ${pasteUrl}` : `Pasted URL: ${pasteUrl}`);
      }
    }, 1200);
  };

  const handleManualTrigger = () => {
    setShowFullForm(true);
    setTitle("");
    setPrice("");
    setNotes("");
    setPasteUrl("");
  };

  const handleSelectMockPhoto = (mockTitle: string, mockPrice: string, mockNotes: string, mockUrl: string) => {
    setPhotoAnalyzing(true);
    setTimeout(() => {
      setPhotoAnalyzing(false);
      setShowPhotoSheet(false);
      setShowPhotoSelector(false);
      setShowFullForm(true);
      setTitle(mockTitle);
      setPrice(mockPrice);
      setNotes(mockNotes);
      setPasteUrl(mockUrl);
    }, 1500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const listId = targetListId || (wishlists.length > 0 ? wishlists[0].id : "");
    if (!listId) {
      alert(isFa ? "لطفاً ابتدا یک لیست مناسبت بسازید!" : "Please create a wishlist first!");
      return;
    }

    const newItem: WishlistItem = {
      id: "item_" + Date.now(),
      title: title.trim(),
      price: price ? parseInt(price) : undefined,
      link: pasteUrl || undefined,
      notes: notes.trim() || undefined,
      priority,
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
    setSuccessMsg(isFa ? "✨ آرزو با موفقیت اضافه شد!" : "✨ Wish saved successfully!");

    // Reset Form
    setTitle("");
    setPrice("");
    setNotes("");
    setPasteUrl("");
    setShowFullForm(false);

    setTimeout(() => {
      setSuccessMsg("");
      onSuccessRedirect();
    }, 1500);
  };

  return (
    <div className="max-w-md mx-auto space-y-6 select-none" style={{ direction: isFa ? "rtl" : "ltr" }}>
      
      <div className="text-center space-y-1.5">
        <h2 className="text-xl font-black text-white">{isFa ? "افزودن آرزو" : "Add Wish"}</h2>
        <p className="text-xs text-zinc-400">
          {isFa ? "اقلام مورد علاقه خود را ثبت کنید تا دیگران برای شما بخرند." : "Add items you'd love to receive so others can claim them."}
        </p>
      </div>

      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-extrabold text-xs rounded-2xl flex items-center gap-2"
          >
            <Check className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div id="tour-add-gift" className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 md:p-8 space-y-6">
        
        {/* If the manual/auto full form is not yet shown, show the standard URL box from Screenshot 3 */}
        {!showFullForm ? (
          <div className="space-y-6">
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-400 block uppercase tracking-wider">
                {isFa ? "چسباندن لینک محصول" : "Paste a link from anywhere"}
              </label>
              <div className="flex gap-2 items-center">
                <div className="relative flex-1 flex items-center bg-zinc-950 border border-zinc-800 focus-within:border-[#10b981] rounded-2xl p-1 transition-all">
                  <input
                    type="url"
                    placeholder="https://"
                    value={pasteUrl}
                    onChange={(e) => setPasteUrl(e.target.value)}
                    className="w-full py-3 pr-4 pl-3 bg-transparent text-xs text-white outline-none font-mono"
                  />
                </div>

                {/* Paste Button from Clipboard */}
                <button
                  type="button"
                  onClick={handleClipboardPaste}
                  title={isFa ? "جایگذاری لینک" : "Paste Link"}
                  className="p-3 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 hover:text-[#10b981] text-zinc-400 rounded-2xl transition-all cursor-pointer"
                >
                  <Clipboard className="w-4 h-4" />
                </button>

                {/* Search by Photo button */}
                <button
                  type="button"
                  onClick={() => setShowPhotoSheet(true)}
                  title={isFa ? "جستجو با عکس کادو" : "Search by Photo"}
                  className="p-3 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 hover:text-[#10b981] text-zinc-400 rounded-2xl transition-all cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Next Button / Analyze */}
            <button
              onClick={handleNextWithLink}
              disabled={isAnalyzing}
              className="w-full py-3.5 bg-white text-zinc-950 hover:bg-zinc-100 disabled:bg-zinc-800 disabled:text-zinc-500 font-black text-xs rounded-2xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-zinc-500" />
                  <span>{isFa ? "در حال تحلیل فروشگاه..." : "Analyzing Store..."}</span>
                </>
              ) : (
                <>
                  <span>{isFa ? "بعدی" : "Next"}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>

            {/* Find Ideas Button */}
            <button
              onClick={onNavigateToExplore}
              className="w-full py-3.5 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Search className="w-4 h-4 text-[#10b981]" />
              <span>{isFa ? "یافتن ایده‌های کادو کادو" : "Find Ideas"}</span>
            </button>

            {/* Add manually link */}
            <div className="text-center pt-2">
              <button
                onClick={handleManualTrigger}
                className="text-xs text-zinc-400 hover:text-[#10b981] underline font-bold transition-colors cursor-pointer"
              >
                {isFa ? "لینک ندارید؟ ثبت به صورت دستی" : "Don't have a link? Add Manually"}
              </button>
            </div>

          </div>
        ) : (
          /* Full manual / auto-filled form */
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex justify-between items-center pb-1 border-b border-zinc-800/60 mb-2">
              <span className="text-[10px] text-zinc-400 font-bold">{isFa ? "فرم جزئیات آرزو" : "Wish Details Form"}</span>
              <button 
                type="button" 
                onClick={() => setShowFullForm(false)}
                className="text-zinc-500 hover:text-white"
              >
                {isFa ? "تغییر به لینک" : "Pasted link instead"}
              </button>
            </div>

            {/* Target List Dropdown */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-400 block uppercase">{isFa ? "انتخاب لیست" : "Add to Registry"}</label>
              <select
                value={targetListId}
                onChange={(e) => setTargetListId(e.target.value)}
                className="w-full text-xs bg-zinc-950 border border-zinc-850 rounded-xl p-3 text-white outline-none focus:border-[#10b981]"
              >
                {wishlists.map((wl) => (
                  <option key={wl.id} value={wl.id}>
                    {wl.title} ({wl.occasionDate})
                  </option>
                ))}
              </select>
            </div>

            {/* Title */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-400 block uppercase">{isFa ? "عنوان آرزو" : "Gift Title"}</label>
              <input
                type="text"
                required
                placeholder={isFa ? "مثال: کیبورد مکانیکال" : "e.g., Mechanical Keyboard"}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-xs bg-zinc-950 border border-zinc-850 rounded-xl p-3 text-white outline-none focus:border-[#10b981]"
              />
            </div>

            {/* Price */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-400 block uppercase">{isFa ? "قیمت تقریبی (تومان)" : "Price (Toman)"}</label>
              <input
                type="number"
                placeholder="مثال: 450000"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full text-xs bg-zinc-950 border border-zinc-850 rounded-xl p-3 text-white outline-none focus:border-[#10b981] font-mono"
              />
              {price && (
                <p className="text-[9px] text-[#10b981] font-bold leading-none mt-1">
                  {isFa ? formatTomanToWords(parseInt(price)) : parseInt(price).toLocaleString() + " Tomans"}
                </p>
              )}
            </div>

            {/* Priority */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-400 block uppercase">{isFa ? "درجه اهمیت" : "Priority"}</label>
              <div className="grid grid-cols-3 gap-2">
                {(["low", "medium", "high"] as const).map((pri) => (
                  <button
                    key={pri}
                    type="button"
                    onClick={() => setPriority(pri)}
                    className={`py-2 rounded-xl text-[10px] font-bold transition-all border cursor-pointer ${
                      priority === pri 
                        ? "bg-[#10b981] text-zinc-950 border-[#10b981]" 
                        : "bg-zinc-950 border-zinc-850 text-zinc-400"
                    }`}
                  >
                    {pri === "high" ? (isFa ? "ضروری" : "High") : pri === "medium" ? (isFa ? "متوسط" : "Medium") : (isFa ? "کم" : "Low")}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-400 block uppercase">{isFa ? "یادداشت و جزئیات بیشتر" : "Add Notes"}</label>
              <textarea
                rows={2}
                placeholder={isFa ? "مثلاً رنگ خاکستری تیره مایل هستم..." : "e.g. Space gray color preferred..."}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-xs bg-zinc-950 border border-zinc-850 rounded-xl p-3 text-white outline-none focus:border-[#10b981] resize-none"
              />
            </div>

            {/* Save Button */}
            <button
              type="submit"
              className="w-full py-3.5 bg-[#10b981] text-zinc-950 font-black text-xs rounded-xl hover:bg-emerald-400 transition-all cursor-pointer shadow-md uppercase tracking-wider"
            >
              {isFa ? "💾 ثبت آرزو" : "💾 Save Wish"}
            </button>
          </form>
        )}

      </div>

      {/* Dismissible extension promotion prompt at the bottom - Exactly like Screenshot 3 */}
      {showExtensionBanner && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl relative overflow-hidden flex items-start gap-3"
        >
          <div className="w-8 h-8 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center shrink-0">
            <Chrome className="w-4.5 h-4.5 text-[#10b981]" />
          </div>
          <div className="flex-1 space-y-1 min-w-0 pr-6">
            <h4 className="text-[11px] font-bold text-white">
              {isFa ? "افزودن مستقیم کادو از کل سطح وب!" : "Add items from any store instantly!"}
            </h4>
            <p className="text-[9px] text-zinc-500 leading-normal">
              {isFa 
                ? "با نصب افزونه گوگل کروم گیفتی‌نو، کادوها را بدون ترک صفحات خرید مستقیماً ذخیره کنید." 
                : "Install our free Chrome Extension to snap product desires instantly while shopping."}
            </p>
            <a 
              href="https://chrome.google.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[9px] text-[#10b981] font-bold hover:underline inline-block pt-0.5"
            >
              {isFa ? "دانلود رایگان افزونه کروم" : "Install Chrome Extension (free)"}
            </a>
          </div>
          <button
            onClick={() => setShowExtensionBanner(false)}
            className="absolute top-3 right-3 text-zinc-600 hover:text-zinc-300 transition-colors p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      )}

      {/* Search by Photo Bottom Sheet/Modal */}
      <AnimatePresence>
        {showPhotoSheet && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end justify-center z-50">
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-zinc-900 border-t border-zinc-850 rounded-t-[32px] w-full max-w-md p-6 pb-8 space-y-6 select-none"
            >
              <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-[#10b981]" />
                  <h3 className="text-xs font-black text-white">
                    {isFa ? "جستجو با عکس کادو" : "Search by Photo"}
                  </h3>
                </div>
                <button
                  onClick={() => { setShowPhotoSheet(false); setShowPhotoSelector(false); }}
                  className="p-1 text-zinc-500 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {photoAnalyzing ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-4">
                  <Loader2 className="w-8 h-8 animate-spin text-[#10b981]" />
                  <p className="text-xs text-zinc-400 font-bold animate-pulse text-center">
                    {isFa ? "در حال آنالیز عکس با هوش مصنوعی جمینای..." : "Analyzing photo with Gemini AI..."}
                  </p>
                  <p className="text-[10px] text-zinc-500 text-center">
                    {isFa ? "شناسایی کادو، محدوده قیمت تقریبی و مناسبت‌ها" : "Extracting title, price range and suggestions"}
                  </p>
                </div>
              ) : !showPhotoSelector ? (
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setShowPhotoSelector(true)}
                    className="flex flex-col items-center justify-center gap-3 p-6 bg-zinc-950 border border-zinc-800 hover:border-[#10b981] rounded-2xl group transition-all cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400 group-hover:text-[#10b981] transition-colors">
                      <Camera className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-black text-white">
                      {isFa ? "گرفتن عکس جدید" : "Take Photo"}
                    </span>
                  </button>

                  <button
                    onClick={() => setShowPhotoSelector(true)}
                    className="flex flex-col items-center justify-center gap-3 p-6 bg-zinc-950 border border-zinc-800 hover:border-[#10b981] rounded-2xl group transition-all cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400 group-hover:text-[#10b981] transition-colors">
                      <Image className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-black text-white">
                      {isFa ? "انتخاب از گالری گوشی" : "Choose from Library"}
                    </span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">
                      {isFa ? "یک عکس فرضی را جهت شبیه‌سازی اسکن انتخاب کنید:" : "Select a mock photo to scan & test:"}
                    </span>
                    <button
                      onClick={() => setShowPhotoSelector(false)}
                      className="text-[10px] text-[#10b981] hover:underline font-bold"
                    >
                      {isFa ? "بازگشت" : "Go Back"}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div
                      onClick={() => handleSelectMockPhoto(
                        isFa ? "کتاب هوش مصنوعی: رویکردی نوین هریسون 📘" : "Artificial Intelligence: A Modern Approach Book 📘",
                        "350000",
                        isFa ? "شناسایی شده از عکس کتاب در گالری. نسخه فیزیکی چاپ جدید ترجیحا" : "Extracted from book cover picture. Hardcover preferred",
                        "https://www.digikala.com/product/dkp-1102938/ai-book"
                      )}
                      className="bg-zinc-950 border border-zinc-850 hover:border-[#10b981] p-3 rounded-2xl cursor-pointer transition-all space-y-2 text-center group"
                    >
                      <div className="aspect-square bg-zinc-900 rounded-xl flex items-center justify-center text-3xl group-hover:scale-105 transition-transform">
                        📘
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-white truncate">
                          {isFa ? "کتاب هوش مصنوعی" : "AI Approach Book"}
                        </p>
                        <p className="text-[9px] text-[#10b981] font-bold">۳۵۰,۰۰۰ تومان</p>
                      </div>
                    </div>

                    <div
                      onClick={() => handleSelectMockPhoto(
                        isFa ? "ساعت هوشمند طرح اپل‌واچ کینگ‌ور ⌚" : "Kingwear Smartwatch Apple-Design ⌚",
                        "1850000",
                        isFa ? "شناسایی شده از روی تصویر اسکن شده. رنگ مشکی" : "Extracted from captured wrist shot. Black color",
                        "https://www.technolife.ir/product-9382/kingwear-smartwatch"
                      )}
                      className="bg-zinc-950 border border-zinc-850 hover:border-[#10b981] p-3 rounded-2xl cursor-pointer transition-all space-y-2 text-center group"
                    >
                      <div className="aspect-square bg-zinc-900 rounded-xl flex items-center justify-center text-3xl group-hover:scale-105 transition-transform">
                        ⌚
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-white truncate">
                          {isFa ? "ساعت هوشمند" : "Smart Watch"}
                        </p>
                        <p className="text-[9px] text-[#10b981] font-bold">۱,۸۵۰,۰۰۰ تومان</p>
                      </div>
                    </div>

                    <div
                      onClick={() => handleSelectMockPhoto(
                        isFa ? "هدفون بی‌سیم هایلو مکس پرو 🎧" : "Haylou Wireless Headphone 🎧",
                        "1450000",
                        isFa ? "شناسایی شده از روی تصویر هدفون بلوتوثی." : "Extracted from bluetooth headphones scan.",
                        "https://www.technolife.ir/product-8271/haylou-wireless-headphone"
                      )}
                      className="bg-zinc-950 border border-zinc-850 hover:border-[#10b981] p-3 rounded-2xl cursor-pointer transition-all space-y-2 text-center group"
                    >
                      <div className="aspect-square bg-zinc-900 rounded-xl flex items-center justify-center text-3xl group-hover:scale-105 transition-transform">
                        🎧
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-white truncate">
                          {isFa ? "هدفون بی‌سیم" : "Wireless Headphone"}
                        </p>
                        <p className="text-[9px] text-[#10b981] font-bold">۱,۴۵۰,۰۰۰ تومان</p>
                      </div>
                    </div>

                    <div
                      onClick={() => handleSelectMockPhoto(
                        isFa ? "آباژور رومیزی چوبی با شید کنفی 🕯️" : "Minimal Wood Table Lamp 🕯️",
                        "540000",
                        isFa ? "شناسایی شده از عکس دکوراسیون اتاق." : "Extracted from cozy home room design image.",
                        "https://www.digikala.com/product/dkp-482910/minimal-lamp"
                      )}
                      className="bg-zinc-950 border border-zinc-850 hover:border-[#10b981] p-3 rounded-2xl cursor-pointer transition-all space-y-2 text-center group"
                    >
                      <div className="aspect-square bg-zinc-900 rounded-xl flex items-center justify-center text-3xl group-hover:scale-105 transition-transform">
                        🕯️
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-white truncate">
                          {isFa ? "آباژور رومیزی" : "Minimal Lamp"}
                        </p>
                        <p className="text-[9px] text-[#10b981] font-bold">۵۴۰,۰۰۰ تومان</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
