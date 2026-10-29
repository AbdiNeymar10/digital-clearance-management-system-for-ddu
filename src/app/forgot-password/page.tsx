"use client";

import * as React from "react";
import Link from "next/link";
import { UniversityCrest } from "@/components/ui/university-crest";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  ArrowLeft,
  Mail,
  AlertCircle,
  CheckCircle2,
  Loader2,
  KeyRound,
} from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [successSubmitted, setSuccessSubmitted] = React.useState(false);

  const configured = isSupabaseConfigured();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage("Please enter your registered university email address.");
      return;
    }

    if (!configured) {
      // In unconfigured development mode, demonstrate the generic response
      setSuccessSubmitted(true);
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const redirectUrl = `${window.location.origin}/auth/callback?next=/reset-password`;

      await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo: redirectUrl,
      });

      // Always show generic success message to prevent user enumeration
      setSuccessSubmitted(true);
    } catch (err) {
      console.error("Password reset request error:", err);
      // Still show generic message to avoid disclosing user existence
      setSuccessSubmitted(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex flex-col justify-between relative overflow-hidden transition-colors">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-80 bg-gradient-to-b from-blue-600/15 via-teal-500/10 to-transparent blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md relative z-10 transition-colors">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Sign In</span>
          </Link>

          <div className="flex items-center gap-3">
            <ThemeToggle variant="icon" />
            <div className="hidden sm:flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-500 dark:bg-teal-400" />
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">DCMS Password Recovery</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md w-full mx-auto p-4 sm:p-6 my-auto relative z-10">
        <div className="bg-white dark:bg-[#0b1a2e] border border-slate-200 dark:border-slate-700/80 rounded-2xl shadow-xl dark:shadow-2xl p-6 sm:p-8 space-y-6 transition-colors">
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-3">
              <UniversityCrest size={64} />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Reset Your DCMS Password
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Enter your registered Dire Dawa University email to receive secure recovery instructions.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-500/40 text-xs text-rose-800 dark:text-rose-200 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">{errorMessage}</p>
            </div>
          )}

          {successSubmitted ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-500/40 text-xs text-emerald-800 dark:text-emerald-200 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Password Reset Request Received</span>
                </div>
                <p className="leading-relaxed text-emerald-800 dark:text-emerald-200/90">
                  If an active account exists for <strong>{email}</strong>, a secure password-reset link has been dispatched. Please review your university inbox and spam folders.
                </p>
              </div>

              <div className="pt-2 text-center">
                <Link href="/login">
                  <Button variant="outline" size="md" className="w-full">
                    Return to Login Gate
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 block"
                >
                  Registered Email Address
                </label>
                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="name@ddu.edu.et"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:border-blue-500 placeholder:text-slate-400 dark:placeholder:text-slate-600 transition-colors"
                  />
                  <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3 pointer-events-none" />
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-500 font-semibold shadow-lg shadow-blue-600/20"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    <span>Transmitting Request...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4 mr-2" />
                    <span>Send Password Reset Link</span>
                  </>
                )}
              </Button>
            </form>
          )}

          <div className="text-center pt-2">
            <Link
              href="/login"
              className="text-xs text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-teal-300 underline underline-offset-4 transition-colors"
            >
              Remember your password? Sign In
            </Link>
          </div>
        </div>
      </main>

      <footer className="p-4 text-center text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#07111e] transition-colors">
        Dire Dawa University • Directorate for ICT & Office of the University Registrar
      </footer>
    </div>
  );
}
