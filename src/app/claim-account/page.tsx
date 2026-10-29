"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { UniversityCrest } from "@/components/ui/university-crest";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { verifyClaimToken, completeAccountClaim } from "@/lib/actions/student-actions";
import { validatePassword } from "@/lib/auth/validation";
import {
  ArrowLeft,
  Lock,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldAlert,
  Loader2,
  KeyRound,
  GraduationCap,
  HelpCircle,
} from "lucide-react";

type ClaimStage = "verifying" | "valid" | "success" | "error";

export default function ClaimAccountPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [stage, setStage] = React.useState<ClaimStage>("verifying");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [errorType, setErrorType] = React.useState<string | null>(null);

  const [studentInfo, setStudentInfo] = React.useState<{
    studentName: string;
    studentId: string;
    email: string;
  } | null>(null);

  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  // Verify the token on page load
  React.useEffect(() => {
    let isMounted = true;

    async function checkToken() {
      if (!token || token.trim().length === 0) {
        if (isMounted) {
          setStage("error");
          setErrorType("CLAIM_TOKEN_INVALID");
          setErrorMessage("No account claim token was supplied in the activation link.");
        }
        return;
      }

      try {
        const result = await verifyClaimToken(token);

        if (!isMounted) return;

        if (result.success && result.data) {
          setStudentInfo(result.data);
          setStage("valid");
        } else {
          setStage("error");
          const errCode = result.error || "CLAIM_TOKEN_INVALID";
          setErrorType(errCode);

          if (errCode === "CLAIM_TOKEN_CONSUMED") {
            setErrorMessage("This account activation link has already been consumed. Your account is already activated.");
          } else if (errCode === "CLAIM_TOKEN_EXPIRED") {
            setErrorMessage("This account activation link has expired. Activation links are valid for exactly 72 hours.");
          } else if (errCode === "CLAIM_TOKEN_REVOKED") {
            setErrorMessage("This activation link has been superseded or revoked. A newer link may have been issued by the Registrar.");
          } else {
            setErrorMessage("The activation link is invalid or malformed.");
          }
        }
      } catch {
        if (!isMounted) return;
        setStage("error");
        setErrorType("NETWORK_ERROR");
        setErrorMessage("An unexpected verification error occurred. Please check your connection and try again.");
      }
    }

    checkToken();

    return () => {
      isMounted = false;
    };
  }, [token]);

  // Handle password submission
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const pwdCheck = validatePassword(password);
    if (!pwdCheck.valid) {
      setFormError(pwdCheck.message || "Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setFormError("Passwords do not match. Please re-enter.");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await completeAccountClaim(token, password);

      if (result.success) {
        setStage("success");
      } else {
        const errCode = result.error || "CLAIM_FAILED";
        if (errCode === "CLAIM_TOKEN_CONSUMED") {
          setFormError("This activation link has already been used. Please sign in directly.");
        } else if (errCode === "CLAIM_TOKEN_EXPIRED") {
          setFormError("The 72-hour validity window for this link has expired. Contact the Registrar for a new link.");
        } else {
          setFormError(result.error || "Failed to establish account password. Please try again.");
        }
      }
    } catch (err) {
      console.error("Claim error:", err);
      setFormError("A network error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-80 bg-gradient-to-b from-blue-600/15 via-teal-500/10 to-transparent blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="p-4 sm:p-6 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md relative z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Public Home</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-teal-400" />
            <span className="text-xs text-slate-400 font-mono">DDU Account Activation</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-md w-full mx-auto p-4 sm:p-6 my-auto relative z-10">
        <div className="bg-[#0b1a2e] border border-slate-700/80 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6">
          {/* Crest and Title */}
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-3">
              <UniversityCrest size={64} />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Student Account Activation
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Dire Dawa University Digital Clearance Management System
            </p>
          </div>

          {/* State 1: Verifying */}
          {stage === "verifying" && (
            <div className="py-8 text-center space-y-4">
              <Loader2 className="w-8 h-8 text-teal-400 animate-spin mx-auto" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-200">
                  Verifying Activation Link...
                </p>
                <p className="text-xs text-slate-400">
                  Checking cryptographic token validity and 72-hour window.
                </p>
              </div>
            </div>
          )}

          {/* State 2: Valid Token - Form to setup password */}
          {stage === "valid" && studentInfo && (
            <div className="space-y-5">
              {/* Verified Identity Card */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Verified Student Record:</span>
                  <Badge variant="cleared" size="sm">
                    Token Verified
                  </Badge>
                </div>
                <div className="flex items-center gap-2 pt-1 text-slate-200 font-semibold text-sm">
                  <GraduationCap className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>{studentInfo.studentName}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
                  <span>ID: {studentInfo.studentId}</span>
                  <span>•</span>
                  <span>{studentInfo.email}</span>
                </div>
              </div>

              {formError && (
                <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-200 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">{formError}</p>
                </div>
              )}

              {/* Password setup form */}
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="password"
                    className="text-xs font-semibold uppercase tracking-wider text-slate-300 block"
                  >
                    Create Password (Min. 8 characters)
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type="password"
                      required
                      autoComplete="new-password"
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-blue-500 placeholder:text-slate-600 transition-colors"
                    />
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="confirmPassword"
                    className="text-xs font-semibold uppercase tracking-wider text-slate-300 block"
                  >
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type="password"
                      required
                      autoComplete="new-password"
                      placeholder="••••••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-blue-500 placeholder:text-slate-600 transition-colors"
                    />
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3 pointer-events-none" />
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-500 font-semibold shadow-lg shadow-blue-600/20"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      <span>Activating Account...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4 mr-2" />
                      <span>Set Password & Activate</span>
                    </>
                  )}
                </Button>
              </form>
            </div>
          )}

          {/* State 3: Success Confirmation */}
          {stage === "success" && (
            <div className="py-4 text-center space-y-5">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Account Successfully Activated!
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Your Dire Dawa University DCMS student account is now active. You may now sign in using your registered university email and chosen password.
                </p>
              </div>

              <div className="pt-2">
                <Link href="/login">
                  <Button variant="primary" size="lg" className="w-full bg-blue-600 hover:bg-blue-500 font-semibold">
                    Sign In to Student Portal
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* State 4: Error State (Invalid, Expired, Consumed, Revoked) */}
          {stage === "error" && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-200 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-rose-300 text-sm">
                  {errorType === "CLAIM_TOKEN_EXPIRED" ? (
                    <Clock className="w-4 h-4 shrink-0" />
                  ) : errorType === "CLAIM_TOKEN_CONSUMED" ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                  )}
                  <span>
                    {errorType === "CLAIM_TOKEN_CONSUMED"
                      ? "Account Already Claimed"
                      : errorType === "CLAIM_TOKEN_EXPIRED"
                      ? "Activation Link Expired"
                      : errorType === "CLAIM_TOKEN_REVOKED"
                      ? "Activation Link Superseded"
                      : "Invalid Activation Link"}
                  </span>
                </div>
                <p className="leading-relaxed text-slate-300">
                  {errorMessage || "The link you accessed cannot be verified."}
                </p>
              </div>

              {/* Accessible assistance notice */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-400 space-y-2">
                <div className="flex items-center gap-2 font-medium text-slate-300">
                  <HelpCircle className="w-4 h-4 text-teal-400" />
                  <span>How to Request a New Activation Link:</span>
                </div>
                <p className="leading-relaxed">
                  Activation links expire 72 hours after issuance. If your link is expired or lost, please contact the <strong>Office of the University Registrar</strong> or your college ICT helpdesk on campus to request a reissuance.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                <Link href="/login" className="flex-1">
                  <Button variant="outline-light" size="md" className="w-full">
                    Go to Sign In
                  </Button>
                </Link>
                <Link href="/" className="flex-1">
                  <Button variant="ghost" size="md" className="w-full text-slate-400 hover:text-white">
                    Return Home
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-xs text-slate-400 border-t border-slate-800 bg-[#07111e]">
        Dire Dawa University • Directorate for ICT & Office of the University Registrar
      </footer>
    </div>
  );
}
