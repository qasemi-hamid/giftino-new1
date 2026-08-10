import React, { useState } from "react";
import { Language } from "../types";
import { Sparkles, Brain, Loader2, Gift } from "lucide-react";
import Markdown from "react-markdown";

interface AIGiftAdvisorProps {
  language: Language;
}

export default function AIGiftAdvisor({ language }: AIGiftAdvisorProps) {
  const [ageGroup, setAgeGroup] = useState("young_adult");
  const [gender, setGender] = useState("female");
  const [relation, setRelation] = useState("friend");
  const [budget, setBudget] = useState("medium");
  const [interests, setInterests] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [advice, setAdvice] = useState<string | null>(null);

  const isFa = language === "fa";

  const ageGroups = [
    { value: "child", fa: "کودک (زیر ۱۲ سال)", en: "Child (Under 12)" },
    { value: "teen", fa: "نوجوان (۱۲ تا ۱۸ سال)", en: "Teenager (12-18)" },
    { value: "young_adult", fa: "جوان (۱۸ تا ۳۵ سال)", en: "Young Adult (18-35)" },
    { value: "middle_aged", fa: "میانسال (۳۵ تا ۶۰ سال)", en: "Middle-Aged (35-60)" },
    { value: "elderly", fa: "سالمند (بالای ۶۰ سال)", en: "Elderly (Over 60)" },
  ];

  const genders = [
    { value: "female", fa: "خانم", en: "Female" },
    { value: "male", fa: "آقا", en: "Male" },
    { value: "any", fa: "فرقی نمی‌کند / عمومی", en: "Any / Unisex" },
  ];

  const relations = [
    { value: "spouse", fa: "همسر / شریک عاطفی", en: "Spouse / Partner" },
    { value: "friend", fa: "دوست صمیمی", en: "Close Friend" },
    { value: "parent", fa: "پدر / مادر", en: "Parent" },
    { value: "colleague", fa: "همکار", en: "Colleague" },
    { value: "child", fa: "فرزند", en: "Child" },
    { value: "sibling", fa: "خواهر / برادر", en: "Sibling" },
  ];

  const budgets = [
    { value: "economy", fa: "اقتصادی و مینی‌مال", en: "Budget Friendly" },
    { value: "medium", fa: "متوسط و شیک", en: "Moderate / Standard" },
    { value: "premium", fa: "لوکس و باکیفیت", en: "Premium / Luxury" },
    { value: "unlimited", fa: "خاص و گران‌قیمت (بی‌محدودیت)", en: "Ultra Luxury" },
  ];

  const handleConsultAI = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAdvice(null);

    const activeAge = ageGroups.find((a) => a.value === ageGroup)?.[language] || ageGroup;
    const activeGender = genders.find((g) => g.value === gender)?.[language] || gender;
    const activeRelation = relations.find((r) => r.value === relation)?.[language] || relation;
    const activeBudget = budgets.find((b) => b.value === budget)?.[language] || budget;

    try {
      const response = await fetch("/api/gift-advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ageGroup: activeAge,
          gender: activeGender,
          relation: activeRelation,
          budget: activeBudget,
          interests: interests || (isFa ? "سرگرمی عمومی" : "General entertainment"),
          language,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setAdvice(data.advice);
      } else {
        throw new Error(data.error || "Failed to analyze");
      }
    } catch (err: any) {
      console.error(err);
      setAdvice(
        isFa 
          ? `### ❌ خطایی رخ داد\n\nمتاسفانه سرور هوش مصنوعی پاسخی ارسال نکرد. لطفاً مجدداً تلاش کنید.`
          : `### ❌ Connection Error\n\nFailed to receive a response from the AI Advisor node. Please try again.`
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      id="tour-ai-advisor"
      className="bg-zinc-900/60 border border-zinc-900 rounded-2xl p-5 space-y-5 transition-all"
      style={{ direction: isFa ? "rtl" : "ltr" }}
    >
      <div className="flex items-center gap-2.5 pb-3 border-b border-zinc-800">
        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-[#10b981] shrink-0">
          <Brain className="w-4.5 h-4.5" />
        </div>
        <div>
          <h3 className="text-[11px] font-black text-white uppercase tracking-wider">
            {isFa ? "مشاور هوشمند هدیه گیفتینو" : "Giftino Smart AI Advisor"}
          </h3>
          <p className="text-[9px] text-zinc-500 font-medium">
            {isFa ? "پیشنهاد خلاقانه هدیه با هوش مصنوعی جمینای" : "Powered by Google Gemini 3.5-Flash model"}
          </p>
        </div>
      </div>

      <form onSubmit={handleConsultAI} className="space-y-4">
        {/* Age Group */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-zinc-400 block uppercase">
            {isFa ? "رده سنی مخاطب" : "Recipient Age"}
          </label>
          <select
            value={ageGroup}
            onChange={(e) => setAgeGroup(e.target.value)}
            className="w-full text-xs bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white outline-none focus:border-[#10b981] transition-all"
          >
            {ageGroups.map((g) => (
              <option key={g.value} value={g.value}>
                {isFa ? g.fa : g.en}
              </option>
            ))}
          </select>
        </div>

        {/* Gender / Relation */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-400 block uppercase">
              {isFa ? "جنسیت" : "Gender"}
            </label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full text-xs bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white outline-none focus:border-[#10b981] transition-all"
            >
              {genders.map((g) => (
                <option key={g.value} value={g.value}>
                  {isFa ? g.fa : g.en}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-400 block uppercase">
              {isFa ? "نسبت با شما" : "Relation"}
            </label>
            <select
              value={relation}
              onChange={(e) => setRelation(e.target.value)}
              className="w-full text-xs bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white outline-none focus:border-[#10b981] transition-all"
            >
              {relations.map((r) => (
                <option key={r.value} value={r.value}>
                  {isFa ? r.fa : r.en}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Budget */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-zinc-400 block uppercase">
            {isFa ? "بودجه مالی" : "Budget Target"}
          </label>
          <select
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            className="w-full text-xs bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white outline-none focus:border-[#10b981] transition-all"
          >
            {budgets.map((b) => (
              <option key={b.value} value={b.value}>
                {isFa ? b.fa : b.en}
              </option>
            ))}
          </select>
        </div>

        {/* Interests */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-zinc-400 block uppercase">
            {isFa ? "علاقه‌مندی‌ها یا سرگرمی‌ها" : "Interests / Hobbies"}
          </label>
          <input
            type="text"
            placeholder={isFa ? "مثلاً: کتابخوانی، قهوه، ورزش" : "e.g., coffee, reading, fitness"}
            value={interests}
            onChange={(e) => setInterests(e.target.value)}
            className="w-full text-xs bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white outline-none focus:border-[#10b981] transition-all"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 bg-[#10b981] hover:bg-emerald-400 disabled:opacity-50 text-zinc-950 font-black text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm uppercase tracking-wider"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
              <span>{isFa ? "در حال هم‌فکری..." : "Consulting AI..."}</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 fill-zinc-950 text-zinc-950" />
              <span>{isFa ? "دریافت ایده از جمینای" : "Get AI Ideas"}</span>
            </>
          )}
        </button>
      </form>

      {/* Suggestion Output Area */}
      {advice && (
        <div className="border border-zinc-800 bg-zinc-950 rounded-xl p-4.5 relative overflow-hidden transition-all duration-300 max-h-[350px] overflow-y-auto scrollbar-thin">
          <div className="prose max-w-none text-xs leading-relaxed text-zinc-200 space-y-3 font-sans markdown-body">
            <Markdown>{advice}</Markdown>
          </div>
          <div className="absolute top-2 right-2 opacity-5">
            <Gift className="w-8 h-8 text-[#10b981]" />
          </div>
        </div>
      )}
    </div>
  );
}
