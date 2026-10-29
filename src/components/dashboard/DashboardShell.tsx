"use client";

import * as React from "react";
import Link from "next/link";
import { UniversityCrest } from "@/components/ui/university-crest";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { DashboardSidebar } from "./DashboardSidebar";
import type { UserRole } from "@/types/database";
import {
  Menu,
  Bell,
  ChevronRight,
  LogOut,
  User,
  GraduationCap,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Clock,
  X,
  ExternalLink,
} from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface DashboardShellProps {
  children: React.ReactNode;
  role: UserRole;
  title: string;
  breadcrumbs?: BreadcrumbItem[];
  userEmail?: string;
  fullName?: string;
  studentId?: string | null;
  college?: string | null;
  department?: string | null;
  activeRequestsCount?: number;
}

function subscribeSidebar(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getSidebarSnapshot() {
  try {
    return localStorage.getItem("ddu_sidebar_collapsed") === "true";
  } catch {
    return false;
  }
}

function getSidebarServerSnapshot() {
  return false;
}

export function DashboardShell({
  children,
  role,
  title,
  breadcrumbs = [],
  userEmail = "user@ddu.edu.et",
  fullName = "Authenticated User",
  studentId,
  college,
  department,
  activeRequestsCount,
}: DashboardShellProps) {
  // Sync sidebar state from local store
  const isCollapsed = React.useSyncExternalStore(
    subscribeSidebar,
    getSidebarSnapshot,
    getSidebarServerSnapshot
  );
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);

  // Top bar dropdown menus
  const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = React.useState(false);

  const handleToggleCollapse = () => {
    try {
      localStorage.setItem("ddu_sidebar_collapsed", String(!isCollapsed));
      window.dispatchEvent(new Event("storage"));
    } catch {
      // Ignore storage errors
    }
  };

  // Close menus on outside click or Esc
  React.useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("#user-menu-container")) {
        setIsUserMenuOpen(false);
      }
      if (!target.closest("#notifications-container")) {
        setIsNotificationOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsUserMenuOpen(false);
        setIsNotificationOpen(false);
      }
    };

    document.addEventListener("click", handleGlobalClick);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("click", handleGlobalClick);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const roleBadgeStyles: Record<
    UserRole,
    { label: string; variant: "info" | "cleared" | "in_review" | "demo" }
  > = {
    STUDENT: { label: "Student Role", variant: "info" },
    DEPARTMENT_STAFF: { label: "Department Staff", variant: "in_review" },
    REGISTRAR: { label: "University Registrar", variant: "cleared" },
    ADMINISTRATOR: { label: "System Administrator", variant: "demo" },
  };

  const badgeConfig = roleBadgeStyles[role] || { label: role, variant: "info" };

  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-[#07111e] text-slate-900 dark:text-slate-100 flex flex-col antialiased selection:bg-blue-600 selection:text-white transition-colors duration-200">
      <div className="flex-1 flex w-full">
        {/* Interactive Animated Sidebar */}
        <DashboardSidebar
          role={role}
          userEmail={userEmail}
          fullName={fullName}
          studentId={studentId}
          college={college}
          department={department}
          isCollapsed={isCollapsed}
          onToggleCollapse={handleToggleCollapse}
          isMobileOpen={isMobileOpen}
          onCloseMobile={() => setIsMobileOpen(false)}
          activeRequestsCount={activeRequestsCount}
        />

        {/* Main Application Column */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Top Sticky Navigation Bar */}
          <header className="sticky top-0 z-20 ddu-glass-header h-16 px-4 sm:px-6 flex items-center justify-between gap-4 transition-all duration-200">
            {/* Left: Mobile Toggle & Breadcrumbs */}
            <div className="flex items-center gap-3 min-w-0">
              {/* Mobile Hamburger Button */}
              <button
                type="button"
                onClick={() => setIsMobileOpen(true)}
                className="md:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/80 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500"
                aria-label="Open mobile navigation menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Breadcrumb Trail */}
              <nav aria-label="Breadcrumbs" data-page-title={title} className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 min-w-0 truncate">
                <Link
                  href="/"
                  className="hover:text-blue-600 dark:hover:text-teal-400 transition-colors flex items-center gap-1 shrink-0"
                  title={`Dire Dawa University DCMS - ${title}`}
                >
                  <UniversityCrest size={18} />
                  <span className="hidden sm:inline font-medium">DDU DCMS</span>
                </Link>

                {breadcrumbs.length === 0 && (
                  <>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600 shrink-0" />
                    <span className="text-slate-800 dark:text-slate-200 font-semibold truncate max-w-[150px] sm:max-w-none">
                      {title}
                    </span>
                  </>
                )}

                {breadcrumbs.map((crumb, idx) => (
                  <React.Fragment key={idx}>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600 shrink-0" />
                    {crumb.href ? (
                      <Link
                        href={crumb.href}
                        className="hover:text-slate-900 dark:hover:text-white transition-colors truncate max-w-[120px] sm:max-w-none"
                      >
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className="text-slate-800 dark:text-slate-200 font-semibold truncate max-w-[150px] sm:max-w-none">
                        {crumb.label}
                      </span>
                    )}
                  </React.Fragment>
                ))}
              </nav>
            </div>

            {/* Right: Notifications, Badge, Theme & User Menu */}
            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
              {/* Official Role Badge */}
              <div className="hidden lg:block">
                <Badge variant={badgeConfig.variant} size="sm" className="font-mono text-[10px]">
                  {badgeConfig.label}
                </Badge>
              </div>

              {/* Dark / Light Theme Toggle */}
              <ThemeToggle variant="icon" />

              {/* Notification Center Popover */}
              <div className="relative" id="notifications-container">
                <button
                  type="button"
                  onClick={() => {
                    setIsNotificationOpen((prev) => !prev);
                    setIsUserMenuOpen(false);
                  }}
                  className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/80 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500"
                  aria-label="View notifications"
                  aria-expanded={isNotificationOpen}
                >
                  <Bell className="w-4 h-4" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-teal-400 ring-2 ring-white dark:ring-[#0b1a2e]" />
                </button>

                {isNotificationOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-[#0b1a2e] border border-slate-200 dark:border-slate-700/80 shadow-2xl p-4 text-xs z-50 animate-slide-down">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-teal-500 dark:text-teal-400" />
                        <span className="font-bold text-slate-900 dark:text-white text-sm">System Notifications</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsNotificationOpen(false)}
                        className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg"
                        aria-label="Close notifications"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="py-3 space-y-3">
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 flex gap-3">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="text-slate-900 dark:text-white font-medium">Parallel Clearance Engine Online</p>
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                            All 8 departmental review units (Registrar, Finance, Library, Dormitory, Cafeteria, Bookstore, Loan, Faculty) are active.
                          </p>
                          <span className="text-[10px] text-slate-500 font-mono block">2025/2026 Academic Term</span>
                        </div>
                      </div>

                      {activeRequestsCount !== undefined && activeRequestsCount > 0 && (
                        <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-500/30 flex gap-3">
                          <Clock className="w-4 h-4 text-blue-500 dark:text-blue-400 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <p className="text-slate-900 dark:text-white font-medium">Active Clearance Requests</p>
                            <p className="text-[11px] text-slate-600 dark:text-slate-300">
                              You have {activeRequestsCount} clearance application(s) currently being processed.
                            </p>
                            <Link
                              href="/student/requests"
                              onClick={() => setIsNotificationOpen(false)}
                              className="text-[11px] text-teal-600 dark:text-teal-400 hover:underline inline-flex items-center gap-1 font-semibold pt-1"
                            >
                              <span>View My Requests</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-center">
                      <span className="text-[10px] text-slate-500">
                        Dire Dawa University ICT Directorate Security Feed
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* User Account Menu Dropdown */}
              <div className="relative" id="user-menu-container">
                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen((prev) => !prev);
                    setIsNotificationOpen(false);
                  }}
                  className="flex items-center gap-2 p-1 sm:p-1.5 rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-800/80 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500"
                  aria-label="User account menu"
                  aria-expanded={isUserMenuOpen}
                >
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-teal-500 text-white font-bold text-xs flex items-center justify-center shadow-md">
                    {role === "STUDENT" ? (
                      <GraduationCap className="w-4 h-4" />
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-100 max-w-[120px] truncate">
                      {fullName}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 max-w-[120px] truncate font-mono">
                      {studentId ? studentId : role.replace(/_/g, " ")}
                    </div>
                  </div>
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white dark:bg-[#0b1a2e] border border-slate-200 dark:border-slate-700/80 shadow-2xl p-4 text-xs z-50 animate-slide-down space-y-3">
                    <div className="pb-3 border-b border-slate-200 dark:border-slate-800">
                      <div className="text-sm font-bold text-slate-900 dark:text-white truncate">{fullName}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate mt-0.5">{userEmail}</div>
                      {studentId && (
                        <div className="text-[11px] text-teal-600 dark:text-teal-400 font-mono mt-1">
                          Student ID: {studentId}
                        </div>
                      )}
                      {(college || department) && (
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                          {department || college}
                        </div>
                      )}
                      <div className="mt-2.5">
                        <Badge variant={badgeConfig.variant} size="sm">
                          {badgeConfig.label}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 flex items-center gap-2 text-[11px] text-slate-700 dark:text-slate-300">
                        <ShieldCheck className="w-4 h-4 text-teal-500 dark:text-teal-400" />
                        <span>Authorized Session Active</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                      <form action="/auth/signout" method="POST">
                        <Button
                          type="submit"
                          variant="outline"
                          size="sm"
                          className="w-full justify-center text-xs border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:border-rose-300 dark:hover:border-rose-500/50 hover:text-rose-700 dark:hover:text-rose-200"
                        >
                          <LogOut className="w-3.5 h-3.5 mr-1.5" />
                          <span>Sign Out</span>
                        </Button>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Main Scrollable Content */}
          <main className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-8 animate-fade-in">
            <div className="max-w-6xl mx-auto space-y-6">
              {children}
            </div>
          </main>

          {/* Consistent Institutional Footer */}
          <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-[#060e1a] px-6 py-4 text-center sm:flex sm:items-center sm:justify-between text-xs text-slate-500 dark:text-slate-400 shrink-0">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <UniversityCrest size={18} />
              <span>Dire Dawa University • Digital Clearance Management System (DCMS)</span>
            </div>
            <div className="mt-2 sm:mt-0 font-mono text-[11px] text-slate-500 dark:text-slate-400">
              Official Portal • Academic Year 2025/2026
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
