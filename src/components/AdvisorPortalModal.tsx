import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, Check, ChevronLeft, ShieldCheck, UserCheck, 
  BarChart3, Plus, Share2, Award, Copy, ArrowRight, X, 
  ExternalLink, Zap, Star, Users, BookOpen, Layers, CheckCircle2
} from "lucide-react";
import { UserProfile, Language } from "../types";
import { toPersianDigits } from "../utils";

interface AdvisorPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onUpdateUser: (updated: UserProfile) => void;
  language: Language;
  onCreateCuratedGuide?: (title: string, category: string) => void;
}

export const AdvisorPortalModal: React.FC<AdvisorPortalModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpdateUser,
  language,
  onCreateCuratedGuide,
}) => {
  const isFa = language === "fa";

  const [activeTab, setActiveTab] = useState<"login" | "dashboard" | "benchmarks">(
    user.isAdvisor ? "dashboard" : "login"
  );

  // Form fields for Advisor Sign up / Login
  const [fullName, setFullName] = useState(user.name || "");
  const [phoneOrEmail, setPhoneOrEmail] = useState(user.phone || user.email || "");
  const [category, setCategory] = useState(user.advisorCategory || "گجت و تکنولوژی");
  const [bio, setBio] = useState(user.advisorBio || "کیوریتور و مشاور تخصصی انتخاب بهترین هدیه‌های مدرن");
  const [socialLink, setSocialLink] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Create Guide form fields
  const [guideTitle, setGuideTitle] = useState("");
  const [showCreateGuide, setShowCreateGuide] = useState(false);

  // Share Product form fields
  const [showShareProduct, setShowShareProduct] = useState(false);
  const [productTitle, setProductTitle] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productUrl, setProductUrl] = useState("");
  const [productNote, setProductNote] = useState("");
  const [productSuccess, setProductSuccess] = useState(false);

  if (!isOpen) return null;

  const handleActivateAdvisorMode = () => {
    const updated: UserProfile = {
      ...user,
      name: fullName.trim() || user.name || "مربی رسمی گیفتی‌نو",
      isAdvisor: true,
      advisorCategory: category,
      advisorBio: bio,
      advisorBadge: "مربی ارشد",
      advisorMetrics: user.advisorMetrics || {
        followersCount: 1420,
        guidesCount: 6,
        savedCount: 3890,
        matchRate: 98,
      },
    };
    onUpdateUser(updated);
    setIsSubmitted(true);
    setTimeout(() => {
      setActiveTab("dashboard");
      setIsSubmitted(false);
    }, 800);
  };

  const handleToggleAdvisorRole = () => {
    const updated: UserProfile = {
      ...user,
      isAdvisor: !user.isAdvisor,
      advisorBadge: !user.isAdvisor ? "مربی ارشد" : undefined,
    };
    onUpdateUser(updated);
  };

  const advisorShareUrl = `${window.location.origin}?advisor=${user.name ? encodeURIComponent(user.name) : "expert"}`;

  const handleCopyAdvisorLink = () => {
    navigator.clipboard.writeText(advisorShareUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center p-2 sm:p-4 z-[100000] overflow-hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-zinc-950 border border-zinc-800/90 rounded-3xl w-full max-w-lg shadow-[0_25px_80px_rgba(0,0,0,0.95)] text-right flex flex-col max-h-[88vh] sm:max-h-[82vh] overflow-hidden my-auto relative"
        style={{ direction: isFa ? "rtl" : "ltr" }}
      >
        {/* Sticky Header Bar */}
        <div className="bg-gradient-to-r from-emerald-950/90 via-zinc-900 to-zinc-950 p-3.5 sm:p-4 border-b border-zinc-800 flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#10b981]/20 border border-[#10b981]/40 text-[#10b981] flex items-center justify-center font-black text-lg shadow-inner shrink-0">
              👑
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5 flex-wrap">
                <span>{isFa ? "پورتال کیوریتورها و پیشنهاددهندگان کادوشناس" : "Gift Curator Portal"}</span>
                {user.isAdvisor && (
                  <span className="bg-blue-500/20 text-blue-400 border border-blue-500/40 text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Check className="w-3 h-3 text-blue-400" />
                    <span>{isFa ? "کیوریتور رسمی" : "Verified"}</span>
                  </span>
                )}
              </h3>
              <p className="text-[10px] text-zinc-400 font-medium mt-0.5">
                {isFa ? "راهنمای تخصصی خرید کادو، پورتال درآمدزایی و کیوریشن" : "Expert shopping guides & curator hub"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl border border-zinc-800 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sticky Tab Selection Bar */}
        <div className="flex border-b border-zinc-850 bg-zinc-900/60 p-1.5 gap-1 text-xs font-bold shrink-0 z-10">
          {user.isAdvisor && (
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "dashboard"
                  ? "bg-[#10b981] text-zinc-950 font-black shadow-md"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-850"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>{isFa ? "داشبورد کیوریتور" : "Dashboard"}</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab("login")}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "login"
                ? "bg-[#10b981] text-zinc-950 font-black shadow-md"
                : "text-zinc-400 hover:text-white hover:bg-zinc-850"
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>{isFa ? (user.isAdvisor ? "ویرایش مشخصات" : "ورود و ارتقا حساب") : "Sign Up / Upgrade"}</span>
          </button>

          <button
            onClick={() => setActiveTab("benchmarks")}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "benchmarks"
                ? "bg-[#10b981] text-zinc-950 font-black shadow-md"
                : "text-zinc-400 hover:text-white hover:bg-zinc-850"
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{isFa ? "الگوی اپ‌های موفق" : "Benchmark Standard"}</span>
          </button>
        </div>

        {/* Scrollable Body Container with Generous Bottom Clearance */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 pb-20 sm:pb-12">

          {/* TAB 1: DASHBOARD (Active Advisor) */}
          {activeTab === "dashboard" && user.isAdvisor && (
            <div className="space-y-4">
              {/* Profile Badge Card */}
              <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-emerald-950/40 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={user.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200"}
                      alt={user.name}
                      className="w-12 h-12 rounded-2xl object-cover border-2 border-[#10b981]"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-[10px] font-black border-2 border-zinc-950">
                      ✓
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-sm font-black text-white">{user.name}</h4>
                      <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded-md font-bold">
                        {user.advisorCategory || "کیوریتور ارشد"}
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-0.5 line-clamp-1">
                      {user.advisorBio || "مشاور انتخاب هدیه‌های کاربردی و خاص"}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleCopyAdvisorLink}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-[10px] font-bold flex items-center gap-1 border border-zinc-700 transition-all shrink-0 cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isCopied ? "کپی شد!" : "اشتراک لینک"}</span>
                </button>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-2xl text-center space-y-1">
                  <Users className="w-4 h-4 text-emerald-400 mx-auto" />
                  <p className="text-[10px] text-zinc-400 font-bold">{isFa ? "دنبال‌کنندگان" : "Followers"}</p>
                  <p className="text-sm font-black text-white font-mono">
                    {toPersianDigits((user.advisorMetrics?.followersCount || 1420).toLocaleString())}
                  </p>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-2xl text-center space-y-1">
                  <BookOpen className="w-4 h-4 text-amber-400 mx-auto" />
                  <p className="text-[10px] text-zinc-400 font-bold">{isFa ? "دفترچه راهنما" : "Guides"}</p>
                  <p className="text-sm font-black text-white font-mono">
                    {toPersianDigits((user.advisorMetrics?.guidesCount || 6).toString())}
                  </p>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-2xl text-center space-y-1">
                  <Star className="w-4 h-4 text-purple-400 mx-auto" />
                  <p className="text-[10px] text-zinc-400 font-bold">{isFa ? "ذخیره‌شده‌ها" : "Saves"}</p>
                  <p className="text-sm font-black text-white font-mono">
                    {toPersianDigits((user.advisorMetrics?.savedCount || 3890).toLocaleString())}
                  </p>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-2xl text-center space-y-1">
                  <Zap className="w-4 h-4 text-blue-400 mx-auto" />
                  <p className="text-[10px] text-zinc-400 font-bold">{isFa ? "نرخ تطابق" : "Match Rate"}</p>
                  <p className="text-sm font-black text-[#10b981] font-mono">
                    %{toPersianDigits((user.advisorMetrics?.matchRate || 98).toString())}
                  </p>
                </div>
              </div>

              {/* Creator Actions */}
              <div className="space-y-2.5 pt-2">
                <h5 className="text-xs font-black text-white flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{isFa ? "ابزارهای مربی کادوشناس" : "Advisor Curator Tools"}</span>
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    {isFa ? "فعال و آنلاین" : "Active"}
                  </span>
                </h5>

                {/* Action 1: Create Curated Guide */}
                <button
                  onClick={() => {
                    setShowCreateGuide(!showCreateGuide);
                    setShowShareProduct(false);
                  }}
                  className="w-full p-3 bg-zinc-900 hover:bg-zinc-850 border border-emerald-500/40 text-white font-bold rounded-2xl text-xs flex items-center justify-between transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-xl bg-[#10b981]/20 text-[#10b981] flex items-center justify-center font-bold">
                      <Plus className="w-4 h-4" />
                    </span>
                    <span className="group-hover:text-emerald-400 transition-colors">
                      {isFa ? "۱. ساخت دفترچه راهنمای جدید (کادو چی بخریم؟)" : "1. Create Curated Shopping Guide"}
                    </span>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-zinc-500 group-hover:text-emerald-400" />
                </button>

                {/* Create Guide Form */}
                <AnimatePresence>
                  {showCreateGuide && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-zinc-900/90 border border-zinc-800 p-3.5 rounded-2xl space-y-3 overflow-hidden text-xs"
                    >
                      <p className="text-[11px] font-bold text-zinc-300">
                        {isFa ? "عنوان دفترچه یا راهنمای خرید پیشنهادی:" : "Curated Guide Title:"}
                      </p>
                      <input
                        type="text"
                        value={guideTitle}
                        onChange={(e) => setGuideTitle(e.target.value)}
                        placeholder={isFa ? "مثلاً: ۱۰ پیشنهاد برتر خرید برای گجت‌بازها" : "e.g. Top 10 Tech Gift Recommendations"}
                        className="w-full bg-zinc-950 border border-zinc-800 focus:border-[#10b981] px-3 py-2 rounded-xl font-bold text-white outline-none"
                      />
                      <button
                        disabled={!guideTitle.trim()}
                        onClick={() => {
                          if (onCreateCuratedGuide) {
                            onCreateCuratedGuide(guideTitle, category);
                          }
                          setGuideTitle("");
                          setShowCreateGuide(false);
                        }}
                        className="w-full py-2.5 bg-[#10b981] hover:bg-emerald-400 disabled:bg-zinc-800 text-zinc-950 font-black rounded-xl transition-all cursor-pointer disabled:cursor-not-allowed shadow-md"
                      >
                        {isFa ? "انتشار دفترچه رسمی در تب ایده‌ها و پروفایل ✨" : "Publish Curated Guide ✨"}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Action 2: Direct Product Recommendation Share */}
                <button
                  onClick={() => {
                    setShowShareProduct(!showShareProduct);
                    setShowCreateGuide(false);
                  }}
                  className="w-full p-3 bg-zinc-900 hover:bg-zinc-850 border border-blue-500/40 text-white font-bold rounded-2xl text-xs flex items-center justify-between transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                      <ExternalLink className="w-4 h-4" />
                    </span>
                    <span className="group-hover:text-blue-400 transition-colors">
                      {isFa ? "۲. معرفی کالا و محصول پیشنهادی مربی (با لینک خرید)" : "2. Share Recommended Product with Store Link"}
                    </span>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-zinc-500 group-hover:text-blue-400" />
                </button>

                {/* Share Product Form */}
                <AnimatePresence>
                  {showShareProduct && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-zinc-900/90 border border-blue-500/30 p-3.5 rounded-2xl space-y-3 overflow-hidden text-xs"
                    >
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-300 block">
                          {isFa ? "نام محصول یا کالای پیشنهادی:" : "Product Name:"}
                        </label>
                        <input
                          type="text"
                          value={productTitle}
                          onChange={(e) => setProductTitle(e.target.value)}
                          placeholder={isFa ? "مثلاً: اسپرسوساز واکاکو نانوپرسو" : "e.g. Wacaco Nanopresso"}
                          className="w-full bg-zinc-950 border border-zinc-800 focus:border-blue-500 px-3 py-2 rounded-xl text-white outline-none font-bold"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-zinc-300 block">
                            {isFa ? "قیمت حدود (تومان):" : "Approx Price:"}
                          </label>
                          <input
                            type="text"
                            value={productPrice}
                            onChange={(e) => setProductPrice(e.target.value)}
                            placeholder={isFa ? "۳,۴۰۰,۰۰۰" : "3,400,000"}
                            className="w-full bg-zinc-950 border border-zinc-800 focus:border-blue-500 px-3 py-2 rounded-xl text-white outline-none font-mono"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-zinc-300 block">
                            {isFa ? "لینک فروشگاه (دیجی‌کالا / ترب):" : "Store Link:"}
                          </label>
                          <input
                            type="text"
                            value={productUrl}
                            onChange={(e) => setProductUrl(e.target.value)}
                            placeholder="https://digikala.com/..."
                            className="w-full bg-zinc-950 border border-zinc-800 focus:border-blue-500 px-3 py-2 rounded-xl text-white outline-none font-mono text-[10px]"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-300 block">
                          {isFa ? "توصیه و نظر کارشناسی مربی برای خریداران:" : "Advisor's Review & Advice:"}
                        </label>
                        <textarea
                          rows={2}
                          value={productNote}
                          onChange={(e) => setProductNote(e.target.value)}
                          placeholder={isFa ? "چرا این محصول ارزش خرید دارد و به چه کسانی پیشنهاد می‌کنید؟" : "Why you recommend this product..."}
                          className="w-full bg-zinc-950 border border-zinc-800 focus:border-blue-500 p-2.5 rounded-xl text-white outline-none text-xs leading-relaxed resize-none"
                        />
                      </div>

                      {productSuccess ? (
                        <div className="p-2.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 rounded-xl font-bold text-center text-xs flex items-center justify-center gap-1">
                          <Check className="w-4 h-4" />
                          <span>{isFa ? "محصول با موفقیت به عنوان پیشنهاد مربی ثبت و منتشر شد!" : "Product published successfully!"}</span>
                        </div>
                      ) : (
                        <button
                          disabled={!productTitle.trim()}
                          onClick={() => {
                            if (onCreateCuratedGuide) {
                              onCreateCuratedGuide(`پیشنهاد ویژه مربی: ${productTitle}`, category);
                            }
                            setProductSuccess(true);
                            setTimeout(() => {
                              setProductSuccess(false);
                              setProductTitle("");
                              setProductPrice("");
                              setProductUrl("");
                              setProductNote("");
                              setShowShareProduct(false);
                            }, 1500);
                          }}
                          className="w-full py-2.5 bg-blue-500 hover:bg-blue-400 disabled:bg-zinc-800 text-white font-black rounded-xl transition-all cursor-pointer disabled:cursor-not-allowed shadow-md"
                        >
                          {isFa ? "انتشار کارت پیشنهاد مربی و اشتراک لینک ✨" : "Publish Advisor Recommendation ✨"}
                        </button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Social One-Click Share Buttons for Advisor */}
                <div className="bg-zinc-900/80 border border-zinc-800 p-3 rounded-2xl space-y-2 text-xs">
                  <p className="text-[11px] font-bold text-white flex items-center gap-1.5">
                    <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{isFa ? "اشتراک‌گذاری مستقیم کانال و پیشنهادات مربی:" : "Share Advisor Recommendations:"}</span>
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <a
                      href={`https://t.me/share/url?url=${encodeURIComponent(advisorShareUrl)}&text=${encodeURIComponent(`پیشنهادهای خرید و کادوهای منتخب ${user.name} در گیفتی‌نو`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2 bg-sky-500/20 hover:bg-sky-500/30 text-sky-400 border border-sky-500/30 rounded-xl font-bold text-[10px] flex items-center justify-center gap-1 transition-all"
                    >
                      <span>✈️ تلگرام</span>
                    </a>
                    <a
                      href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`پیشنهادهای رسمی مربی کادوشناسی (${user.name}):\n${advisorShareUrl}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 rounded-xl font-bold text-[10px] flex items-center justify-center gap-1 transition-all"
                    >
                      <span>💬 واتساپ</span>
                    </a>
                    <button
                      type="button"
                      onClick={handleCopyAdvisorLink}
                      className="py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-xl font-bold text-[10px] flex items-center justify-center gap-1 transition-all cursor-pointer"
                    >
                      <Copy className="w-3 h-3 text-amber-400" />
                      <span>{isCopied ? "کپی شد" : "کپی لینک"}</span>
                    </button>
                  </div>
                </div>

                {/* Clear Step-by-Step Flow Explanation */}
                <div className="bg-zinc-900/60 border border-zinc-850 p-3.5 rounded-2xl space-y-2 text-xs">
                  <p className="text-[11px] font-black text-amber-400 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5" />
                    <span>{isFa ? "فرآیند انتشار و خرید پیشنهادهای مربی چگونه کار می‌کند؟" : "How Advisor Recommendations Work:"}</span>
                  </p>
                  <div className="space-y-1.5 text-[10.5px] text-zinc-300 leading-relaxed font-medium">
                    <div className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[9px] flex items-center justify-center shrink-0 mt-0.5">۱</span>
                      <p><strong>ثبت پیشنهاد:</strong> مربی محصول یا دفترچه راهنمای خرید را با توضیحات و لینک خرید ثبت می‌کند.</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-400 font-bold text-[9px] flex items-center justify-center shrink-0 mt-0.5">۲</span>
                      <p><strong>نمایش همگانی:</strong> پیشنهاد در تب <strong>«ایده‌ها»</strong>، پروفایل عمومی مربی و تب <strong>«دوستان»</strong> با نشان تخصصی تایید شده قرار می‌گیرد.</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 font-bold text-[9px] flex items-center justify-center shrink-0 mt-0.5">۳</span>
                      <p><strong>خرید مستقیم:</strong> خریداران می‌توانند کالا را با ۱ کلیک به لیست خود اضافه کرده یا از لینک فروشگاه خریداری کنند.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SIGN UP / LOGIN FORM */}
          {(activeTab === "login" || !user.isAdvisor) && (
            <div className="space-y-4">
              {/* Intro Hero Box */}
              <div className="bg-gradient-to-r from-emerald-950/60 via-zinc-900 to-zinc-900 border border-emerald-500/30 p-3.5 rounded-2xl space-y-2">
                <p className="text-xs text-white font-bold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>{isFa ? "به جمع کادوشناس‌ها و مربیان خرید گیفتی‌نو بپیوندید" : "Join Giftino Certified Advisors"}</span>
                </p>
                <p className="text-[11px] text-zinc-300 leading-relaxed">
                  {isFa
                    ? "اگر در انتخاب کادو، معرفی گجت، استایل یا هدایای خاص مهارت دارید، پروفایل مربیگری خود را فعال کنید و لیست‌های پیشنهادی معتبر بسازید."
                    : "If you excel at picking thoughtful gifts or tech gadgets, activate your advisor profile and curate shopping guides."}
                </p>
              </div>

              {/* Colored 4 Benchmark Highlights (At a glance) */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-black text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>{isFa ? "مزایای ۴ گانه حساب مربی رسمی در یک نگاه:" : "4 Pillars of Verified Advisor Profile:"}</span>
                </p>
                <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                  <div className="bg-emerald-950/40 border border-emerald-500/30 p-2 rounded-xl flex items-center gap-1.5 text-emerald-300 font-bold">
                    <span>🟢 ۱. تیک آبی اعتبارسنجی</span>
                  </div>
                  <div className="bg-purple-950/40 border border-purple-500/30 p-2 rounded-xl flex items-center gap-1.5 text-purple-300 font-bold">
                    <span>🟣 ۲. داشبورد اختصاصی آمار</span>
                  </div>
                  <div className="bg-blue-950/40 border border-blue-500/30 p-2 rounded-xl flex items-center gap-1.5 text-blue-300 font-bold">
                    <span>🔵 ۳. درآمدزایی و لینک افیلیت</span>
                  </div>
                  <div className="bg-amber-950/40 border border-amber-500/30 p-2 rounded-xl flex items-center gap-1.5 text-amber-300 font-bold">
                    <span>🟡 ۴. ارتقای ۱-کلیکی حساب</span>
                  </div>
                </div>
              </div>

              {/* Form Controls */}
              <div className="space-y-3 pt-1">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 block">
                    {isFa ? "نام کامل یا برند شخصی مربی:" : "Advisor Full Name / Brand:"}
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={isFa ? "مثلاً: مهندس حمیدرضا قاسمی (مربی تکنولوژی)" : "e.g., Hamidreza Ghasemi (Tech Curator)"}
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-[#10b981] px-3.5 py-2.5 rounded-xl text-xs font-bold text-white outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 block">
                    {isFa ? "شماره تماس یا ایمیل مربی:" : "Phone or Email:"}
                  </label>
                  <input
                    type="text"
                    value={phoneOrEmail}
                    onChange={(e) => setPhoneOrEmail(e.target.value)}
                    placeholder={isFa ? "۰۹۱۲۳۴۵۶۷۸۹ یا hamidreza.qasemi@gmail.com" : "email or phone"}
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-[#10b981] px-3.5 py-2.5 rounded-xl text-xs font-bold text-white outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 block">
                    {isFa ? "حوزه تخصصی پیشنهاد کادو:" : "Specialized Gift Category:"}
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-[#10b981] px-3.5 py-2.5 rounded-xl text-xs font-bold text-white outline-none"
                  >
                    <option value="گجت و تکنولوژی">{isFa ? "گجت و تکنولوژی 🎧" : "Tech & Gadgets"}</option>
                    <option value="زیبایی، عطر و استایل">{isFa ? "زیبایی، عطر و استایل 💄" : "Beauty & Style"}</option>
                    <option value="خانه، آشپزی و لایف‌استایل">{isFa ? "خانه، آشپزی و لایف‌استایل ☕" : "Home & Lifestyle"}</option>
                    <option value="کتاب، هنر و سرگرمی">{isFa ? "کتاب، هنر و سرگرمی 📚" : "Books & Arts"}</option>
                    <option value="کودک، بازی و سرگرمی">{isFa ? "کودک، بازی و سرگرمی 🧸" : "Kids & Toys"}</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 block">
                    {isFa ? "بیو و معرفی کوتاه مربی:" : "Advisor Bio:"}
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={2}
                    placeholder={isFa ? "درباره تجربه و سلیقه شما در راهنمایی خرید..." : "Tell users about your style expertise..."}
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-[#10b981] p-3 rounded-xl text-xs font-bold text-white outline-none resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 block">
                    {isFa ? "لینک اینستاگرام یا کانال تلگرام (اختیاری):" : "Social Link (Optional):"}
                  </label>
                  <input
                    type="text"
                    value={socialLink}
                    onChange={(e) => setSocialLink(e.target.value)}
                    placeholder="https://instagram.com/my_page"
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-[#10b981] px-3.5 py-2.5 rounded-xl text-xs font-bold text-white outline-none dir-ltr"
                  />
                </div>
              </div>

              {/* Primary Submit Button - Highlighted and Ample Clearance */}
              <div className="pt-2 space-y-2">
                <button
                  onClick={handleActivateAdvisorMode}
                  className="w-full py-3.5 bg-[#10b981] hover:bg-emerald-400 text-zinc-950 font-black text-xs rounded-2xl shadow-[0_10px_25px_rgba(16,185,129,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitted ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{isFa ? "پروفایل مربی با موفقیت فعال شد!" : "Advisor Activated!"}</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>{isFa ? "تأیید و ارتقا فوری به حساب مربی کادوشناس 🚀" : "Confirm & Activate Advisor Account 🚀"}</span>
                    </>
                  )}
                </button>

                {user.isAdvisor && (
                  <button
                    onClick={handleToggleAdvisorRole}
                    className="w-full py-2 bg-zinc-900 hover:bg-zinc-850 text-rose-400 text-[10.5px] font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    {isFa ? "غیرفعال‌سازی موقت نقش مربیگری" : "Deactivate Advisor Profile"}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: BENCHMARK STANDARDS */}
          {activeTab === "benchmarks" && (
            <div className="space-y-3.5 text-xs leading-relaxed">
              <div className="bg-gradient-to-r from-amber-950/40 via-zinc-900 to-zinc-900 border border-amber-500/30 p-3.5 rounded-2xl space-y-1.5">
                <h4 className="font-black text-white text-xs flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>{isFa ? "الگوی پرو و موفق اپلیکیشن‌های بین‌المللی" : "Benchmark Creator Standards"}</span>
                </h4>
                <p className="text-[11px] text-zinc-300">
                  {isFa
                    ? "در اپ‌های برتر دنیا مانند ShopMy, Giftful, LTK و Pinterest Creator Hub، ساختار پروفایل و لاگین مربیان شامل ۴ رکن اصلی زیر است:"
                    : "Top global apps (ShopMy, Giftful, LTK) use 4 core pillars for Advisor & Curator profiles:"}
                </p>
              </div>

              {/* 4 Colored Benchmark Pillar Cards */}
              <div className="space-y-2.5 text-[11px]">
                {/* 1. Green Card */}
                <div className="bg-gradient-to-r from-emerald-950/60 to-zinc-900 border border-emerald-500/40 p-3.5 rounded-2xl space-y-1.5 shadow-md">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-xs">
                      ۱
                    </span>
                    <p className="font-black text-emerald-400 text-xs">
                      {isFa ? "نشان تیک آبی و اعتبارسنجی (Verified Badge)" : "Verified Badge & Domain Focus"}
                    </p>
                  </div>
                  <p className="text-zinc-300 text-[10.5px] leading-relaxed pr-8">
                    {isFa
                      ? "مربیان دارای نشان تیک آبی مشخص، حوزه تخصصی (مثلاً گجت، زیبایی، عطر) و بیوگرافی حرفه‌ای برای جلب اعتماد خریداران کادو هستند."
                      : "Verified advisors hold official badges, primary categories, and short expertise bios."}
                  </p>
                </div>

                {/* 2. Purple Card */}
                <div className="bg-gradient-to-r from-purple-950/60 to-zinc-900 border border-purple-500/40 p-3.5 rounded-2xl space-y-1.5 shadow-md">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-black text-xs">
                      ۲
                    </span>
                    <p className="font-black text-purple-400 text-xs">
                      {isFa ? "داشبورد اختصاصی آمار و تعامل (Curator Analytics)" : "Curator Analytics Dashboard"}
                    </p>
                  </div>
                  <p className="text-zinc-300 text-[10.5px] leading-relaxed pr-8">
                    {isFa
                      ? "نمایش هوشمند تعداد ذخیره شدن پیشنهادها توسط کاربران، نرخ تطابق کادوها (Gift Match Rate) و محبوبیت لیست‌های راهنمای مربی."
                      : "Real-time stats showing saves count, follower growth, and Gift Match Rate score."}
                  </p>
                </div>

                {/* 3. Blue Card */}
                <div className="bg-gradient-to-r from-blue-950/60 to-zinc-900 border border-blue-500/40 p-3.5 rounded-2xl space-y-1.5 shadow-md">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-black text-xs">
                      ۳
                    </span>
                    <p className="font-black text-blue-400 text-xs">
                      {isFa ? "لینک‌های خرید اختصاصی و افیلیت (Affiliate Integration)" : "Affiliate & Store Referral Links"}
                    </p>
                  </div>
                  <p className="text-zinc-300 text-[10.5px] leading-relaxed pr-8">
                    {isFa
                      ? "امکان اتصال مستقیم هدایای پیشنهادی به فروشگاه‌های آنلاین (دیجی‌کالا، ترب، تکنولایف) با کد تخفیف یا لینک اختصاصی کسب درآمد مربی."
                      : "Direct affiliate linking with Digikala, Torob, and custom stores for monetized referrals."}
                  </p>
                </div>

                {/* 4. Amber Card */}
                <div className="bg-gradient-to-r from-amber-950/60 to-zinc-900 border border-amber-500/40 p-3.5 rounded-2xl space-y-1.5 shadow-md">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-xs">
                      ۴
                    </span>
                    <p className="font-black text-amber-400 text-xs">
                      {isFa ? "ورود و احراز هویت سریع (1-Click Advisor Onboarding)" : "1-Click Advisor Onboarding"}
                    </p>
                  </div>
                  <p className="text-zinc-300 text-[10.5px] leading-relaxed pr-8">
                    {isFa
                      ? "احراز هویت بدون فرم‌های طولانی، با قابلیت ارتقای ۱-کلیکی حساب کاربری معمولی به حساب رسمی مربیگری کادوشناس."
                      : "Instant conversion from standard account to verified advisor profile without complex paperwork."}
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>
      </motion.div>
    </div>
  );
};
