"use client";

import * as React from "react";
import Link from "next/link";
import { UniversityCrest } from "@/components/ui/university-crest";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { NAVIGATION_LINKS, UNIVERSITY_INFO } from "@/lib/constants";
import { Menu, X, ArrowRight, ShieldCheck } from "lucide-react";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "bg-slate-900/95 backdrop-blur-md border-b border-slate-800/80 shadow-md shadow-black/10"
          : "bg-[#0b1a2e] border-b border-slate-800/60"
      }`}
    >
      {/* Top institutional banner */}
      <div className="bg-[#07111e] text-slate-300 text-[11px] py-1 border-b border-slate-800/60">
        <div className="ddu-container flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium tracking-wide">
              Official Academic Portal • Dire Dawa University, Ethiopia
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-slate-400">
            <span>Academic Year {UNIVERSITY_INFO.academicYear}</span>
            <span className="text-slate-600">|</span>
            <span className="flex items-center gap-1 text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
              Verified Institutional Clearance
            </span>
          </div>
        </div>
      </div>

      {/* Main navigation container */}
      <div className="ddu-container flex h-18 items-center justify-between">
        {/* Brand identity */}
        <Link
          href="/"
          className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded-lg p-1 -ml-1 transition-opacity"
          aria-label="Dire Dawa University DCMS Home"
        >
          <UniversityCrest size={44} className="transition-transform group-hover:scale-105 duration-200" />
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-white font-bold text-base sm:text-lg tracking-tight leading-tight">
                Dire Dawa University
              </span>
              <span className="hidden md:inline-block px-1.5 py-0.2 text-[10px] uppercase font-semibold tracking-wider rounded bg-blue-900/80 text-blue-200 border border-blue-700/50">
                DCMS
              </span>
            </div>
            <span className="text-slate-300 text-xs tracking-tight font-medium">
              Digital Clearance Management System
            </span>
          </div>
        </Link>

        {/* Desktop navigation items */}
        <nav
          className="hidden lg:flex items-center gap-1 xl:gap-2 text-sm font-medium"
          aria-label="Main Navigation"
        >
          {NAVIGATION_LINKS.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="px-3 py-2 text-slate-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-xs xl:text-sm font-medium focus-visible:ring-2 focus-visible:ring-blue-400"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Desktop CTA actions */}
        <div className="hidden sm:flex items-center gap-3">
          <ThemeToggle
            variant="icon"
            className="text-slate-300 hover:text-white hover:bg-white/10"
          />
          <Link href="/login">
            <Button
              variant="primary"
              size="md"
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-sm shadow-blue-950/40"
            >
              <span>Sign In to DCMS</span>
              <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </Link>
        </div>

        {/* Mobile menu toggle */}
        <div className="flex items-center gap-1.5 lg:hidden">
          <ThemeToggle
            variant="icon"
            className="text-slate-300 hover:text-white hover:bg-white/10"
          />
          <Link href="/login" className="sm:hidden">
            <Button variant="primary" size="sm" className="h-8 px-2.5 text-xs">
              Sign In
            </Button>
          </Link>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile navigation drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-800 bg-[#0b1a2e]/98 backdrop-blur-xl px-4 pt-3 pb-6 space-y-3 transition-all animate-in slide-in-from-top-2">
          <div className="flex flex-col space-y-1">
            {NAVIGATION_LINKS.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2.5 text-slate-200 hover:text-white hover:bg-slate-800/80 rounded-lg text-sm font-medium transition-colors"
              >
                {item.label}
              </a>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-800 flex flex-col gap-2">
            <div className="flex items-center justify-between px-1 py-1">
              <span className="text-xs text-slate-400">Theme</span>
              <ThemeToggle variant="pill" />
            </div>
            <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="primary" size="lg" className="w-full justify-center">
                Sign In to DCMS
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
            <div className="text-center text-xs text-slate-400 pt-1">
              Dire Dawa University • Academic Year {UNIVERSITY_INFO.academicYear}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
