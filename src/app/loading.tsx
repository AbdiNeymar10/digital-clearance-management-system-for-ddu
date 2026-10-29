import * as React from "react";
import { UniversityCrest } from "@/components/ui/university-crest";

export default function Loading() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 bg-[#0b1a2e] text-white">
      <div className="relative flex flex-col items-center space-y-4">
        {/* Pulsing crest */}
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-xl animate-pulse" />
          <UniversityCrest size={72} className="relative z-10 animate-bounce duration-1000" />
        </div>

        <div className="text-center space-y-1">
          <h2 className="text-lg font-bold text-white tracking-tight">
            Dire Dawa University DCMS
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            Loading clearance system data...
          </p>
        </div>

        {/* Loading spinner bar */}
        <div className="w-48 h-1 bg-slate-800 rounded-full overflow-hidden">
          <div className="w-full h-full bg-gradient-to-r from-blue-500 via-teal-400 to-cyan-400 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
