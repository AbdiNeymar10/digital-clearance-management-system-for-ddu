"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { UniversityCrest } from "@/components/ui/university-crest";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { getDashboardRouteForRole, validatePassword } from "@/lib/auth/validation";
import type { UserRole } from "@/types/database";
import {
  ArrowLeft,
  Lock,
  Mail,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  ExternalLink,
  Loader2,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [formInfo, setFormInfo] = React.useState<string | null>(null);

  const configured = isSupabaseConfigured();

  // Derive URL feedback during render rather than setting state in an effect
  const errorParam = searchParams.get("error");
  const signedOut = searchParams.get("signed_out");
  const resetSuccess = searchParams.get("reset_success");

  const urlError = React.useMemo(() => {
    if (errorParam === "session_required") {
      return "Please sign in to access your clearance dashboard.";
    }
    if (errorParam === "account_deactivated") {
      return "This university account has been deactivated. Please contact the ICT Directorate.";
    }
    if (errorParam) {
      return decodeURIComponent(errorParam);
    }
    return null;
  }, [errorParam]);

  const urlInfo = React.useMemo(() => {
    if (signedOut) {
      return "You have been signed out successfully.";
    }
    if (resetSuccess) {
      return "Password updated successfully. Please sign in with your new password.";
    }
    return null;
  }, [signedOut, resetSuccess]);

  const errorMessage = formError || urlError;
  const infoMessage = formInfo || urlInfo;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormInfo(null);

    // Client-side validations
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setFormError("Please enter your registered university email address.");
      return;
    }

    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      setFormError(passwordCheck.message || "Invalid password length.");
      return;
    }

    if (!configured) {
      setFormError(
        "Supabase is not yet connected to a live database instance. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local to enable real database authentication."
      );
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (error) {
        // Generic error message to prevent account enumeration
        setFormError("Invalid email or password. Please verify your credentials.");
        setIsLoading(false);
        return;
      }

      if (!data.user) {
        setFormError("Unable to authenticate session. Please try again.");
        setIsLoading(false);
        return;
      }

      // Query user profile to verify role and activation status
      const { data: rawProfile, error: profileError } = await supabase
        .from("profiles")
        .select("role, is_active")
        .eq("id", data.user.id)
        .single();

      const profile = rawProfile as { role: UserRole; is_active: boolean } | null;

      if (profileError || !profile) {
        setFormError("User profile not found. Please contact the Registrar Office.");
        setIsLoading(false);
        return;
      }

      if (!profile.is_active) {
        await supabase.auth.signOut();
        setFormError("This account is currently inactive. Please contact the Registrar Office.");
        setIsLoading(false);
        return;
      }

      // Check if a redirect parameter was provided
      const redirectParam = searchParams.get("redirect");
      if (redirectParam && redirectParam.startsWith("/")) {
        router.push(redirectParam);
      } else {
        const targetRoute = getDashboardRouteForRole(profile.role);
        router.push(targetRoute);
      }
    } catch (err) {
      console.error("Sign-in unexpected exception:", err);
      setFormError("An unexpected network error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex flex-col justify-between relative overflow-hidden transition-colors">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-80 bg-gradient-to-b from-blue-600/15 via-teal-500/10 to-transparent blur-3xl pointer-events-none" />

      {/* Top Header */}
      <header className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md relative z-10 transition-colors">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Public Landing Page</span>
          </Link>

          <div className="flex items-center gap-3">
            <ThemeToggle variant="icon" />
            <div className="hidden sm:flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-500 dark:bg-teal-400" />
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">DDU DCMS Auth Gate</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Login Form Container */}
      <main className="max-w-md w-full mx-auto p-4 sm:p-6 my-auto relative z-10">
        <div className="bg-white dark:bg-[#0b1a2e] border border-slate-200 dark:border-slate-700/80 rounded-2xl shadow-xl dark:shadow-2xl p-6 sm:p-8 space-y-6 transition-colors">
          {/* Institutional Crest and Header */}
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-3">
              <UniversityCrest size={64} />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Sign In to DCMS
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Dire Dawa University Digital Clearance Management System
            </p>
          </div>

          {/* Setup / Status Notice if credentials are not configured yet */}
          {!configured && (
            <div className="p-3.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-500/30 text-xs text-blue-900 dark:text-blue-200 space-y-2">
              <div className="flex items-center gap-2 font-semibold text-blue-950 dark:text-white">
                <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                <span>Supabase Auth Ready (Prompt 2)</span>
              </div>
              <p className="text-blue-800 dark:text-blue-200/90 leading-relaxed text-[11px]">
                To authenticate against your live database, connect your Supabase project keys in <code className="bg-white dark:bg-slate-900 px-1 py-0.5 rounded text-teal-700 dark:text-teal-300 border border-blue-200 dark:border-transparent">.env.local</code>.
              </p>
              <div className="pt-1 border-t border-blue-200/80 dark:border-blue-800/60">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1.5 font-medium uppercase tracking-wider">
                  Direct Protected Destination Previews:
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  <Link
                    href="/student"
                    className="px-2 py-1 bg-white hover:bg-slate-100 dark:bg-slate-900/90 dark:hover:bg-slate-800 text-[11px] rounded text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white border border-slate-200 dark:border-slate-700 text-center flex items-center justify-center gap-1"
                  >
                    <span>Student Portal</span>
                    <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                  </Link>
                  <Link
                    href="/department"
                    className="px-2 py-1 bg-white hover:bg-slate-100 dark:bg-slate-900/90 dark:hover:bg-slate-800 text-[11px] rounded text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white border border-slate-200 dark:border-slate-700 text-center flex items-center justify-center gap-1"
                  >
                    <span>Staff Desk</span>
                    <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                  </Link>
                  <Link
                    href="/registrar"
                    className="px-2 py-1 bg-white hover:bg-slate-100 dark:bg-slate-900/90 dark:hover:bg-slate-800 text-[11px] rounded text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white border border-slate-200 dark:border-slate-700 text-center flex items-center justify-center gap-1"
                  >
                    <span>Registrar</span>
                    <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                  </Link>
                  <Link
                    href="/admin"
                    className="px-2 py-1 bg-white hover:bg-slate-100 dark:bg-slate-900/90 dark:hover:bg-slate-800 text-[11px] rounded text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white border border-slate-200 dark:border-slate-700 text-center flex items-center justify-center gap-1"
                  >
                    <span>Admin</span>
                    <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Feedback Banners */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-500/40 text-xs text-rose-800 dark:text-rose-200 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">{errorMessage}</p>
            </div>
          )}

          {infoMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-500/40 text-xs text-emerald-800 dark:text-emerald-200 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">{infoMessage}</p>
            </div>
          )}

          {/* Authentication Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 block"
              >
                University Email Address
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="name@ddu.edu.et or student@ddu.edu.et"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:border-blue-500 placeholder:text-slate-400 dark:placeholder:text-slate-600 transition-colors"
                />
                <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 block"
                >
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors font-medium"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="Minimum 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:border-blue-500 placeholder:text-slate-400 dark:placeholder:text-slate-600 transition-colors"
                />
                <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3 pointer-events-none" />
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
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <span>Sign In to DCMS</span>
              )}
            </Button>
          </form>

          {/* Secondary Footer */}
          <div className="text-center pt-2">
            <Link
              href="/"
              className="text-xs text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-teal-300 underline underline-offset-4 transition-colors"
            >
              Return to Dire Dawa University Public Home
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#07111e] transition-colors">
        Dire Dawa University • Directorate for ICT & Office of the University Registrar
      </footer>
    </div>
  );
}
