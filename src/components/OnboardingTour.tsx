import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, ChevronRight, ChevronLeft, X, Gift, Brain, Share2, HelpCircle } from "lucide-react";
import { Language } from "../types";

interface OnboardingTourProps {
  language: Language;
  active: boolean;
  currentStep: number;
  setCurrentStep: React.Dispatch<React.SetStateAction<number>>;
  onClose: () => void;
  setActiveTab?: (tab: string) => void;
}

interface TourStep {
  target: string;
  titleFa: string;
  titleEn: string;
  textFa: string;
  textEn: string;
  icon: React.ReactNode;
}

export default function OnboardingTour({ 
  language, 
  active, 
  currentStep, 
  setCurrentStep, 
  onClose,
  setActiveTab
}: OnboardingTourProps) {
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const isFa = language === "fa";

  const steps: TourStep[] = [
    {
      target: "tour-welcome",
      titleFa: "به گیفتی‌نو خوش آمدید! 🌸✨",
      titleEn: "Welcome to Giftino! 🌸✨",
      textFa: "گیفتی‌نو یک پلتفرم فوق‌العاده شیک و مدرن برای ثبت آرزوها، برنامه‌ریزی جشن‌ها و اشتراک‌گذاری کادوهای دلخواه با دوستان است. بیایید در ۸ مرحله کوتاه، امکانات جادویی آن را کشف کنیم!",
      textEn: "Giftino is an elegant, modern platform to log your wishes, plan milestones, and share registries with your friends. Let's explore its magical features in 8 short steps!",
      icon: <Sparkles className="w-5 h-5 text-[#b48d57]" />,
    },
    {
      target: "tour-wishlists",
      titleFa: "جشن‌ها و مناسبت‌های شما 🎂🎈",
      titleEn: "Your Event Wishlists 🎂🎈",
      textFa: "در این بخش می‌توانید برای مناسبت‌های مختلف مثل تولد، سالگرد ازدواج، شب یلدا یا عید نوروز لیست‌های اختصاصی بسازید. جشن‌ها را فیلتر کنید و آمار کادوهای دریافتی را به صورت زنده ببینید.",
      textEn: "Create and manage dedicated lists for birthdays, weddings, anniversaries, or winter Yalda festivals. Filter celebrations and watch live reservation status!",
      icon: <Gift className="w-5 h-5 text-[#b48d57]" />,
    },
    {
      target: "tour-add-wish-tab",
      titleFa: "ثبت سریع آرزو با آنالیزور لینک ✍️🛍️",
      titleEn: "Link-Powered Wish Addition ✍️🛍️",
      textFa: "در زبانه «افزودن آرزو»، کافیست لینک یک کالا را از دیجی‌کالا، تکنولایف یا هر سایتی کپی و پیست کنید! سیستم هوشمند به صورت خودکار عنوان، قیمت و جزئیات کادو را استخراج کرده و فرم را برای شما پر می‌کند.",
      textEn: "In the 'Add Wish' tab, simply copy & paste a product URL from Digikala, Technolife, or any online retailer. Our system automatically extracts details, pricing, and fills out the form!",
      icon: <Sparkles className="w-5 h-5 text-[#b48d57]" />,
    },
    {
      target: "tour-explore-tab",
      titleFa: "ویترین ایده‌ها و کالکشن‌های ترند 🧭🛍️",
      titleEn: "Curator Collections 🧭🛍️",
      textFa: "در زبانه «اکسپلور»، پکیج‌های کادویی دسته‌بندی‌شده نظیر «هدایای اقتصادی زیر ۵۰۰ هزار تومان»، «لوازم دیجیتال» یا پیشنهادهای محبوب زیبایی و گجت را مرور کنید و با یک کلیک به لیست خود بیاورید.",
      textEn: "In the 'Explore Ideas' tab, discover pre-selected categories like 'Gifts under 500k T', 'Tech Gear', or curated selections from styling coaches. Instantly attach any item to your registry!",
      icon: <Brain className="w-5 h-5 text-[#b48d57]" />,
    },
    {
      target: "tour-ai-advisor",
      titleFa: "دستیار فوق هوشمند کادویاب 🤖⚡",
      titleEn: "AI Gift Advisor Assistant 🤖⚡",
      textFa: "کادو چی بخرم؟ نگران نباشید! هوش مصنوعی خلاق گیفتینو (قدرت گرفته از مدل هوشمند Gemini) با تحلیل سن، جنسیت، نسبت خانوادگی و بودجه شما، بلافاصله خلاقانه‌ترین ایده‌های کادو را پیشنهاد می‌دهد.",
      textEn: "Stuck on what to buy? Our advanced Gemini AI analyzes target age, relation, budget, and custom interests to generate personalized, creative gift recommendations in real-time.",
      icon: <Brain className="w-5 h-5 text-[#b48d57]" />,
    },
    {
      target: "tour-claimed-tab",
      titleFa: "صندوق هدیه‌های رزرو شده شما 🛍️🔐",
      titleEn: "Claimed & Promised Dashboard 🛍️🔐",
      textFa: "در زبانه «رزرو شده‌ها»، تمام هدیه‌هایی که قول خریدشان را به دوستانتان داده‌اید به صورت کاملاً تفکیک‌شده ذخیره می‌شوند تا هرگز فراموش نکنید چه کادویی را برای چه کسی وعده داده‌اید.",
      textEn: "In the 'Claimed' tab, view and manage all the promises you've made to buy gifts for your friends. It tracks online purchase links, prices, and ensures you stay organized.",
      icon: <Share2 className="w-5 h-5 text-[#b48d57]" />,
    },
    {
      target: "tour-share-btn",
      titleFa: "کارت دعوت هوشمند و اشتراک‌گذاری 🔗✉️",
      titleEn: "Elegant Share & Invitation Card 🔗✉️",
      textFa: "با کپی دعوت‌نامه، یک کارت دعوت فوق‌العاده شیک با تم دلخواه (دوستانه، رسمی، ساده) به همراه زمان مراسم، آدرس و موقعیت دقیق نقشه بسازید و با یک دکمه در تلگرام یا واتساپ برای مهمانان ارسال کنید!",
      textEn: "Generate custom invitation cards with tailored templates (Friendly, Elegant, or Simple), embedding details like venue maps and RSVP links, ready to share with friends instantly!",
      icon: <Share2 className="w-5 h-5 text-[#b48d57]" />,
    },
  ];

  // Track responsive screen size
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Synchronize activeTab with tour steps
  useEffect(() => {
    if (!active) return;
    if (currentStep === 0) {
      setActiveTab?.("my-lists");
    } else if (currentStep === 1) {
      setActiveTab?.("my-lists");
    } else if (currentStep === 2) {
      setActiveTab?.("add-wish");
    } else if (currentStep === 3) {
      setActiveTab?.("explore");
    } else if (currentStep === 4) {
      setActiveTab?.("explore");
    } else if (currentStep === 5) {
      setActiveTab?.("my-lists");
    } else if (currentStep === 6) {
      setActiveTab?.("claimed");
    } else if (currentStep === 7) {
      setActiveTab?.("my-lists");
    }
  }, [currentStep, active, setActiveTab]);

  // Scroll to targeted element and measure its bounding box
  useEffect(() => {
    if (!active) return;

    const targetId = steps[currentStep].target;

    // Use a small timeout to let the new tab render fully first
    const scrollTimer = setTimeout(() => {
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 150);

    // Delay a bit to let scrolling finish before measuring the final bounding box
    const rectTimer = setTimeout(() => {
      const el = document.getElementById(targetId);
      if (el) {
        setRect(el.getBoundingClientRect());
      } else {
        setRect(null);
      }
    }, 450);

    return () => {
      clearTimeout(scrollTimer);
      clearTimeout(rectTimer);
    };
  }, [currentStep, active]);

  // Handle live window resize/scroll to keep the spotlight aligned
  useEffect(() => {
    if (!active) return;

    const updateRect = () => {
      const targetId = steps[currentStep].target;
      const el = document.getElementById(targetId);
      if (el) {
        setRect(el.getBoundingClientRect());
      }
    };

    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);

    return () => {
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
    };
  }, [currentStep, active]);

  if (!active) return null;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem("giftino_onboarded_v1", "true");
    onClose();
  };

  // Determine elegant vertical placement for desktop tooltips
  const getTooltipStyle = () => {
    if (!rect) {
      return {
        position: "fixed" as const,
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "360px",
      };
    }

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Default to putting it below the element
    let top = rect.bottom + 16;
    let placement: "top" | "bottom" = "bottom";

    // If it overlaps the bottom of the screen, place it above
    if (rect.bottom + 220 > viewportHeight && rect.top > 220) {
      top = rect.top - 210;
      placement = "top";
    }

    // Horizontal centering with screen clamping
    const tooltipWidth = 360;
    let left = rect.left + rect.width / 2 - tooltipWidth / 2;

    // Clamp inside viewport borders
    left = Math.max(16, Math.min(left, viewportWidth - tooltipWidth - 16));

    return {
      position: "fixed" as const,
      top,
      left,
      width: `${tooltipWidth}px`,
    };
  };

  const activeStepData = steps[currentStep];

  return (
    <div className="fixed inset-0 z-[9990] overflow-hidden select-none pointer-events-auto">
      {/* 1. Spotlight Overlay (Animated morphing dark shadow cutout) */}
      <AnimatePresence>
        {rect && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none"
          >
            <motion.div
              initial={false}
              animate={{
                top: rect.top - 8,
                left: rect.left - 8,
                width: rect.width + 16,
                height: rect.height + 16,
              }}
              transition={{ type: "spring", stiffness: 260, damping: 28 }}
              className="fixed rounded-2xl border-2 border-[#b48d57] pointer-events-none z-[9991]"
              style={{
                boxShadow: "0 0 0 9999px rgba(13, 27, 24, 0.72)", // Beautiful premium emerald-tinted dark overlay
              }}
            >
              {/* Gold ripple aura */}
              <span className="absolute inset-0 rounded-2xl border border-[#b48d57]/40 animate-ping opacity-40 pointer-events-none" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Tooltip Dialogue Card */}
      <div
        className="transition-all duration-300 ease-out"
        style={
          isMobile
            ? {
                position: "fixed",
                bottom: "20px",
                left: "16px",
                right: "16px",
                zIndex: 9999,
              }
            : getTooltipStyle()
        }
      >
        <motion.div
          initial={{ opacity: 0, y: 15, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="bg-white rounded-2xl border border-neutral-100 shadow-[0_20px_50px_rgba(0,0,0,0.3)] p-5 space-y-4 text-right overflow-hidden relative"
          style={{ direction: isFa ? "rtl" : "ltr" }}
        >
          {/* Subtle top gold progress bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-neutral-100">
            <motion.div
              className="h-full bg-gradient-to-r from-[#b48d57] to-[#d4af37]"
              initial={{ width: "0%" }}
              animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-[#b48d57]/10 rounded-xl">
                {activeStepData.icon}
              </div>
              <h4 className="text-xs font-black text-neutral-900 tracking-tight">
                {isFa ? activeStepData.titleFa : activeStepData.titleEn}
              </h4>
            </div>

            {/* Step Counter Badge */}
            <span className="text-[10px] font-bold text-[#b48d57] bg-[#b48d57]/10 px-2 py-0.5 rounded-full font-mono">
              {isFa
                ? `${currentStep + 1} از ${steps.length}`
                : `${currentStep + 1} of ${steps.length}`}
            </span>
          </div>

          {/* Text Description */}
          <p className="text-[11px] text-neutral-600 leading-relaxed font-sans font-medium text-right">
            {isFa ? activeStepData.textFa : activeStepData.textEn}
          </p>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
            {/* Skip Tour */}
            <button
              onClick={handleComplete}
              className="text-[10px] font-bold text-neutral-400 hover:text-neutral-600 transition-colors cursor-pointer select-none"
            >
              {isFa ? "رد کردن راهنما" : "Skip Guide"}
            </button>

            {/* Back & Next */}
            <div className="flex items-center gap-2">
              {currentStep > 0 && (
                <button
                  onClick={handlePrev}
                  className="p-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 text-neutral-600 transition-colors cursor-pointer flex items-center justify-center"
                  title={isFa ? "قبلی" : "Back"}
                >
                  {isFa ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
                </button>
              )}

              <button
                onClick={handleNext}
                className="px-4 py-1.5 bg-[#244b41] hover:bg-[#1d3d35] text-white text-[10px] font-black rounded-lg transition-all flex items-center gap-1 shadow-sm cursor-pointer select-none"
              >
                <span>
                  {currentStep === steps.length - 1
                    ? isFa
                      ? "فهمیدم! 🎓"
                      : "Got it! 🎓"
                    : isFa
                    ? "بعدی"
                    : "Next"}
                </span>
                {currentStep < steps.length - 1 && (
                  isFa ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
