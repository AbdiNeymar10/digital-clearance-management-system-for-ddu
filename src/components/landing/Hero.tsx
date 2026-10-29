import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HeroVisual } from "./HeroVisual";
import {
  ArrowRight,
  CheckCircle,
} from "lucide-react";

export function Hero() {
  return (
    <section
      id="hero"
      className="relative overflow-hidden bg-[#0b1a2e] text-white pt-10 pb-20 lg:pt-16 lg:pb-28 border-b border-slate-800"
    >
      {/* Background ambient lighting effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-blue-600/15 via-teal-500/10 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute top-20 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="ddu-container relative z-10">
        {/* Top Badges & Announcement */}
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto space-y-4 mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/90 border border-slate-700/80 text-xs sm:text-sm text-slate-200 shadow-sm">
            <span className="flex h-2 w-2 rounded-full bg-teal-400 animate-pulse" />
            <span className="font-semibold text-teal-300">DDU Digital Transformation</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-300">Modernizing University Academic Clearance</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.12]">
            Complete Your University Clearance{" "}
            <span className="bg-gradient-to-r from-blue-400 via-teal-300 to-cyan-300 bg-clip-text text-transparent">
              100% Digitally
            </span>
          </h1>

          {/* Subtitle / Supporting copy */}
          <p className="text-base sm:text-lg lg:text-xl text-slate-300 leading-relaxed font-normal max-w-2xl">
            Dire Dawa University’s official clearance system connects eight administrative
            and academic departments simultaneously. No paper slips, no physical office
            queues, and no lost signatures.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-3.5 pt-3 w-full sm:w-auto">
            <Link href="/login" className="w-full sm:w-auto">
              <Button
                variant="primary"
                size="lg"
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-semibold text-base shadow-lg shadow-blue-600/20 px-7"
              >
                <span>Sign In to DCMS</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>

            <a href="#how-it-works" className="w-full sm:w-auto">
              <Button
                variant="outline-light"
                size="lg"
                className="w-full sm:w-auto font-medium text-base px-6 border-slate-700 hover:bg-slate-800/80"
              >
                <span>How It Works</span>
              </Button>
            </a>
          </div>

          {/* Key Trust Signals */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs text-slate-300">
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-teal-400" />
              <span>Parallel Review Across 8 Offices</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-teal-400" />
              <span>Tamper-Evident QR Verification</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-teal-400" />
              <span>Role-Based Access Control</span>
            </div>
          </div>
        </div>

        {/* Hero Illustrative Clearance Preview Visual */}
        <div className="mt-8 lg:mt-12">
          <HeroVisual />
        </div>

        {/* Highlight metrics bar */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
          <div className="p-3 text-center sm:text-left">
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">8</div>
            <div className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">Integrated University Offices</div>
          </div>
          <div className="p-3 text-center sm:text-left">
            <div className="text-2xl sm:text-3xl font-extrabold text-teal-400 font-mono">100%</div>
            <div className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">Paperless Digital Submissions</div>
          </div>
          <div className="p-3 text-center sm:text-left">
            <div className="text-2xl sm:text-3xl font-extrabold text-blue-400 font-mono">24/7</div>
            <div className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">Real-Time Status Tracking</div>
          </div>
          <div className="p-3 text-center sm:text-left">
            <div className="text-2xl sm:text-3xl font-extrabold text-cyan-300 font-mono">Instant</div>
            <div className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">QR Certificate Generation</div>
          </div>
        </div>
      </div>
    </section>
  );
}
