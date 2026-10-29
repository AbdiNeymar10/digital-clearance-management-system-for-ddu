"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { ShieldAlert, ArrowLeft, Home, LogOut } from "lucide-react";

export default function UnauthorizedPage() {
  const searchParams = useSearchParams();
  const requiredRole = searchParams.get("required");
  const actualRole = searchParams.get("actual");

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex flex-col justify-between relative overflow-hidden transition-colors">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-80 bg-gradient-to-b from-rose-600/15 via-amber-500/10 to-transparent blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md relative z-10 transition-colors">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Public Home</span>
          </Link>

          <div className="flex items-center gap-3">
            <ThemeToggle variant="icon" />
            <div className="hidden sm:flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 dark:bg-rose-400" />
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">Access Control Enforcement</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md w-full mx-auto p-4 sm:p-6 my-auto relative z-10">
        <div className="bg-white dark:bg-[#0b1a2e] border border-slate-200 dark:border-slate-700/80 rounded-2xl shadow-xl dark:shadow-2xl p-6 sm:p-8 space-y-6 text-center transition-colors">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <ShieldAlert className="w-9 h-9" />
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-3xl font-mono font-extrabold text-rose-600 dark:text-rose-400 block">
              403 Forbidden
            </span>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Access Restricted by University Policy
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Your authenticated university profile does not hold the permissions required to access this clearance portal section.
            </p>
          </div>

          {(requiredRole || actualRole) && (
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-1 font-mono text-left">
              {actualRole && (
                <div className="flex items-center justify-between">
                  <span>Your Active Role:</span>
                  <span className="text-amber-600 dark:text-amber-400 font-semibold">{actualRole}</span>
                </div>
              )}
              {requiredRole && (
                <div className="flex items-center justify-between">
                  <span>Required Role:</span>
                  <span className="text-teal-600 dark:text-teal-400 font-semibold">{requiredRole}</span>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link href="/" className="w-full sm:w-auto">
              <Button variant="primary" size="md" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500">
                <Home className="w-4 h-4 mr-1.5" />
                <span>Return to Home</span>
              </Button>
            </Link>

            <form action="/auth/signout" method="POST" className="w-full sm:w-auto">
              <Button variant="outline" size="md" type="submit" className="w-full sm:w-auto border-slate-300 dark:border-slate-700">
                <LogOut className="w-4 h-4 mr-1.5" />
                <span>Sign In with Other Role</span>
              </Button>
            </form>
          </div>
        </div>
      </main>

      <footer className="p-4 text-center text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#07111e] transition-colors">
        Dire Dawa University DCMS • Role-Based Access Control (RBAC)
      </footer>
    </div>
  );
}
