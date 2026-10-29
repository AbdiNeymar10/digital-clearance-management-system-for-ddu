"use client";

import * as React from "react";

export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = React.createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = "ddu-theme";

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = React.useState<ResolvedTheme>("light");
  const [mounted, setMounted] = React.useState(false);

  // Initialize theme from localStorage or system
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
      const initialTheme: Theme = stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
      setThemeState(initialTheme);
      const initialResolved: ResolvedTheme = initialTheme === "system" ? getSystemTheme() : initialTheme;
      setResolvedTheme(initialResolved);
      applyTheme(initialResolved);
    } catch {
      // Ignore storage errors
    }
    setMounted(true);
  }, []);

  const applyTheme = (resolved: ResolvedTheme) => {
    const root = document.documentElement;
    if (resolved === "dark") {
      root.classList.add("dark");
      root.style.colorScheme = "dark";
    } else {
      root.classList.remove("dark");
      root.style.colorScheme = "light";
    }
  };

  const setTheme = React.useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(STORAGE_KEY, newTheme);
    } catch {
      // Ignore storage errors
    }

    const resolved: ResolvedTheme = newTheme === "system" ? getSystemTheme() : newTheme;
    setResolvedTheme(resolved);
    applyTheme(resolved);
  }, []);

  const toggleTheme = React.useCallback(() => {
    const nextTheme: Theme = resolvedTheme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
  }, [resolvedTheme, setTheme]);

  // Listen to system preference changes when in 'system' mode
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = () => {
      if (theme === "system") {
        const nextResolved = mediaQuery.matches ? "dark" : "light";
        setResolvedTheme(nextResolved);
        applyTheme(nextResolved);
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  // Sync across tabs
  React.useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        const nextTheme = e.newValue as Theme;
        if (nextTheme === "light" || nextTheme === "dark" || nextTheme === "system") {
          setThemeState(nextTheme);
          const resolved: ResolvedTheme = nextTheme === "system" ? getSystemTheme() : nextTheme;
          setResolvedTheme(resolved);
          applyTheme(resolved);
        }
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const value = React.useMemo<ThemeContextType>(
    () => ({
      theme,
      resolvedTheme: mounted ? resolvedTheme : "light",
      setTheme,
      toggleTheme,
    }),
    [theme, resolvedTheme, mounted, setTheme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextType {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

