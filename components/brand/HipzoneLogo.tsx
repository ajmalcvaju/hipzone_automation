import React from "react";

interface HipzoneLogoProps {
  className?: string;
  iconOnly?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  light?: boolean;
}

export function HipzoneLogo({
  className = "",
  iconOnly = false,
  size = "md",
  light = false,
}: HipzoneLogoProps) {
  const iconSizes = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-10 h-10",
    xl: "w-14 h-14",
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
    xl: "text-4xl",
  };

  const subSizes = {
    sm: "text-[9px] tracking-[0.2em]",
    md: "text-[11px] tracking-[0.25em]",
    lg: "text-xs tracking-[0.3em]",
    xl: "text-sm tracking-[0.35em]",
  };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Hipzone Geometric Icon */}
      <div className={`relative flex items-center justify-center ${iconSizes[size]}`}>
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full fill-none stroke-current"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer isometric smart grid cube / nodes */}
          <rect
            x="22"
            y="22"
            width="46"
            height="46"
            rx="5"
            className="stroke-cyan-400"
            strokeWidth="5"
            strokeDasharray="none"
          />
          <rect
            x="36"
            y="36"
            width="46"
            height="46"
            rx="5"
            className="stroke-cyan-500 opacity-80"
            strokeWidth="4"
          />
          {/* Circuit connection nodes */}
          <circle cx="22" cy="22" r="4.5" className="fill-cyan-400 stroke-none" />
          <circle cx="68" cy="22" r="4" className="fill-cyan-300 stroke-none" />
          <circle cx="22" cy="68" r="4" className="fill-cyan-300 stroke-none" />
          <circle cx="82" cy="36" r="4" className="fill-cyan-400 stroke-none" />
          <circle cx="82" cy="82" r="4.5" className="fill-cyan-400 stroke-none" />
          <path
            d="M 45 45 L 59 59"
            className="stroke-cyan-300"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {!iconOnly && (
        <div className="flex flex-col leading-none">
          <span
            className={`font-black tracking-wider ${textSizes[size]} ${
              light ? "text-white" : "text-slate-900 dark:text-white"
            }`}
          >
            HIPZONE
          </span>
          <span
            className={`font-bold text-cyan-500 uppercase ${subSizes[size]}`}
          >
            AUTOMATION
          </span>
        </div>
      )}
    </div>
  );
}
