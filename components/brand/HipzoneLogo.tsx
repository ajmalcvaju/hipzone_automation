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
  const heights = {
    sm: "h-7",
    md: "h-9",
    lg: "h-11",
    xl: "h-14",
  };

  if (iconOnly) {
    return (
      <div className={`inline-flex items-center select-none ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icon.png"
          alt="Hipzone Icon"
          className={`${heights[size]} w-auto object-contain`}
        />
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center select-none ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/hipzone-logo.png"
        alt="Hipzone Automation"
        className={`${heights[size]} w-auto object-contain block`}
      />
    </div>
  );
}
