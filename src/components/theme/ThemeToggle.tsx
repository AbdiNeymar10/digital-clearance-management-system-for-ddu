"use client";

import * as React from "react";
import { useTheme } from "./ThemeProvider";
import { Sun, Moon, Laptop } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  variant?: "icon" | "pill" | "menu";
  showLabel?: boolean;
}

export function ThemeToggle({
  className,
  variant = "icon",
  showLabel = false,
}: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Close menu on outside click
  React.useEffect(() => {
    if (!isMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  if (!mounted) {
    // Avoid hydration mismatch by rendering static placeholder of same dimensions
    return (
      <button
        type="button"
        disabled
        className={cn(
          "relative inline-flex items-center justify-center p-2 rounded-xl text-slate-400 opacity-60 pointer-events-none transition-colors",
          className
        )}
        aria-label="Loading theme toggle"
      >
        <Sun className="w-4 h-4" />
      </button>
    );
  }

  const isDark = resolvedTheme === "dark";

  if (variant === "menu") {
    return (
      <div className="relative inline-block text-left" ref={menuRef}>
        <button
          type="button"
          onClick={() => setIsMenuOpen((prev) => !prev)}
          className={cn(
            "p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/80 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500",
            className
          )}
          aria-label="Select color theme"
          aria-expanded={isMenuOpen}
        >
          {isDark ? <Moon className="w-4 h-4 text-cyan-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
        </button>

        {isMenuOpen && (
          <div className="absolute right-0 mt-2 w-36 rounded-xl bg-white dark:bg-[#0b1a2e] border border-slate-200 dark:border-slate-700/80 shadow-xl p-1 z-50 text-xs animate-slide-down space-y-0.5">
            <button
              type="button"
              onClick={() => {
                setTheme("light");
                setIsMenuOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-colors text-left",
                theme === "light"
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 font-semibold"
                  : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
            >
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span>Light</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setTheme("dark");
                setIsMenuOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-colors text-left",
                theme === "dark"
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 font-semibold"
                  : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
            >
              <Moon className="w-3.5 h-3.5 text-cyan-400" />
              <span>Dark</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setTheme("system");
                setIsMenuOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-colors text-left",
                theme === "system"
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 font-semibold"
                  : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
            >
              <Laptop className="w-3.5 h-3.5 text-slate-400" />
              <span>System</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  if (variant === "pill" || showLabel) {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={cn(
          "inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
          isDark
            ? "bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-200"
            : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-xs",
          className
        )}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      >
        {isDark ? (
          <>
            <Sun className="w-4 h-4 text-amber-400" />
            <span>Light Mode</span>
          </>
        ) : (
          <>
            <Moon className="w-4 h-4 text-slate-600" />
            <span>Dark Mode</span>
          </>
        )}
      </button>
    );
  }

  // Default: Icon toggle
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        "relative p-2 rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
        isDark
          ? "text-slate-300 hover:text-white hover:bg-slate-800/80"
          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100",
        className
      )}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-400 transition-transform duration-300 hover:rotate-45" />
      ) : (
        <Moon className="w-4 h-4 text-slate-700 transition-transform duration-300 hover:-rotate-12" />
      )}
    </button>
  );
}

