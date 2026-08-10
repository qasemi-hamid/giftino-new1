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
    textClass = "text-xl";
  } else if (size === "md") {
    textClass = "text-3xl";
  } else if (size === "lg") {
    textClass = "text-5xl";
  } else if (size === "xl") {
    textClass = "text-7xl";
  } else if (size === "custom" && customSizeClass) {
    textClass = customSizeClass;
  }

  return (
    <div className={`inline-flex items-center select-none ${className}`}>
      <span className={`font-fredoka font-bold text-white tracking-normal leading-none ${textClass}`}>
        giftino
      </span>
    </div>
  );
}
