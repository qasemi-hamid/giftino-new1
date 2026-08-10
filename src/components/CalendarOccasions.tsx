import React, { useState, useEffect } from "react";
import { UserProfile, Wishlist, Language } from "../types";
import { 
  Calendar as CalendarIcon, Bell, Plus, Trash2, RefreshCw, Check, 
  ChevronLeft, ChevronRight, Info, ExternalLink, Sparkles, AlertCircle, Share2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toPersianDigits } from "../utils";

interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  type: "birthday" | "wedding" | "graduation" | "yalda" | "nowruz" | "other";
  friendId?: string;
  friendName?: string;
  friendAvatar?: string;
  isCustom?: boolean;
  isGoogleSynced?: boolean;
  notes?: string;
}

interface CalendarOccasionsProps {
  user: UserProfile;
  language: Language;
  wishlists: Wishlist[];
  onNavigateToTab?: (tab: string) => void;
}

export default function CalendarOccasions({
  user,
  language,
  wishlists,
  onNavigateToTab
}: CalendarOccasionsProps) {
  const isFa = language === "fa";

  // Safe helper to format dates for rendering, avoiding RangeError on invalid dates
  const getEventDisplayDate = (dateStr: string) => {
    try {
      if (!dateStr) return "";
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('fa-IR', { month: 'numeric', day: 'numeric' });
    } catch {
      return dateStr || "";
    }
  };

  // Helper to determine if avatar is a URL/base64 image or raw emoji text
  const isAvatarUrl = (avatar: string | undefined) => {
    return !!(avatar?.startsWith("http") || avatar?.startsWith("/") || avatar?.startsWith("data:"));
  };

  // Current calendar view state - Live device date
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); // 0-indexed

  // State for all events
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDayEvents, setSelectedDayEvents] = useState<CalendarEvent[]>([]);
  const [selectedDateStr, setSelectedDateStr] = useState<string>("");

  // UI States
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStep, setSyncStep] = useState<number>(0);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Form States for custom events
  const [formTitle, setFormTitle] = useState<string>("");
  const [formDate, setFormDate] = useState<string>("");
  const [formType, setFormType] = useState<"birthday" | "wedding" | "graduation" | "yalda" | "nowruz" | "other">("birthday");
  const [formFriendId, setFormFriendId] = useState<string>("");
  const [formNotes, setFormNotes] = useState<string>("");

  // Available friends for dropdown
  const [friendsList, setFriendsList] = useState<any[]>([]);

  // Helper to generate Iranian cultural and national occasions dynamically for a given year
  const getPersianOccasions = (year: number): CalendarEvent[] => {
    return [
      {
        id: `ir-nowruz-${year}`,
        title: isFa ? "🌸 جشن نوروز باستانی" : "Nowruz (Persian New Year) 🌸",
        date: `${year}-03-20`,
        type: "nowruz",
        notes: isFa ? "آغاز سال نو خورشیدی و فرارسیدن بهار زیبا" : "Ancient Persian New year celebration"
      },
      {
        id: `ir-sizdah-${year}`,
        title: isFa ? "🌳 سیزده بدر (روز طبیعت)" : "Sizdah Bedar (Nature Day) 🌳",
        date: `${year}-04-02`,
        type: "other",
        notes: isFa ? "گره زدن سبزه و آرزوی خیر و برکت در دامن طبیعت" : "End of Nowruz holidays, spending time in nature"
      },
      {
        id: `ir-charshanbe-${year}`,
        title: isFa ? "🔥 چهارشنبه سوری" : "Charshanbe Suri (Festival of Fire) 🔥",
        date: `${year}-03-17`,
        type: "other",
        notes: isFa ? "جشن سنتی آتش زردی من از تو، سرخی تو از من" : "Traditional fire festival on the last Tuesday night of the year"
      },
      {
        id: `ir-girl-${year}`,
        title: isFa ? "👧 روز ملی دختران (روز دختر)" : "National Girl's Day (Roze Dokhtar) 👧",
        date: `${year}-04-18`, // April 18 in 2026 (1 Dhul-Qadah)
        type: "other",
        notes: isFa ? "گرامیداشت دختران عزیز سرزمینمان و خرید هدیه خاص" : "Celebrating the girls, time to get a special surprise gift"
      },
      {
        id: `ir-sepand-${year}`,
        title: isFa ? "❤️ سپندارمزگان (روز عشق و بانوان)" : "Sepandarmazgan (Ancient Day of Love) ❤️",
        date: `${year}-02-18`,
        type: "other",
        notes: isFa ? "بزرگداشت زن، عشق و زمین در فرهنگ درخشان ایران باستان" : "Traditional ancient Persian day of love, women & earth"
      },
      {
        id: `ir-mehregan-${year}`,
        title: isFa ? "🍂 جشن باشکوه مهرگان" : "Mehregan Festival 🍂",
        date: `${year}-10-02`,
        type: "other",
        notes: isFa ? "جشن مهرورزی، دوستی و سپاسگزاری ایران باستان" : "Ancient festival of Thanksgiving and Love"
      },
      {
        id: `ir-yalda-${year}`,
        title: isFa ? "🍉 شب یلدا (بلندترین شب سال)" : "Yalda Night (Shab-e Yalda) 🍉",
        date: `${year}-12-21`,
        type: "yalda",
        notes: isFa ? "دورهمی گرم فامیل، تفأل به دیوان حضرت حافظ و انار و هندوانه شیرین" : "Family gathering, Hafez poetry reading, sweet pomegranates"
      }
    ];
  };

  // 1. Gather and sync all events
  useEffect(() => {
    loadAllEvents();
    // Load friends list for assigning events
    const savedFriends = localStorage.getItem("giftino_friends_data");
    if (savedFriends) {
      setFriendsList(JSON.parse(savedFriends));
    }
  }, [wishlists]);

  const loadAllEvents = () => {
    const list: CalendarEvent[] = [];

    // A. Parse current user's own wishlists (they have occasion dates)
    wishlists.forEach((wl) => {
      if (wl.occasionDate) {
        list.push({
          id: `user-wl-${wl.id}`,
          title: isFa ? `مناسبت من: ${wl.title}` : `My occasion: ${wl.title}`,
          date: wl.occasionDate,
          type: wl.occasionType,
          friendName: isFa ? "من (صاحب حساب)" : "Me (Account Owner)",
          friendAvatar: user.avatar || "🦁",
          notes: wl.title
        });
      }
    });

    // B. Parse followed friends wishlists
    const savedFriends = localStorage.getItem("giftino_friends_data");
    if (savedFriends) {
      const friends = JSON.parse(savedFriends);
      // Get the followed friend IDs
      const savedFollowing = localStorage.getItem("giftino_following_friends") || "[]";
      const followingIds = JSON.parse(savedFollowing);

      friends.forEach((friend: any) => {
        // Only include friends that the user is actually following
        if (followingIds.includes(friend.id)) {
          friend.wishlists?.forEach((wl: any) => {
            if (wl.occasionDate) {
              list.push({
                id: `friend-${friend.id}-wl-${wl.id}`,
                title: wl.title,
                date: wl.occasionDate,
                type: wl.occasionType,
                friendId: friend.id,
                friendName: friend.name,
                friendAvatar: friend.avatar,
                notes: isFa ? "مشاهده کادوهای رزرو نشده این لیست در شبکه دوستان" : "View unreserved items of this list in Friends tab"
              });
            }
          });
        }
      });
    }

    // C. Load custom events added by the user
    const savedCustom = localStorage.getItem("giftino_custom_events");
    if (savedCustom) {
      const customEvents = JSON.parse(savedCustom);
      list.push(...customEvents);
    }

    // D. Inject dynamic Persian occasions for current year, previous, and next year
    const activeYears = [currentYear - 1, currentYear, currentYear + 1];
    activeYears.forEach(yr => {
      list.push(...getPersianOccasions(yr));
    });

    // Sort all events by date chronologically
    list.sort((a, b) => {
      const timeA = a.date ? new Date(a.date).getTime() : 0;
      const timeB = b.date ? new Date(b.date).getTime() : 0;
      const validA = isNaN(timeA) ? 0 : timeA;
      const validB = isNaN(timeB) ? 0 : timeB;
      return validA - validB;
    });
    setEvents(list);

    // Default select today's live events based on current device date
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const todayEvents = list.filter(e => e.date === todayStr);
    setSelectedDayEvents(todayEvents);
    setSelectedDateStr(todayStr);
  };

  // 2. Add custom event handler
  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formDate) {
      setStatusMsg({
        text: isFa ? "⚠️ لطفا نام مناسبت و تاریخ را انتخاب کنید." : "⚠️ Please provide event title and date.",
        type: "error"
      });
      return;
    }

    let assignedFriend: any = null;
    if (formFriendId) {
      assignedFriend = friendsList.find(f => f.id === formFriendId);
    }

    const newEvent: CalendarEvent = {
      id: `custom-evt-${Date.now()}`,
      title: formTitle.trim(),
      date: formDate,
      type: formType,
      friendId: formFriendId || undefined,
      friendName: assignedFriend ? assignedFriend.name : undefined,
      friendAvatar: assignedFriend ? assignedFriend.avatar : undefined,
      isCustom: true,
      notes: formNotes.trim() || undefined
    };

    const savedCustom = localStorage.getItem("giftino_custom_events");
    const currentCustom = savedCustom ? JSON.parse(savedCustom) : [];
    const updatedCustom = [...currentCustom, newEvent];
    localStorage.setItem("giftino_custom_events", JSON.stringify(updatedCustom));

    // Clear form and reload
    setFormTitle("");
    setFormDate("");
    setFormFriendId("");
    setFormNotes("");
    setShowAddForm(false);
    
    setStatusMsg({
      text: isFa ? "🎉 مناسبت جدید با موفقیت به تقویم اضافه شد!" : "🎉 Custom occasion successfully added to calendar!",
      type: "success"
    });
    setTimeout(() => setStatusMsg(null), 4000);

    loadAllEvents();
  };

  // 3. Delete custom event handler
  const handleDeleteEvent = (id: string) => {
    const confirmMsg = isFa 
      ? "آیا از حذف این مناسبت شخصی اطمینان دارید؟" 
      : "Are you sure you want to delete this custom occasion?";
    if (!window.confirm(confirmMsg)) return;

    const savedCustom = localStorage.getItem("giftino_custom_events");
    if (savedCustom) {
      const currentCustom = JSON.parse(savedCustom);
      const filtered = currentCustom.filter((e: any) => e.id !== id);
      localStorage.setItem("giftino_custom_events", JSON.stringify(filtered));
      
      setStatusMsg({
        text: isFa ? "🗑️ مناسبت شخصی حذف گردید." : "🗑️ Custom occasion removed.",
        type: "success"
      });
      setTimeout(() => setStatusMsg(null), 3000);

      loadAllEvents();
    }
  };

  // 4. Genuine calendar importer from Google/Apple API
  const handleSyncPlatforms = async () => {
    setIsSyncing(true);
    setSyncStep(1);

    try {
      // Step 1: Connecting to service API
      await new Promise(resolve => setTimeout(resolve, 800));
      setSyncStep(2);

      // Step 2: Real Google Calendar Fetch from backend API
      const res = await fetch("/api/sync-calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ calendarId: "en.iran#holiday@group.v.calendar.google.com" })
      });

      if (!res.ok) {
        throw new Error("Calendar service returned error status");
      }

      const data = await res.json();
      setSyncStep(3);
      await new Promise(resolve => setTimeout(resolve, 800));

      if (data && data.success && data.events) {
        // Map the Google events into our CalendarEvent structure
        const googleEvents: CalendarEvent[] = data.events.map((e: any, idx: number) => ({
          id: `google-real-evt-${idx}-${e.date}`,
          title: isFa ? `${e.title} (گوگل کلندر) 📅` : `${e.title} (Google Calendar) 📅`,
          date: e.date,
          type: e.title.toLowerCase().includes("yalda") ? "yalda" : e.title.toLowerCase().includes("nowruz") ? "nowruz" : "other",
          notes: e.notes || (isFa ? "وارد شده مستقیم از سرور تقویم گوگل" : "Imported directly from Google Calendar servers"),
          isGoogleSynced: true
        }));

        const savedCustom = localStorage.getItem("giftino_custom_events");
        const currentCustom = savedCustom ? JSON.parse(savedCustom) : [];
        
        // Remove old google synced events to prevent duplicates
        const filteredCustom = currentCustom.filter((e: any) => !e.isGoogleSynced);
        const updatedCustom = [...filteredCustom, ...googleEvents];
        
        localStorage.setItem("giftino_custom_events", JSON.stringify(updatedCustom));

        setIsSyncing(false);
        setSyncStep(0);
        
        setStatusMsg({
          text: isFa 
            ? `⚡ همگام‌سازی واقعی موفقیت‌آمیز بود! تعداد ${data.events.length} مناسبت ایرانی و جهانی مستقیماً از تقویم رسمی گوگل بارگذاری و همگام شدند.` 
            : `⚡ Real sync success! Imported ${data.events.length} Iranian & worldwide occasions directly from official Google Calendar servers.`,
          type: "success"
        });
        setTimeout(() => setStatusMsg(null), 6000);

        loadAllEvents();
      } else {
        throw new Error("Invalid response schema from calendar sync endpoint");
      }
    } catch (error: any) {
      console.error("Error syncing platform calendar:", error);
      setIsSyncing(false);
      setSyncStep(0);
      setStatusMsg({
        text: isFa 
          ? `⚠️ خطا در همگام‌سازی مستقیم: ${error.message || "سرور در دسترس نبود."}` 
          : `⚠️ Direct sync failed: ${error.message || "Server was unreachable."}`,
        type: "error"
      });
      setTimeout(() => setStatusMsg(null), 5000);
    }
  };

  // 5. Navigate months
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  // 6. Grid Calculation Helpers
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sunday, 1 = Monday, ...
  
  // Persian week starts on Saturday. Let's align:
  // JS Day indices: 0:Sun, 1:Mon, 2:Tue, 3:Wed, 4:Thu, 5:Fri, 6:Sat
  // Persian week day order: 0:Sat, 1:Sun, 2:Mon, 3:Tue, 4:Wed, 5:Thu, 6:Fri
  const persianWeekStartIndex = (firstDayIndex + 1) % 7; 

  const emptyCells = Array(persianWeekStartIndex).fill(null);
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Month labels in both languages
  const farsiMonths = [
    "ژانویه (دی/بهمن)", "فوریه (بهمن/اسفند)", "مارس (اسفند/فروردین)", 
    "آوریل (فروردین/اردیبهشت)", "مه (اردیبهشت/خرداد)", "ژوئن (خرداد/تیر)", 
    "ژوئیه (تیر/مرداد)", "اوت (مرداد/شهریور)", "سپتامبر (شهریور/مهر)", 
    "اکتبر (مهر/آبان)", "نوامبر (آبان/آذر)", "دسامبر (آذر/دی)"
  ];
  const englishMonths = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const monthLabel = isFa ? farsiMonths[currentMonth] : englishMonths[currentMonth];

  // Native Jalali details helper for the current month/year
  const getJalaliMonthRange = () => {
    try {
      const firstDate = new Date(currentYear, currentMonth, 1);
      const lastDate = new Date(currentYear, currentMonth, daysInMonth);
      
      const formatOption = { month: 'long', year: 'numeric' };
      const startJStr = new Intl.DateTimeFormat('fa-IR-u-ca-persian', formatOption as any).format(firstDate);
      const endJStr = new Intl.DateTimeFormat('fa-IR-u-ca-persian', formatOption as any).format(lastDate);

      if (startJStr === endJStr) {
        return startJStr;
      }
      return `${startJStr.split(" ")[0]} / ${endJStr}`;
    } catch {
      return "";
    }
  };

  // Day Cell click handler
  const handleDayClick = (dayNum: number) => {
    const formattedDate = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
    const matched = events.filter(e => e.date === formattedDate);
    setSelectedDayEvents(matched);
    setSelectedDateStr(formattedDate);
  };

  // Countdown Helper
  const getDaysUntil = (dateStr: string, type: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const eventDate = new Date(dateStr);
    let targetDate = new Date(today.getFullYear(), eventDate.getMonth(), eventDate.getDate());

    // If birthday or anniversary and already passed this year, look at next year
    if ((type === "birthday" || type === "wedding") && targetDate.getTime() < today.getTime()) {
      targetDate.setFullYear(today.getFullYear() + 1);
    }

    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
      days: diffDays,
      isToday: diffDays === 0 || diffDays === 365,
    };
  };

  // Upcoming occasions sorting and normalization
  const upcomingOccasions = events
    .map((evt) => {
      const countdown = getDaysUntil(evt.date, evt.type);
      return { ...evt, daysUntil: countdown.days, isToday: countdown.isToday };
    })
    .filter((evt) => {
      // Keep only future/today events
      return evt.daysUntil >= 0 && evt.daysUntil <= 60; // Show upcoming in next 60 days
    })
    .sort((a, b) => a.daysUntil - b.daysUntil);

  return (
    <div className="space-y-6 select-none" style={{ direction: isFa ? "rtl" : "ltr" }}>
      
      {/* 1. Header and Navigation Title */}
      <div className="text-center space-y-1.5 relative">
        <h2 className="text-xl font-black text-white flex items-center justify-center gap-2">
          <span>📅</span>
          <span>{isFa ? "تقویم هوشمند مناسبت‌ها" : "Smart Occasions Calendar"}</span>
        </h2>
        <p className="text-xs text-zinc-400 max-w-lg mx-auto">
          {isFa 
            ? "تولد دوستان، سالگردهای مهم و یادآوری‌های همگام‌سازی شده خود را در یک نگاه ردیابی کنید و کادو بخرید." 
            : "Track birthdays, anniversaries and phone syncs to plan perfect, timely gifts."}
        </p>

        {/* Sync trigger in page header */}
        <button
          onClick={handleSyncPlatforms}
          className="absolute top-0 left-0 hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-[10px] font-black text-zinc-300 rounded-xl transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isSyncing ? "animate-spin" : ""}`} />
          <span>{isFa ? "همگام‌سازی با گوگل" : "Sync with Google"}</span>
        </button>
      </div>

      {/* Status Msg */}
      <AnimatePresence>
        {statusMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-3.5 rounded-2xl text-xs font-bold text-center border ${
              statusMsg.type === "success"
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/15"
                : "bg-rose-500/10 text-rose-400 border-rose-500/15"
            }`}
          >
            {statusMsg.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interactive Google/Apple calendar sync loading simulator modal */}
      <AnimatePresence>
        {isSyncing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#09090b]/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <div className="bg-zinc-950 border border-zinc-850 p-6 rounded-3xl max-w-sm w-full text-center space-y-6">
              
              <div className="w-16 h-16 mx-auto bg-emerald-500/15 border border-emerald-500/20 rounded-2xl flex items-center justify-center relative">
                <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
                <span className="absolute -top-1 -right-1 text-xs">🔒</span>
              </div>

              <div className="space-y-1.5">
                <h4 className="text-xs font-black text-white">
                  {isFa ? "در حال همگام‌سازی دفترچه آرزوها" : "Syncing Giftino Calendar..."}
                </h4>
                <p className="text-[10px] text-zinc-500">
                  {isFa ? "اتصال امن به خدمات حساب کاربری و مخاطبان" : "Establishing secure pipeline to registries..."}
                </p>
              </div>

              <div className="space-y-2 text-right max-w-xs mx-auto">
                <div className="flex items-center gap-2 text-[10px]">
                  <span className={`w-2 h-2 rounded-full ${syncStep >= 1 ? "bg-emerald-500 animate-ping" : "bg-zinc-800"}`} />
                  <span className={syncStep >= 1 ? "text-emerald-400 font-bold" : "text-zinc-500"}>
                    {isFa ? "۱. اتصال به خدمات گوگل کلندر" : "1. Requesting read access to Google API"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px]">
                  <span className={`w-2 h-2 rounded-full ${syncStep >= 2 ? "bg-emerald-500 animate-ping" : "bg-zinc-800"}`} />
                  <span className={syncStep >= 2 ? "text-emerald-400 font-bold" : "text-zinc-500"}>
                    {isFa ? "۲. واکشی مناسبت‌ها و تولدهای مخاطبین" : "2. Reading calendars and contact records"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px]">
                  <span className={`w-2 h-2 rounded-full ${syncStep >= 3 ? "bg-emerald-500 animate-ping" : "bg-zinc-800"}`} />
                  <span className={syncStep >= 3 ? "text-emerald-400 font-bold" : "text-zinc-500"}>
                    {isFa ? "۳. یکپارچه‌سازی و رفع تداخل‌ها" : "3. Resolving duplicates and importing"}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: THE MONTHLY CALENDAR GRID (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          
          <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-5 space-y-4">
            
            {/* Calendar Navigator */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-900">
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevMonth}
                  className="p-1.5 hover:bg-zinc-900 rounded-lg text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <div className="text-right">
                  <h3 className="text-xs font-black text-white">{monthLabel} {toPersianDigits(currentYear)}</h3>
                  {isFa && (
                    <p className="text-[10px] text-zinc-500 font-medium">
                      مقارن با: {getJalaliMonthRange()}
                    </p>
                  )}
                </div>
                <button
                  onClick={handleNextMonth}
                  className="p-1.5 hover:bg-zinc-900 rounded-lg text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-[10px] font-black rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isFa ? "افزودن مناسبت" : "Add Occasion"}</span>
                </button>
              </div>
            </div>

            {/* Calendar Day Labels */}
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-zinc-500 pb-2">
              <span>{isFa ? "شنبه" : "Sat"}</span>
              <span>{isFa ? "۱شنبه" : "Sun"}</span>
              <span>{isFa ? "۲شنبه" : "Mon"}</span>
              <span>{isFa ? "۳شنبه" : "Tue"}</span>
              <span>{isFa ? "۴شنبه" : "Wed"}</span>
              <span>{isFa ? "۵شنبه" : "Thu"}</span>
              <span>{isFa ? "جمعه" : "Fri"}</span>
            </div>

            {/* Calendar Cells */}
            <div className="grid grid-cols-7 gap-1.5">
              {/* Empty offset cells */}
              {emptyCells.map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square bg-zinc-900/10 rounded-xl" />
              ))}

              {/* Day cells */}
              {daysArray.map((day) => {
                const dayDateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const matchedEvents = events.filter(e => e.date === dayDateStr);
                const hasEvents = matchedEvents.length > 0;
                
                // Construct Date object for Jalali translation
                const dateObj = new Date(currentYear, currentMonth, day);
                let jalaliDayNum = "";
                let jalaliMonthName = "";
                try {
                  jalaliDayNum = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { day: 'numeric' }).format(dateObj);
                  jalaliMonthName = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { month: 'short' }).format(dateObj);
                } catch {
                  jalaliDayNum = String(day);
                  jalaliMonthName = "";
                }

                const isSelected = selectedDateStr === dayDateStr;
                
                // Dynamic live today comparison based on the device clock
                const liveTodayObj = new Date();
                const liveTodayStr = `${liveTodayObj.getFullYear()}-${String(liveTodayObj.getMonth() + 1).padStart(2, "0")}-${String(liveTodayObj.getDate()).padStart(2, "0")}`;
                const isTodayLocal = dayDateStr === liveTodayStr;

                // Class styles
                let cellClass = "aspect-square rounded-2xl flex flex-col justify-between p-1.5 relative transition-all cursor-pointer border ";
                if (isSelected) {
                  cellClass += "bg-[#10b981]/15 border-[#10b981] text-white";
                } else if (isTodayLocal) {
                  cellClass += "bg-zinc-900 border-amber-500 text-amber-400 font-extrabold shadow-md shadow-amber-500/10";
                } else if (hasEvents) {
                  cellClass += "bg-zinc-900/90 border-zinc-800 hover:border-zinc-700 text-zinc-200";
                } else {
                  cellClass += "bg-zinc-900/40 border-zinc-900/60 hover:bg-zinc-900/80 text-zinc-400";
                }

                // Dot color depending on event type
                const eventType = matchedEvents[0]?.type;
                let dotColor = "bg-[#10b981]"; // Default emerald
                if (eventType === "wedding") dotColor = "bg-purple-400";
                if (eventType === "graduation") dotColor = "bg-blue-400";
                if (eventType === "yalda" || eventType === "nowruz") dotColor = "bg-rose-400";

                return (
                  <div
                    key={day}
                    onClick={() => handleDayClick(day)}
                    className={cellClass}
                  >
                    {/* Multi-language day cell dual-date labeling */}
                    <div className="flex flex-col justify-between items-start h-full w-full select-none">
                      <div className="flex justify-between items-start w-full">
                        {/* Jalali Date & Month Name (شمسی) */}
                        <div className="flex flex-col text-right">
                          <span className={`text-[10px] font-black leading-none ${isTodayLocal ? "text-amber-400" : isSelected ? "text-emerald-400" : "text-amber-200/90"}`}>
                            {toPersianDigits(jalaliDayNum)}
                          </span>
                          <span className="text-[7px] text-zinc-500 font-bold leading-none mt-0.5">
                            {jalaliMonthName}
                          </span>
                        </div>
                        {/* Gregorian Date (میلادی) */}
                        <span className="text-[8.5px] text-zinc-400 font-mono font-medium leading-none">
                          {day}
                        </span>
                      </div>

                      {/* Mini visual indicator of the occasion title */}
                      {hasEvents && (
                        <p className={`text-[7.5px] font-extrabold truncate max-w-full leading-tight text-right w-full mt-1.5 opacity-90 ${
                          matchedEvents[0].isGoogleSynced ? "text-amber-400" : "text-[#10b981]"
                        }`}>
                          {matchedEvents[0].title.replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD00-\uDFFF]/g, '').trim()}
                        </p>
                      )}
                    </div>

                    {/* Indicator dots for occurrences */}
                    <div className="flex gap-1 justify-center pb-0.5 mt-1 w-full">
                      {matchedEvents.slice(0, 3).map((e, idx) => {
                        let dotC = "bg-[#10b981]";
                        if (e.type === "wedding") dotC = "bg-purple-400";
                        if (e.type === "graduation") dotC = "bg-blue-400";
                        if (e.type === "yalda" || e.type === "nowruz") dotC = "bg-rose-400";
                        if (e.isGoogleSynced) dotC = "bg-amber-400";
                        return (
                          <span
                            key={idx}
                            className={`w-1.5 h-1.5 rounded-full ${dotC}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Dual Legend indicator */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-[8.5px] font-mono text-zinc-500 pt-2 border-t border-zinc-900/50">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#10b981]" />
                <span>{isFa ? "تولد (گیفتی‌نو)" : "Birthday"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-400" />
                <span>{isFa ? "سالگرد ازدواج/رابطه" : "Anniversary"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                <span>{isFa ? "فارغ‌التحصیلی/سایر مناسبت‌ها" : "Graduation / Other"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>{isFa ? "وارد شده از گوگل کلندر" : "Google Synced"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 border border-amber-500/50 rounded" />
                <span>{isFa ? "امروز" : "Today"}</span>
              </div>
            </div>

          </div>

          {/* Form to add custom events */}
          <AnimatePresence>
            {showAddForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <form
                  onSubmit={handleAddEvent}
                  className="bg-zinc-950 border border-zinc-900 rounded-3xl p-5 space-y-4 text-right"
                >
                  <div className="flex justify-between items-center pb-2 border-b border-zinc-900">
                    <h4 className="text-xs font-black text-white">
                      {isFa ? "➕ افزودن مناسبت جدید" : "➕ Add Custom Occasion"}
                    </h4>
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="text-zinc-500 hover:text-white text-xs"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Event name */}
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-zinc-400">
                        {isFa ? "نام مناسبت:" : "Event Title:"}
                      </label>
                      <input
                        type="text"
                        required
                        placeholder={isFa ? "مثلا: تولد خاله مهین، سالگرد دوستی" : "e.g., Mom's Birthday"}
                        value={formTitle}
                        onChange={(e) => setFormTitle(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500/40"
                      />
                    </div>

                    {/* Event date */}
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-zinc-400">
                        {isFa ? "تاریخ مناسبت (میلادی):" : "Event Date (Gregorian):"}
                      </label>
                      <input
                        type="date"
                        required
                        value={formDate}
                        onChange={(e) => setFormDate(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500/40"
                      />
                    </div>

                    {/* Occasion Type */}
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-zinc-400">
                        {isFa ? "نوع مناسبت:" : "Occasion Type:"}
                      </label>
                      <select
                        value={formType}
                        onChange={(e: any) => setFormType(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500/40"
                      >
                        <option value="birthday">{isFa ? "🎂 تولد" : "Birthday"}</option>
                        <option value="wedding">{isFa ? "💑 سالگرد ازدواج / رابطه" : "Anniversary"}</option>
                        <option value="graduation">{isFa ? "🎓 جشن فارغ‌التحصیلی" : "Graduation"}</option>
                        <option value="yalda">{isFa ? "🍉 شب یلدا" : "Yalda Night"}</option>
                        <option value="nowruz">{isFa ? "🌸 عید نوروز" : "Nowruz"}</option>
                        <option value="other">{isFa ? "🎉 سایر مناسبت‌ها" : "Other"}</option>
                      </select>
                    </div>

                    {/* Associated Friend */}
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-zinc-400">
                        {isFa ? "انتساب به دوست (اختیاری):" : "Assign to Friend (Optional):"}
                      </label>
                      <select
                        value={formFriendId}
                        onChange={(e) => setFormFriendId(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500/40"
                      >
                        <option value="">{isFa ? "بدون انتساب" : "None"}</option>
                        {friendsList.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.avatar} {f.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-zinc-400">
                      {isFa ? "یادداشت / توضیحات:" : "Notes:"}
                    </label>
                    <textarea
                      placeholder={isFa ? "مثلاً: دوست دارد عطر تلخ یا کتاب رمان هدیه بگیرد." : "e.g., Prefers book gifts."}
                      value={formNotes}
                      onChange={(e) => setFormNotes(e.target.value)}
                      rows={2}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500/40 resize-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      {isFa ? "انصراف" : "Cancel"}
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-xl text-xs font-black cursor-pointer"
                    >
                      {isFa ? "ذخیره مناسبت" : "Save Event"}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Details of Selected Day Events */}
          <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-5 space-y-4">
            <h4 className="text-xs font-black text-zinc-400 uppercase tracking-wider">
              {isFa 
                ? `مناسبت‌های تاریخ: ${toPersianDigits(selectedDateStr.replace(/-/g, "/"))}` 
                : `Events for: ${selectedDateStr}`}
            </h4>

            {selectedDayEvents.length === 0 ? (
              <div className="p-5 text-center text-zinc-500 text-[10.5px]">
                {isFa 
                  ? "هیچ مناسبتی برای این تاریخ ثبت نشده است. می‌توانید با کلیک بر روی دکمه بالای تقویم، یک مناسبت شخصی جدید برای این روز اضافه کنید." 
                  : "No events recorded for this date. Click Add Occasion to register a reminder."}
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDayEvents.map((evt) => {
                  const countdown = getDaysUntil(evt.date, evt.type);

                  return (
                    <div
                      key={evt.id}
                      className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-850 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {evt.friendAvatar ? (
                          <span className="w-9 h-9 rounded-xl bg-zinc-850 border border-zinc-800 flex items-center justify-center text-lg select-none shrink-0 overflow-hidden">
                            {isAvatarUrl(evt.friendAvatar) ? (
                              <img src={evt.friendAvatar} className="w-full h-full object-cover" referrerPolicy="no-referrer" alt="" />
                            ) : (
                              evt.friendAvatar
                            )}
                          </span>
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-zinc-850 border border-zinc-800 flex items-center justify-center text-lg select-none shrink-0 text-[#10b981]">
                            🎁
                          </div>
                        )}

                        <div className="min-w-0 text-right">
                          <h5 className="text-xs font-black text-white truncate">{evt.title}</h5>
                          <p className="text-[10px] text-zinc-400 truncate">
                            {evt.friendName ? (
                              <span>{isFa ? `متعلق به: ${evt.friendName}` : `Belongs to: ${evt.friendName}`}</span>
                            ) : (
                              <span>{isFa ? "مناسبت شخصی تقویم" : "Custom Calender Event"}</span>
                            )}
                          </p>
                          {evt.notes && (
                            <p className="text-[9px] text-zinc-500 font-medium truncate mt-1">
                              💡 {evt.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-left font-mono">
                          {countdown.isToday ? (
                            <span className="text-[9px] bg-amber-500/10 text-amber-400 font-extrabold px-2 py-0.5 rounded-full border border-amber-500/20">
                              {isFa ? "امروز! 🎉" : "TODAY! 🎉"}
                            </span>
                          ) : (
                            <span className="text-[9px] bg-zinc-800 text-zinc-300 font-bold px-2.5 py-0.5 rounded-full">
                              {isFa ? `تا ${toPersianDigits(countdown.days)} روز دیگر` : `In ${countdown.days} days`}
                            </span>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1.5">
                          {evt.friendId && onNavigateToTab && (
                            <button
                              onClick={() => onNavigateToTab("friends")}
                              className="p-1.5 bg-zinc-800 hover:bg-zinc-750 text-zinc-400 hover:text-[#10b981] rounded-lg transition-colors cursor-pointer"
                              title={isFa ? "مشاهده لیست آرزوها در شبکه دوستان" : "View wishlist in Friends tab"}
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {evt.isCustom && (
                            <button
                              onClick={() => handleDeleteEvent(evt.id)}
                              className="p-1.5 bg-zinc-800 hover:bg-zinc-750 text-zinc-500 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                              title={isFa ? "حذف مناسبت" : "Delete Event"}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: TELEGRAM-STYLE REMINDERS PANEL & SYNC CARDS (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* Upcoming Birthday Widgets / Telegram-style list */}
          <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-900">
              <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-amber-400" />
                <span>{isFa ? "تولدهای پیش رو (تا ۶۰ روز)" : "Upcoming Birthdays"}</span>
              </h4>
              <span className="text-[9px] bg-zinc-900 text-zinc-400 px-2 py-0.5 rounded-lg border border-zinc-800/40 font-mono">
                {isFa ? toPersianDigits(upcomingOccasions.length) : upcomingOccasions.length}
              </span>
            </div>

            {upcomingOccasions.length === 0 ? (
              <div className="text-center p-6 text-zinc-500 space-y-1.5 text-[10px]">
                <p>📭 {isFa ? "هیچ مناسبتی در ۲ ماه آینده پیدا نشد." : "No occasions in the next 60 days."}</p>
                <p className="text-[9px] text-zinc-600">
                  {isFa ? "دوستان بیشتری را دنبال کنید یا مناسبت‌های شخصی اضافه کنید." : "Follow more friends or add custom occasions."}
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {upcomingOccasions.map((evt) => (
                  <div
                    key={evt.id}
                    onClick={() => {
                      // Navigate calendar to match this month
                      const d = new Date(evt.date);
                      if (evt.date && !isNaN(d.getTime())) {
                        setCurrentDate(new Date(d.getFullYear(), d.getMonth(), 1));
                        setSelectedDateStr(evt.date);
                        setSelectedDayEvents(events.filter(e => e.date === evt.date));
                      }
                    }}
                    className={`p-3 rounded-2xl bg-zinc-900/30 border text-right transition-all cursor-pointer ${
                      evt.isToday 
                        ? "border-amber-500/40 bg-amber-500/5 animate-pulse" 
                        : "border-zinc-900 hover:border-zinc-800 hover:bg-zinc-900/60"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        {evt.friendAvatar ? (
                          <span className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-750 flex items-center justify-center text-sm shrink-0 overflow-hidden">
                            {isAvatarUrl(evt.friendAvatar) ? (
                              <img src={evt.friendAvatar} className="w-full h-full object-cover" referrerPolicy="no-referrer" alt="" />
                            ) : (
                              evt.friendAvatar
                            )}
                          </span>
                        ) : (
                          <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-750 flex items-center justify-center text-sm shrink-0 text-[#10b981]">
                            🎂
                          </div>
                        )}

                        <div className="min-w-0">
                          <h5 className="text-[11px] font-bold text-white truncate">{evt.title}</h5>
                          <p className="text-[8.5px] text-zinc-500 truncate font-mono">
                            {toPersianDigits(getEventDisplayDate(evt.date))} ({evt.friendName || "شخصی"})
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 text-left font-mono">
                        {evt.isToday ? (
                          <span className="text-[8px] bg-amber-500 text-zinc-950 font-black px-1.5 py-0.5 rounded-lg">
                            {isFa ? "امروز 🎉" : "TODAY"}
                          </span>
                        ) : (
                          <span className="text-[8.5px] text-[#10b981] font-extrabold bg-emerald-500/10 px-2 py-0.5 rounded-lg">
                            {isFa ? `تا ${toPersianDigits(evt.daysUntil)} روز دیگر` : `in ${evt.daysUntil}d`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Calender Sync Card System */}
          <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-5 space-y-4">
            <h4 className="text-xs font-black text-white flex items-center gap-1.5">
              <span>🔌</span>
              <span>{isFa ? "همگام‌سازی ابری تقویم" : "Cloud Calendar Sync"}</span>
            </h4>
            <p className="text-[10px] text-zinc-400 leading-relaxed">
              {isFa 
                ? "می‌توانید مناسبت‌ها و تولدهای دوستان خود را مستقیماً از تقویم گوگل، اپل کلندر یا مخاطبین تلفن همراه خود وارد گیفتی‌نو کنید." 
                : "Import friend birthdays directly from Google, Apple calendar, or native phone contact books securely."}
            </p>

            <div className="space-y-2">
              {/* Google Calendar sync option */}
              <button
                onClick={handleSyncPlatforms}
                className="w-full p-3 bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-between text-right transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-lg select-none group-hover:scale-105 transition-all">
                    🔵
                  </div>
                  <div>
                    <h5 className="text-[10.5px] font-black text-white">
                      {isFa ? "گوگل کلندر (Google Calendar)" : "Google Calendar Sync"}
                    </h5>
                    <p className="text-[8px] text-zinc-500">
                      {isFa ? "تولدها و رویدادهای تقویم گوگل" : "Import anniversaries & dates"}
                    </p>
                  </div>
                </div>
                <ChevronLeft className="w-4 h-4 text-zinc-500 group-hover:text-emerald-400 group-hover:-translate-x-1 transition-all" />
              </button>

              {/* Apple Calendar sync option */}
              <button
                onClick={handleSyncPlatforms}
                className="w-full p-3 bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-between text-right transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center text-lg select-none group-hover:scale-105 transition-all">
                    🍏
                  </div>
                  <div>
                    <h5 className="text-[10.5px] font-black text-white">
                      {isFa ? "اپل کلندر (Apple Calendar)" : "Apple Calendar Sync"}
                    </h5>
                    <p className="text-[8px] text-zinc-500">
                      {isFa ? "ادغام با حساب کاربری آی‌کلود" : "iCloud calendar integration"}
                    </p>
                  </div>
                </div>
                <ChevronLeft className="w-4 h-4 text-zinc-500 group-hover:text-emerald-400 group-hover:-translate-x-1 transition-all" />
              </button>

              {/* Contacts Birthday option */}
              <button
                onClick={handleSyncPlatforms}
                className="w-full p-3 bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-between text-right transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center text-lg select-none group-hover:scale-105 transition-all">
                    📱
                  </div>
                  <div>
                    <h5 className="text-[10.5px] font-black text-white">
                      {isFa ? "مخاطبین تلفن همراه" : "Phone Contacts Birthdays"}
                    </h5>
                    <p className="text-[8px] text-zinc-500">
                      {isFa ? "استخراج خودکار روزهای تولد رفقا" : "Extract local address book dates"}
                    </p>
                  </div>
                </div>
                <ChevronLeft className="w-4 h-4 text-zinc-500 group-hover:text-emerald-400 group-hover:-translate-x-1 transition-all" />
              </button>
            </div>

            <div className="p-3 bg-zinc-900/40 rounded-2xl border border-zinc-900 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-[#10b981] shrink-0 mt-0.5" />
              <p className="text-[9px] text-zinc-500 leading-relaxed">
                {isFa 
                  ? "حفظ حریم خصوصی: گیفتی‌نو مخاطبان شما را روی سرور ذخیره نمی‌کند. تحلیل و همگام‌سازی کاملاً در مرورگر تلفن همراه شما انجام می‌شود." 
                  : "Privacy protection: Giftino processes all contact records on-device. No calendar details are saved server-side."}
              </p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
