import * as React from "react";
import { cn } from "@/lib/utils";

interface UniversityCrestProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
  variant?: "full" | "monochrome" | "white";
}

export const UniversityCrest: React.FC<UniversityCrestProps> = ({
  size = 40,
  className,
  variant = "full",
  ...props
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0 select-none", className)}
      aria-label="Dire Dawa University Seal"
      role="img"
      {...props}
    >
      <defs>
        <linearGradient id="dduNavyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0E2A4D" />
          <stop offset="100%" stopColor="#08182D" />
        </linearGradient>
        <linearGradient id="dduGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
        <linearGradient id="dduTealGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#14B8A6" />
          <stop offset="100%" stopColor="#0D9488" />
        </linearGradient>
      </defs>

      {/* Outer Circle Ring */}
      <circle
        cx="50"
        cy="50"
        r="47"
        fill={variant === "white" ? "rgba(255,255,255,0.08)" : "url(#dduNavyGrad)"}
        stroke={variant === "white" ? "#93C5FD" : "#D97706"}
        strokeWidth="2.5"
      />
      <circle
        cx="50"
        cy="50"
        r="42"
        fill="none"
        stroke={variant === "white" ? "rgba(255,255,255,0.4)" : "#F59E0B"}
        strokeWidth="0.8"
        strokeDasharray="2 1.5"
      />

      {/* Laurel Wreath decorative arcs */}
      <path
        d="M20 54 C18 42 24 30 35 23 C34 27 36 32 39 35 C32 40 28 47 28 55 Z"
        fill={variant === "white" ? "rgba(255,255,255,0.6)" : "url(#dduGoldGrad)"}
        opacity="0.9"
      />
      <path
        d="M80 54 C82 42 76 30 65 23 C66 27 64 32 61 35 C68 40 72 47 72 55 Z"
        fill={variant === "white" ? "rgba(255,255,255,0.6)" : "url(#dduGoldGrad)"}
        opacity="0.9"
      />

      {/* Central Shield */}
      <path
        d="M32 28 H68 C68 28 68 56 50 72 C32 56 32 28 32 28 Z"
        fill={variant === "white" ? "#1E3A8A" : "#0E243F"}
        stroke={variant === "white" ? "#60A5FA" : "#F59E0B"}
        strokeWidth="1.5"
      />

      {/* Knowledge Torch Flame (Top of shield) */}
      <path
        d="M50 20 C47 24 46 27 48 30 C50 31 52 30 52 28 C53 31 55 31 54 28 C56 26 55 23 50 20 Z"
        fill={variant === "white" ? "#FCD34D" : "url(#dduGoldGrad)"}
      />
      <circle cx="50" cy="30" r="1.5" fill="#EF4444" />

      {/* Central Open Book */}
      <path
        d="M37 42 C43 40 48 41 50 44 C52 41 57 40 63 42 V55 C57 53 52 54 50 57 C48 54 43 53 37 55 Z"
        fill="#FFFFFF"
        stroke="#1E293B"
        strokeWidth="0.8"
      />
      {/* Book Center spine */}
      <line x1="50" y1="44" x2="50" y2="57" stroke="#1E293B" strokeWidth="0.8" />
      {/* Book lines */}
      <line x1="41" y1="46" x2="47" y2="46" stroke="#94A3B8" strokeWidth="0.6" />
      <line x1="41" y1="49" x2="47" y2="49" stroke="#94A3B8" strokeWidth="0.6" />
      <line x1="53" y1="46" x2="59" y2="46" stroke="#94A3B8" strokeWidth="0.6" />
      <line x1="53" y1="49" x2="59" y2="49" stroke="#94A3B8" strokeWidth="0.6" />

      {/* Technology Gear (Base of Shield) */}
      <circle
        cx="50"
        cy="64"
        r="5.5"
        fill="url(#dduTealGrad)"
        stroke={variant === "white" ? "#93C5FD" : "#FFFFFF"}
        strokeWidth="0.8"
      />
      <circle cx="50" cy="64" r="2.5" fill="#0E243F" />

      {/* Five Stars at top rim */}
      <polygon points="50,9 51,12 54,12 51.5,14 52.5,17 50,15 47.5,17 48.5,14 46,12 49,12" fill="#F59E0B" />
      <polygon points="41,12 41.8,14.5 44.5,14.5 42.3,16.2 43.1,18.7 41,17.1 38.9,18.7 39.7,16.2 37.5,14.5 40.2,14.5" fill="#F59E0B" />
      <polygon points="59,12 59.8,14.5 62.5,14.5 60.3,16.2 61.1,18.7 59,17.1 56.9,18.7 57.7,16.2 55.5,14.5 58.2,14.5" fill="#F59E0B" />

      {/* Base Banner Arc */}
      <path
        d="M26 80 Q50 91 74 80 L72 75 Q50 85 28 75 Z"
        fill={variant === "white" ? "#1E40AF" : "#1E3A8A"}
        stroke="#D97706"
        strokeWidth="0.6"
      />
      <text
        x="50"
        y="81"
        textAnchor="middle"
        fontSize="3.8"
        fontWeight="bold"
        fill="#F8FAFC"
        fontFamily="sans-serif"
        letterSpacing="0.4"
      >
        DDU • 2006
      </text>
    </svg>
  );
};
