import React from "react";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl" | "custom";
  customSizeClass?: string;
  showText?: boolean;
  language?: "fa" | "en";
}

export default function Logo({ className = "", size = "md", customSizeClass = "" }: LogoProps) {
  let textClass = "text-2xl";

  if (size === "sm") {
    textClass = "text-xl sm:text-2xl";
  } else if (size === "md") {
    textClass = "text-2xl sm:text-3xl";
  } else if (size === "lg") {
    textClass = "text-4xl sm:text-5xl";
  } else if (size === "xl") {
    textClass = "text-6xl sm:text-7xl";
  } else if (size === "custom" && customSizeClass) {
    textClass = customSizeClass;
  }

  return (
    <div className={`inline-flex items-center select-none ${className}`} dir="ltr">
      {/* Clean, Bold White English Text "giftino" like Giftful */}
      <span className={`font-fredoka font-black text-white tracking-tight leading-none ${textClass} drop-shadow-[0_2px_10px_rgba(255,255,255,0.15)]`}>
        giftino
      </span>
    </div>
  );
}


