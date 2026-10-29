import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  variant?: "blue" | "teal" | "amber" | "emerald" | "indigo";
  badgeText?: string;
  href?: string;
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = "blue",
  badgeText,
  href,
  className,
}: StatCardProps) {
  const variantStyles = {
    blue: {
      bg: "bg-blue-600/10",
      border: "border-blue-500/30",
      icon: "text-blue-400 bg-blue-500/20 border-blue-500/40",
      hover: "hover:border-blue-500/60",
    },
    teal: {
      bg: "bg-teal-600/10",
      border: "border-teal-500/30",
      icon: "text-teal-400 bg-teal-500/20 border-teal-500/40",
      hover: "hover:border-teal-500/60",
    },
    amber: {
      bg: "bg-amber-600/10",
      border: "border-amber-500/30",
      icon: "text-amber-400 bg-amber-500/20 border-amber-500/40",
      hover: "hover:border-amber-500/60",
    },
    emerald: {
      bg: "bg-emerald-600/10",
      border: "border-emerald-500/30",
      icon: "text-emerald-400 bg-emerald-500/20 border-emerald-500/40",
      hover: "hover:border-emerald-500/60",
    },
    indigo: {
      bg: "bg-indigo-600/10",
      border: "border-indigo-500/30",
      icon: "text-indigo-400 bg-indigo-500/20 border-indigo-500/40",
      hover: "hover:border-indigo-500/60",
    },
  };

  const currentVariant = variantStyles[variant];

  const content = (
    <div
      className={cn(
        "rounded-2xl bg-white dark:bg-[#0b1a2e] border p-5 shadow-sm dark:shadow-lg transition-all duration-200 flex flex-col justify-between gap-4 group relative overflow-hidden",
        currentVariant.border,
        href && currentVariant.hover,
        href && "hover:-translate-y-1 hover:shadow-md dark:hover:shadow-xl cursor-pointer",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            {title}
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {value}
          </div>
        </div>

        <div
          className={cn(
            "w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-105",
            currentVariant.icon
          )}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {(subtitle || badgeText) && (
        <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800/80">
          {subtitle && <span className="text-slate-500 dark:text-slate-400 text-[11px] truncate">{subtitle}</span>}
          {badgeText && (
            <span className="font-mono text-[10px] text-teal-600 dark:text-teal-400 font-semibold ml-auto">
              {badgeText}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-2xl">
        {content}
      </Link>
    );
  }

  return content;
}
