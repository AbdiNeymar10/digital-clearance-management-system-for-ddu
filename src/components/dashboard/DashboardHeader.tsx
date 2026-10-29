import * as React from "react";
import Link from "next/link";
import { UniversityCrest } from "@/components/ui/university-crest";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import type { UserRole } from "@/types/database";
import { LogOut } from "lucide-react";

interface DashboardHeaderProps {
  portalTitle: string;
  role: UserRole;
  userEmail?: string;
  studentId?: string | null;
}

export function DashboardHeader({
  portalTitle,
  role,
  userEmail = "demo.user@ddu.edu.et",
  studentId,
}: DashboardHeaderProps) {
  const roleBadges: Record<UserRole, { label: string; variant: "info" | "cleared" | "in_review" | "demo" }> = {
    STUDENT: { label: "Student Role", variant: "info" },
    DEPARTMENT_STAFF: { label: "Department Staff", variant: "in_review" },
    REGISTRAR: { label: "Registrar Officer", variant: "cleared" },
    ADMINISTRATOR: { label: "System Administrator", variant: "demo" },
  };

  const badgeConfig = roleBadges[role] || { label: role, variant: "info" };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0b1a2e] border-b border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white shadow-sm dark:shadow-md backdrop-blur-md transition-colors">
      <div className="ddu-container flex h-16 items-center justify-between">
        {/* Left: Crest and Portal Title */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <UniversityCrest size={38} className="group-hover:scale-105 transition-transform" />
            <div className="hidden sm:block">
              <span className="text-slate-900 dark:text-white font-bold text-sm tracking-tight block">
                Dire Dawa University
              </span>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">
                DCMS • Digital Clearance Management System
              </span>
            </div>
          </Link>

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden md:block" />

          <div className="flex items-center gap-2">
            <h1 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100">
              {portalTitle}
            </h1>
            <Badge variant={badgeConfig.variant} size="sm">
              {badgeConfig.label}
            </Badge>
          </div>
        </div>

        {/* Right: User Profile, Theme Toggle & Sign Out */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <ThemeToggle variant="icon" />

          <div className="hidden lg:flex flex-col text-right">
            <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
              {userEmail}
            </span>
            {studentId && (
              <span className="text-[10px] text-teal-600 dark:text-teal-400 font-mono">
                ID: {studentId}
              </span>
            )}
          </div>

          <form action="/auth/signout" method="POST">
            <Button
              type="submit"
              variant="outline"
              size="sm"
              className="text-xs border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:border-rose-300 dark:hover:border-rose-500/50 hover:text-rose-700 dark:hover:text-rose-200 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5 mr-1.5" />
              <span>Sign Out</span>
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
