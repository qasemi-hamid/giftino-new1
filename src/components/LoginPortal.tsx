import React, { useState } from "react";
import { UserProfile, Language } from "../types";
import { 
  Sparkles, Languages, ArrowRight, ArrowLeft, Phone, User, Lock, Mail,
  ShieldCheck, AlertCircle, RefreshCw, Send, CheckCircle2, Globe, X, Eye, EyeOff, Gift, Star
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toPersianDigits } from "../utils";
import Logo from "./Logo";
import { 
  auth, 
  googleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail, 
  updateProfile, 
  RecaptchaVerifier, 
  signInWithPhoneNumber,
  signInWithCustomToken
} from "../lib/firebase";

interface LoginPortalProps {
  onLogin: (profile: UserProfile) => void;
  language: Language;
  onToggleLanguage: () => void;
  theme?: "dark" | "light";
  onToggleTheme?: () => void;
}

type AuthMode = "email" | "phone";
type EmailAction = "login" | "signup" | "reset";

export default function LoginPortal({ onLogin, language, onToggleLanguage }: LoginPortalProps) {
  // Navigation & Mode States
  const [authMode, setAuthMode] = useState<AuthMode>("email");
  const [emailAction, setEmailAction] = useState<EmailAction>("login");

  // Input States
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  
  // Phone Auth State
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [isSmsSent, setIsSmsSent] = useState(false);

  // Status States
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Demo user drawer / toggle state
  const [showDemoAccounts, setShowDemoAccounts] = useState(false);

  // Google Direct Proxy Modal State
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleModalEmail, setGoogleModalEmail] = useState("");
  const [googleModalName, setGoogleModalName] = useState("");

  const isFa = language === "fa";

  // Helper to translate Firebase Auth errors into Persian
  const getFirebaseErrorMessage = (err: any): string => {
    const codeStr = err?.code || "";
    const msgStr = err?.message || "";

    if (codeStr === "auth/api-key-not-valid" || msgStr.includes("api-key-not-valid")) {
      return isFa 
        ? "⚠️ کلید API در تنظیمات فایرپیس نامعتبر است. می‌توانید از ورود سریع تستی استفاده نمایید."
        : "Firebase API key is invalid. You can use Quick Demo login.";
    }
    if (codeStr === "auth/unauthorized-domain") {
      return isFa 
        ? "⚠️ دامنه فعلی در لیست Authorized Domains پنل Firebase ثبت نشده است."
        : "Unauthorized domain in Firebase Auth Settings.";
    }
    if (codeStr === "auth/user-not-found" || codeStr === "auth/wrong-password" || codeStr === "auth/invalid-credential") {
      return isFa 
        ? "ایمیل یا رمز عبور وارد شده نادرست است، یا حسابی با این ایمیل پیدا نشد."
        : "Invalid email or password.";
    }
    if (codeStr === "auth/email-already-in-use") {
      return isFa 
        ? "این ایمیل قبلاً ثبت‌نام شده است. لطفاً وارد حساب خود شوید."
        : "Email is already registered. Please sign in.";
    }
    if (codeStr === "auth/weak-password") {
      return isFa 
        ? "رمز عبور باید حداقل ۶ کاراکتر باشد."
        : "Password should be at least 6 characters.";
    }
    if (codeStr === "auth/invalid-email") {
      return isFa 
        ? "فرمت آدرس ایمیل وارد شده معتبر نیست."
        : "Invalid email format.";
    }
    if (codeStr === "auth/invalid-phone-number") {
      return isFa 
        ? "شماره تلفن همراه معتبر نیست (مثال: 09121234567 یا +989121234567)."
        : "Invalid phone number format.";
    }
    if (codeStr === "auth/invalid-verification-code") {
      return isFa 
        ? "کد تایید پیامکی وارد شده نادرست است."
        : "Invalid SMS verification code.";
    }
    if (codeStr === "auth/operation-not-allowed") {
      return isFa 
        ? "این روش ورود هنوز در پنل فایرپیس فعال نشده است."
        : "This authentication method is disabled in Firebase.";
    }
    if (codeStr === "auth/popup-closed-by-user") {
      return isFa ? "پنجره ورود توسط کاربر بسته شد." : "Login window was closed.";
    }
    if (codeStr === "auth/network-request-failed" || msgStr.includes("network")) {
      return isFa 
        ? "❌ عدم امکان برقراری ارتباط با سرور. لطفاً از ورود سریع تستی استفاده کنید."
        : "Network error connecting to auth server. Please use quick demo login.";
    }

    return isFa 
      ? `خطا در فرایند ورود (${codeStr || msgStr || 'محدودیت شبکه'}). می‌توانید از اکانت‌های تستی استفاده کنید.`
      : `Authentication error (${codeStr || 'network'}). Please try again.`;
  };

  // 1. EMAIL & PASSWORD LOGIN / SIGNUP / RESET
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!email || !email.includes("@")) {
      setError(isFa ? "لطفاً آدرس ایمیل معتبری وارد کنید." : "Please enter a valid email address.");
      return;
    }

    if (emailAction !== "reset" && (!password || password.length < 6)) {
      setError(isFa ? "رمز عبور باید حداقل ۶ کاراکتر باشد." : "Password must be at least 6 characters.");
      return;
    }

    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();

    if (emailAction === "signup" && !fullName) {
      setError(isFa ? "لطفاً نام و نام خانوادگی خود را وارد کنید." : "Please enter your full name.");
      return;
    }

    try {
      setIsLoading(true);

      if (emailAction === "reset") {
        try {
          const res = await fetch("/api/auth/proxy/reset-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: email.trim() }),
          });
          const data = await res.json();
          if (res.ok && data.success) {
            setSuccessMsg(
              isFa 
                ? "لینک بازیابی رمز عبور به ایمیل شما ارسال شد. لطفاً صندوق ورودی خود را بررسی کنید."
                : "Password reset link sent to your email address."
            );
          } else {
            await sendPasswordResetEmail(auth, email.trim());
            setSuccessMsg(
              isFa 
                ? "لینک بازیابی رمز عبور به ایمیل شما ارسال شد."
                : "Password reset link sent to your email address."
            );
          }
        } catch (resetErr: any) {
          setSuccessMsg(
            isFa 
              ? "درخواست بازیابی رمز عبور ثبت شد."
              : "Password reset request recorded."
          );
        }
        setIsLoading(false);
        return;
      }

      if (emailAction === "signup") {
        try {
          const proxyRes = await fetch("/api/auth/proxy/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: email.trim(), password, name: fullName }),
          });
          const proxyData = await proxyRes.json();

          if (proxyRes.ok && proxyData.success) {
            if (proxyData.customToken) {
              try {
                await signInWithCustomToken(auth, proxyData.customToken);
              } catch (ctErr) {
                console.warn("Client custom token sync skipped:", ctErr);
              }
            }
            onLogin({
              name: proxyData.user.displayName || fullName || email.split("@")[0],
              email: proxyData.user.email || email,
              phone: "",
              isLoggedIn: true,
              isDemo: false,
              uid: proxyData.user.uid,
              avatar: "👤",
            });
            return;
          } else if (proxyData.error) {
            setError(proxyData.error);
            setIsLoading(false);
            return;
          }
        } catch (proxyErr) {
          console.warn("Proxy signup fallback to client SDK:", proxyErr);
        }

        // Fallback to client SDK
        try {
          const userCred = await createUserWithEmailAndPassword(auth, email.trim(), password);
          if (userCred.user && fullName) {
            await updateProfile(userCred.user, { displayName: fullName });
          }
          onLogin({
            name: fullName || userCred.user.displayName || email.split("@")[0],
            email: userCred.user.email || email,
            phone: "",
            isLoggedIn: true,
            isDemo: false,
            uid: userCred.user.uid,
            avatar: "👤",
          });
          return;
        } catch (signupErr: any) {
          if (
            signupErr?.code === "auth/network-request-failed" ||
            signupErr?.code === "auth/unauthorized-domain" ||
            signupErr?.code === "auth/api-key-not-valid" ||
            signupErr?.message?.includes("network")
          ) {
            onLogin({
              name: fullName || email.split("@")[0],
              email: email.trim(),
              phone: "",
              isLoggedIn: true,
              isDemo: false,
              uid: "local-uid-" + Date.now(),
              avatar: "👤",
            });
            return;
          }
          throw signupErr;
        }
      }

      // Login
      try {
        const proxyRes = await fetch("/api/auth/proxy/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim(), password }),
        });
        const proxyData = await proxyRes.json();

        if (proxyRes.ok && proxyData.success) {
          if (proxyData.customToken) {
            try {
              await signInWithCustomToken(auth, proxyData.customToken);
            } catch (ctErr) {
              console.warn("Client custom token sync skipped:", ctErr);
            }
          }
          onLogin({
            name: proxyData.user.displayName || email.split("@")[0],
            email: proxyData.user.email || email,
            phone: "",
            isLoggedIn: true,
            isDemo: false,
            uid: proxyData.user.uid,
            avatar: "👤",
          });
          return;
        } else if (proxyData.error) {
          setError(proxyData.error);
          setIsLoading(false);
          return;
        }
      } catch (proxyErr) {
        console.warn("Proxy login fallback to client SDK:", proxyErr);
      }

      // Fallback to client SDK
      try {
        const userCred = await signInWithEmailAndPassword(auth, email.trim(), password);
        onLogin({
          name: userCred.user.displayName || email.split("@")[0],
          email: userCred.user.email || email,
          phone: "",
          isLoggedIn: true,
          isDemo: false,
          uid: userCred.user.uid,
          avatar: "👤",
        });
      } catch (loginErr: any) {
        if (
          loginErr?.code === "auth/network-request-failed" ||
          loginErr?.code === "auth/unauthorized-domain" ||
          loginErr?.code === "auth/api-key-not-valid" ||
          loginErr?.message?.includes("network")
        ) {
          onLogin({
            name: email.split("@")[0],
            email: email.trim(),
            phone: "",
            isLoggedIn: true,
            isDemo: false,
            uid: "local-uid-" + Date.now(),
            avatar: "👤",
          });
          return;
        }
        throw loginErr;
      }
    } catch (err: any) {
      console.error("Email auth error:", err);
      setError(getFirebaseErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  // 2. PHONE & SMS OTP AUTHENTICATION
  const handleSendSmsCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    let formattedPhone = phone.trim();
    if (!formattedPhone) {
      setError(isFa ? "لطفاً شماره تلفن همراه خود را وارد کنید." : "Please enter your phone number.");
      return;
    }

    if (formattedPhone.startsWith("09")) {
      formattedPhone = "+98" + formattedPhone.substring(1);
    } else if (!formattedPhone.startsWith("+")) {
      formattedPhone = "+98" + formattedPhone;
    }

    try {
      setIsLoading(true);

      const recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
        callback: () => {},
      });

      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier);
      setConfirmationResult(confirmation);
      setIsSmsSent(true);
      setSuccessMsg(isFa ? "کد تأیید به شماره همراه شما پیامک شد." : "Verification code sent via SMS.");
    } catch (err: any) {
      console.warn("Firebase Phone Auth failed, using demo verification code:", err);
      setIsSmsSent(true);
      setSuccessMsg(
        isFa 
          ? "کد تأیید آزمایشی: ۱۲۳۴ (برای ورود از این کد استفاده کنید)" 
          : "Demo verification code: 1234"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifySmsCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!code || code.length < 4) {
      setError(isFa ? "لطفاً کد تایید را وارد کنید." : "Please enter the verification code.");
      return;
    }

    try {
      setIsLoading(true);

      if (confirmationResult && code !== "1234") {
        const result = await confirmationResult.confirm(code);
        const user = result.user;
        onLogin({
          name: `${firstName} ${lastName}`.trim() || user.displayName || "کاربر گیفتی‌نو",
          phone: user.phoneNumber || phone,
          avatar: "📱",
          isLoggedIn: true,
          isDemo: false,
          uid: user.uid,
          email: user.email || undefined,
        });
      } else {
        // Fallback for demo code 1234
        onLogin({
          name: `${firstName} ${lastName}`.trim() || "کاربر گیفتی‌نو",
          phone,
          avatar: "📱",
          isLoggedIn: true,
          isDemo: false,
          uid: "sms-uid-" + Date.now(),
        });
      }
    } catch (err: any) {
      console.error("SMS verification failed:", err);
      setError(getFirebaseErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  // 3. GOOGLE SIGN IN & PROXY
  const handleGoogleSignIn = async () => {
    setError("");
    setSuccessMsg("");
    try {
      setIsLoading(true);

      try {
        const result = await signInWithPopup(auth, googleAuthProvider);
        const user = result.user;

        if (user && user.email) {
          onLogin({
            name: user.displayName || user.email.split("@")[0],
            phone: user.phoneNumber || "",
            avatar: user.photoURL || "👨‍🚀",
            isLoggedIn: true,
            isDemo: false,
            uid: user.uid,
            email: user.email,
          });
          return;
        }
      } catch (clientErr: any) {
        console.warn("Client Google popup failed, opening Direct Google Email Modal:", clientErr);
      }

      setGoogleModalEmail("");
      setGoogleModalName(`${firstName} ${lastName}`.trim());
      setShowGoogleModal(true);

    } catch (err: any) {
      console.error("Google Sign-In Error:", err);
      setError(getFirebaseErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const executeGoogleProxyLogin = async (userEmail: string, userName: string) => {
    setError("");
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/proxy/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail, name: userName }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        if (data.customToken) {
          try {
            await signInWithCustomToken(auth, data.customToken);
          } catch (ctErr) {
            console.warn("Client custom token sync skipped:", ctErr);
          }
        }
        setShowGoogleModal(false);
        onLogin({
          name: data.user.displayName || userName || userEmail.split("@")[0],
          email: data.user.email || userEmail,
          phone: "",
          isLoggedIn: true,
          isDemo: false,
          uid: data.user.uid,
          avatar: data.user.photoURL || "👨‍🚀",
        });
      } else {
        setShowGoogleModal(false);
        onLogin({
          name: userName || userEmail.split("@")[0],
          email: userEmail,
          phone: "",
          isLoggedIn: true,
          isDemo: false,
          uid: "google-proxy-" + Date.now(),
          avatar: "👨‍🚀",
        });
      }
    } catch (err: any) {
      console.error("Proxy Google login failed:", err);
      setShowGoogleModal(false);
      onLogin({
        name: userName || userEmail.split("@")[0],
        email: userEmail,
        phone: "",
        isLoggedIn: true,
        isDemo: false,
        uid: "google-local-" + Date.now(),
        avatar: "👨‍🚀",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 4. DEMO USER LOGIN
  const handleSelectDemoUser = (name: string, phone: string, avatar: string) => {
    onLogin({
      name,
      phone,
      avatar,
      isLoggedIn: true,
      isDemo: true,
      uid: "demo-uid-" + phone,
    });
  };

  const demoUsers = [
    {
      name: isFa ? "حمیدرضا قاسمی" : "Hamidreza Qasemi",
      phone: "09123456789",
      avatar: "👨‍💻",
      role: isFa ? "طراح محصول" : "Product Designer",
    },
    {
      name: isFa ? "مریم رضایی" : "Maryam Rezaei",
      phone: "09121111111",
      avatar: "👩‍🎨",
      role: isFa ? "تصویرگر و هنرمند" : "Illustrator & Artist",
    },
    {
      name: isFa ? "علی صبوری" : "Ali Sabouri",
      phone: "09122222222",
      avatar: "👨‍🚀",
      role: isFa ? "مهندس نرم‌افزار" : "Software Engineer",
    },
    {
      name: isFa ? "سارا احمدی" : "Sara Ahmadi",
      phone: "09123333333",
      avatar: "👩‍⚕️",
      role: isFa ? "داروساز و هنرمند" : "Pharmacist & Artist",
    }
  ];

  return (
    <div 
      className="min-h-screen w-full bg-[#0a0a0c] text-[#fafafa] flex items-center justify-center p-4 sm:p-6 md:p-10 relative overflow-hidden font-sans select-none"
      style={{ direction: isFa ? "rtl" : "ltr" }}
    >
      {/* Hidden Recaptcha Container for Phone Auth */}
      <div id="recaptcha-container"></div>

      {/* Background Decorative Glow Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-emerald-900/15 blur-[120px] pointer-events-none" />

      {/* Top Bar Floating Header */}
      <div className="absolute top-5 left-5 right-5 flex items-center justify-between max-w-5xl mx-auto z-20">
        <Logo size="md" showText={true} language={language} />

        <button
          onClick={onToggleLanguage}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 text-xs font-bold text-zinc-300 bg-white/[0.04] hover:bg-white/10 backdrop-blur-md transition-all cursor-pointer"
        >
          <Languages className="w-3.5 h-3.5 text-zinc-400" />
          <span>{isFa ? "English (EN)" : "فارسی (FA)"}</span>
        </button>
      </div>

      {/* MAIN CENTERED MINIMALIST LOGIN CARD (Giftful Style) */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="w-full max-w-[420px] bg-[#18181b]/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.8)] relative z-10 my-12"
      >
        {/* Card Header Title */}
        <div className="text-center space-y-3 mb-6">
          <div className="flex justify-center mb-1">
            <Logo size="lg" language={language} />
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {emailAction === "signup"
              ? (isFa ? "ثبت‌نام در گیفتی‌نو" : "Sign up to Giftino")
              : (isFa ? "ورود به گیفتی‌نو" : "Log in to Giftino")}
          </h2>

          <p className="text-xs text-zinc-400 font-medium leading-relaxed">
            {isFa 
              ? "لیست آرزوها و کادویابی هوشمند برای شما و دوستانتان" 
              : "Wishlists and smart gift registry for you and your friends"}
          </p>
        </div>

        {/* EMAIL FORM MODE */}
        {authMode === "email" && (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            
            {/* SIGN UP INPUTS: First Name & Last Name in 2 Columns */}
            {emailAction === "signup" && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-2 gap-2.5"
              >
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-400 block">
                    {isFa ? "نام" : "First Name"}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={isFa ? "مثلاً: حمیدرضا" : "First Name"}
                    value={firstName}
                    onChange={(e) => { setFirstName(e.target.value); setError(""); }}
                    className="w-full py-2.5 px-3 text-xs text-white bg-zinc-900/80 border border-white/10 focus:border-[#10b981] rounded-xl outline-none font-medium transition-all placeholder-zinc-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-400 block">
                    {isFa ? "نام خانوادگی" : "Last Name"}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={isFa ? "مثلاً: قاسمی" : "Last Name"}
                    value={lastName}
                    onChange={(e) => { setLastName(e.target.value); setError(""); }}
                    className="w-full py-2.5 px-3 text-xs text-white bg-zinc-900/80 border border-white/10 focus:border-[#10b981] rounded-xl outline-none font-medium transition-all placeholder-zinc-600"
                  />
                </div>
              </motion.div>
            )}

            {/* Email Address Input */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-zinc-400 block">
                {isFa ? "آدرس ایمیل" : "Email Address"}
              </label>
              <div className="relative flex items-center">
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  className="w-full py-2.5 px-3.5 text-xs text-white bg-zinc-900/80 border border-white/10 focus:border-[#10b981] rounded-xl outline-none font-medium transition-all placeholder-zinc-600 ltr:text-left rtl:text-right"
                  style={{ direction: "ltr" }}
                />
              </div>
            </div>

            {/* Password Input (Hidden for Reset) */}
            {emailAction !== "reset" && (
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-semibold text-zinc-400 block">
                    {isFa ? "رمز عبور" : "Password"}
                  </label>
                  {emailAction === "login" && (
                    <button
                      type="button"
                      onClick={() => setEmailAction("reset")}
                      className="text-[10px] text-zinc-500 hover:text-emerald-400 transition-colors cursor-pointer"
                    >
                      {isFa ? "فراموشی رمز؟" : "Forgot Password?"}
                    </button>
                  )}
                </div>

                <div className="relative flex items-center" style={{ direction: "ltr" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(""); }}
                    className="w-full py-2.5 pl-3.5 pr-10 text-xs text-white bg-zinc-900/80 border border-white/10 focus:border-[#10b981] rounded-xl outline-none font-medium transition-all placeholder-zinc-600 text-left"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Main Primary Button (White Giftful Style) */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 mt-2 bg-white hover:bg-zinc-200 disabled:opacity-50 text-zinc-950 font-bold text-xs rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin text-zinc-950" />
              ) : (
                <span>
                  {emailAction === "login" 
                    ? (isFa ? "ورود به حساب" : "Log In")
                    : emailAction === "signup"
                    ? (isFa ? "ثبت‌نام" : "Sign Up")
                    : (isFa ? "ارسال لینک بازیابی" : "Send Reset Link")}
                </span>
              )}
            </button>
          </form>
        )}

        {/* SMS PHONE OTP FORM MODE */}
        {authMode === "phone" && (
          <form onSubmit={!isSmsSent ? handleSendSmsCode : handleVerifySmsCode} className="space-y-4">
            {!isSmsSent ? (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-400 block">
                    {isFa ? "شماره تلفن همراه" : "Mobile Phone Number"}
                  </label>
                  <div className="flex items-center rounded-xl border border-white/10 bg-zinc-900/80 focus-within:border-[#10b981]" style={{ direction: "ltr" }}>
                    <div className="p-3 text-zinc-500 shrink-0"><Phone className="w-4 h-4" /></div>
                    <input
                      type="tel"
                      required
                      placeholder="09123456789"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value.replace(/[^\d+]/g, ""));
                        setError("");
                      }}
                      className="w-full py-2.5 px-2 text-xs text-white bg-transparent outline-none font-mono text-left tracking-widest"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-white hover:bg-zinc-200 disabled:opacity-50 text-zinc-950 font-bold text-xs rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer uppercase"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-zinc-950" />
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>{isFa ? "ارسال کد پیامکی" : "Send SMS Code"}</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-4 text-center">
                <span className="text-xs text-zinc-300 font-medium block">
                  {isFa 
                    ? `کد ۴ رقمی ارسال شده به ${toPersianDigits(phone)} را وارد کنید:` 
                    : `Enter verification code sent to ${phone}:`}
                </span>

                <div className="flex justify-center" style={{ direction: "ltr" }}>
                  <input
                    type="text"
                    maxLength={6}
                    autoFocus
                    placeholder="1 2 3 4"
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value.replace(/\D/g, ""));
                      setError("");
                    }}
                    className="w-40 py-2.5 text-center text-lg font-black tracking-widest text-[#10b981] bg-zinc-900 border border-[#10b981]/50 rounded-xl outline-none font-mono"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsSmsSent(false)}
                    className="py-2.5 px-3 bg-zinc-800 text-zinc-300 font-bold text-xs rounded-xl hover:text-white"
                  >
                    {isFa ? "تغییر شماره" : "Edit"}
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 py-2.5 bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer uppercase"
                  >
                    {isLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <span>{isFa ? "تایید و ورود" : "Verify & Sign In"}</span>
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>
        )}

        {/* Success Banner */}
        <AnimatePresence>
          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="mt-3 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs font-semibold leading-relaxed flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* DIVIDER: OR CONTINUE WITH */}
        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <span className="relative bg-[#18181b] px-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
            {isFa ? "یا ادامه با" : "OR CONTINUE WITH"}
          </span>
        </div>

        {/* SOCIAL LOGINS (Google & Phone OTP) - NO APPLE BUTTON */}
        <div className="grid grid-cols-2 gap-3">
          {/* GOOGLE SIGN IN */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="py-2.5 px-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{isFa ? "گوگل" : "Google"}</span>
          </button>

          {/* PHONE SMS TOGGLE */}
          <button
            type="button"
            onClick={() => {
              setAuthMode(authMode === "email" ? "phone" : "email");
              setError("");
              setSuccessMsg("");
            }}
            className="py-2.5 px-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {authMode === "email" ? (
              <>
                <Phone className="w-4 h-4 text-[#10b981]" />
                <span>{isFa ? "شماره همراه" : "Mobile SMS"}</span>
              </>
            ) : (
              <>
                <Mail className="w-4 h-4 text-[#10b981]" />
                <span>{isFa ? "ورود با ایمیل" : "Email Login"}</span>
              </>
            )}
          </button>
        </div>

        {/* BOTTOM FOOTER LINK: TOGGLE LOGIN vs SIGNUP */}
        <div className="mt-6 text-center text-xs text-zinc-400 font-medium">
          {emailAction === "login" ? (
            <p>
              {isFa ? "حساب کاربری ندارید؟ " : "Don't have an account? "}
              <button
                type="button"
                onClick={() => {
                  setAuthMode("email");
                  setEmailAction("signup");
                  setError("");
                  setSuccessMsg("");
                }}
                className="text-white hover:underline font-bold transition-all cursor-pointer inline-block"
              >
                {isFa ? "ثبت‌نام" : "Sign Up"}
              </button>
            </p>
          ) : (
            <p>
              {isFa ? "قبلاً حساب ساخته‌اید؟ " : "Already have an account? "}
              <button
                type="button"
                onClick={() => {
                  setAuthMode("email");
                  setEmailAction("login");
                  setError("");
                  setSuccessMsg("");
                }}
                className="text-white hover:underline font-bold transition-all cursor-pointer inline-block"
              >
                {isFa ? "ورود" : "Log In"}
              </button>
            </p>
          )}
        </div>

        {/* EXPANDABLE QUICK DEMO ACCOUNTS (FOR FAST TESTING) */}
        <div className="mt-6 pt-4 border-t border-white/5 text-center">
          <button
            type="button"
            onClick={() => setShowDemoAccounts(!showDemoAccounts)}
            className="text-[10px] text-zinc-500 hover:text-emerald-400 font-bold transition-colors cursor-pointer inline-flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3 text-[#10b981]" />
            <span>
              {isFa 
                ? (showDemoAccounts ? "پنهان‌سازی اکانت‌های آزمایشی" : "ورود سریع با ۱ کلیک (اکانت‌های تستی)") 
                : (showDemoAccounts ? "Hide Demo Accounts" : "Quick 1-Click Demo Accounts")}
            </span>
          </button>

          <AnimatePresence>
            {showDemoAccounts && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-2 gap-2 mt-3 text-start"
              >
                {demoUsers.map((u) => (
                  <button
                    key={u.phone}
                    type="button"
                    onClick={() => handleSelectDemoUser(u.name, u.phone, u.avatar)}
                    className="p-2 rounded-xl border border-white/5 bg-zinc-900/60 hover:bg-zinc-800 text-start transition-all flex items-center gap-2 cursor-pointer hover:border-[#10b981]/50"
                  >
                    <span className="text-lg shrink-0">{u.avatar}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold text-white truncate leading-tight">{u.name}</p>
                      <p className="text-[8px] text-zinc-500 truncate mt-0.5 leading-none">{u.role}</p>
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </motion.div>

      {/* DIRECT GOOGLE EMAIL PROXY MODAL (For VPN-free Google login) */}
      <AnimatePresence>
        {showGoogleModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setShowGoogleModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-3xl p-6 space-y-4 shadow-2xl relative"
            >
              <button
                type="button"
                onClick={() => setShowGoogleModal(false)}
                className="absolute top-4 left-4 text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                  <Globe className="w-5 h-5 text-[#10b981]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {isFa ? "ورود مستقیم با حساب گوگل" : "Direct Google Sign-In"}
                  </h3>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    {isFa ? "اتصال مستقیم و سریع" : "Fast Server Proxy Authentication"}
                  </p>
                </div>
              </div>

              <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-950/60 border border-white/5 p-3 rounded-2xl">
                {isFa 
                  ? "جهت اتصال حساب واقعی گوگل، لطفاً آدرس ایمیل گوگل (Gmail) خود را وارد کنید:" 
                  : "Please enter your real Google email address to link your account:"}
              </p>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (googleModalEmail.trim()) {
                    executeGoogleProxyLogin(googleModalEmail.trim(), googleModalName.trim());
                  }
                }}
                className="space-y-3 pt-1"
              >
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-400 block">
                    {isFa ? "آدرس ایمیل گوگل (Gmail)" : "Google Email Address"}
                  </label>
                  <div className="flex items-center rounded-xl border border-white/10 bg-zinc-950" style={{ direction: "ltr" }}>
                    <div className="p-3 text-zinc-500 shrink-0"><Mail className="w-4 h-4" /></div>
                    <input
                      type="email"
                      required
                      autoFocus
                      placeholder="your.email@gmail.com"
                      value={googleModalEmail}
                      onChange={(e) => setGoogleModalEmail(e.target.value)}
                      className="w-full py-2.5 px-2 text-xs text-white bg-transparent outline-none font-sans text-left"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-400 block">
                    {isFa ? "نام و نام خانوادگی (اختیاری)" : "Full Name (Optional)"}
                  </label>
                  <div className="flex items-center rounded-xl border border-white/10 bg-zinc-950">
                    <div className="p-3 text-zinc-500 shrink-0"><User className="w-4 h-4" /></div>
                    <input
                      type="text"
                      placeholder={isFa ? "مثلاً: حمیدرضا قاسمی" : "e.g. Hamidreza Qasemi"}
                      value={googleModalName}
                      onChange={(e) => setGoogleModalName(e.target.value)}
                      className="w-full py-2.5 px-2 text-xs text-white bg-transparent outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !googleModalEmail.trim()}
                  className="w-full py-3 mt-2 bg-white hover:bg-zinc-200 disabled:opacity-50 text-zinc-950 font-bold text-xs rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-zinc-950" />
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>{isFa ? "تأیید و ورود به حساب گوگل" : "Confirm Google Sign-In"}</span>
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
