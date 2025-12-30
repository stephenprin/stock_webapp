"use client";

import { cn } from "@/lib/utils/utils";

type LogoWordmarkProps = {
  className?: string;
};

export const LogoWordmark = ({ className }: LogoWordmarkProps) => {
  const textColor = className?.includes("text-gray-900") ? "text-gray-900" : "text-white";
  
  return (
    <span
      className={cn("inline-flex flex-col relative leading-none", className)}
    >
      <span className={cn("text-2xl font-semibold tracking-tight", textColor)}>
        Stock tracker
      </span>
      <svg
        aria-hidden="true"
        viewBox="0 0 140 20"
        className="pointer-events-none mt-1 h-3 w-full"
      >
        <path
          d="M2 12 C 20 4, 35 18, 55 10 S 95 4, 138 12"
          fill="none"
          stroke="#6ee7b7"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
};
