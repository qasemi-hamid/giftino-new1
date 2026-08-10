import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

import { requireAuth, AuthRequest } from "./src/middleware/auth.ts";
import { adminAuth } from "./src/lib/firebase-admin.ts";
import firebaseConfig from "./firebase-applet-config.json" with { type: "json" };
import { db, isDbConfigured } from "./src/db/index.ts";
import { users, wishlists, wishlistItems } from "./src/db/schema.ts";
import { eq, ne } from "drizzle-orm";

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let ai: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required.");
    }
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return ai;
}

// Health Check API
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    hasApiKey: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// ==========================================
// SERVER-SIDE AUTH PROXY FOR USERS IN IRAN (NO VPN NEEDED)
// ==========================================

// 1. Email Sign In Proxy
app.post("/api/auth/proxy/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "ایمیل و رمز عبور الزامی است." });
    }

    const apiKey = firebaseConfig.apiKey;
    const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.trim(),
        password,
        returnSecureToken: true,
      }),
    });

    const data: any = await response.json();
    if (!response.ok || data.error) {
      const msg = data.error?.message || "نام کاربری یا رمز عبور اشتباه است.";
      return res.status(400).json({ error: msg });
    }

    // Generate Custom Token for seamless client auth
    const customToken = await adminAuth.createCustomToken(data.localId);

    res.json({
      success: true,
      idToken: data.idToken,
      refreshToken: data.refreshToken,
      customToken,
      user: {
        uid: data.localId,
        email: data.email,
        displayName: data.displayName || email.split("@")[0],
      },
    });
  } catch (err: any) {
    console.error("Auth Proxy Login Error:", err);
    res.status(500).json({ error: "خطا در برقراری ارتباط با سرور احراز هویت." });
  }
});

// 2. Email Sign Up Proxy
app.post("/api/auth/proxy/signup", async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "ایمیل و رمز عبور الزامی است." });
    }

    const apiKey = firebaseConfig.apiKey;
    const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.trim(),
        password,
        returnSecureToken: true,
      }),
    });

    const data: any = await response.json();
    if (!response.ok || data.error) {
      const msg = data.error?.message || "خطا در ثبت نام حساب جدید.";
      return res.status(400).json({ error: msg });
    }

    // Update display name via Admin SDK
    if (name && name.trim()) {
      try {
        await adminAuth.updateUser(data.localId, { displayName: name.trim() });
      } catch (e) {
        console.warn("Failed to update display name:", e);
      }
    }

    const customToken = await adminAuth.createCustomToken(data.localId);

    res.json({
      success: true,
      idToken: data.idToken,
      customToken,
      user: {
        uid: data.localId,
        email: data.email,
        displayName: name || email.split("@")[0],
      },
    });
  } catch (err: any) {
    console.error("Auth Proxy Signup Error:", err);
    res.status(500).json({ error: "خطا در ثبت‌نام حساب جدید." });
  }
});

// 3. Google Sign In Proxy
app.post("/api/auth/proxy/google", async (req, res) => {
  try {
    const { email, name, avatar, googleIdToken } = req.body;
    
    let targetEmail = email;
    let targetName = name || "Google User";
    let targetAvatar = avatar || "👨‍🚀";

    // If googleIdToken is provided, verify it with Google's tokeninfo
    if (googleIdToken) {
      try {
        const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${googleIdToken}`);
        if (verifyRes.ok) {
          const payload: any = await verifyRes.json();
          if (payload.email) {
            targetEmail = payload.email;
            targetName = payload.name || targetName;
            targetAvatar = payload.picture || targetAvatar;
          }
        }
      } catch (vErr) {
        console.warn("Token verification skipped/failed:", vErr);
      }
    }

    if (!targetEmail) {
      return res.status(400).json({ error: "آدرس ایمیل برای ورود گوگل دریافت نشد." });
    }

    let userRecord;
    try {
      userRecord = await adminAuth.getUserByEmail(targetEmail);
    } catch (notFound) {
      // Create user in Firebase Admin
      userRecord = await adminAuth.createUser({
        email: targetEmail,
        displayName: targetName,
        photoURL: targetAvatar.startsWith("http") ? targetAvatar : undefined,
      });
    }

    const customToken = await adminAuth.createCustomToken(userRecord.uid);

    res.json({
      success: true,
      customToken,
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName || targetName,
        photoURL: userRecord.photoURL || targetAvatar,
      },
    });
  } catch (err: any) {
    console.error("Google Auth Proxy Error:", err);
    res.status(500).json({ error: "خطا در ورود از طریق گوگل سرور." });
  }
});

// 4. Reset Password Proxy
app.post("/api/auth/proxy/reset-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "ایمیل الزامی است." });
    }

    const apiKey = firebaseConfig.apiKey;
    const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requestType: "PASSWORD_RESET",
        email: email.trim(),
      }),
    });

    const data: any = await response.json();
    if (!response.ok || data.error) {
      return res.status(400).json({ error: data.error?.message || "خطا در ارسال ایمیل بازیابی." });
    }

    res.json({ success: true, message: "لینک بازیابی رمز عبور ارسال شد." });
  } catch (err: any) {
    res.status(500).json({ error: "خطا در بازیابی رمز عبور." });
  }
});

// Sync User Data to PostgreSQL
app.post("/api/user/sync", requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user?.uid;
    if (!uid) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!isDbConfigured()) {
      return res.json({ success: true, synced: false, message: "Cloud SQL database not configured. Operating in local mode." });
    }

    const { name, phone, avatar, isDemo, wishlists: frontendWishlists, followingFriendIds, claimedItems } = req.body;

    // 1. Upsert User Profile
    const userRecord = await db.insert(users)
      .values({
        uid,
        name: name || "User",
        phone: phone || null,
        avatar: avatar || null,
        email: req.user?.email || null,
        isDemo: isDemo || false,
        claimedItems: claimedItems || [],
        followingFriendIds: followingFriendIds || [],
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          name: name || "User",
          phone: phone || null,
          avatar: avatar || null,
          email: req.user?.email || null,
          isDemo: isDemo || false,
          claimedItems: claimedItems || [],
          followingFriendIds: followingFriendIds || [],
        }
      })
      .returning();

    const dbUserId = userRecord[0].id;

    // 2. Clear old wishlists & items (cascade delete)
    await db.delete(wishlists).where(eq(wishlists.userId, dbUserId));

    // 3. Insert current wishlists & wishlist items
    if (frontendWishlists && Array.isArray(frontendWishlists)) {
      for (const wl of frontendWishlists) {
        await db.insert(wishlists).values({
          id: wl.id,
          userId: dbUserId,
          title: wl.title,
          occasionDate: wl.occasionDate || "",
          occasionType: wl.occasionType || "other",
        });

        if (wl.items && Array.isArray(wl.items) && wl.items.length > 0) {
          for (const item of wl.items) {
            await db.insert(wishlistItems).values({
              id: item.id,
              wishlistId: wl.id,
              title: item.title,
              price: typeof item.price === "number" ? item.price : null,
              link: item.link || null,
              notes: item.notes || null,
              priority: item.priority || "medium",
              isReserved: !!item.isReserved,
              reservedBy: item.reservedBy || null,
              isSecret: !!item.isSecret,
              addedBy: item.addedBy || null,
              reservationDate: item.reservationDate || null,
              isPurchased: !!item.isPurchased,
              purchaseRefNumber: item.purchaseRefNumber || null,
              isGroupGift: !!item.isGroupGift,
              groupGiftInfo: item.groupGiftInfo || null,
              isExtended: !!item.isExtended,
            });
          }
        }
      }
    }

    res.json({ success: true, message: "User data synced successfully" });
  } catch (error: any) {
    console.warn("Cloud SQL Sync offline/skipped:", error.message || error);
    res.json({ success: true, synced: false, warning: "Database sync unavailable: " + (error.message || error) });
  }
});

// Fetch User Data from PostgreSQL
app.get("/api/user/data", requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user?.uid;
    if (!uid) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!isDbConfigured()) {
      return res.json({ found: false });
    }

    const userRecord = await db.select().from(users).where(eq(users.uid, uid));
    if (userRecord.length === 0) {
      return res.json({ found: false });
    }

    const user = userRecord[0];

    // Fetch user wishlists
    const wls = await db.select().from(wishlists).where(eq(wishlists.userId, user.id));
    const wishlistsWithItems = [];

    for (const wl of wls) {
      const items = await db.select().from(wishlistItems).where(eq(wishlistItems.wishlistId, wl.id));
      wishlistsWithItems.push({
        id: wl.id,
        title: wl.title,
        occasionDate: wl.occasionDate,
        occasionType: wl.occasionType as any,
        items: items.map(item => ({
          id: item.id,
          title: item.title,
          price: typeof item.price === "number" ? item.price : undefined,
          link: item.link || undefined,
          notes: item.notes || undefined,
          priority: item.priority as any,
          isReserved: item.isReserved,
          reservedBy: item.reservedBy || undefined,
          isSecret: item.isSecret,
          addedBy: item.addedBy || undefined,
          reservationDate: item.reservationDate || undefined,
          isPurchased: item.isPurchased,
          purchaseRefNumber: item.purchaseRefNumber || undefined,
          isGroupGift: item.isGroupGift,
          groupGiftInfo: item.groupGiftInfo || undefined,
          isExtended: item.isExtended,
        })),
      });
    }

    res.json({
      found: true,
      user: {
        uid: user.uid,
        name: user.name,
        phone: user.phone || undefined,
        avatar: user.avatar || undefined,
        email: user.email || undefined,
        isDemo: user.isDemo,
      },
      wishlists: wishlistsWithItems,
      followingFriendIds: (user.followingFriendIds as string[]) || [],
      claimedItems: (user.claimedItems as any[]) || [],
    });
  } catch (error: any) {
    console.warn("Cloud SQL fetch offline/skipped:", error.message || error);
    res.json({ found: false });
  }
});

// Fetch all other registered users for directory search and follow features
app.get("/api/users", requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user?.uid;
    if (!uid) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!isDbConfigured()) {
      return res.json({ success: true, users: [] });
    }

    const allUsers = await db.select().from(users).where(ne(users.uid, uid));
    const usersWithWishlists = [];

    for (const u of allUsers) {
      const wls = await db.select().from(wishlists).where(eq(wishlists.userId, u.id));
      const wishlistsWithItems = [];

      for (const wl of wls) {
        const items = await db.select().from(wishlistItems).where(eq(wishlistItems.wishlistId, wl.id));
        wishlistsWithItems.push({
          id: wl.id,
          title: wl.title,
          occasionDate: wl.occasionDate,
          occasionType: wl.occasionType as any,
          items: items.map(item => ({
            id: item.id,
            title: item.title,
            price: typeof item.price === "number" ? item.price : undefined,
            link: item.link || undefined,
            notes: item.notes || undefined,
            priority: item.priority as any,
            isReserved: item.isReserved,
            reservedBy: item.reservedBy || undefined,
            isSecret: item.isSecret,
            addedBy: item.addedBy || undefined,
            reservationDate: item.reservationDate || undefined,
            isPurchased: item.isPurchased,
            purchaseRefNumber: item.purchaseRefNumber || undefined,
            isGroupGift: item.isGroupGift,
            groupGiftInfo: item.groupGiftInfo || undefined,
            isExtended: item.isExtended,
          })),
        });
      }

      usersWithWishlists.push({
        id: u.uid, // mapped to uid for frontend component expectations
        uid: u.uid,
        name: u.name,
        username: u.phone ? "user_" + u.phone.slice(-4) : "user_" + u.id,
        avatar: u.avatar || "👤",
        wishlists: wishlistsWithItems,
      });
    }

    res.json({ success: true, users: usersWithWishlists });
  } catch (error: any) {
    console.warn("Cloud SQL users directory fetch offline/skipped:", error.message || error);
    res.json({ success: true, users: [] });
  }
});

// Gift Advisor AI Endpoint
// ==========================================
// RESTORED GIFT ADVISOR
// ==========================================
app.post("/api/gift-advisor", async (req: any, res: any) => {
  try {
    const { ageGroup, gender, relation, budget, interests, language } = req.body;
    const isFa = language === "fa";
    let client;
    try {
      client = getGeminiClient();
    } catch (err) {
      const fallbackSuggestion = isFa ? `### \u{1F4A1} \u0627\u06CC\u062F\u0647\u200C\u0647\u0627\u06CC \u0647\u062F\u06CC\u0647 \u067E\u06CC\u0634\u0646\u0647\u0627\u062F\u06CC \u0628\u0631\u0627\u06CC \u0627\u06CC\u0646 \u0645\u0646\u0627\u0633\u0628\u062A (\u0622\u0641\u0644\u0627\u06CC\u0646)
        
\u26A0\uFE0F **\u06A9\u0644\u06CC\u062F \u0647\u0648\u0634 \u0645\u0635\u0646\u0648\u0639\u06CC (GEMINI_API_KEY) \u067E\u06CC\u062F\u0627 \u0646\u0634\u062F.** \u0628\u0631\u0627\u06CC \u0641\u0639\u0627\u0644\u200C\u0633\u0627\u0632\u06CC \u06A9\u0627\u0645\u0644 \u0645\u0634\u0627\u0648\u0631 \u0647\u0648\u0634 \u0645\u0635\u0646\u0648\u0639\u06CC \u06AF\u06CC\u0641\u062A\u06CC\u0646\u0648\u060C \u0644\u0637\u0641\u0627\u064B \u06A9\u0644\u06CC\u062F API \u0631\u0627 \u062F\u0631 \u067E\u0646\u0644 Secrets \u0627\u0636\u0627\u0641\u0647 \u06A9\u0646\u06CC\u062F. \u062F\u0631 \u062D\u0627\u0644 \u062D\u0627\u0636\u0631 \u0627\u0632 \u0645\u062F\u0644 \u067E\u06CC\u0634\u0646\u0647\u0627\u062F\u06CC\u0627\u0628 \u0645\u062D\u0644\u06CC \u06AF\u06CC\u0641\u062A\u06CC\u0646\u0648 \u0627\u0633\u062A\u0641\u0627\u062F\u0647 \u0645\u06CC\u200C\u06A9\u0646\u06CC\u062F:

1. **\u06A9\u0627\u0631\u062A \u0647\u062F\u06CC\u0647 \u0627\u062E\u062A\u0635\u0627\u0635\u06CC \u062E\u0631\u06CC\u062F \u0622\u0646\u0644\u0627\u06CC\u0646**
   - **\u0686\u0631\u0627 \u0645\u0646\u0627\u0633\u0628 \u0627\u0633\u062A\u061F** \u0622\u0632\u0627\u062F\u06CC \u0627\u0646\u062A\u062E\u0627\u0628 \u0647\u062F\u06CC\u0647 \u062F\u0644\u062E\u0648\u0627\u0647 \u0628\u0631 \u0627\u0633\u0627\u0633 \u0639\u0644\u0627\u06CC\u0642 \u0634\u062E\u0635\u06CC (${interests || "\u0639\u0645\u0648\u0645\u06CC"}).
   - **\u0645\u062D\u062F\u0648\u062F\u0647 \u0642\u06CC\u0645\u062A\u06CC:** \u0645\u062A\u0646\u0627\u0633\u0628 \u0628\u0627 \u0628\u0648\u062F\u062C\u0647 ${budget || "\u0645\u062A\u0648\u0633\u0637"} \u0634\u0645\u0627.

2. **\u0633\u062A \u0644\u0648\u0627\u0632\u0645 \u06CC\u0627\u062F\u0628\u0648\u062F \u0634\u062E\u0635\u06CC\u200C\u0633\u0627\u0632\u06CC \u0634\u062F\u0647**
   - **\u062C\u0632\u0626\u06CC\u0627\u062A:** \u0647\u062F\u06CC\u0647\u200C\u0627\u06CC \u0645\u0627\u0646\u062F\u06AF\u0627\u0631 \u0648 \u0645\u062A\u0646\u0627\u0633\u0628 \u0628\u0627 \u0646\u0633\u0628\u062A \u0641\u0627\u0645\u06CC\u0644\u06CC \u0634\u0645\u0627 \u0628\u0647 \u0639\u0646\u0648\u0627\u0646 ${relation || "\u062F\u0648\u0633\u062A"}.
   - **\u0686\u0631\u0627 \u0645\u0646\u0627\u0633\u0628 \u0627\u0633\u062A\u061F** \u062D\u0633 \u0635\u0645\u06CC\u0645\u06CC\u062A \u0648 \u0627\u0631\u0632\u0634\u0645\u0646\u062F\u06CC \u0631\u0627 \u0628\u0647 \u0645\u062E\u0627\u0637\u0628 (${gender === "male" ? "\u0622\u0642\u0627" : gender === "female" ? "\u062E\u0627\u0646\u0645" : "\u0645\u062E\u0627\u0637\u0628"}\u060C \u0631\u062F\u0647 \u0633\u0646\u06CC ${ageGroup || "\u062C\u0648\u0627\u0646"}) \u0645\u0646\u062A\u0642\u0644 \u0645\u06CC\u200C\u06A9\u0646\u062F.

3. **\u06CC\u06A9 \u067E\u06A9\u06CC\u062C \u0648\u06CC\u0698\u0647 \u0644\u0648\u06A9\u0633 \u0645\u0631\u0628\u0648\u0637 \u0628\u0647 \u0639\u0644\u0627\u06CC\u0642: "${interests || "\u0647\u0646\u0631 \u0648 \u0633\u0631\u06AF\u0631\u0645\u06CC"}"**
   - **\u0627\u06CC\u062F\u0647:** \u062E\u0631\u06CC\u062F \u06CC\u06A9 \u06A9\u062A\u0627\u0628 \u0646\u0641\u06CC\u0633 \u06CC\u0627 \u0627\u0628\u0632\u0627\u0631 \u06A9\u0627\u0631\u0628\u0631\u062F\u06CC \u0645\u062A\u0646\u0627\u0633\u0628 \u0628\u0627 \u0628\u0648\u062F\u062C\u0647 \u0634\u0645\u0627.` : `### \u{1F4A1} Custom Gift Suggestions (Offline Mode)
        
\u26A0\uFE0F **Gemini API Key missing.** To get live smart ideas, configure your **GEMINI_API_KEY** in AI Studio Secrets. Currently displaying local intelligent recommendations:

1. **Custom E-Commerce Gift Card**
   - **Why?** Allows total freedom of choice tailored to their interest: "${interests || "General"}".
   - **Estimated Cost:** Fits well within your "${budget || "Moderate"}" budget.

2. **Personalized Memory Gift Box**
   - **Why?** Adds a warm, emotional touch perfect for a ${relation || "friend"} (${gender || "all"}, age group: ${ageGroup || "young adult"}).

3. **Curated item set related to: "${interests || "Lifestyle & Reading"}"**
   - **Details:** High utility and shows that you listen to their passions.`;
      return res.json({ success: true, advice: fallbackSuggestion, isMock: true });
    }
    const systemInstruction = isFa ? "\u0634\u0645\u0627 \u0645\u0634\u0627\u0648\u0631 \u062E\u0631\u06CC\u062F \u0647\u062F\u06CC\u0647 \u0627\u062E\u062A\u0635\u0627\u0635\u06CC \u0627\u067E\u0644\u06CC\u06A9\u06CC\u0634\u0646 \xAB\u06AF\u06CC\u0641\u062A\u06CC\u0646\u0648\xBB (Giftino) \u0647\u0633\u062A\u06CC\u062F. \u0644\u062D\u0646 \u0634\u0645\u0627 \u0628\u0627\u06CC\u062F \u0628\u0633\u06CC\u0627\u0631 \u0635\u0645\u06CC\u0645\u06CC\u060C \u0631\u0627\u0647\u0646\u0645\u0627\u060C \u062E\u0644\u0627\u0642\u0627\u0646\u0647 \u0648 \u062F\u0631 \u0639\u06CC\u0646 \u062D\u0627\u0644 \u0634\u06CC\u06A9 \u0648 \u062D\u0631\u0641\u0647\u200C\u0627\u06CC \u0628\u0627\u0634\u062F. \u067E\u06CC\u0634\u0646\u0647\u0627\u062F\u0627\u062A \u062E\u0631\u06CC\u062F \u0647\u062F\u06CC\u0647 \u062F\u0642\u06CC\u0642\u06CC \u0628\u0631 \u0627\u0633\u0627\u0633 \u0628\u0648\u062F\u062C\u0647\u060C \u0639\u0644\u0627\u06CC\u0642\u060C \u062C\u0646\u0633\u06CC\u062A\u060C \u0633\u0646 \u0648 \u0646\u0633\u0628\u062A \u06A9\u0627\u0631\u0628\u0631 \u0627\u0631\u0627\u0626\u0647 \u062F\u0647\u06CC\u062F. \u067E\u0627\u0633\u062E \u0631\u0627 \u0628\u0627 \u0641\u0631\u0645\u062A \u0645\u0627\u0631\u06A9\u200C\u062F\u0627\u0648\u0646 \u062A\u0645\u06CC\u0632 (\u0628\u0627 \u0627\u0633\u062A\u0641\u0627\u062F\u0647 \u0627\u0632 \u0628\u0648\u0644\u062A\u200C\u067E\u0648\u06CC\u0646\u062A\u060C \u0647\u062F\u0631\u0647\u0627\u060C \u06A9\u062F\u0647\u0627\u06CC \u0646\u0642\u0644\u200C\u0642\u0648\u0644 \u0648 \u0627\u06CC\u0645\u0648\u062C\u06CC\u200C\u0647\u0627\u06CC \u0645\u0646\u0627\u0633\u0628) \u0628\u0631\u06AF\u0631\u062F\u0627\u0646\u06CC\u062F." : "You are the premium AI Gift Advisor for the 'Giftino' app. Provide highly personalized, thoughtful, creative, and structured gift recommendations. Tailor suggestions to the given age group, gender, relation, budget, and specific interests. Use rich Markdown format with bullet points, sections, emojis, and clear pricing context.";
    const promptText = isFa ? `\u0644\u0637\u0641\u0627 \u06F3 \u0627\u06CC\u062F\u0647 \u062E\u0644\u0627\u0642\u0627\u0646\u0647 \u0647\u062F\u06CC\u0647 \u0628\u0627 \u0627\u06CC\u0646 \u0645\u0634\u062E\u0635\u0627\u062A \u067E\u06CC\u0634\u0646\u0647\u0627\u062F \u062F\u0647\u06CC\u062F:
      - \u0631\u062F\u0647 \u0633\u0646\u06CC \u0645\u062E\u0627\u0637\u0628: ${ageGroup}
      - \u062C\u0646\u0633\u06CC\u062A: ${gender === "male" ? "\u0622\u0642\u0627" : gender === "female" ? "\u062E\u0627\u0646\u0645" : "\u0641\u0631\u0642\u06CC \u0646\u0645\u06CC\u200C\u06A9\u0646\u062F"}
      - \u0646\u0633\u0628\u062A \u0628\u0627 \u0645\u0646: ${relation}
      - \u0628\u0648\u062F\u062C\u0647 \u062A\u0642\u0631\u06CC\u0628\u06CC: ${budget}
      - \u0639\u0644\u0627\u06CC\u0642 \u0648 \u0645\u0647\u0627\u0631\u062A\u200C\u0647\u0627: ${interests}
      \u067E\u0627\u0633\u062E \u0631\u0627 \u06A9\u0627\u0645\u0644\u0627\u064B \u0628\u0647 \u0632\u0628\u0627\u0646 \u0641\u0627\u0631\u0633\u06CC \u0631\u0648\u0627\u0646 \u0648 \u0628\u0627 \u0633\u0627\u062E\u062A\u0627\u0631\u06CC \u0632\u06CC\u0628\u0627 \u0627\u0631\u0627\u0626\u0647 \u0628\u062F\u0647.` : `Please suggest 3 creative gift ideas with these specs:
      - Age Group: ${ageGroup}
      - Gender: ${gender}
      - Relation: ${relation}
      - Budget level: ${budget}
      - Key Interests: ${interests}
      Provide the response in clear English.`;
    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [promptText],
      config: {
        systemInstruction,
        temperature: 0.7
      }
    });
    res.json({
      success: true,
      advice: response.text,
      isMock: false
    });
  } catch (error) {
    console.error("Giftino Advisor API error:", error);
    res.status(500).json({ error: error.message || "Something went wrong" });
  }
});

function getDaysDifference(dateStr1: string, dateStr2: string): number {
  const d1 = new Date(dateStr1);
  const d2 = new Date(dateStr2);
  d1.setHours(0, 0, 0, 0);
  d2.setHours(0, 0, 0, 0);
  const diffTime = d2.getTime() - d1.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// ==========================================
// RESTORED GET LOCAL RESPONSE
// ==========================================
function getLocalResponse(message: string, language: string, currentWishlists: any[], activeTab: string, userProfile: any) {
  const isFa = language === "fa";
  const msgLower = message.toLowerCase();
  const todayStr = "2026-07-08";
  if (msgLower.includes("\u0631\u0627\u0647\u0646\u0645\u0627") || msgLower.includes("\u0686\u06AF\u0648\u0646\u0647 \u06A9\u0627\u0631") || msgLower.includes("\u0686\u0637\u0648\u0631 \u06A9\u0627\u0631") || msgLower.includes("\u0633\u0627\u0632 \u0648 \u06A9\u0627\u0631") || msgLower.includes("\u0645\u06A9\u0627\u0646\u06CC\u0632\u0645") || msgLower.includes("\u0633\u0627\u0632\u0648\u06A9\u0627\u0631") || msgLower.includes("help") || msgLower.includes("guide") || msgLower.includes("how to") || msgLower.includes("how it works") || msgLower.includes("\u0627\u0645\u06A9\u0627\u0646\u0627\u062A") || msgLower.includes("\u0686\u0647 \u06A9\u0627\u0631")) {
    const text2 = isFa ? `\u2728 **\u0631\u0627\u0647\u0646\u0645\u0627\u06CC \u06A9\u0627\u0645\u0644 \u0633\u0627\u0632\u0648\u06A9\u0627\u0631 \u06AF\u06CC\u0641\u062A\u06CC\u200C\u0646\u0648 (\u0646\u0633\u062E\u0647 \u0647\u0648\u0634\u0645\u0646\u062F)** \u2728

\u0645\u0646 \u062A\u0645\u0627\u0645 \u0628\u062E\u0634\u200C\u0647\u0627\u06CC \u06AF\u06CC\u0641\u062A\u06CC\u200C\u0646\u0648 \u0631\u0627 \u0628\u0647 \u062E\u0648\u0628\u06CC \u0645\u06CC\u200C\u0634\u0646\u0627\u0633\u0645 \u0648 \u0647\u0631 \u0632\u0645\u0627\u0646 \u0633\u0648\u0627\u0644\u06CC \u062F\u0627\u0634\u062A\u06CC\u062F \u0622\u0645\u0627\u062F\u0647\u200C\u0627\u0645 \u0631\u0627\u0647\u0646\u0645\u0627\u06CC\u06CC\u200C\u062A\u0627\u0646 \u06A9\u0646\u0645! \u062F\u0631 \u0627\u062F\u0627\u0645\u0647 \u06A9\u0644\u06CC\u062F\u0647\u0627\u06CC \u0627\u0635\u0644\u06CC \u0628\u0631\u0646\u0627\u0645\u0647 \u062A\u0648\u0636\u06CC\u062D \u062F\u0627\u062F\u0647 \u0634\u062F\u0647 \u0627\u0633\u062A:

1. **\u{1F4CB} \u0627\u06CC\u062C\u0627\u062F \u0648 \u0645\u062F\u06CC\u0631\u06CC\u062A \u0644\u06CC\u0633\u062A \u0622\u0631\u0632\u0648\u0647\u0627 (Wishlists)**:
   \u0634\u0645\u0627 \u062F\u0631 \u062A\u0628 **\xAB\u0622\u0631\u0632\u0648\u0647\u0627\xBB** \u0645\u06CC\u200C\u062A\u0648\u0627\u0646\u06CC\u062F \u0628\u0631\u0627\u06CC \u0645\u0646\u0627\u0633\u0628\u062A\u200C\u0647\u0627\u06CC \u0645\u062E\u062A\u0644\u0641 \u062E\u0648\u062F (\u062A\u0648\u0644\u062F\u060C \u062E\u0627\u0646\u0647 \u062C\u062F\u06CC\u062F\u060C \u0639\u0631\u0648\u0633\u06CC \u0648...) \u0644\u06CC\u0633\u062A \u0622\u0631\u0632\u0648 \u0628\u0633\u0627\u0632\u06CC\u062F \u0648 \u0647\u062F\u0627\u06CC\u0627\u06CC\u06CC \u06A9\u0647 \u062F\u0648\u0633\u062A \u062F\u0627\u0631\u06CC\u062F \u0631\u0627 \u0628\u0627 \u0642\u06CC\u0645\u062A\u060C \u0627\u0648\u0644\u0648\u06CC\u062A \u0648 \u0644\u06CC\u0646\u06A9 \u062E\u0631\u06CC\u062F \u0645\u0633\u062A\u0642\u06CC\u0645 \u062B\u0628\u062A \u06A9\u0646\u06CC\u062F.

2. **\u{1F512} \u0645\u06A9\u0627\u0646\u06CC\u0632\u0645 \u062C\u0627\u062F\u0648\u06CC\u06CC \u0631\u0632\u0631\u0648 \u06A9\u0627\u062F\u0648 (Claim / Reserve)**:
   \u062F\u0648\u0633\u062A\u0627\u0646\u062A\u0627\u0646 \u0645\u06CC\u200C\u062A\u0648\u0627\u0646\u0646\u062F \u06A9\u0627\u062F\u0648\u0647\u0627\u06CC \u0644\u06CC\u0633\u062A \u0634\u0645\u0627 \u0631\u0627 \u0628\u0628\u06CC\u0646\u0646\u062F \u0648 \u06A9\u0627\u062F\u0648\u06CC\u06CC \u06A9\u0647 \u0642\u0635\u062F \u062E\u0631\u06CC\u062F\u0634 \u0631\u0627 \u062F\u0627\u0631\u0646\u062F **\xAB\u0631\u0632\u0631\u0648\xBB** \u06A9\u0646\u0646\u062F. \u0627\u06CC\u0646 \u06A9\u0627\u0631 \u0628\u0627\u0639\u062B \u0645\u06CC\u200C\u0634\u0648\u062F \u062F\u06CC\u06AF\u0631\u0627\u0646 \u0622\u0646 \u0631\u0627 \u0646\u062E\u0631\u0646\u062F \u0648 \u0647\u062F\u06CC\u0647 \u062A\u06A9\u0631\u0627\u0631\u06CC \u0646\u06AF\u06CC\u0631\u06CC\u062F! 
   *\u062C\u0630\u0627\u0628\u06CC\u062A\u0634 \u0627\u06CC\u0646\u062C\u0627\u0633\u062A \u06A9\u0647 \u062E\u0648\u062F\u062A\u0627\u0646 \u0645\u062A\u0648\u062C\u0647 \u0646\u0645\u06CC\u200C\u0634\u0648\u06CC\u062F \u0686\u0647 \u06A9\u0633\u06CC \u0686\u0647 \u0686\u06CC\u0632\u06CC \u0631\u0632\u0631\u0648 \u06A9\u0631\u062F\u0647 \u062A\u0627 \u0633\u0648\u0631\u067E\u0631\u0627\u06CC\u0632 \u062A\u0648\u0644\u062F\u062A\u0627\u0646 \u062E\u0631\u0627\u0628 \u0646\u0634\u0648\u062F!* \u0627\u0645\u0627 \u062F\u0631 \u0644\u06CC\u0633\u062A \u062F\u0648\u0633\u062A\u0627\u0646\u060C \u0648\u0636\u0639\u06CC\u062A \u0631\u0632\u0631\u0648 \u06A9\u0627\u062F\u0648\u0647\u0627 \u0631\u0627 \u0645\u0634\u062E\u0635 \u0645\u06CC\u200C\u0628\u06CC\u0646\u06CC\u062F. \u06A9\u0627\u062F\u0648\u0647\u0627\u06CC \u0631\u0632\u0631\u0648 \u06A9\u0631\u062F\u0647 \u062E\u0648\u062F\u062A\u0627\u0646 \u0631\u0627 \u0646\u06CC\u0632 \u0645\u06CC\u200C\u062A\u0648\u0627\u0646\u06CC\u062F \u062F\u0631 \u0628\u062E\u0634 \u06A9\u0627\u062F\u0648\u0647\u0627\u06CC \u0631\u0632\u0631\u0648 \u0634\u062F\u0647 \u0645\u062F\u06CC\u0631\u06CC\u062A \u06A9\u0646\u06CC\u062F.

3. **\u{1F465} \u0634\u0628\u06A9\u0647 \u062F\u0648\u0633\u062A\u0627\u0646 \u0648 \u062F\u0639\u0648\u062A \u0628\u0627 \u067E\u06CC\u0627\u0645\u06A9 (Friends Feed)**:
   \u062F\u0631 \u062A\u0628 **\xAB\u062F\u0648\u0633\u062A\u0627\u0646\xBB** \u0645\u06CC\u200C\u062A\u0648\u0627\u0646\u06CC\u062F \u0628\u0627 \u0622\u06CC\u062F\u06CC \u062F\u0648\u0633\u062A\u0627\u0646\u062A\u0627\u0646 \u0631\u0627 \u062F\u0646\u0628\u0627\u0644 \u06A9\u0646\u06CC\u062F \u06CC\u0627 \u0628\u0627 \u0648\u0627\u0631\u062F \u06A9\u0631\u062F\u0646 \u0646\u0627\u0645 \u0648 \u0634\u0645\u0627\u0631\u0647 \u0647\u0645\u0631\u0627\u0647\u060C \u0628\u0631\u0627\u06CC\u0634\u0627\u0646 \u067E\u06CC\u0627\u0645\u06A9 \u062F\u0639\u0648\u062A \u0628\u0641\u0631\u0633\u062A\u06CC\u062F. \u0648\u0642\u062A\u06CC \u0641\u0627\u0644\u0648 \u062F\u0648\u0637\u0631\u0641\u0647 \u0634\u062F\u060C \u0644\u06CC\u0633\u062A \u06A9\u0627\u062F\u0648\u0647\u0627\u06CC \u0647\u0645 \u0631\u0627 \u0645\u06CC\u200C\u0628\u06CC\u0646\u06CC\u062F \u0648 \u0645\u06CC\u200C\u062A\u0648\u0627\u0646\u06CC\u062F \u06A9\u0627\u062F\u0648\u0647\u0627\u06CC\u0634\u0627\u0646 \u0631\u0627 \u0631\u0632\u0631\u0648 \u06A9\u0646\u06CC\u062F.

4. **\u{1F4C5} \u062A\u0642\u0648\u06CC\u0645 \u0645\u0646\u0627\u0633\u0628\u062A\u200C\u0647\u0627 \u0648 \u0631\u0648\u0632\u0634\u0645\u0627\u0631 (Calendar)**:
   \u062F\u0631 \u062A\u0628 **\xAB\u062A\u0642\u0648\u06CC\u0645\xBB** \u062A\u0645\u0627\u0645 \u062A\u0648\u0644\u062F\u0647\u0627 \u0648 \u0645\u0646\u0627\u0633\u0628\u062A\u200C\u0647\u0627\u06CC \u062E\u0648\u062F\u062A\u0627\u0646 \u0648 \u062F\u0648\u0633\u062A\u0627\u0646\u062A\u0627\u0646 \u0631\u0627 \u0628\u0647 \u0647\u0645\u0631\u0627\u0647 \u0634\u0645\u0627\u0631\u0634 \u0645\u0639\u06A9\u0648\u0633 \u0631\u0648\u0632\u0647\u0627 \u0645\u06CC\u200C\u0628\u06CC\u0646\u06CC\u062F \u062A\u0627 \u0647\u06CC\u0686\u200C\u06AF\u0627\u0647 \u062A\u0648\u0644\u062F\u06CC \u0631\u0627 \u0641\u0631\u0627\u0645\u0648\u0634 \u0646\u06A9\u0646\u06CC\u062F \u0648 \u06A9\u0627\u062F\u0648\u0647\u0627 \u0631\u0627 \u0632\u0648\u062F\u062A\u0631 \u0631\u0632\u0631\u0648 \u06A9\u0646\u06CC\u062F.

5. **\u{1F50D} \u0627\u06A9\u0633\u067E\u0644\u0648\u0631 \u0648 \u0645\u0642\u0627\u06CC\u0633\u0647 \u0642\u06CC\u0645\u062A\u200C\u0647\u0627 (Explore & Compare)**:
   \u062F\u0631 \u062A\u0628 **\xAB\u0627\u06A9\u0633\u067E\u0644\u0648\u0631\xBB** \u0627\u06CC\u062F\u0647\u200C\u0647\u0627\u06CC \u0646\u0627\u0628 \u062E\u0631\u06CC\u062F \u06A9\u0627\u062F\u0648 \u0647\u0633\u062A. \u0647\u0645\u0686\u0646\u06CC\u0646 \u0628\u0627 \u06A9\u0644\u06CC\u06A9 \u0631\u0648\u06CC \u062F\u06A9\u0645\u0647 \u0637\u0644\u0627\u06CC\u06CC **\xAB\u062C\u0633\u062A\u062C\u0648 \u0648 \u0645\u0642\u0627\u06CC\u0633\u0647 \u0642\u06CC\u0645\u062A\xBB** \u0645\u06CC\u200C\u062A\u0648\u0627\u0646\u06CC\u062F \u0627\u0631\u0632\u0627\u0646\u200C\u062A\u0631\u06CC\u0646 \u0642\u06CC\u0645\u062A \u06A9\u0627\u0644\u0627\u06CC \u0645\u0648\u0631\u062F\u0646\u0638\u0631 \u0631\u0627 \u0628\u06CC\u0646 \u0641\u0631\u0648\u0634\u06AF\u0627\u0647\u200C\u0647\u0627\u06CC \u0622\u0646\u0644\u0627\u06CC\u0646 \u0645\u0642\u0627\u06CC\u0633\u0647 \u06A9\u0646\u06CC\u062F.

6. **\u2601\uFE0F \u0647\u0645\u06AF\u0627\u0645\u200C\u0633\u0627\u0632\u06CC \u0627\u0628\u0631\u06CC \u062E\u0648\u062F\u06A9\u0627\u0631 (Cloud SQL Sync)**:
   \u0627\u0637\u0644\u0627\u0639\u0627\u062A \u0634\u0645\u0627 \u0628\u0647 \u0637\u0648\u0631 \u0632\u0646\u062F\u0647 \u0631\u0648\u06CC \u062F\u06CC\u062A\u0627\u0628\u06CC\u0633 \u0627\u0628\u0631\u06CC \u0627\u06CC\u0645\u0646 PostgreSQL \u0648 Firebase \u0630\u062E\u06CC\u0631\u0647 \u0648 \u0647\u0645\u06AF\u0627\u0645\u200C\u0633\u0627\u0632\u06CC \u0645\u06CC\u200C\u0634\u0648\u062F \u062A\u0627 \u0631\u0648\u06CC \u06A9\u0627\u0645\u067E\u06CC\u0648\u062A\u0631 \u0648 \u06AF\u0648\u0634\u06CC \u0647\u0645\u06CC\u0634\u0647 \u0628\u0647 \u062F\u0627\u062F\u0647\u200C\u0647\u0627\u06CC\u062A\u0627\u0646 \u062F\u0633\u062A\u0631\u0633\u06CC \u062F\u0627\u0634\u062A\u0647 \u0628\u0627\u0634\u06CC\u062F.

\u{1F4A1} **\u0627\u0632 \u0645\u0646 \u0628\u062E\u0648\u0627\u0647\u06CC\u062F \u06A9\u0627\u0631\u0647\u0627\u06CC\u062A\u0627\u0646 \u0631\u0627 \u0627\u0646\u062C\u0627\u0645 \u062F\u0647\u0645!**
\u0645\u06CC\u200C\u062A\u0648\u0627\u0646\u06CC\u062F \u0628\u0647 \u0645\u0646 \u0628\u06AF\u0648\u06CC\u06CC\u062F:
- *"\u06CC\u0647 \u0645\u0627\u06AF \u0633\u0631\u0627\u0645\u06CC\u06A9\u06CC \u0628\u0647 \u0627\u0648\u0644\u0648\u06CC\u062A \u0628\u0627\u0644\u0627 \u0628\u0647 \u0644\u06CC\u0633\u062A\u0645 \u0627\u0636\u0627\u0641\u0647 \u06A9\u0646"* (\u0645\u0646 \u0628\u0631\u0627\u062A\u0648\u0646 \u0627\u0636\u0627\u0641\u0647 \u0645\u06CC\u200C\u06A9\u0646\u0645!)
- *"\u0628\u0631\u0648 \u0628\u0647 \u062A\u0628 \u062F\u0648\u0633\u062A\u0627\u0646"* \u06CC\u0627 *"\u0628\u0631\u0648 \u0628\u0647 \u0628\u062E\u0634 \u062A\u0642\u0648\u06CC\u0645"* (\u0645\u0646 \u062A\u0628\u200C\u0647\u0627 \u0631\u0648 \u0628\u0631\u0627\u062A\u0648\u0646 \u062C\u0627\u0628\u0647\u200C\u062C\u0627 \u0645\u06CC\u200C\u06A9\u0646\u0645!)
- *"\u0642\u06CC\u0645\u062A \u067E\u0644\u06CC \u0627\u0633\u062A\u06CC\u0634\u0646 \u06F5 \u0631\u0648 \u0645\u0642\u0627\u06CC\u0633\u0647 \u06A9\u0646"* (\u067E\u0646\u062C\u0631\u0647 \u0645\u0642\u0627\u06CC\u0633\u0647 \u0642\u06CC\u0645\u062A \u0631\u0648 \u0628\u0631\u0627\u062A\u0648\u0646 \u0628\u0627\u0632 \u0645\u06CC\u200C\u06A9\u0646\u0645!)` : `\u2728 **Complete Guide to Giftino Mechanisms (AI Powered)** \u2728

I am fully trained on how Giftino works! Here is a breakdown of the core mechanics:

1. **\u{1F4CB} Create & Manage Wishlists**:
   Under the **"Lists"** tab, you can create events (Birthdays, Weddings, etc.) and add items you desire, including direct links, priority levels, and estimated prices.

2. **\u{1F512} The Magic Claim/Reservation System**:
   Friends can view your lists and **"Claim/Reserve"** items they intend to buy. This prevents duplicate presents!
   *To keep it a surprise, you cannot see who claimed what on your own list*, but your friends will see the reservation status on theirs. You can manage your reserved gifts under the **"Claimed"** tab.

3. **\u{1F465} Friends Network & SMS Invites**:
   Under the **"Friends"** tab, search for usernames to follow. You can also invite loved ones via phone numbers. Once you follow each other, you'll see their wishlists.

4. **\u{1F4C5} Occasions Calendar**:
   Under the **"Calendar"** tab, view countdowns to your and your friends' upcoming birthdays and milestones so you can claim and buy gifts in advance.

5. **\u{1F50D} Gift Ideas & Price Comparison**:
   The **"Explore"** tab offers rich suggestions. Use the **"Search & Compare Prices"** tool to compare live prices across online stores and save money!

6. **\u2601\uFE0F Secure Cloud Sync**:
   Your data is automatically synced to Cloud SQL PostgreSQL and Firebase, keeping it consistent across desktop and mobile.

\u{1F4A1} **Ask me to automate actions for you!**
You can tell me:
- *"Add a ceramic mug to my wishlist"*
- *"Take me to the friends feed"* or *"Open the calendar"*
- *"Compare price for PS5"*`;
    return {
      text: text2,
      action: null
    };
  }
  if ((msgLower.includes("\u0646\u0632\u062F\u06CC\u06A9") || msgLower.includes("\u062A\u0648\u0644\u062F") || msgLower.includes("birthday")) && (msgLower.includes("\u062F\u0648\u0633\u062A \u062F\u0627\u0631\u0647") || msgLower.includes("\u0686\u06CC \u0645\u06CC\u062E\u0648\u0627\u062F") || msgLower.includes("\u06A9\u0627\u062F\u0648") || msgLower.includes("\u0647\u062F\u06CC\u0647") || msgLower.includes("\u0686\u06CC \u062F\u0648\u0633\u062A") || msgLower.includes("like") || msgLower.includes("want") || msgLower.includes("\u0628\u062E\u0631\u0645") || msgLower.includes("\u0628\u062E\u0631"))) {
    const maryamDays = getDaysDifference(todayStr, "2026-08-15");
    const text2 = isFa ? `\u{1F382} **\u0646\u0632\u062F\u06CC\u06A9\u200C\u062A\u0631\u06CC\u0646 \u062A\u0648\u0644\u062F** \u0645\u062A\u0639\u0644\u0642 \u0628\u0647 \u062F\u0648\u0633\u062A \u0635\u0645\u06CC\u0645\u06CC \u0634\u0645\u0627 **\u0645\u0631\u06CC\u0645 \u0631\u0636\u0627\u06CC\u06CC** \u062F\u0631 \u062A\u0627\u0631\u06CC\u062E **\u06F2\u06F4 \u0645\u0631\u062F\u0627\u062F (August 15)** \u0627\u0633\u062A \u06A9\u0647 **${maryamDays} \u0631\u0648\u0632 \u062F\u06CC\u06AF\u0631** \u0627\u0633\u062A! 

\u{1F338} \u0645\u0631\u06CC\u0645 \u06A9\u0627\u062F\u0648\u0647\u0627\u06CC \u0632\u06CC\u0631 \u0631\u0627 \u062F\u0648\u0633\u062A \u062F\u0627\u0631\u062F \u0648 \u0622\u0631\u0632\u0648 \u06A9\u0631\u062F\u0647 \u0627\u0633\u062A:

\u06F1. **\u0634\u0645\u0639 \u0645\u0639\u0637\u0631 \u0627\u0633\u0637\u0648\u062E\u0648\u062F\u0648\u0633 \u0628\u0631\u0646\u062F \u0647\u0648\u0645** (\u062D\u062F\u0648\u062F \u06F2\u06F5\u06F0,\u06F0\u06F0\u06F0 \u062A\u0648\u0645\u0627\u0646)
   - \u{1F6D2} **\u0627\u0632 \u06A9\u062C\u0627 \u0628\u062E\u0631\u06CC\u0645\u061F** \u0627\u06CC\u0646 \u0647\u062F\u06CC\u0647 \u062F\u0627\u0631\u0627\u06CC \u0644\u06CC\u0646\u06A9 \u062E\u0631\u06CC\u062F \u0645\u0633\u062A\u0642\u06CC\u0645 \u0627\u0632 **\u062F\u06CC\u062C\u06CC\u200C\u06A9\u0627\u0644\u0627** \u062F\u0631 \u0635\u0641\u062D\u0647 \u067E\u0631\u0648\u0641\u0627\u06CC\u0644 \u0627\u0648\u0633\u062A.

\u06F2. **\u0645\u0627\u06AF \u0633\u0631\u0627\u0645\u06CC\u06A9\u06CC \u062F\u0633\u062A\u200C\u0633\u0627\u0632 \u0637\u0631\u062D \u06A9\u0647\u06A9\u0634\u0627\u0646** (\u062D\u062F\u0648\u062F \u06F3\u06F2\u06F0,\u06F0\u06F0\u06F0 \u062A\u0648\u0645\u0627\u0646)
   - \u{1F512} **\u0648\u0636\u0639\u06CC\u062A \u062E\u0631\u06CC\u062F:** \u0627\u06CC\u0646 \u0647\u062F\u06CC\u0647 \u062A\u0648\u0633\u0637 \u062F\u0648\u0633\u062A \u062F\u06CC\u06AF\u0631\u062A\u0627\u0646 **\u0627\u0645\u06CC\u0631 \u062D\u0633\u06CC\u0646\u06CC \u0631\u0632\u0631\u0648 \u0634\u062F\u0647 \u0627\u0633\u062A** \u062A\u0627 \u06A9\u0627\u062F\u0648\u06CC \u062A\u06A9\u0631\u0627\u0631\u06CC \u062E\u0631\u06CC\u062F\u0627\u0631\u06CC \u0646\u0634\u0648\u062F.

\u06F3. **\u06A9\u062A\u0627\u0628 \u0627\u062B\u0631 \u0645\u0631\u06A9\u0628 \u0646\u0648\u0634\u062A\u0647 \u062F\u0627\u0631\u0646 \u0647\u0627\u0631\u062F\u06CC** (\u062D\u062F\u0648\u062F \u06F1\u06F2\u06F0,\u06F0\u06F0\u06F0 \u062A\u0648\u0645\u0627\u0646)
   - \u{1F6D2} **\u0627\u0632 \u06A9\u062C\u0627 \u0628\u062E\u0631\u06CC\u0645\u061F** \u0644\u06CC\u0646\u06A9 \u062E\u0631\u06CC\u062F \u0645\u0633\u062A\u0642\u06CC\u0645 \u0627\u0632 **\u062F\u06CC\u062C\u06CC\u200C\u06A9\u0627\u0644\u0627** \u062F\u0627\u0631\u062F \u0648 \u0647\u0646\u0648\u0632 \u0622\u0632\u0627\u062F \u0648 \u0642\u0627\u0628\u0644 \u0631\u0632\u0631\u0648 \u0627\u0633\u062A.

\u{1F465} \u0645\u0646 \u0634\u0645\u0627 \u0631\u0627 \u0628\u0647 \u062A\u0628 **\xAB\u0634\u0628\u06A9\u0647 \u062F\u0648\u0633\u062A\u0627\u0646\xBB** \u0647\u062F\u0627\u06CC\u062A \u0645\u06CC\u200C\u06A9\u0646\u0645 \u062A\u0627 \u0644\u06CC\u0633\u062A \u06A9\u0627\u0645\u0644 \u0645\u0631\u06CC\u0645 \u0631\u0627 \u0628\u0628\u06CC\u0646\u06CC\u062F \u0648 \u0628\u062A\u0648\u0627\u0646\u06CC\u062F \u0647\u062F\u06CC\u0647 \u062F\u0644\u062E\u0648\u0627\u0647\u062A\u0627\u0646 \u0631\u0627 \u0628\u0631\u0627\u06CC \u0627\u0648 \u0631\u0632\u0631\u0648 \u0648 \u062E\u0631\u06CC\u062F\u0627\u0631\u06CC \u06A9\u0646\u06CC\u062F!` : `\u{1F382} **The nearest birthday** is your close friend **Maryam Rezai's** on **August 15** (which is in **${maryamDays} days**)!

\u{1F338} Here is what she likes and has added to her wishlist:

1. **Lavender Scented Candle (Home Brand)** (~250,000 Toman)
   - \u{1F6D2} **Where to buy:** Has a direct link to **Digikala** in her wishlist.

2. **Handmade Ceramic Galaxy Mug** (~320,000 Toman)
   - \u{1F512} **Status:** Already **Claimed/Reserved by Amir Hosseini** to avoid duplicate gifts.

3. **The Compound Effect Book by Darren Hardy** (~120,000 Toman)
   - \u{1F6D2} **Where to buy:** Direct link to **Digikala**, still free to claim!

\u{1F465} I'm switching you to the **"Friends Feed"** so you can view Maryam's complete list and reserve/claim a gift!`;
    return {
      text: text2,
      action: { type: "switch_tab", args: { tab: "friends" } }
    };
  }
  if (msgLower.includes("\u0686\u06CC \u062F\u0648\u0633\u062A \u062F\u0627\u0631\u0647") || msgLower.includes("\u0686\u06CC \u062F\u0648\u0633\u062A \u062F\u0627\u0631\u0646") || msgLower.includes("\u0686\u06CC \u0645\u06CC\u062E\u0648\u0627\u062F") || msgLower.includes("\u06A9\u0627\u062F\u0648 \u0686\u06CC") || msgLower.includes("\u0647\u062F\u06CC\u0647 \u0686\u06CC") || msgLower.includes("\u0686\u06CC \u0628\u062E\u0631\u0645") || msgLower.includes("\u0686\u0647 \u06A9\u0627\u062F\u0648\u06CC\u06CC") || msgLower.includes("\u0686\u0647 \u0647\u062F\u06CC\u0647 \u0627\u06CC")) {
    const text2 = isFa ? `\u062F\u0648\u0633\u062A\u0627\u0646 \u0634\u0645\u0627 \u0644\u06CC\u0633\u062A\u200C\u0647\u0627\u06CC \u0622\u0631\u0632\u0648\u06CC \u062E\u06CC\u0644\u06CC \u0642\u0634\u0646\u06AF\u06CC \u062F\u0627\u0631\u0646\u062F! \u0686\u0648\u0646 \u0646\u0627\u0645 \u062F\u0648\u0633\u062A \u062E\u0627\u0635\u06CC \u0631\u0627 \u0646\u0628\u0631\u062F\u06CC\u062F\u060C \u0644\u06CC\u0633\u062A \u0646\u0632\u062F\u06CC\u06A9\u200C\u062A\u0631\u06CC\u0646 \u062A\u0648\u0644\u062F \u06CC\u0639\u0646\u06CC **\u0645\u0631\u06CC\u0645 \u0631\u0636\u0627\u06CC\u06CC** \u0631\u0627 \u0628\u0631\u0627\u06CC\u062A\u0627\u0646 \u0645\u06CC\u200C\u0622\u0648\u0631\u0645:

\u{1F338} **\u0645\u0631\u06CC\u0645 \u0631\u0636\u0627\u06CC\u06CC** (\u062A\u0648\u0644\u062F \u06F2\u06F4 \u0645\u0631\u062F\u0627\u062F):
\u06F1. **\u0634\u0645\u0639 \u0645\u0639\u0637\u0631 \u0627\u0633\u0637\u0648\u062E\u0648\u062F\u0648\u0633 \u0628\u0631\u0646\u062F \u0647\u0648\u0645**
   - \u{1F6D2} **\u0627\u0632 \u06A9\u062C\u0627 \u0628\u062E\u0631\u06CC\u0645\u061F** \u062F\u0627\u0631\u0627\u06CC \u0644\u06CC\u0646\u06A9 \u062E\u0631\u06CC\u062F \u0645\u0633\u062A\u0642\u06CC\u0645 \u0627\u0632 **\u062F\u06CC\u062C\u06CC\u200C\u06A9\u0627\u0644\u0627** (\u0622\u0632\u0627\u062F \u0648 \u0642\u0627\u0628\u0644 \u0631\u0632\u0631\u0648)
\u06F2. **\u0645\u0627\u06AF \u0633\u0631\u0627\u0645\u06CC\u06A9\u06CC \u062F\u0633\u062A\u200C\u0633\u0627\u0632 \u0637\u0631\u062D \u06A9\u0647\u06A9\u0634\u0627\u0646**
   - \u{1F512} **\u0648\u0636\u0639\u06CC\u062A:** \u062A\u0648\u0633\u0637 \u0627\u0645\u06CC\u0631 \u062D\u0633\u06CC\u0646\u06CC \u0631\u0632\u0631\u0648 \u0634\u062F\u0647 \u0627\u0633\u062A.
\u06F3. **\u06A9\u062A\u0627\u0628 \u0627\u062B\u0631 \u0645\u0631\u06A9\u0628 \u0646\u0648\u0634\u062A\u0647 \u062F\u0627\u0631\u0646 \u0647\u0627\u0631\u062F\u06CC**
   - \u{1F6D2} **\u0627\u0632 \u06A9\u062C\u0627 \u0628\u062E\u0631\u06CC\u0645\u061F** \u062F\u0627\u0631\u0627\u06CC \u0644\u06CC\u0646\u06A9 \u062E\u0631\u06CC\u062F \u0645\u0633\u062A\u0642\u06CC\u0645 \u0627\u0632 **\u062F\u06CC\u062C\u06CC\u200C\u06A9\u0627\u0644\u0627** (\u0622\u0632\u0627\u062F \u0648 \u0642\u0627\u0628\u0644 \u0631\u0632\u0631\u0648)

\u{1F4BB} **\u0627\u0645\u06CC\u0631 \u062D\u0633\u06CC\u0646\u06CC** \u0648 \u{1F3E1} **\u0645\u06CC\u0646\u0627 \u06A9\u0631\u06CC\u0645\u06CC** \u0647\u0645 \u06A9\u0627\u062F\u0648\u0647\u0627\u06CC \u062C\u0630\u0627\u0628\u06CC \u0645\u062B\u0644 \u0645\u0627\u0648\u0633 \u0627\u0631\u06AF\u0648\u0646\u0648\u0645\u06CC\u06A9 \u0648 \u0642\u0648\u0631\u06CC \u067E\u06CC\u0631\u06A9\u0633 \u0686\u0627\u06CC\u200C\u0633\u0627\u0632 \u062F\u0648\u0633\u062A \u062F\u0627\u0631\u0646\u062F! 
\u{1F465} \u0634\u0645\u0627 \u0631\u0627 \u0628\u0647 \u062A\u0628 **\xAB\u0634\u0628\u06A9\u0647 \u062F\u0648\u0633\u062A\u0627\u0646\xBB** \u0647\u062F\u0627\u06CC\u062A \u06A9\u0631\u062F\u0645 \u062A\u0627 \u0628\u062A\u0648\u0627\u0646\u06CC\u062F \u062A\u0645\u0627\u0645 \u0627\u06CC\u0646 \u06A9\u0627\u062F\u0648\u0647\u0627 \u0631\u0627 \u0628\u0628\u06CC\u0646\u06CC\u062F\u060C \u0627\u0632 \u0647\u0645\u0627\u0646\u200C\u062C\u0627 \u0631\u0632\u0631\u0648 \u06A9\u0646\u06CC\u062F \u0648 \u0628\u0627 \u0644\u06CC\u0646\u06A9 \u0645\u0633\u062A\u0642\u06CC\u0645 \u0628\u062E\u0631\u06CC\u062F.` : `Your friends have amazing wishlists! Since you didn't specify a name, here is what the nearest birthday owner **Maryam Rezai** wants:

\u{1F338} **Maryam Rezai** (Birthday August 15):
1. **Lavender Scented Candle (Home Brand)**
   - \u{1F6D2} **Where to buy:** Direct link to **Digikala** (Available to claim)
2. **Handmade Ceramic Galaxy Mug**
   - \u{1F512} **Status:** Already claimed by Amir Hosseini.
3. **The Compound Effect Book by Darren Hardy**
   - \u{1F6D2} **Where to buy:** Direct link to **Digikala** (Available to claim)

\u{1F4BB} **Amir Hosseini** and \u{1F3E1} **Mina Karimi** also want items like ergonomic mice and Pyrex teapots!
\u{1F465} I have switched you to the **"Friends Feed"** where you can claim and purchase any of these directly!`;
    return {
      text: text2,
      action: { type: "switch_tab", args: { tab: "friends" } }
    };
  }
  if (msgLower.includes("\u0645\u0631\u06CC\u0645") || msgLower.includes("maryam")) {
    const text2 = isFa ? `\u0645\u0631\u06CC\u0645 \u0631\u0636\u0627\u06CC\u06CC \u062F\u0648\u0633\u062A \u0635\u0645\u06CC\u0645\u06CC \u0634\u0645\u0627\u0633\u062A. \u0627\u0648 \u06CC\u06A9 \u0644\u06CC\u0633\u062A \u0622\u0631\u0632\u0648 \u0628\u0647 \u0646\u0627\u0645 **\xAB\u062A\u0648\u0644\u062F \u06F2\u06F7 \u0633\u0627\u0644\u06AF\u06CC \u0645\u0631\u06CC\u0645 \u{1F382}\xBB** \u062F\u0627\u0631\u062F \u0648 \u06A9\u0627\u062F\u0648\u0647\u0627\u06CC \u0632\u06CC\u0631 \u0631\u0627 \u062F\u0648\u0633\u062A \u062F\u0627\u0631\u062F:

\u06F1. **\u0634\u0645\u0639 \u0645\u0639\u0637\u0631 \u0627\u0633\u0637\u0648\u062E\u0648\u062F\u0648\u0633 \u0628\u0631\u0646\u062F \u0647\u0648\u0645** (\u0642\u06CC\u0645\u062A \u062D\u062F\u0648\u062F \u06F2\u06F5\u06F0,\u06F0\u06F0\u06F0 \u062A\u0648\u0645\u0627\u0646)
   - \u{1F6D2} **\u0627\u0632 \u06A9\u062C\u0627 \u0628\u062E\u0631\u06CC\u0645\u061F** \u0627\u06CC\u0646 \u0647\u062F\u06CC\u0647 \u062F\u0627\u0631\u0627\u06CC \u0644\u06CC\u0646\u06A9 \u062E\u0631\u06CC\u062F \u0645\u0633\u062A\u0642\u06CC\u0645 \u0627\u0632 **\u062F\u06CC\u062C\u06CC\u200C\u06A9\u0627\u0644\u0627** \u0627\u0633\u062A. \u0647\u0645\u0686\u0646\u06CC\u0646 \u0628\u0627 \u06A9\u0644\u06CC\u06A9 \u0631\u0648\u06CC \u062F\u06A9\u0645\u0647 \u0637\u0644\u0627\u06CC\u06CC \u0631\u0646\u06AF **\xAB\u062C\u0633\u062A\u062C\u0648 \u0648 \u0645\u0642\u0627\u06CC\u0633\u0647 \u0642\u06CC\u0645\u062A\xBB** \u0645\u06CC\u200C\u062A\u0648\u0627\u0646\u06CC\u062F \u0627\u0631\u0632\u0627\u0646\u200C\u062A\u0631\u06CC\u0646 \u0641\u0631\u0648\u0634\u0646\u062F\u0647 \u0631\u0627 \u067E\u06CC\u062F\u0627 \u06A9\u0646\u06CC\u062F.
   
\u06F2. **\u0645\u0627\u06AF \u0633\u0631\u0627\u0645\u06CC\u06A9\u06CC \u062F\u0633\u062A\u200C\u0633\u0627\u0632 \u0637\u0631\u062D \u06A9\u0647\u06A9\u0634\u0627\u0646** (\u0642\u06CC\u0645\u062A \u062D\u062F\u0648\u062F \u06F3\u06F2\u06F0,\u06F0\u06F0\u06F0 \u062A\u0648\u0645\u0627\u0646)
   - \u{1F512} **\u0648\u0636\u0639\u06CC\u062A:** \u0627\u06CC\u0646 \u06A9\u0627\u062F\u0648 \u062A\u0648\u0633\u0637 \u062F\u0648\u0633\u062A \u0645\u0634\u062A\u0631\u06A9\u062A\u0627\u0646 **\u0627\u0645\u06CC\u0631 \u062D\u0633\u06CC\u0646\u06CC \u0631\u0632\u0631\u0648 \u0634\u062F\u0647 \u0627\u0633\u062A** \u062A\u0627 \u06A9\u0627\u062F\u0648\u06CC \u062A\u06A9\u0631\u0627\u0631\u06CC \u062E\u0631\u06CC\u062F\u0627\u0631\u06CC \u0646\u0634\u0648\u062F! \u0634\u0645\u0627 \u0628\u0627\u06CC\u062F \u0633\u0631\u0627\u063A \u06AF\u0632\u06CC\u0646\u0647\u200C\u0647\u0627\u06CC \u062F\u06CC\u06AF\u0631 \u0628\u0631\u0648\u06CC\u062F.

\u06F3. **\u06A9\u062A\u0627\u0628 \u0627\u062B\u0631 \u0645\u0631\u06A9\u0628 \u0646\u0648\u0634\u062A\u0647 \u062F\u0627\u0631\u0646 \u0647\u0627\u0631\u062F\u06CC** (\u0642\u06CC\u0645\u062A \u062D\u062F\u0648\u062F \u06F1\u06F2\u06F0,\u06F0\u06F0\u06F0 \u062A\u0648\u0645\u0627\u0646)
   - \u{1F6D2} **\u0627\u0632 \u06A9\u062C\u0627 \u0628\u062E\u0631\u06CC\u0645\u061F** \u0627\u06CC\u0646 \u06A9\u062A\u0627\u0628 \u0647\u0645 \u062F\u0627\u0631\u0627\u06CC \u0644\u06CC\u0646\u06A9 \u0645\u0633\u062A\u0642\u06CC\u0645 \u0628\u0647 **\u062F\u06CC\u062C\u06CC\u200C\u06A9\u0627\u0644\u0627** \u0627\u0633\u062A \u0648 \u0627\u0632 \u0646\u0634\u0631 \u0634\u0631\u06CC\u0641 \u0627\u0633\u062A. \u0647\u0646\u0648\u0632 \u0622\u0632\u0627\u062F \u0627\u0633\u062A \u0648 \u0645\u06CC\u200C\u062A\u0648\u0627\u0646\u06CC\u062F \u0622\u0646 \u0631\u0627 \u0631\u0632\u0631\u0648 \u06A9\u0646\u06CC\u062F!` : `Maryam Rezai has a wishlist named **"Maryam's 27th Birthday \u{1F382}"** with these desired gifts:

1. **Lavender Scented Candle (Home Brand)** (~250,000 Toman)
   - \u{1F6D2} **Where to buy:** Has a direct link to **Digikala**. You can also click **"Search & Compare Prices"** to find other sellers.
2. **Handmade Ceramic Galaxy Mug** (~320,000 Toman)
   - \u{1F512} **Status:** Already **Claimed/Reserved by Amir Hosseini** to prevent duplicates!
3. **The Compound Effect Book by Darren Hardy** (~120,000 Toman)
   - \u{1F6D2} **Where to buy:** Has a direct link to **Digikala** (Sharif Publication). Currently free to claim!`;
    return {
      text: text2,
      action: { type: "switch_tab", args: { tab: "friends" } }
    };
  }
  if (msgLower.includes("\u0627\u0645\u06CC\u0631") || msgLower.includes("amir")) {
    const text2 = isFa ? `\u0627\u0645\u06CC\u0631 \u062D\u0633\u06CC\u0646\u06CC \u062F\u0648\u0633\u062A \u0641\u0646\u06CC \u0634\u0645\u0627\u0633\u062A \u06A9\u0647 \u062F\u0631 \u062D\u0627\u0644 \u062A\u062C\u0647\u06CC\u0632 \u0627\u062A\u0627\u0642 \u06A9\u0627\u0631\u0634 \u0627\u0633\u062A! \u0627\u0648 \u0644\u06CC\u0633\u062A \u0622\u0631\u0632\u0648\u06CC\u06CC \u0628\u0647 \u0646\u0627\u0645 **\xAB\u067E\u0631\u0648\u0698\u0647 \u0647\u0648\u0645 \u0622\u0641\u06CC\u0633 \u0627\u0645\u06CC\u0631 \u{1F4BB}\xBB** \u062F\u0627\u0631\u062F:

\u06F1. **\u0645\u0627\u0648\u0633 \u0627\u0631\u06AF\u0648\u0646\u0648\u0645\u06CC\u06A9 \u0628\u06CC\u200C\u0633\u06CC\u0645 \u0631\u067E\u0648 Rapoo EV200** (\u0642\u06CC\u0645\u062A \u062D\u062F\u0648\u062F \u06F9\u06F8\u06F0,\u06F0\u06F0\u06F0 \u062A\u0648\u0645\u0627\u0646)
   - \u{1F6D2} **\u0627\u0632 \u06A9\u062C\u0627 \u0628\u062E\u0631\u06CC\u0645\u061F** \u0644\u06CC\u0646\u06A9 \u062E\u0631\u06CC\u062F \u0645\u0633\u062A\u0642\u06CC\u0645 \u0627\u0632 \u0641\u0631\u0648\u0634\u06AF\u0627\u0647 **\u062A\u06A9\u0646\u0648\u0644\u0627\u06CC\u0641** \u062F\u0627\u0631\u062F. \u0627\u0645\u06CC\u0631 \u0628\u0631\u0627\u06CC \u0631\u0641\u0639 \u0645\u0686\u200C\u062F\u0631\u062F \u0634\u062F\u06CC\u062F\u0627\u064B \u0628\u0647 \u0622\u0646 \u0646\u06CC\u0627\u0632 \u062F\u0627\u0631\u062F!
   
\u06F2. **\u067E\u0627\u06CC\u0647 \u0646\u06AF\u0647\u062F\u0627\u0631\u0646\u062F\u0647 \u0645\u0627\u0646\u06CC\u062A\u0648\u0631 \u062F\u0648 \u0628\u0627\u0632\u0648 \u0647\u06CC\u062F\u0631\u0648\u0644\u06CC\u06A9\u06CC** (\u0642\u06CC\u0645\u062A \u062D\u062F\u0648\u062F \u06F1,\u06F8\u06F5\u06F0,\u06F0\u06F0\u06F0 \u062A\u0648\u0645\u0627\u0646)
   - \u{1F6D2} **\u0627\u0632 \u06A9\u062C\u0627 \u0628\u062E\u0631\u06CC\u0645\u061F** \u062F\u0627\u0631\u0627\u06CC \u0644\u06CC\u0646\u06A9 \u062E\u0631\u06CC\u062F \u0645\u0633\u062A\u0642\u06CC\u0645 \u0627\u0632 **\u062F\u06CC\u062C\u06CC\u200C\u06A9\u0627\u0644\u0627** (\u0628\u0631\u0646\u062F \u0628\u0627\u0631\u0627\u062F) \u0627\u0633\u062A \u0648 \u062F\u0631 \u062D\u0627\u0644 \u062D\u0627\u0636\u0631 \u0622\u0632\u0627\u062F \u0648 \u0642\u0627\u0628\u0644 \u0631\u0632\u0631\u0648 \u0627\u0633\u062A.` : `Amir Hosseini has a wishlist named **"Amir's Home Office Project \u{1F4BB}"** with these items:

1. **Rapoo EV200 Ergonomic Wireless Mouse** (~980,000 Toman)
   - \u{1F6D2} **Where to buy:** Direct purchase link from **Technolife**. Highly needed for his wrist pain!
2. **Dual-Arm Hydraulic Monitor Mount** (~1,850,000 Toman)
   - \u{1F6D2} **Where to buy:** Direct link to **Digikala** (Barad Brand). Currently free to claim!`;
    return {
      text: text2,
      action: { type: "switch_tab", args: { tab: "friends" } }
    };
  }
  if (msgLower.includes("\u0645\u06CC\u0646\u0627") || msgLower.includes("mina")) {
    const text2 = isFa ? `\u0645\u06CC\u0646\u0627 \u06A9\u0631\u06CC\u0645\u06CC \u062F\u0631 \u062D\u0627\u0644 \u062C\u0627\u0628\u062C\u0627\u06CC\u06CC \u062E\u0627\u0646\u0647 \u0627\u0633\u062A \u0648 \u0628\u0631\u0627\u06CC \u0644\u06CC\u0633\u062A \u0622\u0631\u0632\u0648\u06CC **\xAB\u062C\u0647\u06CC\u0632\u06CC\u0647 \u0648 \u062C\u0627\u0628\u062C\u0627\u06CC\u06CC \u062E\u0627\u0646\u0647 \u0645\u06CC\u0646\u0627 \u{1F3E1}\xBB** \u0627\u06CC\u0646 \u0647\u062F\u0627\u06CC\u0627 \u0631\u0627 \u062B\u0628\u062A \u06A9\u0631\u062F\u0647 \u0627\u0633\u062A:

\u06F1. **\u0633\u062A \u0642\u0648\u0631\u06CC \u0648 \u0641\u0646\u062C\u0627\u0646 \u067E\u06CC\u0631\u06A9\u0633 \u0686\u0627\u06CC\u200C\u0633\u0627\u0632** (\u0642\u06CC\u0645\u062A \u062D\u062F\u0648\u062F \u06F4\u06F5\u06F0,\u06F0\u06F0\u06F0 \u062A\u0648\u0645\u0627\u0646)
   - \u{1F6D2} **\u0627\u0632 \u06A9\u062C\u0627 \u0628\u062E\u0631\u06CC\u0645\u061F** \u0644\u06CC\u0646\u06A9 \u0645\u0633\u062A\u0642\u06CC\u0645 \u062E\u0631\u06CC\u062F \u0627\u0632 **\u062F\u06CC\u062C\u06CC\u200C\u06A9\u0627\u0644\u0627** \u062F\u0627\u0631\u062F \u0648 \u0641\u06CC\u0644\u062A\u0631 \u062A\u0641\u0627\u0644\u0647 \u0641\u0646\u0631\u06CC \u0645\u062F\u0646\u0638\u0631\u0634 \u0627\u0633\u062A.
   
\u06F2. **\u0631\u0648 \u062A\u062E\u062A\u06CC \u062F\u0648 \u0646\u0641\u0631\u0647 \u0628\u0647\u0627\u0631\u0647 \u0637\u0631\u062D \u06A9\u062A\u0627\u0646** (\u0642\u06CC\u0645\u062A \u062D\u062F\u0648\u062F \u06F2,\u06F4\u06F0\u06F0,\u06F0\u06F0\u06F0 \u062A\u0648\u0645\u0627\u0646)
   - \u{1F6D2} **\u0627\u0632 \u06A9\u062C\u0627 \u0628\u062E\u0631\u06CC\u0645\u061F** \u0644\u06CC\u0646\u06A9 \u0645\u0633\u062A\u0642\u06CC\u0645 \u0646\u062F\u0627\u0631\u062F \u0627\u0645\u0627 \u062A\u0631\u062C\u06CC\u062D \u0627\u0648 \u0631\u0646\u06AF\u200C\u0647\u0627\u06CC \u0646\u0648\u062F \u06CC\u0627 \u0637\u0648\u0633\u06CC \u062E\u06CC\u0644\u06CC \u0631\u0648\u0634\u0646 \u0627\u0633\u062A. \u0628\u0627 \u06A9\u0644\u06CC\u06A9 \u0631\u0648\u06CC \u062F\u06A9\u0645\u0647 \u0637\u0644\u0627\u06CC\u06CC **\xAB\u062C\u0633\u062A\u062C\u0648 \u0648 \u0645\u0642\u0627\u06CC\u0633\u0647 \u0642\u06CC\u0645\u062A\xBB** \u0645\u06CC\u200C\u062A\u0648\u0627\u0646\u06CC\u062F \u0628\u0647\u062A\u0631\u06CC\u0646 \u0648 \u0627\u0631\u0632\u0627\u0646\u200C\u062A\u0631\u06CC\u0646 \u0631\u0648\u062A\u062E\u062A\u06CC \u0637\u0631\u062D \u06A9\u062A\u0627\u0646 \u0631\u0627 \u067E\u06CC\u062F\u0627 \u0648 \u062E\u0631\u06CC\u062F\u0627\u0631\u06CC \u06A9\u0646\u06CC\u062F!` : `Mina Karimi has a wishlist named **"Mina's Housewarming & Dowry \u{1F3E1}"**:

1. **Pyrex Tea Maker Teapot & Cup Set** (~450,000 Toman)
   - \u{1F6D2} **Where to buy:** Direct purchase link to **Digikala**.
2. **Double Spring Cotton Bedspread** (~2,400,000 Toman)
   - \u{1F6D2} **Where to buy:** No direct link, but she prefers light grey or nude colors. Click **"Search & Compare Prices"** to find the best spring linen sheets!`;
    return {
      text: text2,
      action: { type: "switch_tab", args: { tab: "friends" } }
    };
  }
  if (msgLower.includes("\u062F\u0648\u0633\u062A\u0627\u0645") || msgLower.includes("\u062F\u0648\u0633\u062A\u0627\u0646") || msgLower.includes("\u0628\u0642\u06CC\u0647 \u0686\u06CC") || msgLower.includes("friends want") || msgLower.includes("friends like")) {
    const text2 = isFa ? `\u062F\u0648\u0633\u062A\u0627\u0646 \u0634\u0645\u0627 \u0622\u0631\u0632\u0648\u0647\u0627\u06CC \u0628\u0633\u06CC\u0627\u0631 \u062C\u0630\u0627\u0628\u06CC \u062F\u0627\u0631\u0646\u062F! \u062F\u0631 \u0632\u06CC\u0631 \u0644\u06CC\u0633\u062A\u06CC \u0627\u0632 \u0622\u0646\u200C\u0647\u0627 \u0622\u0648\u0631\u062F\u0647 \u0634\u062F\u0647 \u0627\u0633\u062A:

\u{1F338} **\u0645\u0631\u06CC\u0645 \u0631\u0636\u0627\u06CC\u06CC** (\u062A\u0648\u0644\u062F \u06F2\u06F4 \u0645\u0631\u062F\u0627\u062F):
- \u0634\u0645\u0639 \u0645\u0639\u0637\u0631 \u0627\u0633\u0637\u0648\u062E\u0648\u062F\u0648\u0633 (\u062F\u06CC\u062C\u06CC\u200C\u06A9\u0627\u0644\u0627 - \u0622\u0632\u0627\u062F \u{1F513})
- \u06A9\u062A\u0627\u0628 \u0627\u062B\u0631 \u0645\u0631\u06A9\u0628 (\u062F\u06CC\u062C\u06CC\u200C\u06A9\u0627\u0644\u0627 - \u0622\u0632\u0627\u062F \u{1F513})
- \u0645\u0627\u06AF \u0633\u0631\u0627\u0645\u06CC\u06A9\u06CC \u062F\u0633\u062A\u200C\u0633\u0627\u0632 (\u062A\u0648\u0633\u0637 \u0627\u0645\u06CC\u0631 \u0631\u0632\u0631\u0648 \u0634\u062F\u0647 \u{1F512})

\u{1F4BB} **\u0627\u0645\u06CC\u0631 \u062D\u0633\u06CC\u0646\u06CC** (\u062A\u0648\u0644\u062F \u06F1\u06F1 \u0634\u0647\u0631\u06CC\u0648\u0631):
- \u0645\u0627\u0648\u0633 \u0627\u0631\u06AF\u0648\u0646\u0648\u0645\u06CC\u06A9 \u0631\u067E\u0648 Rapoo EV200 (\u062A\u06A9\u0646\u0648\u0644\u0627\u06CC\u0641 - \u0622\u0632\u0627\u062F \u{1F513})
- \u067E\u0627\u06CC\u0647 \u0647\u06CC\u062F\u0631\u0648\u0644\u06CC\u06A9\u06CC \u0645\u0627\u0646\u06CC\u062A\u0648\u0631 \u062F\u0648 \u0628\u0627\u0632\u0648 (\u062F\u06CC\u062C\u06CC\u200C\u06A9\u0627\u0644\u0627 - \u0622\u0632\u0627\u062F \u{1F513})

\u{1F3E1} **\u0645\u06CC\u0646\u0627 \u06A9\u0631\u06CC\u0645\u06CC** (\u062C\u0627\u0628\u062C\u0627\u06CC\u06CC \u062E\u0627\u0646\u0647 \u0645\u0647\u0631 \u0645\u0627\u0647):
- \u0633\u062A \u0642\u0648\u0631\u06CC \u0648 \u0641\u0646\u062C\u0627\u0646 \u067E\u06CC\u0631\u06A9\u0633 \u0686\u0627\u06CC\u200C\u0633\u0627\u0632 (\u062F\u06CC\u062C\u06CC\u200C\u06A9\u0627\u0644\u0627 - \u0622\u0632\u0627\u062F \u{1F513})
- \u0631\u0648 \u062A\u062E\u062A\u06CC \u062F\u0648 \u0646\u0641\u0631\u0647 \u0628\u0647\u0627\u0631\u0647 \u0637\u0631\u062D \u06A9\u062A\u0627\u0646 (\u0628\u062F\u0648\u0646 \u0644\u06CC\u0646\u06A9 \u0645\u0633\u062A\u0642\u06CC\u0645 - \u0622\u0632\u0627\u062F \u{1F513})

\u{1F465} **\u0645\u0646 \u0634\u0645\u0627 \u0631\u0627 \u0628\u0647 \u0628\u062E\u0634 \xAB\u0634\u0628\u06A9\u0647 \u062F\u0648\u0633\u062A\u0627\u0646\xBB \u0645\u0646\u062A\u0642\u0644 \u06A9\u0631\u062F\u0645 \u062A\u0627 \u0628\u0627 \u0632\u062F\u0646 \u062F\u06A9\u0645\u0647 \xAB\u0631\u0632\u0631\u0648\xBB\u060C \u0647\u062F\u06CC\u0647 \u0645\u0648\u0631\u062F \u0646\u0638\u0631 \u0631\u0627 \u0631\u0632\u0631\u0648 \u06A9\u0646\u06CC\u062F \u0648 \u0628\u0627 \u0644\u06CC\u0646\u06A9 \u0645\u0633\u062A\u0642\u06CC\u0645 \u06CC\u0627 \u062F\u06A9\u0645\u0647 \xAB\u062C\u0633\u062A\u062C\u0648 \u0648 \u0645\u0642\u0627\u06CC\u0633\u0647 \u0642\u06CC\u0645\u062A\xBB \u0622\u0646 \u0631\u0627 \u0628\u062E\u0631\u06CC\u062F!**` : `Your friends have amazing wishlists! Here is a summary:

\u{1F338} **Maryam Rezai** (Birthday August 15):
- Scented Lavender Candle (Digikala - Available \u{1F513})
- The Compound Effect Book (Digikala - Available \u{1F513})
- Galaxy Ceramic Mug (Reserved by Amir \u{1F512})

\u{1F4BB} **Amir Hosseini** (Birthday September 1):
- Rapoo EV200 Ergonomic Mouse (Technolife - Available \u{1F513})
- Dual-Arm Monitor Mount (Digikala - Available \u{1F513})

\u{1F3E1} **Mina Karimi** (Housewarming October 10):
- Pyrex Teapot & Cups Set (Digikala - Available \u{1F513})
- Double Cotton Bedspread (No Link - Available \u{1F513})

\u{1F465} **I've opened the "Friends" feed so you can claim/reserve an item and purchase it directly!**`;
    return {
      text: text2,
      action: { type: "switch_tab", args: { tab: "friends" } }
    };
  }
  if (msgLower.includes("\u06A9\u062C\u0627 \u0628\u062E\u0631\u0645") || msgLower.includes("\u0627\u0632 \u06A9\u062C\u0627") || msgLower.includes("\u06A9\u062C\u0627 \u062F\u0627\u0631\u0647") || msgLower.includes("\u0644\u06CC\u0646\u06A9 \u062E\u0631\u06CC\u062F") || msgLower.includes("\u062E\u0631\u06CC\u062F \u0645\u0633\u062A\u0642\u06CC\u0645") || msgLower.includes("how to buy") || msgLower.includes("where to buy") || msgLower.includes("purchase link")) {
    const text2 = isFa ? `\u0628\u0631\u0627\u06CC \u062E\u0631\u06CC\u062F \u0647\u062F\u06CC\u0647\u200C\u0647\u0627 \u062F\u0631 \u06AF\u06CC\u0641\u062A\u06CC\u200C\u0646\u0648 \u062F\u0648 \u0631\u0627\u0647 \u0641\u0648\u0642\u200C\u0627\u0644\u0639\u0627\u062F\u0647 \u0631\u0627\u062D\u062A \u0648\u062C\u0648\u062F \u062F\u0627\u0631\u062F:

\u06F1. **\u0644\u06CC\u0646\u06A9 \u062E\u0631\u06CC\u062F \u0645\u0633\u062A\u0642\u06CC\u0645 (\u0646\u0634\u0627\u0646\u0647 \u062E\u0631\u06CC\u062F):**
   \u0628\u0631\u062E\u06CC \u0627\u0632 \u06A9\u0627\u062F\u0648\u0647\u0627 \u062F\u0627\u0631\u0627\u06CC \u0644\u06CC\u0646\u06A9 \u0645\u0633\u062A\u0642\u06CC\u0645 \u0627\u0632 \u0641\u0631\u0648\u0634\u06AF\u0627\u0647\u200C\u0647\u0627\u06CC \u0645\u0639\u062A\u0628\u0631\u06CC \u0645\u062B\u0644 **\u062F\u06CC\u062C\u06CC\u200C\u06A9\u0627\u0644\u0627**\u060C **\u0628\u0627\u0633\u0644\u0627\u0645** \u06CC\u0627 **\u062A\u06A9\u0646\u0648\u0644\u0627\u06CC\u0641** \u0647\u0633\u062A\u0646\u062F. \u0628\u0627 \u06A9\u0644\u06CC\u06A9 \u0631\u0648\u06CC \u06AF\u0632\u06CC\u0646\u0647 **\xAB\u0645\u0634\u0627\u0647\u062F\u0647 \u0648 \u062E\u0631\u06CC\u062F\xBB** \u06CC\u0627 \u0622\u06CC\u06A9\u0648\u0646 \u0644\u06CC\u0646\u06A9 \u0645\u0633\u062A\u0642\u06CC\u0645\u060C \u0645\u0633\u062A\u0642\u06CC\u0645\u0627\u064B \u0648\u0627\u0631\u062F \u0635\u0641\u062D\u0647 \u0645\u062D\u0635\u0648\u0644 \u062F\u0631 \u0622\u0646 \u0633\u0627\u06CC\u062A \u0645\u06CC\u200C\u0634\u0648\u06CC\u062F.

\u06F2. **\u062F\u06A9\u0645\u0647 \u0637\u0644\u0627\u06CC\u06CC \xAB\u062C\u0633\u062A\u062C\u0648 \u0648 \u0645\u0642\u0627\u06CC\u0633\u0647 \u0642\u06CC\u0645\u062A\xBB:**
   \u0627\u06AF\u0631 \u0645\u062D\u0635\u0648\u0644\u06CC \u0644\u06CC\u0646\u06A9 \u0645\u0633\u062A\u0642\u06CC\u0645 \u0646\u062F\u0627\u0634\u062A \u06CC\u0627 \u0645\u06CC\u200C\u062E\u0648\u0627\u0647\u06CC\u062F \u0627\u0631\u0632\u0627\u0646\u200C\u062A\u0631\u06CC\u0646 \u0642\u06CC\u0645\u062A \u0628\u0627\u0632\u0627\u0631 \u0631\u0627 \u067E\u06CC\u062F\u0627 \u06A9\u0646\u06CC\u062F\u060C \u0631\u0648\u06CC \u062F\u06A9\u0645\u0647 \u0637\u0644\u0627\u06CC\u06CC **\xAB\u062C\u0633\u062A\u062C\u0648 \u0648 \u0645\u0642\u0627\u06CC\u0633\u0647 \u0642\u06CC\u0645\u062A\xBB** \u0632\u06CC\u0631 \u0647\u062F\u06CC\u0647 \u06A9\u0644\u06CC\u06A9 \u06A9\u0646\u06CC\u062F. \u0627\u06CC\u0646 \u062F\u06A9\u0645\u0647 \u0645\u0648\u062A\u0648\u0631 \u0645\u0642\u0627\u06CC\u0633\u0647 \u0642\u06CC\u0645\u062A \u06AF\u06CC\u0641\u062A\u06CC\u200C\u0646\u0648 \u0631\u0627 \u0628\u0627\u0632 \u0645\u06CC\u200C\u06A9\u0646\u062F \u0648 \u0628\u0647\u062A\u0631\u06CC\u0646 \u067E\u06CC\u0634\u0646\u0647\u0627\u062F\u0647\u0627 \u0631\u0627 \u062F\u0631 \u0645\u06CC\u0627\u0646 \u062F\u0647\u200C\u0647\u0627 \u0633\u0627\u06CC\u062A \u0628\u0632\u0631\u06AF \u0627\u06CC\u0631\u0627\u0646\u06CC \u0627\u0633\u06A9\u0646 \u0645\u06CC\u200C\u06A9\u0646\u062F!` : `There are two convenient ways to buy gifts on Giftino:

1. **Direct Purchase Links:**
   Click the **"View & Buy"** or link icon to go directly to major stores like **Digikala**, **Basalam**, or **Technolife**.

2. **Amber "Search & Compare Prices" Button:**
   Click this button under any gift to launch the Giftino Price Comparison Engine. It scans the entire market (Digikala, Basalam, SnappShop, etc.) to get you the lowest price.`;
    return { text: text2, action: null };
  }
  if (msgLower.includes("\u062A\u0648\u0644\u062F") || msgLower.includes("birthday") || msgLower.includes("\u0645\u0646\u0627\u0633\u0628\u062A")) {
    let userBirthdayList = currentWishlists?.find((wl) => wl.occasionType === "birthday");
    let responseText = "";
    if (msgLower.includes("\u062A\u0648\u0644\u062F \u0645\u0646") || msgLower.includes("my birthday")) {
      if (userBirthdayList && userBirthdayList.occasionDate) {
        const daysLeft = getDaysDifference(todayStr, userBirthdayList.occasionDate);
        if (daysLeft > 0) {
          responseText = isFa ? `\u062A\u0648\u0644\u062F \u0634\u0645\u0627 \u0628\u0631 \u0627\u0633\u0627\u0633 \u0644\u06CC\u0633\u062A \u0622\u0631\u0632\u0648\u0647\u0627 \u062F\u0631 \u062A\u0627\u0631\u06CC\u062E **${userBirthdayList.occasionDate}** \u062B\u0628\u062A \u0634\u062F\u0647 \u0627\u0633\u062A \u06A9\u0647 \u062F\u0642\u06CC\u0642\u0627\u064B **${daysLeft} \u0631\u0648\u0632 \u062F\u06CC\u06AF\u0631** \u0627\u0633\u062A! \u{1F389} \u0645\u0646 \u0647\u0645 \u0628\u0647 \u0627\u0646\u062F\u0627\u0632\u0647 \u0634\u0645\u0627 \u0628\u0631\u0627\u06CC\u0634 \u0647\u06CC\u062C\u0627\u0646\u200C\u0632\u062F\u0647 \u0647\u0633\u062A\u0645.` : `Your birthday is set on **${userBirthdayList.occasionDate}** in your wishlist, which is exactly **${daysLeft} days away**! \u{1F389} I'm already excited.`;
        } else if (daysLeft === 0) {
          responseText = isFa ? `\u0627\u0645\u0631\u0648\u0632 \u0631\u0648\u0632 \u062A\u0648\u0644\u062F \u0634\u0645\u0627\u0633\u062A! \u{1F60D} \u0635\u0645\u06CC\u0645\u0627\u0646\u0647 \u062A\u0641\u0644\u062F\u062A\u0627\u0646 \u0631\u0627 \u062A\u0628\u0631\u06CC\u06A9 \u0645\u06CC\u200C\u06AF\u0648\u06CC\u0645! \u0627\u0645\u06CC\u062F\u0648\u0627\u0631\u0645 \u0633\u0627\u0644\u06CC \u067E\u0631 \u0627\u0632 \u0634\u0627\u062F\u06CC\u060C \u0633\u0644\u0627\u0645\u062A\u06CC \u0648 \u06A9\u0627\u062F\u0648\u0647\u0627\u06CC \u0641\u0648\u0642\u200C\u0627\u0644\u0639\u0627\u062F\u0647 \u062F\u0627\u0634\u062A\u0647 \u0628\u0627\u0634\u06CC\u062F! \u{1F382}\u{1F388}` : `Today is your birthday! \u{1F60D} Happy Birthday to you! Have an amazing day filled with beautiful surprises and gifts! \u{1F382}\u{1F388}`;
        } else {
          responseText = isFa ? `\u062A\u0648\u0644\u062F \u0634\u0645\u0627 \u0628\u0631 \u0627\u0633\u0627\u0633 \u0644\u06CC\u0633\u062A \u0622\u0631\u0632\u0648\u0647\u0627 \u062F\u0631 \u062A\u0627\u0631\u06CC\u062E **${userBirthdayList.occasionDate}** \u06AF\u0630\u0634\u062A\u0647 \u0627\u0633\u062A! \u0627\u0645\u06CC\u062F\u0648\u0627\u0631\u0645 \u062C\u0634\u0646 \u0639\u0627\u0644\u06CC \u0648 \u06A9\u0627\u062F\u0648\u0647\u0627\u06CC \u062F\u0648\u0633\u062A\u200C\u062F\u0627\u0634\u062A\u0646\u06CC \u06AF\u0631\u0641\u062A\u0647 \u0628\u0627\u0634\u06CC\u062F. \u{1F60A}` : `Your birthday (${userBirthdayList.occasionDate}) has already passed. Hope you received amazing gifts! \u{1F60A}`;
        }
      } else {
        responseText = isFa ? "\u062A\u0627\u0631\u06CC\u062E \u062A\u0648\u0644\u062F \u0634\u0645\u0627 \u0647\u0646\u0648\u0632 \u062F\u0631 \u0633\u06CC\u0633\u062A\u0645 \u062B\u0628\u062A \u0646\u0634\u062F\u0647 \u0627\u0633\u062A. \u0647\u0645\u06CC\u0646 \u0627\u0644\u0627\u0646 \u0628\u0627 \u0627\u06CC\u062C\u0627\u062F \u06CC\u06A9 \u0644\u06CC\u0633\u062A \u0622\u0631\u0632\u0648\u06CC \u062C\u062F\u06CC\u062F \u0628\u0627 \u0645\u0646\u0627\u0633\u0628\u062A \xAB\u062A\u0648\u0644\u062F\xBB\u060C \u062A\u0627\u0631\u06CC\u062E \u062A\u0648\u0644\u062F\u062A\u0627\u0646 \u0631\u0627 \u062B\u0628\u062A \u06A9\u0646\u06CC\u062F \u062A\u0627 \u0628\u0647 \u062F\u0648\u0633\u062A\u0627\u0646\u062A\u0627\u0646 \u0647\u0645 \u06CC\u0627\u062F\u0622\u0648\u0631\u06CC \u0634\u0648\u062F!" : "Your birthday is not recorded yet. You can create a new wishlist with the 'Birthday' occasion to register your special day!";
      }
      return { text: responseText, action: null };
    }
    const maryamDays = getDaysDifference(todayStr, "2026-08-15");
    const amirDays = getDaysDifference(todayStr, "2026-09-01");
    let closestMsg = "";
    if (userBirthdayList && userBirthdayList.occasionDate) {
      const userDays = getDaysDifference(todayStr, userBirthdayList.occasionDate);
      if (userDays > 0 && userDays < maryamDays) {
        closestMsg = isFa ? `\u0646\u0632\u062F\u06CC\u06A9\u200C\u062A\u0631\u06CC\u0646 \u062A\u0648\u0644\u062F \u0645\u0631\u0628\u0648\u0637 \u0628\u0647 \u062E\u0648\u062F \u0634\u0645\u0627\u0633\u062A \u062F\u0631 \u062A\u0627\u0631\u06CC\u062E **${userBirthdayList.occasionDate}** \u06A9\u0647 \u0641\u0642\u0637 **${userDays} \u0631\u0648\u0632 \u062F\u06CC\u06AF\u0631** \u0628\u0627\u0642\u06CC \u0645\u0627\u0646\u062F\u0647 \u0627\u0633\u062A! \u{1F60D}` : `The nearest birthday is yours on **${userBirthdayList.occasionDate}** which is only **${userDays} days away**! \u{1F60D}`;
      }
    }
    if (!closestMsg) {
      closestMsg = isFa ? `\u0646\u0632\u062F\u06CC\u06A9\u200C\u062A\u0631\u06CC\u0646 \u062A\u0648\u0644\u062F \u062F\u0631 \u0645\u06CC\u0627\u0646 \u062F\u0648\u0633\u062A\u0627\u0646\u062A\u0627\u0646\u060C \u062A\u0648\u0644\u062F **\u0645\u0631\u06CC\u0645 \u0631\u0636\u0627\u06CC\u06CC** \u062F\u0631 \u062A\u0627\u0631\u06CC\u062E **\u06F2\u06F4 \u0645\u0631\u062F\u0627\u062F (August 15)** \u0627\u0633\u062A \u06A9\u0647 **${maryamDays} \u0631\u0648\u0632 \u062F\u06CC\u06AF\u0631** \u0645\u06CC\u200C\u0628\u0627\u0634\u062F! \u{1F382}\u{1F389} \u0634\u0645\u0627 \u0645\u06CC\u200C\u062A\u0648\u0627\u0646\u06CC\u062F \u0644\u06CC\u0633\u062A \u06A9\u0627\u062F\u0648\u0647\u0627\u06CC \u0627\u0648 \u0631\u0627 \u062F\u0631 \u062A\u0628 \xAB\u0634\u0628\u06A9\u0647 \u062F\u0648\u0633\u062A\u0627\u0646\xBB \u0628\u0628\u06CC\u0646\u06CC\u062F \u0648 \u06A9\u0627\u062F\u0648\u06CC \u062F\u0644\u062E\u0648\u0627\u0647\u062A\u0627\u0646 \u0631\u0627 \u0628\u0631\u0627\u06CC \u062E\u0631\u06CC\u062F \u0631\u0632\u0631\u0648 \u06A9\u0646\u06CC\u062F \u062A\u0627 \u0634\u062E\u0635 \u062F\u06CC\u06AF\u0631\u06CC \u0622\u0646 \u0631\u0627 \u062A\u06A9\u0631\u0627\u0631\u06CC \u0646\u062E\u0631\u062F.` : `The closest birthday among your friends is **Maryam Rezai's** on **August 15**, which is in **${maryamDays} days**! \u{1F382}\u{1F389} You can check her wishlist in the 'Friends' tab to reserve a gift for her and avoid duplicates.`;
    }
    return {
      text: closestMsg,
      action: { type: "switch_tab", args: { tab: "friends" } }
    };
  }
  if (msgLower.includes("\u0642\u06CC\u0645\u062A") || msgLower.includes("\u062A\u0631\u0628") || msgLower.includes("\u0645\u0642\u0627\u06CC\u0633\u0647") || msgLower.includes("search") || msgLower.includes("price") || msgLower.includes("compare")) {
    let query = "\u06A9\u06CC\u0628\u0648\u0631\u062F \u0645\u06A9\u0627\u0646\u06CC\u06A9\u0627\u0644";
    const matchFa = message.match(/(?:قیمت|مقایسه|جستجوی|سرچ|درباره)\s+([^.\n?]+)/);
    const matchEn = message.match(/(?:price|compare|search|about)\s+([^.\n?]+)/i);
    if (matchFa && matchFa[1]) {
      query = matchFa[1].trim();
    } else if (matchEn && matchEn[1]) {
      query = matchEn[1].trim();
    } else {
      query = message.replace(/(?:قیمت|ترب|مقایسه|سرچ|بگرد|کجا داره|چنده|چند)/g, "").trim() || query;
    }
    query = query.replace(/[?؟]/g, "").trim();
    return {
      text: isFa ? `\u0628\u0644\u0647 \u062D\u062A\u0645\u0627\u064B! \u0645\u0648\u062A\u0648\u0631 \u0645\u0642\u0627\u06CC\u0633\u0647 \u0642\u06CC\u0645\u062A \u0647\u0648\u0634\u0645\u0646\u062F \u06AF\u06CC\u0641\u062A\u06CC\u200C\u0646\u0648 \u0631\u0627 \u0628\u0631\u0627\u06CC \u0639\u0628\u0627\u0631\u062A **\xAB${query}\xBB** \u0628\u0627\u0632 \u06A9\u0631\u062F\u0645 \u062A\u0627 \u0627\u0631\u0632\u0627\u0646\u200C\u062A\u0631\u06CC\u0646 \u0641\u0631\u0648\u0634\u0646\u062F\u0647 \u0631\u0627 \u062F\u0631 \u0645\u06CC\u0627\u0646 \u062F\u06CC\u062C\u06CC\u200C\u06A9\u0627\u0644\u0627\u060C \u0628\u0627\u0633\u0644\u0627\u0645\u060C \u062A\u06A9\u0646\u0648\u0644\u0627\u06CC\u0641 \u0648 \u0627\u0633\u0646\u067E\u200C\u0634\u0627\u067E \u067E\u06CC\u062F\u0627 \u06A9\u0646\u06CC\u062F. \u{1F6D2}\u2728` : `Sure! I have triggered the Giftino Smart Price Engine for **"${query}"** to scan the best offers across top Iranian stores. \u{1F6D2}\u2728`,
      action: {
        type: "open_price_compare",
        args: { query }
      }
    };
  }
  if (msgLower.includes("\u0627\u0636\u0627\u0641\u0647") || msgLower.includes("\u062B\u0628\u062A") || msgLower.includes("add") || msgLower.includes("\u0628\u0646\u0648\u06CC\u0633") || msgLower.includes("\u06CC\u0627\u062F\u062F\u0627\u0634\u062A")) {
    let title = isFa ? "\u06CC\u06A9 \u06A9\u0627\u062F\u0648\u06CC \u062C\u0630\u0627\u0628" : "A special gift";
    const matchFa = message.match(/(?:اضافه کن|ثبت کن|بنویس|یادداشت کن)\s+([^.\n?]+)/) || message.match(/([^.\n?]+)\s+(?:رو اضافه کن|رو ثبت کن|رو بنویس)/);
    if (matchFa && matchFa[1]) {
      title = matchFa[1].trim();
    } else {
      title = message.replace(/(?:اضافه کن|ثبت کن|بنویس|یادداشت کن|رو|به لیستم|به لیست)/g, "").trim() || title;
    }
    title = title.replace(/[?؟]/g, "").trim();
    return {
      text: isFa ? `\u0628\u0627 \u06A9\u0645\u0627\u0644 \u0645\u06CC\u0644! \u06A9\u0627\u062F\u0648\u06CC **\xAB${title}\xBB** \u0631\u0627 \u0628\u0647 \u0644\u06CC\u0633\u062A \u0622\u0631\u0632\u0648\u0647\u0627\u06CC \u0641\u0639\u0627\u0644 \u0634\u0645\u0627 \u0627\u0636\u0627\u0641\u0647 \u06A9\u0631\u062F\u0645. \u0645\u06CC\u200C\u062A\u0648\u0627\u0646\u06CC\u062F \u0622\u0646 \u0631\u0627 \u062F\u0631 \u062A\u0628 \xAB\u0644\u06CC\u0633\u062A\u200C\u0647\u0627\u06CC \u0645\u0646\xBB \u0645\u0634\u0627\u0647\u062F\u0647 \u0628\u0641\u0631\u0645\u0627\u06CC\u06CC\u062F! \u{1F381}\u2728` : `My pleasure! I have added **"${title}"** to your active wishlist. Check it out under the "My Lists" tab! \u{1F381}\u2728`,
      action: {
        type: "add_gift",
        args: {
          title,
          price: null,
          priority: "medium",
          notes: isFa ? "\u0627\u0636\u0627\u0641\u0647 \u0634\u062F\u0647 \u062A\u0648\u0633\u0637 \u062F\u0633\u062A\u06CC\u0627\u0631 \u0647\u0648\u0634\u0645\u0646\u062F" : "Added by AI Assistant"
        }
      }
    };
  }
  if (msgLower.includes("\u0634\u0628\u06A9\u0647") || msgLower.includes("\u062F\u0648\u0633\u062A\u0627\u0645") || msgLower.includes("\u062F\u0648\u0633\u062A\u0627\u0646") || msgLower.includes("feed") || msgLower.includes("friends")) {
    return {
      text: isFa ? "\u0686\u0634\u0645! \u0634\u0645\u0627 \u0631\u0627 \u0628\u0647 \u062A\u0628 \xAB\u0634\u0628\u06A9\u0647 \u062F\u0648\u0633\u062A\u0627\u0646\xBB \u0647\u062F\u0627\u06CC\u062A \u0645\u06CC\u200C\u06A9\u0646\u0645 \u062A\u0627 \u0644\u06CC\u0633\u062A\u200C\u0647\u0627\u06CC \u0622\u0631\u0632\u0648\u06CC\u0634\u0627\u0646 \u0631\u0627 \u0628\u0628\u06CC\u0646\u06CC\u062F. \u{1F465}" : "Sure! Switching you to the 'Friends Feed' tab. \u{1F465}",
      action: { type: "switch_tab", args: { tab: "friends" } }
    };
  }
  if (msgLower.includes("\u0644\u06CC\u0633\u062A \u0645\u0646") || msgLower.includes("\u0622\u0631\u0632\u0648") || msgLower.includes("my list") || msgLower.includes("wishlist")) {
    return {
      text: isFa ? "\u062D\u062A\u0645\u0627\u064B! \u062A\u0628 \xAB\u0644\u06CC\u0633\u062A\u200C\u0647\u0627\u06CC \u0645\u0646\xBB \u0628\u0627\u0632 \u0634\u062F \u062A\u0627 \u0622\u0631\u0632\u0648\u0647\u0627\u06CC \u062E\u0648\u062F \u0631\u0627 \u0645\u062F\u06CC\u0631\u06CC\u062A \u06A9\u0646\u06CC\u062F. \u{1F4CB}" : "Opening your 'My Lists' tab. \u{1F4CB}",
      action: { type: "switch_tab", args: { tab: "my-lists" } }
    };
  }
  if (msgLower.includes("\u062A\u0646\u0638\u06CC\u0645") || msgLower.includes("\u067E\u0631\u0648\u0641\u0627\u06CC\u0644") || msgLower.includes("setting") || msgLower.includes("profile")) {
    return {
      text: isFa ? "\u0628\u0644\u0647! \u0648\u0627\u0631\u062F \u0628\u062E\u0634 \xAB\u062A\u0646\u0638\u06CC\u0645\u0627\u062A\xBB \u0634\u062F\u06CC\u0645 \u062A\u0627 \u0632\u0628\u0627\u0646 \u06CC\u0627 \u0645\u0634\u062E\u0635\u0627\u062A \u062E\u0648\u062F \u0631\u0627 \u062A\u063A\u06CC\u06CC\u0631 \u062F\u0647\u06CC\u062F. \u2699\uFE0F" : "Navigating to your 'Settings' tab. \u2699\uFE0F",
      action: { type: "switch_tab", args: { tab: "settings" } }
    };
  }
  if (msgLower.includes("\u0627\u06A9\u0633\u067E\u0644\u0648\u0631") || msgLower.includes("\u0627\u06CC\u062F\u0647") || msgLower.includes("\u067E\u06CC\u0634\u0646\u0647\u0627\u062F") || msgLower.includes("explore") || msgLower.includes("idea")) {
    return {
      text: isFa ? "\u0628\u0644\u0647! \u0648\u0627\u0631\u062F \u062A\u0628 \xAB\u0645\u0634\u0627\u0648\u0631 \u0647\u062F\u06CC\u0647\xBB \u0634\u062F\u06CC\u0645 \u062A\u0627 \u0628\u0627 \u0647\u0648\u0634 \u0645\u0635\u0646\u0648\u0639\u06CC \u0627\u06CC\u062F\u0647\u200C\u0647\u0627\u06CC \u062C\u0630\u0627\u0628 \u062E\u0644\u0642 \u06A9\u0646\u06CC\u0645. \u{1F4A1}" : "Opening the 'Gift Advisor' tab for custom AI gift ideas. \u{1F4A1}",
      action: { type: "switch_tab", args: { tab: "explore" } }
    };
  }
  return {
    text: isFa ? `\u0633\u0644\u0627\u0645 ${userProfile?.name || "\u06A9\u0627\u0631\u0628\u0631 \u06AF\u0631\u0627\u0645\u06CC"}! \u0645\u0646 \u062F\u0633\u062A\u06CC\u0627\u0631 \u0647\u0648\u0634\u0645\u0646\u062F \u06AF\u06CC\u0641\u062A\u06CC\u200C\u0646\u0648 \u0647\u0633\u062A\u0645. \u{1F60A}

\u0645\u06CC\u200C\u062A\u0648\u0627\u0646\u0645 \u0628\u0647 \u0634\u0645\u0627 \u06A9\u0645\u06A9 \u06A9\u0646\u0645 \u06A9\u0627\u062F\u0648\u0647\u0627\u06CC \u062F\u0648\u0633\u062A\u0627\u0646 \u06CC\u0627 \u062E\u0648\u062F\u062A\u0627\u0646 \u0631\u0627 \u0645\u062F\u06CC\u0631\u06CC\u062A \u06A9\u0646\u06CC\u062F\u060C \u062A\u0648\u0644\u062F\u0647\u0627 \u0631\u0627 \u0631\u0647\u06AF\u06CC\u0631\u06CC \u06A9\u0646\u06CC\u062F\u060C \u0628\u06AF\u0648\u06CC\u06CC\u062F \u062F\u0648\u0633\u062A\u0627\u0646\u062A\u0627\u0646 \u0686\u0647 \u06A9\u0627\u062F\u0648\u0647\u0627\u06CC\u06CC \u062F\u0648\u0633\u062A \u062F\u0627\u0631\u0646\u062F \u0648 \u0628\u06AF\u0648\u06CC\u06CC\u0645 \u0627\u0632 \u06A9\u062C\u0627 \u0628\u062E\u0631\u06CC\u062F!
\u0645\u062B\u0644\u0627\u064B \u0628\u0646\u0648\u06CC\u0633\u06CC\u062F:
- \xAB\u0645\u0631\u06CC\u0645 \u0686\u06CC \u062F\u0648\u0633\u062A \u062F\u0627\u0631\u0647\u061F\xBB
- \xAB\u062F\u0648\u0633\u062A\u0627\u0645 \u0686\u06CC \u0645\u06CC\u062E\u0648\u0627\u0646\u061F\xBB
- \xAB\u0627\u0632 \u06A9\u062C\u0627 \u06A9\u0627\u062F\u0648 \u0628\u062E\u0631\u0645\u061F\xBB
- \xAB\u062A\u0648\u0644\u062F \u0645\u0631\u06CC\u0645 \u0686\u0646\u062F \u0631\u0648\u0632 \u062F\u06CC\u06AF\u0647 \u0647\u0633\u062A\u061F\xBB
- \xAB\u0642\u06CC\u0645\u062A \u0645\u0627\u06AF \u0633\u0631\u0627\u0645\u06CC\u06A9\u06CC\xBB` : `Hello ${userProfile?.name || "there"}! I'm your Giftino AI Assistant. \u{1F60A}

I can help you manage wishlists, track birthdays, tell you what your friends like, and show you exactly where to buy them!
For example, try asking:
- "What does Maryam like?"
- "What do my friends want?"
- "Where can I buy the gifts?"
- "Compare mechanical keyboard price"`,
    action: null
  };
}

// ==========================================
// RESTORED ASSISTANT CHAT
// ==========================================
app.post("/api/assistant-chat", async (req: any, res: any) => {
  let message = "";
  let language = "fa";
  let currentWishlists = [];
  let activeTab = "my-lists";
  let userProfile = null;
  let isSupport = false;
  try {
    const body = req.body || {};
    message = body.message || "";
    language = body.language || "fa";
    currentWishlists = body.currentWishlists || [];
    activeTab = body.activeTab || "my-lists";
    userProfile = body.userProfile || null;
    isSupport = !!body.isSupport;
  } catch (err) {
    console.error("Error parsing request body:", err);
  }
  const isFa = language === "fa";
  let client;
  try {
    client = getGeminiClient();
  } catch (err) {
    let fallbackText = "";
    let fallbackAction = null;
    if (isSupport) {
      fallbackText = isFa
        ? "در حال حاضر سیستم پشتیبانی هوشمند در دسترس نیست. اگر این پاسخ مشکل شما را برطرف نکرد، لطفاً پیام خود را بگذارید تا کارشناسان پشتیبانی ما مستقیماً آن را بررسی کنند."
        : "The AI Support system is currently unavailable. If this response didn't resolve your issue, please leave a message so our support team can inspect it directly.";
    } else {
      const fallback = getLocalResponse(message, language, currentWishlists, activeTab, userProfile);
      fallbackText = fallback.text;
      fallbackAction = fallback.action;
    }
    return res.json({
      success: true,
      text: fallbackText,
      action: fallbackAction,
      isMock: true
    });
  }
  try {
    let systemInstruction = isFa ? `\u0634\u0645\u0627 \xAB\u062F\u0633\u062A\u06CC\u0627\u0631 \u0647\u0648\u0634\u0645\u0646\u062F \u0648 \u0647\u0645\u0647 \u0641\u0646 \u062D\u0631\u06CC\u0641 \u06AF\u06CC\u0641\u062A\u06CC\u200C\u0646\u0648\xBB (Giftino AI Assistant) \u0647\u0633\u062A\u06CC\u062F.
\u0648\u0638\u06CC\u0641\u0647 \u0634\u0645\u0627 \u0627\u06CC\u0646 \u0627\u0633\u062A \u06A9\u0647 \u0628\u0647 \u06A9\u0627\u0631\u0628\u0631 \u062F\u0631 \u0645\u062F\u06CC\u0631\u06CC\u062A \u0622\u0631\u0632\u0648\u0647\u0627\u060C \u067E\u06CC\u062F\u0627 \u06A9\u0631\u062F\u0646 \u06A9\u0627\u062F\u0648\u0647\u0627\u06CC \u0639\u0627\u0644\u06CC\u060C \u0645\u0642\u0627\u06CC\u0633\u0647 \u0642\u06CC\u0645\u062A\u200C\u0647\u0627\u060C \u062A\u0648\u0636\u06CC\u062D \u0686\u06AF\u0648\u0646\u06AF\u06CC \u06A9\u0627\u0631\u06A9\u0631\u062F \u0628\u0631\u0646\u0627\u0645\u0647 \u0648 \u06A9\u0627\u0631 \u0628\u0627 \u0628\u062E\u0634\u200C\u0647\u0627\u06CC \u0645\u062E\u062A\u0644\u0641 \u0627\u067E\u0644\u06CC\u06A9\u06CC\u0634\u0646 \u06A9\u0645\u06A9 \u06A9\u0646\u06CC\u062F.

\u0634\u0645\u0627 \u0628\u0627\u06CC\u062F \u0628\u0647 \u0637\u0648\u0631 \u06A9\u0627\u0645\u0644 \u0628\u0627 \u0633\u0627\u0632\u0648\u06A9\u0627\u0631 \u0648 \u0628\u062E\u0634\u200C\u0647\u0627\u06CC \u0645\u062E\u062A\u0644\u0641 \u06AF\u06CC\u0641\u062A\u06CC\u200C\u0646\u0648 \u0622\u0634\u0646\u0627 \u0628\u0627\u0634\u06CC\u062F \u0648 \u0647\u0631 \u0632\u0645\u0627\u0646 \u06A9\u0627\u0631\u0628\u0631 \u062F\u0631\u0628\u0627\u0631\u0647 \u0637\u0631\u0632 \u06A9\u0627\u0631 \u0628\u0631\u0646\u0627\u0645\u0647 \u06CC\u0627 \u0647\u0631 \u0628\u062E\u0634 \u0622\u0646 \u0633\u0648\u0627\u0644 \u06A9\u0631\u062F\u060C \u062A\u0645\u0627\u0645 \u0627\u0628\u0639\u0627\u062F \u0631\u0627 \u0628\u0627 \u0646\u0647\u0627\u06CC\u062A \u062C\u0632\u0626\u06CC\u0627\u062A \u0648 \u0628\u0627 \u0627\u062F\u0628\u06CC\u0627\u062A\u06CC \u062C\u0630\u0627\u0628\u060C \u0628\u0627\u06A9\u0644\u0627\u0633\u060C \u0645\u062D\u062A\u0631\u0645\u0627\u0646\u0647 \u0648 \u0635\u0645\u06CC\u0645\u06CC \u062A\u0648\u0636\u06CC\u062D \u062F\u0647\u06CC\u062F.

\u0631\u0627\u0647\u0646\u0645\u0627\u06CC \u06A9\u0627\u0645\u0644 \u0633\u0627\u0632\u0648\u06A9\u0627\u0631 \u0627\u067E\u0644\u06CC\u06A9\u06CC\u0634\u0646 \u06AF\u06CC\u0641\u062A\u06CC\u200C\u0646\u0648:
1. \u0627\u06CC\u062C\u0627\u062F \u0648 \u0645\u062F\u06CC\u0631\u06CC\u062A \u0644\u06CC\u0633\u062A \u0622\u0631\u0632\u0648\u0647\u0627 (Wishlists / Lists):
   - \u0647\u0631 \u06A9\u0627\u0631\u0628\u0631 \u0645\u06CC\u200C\u062A\u0648\u0627\u0646\u062F \u0628\u0631\u0627\u06CC \u0647\u0631 \u0645\u0646\u0627\u0633\u0628\u062A\u06CC (\u062A\u0648\u0644\u062F\u060C \u0639\u0631\u0648\u0633\u06CC\u060C \u0634\u0628 \u06CC\u0644\u062F\u0627\u060C \u0639\u06CC\u062F \u0646\u0648\u0631\u0648\u0632\u060C \u0641\u0627\u0631\u063A\u200C\u0627\u0644\u062A\u062D\u0635\u06CC\u0644\u06CC \u06CC\u0627 \u0645\u0646\u0627\u0633\u0628\u062A\u200C\u0647\u0627\u06CC \u062F\u0644\u062E\u0648\u0627\u0647) \u0644\u06CC\u0633\u062A \u0622\u0631\u0632\u0648 \u0628\u0633\u0627\u0632\u062F.
   - \u062F\u0631\u0648\u0646 \u0647\u0631 \u0644\u06CC\u0633\u062A\u060C \u06A9\u0627\u062F\u0648\u0647\u0627\u06CC \u062F\u0644\u062E\u0648\u0627\u0647 (Wishes) \u0631\u0627 \u0628\u0627 \u0646\u0627\u0645 \u06A9\u0627\u062F\u0648\u060C \u0642\u06CC\u0645\u062A \u062A\u062E\u0645\u06CC\u0646\u06CC \u0628\u0647 \u062A\u0648\u0645\u0627\u0646\u060C \u0627\u0648\u0644\u0648\u06CC\u062A (\u0628\u0627\u0644\u0627 high\u060C \u0645\u062A\u0648\u0633\u0637 medium\u060C \u06A9\u0645 low)\u060C \u0644\u06CC\u0646\u06A9 \u0645\u0633\u062A\u0642\u06CC\u0645 \u062E\u0631\u06CC\u062F (\u0645\u062B\u0644\u0627\u064B \u0627\u0632 \u062F\u06CC\u062C\u06CC\u200C\u06A9\u0627\u0644\u0627) \u0648 \u06CC\u0627\u062F\u062F\u0627\u0634\u062A \u062B\u0628\u062A \u0645\u06CC\u200C\u06A9\u0646\u062F.
   - \u06A9\u0627\u0631\u0628\u0631 \u0645\u06CC\u200C\u062A\u0648\u0627\u0646\u062F \u0622\u0631\u0632\u0648\u0647\u0627\u06CC \u062E\u0648\u062F \u0631\u0627 \u062D\u0630\u0641 \u06A9\u0646\u062F\u060C \u062C\u062F\u06CC\u062F \u0627\u0636\u0627\u0641\u0647 \u06A9\u0646\u062F \u06CC\u0627 \u0622\u0646\u200C\u0647\u0627 \u0631\u0627 \u0648\u06CC\u0631\u0627\u06CC\u0634 \u06A9\u0646\u062F.

2. \u0645\u06A9\u0627\u0646\u06CC\u0632\u0645 \u0631\u0632\u0631\u0648 \u0648 \u0627\u0639\u0644\u0627\u0645 \u06A9\u0627\u062F\u0648 (Claim / Reserve System):
   - \u062F\u0648\u0633\u062A\u0627\u0646 \u0634\u0645\u0627 \u0645\u06CC\u200C\u062A\u0648\u0627\u0646\u0646\u062F \u0644\u06CC\u0633\u062A\u200C\u0647\u0627\u06CC \u0622\u0631\u0632\u0648\u06CC \u0634\u0645\u0627 \u0631\u0627 \u0628\u0628\u06CC\u0646\u0646\u062F \u0648 \u0627\u06AF\u0631 \u0642\u0635\u062F \u062E\u0631\u06CC\u062F \u06A9\u0627\u062F\u0648\u06CC\u06CC \u0631\u0627 \u062F\u0627\u0631\u0646\u062F \u0622\u0646 \u0631\u0627 \xAB\u0631\u0632\u0631\u0648\xBB (Claim) \u06A9\u0646\u0646\u062F.
   - \u0627\u06CC\u0646 \u0645\u06A9\u0627\u0646\u06CC\u0632\u0645 \u0641\u0648\u0642\u200C\u0627\u0644\u0639\u0627\u062F\u0647 \u0645\u0627\u0646\u0639 \u062E\u0631\u06CC\u062F \u06A9\u0627\u062F\u0648\u0647\u0627\u06CC \u062A\u06A9\u0631\u0627\u0631\u06CC \u062A\u0648\u0633\u0637 \u062F\u0648\u0633\u062A\u0627\u0646 \u0645\u06CC\u200C\u0634\u0648\u062F!
   - \u0628\u0631\u0627\u06CC \u0627\u06CC\u0646 \u06A9\u0647 \u0644\u0630\u062A \u0633\u0648\u0631\u067E\u0631\u0627\u06CC\u0632 \u0634\u062F\u0646 \u062E\u0631\u0627\u0628 \u0646\u0634\u0648\u062F\u060C \u062E\u0648\u062F\u0650 \u0635\u0627\u062D\u0628\u0650 \u0644\u06CC\u0633\u062A (\u06A9\u0627\u0631\u0628\u0631\u06CC \u06A9\u0647 \u0644\u06CC\u0633\u062A \u0622\u0631\u0632\u0648\u0647\u0627 \u0628\u0631\u0627\u06CC \u0627\u0648\u0633\u062A) \u0628\u0647 \u0647\u06CC\u0686 \u0648\u062C\u0647 \u0645\u062A\u0648\u062C\u0647 \u0646\u0645\u06CC\u200C\u0634\u0648\u062F \u0686\u0647 \u06A9\u0633\u06CC \u0686\u0647 \u06A9\u0627\u062F\u0648\u06CC\u06CC \u0631\u0627 \u0628\u0631\u0627\u06CC\u0634 \u0631\u0632\u0631\u0648 \u06A9\u0631\u062F\u0647 \u0627\u0633\u062A! \u0627\u0645\u0627 \u062F\u0648\u0633\u062A\u0627\u0646 \u0627\u0648 \u062F\u0631 \u0644\u06CC\u0633\u062A \u0645\u06CC\u200C\u062A\u0648\u0627\u0646\u0646\u062F \u0628\u0628\u06CC\u0646\u0646\u062F \u06A9\u0647 \u06A9\u062F\u0627\u0645 \u06A9\u0627\u062F\u0648\u0647\u0627 \u0631\u0632\u0631\u0648 \u0634\u062F\u0647\u200C\u0627\u0646\u062F \u06CC\u0627 \u0622\u0632\u0627\u062F \u0647\u0633\u062A\u0646\u062F.
   - \u06A9\u0627\u0631\u0628\u0631 \u06A9\u0627\u062F\u0648\u0647\u0627\u06CC\u06CC \u0631\u0627 \u06A9\u0647 \u0628\u0631\u0627\u06CC \u062F\u0648\u0633\u062A\u0627\u0646\u0634 \u0631\u0632\u0631\u0648 \u06A9\u0631\u062F\u0647 \u0627\u0633\u062A \u062F\u0631 \u0628\u062E\u0634 \xAB\u06A9\u0627\u062F\u0648\u0647\u0627\u06CC \u0631\u0632\u0631\u0648 \u0634\u062F\u0647\xBB (Claimed Items) \u0645\u06CC\u200C\u0628\u06CC\u0646\u062F \u0648 \u0647\u0631 \u0648\u0642\u062A \u0628\u062E\u0648\u0627\u0647\u062F \u0645\u06CC\u200C\u062A\u0648\u0627\u0646\u062F \u0644\u063A\u0648 \u0631\u0632\u0631\u0648 \u06A9\u0646\u062F.

3. \u0634\u0628\u06A9\u0647 \u062F\u0648\u0633\u062A\u0627\u0646 \u0648 \u062F\u0639\u0648\u062A \u067E\u06CC\u0627\u0645\u06A9\u06CC (Friends Network & SMS Invite):
   - \u062F\u0631 \u0628\u062E\u0634 \xAB\u062F\u0648\u0633\u062A\u0627\u0646\xBB \u06A9\u0627\u0631\u0628\u0631 \u0645\u06CC\u200C\u062A\u0648\u0627\u0646\u062F \u062F\u0648\u0633\u062A\u0627\u0646 \u062E\u0648\u062F \u0631\u0627 \u0628\u0627 \u0646\u0627\u0645 \u06A9\u0627\u0631\u0628\u0631\u06CC (Username) \u062C\u0633\u062A\u062C\u0648 \u0648 \u0641\u0627\u0644\u0648 \u06A9\u0646\u062F.
   - \u0647\u0645\u0686\u0646\u06CC\u0646 \u0645\u06CC\u200C\u062A\u0648\u0627\u0646\u062F \u0628\u0627 \u0648\u0627\u0631\u062F \u06A9\u0631\u062F\u0646 \u0646\u0627\u0645 \u062F\u0648\u0633\u062A \u0648 \u0634\u0645\u0627\u0631\u0647 \u0645\u0648\u0628\u0627\u06CC\u0644\u0634\u060C \u0628\u0631\u0627\u06CC \u0627\u0648 \u062F\u0639\u0648\u062A\u200C\u0646\u0627\u0645\u0647 \u067E\u06CC\u0627\u0645\u06A9\u06CC \u0628\u0641\u0631\u0633\u062A\u062F (\u06A9\u0647 \u0644\u06CC\u0646\u06A9 \u062B\u0628\u062A\u200C\u0646\u0627\u0645 \u0634\u0628\u06CC\u0647\u200C\u0633\u0627\u0632\u06CC\u200C\u0634\u062F\u0647 \u06AF\u06CC\u0641\u062A\u06CC\u200C\u0646\u0648 \u0631\u0627 \u0628\u0631\u0627\u06CC\u0634 \u0627\u0631\u0633\u0627\u0644 \u0645\u06CC\u200C\u06A9\u0646\u062F).
   - \u0628\u0639\u062F \u0627\u0632 \u0641\u0627\u0644\u0648 \u06A9\u0631\u062F\u0646 \u062F\u0648\u0637\u0631\u0641\u0647\u060C \u06A9\u0627\u0631\u0628\u0631\u0627\u0646 \u0645\u06CC\u200C\u062A\u0648\u0627\u0646\u0646\u062F \u0644\u06CC\u0633\u062A\u200C\u0647\u0627\u06CC \u0647\u0645 \u0631\u0627 \u0628\u0628\u06CC\u0646\u0646\u062F\u060C \u0628\u0631\u0627\u06CC \u0647\u0645 \u06A9\u0627\u062F\u0648 \u0631\u0632\u0631\u0648 \u06A9\u0646\u0646\u062F \u0648 \u062A\u0627\u0631\u06CC\u062E\u200C\u0647\u0627\u06CC \u062A\u0648\u0644\u062F \u0647\u0645 \u0631\u0627 \u062F\u0646\u0628\u0627\u0644 \u06A9\u0646\u0646\u062F.

4. \u062A\u0642\u0648\u06CC\u0645 \u0645\u0646\u0627\u0633\u0628\u062A\u200C\u0647\u0627 \u0648 \u0631\u0648\u0632\u0634\u0645\u0627\u0631 \u062A\u0648\u0644\u062F\u0647\u0627 (Occasions Calendar):
   - \u062F\u0631 \u0628\u062E\u0634 \xAB\u062A\u0642\u0648\u06CC\u0645 \u0645\u0646\u0627\u0633\u0628\u062A\u200C\u0647\u0627\xBB \u062A\u0648\u0644\u062F\u0647\u0627 \u0648 \u0645\u0646\u0627\u0633\u0628\u062A\u200C\u0647\u0627\u06CC \u0645\u0647\u0645 \u06A9\u0627\u0631\u0628\u0631 \u0648 \u062A\u0645\u0627\u0645 \u062F\u0648\u0633\u062A\u0627\u0646\u0634 \u0628\u0627 \u0634\u0645\u0627\u0631\u0634 \u0645\u0639\u06A9\u0648\u0633 \u062F\u0642\u06CC\u0642 \u0646\u0634\u0627\u0646 \u062F\u0627\u062F\u0647 \u0645\u06CC\u200C\u0634\u0648\u062F \u062A\u0627 \u0647\u06CC\u0686 \u062A\u0648\u0644\u062F\u06CC \u0641\u0631\u0627\u0645\u0648\u0634 \u0646\u0634\u0648\u062F \u0648 \u06A9\u0627\u0631\u0628\u0631 \u0628\u062A\u0648\u0627\u0646\u062F \u0627\u0632 \u0642\u0628\u0644 \u0628\u0631\u0627\u06CC \u0631\u0632\u0631\u0648 \u06A9\u0627\u062F\u0648 \u0627\u0642\u062F\u0627\u0645 \u06A9\u0646\u062F.
   - \u0647\u0645\u0686\u0646\u06CC\u0646 \u06A9\u0627\u0631\u0628\u0631 \u0645\u06CC\u200C\u062A\u0648\u0627\u0646\u062F \u0645\u0646\u0627\u0633\u0628\u062A\u200C\u0647\u0627\u06CC \u0633\u0641\u0627\u0631\u0634\u06CC \u062C\u062F\u06CC\u062F \u0631\u0627 \u0645\u0633\u062A\u0642\u06CC\u0645\u0627\u064B \u0628\u0647 \u0627\u06CC\u0646 \u062A\u0642\u0648\u06CC\u0645 \u0627\u0636\u0627\u0641\u0647 \u06A9\u0646\u062F.

5. \u0627\u06A9\u0633\u067E\u0644\u0648\u0631 \u0648 \u0645\u0642\u0627\u06CC\u0633\u0647 \u0642\u06CC\u0645\u062A\u200C\u0647\u0627 (Explore & Price Search Engine):
   - \u062F\u0631 \u0628\u062E\u0634 \xAB\u0627\u06A9\u0633\u067E\u0644\u0648\u0631\xBB \u0627\u06CC\u062F\u0647\u200C\u0647\u0627\u06CC \u0646\u0627\u0628 \u06A9\u0627\u062F\u0648 \u0628\u0631 \u0627\u0633\u0627\u0633 \u0631\u062F\u0647\u200C\u0647\u0627\u06CC \u0642\u06CC\u0645\u062A\u06CC \u0648 \u062C\u0646\u0633\u06CC\u062A \u0648 \u0646\u0633\u0628\u062A (\u0631\u0641\u06CC\u0642\u060C \u0647\u0645\u0633\u0631\u060C \u0647\u0645\u06A9\u0627\u0631\u060C \u067E\u062F\u0631 \u0648 \u0645\u0627\u062F\u0631) \u0648\u062C\u0648\u062F \u062F\u0627\u0631\u062F.
   - \u062F\u06A9\u0645\u0647 \u0637\u0644\u0627\u06CC\u06CC \xAB\u062C\u0633\u062A\u062C\u0648 \u0648 \u0645\u0642\u0627\u06CC\u0633\u0647 \u0642\u06CC\u0645\u062A\xBB \u062F\u0631 \u0628\u0631\u0646\u0627\u0645\u0647 \u0642\u0631\u0627\u0631 \u062F\u0627\u0631\u062F \u06A9\u0647 \u0628\u0627 \u0632\u062F\u0646 \u0622\u0646\u060C \u067E\u0646\u062C\u0631\u0647 \u0645\u0642\u0627\u06CC\u0633\u0647 \u0632\u0646\u062F\u0647 \u0642\u06CC\u0645\u062A\u200C\u0647\u0627 \u062F\u0631 \u0628\u0627\u0632\u0627\u0631 \u0622\u0646\u0644\u0627\u06CC\u0646 \u0628\u0627\u0632 \u0645\u06CC\u200C\u0634\u0648\u062F \u062A\u0627 \u0627\u0631\u0632\u0627\u0646\u200C\u062A\u0631\u06CC\u0646 \u0642\u06CC\u0645\u062A \u0631\u0627 \u0628\u0631\u0627\u06CC \u0647\u062F\u06CC\u0647 \u067E\u06CC\u062F\u0627 \u06A9\u0646\u0646\u062F.

6. \u062F\u06CC\u062A\u0627\u0628\u06CC\u0633 \u0627\u0628\u0631\u06CC \u0632\u0646\u062F\u0647 \u0648 \u0627\u06CC\u0645\u0646 (Cloud SQL PostgreSQL & Firebase Sync):
   - \u062A\u0645\u0627\u0645 \u0627\u0637\u0644\u0627\u0639\u0627\u062A \u06A9\u0627\u0631\u0628\u0631 \u0628\u0647 \u0635\u0648\u0631\u062A \u0644\u062D\u0638\u0647\u200C\u0627\u06CC \u0628\u0627 \u062F\u06CC\u062A\u0627\u0628\u06CC\u0633 \u0627\u0628\u0631\u06CC \u0642\u062F\u0631\u062A\u0645\u0646\u062F Cloud SQL (PostgreSQL) \u0648 Firebase Auth \u0647\u0645\u06AF\u0627\u0645\u200C\u0633\u0627\u0632\u06CC \u0645\u06CC\u200C\u0634\u0648\u062F \u062A\u0627 \u0627\u0637\u0644\u0627\u0639\u0627\u062A \u062F\u0631 \u06A9\u0627\u0645\u067E\u06CC\u0648\u062A\u0631 \u0648 \u06AF\u0648\u0634\u06CC \u06A9\u0627\u0645\u0644\u0627\u064B \u06CC\u06A9\u067E\u0627\u0631\u0686\u0647 \u0648 \u0627\u06CC\u0645\u0646 \u0628\u0645\u0627\u0646\u062F \u0648 \u0627\u0632 \u062F\u0633\u062A \u0646\u0631\u0648\u062F.

\u0634\u0645\u0627 \u0628\u0647 \u0648\u0636\u0639\u06CC\u062A \u0641\u0639\u0644\u06CC \u06A9\u0627\u0631\u0628\u0631 \u062F\u0633\u062A\u0631\u0633\u06CC \u062F\u0627\u0631\u06CC\u062F:
- \u0632\u0628\u0627\u0646 \u06A9\u0627\u0631\u0628\u0631: ${language}
- \u062A\u0628 \u0641\u0639\u0644\u06CC \u06A9\u0627\u0631\u0628\u0631: ${activeTab}
- \u0644\u06CC\u0633\u062A\u200C\u0647\u0627\u06CC \u0622\u0631\u0632\u0648\u06CC \u06A9\u0627\u0631\u0628\u0631: ${JSON.stringify(currentWishlists)}
- \u067E\u0631\u0648\u0641\u0627\u06CC\u0644 \u06A9\u0627\u0631\u0628\u0631: ${JSON.stringify(userProfile)}

\u0634\u0645\u0627 \u0628\u0627\u06CC\u062F \u0628\u0647 \u0632\u0628\u0627\u0646 \u0641\u0627\u0631\u0633\u06CC \u0631\u0648\u0627\u0646\u060C \u0628\u0633\u06CC\u0627\u0631 \u0628\u0627\u06A9\u0644\u0627\u0633\u060C \u0645\u062D\u062A\u0631\u0645\u0627\u0646\u0647 \u0648 \u0635\u0645\u06CC\u0645\u06CC \u067E\u0627\u0633\u062E \u062F\u0647\u06CC\u062F.
\u0639\u0644\u0627\u0648\u0647 \u0628\u0631 \u0635\u062D\u0628\u062A\u060C \u0634\u0645\u0627 \u0645\u06CC\u200C\u062A\u0648\u0627\u0646\u06CC\u062F \u062F\u0633\u062A\u0648\u0631\u0627\u0644\u0639\u0645\u0644\u200C\u0647\u0627\u06CC \u062E\u0627\u0635\u06CC (Actions) \u0631\u0627 \u062F\u0631 \u0642\u0627\u0644\u0628 \u062E\u0631\u0648\u062C\u06CC \u0633\u0627\u062E\u062A\u0627\u0631\u06CC\u0627\u0641\u062A\u0647 \u0628\u0647 \u0627\u067E\u0644\u06CC\u06A9\u06CC\u0634\u0646 \u0628\u0641\u0631\u0633\u062A\u06CC\u062F \u062A\u0627 \u062A\u063A\u06CC\u06CC\u0631\u0627\u062A\u06CC \u0628\u0647 \u0635\u0648\u0631\u062A \u062E\u0648\u062F\u06A9\u0627\u0631 \u062F\u0631 \u0635\u0641\u062D\u0647 \u0627\u0639\u0645\u0627\u0644 \u0634\u0648\u062F.
\u0634\u0645\u0627 \u0641\u0642\u0637 \u0628\u0627\u06CC\u062F \u062F\u0631 \u0642\u0627\u0644\u0628 \u06CC\u06A9 \u0634\u06CC\u0621 JSON \u0628\u0627 \u0641\u06CC\u0644\u062F\u0647\u0627\u06CC \u0632\u06CC\u0631 \u067E\u0627\u0633\u062E \u062F\u0647\u06CC\u062F:
1. text: \u067E\u0627\u0633\u062E \u0635\u0648\u062A\u06CC/\u0645\u062A\u0646\u06CC \u0635\u0645\u06CC\u0645\u06CC \u0648 \u0631\u0627\u0647\u0646\u0645\u0627 \u0628\u0647 \u06A9\u0627\u0631\u0628\u0631 \u06A9\u0647 \u06A9\u0627\u0645\u0644 \u0648 \u067E\u0631 \u0627\u0632 \u062C\u0632\u0626\u06CC\u0627\u062A \u0627\u0633\u062A.
2. action: (\u0627\u062E\u062A\u06CC\u0627\u0631\u06CC) \u062F\u0631 \u0635\u0648\u0631\u062A\u06CC \u06A9\u0647 \u06A9\u0627\u0631\u0628\u0631 \u062F\u0631\u062E\u0648\u0627\u0633\u062A\u06CC \u062F\u0627\u0634\u062A \u06A9\u0647 \u0628\u0647 \u06CC\u06A9\u06CC \u0627\u0632 \u062F\u0633\u062A\u0648\u0631\u0627\u062A \u0632\u06CC\u0631 \u0631\u0628\u0637 \u062F\u0627\u0634\u062A\u060C \u0627\u06CC\u0646 \u0641\u06CC\u0644\u062F \u0631\u0627 \u067E\u0631 \u06A9\u0646\u06CC\u062F:
   - add_gift: \u0627\u06AF\u0631 \u06A9\u0627\u0631\u0628\u0631 \u062E\u0648\u0627\u0633\u062A \u06A9\u0627\u062F\u0648\u06CC\u06CC \u0628\u0647 \u0644\u06CC\u0633\u062A\u0634 \u0627\u0636\u0627\u0641\u0647 \u06A9\u0646\u062F (\u0645\u062B\u0644\u0627\u064B "\u06CC\u0647 \u0645\u0627\u06AF \u0633\u0631\u0627\u0645\u06CC\u06A9\u06CC \u0628\u0647 \u0644\u06CC\u0633\u062A\u0645 \u0627\u0636\u0627\u0641\u0647 \u06A9\u0646"). \u0622\u0631\u06AF\u0648\u0645\u0627\u0646\u200C\u0647\u0627: { title: "\u0639\u0646\u0648\u0627\u0646 \u06A9\u0627\u062F\u0648", price: \u0642\u06CC\u0645\u062A \u0628\u0647 \u062A\u0648\u0645\u0627\u0646 (\u0639\u062F\u062F \u06CC\u0627 null), priority: "high"|"medium"|"low", notes: "\u062A\u0648\u0636\u06CC\u062D\u0627\u062A \u0627\u062E\u062A\u06CC\u0627\u0631\u06CC" }
   - switch_tab: \u0627\u06AF\u0631 \u06A9\u0627\u0631\u0628\u0631 \u062E\u0648\u0627\u0633\u062A \u0628\u0647 \u0635\u0641\u062D\u0647 \u06CC\u0627 \u062A\u0628 \u062F\u06CC\u06AF\u0631\u06CC \u0628\u0631\u0648\u062F (\u0645\u062B\u0644\u0627\u064B "\u0628\u0631\u0648 \u0628\u0647 \u0635\u0641\u062D\u0647 \u062F\u0648\u0633\u062A\u0627\u0646" \u06CC\u0627 "\u0635\u0641\u062D\u0647 \u0627\u06A9\u0633\u067E\u0644\u0648\u0631 \u0631\u0648 \u0628\u0627\u0632 \u06A9\u0646"). \u0622\u0631\u06AF\u0648\u0645\u0627\u0646\u200C\u0647\u0627: { tab: "my-lists"|"friends"|"add-wish"|"explore"|"claimed"|"settings"|"calendar" }
   - open_price_compare: \u0627\u06AF\u0631 \u06A9\u0627\u0631\u0628\u0631 \u062E\u0648\u0627\u0633\u062A \u0642\u06CC\u0645\u062A \u06A9\u0627\u062F\u0648\u06CC\u06CC \u0631\u0627 \u0633\u0631\u0686 \u06A9\u0646\u062F \u06CC\u0627 \u0645\u0642\u0627\u06CC\u0633\u0647 \u06A9\u0646\u062F (\u0645\u062B\u0644\u0627\u064B "\u0642\u06CC\u0645\u062A \u06A9\u06CC\u0628\u0648\u0631\u062F \u0645\u06A9\u0627\u0646\u06CC\u06A9\u0627\u0644 \u0631\u0648 \u0686\u06A9 \u06A9\u0646"). \u0622\u0631\u06AF\u0648\u0645\u0627\u0646\u200C\u0647\u0627: { query: "\u0639\u0628\u0627\u0631\u062A \u062C\u0633\u062A\u062C\u0648" }
   - change_language: \u0627\u06AF\u0631 \u06A9\u0627\u0631\u0628\u0631 \u062E\u0648\u0627\u0633\u062A \u0632\u0628\u0627\u0646 \u0628\u0631\u0646\u0627\u0645\u0647 \u0631\u0627 \u0639\u0648\u0636 \u06A9\u0646\u062F.

\u0645\u062B\u0627\u0644 \u062E\u0631\u0648\u062C\u06CC JSON:
{
  "text": "\u062D\u062A\u0645\u0627! \u06A9\u06CC\u0628\u0648\u0631\u062F \u0645\u06A9\u0627\u0646\u06CC\u06A9\u0627\u0644 Keychron K2 \u0628\u0627 \u0642\u06CC\u0645\u062A \u062A\u0642\u0631\u06CC\u0628\u06CC \u06F4,\u06F8\u06F0\u06F0,\u06F0\u06F0\u06F0 \u062A\u0648\u0645\u0627\u0646 \u0628\u0647 \u0644\u06CC\u0633\u062A \u0627\u0636\u0627\u0641\u0647 \u0634\u062F.",
  "action": {
    "type": "add_gift",
    "args": {
      "title": "\u06A9\u06CC\u0628\u0648\u0631\u062F \u0645\u06A9\u0627\u0646\u06CC\u06A9\u0627\u0644 Keychron K2",
      "price": 4800000,
      "priority": "high",
      "notes": "\u0627\u0636\u0627\u0641\u0647 \u0634\u062F\u0647 \u062A\u0648\u0633\u0637 \u062F\u0633\u062A\u06CC\u0627\u0631 \u0647\u0648\u0634\u0645\u0646\u062F"
    }
  }
}` : `You are the "Giftino AI Assistant", a smart and interactive companion for Giftino, a premium gift registry and wishlist application.
You are fully trained on how the app works and can assist the user with wishlists, reserving/claiming gifts, friend networks, calendar countdowns, price comparisons, and database cloud synchronization.

How Giftino Works (Your Knowledge Base):
1. Create and Manage Wishlists:
   - Users can create wishlists for any occasion (Birthday, Wedding, Yalda, Nowruz, Graduation, Custom).
   - Wishes include Name, Price (Toman), Priority (high, medium, low), Purchase Link (e.g., Digikala), and Notes.

2. Surprise Reservation System (Claiming):
   - Friends can view wishlists and "Claim/Reserve" items they will buy to avoid duplicate gifts.
   - To preserve the surprise, the list owner CANNOT see who claimed which items on their own wishlist. Friends can see the claim status clearly.
   - Users manage their claims under the "Claimed" tab and can cancel reservations anytime.

3. Friends Social Network & SMS Invite:
   - Search and follow friends via username.
   - Invite loved ones by inputting their name and mobile number (sends a simulated SMS invitation link).
   - Mutual following unlocks viewing wishlists, calendar events, and claiming gifts.

4. Occasions Calendar:
   - Shows countdowns for user and friend milestones so users can claim and prepare gifts ahead of time.
   - Custom calendar occasions can be added directly.

5. Explore & Price Compare:
   - Offers curated gift ideas. Clicking the gold "Search & Compare Prices" button triggers live web-wide comparisons.

6. Auto Cloud Sync:
   - All actions automatically sync to Cloud SQL PostgreSQL and Firebase, ensuring secure data consistency across mobile and desktop.

User's state:
- Language: ${language}
- Active Tab: ${activeTab}
- User's wishlists: ${JSON.stringify(currentWishlists)}
- User profile: ${JSON.stringify(userProfile)}

Respond politely, creatively, and informatively.
You can trigger frontend actions by populating the "action" field.
You MUST respond ONLY with a clean JSON containing:
1. "text": Conversational reply in English.
2. "action": (optional) An action to perform. Supported:
   - "add_gift": to add a gift. Args: { "title": "...", "price": number or null, "priority": "high"|"medium"|"low", "notes": "..." }
   - "switch_tab": to navigate. Args: { "tab": "my-lists"|"friends"|"add-wish"|"explore"|"claimed"|"settings"|"calendar" }
   - "open_price_compare": to trigger search engine. Args: { "query": "..." }
   - "change_language": to switch language.

Example JSON output:
{
  "text": "I've opened the price comparison for Keychron Keyboard!",
  "action": {
    "type": "open_price_compare",
    "args": { "query": "Keychron mechanical keyboard" }
  }
}`;

    if (isSupport) {
      systemInstruction = isFa
        ? `شما پشتیبان هوشمند، صمیمی، دلسوز و حرفه‌ای اپلیکیشن «گیفتینو» (Giftino AI Support) هستید. وظیفه شما حل مشکلات فنی، پاسخ به سوالات کاربران درباره برنامه، و راهنمایی کامل آن‌هاست.
با لحنی فوق‌العاده محترمانه، صمیمی و دائم راهنما پاسخ دهید.
اگر کاربر مشکلی را گزارش کرد که نیاز به بررسی بیشتر دارد، یا با پاسخی فنی مشکلش حل نشد، و یا عصبانی و ناراضی بود، حتماً از او بخواهید که از طریق بخش پیام‌ها یا فرم تماس با ما، پیام بگذارد تا همکاران بخش پشتیبانی انسانی سریعاً بررسی کنند.

بسیار مهم: در انتهای پاسخ‌های ناموفق یا حل‌نشده، دقیقاً این جمله را به همراه داشته باشید:
«اگر این پاسخ مشکل شما را برطرف نکرد، لطفاً پیام خود را بگذارید تا کارشناسان پشتیبانی ما مستقیماً آن را بررسی کنند.»

شما فقط باید در قالب یک شیء JSON با فیلدهای زیر پاسخ دهید:
1. "text": پاسخ متنی شما به کاربر (سلیس، روان، صمیمی و محترمانه به زبان فارسی).
2. "action": (اختیاری) در صورتی که نیاز است کاربر به بخش دیگری هدایت شود، این فیلد را به صورت شیء زیر پر کنید:
   {"type": "switch_tab", "args": {"tab": "settings"}}

اطلاعات کاربر:
- نام: ${userProfile?.name || "کاربر عزیز"}
- ایمیل: ${userProfile?.email || "ثبت نشده"}
- تب فعال: ${activeTab}`
        : `You are the friendly, empathetic, and professional AI Support Specialist for the 'Giftino' app. Your job is to resolve technical issues, answer queries about how the app works, and guide the user.
If you cannot solve a problem, or if the user is frustrated, offer to let them leave a message for human support and specify:
"If this response didn't resolve your issue, please leave a message so our support team can inspect it directly."

You MUST respond ONLY with a clean JSON containing:
1. "text": Your conversational help response in English.
2. "action": (optional) An action to navigate the user. Supported action format:
   { "type": "switch_tab", "args": { "tab": "settings" } }

User Info:
- Name: ${userProfile?.name || "Valued User"}
- Email: ${userProfile?.email || "Not registered"}
- Active Tab: ${activeTab}`;
    }

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [message],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        temperature: 0.4
      }
    });
    let rawText = response.text.trim();
    if (rawText.startsWith("```")) {
      rawText = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    }
    const result = JSON.parse(rawText.trim());
    res.json({
      success: true,
      text: result.text,
      action: result.action || null,
      isMock: false
    });
  } catch (error) {
    console.error("Assistant API Live error, falling back:", error);
    let fallbackText = "";
    let fallbackAction = null;
    if (isSupport) {
      fallbackText = isFa
        ? "در حال حاضر سیستم پشتیبانی هوشمند در دسترس نیست. اگر این پاسخ مشکل شما را برطرف نکرد، لطفاً پیام خود را بگذارید تا کارشناسان پشتیبانی ما مستقیماً آن را بررسی کنند."
        : "The AI Support system is currently unavailable. If this response didn't resolve your issue, please leave a message so our support team can inspect it directly.";
    } else {
      const fallback = getLocalResponse(message, language, currentWishlists, activeTab, userProfile);
      fallbackText = fallback.text;
      fallbackAction = fallback.action;
    }
    res.json({
      success: true,
      text: fallbackText,
      action: fallbackAction,
      isMock: true
    });
  }
});


// ==========================================
// REAL GOOGLE CALENDAR SYNC ENDPOINT
// ==========================================
app.post("/api/sync-calendar", async (req: any, res: any) => {
  try {
    const { calendarId } = req.body || {};
    // Use the official Iranian Holidays Google Calendar by default
    const selectedId = calendarId || "en.iran#holiday@group.v.calendar.google.com";
    const encodedId = encodeURIComponent(selectedId);
    const icsUrl = `https://calendar.google.com/calendar/ical/${encodedId}/public/basic.ics`;

    console.log(`[Google Sync] Fetching public calendar: ${icsUrl}`);
    const fetchResponse = await fetch(icsUrl);
    if (!fetchResponse.ok) {
      throw new Error(`Failed to fetch Google Calendar feed: ${fetchResponse.statusText}`);
    }

    const icsText = await fetchResponse.text();
    const events: any[] = [];
    const lines = icsText.split(/\r?\n/);
    let currentEvent: any = null;

    for (const line of lines) {
      if (line.startsWith("BEGIN:VEVENT")) {
        currentEvent = {};
      } else if (line.startsWith("END:VEVENT")) {
        if (currentEvent && currentEvent.title && currentEvent.date) {
          events.push(currentEvent);
        }
        currentEvent = null;
      } else if (currentEvent) {
        if (line.startsWith("DTSTART")) {
          const parts = line.split(":");
          const dateVal = parts[1]?.trim();
          if (dateVal) {
            // format: YYYYMMDD
            const year = dateVal.substring(0, 4);
            const month = dateVal.substring(4, 6);
            const day = dateVal.substring(6, 8);
            currentEvent.date = `${year}-${month}-${day}`;
          }
        } else if (line.startsWith("SUMMARY")) {
          const parts = line.split(":");
          currentEvent.title = parts.slice(1).join(":").trim()
            .replace(/\\,/g, ",")
            .replace(/\\;/g, ";");
        } else if (line.startsWith("DESCRIPTION")) {
          const parts = line.split(":");
          currentEvent.notes = parts.slice(1).join(":").trim()
            .replace(/\\,/g, ",")
            .replace(/\\;/g, ";")
            .substring(0, 200);
        }
      }
    }

    // Sort chronologically
    events.sort((a, b) => a.date.localeCompare(b.date));

    // Filter events for the current year +/- 1 to keep it relevant
    const currentYearNum = new Date().getFullYear();
    const filteredEvents = events.filter(e => {
      const yr = parseInt(e.date.split("-")[0]);
      return yr >= currentYearNum - 1 && yr <= currentYearNum + 2;
    });

    return res.json({
      success: true,
      events: filteredEvents.slice(0, 80),
      source: "Google Calendar public API (ICS feed)"
    });
  } catch (error: any) {
    console.error("[Google Sync] Error parsing calendar:", error);
    
    // Return standard fallback holidays if fetch fails or is offline
    const currentYearNum = new Date().getFullYear();
    const fallbackHolidays = [
      { title: "Nowruz (جشن نوروز باستانی) 🌸", date: `${currentYearNum}-03-20`, notes: "Official Persian New year celebration" },
      { title: "Sizdah Bedar (سیزده بدر - روز طبیعت) 🌳", date: `${currentYearNum}-04-02`, notes: "Persian nature celebration day" },
      { title: "Charshanbe Suri (چهارشنبه سوری) 🔥", date: `${currentYearNum}-03-17`, notes: "Traditional fire festival" },
      { title: "National Girl's Day (روز دختر) 👧", date: `${currentYearNum}-04-18`, notes: "Celebrating girls in Iran" },
      { title: "Sepandarmazgan (سپندارمزگان - روز عشق) ❤️", date: `${currentYearNum}-02-18`, notes: "Ancient Persian Day of Love" },
      { title: "Mehregan Festival (جشن مهرگان) 🍂", date: `${currentYearNum}-10-02`, notes: "Ancient festival of Thanksgiving and Love" },
      { title: "Yalda Night (شب یلدا) 🍉", date: `${currentYearNum}-12-21`, notes: "Longest night of the year celebration" }
    ];

    return res.json({
      success: true,
      events: fallbackHolidays,
      isFallback: true,
      error: error.message
    });
  }
});


// Start express server with Vite middleware or static files
async function start() {
  const distPath = path.join(process.cwd(), "dist");
  const hasDist = fs.existsSync(path.join(distPath, "index.html"));

  // Force PROD mode if dist/index.html exists or NODE_ENV=production, unless explicitly NODE_ENV=development
  const isDev = process.env.NODE_ENV === "development" || (!hasDist && process.env.NODE_ENV !== "production");

  if (isDev) {
    console.log("Starting server in development mode (Vite middleware)...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in production mode (static files from dist)...");
    app.use(express.static(distPath, {
      maxAge: '1d',
      etag: true,
    }));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://0.0.0.0:${PORT} [${isDev ? "DEV" : "PROD"}]`);
  });

  server.on("error", (err: any) => {
    if (err.code === "EADDRINUSE") {
      console.error(`ERROR: Port ${PORT} is already in use. Please stop the other process or set a different PORT.`);
      process.exit(1);
    } else {
      console.error("Server startup error:", err);
    }
  });
}

start();
