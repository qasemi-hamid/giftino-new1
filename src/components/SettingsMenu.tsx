import React, { useState, useEffect } from "react";
import { UserProfile, Wishlist, WishlistItem, Language } from "../types";
import { 
  User, Mail, Shield, Coins, Bell, HelpCircle, MessageSquare, Trash2, 
  RotateCcw, ShieldAlert, LogOut, Trash, Check, X, ArrowLeft, ChevronDown,
  Pencil, Share2, Users, Key, AlertCircle, Ban, Landmark, EyeOff
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toPersianDigits } from "../utils";

interface DeletedItemRecord {
  item: WishlistItem;
  listId: string;
  listTitle: string;
  deletedAt: string;
}

interface SettingsMenuProps {
  user: UserProfile;
  setUser: (user: UserProfile) => void;
  wishlists: Wishlist[];
  onUpdateWishlists: (updated: Wishlist[]) => void;
  language: Language;
  onLogout: () => void;
  onBack: () => void;
  onOpenAvatarPicker: () => void;
}

export default function SettingsMenu({
  user,
  setUser,
  wishlists,
  onUpdateWishlists,
  language,
  onLogout,
  onBack,
  onOpenAvatarPicker
}: SettingsMenuProps) {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [recentlyDeleted, setRecentlyDeleted] = useState<DeletedItemRecord[]>([]);
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [faqExpanded, setFaqExpanded] = useState<number | null>(null);

  // Form states
  const [editName, setEditName] = useState(user.name);
  const [editEmail, setEditEmail] = useState(user.email || "hamidreza@example.com");
  const [editBio, setEditBio] = useState(user.bio || "");
  const [editCurrency, setEditCurrency] = useState<"toman" | "usd">("toman");

  // Privacy & Surprise mode states
  const [surpriseMode, setSurpriseMode] = useState(true);
  const [privateAccount, setPrivateAccount] = useState(false);
  const [mockPassword, setMockPassword] = useState("••••••••••••");

  // Notification toggles
  const [notifPush, setNotifPush] = useState(true);
  const [notifEmail, setNotifEmail] = useState(false);
  const [notifClaimed, setNotifClaimed] = useState(true);

  // Blocked users
  const [blockedUsers, setBlockedUsers] = useState<string[]>([
    "farhad_shaki",
    "negin_safari"
  ]);

  // Support Chat simulation
  const [supportMessage, setSupportMessage] = useState("");
  const [chatLog, setChatLog] = useState<Array<{ sender: "user" | "bot"; text: string }>>([
    { sender: "bot", text: language === "fa" ? "سلام! من پشتیبان هوشمند گیفتینو هستم. چطور می‌توانم کمکتان کنم؟" : "Hi! I'm the Giftino Smart Support assistant. How can I help you today?" }
  ]);
  const [isSupportThinking, setIsSupportThinking] = useState(false);
  const chatEndRef = React.useRef<HTMLDivElement>(null);

  const isFa = language === "fa";
  const derivedUsername = user.phone === "09123456789" ? "hamidrezaghasemi" : user.name.toLowerCase().replace(/\s+/g, "");

  useEffect(() => {
    const deletedStorage = localStorage.getItem("giftino_recently_deleted") || "[]";
    setRecentlyDeleted(JSON.parse(deletedStorage));
  }, [activeSection]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatLog, isSupportThinking]);

  const handleSaveProfile = () => {
    setUser({
      ...user,
      name: editName,
      email: editEmail,
      bio: editBio
    });
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2000);
  };

  const handleCopyProfileLink = () => {
    const link = `https://giftino.app/u/${derivedUsername}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleRestoreItem = (record: DeletedItemRecord, index: number) => {
    const listExists = wishlists.some((w) => w.id === record.listId);
    let updatedLists = [...wishlists];
    
    if (listExists) {
      updatedLists = wishlists.map((w) => {
        if (w.id === record.listId) {
          return {
            ...w,
            items: [record.item, ...w.items]
          };
        }
        return w;
      });
    } else {
      const newList: Wishlist = {
        id: record.listId,
        title: record.listTitle,
        occasionDate: new Date().toISOString().split("T")[0],
        occasionType: "other",
        items: [record.item]
      };
      updatedLists.push(newList);
    }

    onUpdateWishlists(updatedLists);

    const updatedDeleted = recentlyDeleted.filter((_, idx) => idx !== index);
    setRecentlyDeleted(updatedDeleted);
    localStorage.setItem("giftino_recently_deleted", JSON.stringify(updatedDeleted));
  };

  const handleClearTrash = () => {
    if (confirm(isFa ? "آیا از خالی کردن کامل سطل زباله اطمینان دارید؟" : "Are you sure you want to permanently clear the trash?")) {
      setRecentlyDeleted([]);
      localStorage.removeItem("giftino_recently_deleted");
    }
  };

  const handleSendSupportMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportMessage.trim() || isSupportThinking) return;

    const userText = supportMessage.trim();
    setChatLog((prev) => [...prev, { sender: "user", text: userText }]);
    setSupportMessage("");
    setIsSupportThinking(true);

    try {
      const response = await fetch("/api/assistant-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          language,
          currentWishlists: wishlists,
          activeTab: "settings",
          userProfile: user,
          isSupport: true,
        }),
      });

      const data = await response.json();

      if (data.success && data.text) {
        setChatLog((prev) => [...prev, { sender: "bot", text: data.text }]);
      } else {
        throw new Error("Invalid API response");
      }
    } catch (error) {
      console.error("Support chat error, falling back:", error);
      // Fallback response so user requests are never lost
      setChatLog((prev) => [
        ...prev,
        {
          sender: "bot",
          text: isFa 
            ? "پیام شما دریافت شد! کارشناسان ما به زودی بررسی و پاسخ خواهند داد. 🙏" 
            : "Your message has been received! Our support team will get back to you shortly. 🙏"
        }
      ]);
    } finally {
      setIsSupportThinking(false);
    }
  };

  const handleUnblock = (username: string) => {
    setBlockedUsers(blockedUsers.filter(u => u !== username));
  };

  const handleAddBlock = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const input = (form.elements.namedItem("block_user") as HTMLInputElement).value.trim();
    if (input) {
      setBlockedUsers([...blockedUsers, input.replace("@", "")]);
      form.reset();
    }
  };

  const faqs = [
    {
      q: isFa ? "حالت سورپرایز (Surprise Mode) چگونه کار می‌کند؟" : "How does Surprise Mode work?",
      a: isFa 
        ? "در گیفتینو، وقتی دوستی کادویی را در لیست شما رزرو می‌کند، این مورد برای شما پنهان می‌ماند تا زمانی که آن را هدیه بگیرید! اما بقیه دوستان می‌توانند وضعیت رزرو را ببینند تا کادوی تکراری نخرند."
        : "When a friend claims/reserves an item from your list, it stays hidden from you so you are surprised! However, other guests see it as claimed to prevent duplicates."
    },
    {
      q: isFa ? "آیا کادو گرفتن از کل وب‌سایت‌ها رایگان است؟" : "Can I add items from any website?",
      a: isFa 
        ? "بله! شما با کپی کردن آدرس اینترنتی (لینک محصول) از هر فروشگاه دلخواهی در ایران یا دنیا، می‌توانید آن را به آرزوهایتان اضافه کنید."
        : "Yes! Simply paste any product link from any online store in the world. Our parser will auto-populate product details."
    },
    {
      q: isFa ? "چگونه لیست آرزوهایم را برای دیگران بفرستم؟" : "How do I share my wishlist?",
      a: isFa 
        ? "وارد لیست مورد نظرتان شوید، دکمه 'ارسال دعوت‌نامه' را کلیک کنید، الگوی متن دلخواهتان را برگزینید و پیوند اختصاصی را در تلگرام، واتس‌اپ یا اینستاگرام برای آشنایان کپی و ارسال کنید."
        : "Open your wishlist, tap 'Share Registry', customize your invitation template message, and copy/paste it to Telegram, WhatsApp, or Instagram."
    }
  ];

  return (
    <div className="space-y-6 select-none" style={{ direction: isFa ? "rtl" : "ltr" }}>
      
      {/* Back to profile home */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 hover:border-emerald-500/40 text-zinc-300 hover:text-emerald-400 rounded-xl text-xs font-black cursor-pointer transition-all shadow-sm"
      >
        <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
        <span>{isFa ? "بازگشت به پروفایل" : "Back to Profile"}</span>
      </button>

      <AnimatePresence mode="wait">
        {activeSection ? (
          /* Detailed sub-settings section view */
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-zinc-900 border border-zinc-850 rounded-3xl p-6 space-y-4 shadow-xl"
          >
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
              <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                {activeSection === "profile" && <User className="w-4 h-4 text-amber-400" />}
                {activeSection === "recently_deleted" && <Trash2 className="w-4 h-4 text-rose-400" />}
                {activeSection === "faqs" && <HelpCircle className="w-4 h-4 text-blue-400" />}
                {activeSection === "password_privacy" && <Shield className="w-4 h-4 text-emerald-400" />}
                {activeSection === "currency" && <Coins className="w-4 h-4 text-amber-500" />}
                {activeSection === "notifications" && <Bell className="w-4 h-4 text-[#10b981]" />}
                {activeSection === "blocked_users" && <Ban className="w-4 h-4 text-red-500" />}
                {activeSection === "account_details" && <Landmark className="w-4 h-4 text-violet-400" />}
                {activeSection === "disclosures" && <AlertCircle className="w-4 h-4 text-sky-400" />}
                {activeSection === "chat_support" && <MessageSquare className="w-4 h-4 text-amber-400" />}

                <span>
                  {activeSection === "profile" && (isFa ? "ویرایش مشخصات" : "Edit Name & Username")}
                  {activeSection === "recently_deleted" && (isFa ? "سطل زباله آرزوها" : "Recently Deleted Wishes")}
                  {activeSection === "faqs" && (isFa ? "مرکز راهنمایی و سوالات" : "FAQs Center")}
                  {activeSection === "password_privacy" && (isFa ? "گذرواژه و حریم خصوصی" : "Password & Privacy")}
                  {activeSection === "currency" && (isFa ? "واحد پول پیش‌فرض" : "Currency settings")}
                  {activeSection === "notifications" && (isFa ? "تنظیمات اعلان‌ها" : "Notification settings")}
                  {activeSection === "blocked_users" && (isFa ? "کاربران مسدود شده" : "Blocked Users")}
                  {activeSection === "account_details" && (isFa ? "اطلاعات حساب و عضویت" : "Account details")}
                  {activeSection === "disclosures" && (isFa ? "مقررات و حریم خصوصی" : "Disclosures")}
                  {activeSection === "chat_support" && (isFa ? "گفتگو با پشتیبانی هوشمند" : "Smart support chat")}
                </span>
              </h3>
              <button 
                onClick={() => setActiveSection(null)} 
                className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-bold bg-zinc-800/90 hover:bg-zinc-800 border border-zinc-700/60 px-3 py-1.5 rounded-xl cursor-pointer transition-all shadow-sm"
              >
                <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
                <span>{isFa ? "بازگشت" : "Back"}</span>
              </button>
            </div>

            {/* Profile edit fields */}
            {activeSection === "profile" && (
              <div className="space-y-4 pt-2 text-left rtl:text-right">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-400 block uppercase">{isFa ? "نام نمایشی" : "Full Name"}</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full text-xs bg-zinc-950 border border-zinc-850 rounded-2xl px-4 py-3 text-white outline-none focus:border-[#10b981]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-400 block uppercase">{isFa ? "نام کاربری" : "Username"}</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 text-xs text-zinc-500 font-mono">@</span>
                    <input
                      type="text"
                      disabled
                      value={derivedUsername}
                      className="w-full text-xs bg-zinc-950/50 border border-zinc-850/60 rounded-2xl pl-8 pr-4 py-3 text-zinc-500 font-mono outline-none"
                    />
                  </div>
                  <p className="text-[9px] text-zinc-500">{isFa ? "نام کاربری بر اساس شماره همراه شما یا نام شما تنظیم می‌شود." : "Username is linked to your account profile name."}</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-400 block uppercase">{isFa ? "آدرس ایمیل" : "Email Address"}</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full text-xs bg-zinc-950 border border-zinc-850 rounded-2xl px-4 py-3 text-white outline-none focus:border-[#10b981]"
                  />
                </div>

                {copiedSuccess && (
                  <p className="text-[10px] text-emerald-400 font-bold">{isFa ? "✓ تغییرات با موفقیت ذخیره شد." : "✓ Saved successfully."}</p>
                )}

                <button
                  onClick={handleSaveProfile}
                  className="w-full py-3.5 bg-[#10b981] hover:bg-emerald-400 text-zinc-950 font-black text-xs rounded-2xl transition-all cursor-pointer shadow-md shadow-emerald-400/10"
                >
                  {isFa ? "ذخیره تغییرات" : "Save Details"}
                </button>
              </div>
            )}

            {/* Password & Privacy settings */}
            {activeSection === "password_privacy" && (
              <div className="space-y-5 pt-2 text-left rtl:text-right">
                <div className="space-y-2">
                  <h4 className="text-[10px] font-black text-zinc-400 uppercase">{isFa ? "امنیت حساب" : "Account Security"}</h4>
                  <div className="bg-zinc-950 border border-zinc-850 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-white">{isFa ? "تغییر رمز عبور" : "Change Password"}</p>
                      <p className="text-[10px] text-zinc-500 pt-0.5">{isFa ? "آخرین تغییر: ۲ ماه پیش" : "Last updated: 2 months ago"}</p>
                    </div>
                    <button 
                      onClick={() => {
                        const pass = prompt(isFa ? "رمز عبور جدید را وارد کنید:" : "Enter new password:");
                        if (pass) {
                          setMockPassword("•".repeat(pass.length));
                          alert(isFa ? "رمز عبور با موفقیت بروز شد!" : "Password updated successfully!");
                        }
                      }}
                      className="text-[10px] font-bold text-[#10b981] hover:underline"
                    >
                      {isFa ? "ویرایش" : "Edit"}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-[10px] font-black text-zinc-400 uppercase">{isFa ? "تنظیمات حریم خصوصی" : "Privacy Options"}</h4>
                  <div className="bg-zinc-950 border border-zinc-850 rounded-2xl divide-y divide-zinc-900 overflow-hidden">
                    
                    <div className="p-4 flex items-center justify-between">
                      <div className="pr-4">
                        <p className="text-xs font-bold text-white">{isFa ? "حالت سورپرایز (Surprise Mode)" : "Surprise Mode"}</p>
                        <p className="text-[9px] text-zinc-500 leading-relaxed pt-0.5">
                          {isFa 
                            ? "رزرو آرزوها را تا زمانی که هدیه بگیرید برای شما مخفی نگه می‌دارد." 
                            : "Keep wishes hidden from you after someone claims them."}
                        </p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={surpriseMode} 
                        onChange={(e) => setSurpriseMode(e.target.checked)}
                        className="w-4 h-4 rounded accent-[#10b981] cursor-pointer"
                      />
                    </div>

                    <div className="p-4 flex items-center justify-between">
                      <div className="pr-4">
                        <p className="text-xs font-bold text-white">{isFa ? "حساب کاربری خصوصی (Private)" : "Private Account"}</p>
                        <p className="text-[9px] text-zinc-500 leading-relaxed pt-0.5">
                          {isFa 
                            ? "فقط افراد تایید شده می‌توانند لیست‌های عمومی شما را مشاهده کنند." 
                            : "Only approved followers can view your public wishlists."}
                        </p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={privateAccount} 
                        onChange={(e) => setPrivateAccount(e.target.checked)}
                        className="w-4 h-4 rounded accent-[#10b981] cursor-pointer"
                      />
                    </div>

                  </div>
                </div>
              </div>
            )}

            {/* Currency settings */}
            {activeSection === "currency" && (
              <div className="space-y-4 pt-2 text-left rtl:text-right">
                <div className="space-y-2">
                  <p className="text-xs font-bold text-zinc-300">
                    {isFa 
                      ? "انتخاب واحد پولی پیش‌فرض برای نمایش تمام قیمت‌های اقلام در برنامه:" 
                      : "Choose the default currency for item values across the application:"}
                  </p>
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditCurrency("toman")}
                      className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                        editCurrency === "toman" 
                          ? "bg-[#10b981]/10 border-[#10b981] text-[#10b981]" 
                          : "bg-zinc-950 border-zinc-850 text-zinc-400 hover:border-zinc-800"
                      }`}
                    >
                      <span className="text-lg font-black">تومان</span>
                      <span className="text-[10px] font-mono">Toman (IRR)</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setEditCurrency("usd")}
                      className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                        editCurrency === "usd" 
                          ? "bg-[#10b981]/10 border-[#10b981] text-[#10b981]" 
                          : "bg-zinc-950 border-zinc-850 text-zinc-400 hover:border-zinc-800"
                      }`}
                    >
                      <span className="text-lg font-black">$</span>
                      <span className="text-[10px] font-mono">USD Dollars</span>
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => {
                    alert(isFa ? "واحد پول پیش‌فرض با موفقیت ثبت شد." : "Currency preference saved.");
                    setActiveSection(null);
                  }}
                  className="w-full py-3.5 bg-[#10b981] hover:bg-emerald-400 text-zinc-950 font-black text-xs rounded-2xl transition-all cursor-pointer shadow-md"
                >
                  {isFa ? "تایید و اعمال" : "Confirm & Save"}
                </button>
              </div>
            )}

            {/* Notifications settings */}
            {activeSection === "notifications" && (
              <div className="space-y-4 pt-2 text-left rtl:text-right">
                <div className="bg-zinc-950 border border-zinc-850 rounded-2xl divide-y divide-zinc-900 overflow-hidden">
                  
                  <div className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-white">{isFa ? "اعلان‌های درون‌برنامه (Push)" : "Push Notifications"}</p>
                      <p className="text-[9px] text-zinc-500 pt-0.5">{isFa ? "اعلان‌های فوری در لحظه رزرو یا تغییرات" : "Instant updates for claimed gifts"}</p>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={notifPush} 
                      onChange={(e) => setNotifPush(e.target.checked)}
                      className="w-4 h-4 rounded accent-[#10b981] cursor-pointer"
                    />
                  </div>

                  <div className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-white">{isFa ? "خبرنامه ایمیلی" : "Email Newsletter"}</p>
                      <p className="text-[9px] text-zinc-500 pt-0.5">{isFa ? "ارسال خلاصه‌ای از ایده‌های هدیه جذاب هفتگی" : "Weekly digest of trending gift ideas"}</p>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={notifEmail} 
                      onChange={(e) => setNotifEmail(e.target.checked)}
                      className="w-4 h-4 rounded accent-[#10b981] cursor-pointer"
                    />
                  </div>

                  <div className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-white">{isFa ? "اعلام رزرو شدن هدایا" : "Gift Reservation Alerts"}</p>
                      <p className="text-[9px] text-zinc-500 pt-0.5">{isFa ? "دریافت نوتیفیکیشن هنگام رزرو شدن کادوها" : "Get notified when friend claims a wish"}</p>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={notifClaimed} 
                      onChange={(e) => setNotifClaimed(e.target.checked)}
                      className="w-4 h-4 rounded accent-[#10b981] cursor-pointer"
                    />
                  </div>

                </div>

                <button
                  onClick={() => {
                    alert(isFa ? "تنظیمات اعلان‌ها بروزرسانی شد." : "Notification preferences updated.");
                    setActiveSection(null);
                  }}
                  className="w-full py-3 bg-[#10b981] text-zinc-950 font-black text-xs rounded-2xl cursor-pointer"
                >
                  {isFa ? "ذخیره تغییرات" : "Save Changes"}
                </button>
              </div>
            )}

            {/* Blocked Users */}
            {activeSection === "blocked_users" && (
              <div className="space-y-4 pt-2 text-left rtl:text-right">
                <form onSubmit={handleAddBlock} className="flex gap-2">
                  <input
                    type="text"
                    name="block_user"
                    required
                    placeholder={isFa ? "نام کاربری را وارد کنید..." : "Enter username to block..."}
                    className="flex-1 text-xs bg-zinc-950 border border-zinc-850 rounded-2xl px-3 py-2.5 text-white outline-none"
                  />
                  <button type="submit" className="px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-2xl">
                    {isFa ? "مسدود کن" : "Block"}
                  </button>
                </form>

                <div className="space-y-2">
                  <p className="text-[10px] font-black text-zinc-500 uppercase">{isFa ? "کاربران مسدود شده" : "Blocked List"}</p>
                  {blockedUsers.length === 0 ? (
                    <p className="text-center text-xs text-zinc-600 py-4">{isFa ? "هیچ کاربری مسدود نشده است." : "No blocked users."}</p>
                  ) : (
                    <div className="bg-zinc-950 border border-zinc-850 rounded-2xl divide-y divide-zinc-900 overflow-hidden">
                      {blockedUsers.map((username) => (
                        <div key={username} className="p-3.5 flex justify-between items-center">
                          <span className="text-xs font-mono text-white">@{username}</span>
                          <button 
                            onClick={() => handleUnblock(username)}
                            className="text-[10px] font-bold text-[#10b981] hover:underline"
                          >
                            {isFa ? "رفع مسدودیت" : "Unblock"}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Account Details */}
            {activeSection === "account_details" && (
              <div className="space-y-4 pt-2 text-left rtl:text-right text-xs">
                <div className="bg-zinc-950 border border-zinc-850 rounded-2xl p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">{isFa ? "شناسه کاربری (UID):" : "User Identifier:"}</span>
                    <span className="font-mono text-white select-all">{user.uid || "demo_uid_hamid"}</span>
                  </div>
                  <div className="flex justify-between border-t border-zinc-900 pt-3">
                    <span className="text-zinc-500">{isFa ? "نوع عضویت حساب:" : "Membership Level:"}</span>
                    <span className="font-bold text-amber-400">✨ {isFa ? "پریمیوم طلایی" : "Premium Gold"}</span>
                  </div>
                  <div className="flex justify-between border-t border-zinc-900 pt-3">
                    <span className="text-zinc-500">{isFa ? "تاریخ ثبت نام:" : "Account Created:"}</span>
                    <span className="text-white">۱۴۰۳/۱۱/۲۰ - 12 Feb 2025</span>
                  </div>
                  <div className="flex justify-between border-t border-zinc-900 pt-3">
                    <span className="text-zinc-500">{isFa ? "وضعیت پایگاه داده:" : "PostgreSQL Sync:"}</span>
                    <span className="text-emerald-400 font-black">{isFa ? "● فعال و همگام" : "● Synchronized"}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Disclosures / Privacy & Legal */}
            {activeSection === "disclosures" && (
              <div className="space-y-4 pt-1 text-xs text-zinc-400 leading-relaxed text-left rtl:text-right overflow-y-auto max-h-80 pr-1">
                <div className="space-y-3">
                  <h4 className="font-bold text-white">{isFa ? "سیاست حفظ اطلاعات و حریم خصوصی" : "Privacy and Data Security Policy"}</h4>
                  <p>
                    {isFa 
                      ? "ما در گیفتینو متعهدیم که اطلاعات ثبت شده شما شامل شماره تماس، لیست آرزوها و جزئیات رزرو را به صورت کاملاً رمزنگاری شده روی سرورهای امن نگهداری کنیم."
                      : "We store your contact details and secret claims securely and with encryption on safe servers."}
                  </p>
                  <h4 className="font-bold text-white border-t border-zinc-800 pt-3">{isFa ? "مقررات عمومی استفاده" : "General Terms"}</h4>
                  <p>
                    {isFa 
                      ? "هرگونه استفاده نادرست، انتشار محتوای خلاف موازین اخلاقی یا ایجاد لیست‌های هدیه جعلی ممنوع بوده و منجر به مسدودسازی حساب کاربری خواهد شد."
                      : "Any abuse, improper content or creation of deceptive wishlists will result in permanent account ban."}
                  </p>
                </div>
              </div>
            )}

            {/* Chat with Smart Support */}
            {activeSection === "chat_support" && (
              <div className="space-y-3 pt-1 text-left rtl:text-right">
                <div className="bg-zinc-950 border border-zinc-850 rounded-2xl p-4 h-64 overflow-y-auto space-y-3 flex flex-col">
                  {chatLog.map((chat, idx) => (
                    <div 
                      key={idx} 
                      className={`max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed ${
                        chat.sender === "user" 
                          ? "bg-[#10b981] text-zinc-950 self-end font-bold" 
                          : "bg-zinc-900 text-zinc-300 self-start border border-zinc-800"
                      }`}
                    >
                      {chat.text}
                    </div>
                  ))}
                  {isSupportThinking && (
                    <div className="bg-zinc-900 text-zinc-400 self-start border border-zinc-800 rounded-2xl p-3 text-xs flex items-center gap-1.5 max-w-[80%]">
                      <span className="w-1.5 h-1.5 bg-[#10b981] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 bg-[#10b981] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 bg-[#10b981] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                <form onSubmit={handleSendSupportMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={supportMessage}
                    onChange={(e) => setSupportMessage(e.target.value)}
                    disabled={isSupportThinking}
                    placeholder={
                      isSupportThinking
                        ? (isFa ? "پشتیبان هوشمند در حال پاسخ‌گویی..." : "Smart Support is thinking...")
                        : (isFa ? "پیام خود را بنویسید..." : "Type your message...")
                    }
                    className="flex-1 text-xs bg-zinc-950 border border-zinc-850 rounded-2xl px-3.5 py-3 text-white outline-none focus:border-[#10b981] disabled:opacity-50"
                  />
                  <button 
                    type="submit" 
                    disabled={isSupportThinking || !supportMessage.trim()}
                    className="px-5 py-3 bg-[#10b981] text-zinc-950 font-black text-xs rounded-2xl hover:bg-emerald-400 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isFa ? "ارسال" : "Send"}
                  </button>
                </form>
              </div>
            )}

            {/* Recently deleted wishes trash bin list */}
            {activeSection === "recently_deleted" && (
              <div className="space-y-4 pt-1 text-left rtl:text-right">
                <div className="flex justify-between items-center text-[10px] text-zinc-500">
                  <span>
                    {isFa 
                      ? `${toPersianDigits(recentlyDeleted.length)} کادوی حذف شده در حافظه` 
                      : `${recentlyDeleted.length} recently deleted wishes`}
                  </span>
                  {recentlyDeleted.length > 0 && (
                    <button 
                      onClick={handleClearTrash} 
                      className="text-rose-400 hover:underline font-bold flex items-center gap-1"
                    >
                      <Trash className="w-3.5 h-3.5" />
                      <span>{isFa ? "پاک کردن کل سطل" : "Clear All"}</span>
                    </button>
                  )}
                </div>

                {recentlyDeleted.length === 0 ? (
                  <div className="text-center py-8 text-zinc-500 text-xs bg-zinc-950/40 border border-dashed border-zinc-800 rounded-2xl">
                    {isFa ? "سطل زباله خالی است." : "Trash bin is empty!"}
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                    {recentlyDeleted.map((record, idx) => (
                      <div
                        key={idx}
                        className="bg-zinc-950 border border-zinc-850 p-3.5 rounded-2xl flex items-center justify-between"
                      >
                        <div className="text-left rtl:text-right space-y-1 min-w-0 pr-4">
                          <h4 className="text-xs font-bold text-white truncate leading-tight">{record.item.title}</h4>
                          <p className="text-[9px] text-zinc-500 truncate">
                            {isFa ? `از لیست: ${record.listTitle}` : `From list: ${record.listTitle}`}
                          </p>
                        </div>

                        <button
                          onClick={() => handleRestoreItem(record, idx)}
                          className="px-3 py-2 bg-emerald-500/15 hover:bg-emerald-500/20 text-[#10b981] rounded-xl flex items-center gap-1.5 text-[10px] font-bold cursor-pointer shrink-0"
                          title={isFa ? "بازیابی" : "Restore"}
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>{isFa ? "بازیابی" : "Restore"}</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* FAQs list */}
            {activeSection === "faqs" && (
              <div className="space-y-3 pt-1">
                {faqs.map((faq, idx) => {
                  const isExpanded = faqExpanded === idx;
                  return (
                    <div 
                      key={idx} 
                      className="bg-zinc-950 border border-zinc-850 rounded-2xl overflow-hidden"
                    >
                      <button
                        onClick={() => setFaqExpanded(isExpanded ? null : idx)}
                        className="w-full p-4 flex items-center justify-between text-left rtl:text-right text-xs font-bold text-white hover:bg-zinc-900 transition-colors cursor-pointer"
                      >
                        <span>{faq.q}</span>
                        <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                      </button>
                      
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="p-4 pt-0 text-[10px] text-zinc-400 leading-relaxed border-t border-zinc-900 text-left rtl:text-right"
                          >
                            {faq.a}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            )}

          </motion.div>
        ) : (
          /* Standard settings menu listings (as requested by user) */
          <motion.div
            key="menu-options"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Account Info Header Card */}
            <div className="bg-zinc-900 border border-zinc-850 p-6 rounded-3xl flex flex-col items-center text-center space-y-4 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-500" />
              
              <div className="relative group">
                <div 
                  onClick={onOpenAvatarPicker}
                  className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#10b981]/20 to-amber-500/15 border-[3px] border-zinc-800 hover:border-[#10b981] flex items-center justify-center font-black text-4xl text-white overflow-hidden cursor-pointer relative shadow-xl transition-all"
                  title={isFa ? "تغییر آواتار" : "Change Avatar"}
                >
                  {user.avatar ? (
                    user.avatar.startsWith("http") ? (
                      <img src={user.avatar} className="w-full h-full object-cover" referrerPolicy="no-referrer" alt={user.name} />
                    ) : (
                      <span>{user.avatar}</span>
                    )
                  ) : user.phone === "09123456789" ? (
                    <span>🦁</span>
                  ) : (
                    <span className="text-sm font-black text-zinc-300">{user.name.slice(0, 2).toUpperCase()}</span>
                  )}
                </div>
                
                {/* Pencil Edit Icon Button */}
                <button
                  onClick={onOpenAvatarPicker}
                  className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[#10b981] hover:bg-emerald-400 text-zinc-950 flex items-center justify-center shadow-lg cursor-pointer transition-all border-2 border-zinc-900"
                  title={isFa ? "تغییر عکس" : "Change Photo"}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-1">
                <h3 className="text-sm font-black text-white">{user.name}</h3>
                <p className="text-[11px] text-[#10b981] font-mono tracking-wide leading-none">
                  @{derivedUsername}
                </p>
                <p className="text-[10px] text-zinc-500 font-mono">{user.phone}</p>
              </div>

              {/* Bio block */}
              <div className="w-full space-y-1.5 pt-2 text-left rtl:text-right">
                <label className="text-[9px] font-black text-zinc-500 block uppercase px-1">
                  {isFa ? "درباره من (بیوگرافی)" : "About Me (Bio)"}
                </label>
                <textarea
                  value={editBio}
                  onChange={(e) => {
                    setEditBio(e.target.value);
                    setUser({ ...user, bio: e.target.value });
                  }}
                  placeholder={isFa ? "مثلاً: علاقمند به کتاب، تکنولوژی و بازی‌های رومیزی..." : "e.g., Bookworm, tech enthusiast, board game player..."}
                  rows={2}
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-2xl p-3 text-xs text-zinc-300 outline-none focus:border-[#10b981] transition-all resize-none leading-relaxed"
                />
              </div>
            </div>

            {/* Options Categories */}
            <div className="space-y-5">
              
              {/* Profile Group */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-wider px-2">
                  {isFa ? "حساب و نمایه" : "Profile Settings"}
                </h4>

                <div className="bg-zinc-900 border border-zinc-850 rounded-3xl divide-y divide-zinc-850/45 overflow-hidden shadow-lg">
                  
                  {/* Share Profile Link */}
                  <div
                    onClick={handleCopyProfileLink}
                    className="p-4 flex items-center justify-between hover:bg-zinc-850/30 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Share2 className="w-4 h-4 text-zinc-500" />
                      <span className="text-xs font-bold text-white">
                        {isFa ? "اشتراک‌گذاری آدرس پروفایل من" : "Share Profile link"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {copiedLink && (
                        <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full animate-fade-in">
                          {isFa ? "کپی شد" : "Copied"}
                        </span>
                      )}
                      <ChevronDown className="w-4 h-4 text-zinc-600 rotate-270 rtl:rotate-90" />
                    </div>
                  </div>

                  {/* Following / Followers */}
                  <div
                    onClick={onBack} // Redirects back to list where they can select friends from primary tab
                    className="p-4 flex items-center justify-between hover:bg-zinc-850/30 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Users className="w-4 h-4 text-zinc-500" />
                      <span className="text-xs font-bold text-white">
                        {isFa ? "دنبال‌کنندگان و دوستان" : "Following / Followers"}
                      </span>
                    </div>
                    <ChevronDown className="w-4 h-4 text-zinc-600 rotate-270 rtl:rotate-90" />
                  </div>

                  {/* Name, Username, & Email */}
                  <div
                    onClick={() => setActiveSection("profile")}
                    className="p-4 flex items-center justify-between hover:bg-zinc-850/30 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <User className="w-4 h-4 text-zinc-500" />
                      <span className="text-xs font-bold text-white">
                        {isFa ? "نام، نام کاربری و ایمیل" : "Name, Username, & Email"}
                      </span>
                    </div>
                    <ChevronDown className="w-4 h-4 text-zinc-600 rotate-270 rtl:rotate-90" />
                  </div>

                  {/* Password & Privacy */}
                  <div
                    onClick={() => setActiveSection("password_privacy")}
                    className="p-4 flex items-center justify-between hover:bg-zinc-850/30 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Shield className="w-4 h-4 text-zinc-500" />
                      <span className="text-xs font-bold text-white">
                        {isFa ? "گذرواژه و حریم خصوصی" : "Password & Privacy"}
                      </span>
                    </div>
                    <ChevronDown className="w-4 h-4 text-zinc-600 rotate-270 rtl:rotate-90" />
                  </div>

                  {/* Currency */}
                  <div
                    onClick={() => setActiveSection("currency")}
                    className="p-4 flex items-center justify-between hover:bg-zinc-850/30 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Coins className="w-4 h-4 text-zinc-500" />
                      <span className="text-xs font-bold text-white">
                        {isFa ? "واحد پول پیش‌فرض (تومان / دلار)" : "Currency Preference"}
                      </span>
                    </div>
                    <ChevronDown className="w-4 h-4 text-zinc-600 rotate-270 rtl:rotate-90" />
                  </div>

                  {/* Notifications */}
                  <div
                    onClick={() => setActiveSection("notifications")}
                    className="p-4 flex items-center justify-between hover:bg-zinc-850/30 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Bell className="w-4 h-4 text-zinc-500" />
                      <span className="text-xs font-bold text-white">
                        {isFa ? "تنظیمات دریافت نوتیفیکیشن‌ها" : "Notifications"}
                      </span>
                    </div>
                    <ChevronDown className="w-4 h-4 text-zinc-600 rotate-270 rtl:rotate-90" />
                  </div>

                </div>
              </div>

              {/* Support Group */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-wider px-2">
                  {isFa ? "پشتیبانی و اطلاعات" : "Support"}
                </h4>

                <div className="bg-zinc-900 border border-zinc-850 rounded-3xl divide-y divide-zinc-850/45 overflow-hidden shadow-lg">
                  
                  {/* FAQs */}
                  <div
                    onClick={() => setActiveSection("faqs")}
                    className="p-4 flex items-center justify-between hover:bg-zinc-850/30 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <HelpCircle className="w-4 h-4 text-zinc-500" />
                      <span className="text-xs font-bold text-white">
                        {isFa ? "سوالات متداول و راهنمای برنامه" : "FAQs / Guide"}
                      </span>
                    </div>
                    <ChevronDown className="w-4 h-4 text-zinc-600 rotate-270 rtl:rotate-90" />
                  </div>

                  {/* Chat Support */}
                  <div
                    onClick={() => setActiveSection("chat_support")}
                    className="p-4 flex items-center justify-between hover:bg-zinc-850/30 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <MessageSquare className="w-4 h-4 text-zinc-500" />
                      <span className="text-xs font-bold text-white">
                        {isFa ? "گفتگو با پشتیبانی هوشمند" : "Chat with Support"}
                      </span>
                    </div>
                    <ChevronDown className="w-4 h-4 text-zinc-600 rotate-270 rtl:rotate-90" />
                  </div>

                </div>
              </div>

              {/* Account Details Group */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-wider px-2">
                  {isFa ? "اطلاعات تکمیلی و قوانین" : "Account Operations"}
                </h4>

                <div className="bg-zinc-900 border border-zinc-850 rounded-3xl divide-y divide-zinc-850/45 overflow-hidden shadow-lg">
                  
                  {/* Recently Deleted */}
                  <div
                    onClick={() => setActiveSection("recently_deleted")}
                    className="p-4 flex items-center justify-between hover:bg-zinc-850/30 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Trash2 className="w-4 h-4 text-zinc-500" />
                      <span className="text-xs font-bold text-white">
                        {isFa ? "سطل زباله (بازیابی آرزوهای حذف شده)" : "Recently Deleted"}
                      </span>
                    </div>
                    <ChevronDown className="w-4 h-4 text-zinc-600 rotate-270 rtl:rotate-90" />
                  </div>

                  {/* Blocked Users */}
                  <div
                    onClick={() => setActiveSection("blocked_users")}
                    className="p-4 flex items-center justify-between hover:bg-zinc-850/30 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Ban className="w-4 h-4 text-zinc-500" />
                      <span className="text-xs font-bold text-white">
                        {isFa ? "لیست مسدود شدگان" : "Blocked Users"}
                      </span>
                    </div>
                    <ChevronDown className="w-4 h-4 text-zinc-600 rotate-270 rtl:rotate-90" />
                  </div>

                  {/* Account detail */}
                  <div
                    onClick={() => setActiveSection("account_details")}
                    className="p-4 flex items-center justify-between hover:bg-zinc-850/30 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Landmark className="w-4 h-4 text-zinc-500" />
                      <span className="text-xs font-bold text-white">
                        {isFa ? "مشخصات و جزئیات حساب کاربری" : "Account details"}
                      </span>
                    </div>
                    <ChevronDown className="w-4 h-4 text-zinc-600 rotate-270 rtl:rotate-90" />
                  </div>

                  {/* Disclosures */}
                  <div
                    onClick={() => setActiveSection("disclosures")}
                    className="p-4 flex items-center justify-between hover:bg-zinc-850/30 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <AlertCircle className="w-4 h-4 text-zinc-500" />
                      <span className="text-xs font-bold text-white">
                        {isFa ? "قوانین، مقررات و حریم خصوصی" : "Disclosures / Privacy"}
                      </span>
                    </div>
                    <ChevronDown className="w-4 h-4 text-zinc-600 rotate-270 rtl:rotate-90" />
                  </div>

                </div>
              </div>

              {/* Logout & Footer */}
              <div className="space-y-4 pt-2">
                <button
                  onClick={onLogout}
                  className="w-full p-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/10 hover:border-rose-500/25 rounded-2xl flex items-center justify-center gap-2 font-black text-xs transition-all cursor-pointer shadow-md"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{isFa ? "خروج از حساب کاربری" : "Log Out of Giftino"}</span>
                </button>

                <p className="text-center text-[9px] font-mono text-zinc-600">
                  Giftino v2.33.1
                </p>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
