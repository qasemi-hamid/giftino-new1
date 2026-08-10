import React, { useState, useEffect } from "react";
import { UserProfile, Wishlist, WishlistItem, Language } from "./types";
import { auth, getRedirectResult } from "./lib/firebase";
import LoginPortal from "./components/LoginPortal";
import OnboardingTour from "./components/OnboardingTour";
import ProfileView from "./components/ProfileView";
import FriendsSocial from "./components/FriendsSocial";
import AddWish from "./components/AddWish";
import ExploreIdeas from "./components/ExploreIdeas";
import ClaimedItems from "./components/ClaimedItems";
import SettingsMenu from "./components/SettingsMenu";
import AvatarPicker from "./components/AvatarPicker";
import Logo from "./components/Logo";
import { PriceSearchModal } from "./components/PriceSearchModal";
import { AiAssistant } from "./components/AiAssistant";
import CalendarOccasions from "./components/CalendarOccasions";
import { AiOnboardingWidget } from "./components/AiOnboardingWidget";
import { SmartAiNudgesPanel, generateSmartNudges, SmartNudge } from "./components/SmartAiNudges";

import { 
  Gift, Users, PlusCircle, Sparkles, CheckCircle2, Settings, 
  Globe, LogOut, Heart, HelpCircle, Search, CalendarDays,
  Menu, Bell, Plus, X, Compass, Lightbulb
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toPersianDigits } from "./utils";

// Seeded initial wishlists for first-time premium user experience
const SEEDED_WISHLISTS: Wishlist[] = [
  {
    id: "wl_bday",
    title: "تولد ۲۶ سالگی من 🎂",
    occasionDate: "2026-08-15",
    occasionType: "birthday",
    items: [
      {
        id: "item_kb",
        title: "کیبورد مکانیکال Keychron K2",
        price: 4800000,
        link: "https://www.digikala.com/search/?q=keychron+k2",
        notes: "سوییچ قهوه‌ای (Brown Switch) همراه با نور پس‌زمینه RGB ترجیحاً",
        priority: "high",
        isReserved: true,
        reservedBy: "مریم",
      },
      {
        id: "item_coffee",
        title: "قهوه‌ساز موکاپات برقی رومولو",
        price: 1200000,
        notes: "رنگ سفید یا مشکی مات خیلی عالی میشه",
        priority: "medium",
        isReserved: false,
      },
      {
        id: "item_book",
        title: "کتاب صوتی یا فیزیکی 'جامعه فرسودگی'",
        price: 95000,
        link: "https://www.digikala.com/product/dkp-4059283",
        notes: "نشر نو، ترجمه آیدین فرنگی",
        priority: "low",
        isReserved: false,
      },
    ],
  },
  {
    id: "wl_yalda",
    title: "جشن شب یلدای خانوادگی 🍉",
    occasionDate: "2026-12-21",
    occasionType: "yalda",
    items: [
      {
        id: "item_hafiz",
        title: "دیوان حافظ نفیس با جعبه چرمی",
        price: 650000,
        notes: "برای تفال شب یلدا، خط نستعلیق زیبا داشته باشه",
        priority: "high",
        isReserved: false,
      },
      {
        id: "item_pomegranate",
        title: "ظرف انار خوری سفالی میناکاری",
        price: 280000,
        priority: "medium",
        isReserved: true,
        reservedBy: "حسین دایی",
      }
    ]
  },
  {
    id: "wl_past",
    title: "سالگرد ازدواج پدر و مادر 💑",
    occasionDate: "2026-05-10",
    occasionType: "other",
    items: [
      {
        id: "item_past_1",
        title: "کارت هدیه شام دو نفره رستوران لوکس",
        price: 2500000,
        priority: "high",
        isReserved: true,
        reservedBy: "حمیدرضا",
      }
    ]
  }
];

interface ClaimedItem {
  friendId: string;
  friendName: string;
  friendAvatar: string;
  listId: string;
  listTitle: string;
  item: WishlistItem;
}

export default function App() {
  const [language, setLanguage] = useState<Language>("fa");
  const theme = "dark";

  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem("giftino_user");
    return saved ? JSON.parse(saved) : null;
  });

  const [wishlists, setWishlists] = useState<Wishlist[]>(() => {
    const saved = localStorage.getItem("giftino_wishlists");
    if (saved) return JSON.parse(saved);
    const savedUser = localStorage.getItem("giftino_user");
    if (savedUser) {
      const u = JSON.parse(savedUser);
      if (u.isDemo) return SEEDED_WISHLISTS;
    }
    return [];
  });

  const [followingFriendIds, setFollowingFriendIds] = useState<string[]>(() => {
    const saved = localStorage.getItem("giftino_following_friends");
    if (saved) return JSON.parse(saved);
    const savedUser = localStorage.getItem("giftino_user");
    if (savedUser) {
      const u = JSON.parse(savedUser);
      if (u.isDemo) return ["f_maryam"];
    }
    return [];
  });

  const [claimedItems, setClaimedItems] = useState<ClaimedItem[]>(() => {
    const saved = localStorage.getItem("giftino_claimed_items");
    if (saved) return JSON.parse(saved);
    const savedUser = localStorage.getItem("giftino_user");
    if (savedUser) {
      const u = JSON.parse(savedUser);
      if (u.isDemo) {
        return [
          {
            friendId: "f_maryam",
            friendName: "مریم رضایی",
            friendAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120",
            listId: "wl_maryam_birthday",
            listTitle: "تولد ۲۷ سالگی مریم 🎂",
            item: {
              id: "it_maryam_2",
              title: "ماگ سرامیکی دست‌ساز طرح کهکشان",
              price: 320000,
              link: "https://www.digikala.com/search/?q=ماگ+سرامیکی+دست‌ساز",
              notes: "ترجیحاً از کارهای گالری دستین آرت باشه.",
              priority: "high",
              isReserved: true,
              reservedBy: u.name
            }
          }
        ];
      }
    }
    return [];
  });

  const [activeTab, setActiveTab] = useState<string>("my-lists");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showNotificationsPopup, setShowNotificationsPopup] = useState(false);
  const [notifications, setNotifications] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("giftino_notifications");
      if (saved) return JSON.parse(saved);
      const demoNotifs = [
        {
          id: "notif_1",
          title: "مریم یکی از آرزوهای شما را رزرو کرد 🎁",
          desc: "کیبورد مکانیکال Keychron K2",
          sentAt: new Date(Date.now() - 3600000 * 2).toISOString()
        },
        {
          id: "notif_2",
          title: "حمیدرضا یک آرزوی پیشنهادی جدید ثبت کرد 🤫",
          desc: "کارت هدیه شام دو نفره رستوران لوکس",
          sentAt: new Date(Date.now() - 3600000 * 24).toISOString()
        }
      ];
      localStorage.setItem("giftino_notifications", JSON.stringify(demoNotifs));
      return demoNotifs;
    } catch {
      return [];
    }
  });

  const [apiStatus, setApiStatus] = useState<"checking" | "online" | "missing_key">("checking");
  const [tourActive, setTourActive] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);

  // Global Price comparison search state
  const [globalPriceSearchOpen, setGlobalPriceSearchOpen] = useState(false);
  const [globalPriceSearchQuery, setGlobalPriceSearchQuery] = useState("");
  const [globalPriceSearchTargetPrice, setGlobalPriceSearchTargetPrice] = useState<number | undefined>(undefined);

  // Auto open advisor modal when switching from ExploreIdeas
  const [autoOpenAdvisorModal, setAutoOpenAdvisorModal] = useState(false);

  const handleAddGiftFromAi = (gift: { title: string; price?: number; priority: "high" | "medium" | "low"; notes?: string }) => {
    const newItem: WishlistItem = {
      id: "ai_" + Math.random().toString(36).substring(2, 9),
      title: gift.title,
      price: gift.price || 0,
      priority: gift.priority,
      notes: gift.notes || (language === "fa" ? "اضافه شده توسط دستیار هوشمند" : "Added by AI Assistant"),
      isReserved: false,
    };

    if (wishlists.length === 0) {
      const newList: Wishlist = {
        id: "wl_" + Math.random().toString(36).substring(2, 9),
        title: language === "fa" ? "لیست هوشمند کادوهای من ✨" : "My Smart Wishlist ✨",
        occasionDate: new Date().toISOString().split("T")[0],
        occasionType: "birthday",
        items: [newItem],
      };
      setWishlists([newList]);
    } else {
      const updated = wishlists.map((wl, idx) => {
        if (idx === 0) {
          return {
            ...wl,
            items: [...wl.items, newItem],
          };
        }
        return wl;
      });
      setWishlists(updated);
    }
    setActiveTab("my-lists");
  };

  const handleCreateWishlistFromAi = (title: string, occasionType: string, date?: string): Wishlist => {
    const newList: Wishlist = {
      id: "wl_" + Math.random().toString(36).substring(2, 9),
      title,
      occasionDate: date || new Date().toISOString().split("T")[0],
      occasionType: (occasionType as any) || "birthday",
      items: [],
    };
    setWishlists((prev) => [newList, ...prev]);
    setActiveTab("my-lists");
    return newList;
  };

  const handleAddWishlistItemFromAi = (listId: string, item: { title: string; price?: number; priority: "high" | "medium" | "low"; notes?: string }) => {
    const newItem: WishlistItem = {
      id: "item_" + Math.random().toString(36).substring(2, 9),
      title: item.title,
      price: item.price || 0,
      priority: item.priority || "high",
      notes: item.notes || (language === "fa" ? "افزوده شده با دستیار هوشمند" : "Added with AI Assistant"),
      isReserved: false,
    };

    setWishlists((prev) =>
      prev.map((wl) => {
        if (wl.id === listId) {
          return {
            ...wl,
            items: [...wl.items, newItem],
          };
        }
        return wl;
      })
    );
    setActiveTab("my-lists");
  };

  const handleExecuteNudgeAction = (nudge: SmartNudge) => {
    if (nudge.targetTab) {
      setActiveTab(nudge.targetTab);
    }
    if (nudge.type === "reserved_unbought" && nudge.payload) {
      const itemToMark = nudge.payload;
      setClaimedItems((prev) =>
        prev.map((ci) =>
          ci.friendId === itemToMark.friendId && ci.item.id === itemToMark.item.id
            ? { ...ci, isCompleted: true }
            : ci
        )
      );
    } else if (nudge.type === "no_wishlist") {
      handleCreateWishlistFromAi(
        language === "fa" ? "تولد من 🎂" : "My Birthday 🎂",
        "birthday"
      );
    } else if (nudge.type === "unshared_wishlist") {
      localStorage.setItem("giftino_wishlist_shared_v1", "true");
      setActiveTab("my-lists");
    }
    setShowNotificationsPopup(false);
  };

  const isFa = language === "fa";

  // Persistence triggers
  useEffect(() => {
    if (user) {
      localStorage.setItem("giftino_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("giftino_user");
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem("giftino_wishlists", JSON.stringify(wishlists));
  }, [wishlists]);

  useEffect(() => {
    localStorage.setItem("giftino_following_friends", JSON.stringify(followingFriendIds));
  }, [followingFriendIds]);

  useEffect(() => {
    localStorage.setItem("giftino_claimed_items", JSON.stringify(claimedItems));
  }, [claimedItems]);

  // 1. Firebase Auth state listener (auto-restore Google login sessions & handle mobile redirects)
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    const initAuthListener = async () => {
      try {
        // Process mobile redirect login if available
        getRedirectResult(auth).then((result) => {
          if (result && result.user) {
            const firebaseUser = result.user;
            const profile: UserProfile = {
              name: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User",
              phone: firebaseUser.phoneNumber || "",
              avatar: firebaseUser.photoURL || "👨‍🚀",
              isLoggedIn: true,
              isDemo: false,
              uid: firebaseUser.uid,
              email: firebaseUser.email || undefined,
            };
            setUser(profile);
            localStorage.setItem("giftino_user", JSON.stringify(profile));
          }
        }).catch((err) => {
          console.warn("Redirect login result error:", err);
        });

        unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
          if (firebaseUser) {
            const profile: UserProfile = {
              name: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User",
              phone: firebaseUser.phoneNumber || "",
              avatar: firebaseUser.photoURL || "👨‍🚀",
              isLoggedIn: true,
              isDemo: false,
              uid: firebaseUser.uid,
              email: firebaseUser.email || undefined,
            };
            setUser(profile);
            localStorage.setItem("giftino_user", JSON.stringify(profile));
          }
        });
      } catch (err) {
        console.error("Firebase auth listener failed to init:", err);
      }
    };
    initAuthListener();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // 2. Load synced data from Cloud SQL PostgreSQL upon login
  useEffect(() => {
    if (!user || !user.isLoggedIn || !user.uid) return;

    const loadSyncedData = async () => {
      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };

        const currentUser = auth.currentUser;
        if (currentUser) {
          const token = await currentUser.getIdToken();
          headers["Authorization"] = `Bearer ${token}`;
        } else {
          headers["x-demo-user-uid"] = user.uid;
          headers["x-demo-user-name"] = encodeURIComponent(user.name);
          if (user.email) headers["x-demo-user-email"] = encodeURIComponent(user.email);
        }

        const response = await fetch("/api/user/data", { headers });
        if (response.ok) {
          const data = await response.json();
          if (data.found) {
            console.log("Successfully restored user state from Cloud SQL PostgreSQL:", data);
            if (data.wishlists) {
              setWishlists(data.wishlists);
            }
            if (data.followingFriendIds) {
              setFollowingFriendIds(data.followingFriendIds);
            }
            if (data.claimedItems) {
              setClaimedItems(data.claimedItems);
            }
            if (data.user) {
              setUser(prev => prev ? { ...prev, ...data.user } : data.user);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load user state from Cloud SQL:", err);
      }
    };

    loadSyncedData();
  }, [user?.uid]);

  // 3. Debounced Auto-sync of user state to Cloud SQL PostgreSQL
  useEffect(() => {
    if (!user || !user.isLoggedIn || !user.uid) return;

    const syncToDatabase = async () => {
      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };

        const currentUser = auth.currentUser;
        if (currentUser) {
          const token = await currentUser.getIdToken();
          headers["Authorization"] = `Bearer ${token}`;
        } else {
          headers["x-demo-user-uid"] = user.uid;
          headers["x-demo-user-name"] = encodeURIComponent(user.name);
          if (user.email) headers["x-demo-user-email"] = encodeURIComponent(user.email);
        }

        const response = await fetch("/api/user/sync", {
          method: "POST",
          headers,
          body: JSON.stringify({
            name: user.name,
            phone: user.phone,
            avatar: user.avatar,
            isDemo: user.isDemo,
            wishlists,
            followingFriendIds,
            claimedItems,
          }),
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          console.warn("PostgreSQL sync status:", err);
        } else {
          const resData = await response.json().catch(() => ({}));
          if (resData.synced === false) {
            console.log("Local offline state preserved (Cloud SQL sync pending)");
          } else {
            console.log("PostgreSQL DB synchronized successfully!");
          }
        }
      } catch (err) {
        console.error("Failed to sync state to Cloud SQL PostgreSQL:", err);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      syncToDatabase();
    }, 2000);

    return () => clearTimeout(delayDebounceFn);
  }, [user, wishlists, followingFriendIds, claimedItems]);

  // Check Google Gemini backend API health status
  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => {
        if (data.hasApiKey) {
          setApiStatus("online");
        } else {
          setApiStatus("missing_key");
        }
      })
      .catch((err) => {
        console.error("Health check failed:", err);
        setApiStatus("missing_key");
      });
  }, []);

  const handleToggleLanguage = () => {
    setLanguage((prev) => (prev === "fa" ? "en" : "fa"));
  };

  const handleLogin = (profile: UserProfile) => {
    setUser(profile);
    
    if (profile.isDemo) {
      const phone = profile.phone;
      
      // Define the 4 standard wishlists for each of the users
      const hamidWishlists: Wishlist[] = [
        {
          id: "wl_hamid_bday",
          title: "تولد ۲۶ سالگی من 🎂",
          occasionDate: "2026-08-15",
          occasionType: "birthday",
          items: [
            {
              id: "it_hamid_1",
              title: "کیبورد مکانیکال Keychron K2",
              price: 4800000,
              link: "https://www.digikala.com/search/?q=keychron+k2",
              notes: "سوییچ قهوه‌ای (Brown Switch) همراه با نور پس‌زمینه RGB ترجیحاً",
              priority: "high",
              isReserved: true,
              reservedBy: "مریم رضایی",
            },
            {
              id: "it_hamid_2",
              title: "قهوه‌ساز موکاپات برقی رومولو",
              price: 1200000,
              notes: "رنگ سفید یا مشکی مات خیلی عالی میشه",
              priority: "medium",
              isReserved: false,
            },
            {
              id: "it_hamid_3",
              title: "کتاب صوتی یا فیزیکی 'جامعه فرسودگی'",
              price: 95000,
              link: "https://www.digikala.com/product/dkp-4059283",
              notes: "نشر نو، ترجمه آیدین فرنگی",
              priority: "low",
              isReserved: false,
            },
          ],
        },
        {
          id: "wl_hamid_house",
          title: "جشن خانه نو مبارکی 🏡",
          occasionDate: "2026-09-20",
          occasionType: "other",
          items: [
            {
              id: "it_hamid_4",
              title: "گلدان آپارتمانی برگ انجیری بزرگ",
              price: 350000,
              notes: "سالم و شاداب باشه با گلدان سرامیکی سفید",
              priority: "high",
              isReserved: true,
              reservedBy: "علی صبوری",
            },
            {
              id: "it_hamid_5",
              title: "ست فنجان قهوه خوری سرامیکی دست‌ساز",
              price: 420000,
              notes: "۶ تایی، طرح‌های سنتی یا مدرن ساده",
              priority: "medium",
              isReserved: false,
            }
          ]
        }
      ];

      const maryamWishlists: Wishlist[] = [
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
              reservedBy: "حمیدرضا قاسمی"
            },
            {
              id: "it_maryam_3",
              title: "کتاب اثر مرکب نوشته دارن هاردی",
              price: 120000,
              link: "https://www.digikala.com/search/?q=کتاب+اثر+مرکب",
              notes: "ترجمه لطیف احمدپور نشر شریف عالیه.",
              priority: "low",
              isReserved: true,
              reservedBy: "سارا احمدی"
            }
          ]
        }
      ];

      const aliWishlists: Wishlist[] = [
        {
          id: "wl_ali_graduation",
          title: "جشن فارغ‌التحصیلی علی 🎓",
          occasionDate: "2026-09-01",
          occasionType: "graduation",
          items: [
            {
              id: "it_ali_1",
              title: "پاوربانک شیائومی ۲۰۰۰۰ میلی‌آمپر",
              price: 890000,
              link: "https://www.digikala.com/search/?q=پاوربانک+شیائومی",
              notes: "فست شارژ باشه حتماً دمتون گرم",
              priority: "high",
              isReserved: true,
              reservedBy: "حمیدرضا قاسمی"
            },
            {
              id: "it_ali_2",
              title: "کوله پشتی چرمی دیوید جونز",
              price: 1950000,
              notes: "رنگ‌های قهوه‌ای یا عسلی",
              priority: "medium",
              isReserved: false
            }
          ]
        }
      ];

      const saraWishlists: Wishlist[] = [
        {
          id: "wl_sara_art",
          title: "کارگاه هنری سارا 🎨",
          occasionDate: "2026-10-05",
          occasionType: "other",
          items: [
            {
              id: "it_sara_1",
              title: "ست آبرنگ حرفه‌ای سن‌پترزبورگ",
              price: 1550000,
              notes: "۲۴ یا ۳۶ رنگ باشه خیلی عالی میشه",
              priority: "high",
              isReserved: true,
              reservedBy: "مریم رضایی"
            },
            {
              id: "it_sara_2",
              title: "دفترچه طراحی جلد چرمی فابر کاستل",
              price: 180000,
              priority: "medium",
              isReserved: false
            }
          ]
        }
      ];

      // Define static friend representations of each other
      const friendHamid = {
        id: "f_hamid",
        name: "حمیدرضا قاسمی",
        username: "hamidrezaghasemi",
        avatar: "👨‍💻",
        wishlists: hamidWishlists
      };

      const friendMaryam = {
        id: "f_maryam",
        name: "مریم رضایی",
        username: "maryam_rezai",
        avatar: "👩‍🎨",
        wishlists: maryamWishlists
      };

      const friendAli = {
        id: "f_ali",
        name: "علی صبوری",
        username: "ali_sabouri",
        avatar: "👨‍🚀",
        wishlists: aliWishlists
      };

      const friendSara = {
        id: "f_sara",
        name: "سارا احمدی",
        username: "sara_ahmadi",
        avatar: "👩‍⚕️",
        wishlists: saraWishlists
      };

      // Select states according to active logged-in user
      let activeWishlists: Wishlist[] = [];
      let activeFollowing: string[] = [];
      let activeClaimed: ClaimedItem[] = [];
      let activeSentInvites: any[] = [];
      let activeReceivedInvites: any[] = [];
      let friendsData: any[] = [];

      if (phone === "09123456789") {
        // Hamidreza
        activeWishlists = hamidWishlists;
        activeFollowing = ["f_maryam", "f_ali", "f_sara"];
        activeClaimed = [
          {
            friendId: "f_maryam",
            friendName: "مریم رضایی",
            friendAvatar: friendMaryam.avatar,
            listId: "wl_maryam_birthday",
            listTitle: "تولد ۲۷ سالگی مریم 🎂",
            item: maryamWishlists[0].items[1] // galaxy mug
          },
          {
            friendId: "f_ali",
            friendName: "علی صبوری",
            friendAvatar: friendAli.avatar,
            listId: "wl_ali_graduation",
            listTitle: "جشن فارغ‌التحصیلی علی 🎓",
            item: aliWishlists[0].items[0] // xiaomi powerbank
          }
        ];
        activeSentInvites = [
          { id: "inv_1", name: "پدر عزیزم", phone: "09121112233", status: "pending", invitedAt: "۱۴۰۵/۰۲/۱۰" },
          { id: "inv_2", name: "رضا کریمی (همکارم)", phone: "09193334455", status: "pending", invitedAt: "۱۴۰۵/۰۲/۱۲" }
        ];
        activeReceivedInvites = [
          { id: "rec_1", name: "مریم رضایی", phone: "09121111111", avatar: "👩‍🎨", hasRegistered: true, isFollowed: true, suggestedId: "f_maryam" },
          { id: "rec_2", name: "علی صبوری", phone: "09122222222", avatar: "👨‍🚀", hasRegistered: true, isFollowed: true, suggestedId: "f_ali" },
          { id: "rec_3", name: "سارا احمدی", phone: "09123333333", avatar: "👩‍⚕️", hasRegistered: true, isFollowed: true, suggestedId: "f_sara" },
          { id: "rec_4", name: "مهندس امین احمدی", phone: "09187654321", avatar: "👨‍💻", hasRegistered: true, isFollowed: false, suggestedId: "f_amin" }
        ];
        friendsData = [friendMaryam, friendAli, friendSara];
      } 
      else if (phone === "09121111111") {
        // Maryam
        activeWishlists = maryamWishlists;
        activeFollowing = ["f_hamid", "f_ali", "f_sara"];
        activeClaimed = [
          {
            friendId: "f_hamid",
            friendName: "حمیدرضا قاسمی",
            friendAvatar: friendHamid.avatar,
            listId: "wl_hamid_bday",
            listTitle: "تولد ۲۶ سالگی من 🎂",
            item: hamidWishlists[0].items[0] // keychron k2
          },
          {
            friendId: "f_sara",
            friendName: "سارا احمدی",
            friendAvatar: friendSara.avatar,
            listId: "wl_sara_art",
            listTitle: "کارگاه هنری سارا 🎨",
            item: saraWishlists[0].items[0] // watercolor
          }
        ];
        activeSentInvites = [
          { id: "inv_3", name: "مادر عزیزم", phone: "09124445566", status: "pending", invitedAt: "۱۴۰۵/۰۳/۰۱" }
        ];
        activeReceivedInvites = [
          { id: "rec_1", name: "حمیدرضا قاسمی", phone: "09123456789", avatar: "👨‍💻", hasRegistered: true, isFollowed: true, suggestedId: "f_hamid" },
          { id: "rec_2", name: "علی صبوری", phone: "09122222222", avatar: "👨‍🚀", hasRegistered: true, isFollowed: true, suggestedId: "f_ali" },
          { id: "rec_3", name: "سارا احمدی", phone: "09123333333", avatar: "👩‍⚕️", hasRegistered: true, isFollowed: true, suggestedId: "f_sara" }
        ];
        friendsData = [friendHamid, friendAli, friendSara];
      }
      else if (phone === "09122222222") {
        // Ali
        activeWishlists = aliWishlists;
        activeFollowing = ["f_hamid", "f_maryam", "f_sara"];
        activeClaimed = [
          {
            friendId: "f_hamid",
            friendName: "حمیدرضا قاسمی",
            friendAvatar: friendHamid.avatar,
            listId: "wl_hamid_house",
            listTitle: "جشن خانه نو مبارکی 🏡",
            item: hamidWishlists[1].items[0] // plant pot
          }
        ];
        activeSentInvites = [
          { id: "inv_4", name: "کامران (همکلاسی)", phone: "09127778899", status: "pending", invitedAt: "۱۴۰۵/۰۳/۱۵" }
        ];
        activeReceivedInvites = [
          { id: "rec_1", name: "حمیدرضا قاسمی", phone: "09123456789", avatar: "👨‍💻", hasRegistered: true, isFollowed: true, suggestedId: "f_hamid" },
          { id: "rec_2", name: "مریم رضایی", phone: "09121111111", avatar: "👩‍🎨", hasRegistered: true, isFollowed: true, suggestedId: "f_maryam" },
          { id: "rec_3", name: "سارا احمدی", phone: "09123333333", avatar: "👩‍⚕️", hasRegistered: true, isFollowed: true, suggestedId: "f_sara" }
        ];
        friendsData = [friendHamid, friendMaryam, friendSara];
      }
      else {
        // Sara
        activeWishlists = saraWishlists;
        activeFollowing = ["f_hamid", "f_maryam", "f_ali"];
        activeClaimed = [
          {
            friendId: "f_maryam",
            friendName: "مریم رضایی",
            friendAvatar: friendMaryam.avatar,
            listId: "wl_maryam_birthday",
            listTitle: "تولد ۲۷ سالگی مریم 🎂",
            item: maryamWishlists[0].items[2] // the compound effect book
          }
        ];
        activeSentInvites = [
          { id: "inv_5", name: "رعنا (دوست صمیمی)", phone: "09128889900", status: "pending", invitedAt: "۱۴۰۵/۰۴/۰1" }
        ];
        activeReceivedInvites = [
          { id: "rec_1", name: "حمیدرضا قاسمی", phone: "09123456789", avatar: "👨‍💻", hasRegistered: true, isFollowed: true, suggestedId: "f_hamid" },
          { id: "rec_2", name: "مریم رضایی", phone: "09121111111", avatar: "👩‍🎨", hasRegistered: true, isFollowed: true, suggestedId: "f_maryam" },
          { id: "rec_3", name: "علی صبوری", phone: "09122222222", avatar: "👨‍🚀", hasRegistered: true, isFollowed: true, suggestedId: "f_ali" }
        ];
        friendsData = [friendHamid, friendMaryam, friendAli];
      }

      localStorage.setItem("giftino_wishlists", JSON.stringify(activeWishlists));
      localStorage.setItem("giftino_following_friends", JSON.stringify(activeFollowing));
      localStorage.setItem("giftino_claimed_items", JSON.stringify(activeClaimed));
      localStorage.setItem("giftino_sent_invites", JSON.stringify(activeSentInvites));
      localStorage.setItem("giftino_received_invites", JSON.stringify(activeReceivedInvites));
      localStorage.setItem("giftino_friends_data", JSON.stringify(friendsData));

      setWishlists(activeWishlists);
      setFollowingFriendIds(activeFollowing);
      setClaimedItems(activeClaimed);

      // Do not trigger Onboarding Tour after login per user request
      setTourActive(false);
    } else {
      // Real standard user logs in with phone -> START COMPLETELY FRESH (Clean Slate!)
      localStorage.setItem("giftino_wishlists", JSON.stringify([]));
      localStorage.setItem("giftino_following_friends", JSON.stringify([]));
      localStorage.setItem("giftino_claimed_items", JSON.stringify([]));
      localStorage.setItem("giftino_sent_invites", JSON.stringify([]));
      localStorage.setItem("giftino_received_invites", JSON.stringify([]));

      setWishlists([]);
      setFollowingFriendIds([]);
      setClaimedItems([]);
      setTourActive(false);
    }
  };

  const handleLogout = async () => {
    try {
      const { auth } = await import("./lib/firebase.ts");
      await auth.signOut();
    } catch (err) {
      console.error("Firebase signOut failed:", err);
    }
    setUser(null);
    localStorage.removeItem("giftino_user");
    localStorage.removeItem("giftino_wishlists");
    localStorage.removeItem("giftino_following_friends");
    localStorage.removeItem("giftino_claimed_items");
    localStorage.removeItem("giftino_recently_deleted");
    localStorage.removeItem("giftino_friends_data");
  };

  const handleUpdateWishlists = (updated: Wishlist[]) => {
    setWishlists(updated);
  };

  const toggleFollowFriend = (id: string) => {
    setFollowingFriendIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((fId) => fId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Wire up Claims from friends wishlists
  const handleClaimItemFromFriend = (friendId: string, listId: string, itemId: string) => {
    // Find the friend's details from friends_data localStorage or simulated list
    const savedData = localStorage.getItem("giftino_friends_data") || "[]";
    const friendsList = JSON.parse(savedData);
    const friend = friendsList.find((f: any) => f.id === friendId);
    
    if (!friend) return;
    const list = friend.wishlists.find((l: any) => l.id === listId);
    if (!list) return;
    const item = list.items.find((i: any) => i.id === itemId);
    if (!item) return;

    const newClaim: ClaimedItem = {
      friendId,
      friendName: friend.name,
      friendAvatar: friend.avatar,
      listId,
      listTitle: list.title,
      item: {
        ...item,
        isReserved: true,
        reservedBy: user?.name || "Guest"
      }
    };

    setClaimedItems((prev) => [newClaim, ...prev]);
  };

  const handleUnclaimItemFromFriend = (friendId: string, listId: string, itemId: string) => {
    // Remove from user claimed dashboard
    setClaimedItems((prev) => prev.filter((c) => !(c.friendId === friendId && c.item.id === itemId)));

    // Update friends_data localStorage so that the Checkmark updates in real-time inside Friends tab!
    const savedData = localStorage.getItem("giftino_friends_data") || "[]";
    if (savedData !== "[]") {
      const friendsList = JSON.parse(savedData);
      const updated = friendsList.map((f: any) => {
        if (f.id === friendId) {
          const updatedLists = f.wishlists.map((l: any) => {
            if (l.id === listId) {
              const updatedItems = l.items.map((item: any) => {
                if (item.id === itemId) {
                  return { ...item, isReserved: false, reservedBy: undefined };
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
      localStorage.setItem("giftino_friends_data", JSON.stringify(updated));
    }
  };

  // Render Login view if unauthenticated
  if (!user) {
    return (
      <LoginPortal
        language={language}
        onToggleLanguage={handleToggleLanguage}
        onLogin={handleLogin}
        theme={theme}
        onToggleTheme={() => {}}
      />
    );
  }

  const derivedUsername = user.phone === "09123456789" ? "hamidrezaghasemi" : user.name.toLowerCase().replace(/\s+/g, "");

  return (
    <div 
      className="min-h-screen bg-zinc-950 text-[#fafafa] font-sans flex flex-col md:flex-row selection:bg-[#10b981] selection:text-[#09090b] relative luxury-paper-texture"
      style={{ direction: isFa ? "rtl" : "ltr" }}
    >
      {/* Dynamic ambient festive background covering the whole app */}
      <div className="fixed inset-0 pointer-events-none select-none z-0 overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=1200&auto=format&fit=crop"
          alt="App Festive Background"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover opacity-[0.04] mix-blend-screen"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-zinc-950/20 via-transparent to-zinc-950/20" />
      </div>
      
      {/* ========================================== */}
      {/* DESKTOP SIDEBAR NAVIGATION                 */}
      {/* ========================================== */}
      <aside className="hidden md:flex flex-col w-64 bg-zinc-950/90 backdrop-blur-md border-r border-zinc-900/60 p-5 h-screen sticky top-0 shrink-0 justify-between z-10">
        <div className="space-y-6">
          
          {/* Logo brand */}
          <div id="tour-welcome" className="flex items-center px-1.5 justify-between w-full">
            <Logo size="md" language={language} showText={true} />
            <span className="text-[8px] bg-zinc-900 border border-zinc-800 text-[#10b981] px-1.5 py-0.5 rounded-lg font-extrabold uppercase font-mono shrink-0">
              v2.4
            </span>
          </div>

          {/* Active User mini-card */}
          <div 
            className="flex items-center gap-3 p-2 rounded-xl bg-zinc-900/30 backdrop-blur-md border border-zinc-850 hover:bg-zinc-900/80 transition-all group shadow-[0_4px_12px_rgba(0,0,0,0.2)]"
          >
            <div 
              onClick={() => setIsAvatarPickerOpen(true)}
              className="w-8 h-8 rounded-lg overflow-hidden bg-gradient-to-tr from-[#10b981]/20 to-amber-500/10 border border-zinc-700 flex items-center justify-center font-black text-white text-lg select-none hover:scale-105 transition-all cursor-pointer relative"
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
                <span className="text-[9px] font-black text-zinc-300">{user.name.slice(0, 2).toUpperCase()}</span>
              )}
            </div>
            <div 
              onClick={() => setActiveTab("settings")}
              className="min-w-0 flex-1 cursor-pointer"
            >
              <h4 className="text-[11px] font-bold text-white truncate group-hover:text-[#10b981] transition-colors">{user.name}</h4>
              <p className="text-[9px] text-zinc-500 truncate font-mono">@{derivedUsername}</p>
            </div>
          </div>

          {/* Sidebar Menu options */}
          <nav className="space-y-1.5">
            
            <button
              onClick={() => setActiveTab("my-lists")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "my-lists"
                  ? "bg-zinc-900 text-[#10b981] border-l-2 border-[#10b981]"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900/30"
              }`}
            >
              <Gift className="w-4 h-4 shrink-0" />
              <span>{isFa ? "لیست‌های من" : "My Lists"}</span>
              <span className="mr-auto font-mono text-[9px] bg-zinc-900 px-1.5 py-0.2 rounded text-zinc-500">
                {wishlists.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("friends")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "friends"
                  ? "bg-zinc-900 text-[#10b981] border-l-2 border-[#10b981]"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900/30"
              }`}
            >
              <Users className="w-4 h-4 shrink-0" />
              <span>{isFa ? "شبکه دوستان" : "Friends"}</span>
              <span className="mr-auto font-mono text-[9px] bg-zinc-900 px-1.5 py-0.2 rounded text-zinc-500">
                {followingFriendIds.length}
              </span>
            </button>

             <button
              id="tour-add-wish-tab"
              onClick={() => setActiveTab("add-wish")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "add-wish"
                  ? "bg-zinc-900 text-[#10b981] border-l-2 border-[#10b981]"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900/30"
              }`}
            >
              <PlusCircle className="w-4 h-4 text-[#10b981] shrink-0" />
              <span className="text-[#10b981]">{isFa ? "افزودن آرزو" : "Add Wish"}</span>
            </button>

            <button
              id="tour-explore-tab"
              onClick={() => setActiveTab("explore")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "explore"
                  ? "bg-zinc-900 text-[#10b981] border-l-2 border-[#10b981]"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900/30"
              }`}
            >
              <Search className="w-4 h-4 shrink-0" />
              <span>{isFa ? "اکسپلور / ایده‌ها" : "Explore Ideas"}</span>
            </button>

            <button
              id="tour-claimed-tab"
              onClick={() => setActiveTab("claimed")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "claimed"
                  ? "bg-zinc-900 text-[#10b981] border-l-2 border-[#10b981]"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900/30"
              }`}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{isFa ? "رزرو شده‌ها" : "Claimed"}</span>
              {claimedItems.length > 0 && (
                <span className="mr-auto font-mono text-[9px] bg-zinc-900 text-[#10b981] font-bold px-1.5 py-0.2 rounded border border-emerald-500/20">
                  {claimedItems.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("calendar")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "calendar"
                  ? "bg-zinc-900 text-[#10b981] border-l-2 border-[#10b981]"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900/30"
              }`}
            >
              <CalendarDays className="w-4 h-4 shrink-0" />
              <span>{isFa ? "تقویم مناسبت‌ها" : "Occasions Calendar"}</span>
            </button>

            <button
              onClick={() => setActiveTab("settings")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "settings"
                  ? "bg-zinc-900 text-[#10b981] border-l-2 border-[#10b981]"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900/30"
              }`}
            >
              <Settings className="w-4 h-4 shrink-0" />
              <span>{isFa ? "تنظیمات برنامه" : "Settings"}</span>
            </button>

          </nav>
        </div>

        {/* Sidebar Footer Controls */}
        <div className="space-y-4 pt-4 border-t border-zinc-900/60">
          
          {/* Quick Language Switcher */}
          <div className="flex gap-2">
            <button
              onClick={handleToggleLanguage}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-zinc-900/30 border border-zinc-800/40 hover:bg-zinc-900/80 rounded-xl text-[10px] text-zinc-400 font-medium transition-all cursor-pointer"
              title={isFa ? "Switch to English" : "تغییر زبان به فارسی"}
            >
              <Globe className="w-3.5 h-3.5 text-zinc-500" />
              <span>{isFa ? "English" : "فارسی"}</span>
            </button>
          </div>

          {/* Google Gemini AI Status Ping */}
          <div className="p-3 rounded-xl bg-zinc-900/40 border border-zinc-900 flex items-center justify-between text-[9px] font-mono">
            <div className="flex items-center gap-1.5 text-zinc-400">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${apiStatus === "online" ? "bg-emerald-400" : "bg-amber-400"}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${apiStatus === "online" ? "bg-emerald-500" : "bg-amber-500"}`}></span>
              </span>
              <span>{isFa ? "وضعیت هوش مصنوعی" : "Gemini API"}</span>
            </div>
            <span className={apiStatus === "online" ? "text-[#10b981] font-bold" : "text-amber-500"}>
              {apiStatus === "online" ? "ONLINE" : "LOCAL"}
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>{isFa ? "خروج از حساب" : "Log Out"}</span>
          </button>
        </div>
      </aside>

      {/* ========================================== */}
      {/* MOBILE HEADER                              */}
      {/* ========================================== */}
      {activeTab !== "explore" && activeTab !== "my-lists" && (
        <header className="flex md:hidden items-center justify-between bg-zinc-950 border-b border-zinc-900 p-4 sticky top-0 z-40 backdrop-blur-md bg-opacity-95 relative">
          {/* Left Side: Actions (Menu, Bell, Plus) sorted by priority */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setActiveTab(activeTab === "settings" ? "my-lists" : "settings")}
              className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-all cursor-pointer ${
                activeTab === "settings"
                  ? "border-[#10b981] bg-[#10b981]/10 text-[#10b981]"
                  : "border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-850 hover:text-white"
              }`}
              title={isFa ? "منوی تنظیمات" : "Settings Menu"}
            >
              <Menu className="w-4 h-4" />
            </button>

            <button
              onClick={() => setShowNotificationsPopup(!showNotificationsPopup)}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-850 hover:text-white transition-all cursor-pointer relative"
              title={isFa ? "اعلان‌ها" : "Notifications"}
            >
              <Bell className="w-4 h-4" />
              {notifications.length > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border border-zinc-950 animate-pulse" />
              )}
            </button>

            <button
              onClick={() => setShowCreateModal(true)}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#10b981] hover:bg-emerald-400 text-zinc-950 font-bold transition-all cursor-pointer shadow-md"
              title={isFa ? "ایجاد لیست جدید" : "Create List"}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Right Side: Preference switchers */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleLanguage}
              className="h-8 px-2.5 flex items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-[10px] text-zinc-300 font-mono font-bold hover:bg-zinc-850 transition-all cursor-pointer"
            >
              {isFa ? "EN" : "فا"}
            </button>
          </div>

          {/* Interactive Notifications Drawer Popup */}
          {showNotificationsPopup && (
            <div className="absolute top-14 left-4 w-80 bg-zinc-950/95 border border-zinc-850 rounded-2xl p-3.5 shadow-[0_20px_50px_rgba(0,0,0,0.9)] backdrop-blur-2xl z-50 space-y-3 text-left rtl:text-right" style={{ direction: isFa ? "rtl" : "ltr" }}>
              <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
                <h4 className="text-[11px] font-black text-white flex items-center gap-1.5">
                  <span>🔔</span>
                  <span>{isFa ? "اعلان‌ها و دستیار هوشمند" : "Notifications & AI Assistant"}</span>
                </h4>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      localStorage.removeItem("giftino_notifications");
                      setNotifications([]);
                    }}
                    className="text-[9px] font-bold text-rose-400 hover:underline bg-transparent border-none p-0 cursor-pointer"
                  >
                    {isFa ? "پاک کردن" : "Clear"}
                  </button>
                  <button
                    onClick={() => setShowNotificationsPopup(false)}
                    className="w-5 h-5 flex items-center justify-center rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all cursor-pointer border border-zinc-800"
                    title={isFa ? "بستن" : "Close"}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* AI Smart Nudges Section */}
              <SmartAiNudgesPanel
                language={language}
                user={user}
                wishlists={wishlists}
                claimedItems={claimedItems}
                followingFriendIds={followingFriendIds}
                onExecuteNudgeAction={handleExecuteNudgeAction}
                onDismissNudge={(id) => {
                  // dismiss nudge logic
                }}
              />

              {/* Standard System Notifications */}
              {notifications.length > 0 && (
                <div className="pt-2 border-t border-zinc-850 space-y-1.5">
                  <p className="text-[10px] font-bold text-zinc-400 px-1">
                    {isFa ? "اعلان‌های سیستم:" : "System Alerts:"}
                  </p>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {notifications.map((notif: any) => (
                      <div key={notif.id || notif.sentAt} className="bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-850 space-y-1">
                        <p className="text-[10px] font-black text-white">{notif.title}</p>
                        {notif.desc && <p className="text-[9px] text-zinc-400">{notif.desc}</p>}
                        <p className="text-[8px] text-zinc-500 font-mono text-right">
                          {new Date(notif.sentAt).toLocaleTimeString(isFa ? 'fa-IR' : 'en-US', {hour: '2-digit', minute:'2-digit'})}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </header>
      )}

      {/* Floating Capsule for Profile Tab (Renders top right) */}
      {activeTab === "my-lists" && (
        <div className="md:hidden fixed top-4 right-4 z-50 bg-zinc-900/60 backdrop-blur-md border border-zinc-800/80 rounded-full py-1.5 px-3 flex items-center gap-3.5 shadow-lg">
          {/* Plus action */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-[#10b981] hover:bg-emerald-400 text-zinc-950 font-bold transition-all cursor-pointer shadow-sm"
            title={isFa ? "ایجاد لیست جدید" : "Create List"}
          >
            <Plus className="w-4 h-4" />
          </button>

          {/* Notifications action */}
          <button
            onClick={() => setShowNotificationsPopup(!showNotificationsPopup)}
            className="w-7 h-7 flex items-center justify-center rounded-full text-zinc-300 hover:text-white transition-all cursor-pointer relative"
            title={isFa ? "اعلان‌ها" : "Notifications"}
          >
            <Bell className="w-4 h-4" />
            {notifications.length > 0 && (
              <span className="absolute top-0 right-0 w-2 h-2 bg-rose-500 rounded-full border border-zinc-950 animate-pulse" />
            )}
          </button>

          {/* Menu / Settings toggle */}
          <button
            onClick={() => setActiveTab("settings")}
            className="w-7 h-7 flex items-center justify-center rounded-full text-zinc-300 hover:text-white transition-all cursor-pointer"
            title={isFa ? "منوی تنظیمات" : "Settings Menu"}
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Standalone Notifications Popup for Profile and Explore Tabs */}
      {showNotificationsPopup && (activeTab === "my-lists" || activeTab === "explore") && (
        <div className="md:hidden fixed top-16 right-4 w-80 bg-zinc-950/95 border border-zinc-850 rounded-2xl p-3.5 shadow-[0_20px_50px_rgba(0,0,0,0.9)] backdrop-blur-2xl z-50 space-y-3 text-left rtl:text-right" style={{ direction: isFa ? "rtl" : "ltr" }}>
          <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
            <h4 className="text-[11px] font-black text-white flex items-center gap-1.5">
              <span>🔔</span>
              <span>{isFa ? "اعلان‌ها و دستیار هوشمند" : "Notifications & AI Assistant"}</span>
            </h4>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                  localStorage.removeItem("giftino_notifications");
                  setNotifications([]);
                }}
                className="text-[9px] font-bold text-rose-400 hover:underline bg-transparent border-none p-0 cursor-pointer"
              >
                {isFa ? "پاک کردن" : "Clear"}
              </button>
              <button
                onClick={() => setShowNotificationsPopup(false)}
                className="w-5 h-5 flex items-center justify-center rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all cursor-pointer border border-zinc-800"
                title={isFa ? "بستن" : "Close"}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* AI Smart Nudges Section */}
          <SmartAiNudgesPanel
            language={language}
            user={user}
            wishlists={wishlists}
            claimedItems={claimedItems}
            followingFriendIds={followingFriendIds}
            onExecuteNudgeAction={handleExecuteNudgeAction}
            onDismissNudge={(id) => {
              // dismiss nudge logic
            }}
          />

          {/* Standard System Notifications */}
          {notifications.length > 0 && (
            <div className="pt-2 border-t border-zinc-850 space-y-1.5">
              <p className="text-[10px] font-bold text-zinc-400 px-1">
                {isFa ? "اعلان‌های سیستم:" : "System Alerts:"}
              </p>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {notifications.map((notif: any) => (
                  <div key={notif.id || notif.sentAt} className="bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-850 space-y-1">
                    <p className="text-[10px] font-black text-white">{notif.title}</p>
                    {notif.desc && <p className="text-[9px] text-zinc-400">{notif.desc}</p>}
                    <p className="text-[8px] text-zinc-500 font-mono text-right">
                      {new Date(notif.sentAt).toLocaleTimeString(isFa ? 'fa-IR' : 'en-US', {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================== */}
      {/* MOBILE BOTTOM NAVIGATION BAR (FLOATING OVAL) */}
      {/* ========================================== */}
      <nav className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-zinc-950/80 backdrop-blur-xl border border-zinc-800 rounded-full h-14 max-w-[340px] w-[90%] px-4 flex items-center justify-around shadow-[0_12px_40px_rgba(0,0,0,0.8)]">
        
        {/* Item 1: Create List Plus */}
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-[#10b981] hover:text-emerald-400 flex items-center justify-center transition-all duration-200 shadow-md active:scale-90 cursor-pointer"
          title={isFa ? "ایجاد لیست جدید" : "Create List"}
        >
          <Plus className="w-5 h-5" />
        </button>

        {/* Item 2: Friends */}
        <button
          onClick={() => setActiveTab("friends")}
          className={`flex items-center justify-center transition-all cursor-pointer ${
            activeTab === "friends" ? "text-[#10b981] scale-115" : "text-zinc-400 hover:text-white"
          }`}
          title={isFa ? "دوستان" : "Friends"}
        >
          <Users className="w-5 h-5" />
        </button>

        {/* Item 3: Profile Avatar (center) */}
        <button
          onClick={() => setActiveTab("my-lists")}
          className={`relative flex items-center justify-center rounded-full transition-all cursor-pointer ${
            activeTab === "my-lists" ? "ring-2 ring-[#10b981] scale-110 shadow-[0_0_12px_rgba(16,185,129,0.3)]" : "opacity-75 hover:opacity-100"
          }`}
          title={isFa ? "پروفایل" : "Profile"}
        >
          {user && user.avatar ? (
            user.avatar.startsWith("http") ? (
              <img src={user.avatar} className="w-9 h-9 rounded-full object-cover border border-zinc-700" referrerPolicy="no-referrer" alt="Profile" />
            ) : (
              <span className="text-sm">{user.avatar}</span>
            )
          ) : (
            <div className="w-9 h-9 rounded-full bg-zinc-800 text-white flex items-center justify-center font-bold text-xs border border-zinc-700">
              {user && user.name ? user.name[0].toUpperCase() : "U"}
            </div>
          )}
        </button>

        {/* Item 4: Explore */}
        <button
          onClick={() => setActiveTab("explore")}
          className={`flex items-center justify-center transition-all cursor-pointer ${
            activeTab === "explore" ? "text-[#10b981] scale-115" : "text-zinc-400 hover:text-white"
          }`}
          title={isFa ? "اکسپلور" : "Explore"}
        >
          <Compass className="w-5 h-5" />
        </button>

        {/* Item 5: Calendar / AI Ideas (Lightbulb) */}
        <button
          onClick={() => setActiveTab("calendar")}
          className={`flex items-center justify-center transition-all cursor-pointer ${
            activeTab === "calendar" ? "text-[#10b981] scale-115" : "text-zinc-400 hover:text-white"
          }`}
          title={isFa ? "تقویم" : "Calendar"}
        >
          <Lightbulb className="w-5 h-5" />
        </button>

      </nav>

      {/* ========================================== */}
      {/* MAIN CONTENT REGION                        */}
      {/* ========================================== */}
      <main className="flex-1 min-w-0 p-4 md:p-8 pb-24 md:pb-8 max-w-7xl mx-auto w-full relative z-10">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: Profile lists View */}
          {activeTab === "my-lists" && (
            <motion.div
              key="my-lists-tab"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.15 }}
            >
              <ProfileView
                user={user}
                setUser={setUser}
                wishlists={wishlists}
                onUpdateWishlists={handleUpdateWishlists}
                language={language}
                onOpenSettings={() => setActiveTab("settings")}
                onOpenAddWish={() => setActiveTab("add-wish")}
                onNavigateToTab={(tab) => setActiveTab(tab)}
                tourStep={tourStep}
                onOpenAvatarPicker={() => setIsAvatarPickerOpen(true)}
                showCreateModal={showCreateModal}
                setShowCreateModal={setShowCreateModal}
                autoOpenAdvisorModal={autoOpenAdvisorModal}
                onResetAutoOpenAdvisorModal={() => setAutoOpenAdvisorModal(false)}
              />
            </motion.div>
          )}

          {/* TAB 2: Friends Feed */}
          {activeTab === "friends" && (
            <motion.div
              key="friends-tab"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.15 }}
            >
              <FriendsSocial
                user={user}
                followingIds={followingFriendIds}
                onToggleFollow={toggleFollowFriend}
                language={language}
                onClaimItem={handleClaimItemFromFriend}
                onUnclaimItem={handleUnclaimItemFromFriend}
              />
            </motion.div>
          )}

          {/* TAB 3: Add Wish Portal */}
          {activeTab === "add-wish" && (
            <motion.div
              key="add-wish-tab"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.15 }}
            >
              <AddWish
                wishlists={wishlists}
                onUpdateWishlists={handleUpdateWishlists}
                language={language}
                onNavigateToExplore={() => setActiveTab("explore")}
                onSuccessRedirect={() => setActiveTab("my-lists")}
              />
            </motion.div>
          )}

          {/* TAB 4: Explore Ideas and AI */}
          {activeTab === "explore" && (
            <motion.div
              key="explore-tab"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.15 }}
            >
              <ExploreIdeas
                wishlists={wishlists}
                onUpdateWishlists={handleUpdateWishlists}
                language={language}
                user={user}
                onOpenAdvisorPortal={() => {
                  setAutoOpenAdvisorModal(true);
                  setActiveTab("my-lists");
                }}
              />
            </motion.div>
          )}

          {/* TAB 5: Claimed items list */}
          {activeTab === "claimed" && (
            <motion.div
              key="claimed-tab"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.15 }}
            >
              <ClaimedItems
                user={user}
                language={language}
                claimedItems={claimedItems}
                onUnclaimItem={handleUnclaimItemFromFriend}
              />
            </motion.div>
          )}

          {/* TAB 6: Settings panel */}
          {activeTab === "settings" && (
            <motion.div
              key="settings-tab"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.15 }}
            >
              <SettingsMenu
                user={user}
                setUser={setUser}
                wishlists={wishlists}
                onUpdateWishlists={handleUpdateWishlists}
                language={language}
                onLogout={handleLogout}
                onBack={() => setActiveTab("my-lists")}
                onOpenAvatarPicker={() => setIsAvatarPickerOpen(true)}
              />
            </motion.div>
          )}

          {/* TAB 7: Calendar Panel */}
          {activeTab === "calendar" && (
            <motion.div
              key="calendar-tab"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.15 }}
            >
              <CalendarOccasions
                user={user}
                language={language}
                wishlists={wishlists}
                onNavigateToTab={(tab) => setActiveTab(tab)}
              />
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Interactive onboarding spotlight walkthrough */}
      <OnboardingTour
        language={language}
        active={tourActive}
        currentStep={tourStep}
        setCurrentStep={setTourStep}
        onClose={() => setTourActive(false)}
        setActiveTab={setActiveTab}
      />

      {/* Interactive Avatar Selection System */}
      <AvatarPicker
        isOpen={isAvatarPickerOpen}
        onClose={() => setIsAvatarPickerOpen(false)}
        user={user!}
        setUser={setUser}
        language={language}
      />

      {/* Step-by-Step Interactive AI Onboarding & Pacing Companion */}
      <AiOnboardingWidget
        language={language}
        user={user}
        wishlists={wishlists}
        followingFriendIds={followingFriendIds}
        onUpdateUser={(updated) => setUser(updated)}
        onCreateWishlist={handleCreateWishlistFromAi}
        onAddWishlistItem={handleAddWishlistItemFromAi}
        onSwitchTab={setActiveTab}
        onOpenAiAssistant={() => {
          // Open AI assistant window
        }}
      />

      {/* Global AI Assistant Component */}
      <AiAssistant
        language={language}
        activeTab={activeTab}
        wishlists={wishlists}
        userProfile={user}
        onSwitchTab={setActiveTab}
        onAddGift={handleAddGiftFromAi}
        onOpenPriceCompare={(query) => {
          setGlobalPriceSearchQuery(query);
          setGlobalPriceSearchTargetPrice(undefined);
          setGlobalPriceSearchOpen(true);
        }}
        onToggleLanguage={handleToggleLanguage}
      />

      {/* Global Price Search and Compare Engine */}
      <PriceSearchModal
        isOpen={globalPriceSearchOpen}
        onClose={() => setGlobalPriceSearchOpen(false)}
        initialQuery={globalPriceSearchQuery}
        targetPrice={globalPriceSearchTargetPrice}
        language={language}
      />

    </div>
  );
}
