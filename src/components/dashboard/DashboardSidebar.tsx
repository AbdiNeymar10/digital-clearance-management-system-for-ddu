"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UniversityCrest } from "@/components/ui/university-crest";
import { Badge } from "@/components/ui/badge";
import type { UserRole } from "@/types/database";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  Building2,
  Award,
  Scale,
  ShieldAlert,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  X,
  LogOut,
  User,
  GraduationCap,
  Sparkles,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number | null;
  badgeVariant?: "info" | "cleared" | "in_review" | "action_required" | "neutral" | "demo";
  description?: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

interface DashboardSidebarProps {
  role: UserRole;
  userEmail?: string;
  fullName?: string;
  studentId?: string | null;
  college?: string | null;
  department?: string | null;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  activeRequestsCount?: number;
}

export function DashboardSidebar({
  role,
  userEmail = "user@ddu.edu.et",
  fullName = "Authenticated User",
  studentId,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  activeRequestsCount,
}: DashboardSidebarProps) {
  const pathname = usePathname();

  // Escape key handler for mobile drawer
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMobileOpen) {
        onCloseMobile();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileOpen, onCloseMobile]);

  // Role badges configuration
  const roleMeta: Record<
    UserRole,
    { title: string; subtitle: string; portalBadge: string; badgeVariant: "info" | "cleared" | "in_review" | "demo" }
  > = {
    STUDENT: {
      title: "Student Portal",
      subtitle: "Undergraduate Clearance",
      portalBadge: "Student",
      badgeVariant: "info",
    },
    DEPARTMENT_STAFF: {
      title: "Staff Review Desk",
      subtitle: "Departmental Clearance",
      portalBadge: "Staff",
      badgeVariant: "in_review",
    },
    REGISTRAR: {
      title: "Registrar Directorate",
      subtitle: "Academic Authority",
      portalBadge: "Registrar",
      badgeVariant: "cleared",
    },
    ADMINISTRATOR: {
      title: "ICT Administration",
      subtitle: "System Management",
      portalBadge: "Administrator",
      badgeVariant: "demo",
    },
  };

  const currentRoleMeta = roleMeta[role] || roleMeta.STUDENT;

  // Build role-aware navigation items that strictly use real routes
  const getNavGroups = (): NavGroup[] => {
    switch (role) {
      case "STUDENT":
        return [
          {
            label: "CLEARANCE WORKFLOW",
            items: [
              {
                title: "Dashboard Overview",
                href: "/student",
                icon: LayoutDashboard,
                description: "Student profile, active clearance overview, and quick status",
              },
              {
                title: "My Clearance Requests",
                href: "/student/requests",
                icon: FileText,
                badge: activeRequestsCount !== undefined && activeRequestsCount > 0 ? activeRequestsCount : null,
                badgeVariant: "info",
                description: "View submitted and historical clearance applications",
              },
              {
                title: "Start New Application",
                href: "/student/requests/new",
                icon: PlusCircle,
                description: "Initiate graduation, withdrawal, or transfer clearance",
              },
            ],
          },
          {
            label: "UNIVERSITY GUIDES",
            items: [
              {
                title: "8 Mandatory Units",
                href: "/student#units-guide",
                icon: Building2,
                description: "Parallel accountability responsibilities across all 8 directorates",
              },
            ],
          },
        ];

      case "DEPARTMENT_STAFF":
        return [
          {
            label: "DEPARTMENT WORKFLOW",
            items: [
              {
                title: "Review Console",
                href: "/department",
                icon: LayoutDashboard,
                description: "Department clearance review desk and accountability audit",
              },
              {
                title: "Assigned Unit Details",
                href: "/department#assigned-unit",
                icon: Building2,
                description: "Clearance unit institutional responsibilities and scope",
              },
              {
                title: "Review Standards",
                href: "/department#guidelines",
                icon: Award,
                description: "Institutional clearance sign-off and liability audit guidelines",
              },
            ],
          },
        ];

      case "REGISTRAR":
        return [
          {
            label: "REGISTRAR DIRECTORS",
            items: [
              {
                title: "Clearance Governance",
                href: "/registrar",
                icon: LayoutDashboard,
                description: "Final clearance certification and graduation cohort audit",
              },
              {
                title: "Student Provisioning",
                href: "/admin/students",
                icon: UserPlus,
                description: "Provision student accounts & dispatch 72-hour claim links",
              },
              {
                title: "Institutional Authority",
                href: "/registrar#governance",
                icon: Award,
                description: "Statutory governance and certificate release policies",
              },
              {
                title: "Unit Audits & Reports",
                href: "/registrar#unit-audits",
                icon: Scale,
                description: "8-department parallel audit verification metrics",
              },
            ],
          },
        ];

      case "ADMINISTRATOR":
        return [
          {
            label: "SYSTEM ADMINISTRATION",
            items: [
              {
                title: "Administration Console",
                href: "/admin",
                icon: LayoutDashboard,
                description: "System health, database integrity, and RLS security policies",
              },
              {
                title: "Student Provisioning",
                href: "/admin/students",
                icon: UserPlus,
                description: "Account creation, claim link reissuance, and directory audit",
              },
              {
                title: "Institutional Units",
                href: "/admin#departments",
                icon: Building2,
                description: "The 8 mandatory university clearance departments",
              },
              {
                title: "Security & Audit Logs",
                href: "/admin#audit-logs",
                icon: ShieldAlert,
                description: "PostgreSQL immutable audit trail and security isolation",
              },
            ],
          },
        ];

      default:
        return [];
    }
  };

  const navGroups = getNavGroups();

  const isRouteActive = (href: string) => {
    if (href.includes("#")) {
      const basePath = href.split("#")[0];
      return pathname === basePath;
    }
    if (href === "/student" || href === "/department" || href === "/registrar" || href === "/admin") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  // Reusable Sidebar Content for both desktop and mobile
  const renderSidebarContent = (isMobile = false) => {
    const collapsed = isMobile ? false : isCollapsed;

    return (
      <div className="flex flex-col h-full bg-white dark:bg-[#07111e] border-r border-slate-200 dark:border-slate-800/80 text-slate-700 dark:text-slate-200 transition-colors">
        {/* Brand Header */}
        <div
          className={cn(
            "h-16 flex items-center border-b border-slate-200 dark:border-slate-800/80 px-4 transition-all duration-300",
            collapsed ? "justify-center" : "justify-between"
          )}
        >
          <Link
            href="/"
            className="flex items-center gap-3 group focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg p-1"
            title="Dire Dawa University DCMS Home"
          >
            <div className="relative">
              <UniversityCrest size={collapsed ? 34 : 36} className="group-hover:scale-105 transition-transform" />
              <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#07111e]" />
            </div>
            {!collapsed && (
              <div className="animate-fade-in truncate">
                <div className="text-slate-900 dark:text-white font-bold text-sm tracking-tight leading-none truncate">
                  Dire Dawa University
                </div>
                <div className="text-[11px] text-teal-600 dark:text-teal-400 font-medium flex items-center gap-1.5 mt-1">
                  <span>DDU DCMS</span>
                  <span className="w-1 h-1 rounded-full bg-slate-400 dark:bg-slate-600" />
                  <span className="text-slate-500 dark:text-slate-400 text-[10px]">Portal</span>
                </div>
              </div>
            )}
          </Link>

          {/* Close button on mobile */}
          {isMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-label="Close navigation menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Role Identity Pill (When Expanded) */}
        {!collapsed && (
          <div className="p-3.5 m-3 rounded-xl bg-slate-100/80 dark:bg-gradient-to-r dark:from-slate-900 dark:to-[#0b1a2e] border border-slate-200 dark:border-slate-800/80 shadow-inner flex items-center justify-between">
            <div className="truncate">
              <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                AUTHENTICATED AS
              </div>
              <div className="text-xs font-bold text-slate-900 dark:text-white truncate flex items-center gap-1.5 mt-0.5">
                <Sparkles className="w-3 h-3 text-teal-500 dark:text-teal-400 shrink-0" />
                <span className="truncate">{currentRoleMeta.title}</span>
              </div>
            </div>
            <Badge variant={currentRoleMeta.badgeVariant} size="sm" className="shrink-0 font-mono text-[10px]">
              {currentRoleMeta.portalBadge}
            </Badge>
          </div>
        )}

        {/* Navigation Items */}
        <nav
          className="flex-1 overflow-y-auto px-2.5 py-3 space-y-6 custom-scrollbar"
          aria-label="Main Navigation"
        >
          {navGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-1.5">
              {!collapsed && (
                <div className="px-3 text-[10px] font-bold text-slate-400 dark:text-slate-400/90 uppercase tracking-wider">
                  {group.label}
                </div>
              )}

              <ul className="space-y-1" role="list">
                {group.items.map((item) => {
                  const active = isRouteActive(item.href);
                  const Icon = item.icon;

                  return (
                    <li key={item.href} className="relative group">
                      <Link
                        href={item.href}
                        onClick={() => {
                          if (isMobile) onCloseMobile();
                        }}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 relative focus-visible:ring-2 focus-visible:ring-blue-500",
                          active
                            ? "bg-blue-50 text-blue-700 border border-blue-200 font-semibold shadow-xs dark:bg-blue-600/20 dark:text-white dark:border-blue-500/30 dark:shadow-md ddu-active-pill"
                            : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-transparent",
                          collapsed && "justify-center px-2 py-3"
                        )}
                        aria-current={active ? "page" : undefined}
                      >
                        <Icon
                          className={cn(
                            "w-4 h-4 shrink-0 transition-colors",
                            active
                              ? "text-blue-600 dark:text-blue-400"
                              : "text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200"
                          )}
                        />

                        {!collapsed && (
                          <span className="truncate flex-1 tracking-tight">
                            {item.title}
                          </span>
                        )}

                        {!collapsed && item.badge !== undefined && item.badge !== null && (
                          <Badge
                            variant={item.badgeVariant || "info"}
                            size="sm"
                            className="ml-auto font-mono text-[10px] px-1.5 py-0.2"
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </Link>

                      {/* Tooltip for collapsed desktop sidebar */}
                      {collapsed && !isMobile && (
                        <div
                          role="tooltip"
                          className="absolute left-full top-1/2 -translate-y-1/2 ml-3.5 px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700/80 rounded-xl shadow-2xl text-xs text-slate-900 dark:text-white whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity z-50 flex items-center gap-2"
                        >
                          <span className="font-semibold">{item.title}</span>
                          {item.badge !== undefined && item.badge !== null && (
                            <Badge variant={item.badgeVariant || "info"} size="sm">
                              {item.badge}
                            </Badge>
                          )}
                          <div className="w-2 h-2 bg-white dark:bg-slate-950 border-l border-b border-slate-200 dark:border-slate-700/80 absolute -left-1 top-1/2 -translate-y-1/2 rotate-45" />
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* User Profile & Sign Out Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-950/60 space-y-2">
          {!collapsed ? (
            <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5 truncate">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-600/20 border border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
                  {role === "STUDENT" ? (
                    <GraduationCap className="w-4 h-4" />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                </div>
                <div className="truncate">
                  <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                    {fullName}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate">
                    {studentId ? `ID: ${studentId}` : userEmail}
                  </div>
                </div>
              </div>

              <form action="/auth/signout" method="POST" className="shrink-0">
                <button
                  type="submit"
                  title="Sign out of account"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200 dark:hover:border-rose-800/50 transition-colors focus-visible:ring-2 focus-visible:ring-rose-500"
                  aria-label="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </form>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div
                className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-600/20 border border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold"
                title={`${fullName} (${role})`}
              >
                {fullName.charAt(0)}
              </div>
              <form action="/auth/signout" method="POST">
                <button
                  type="submit"
                  title="Sign Out"
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors focus-visible:ring-2 focus-visible:ring-rose-500"
                  aria-label="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* Collapse/Expand Toggle on Desktop */}
          {!isMobile && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className={cn(
                "w-full flex items-center justify-center gap-2 py-1.5 rounded-lg text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500",
                collapsed ? "px-1" : "px-3"
              )}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <>
                  <ChevronLeft className="w-4 h-4" />
                  <span>Collapse Navigation</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Desktop Sticky Sidebar with animated width transition */}
      <aside
        className={cn(
          "hidden md:block sticky top-0 h-screen z-30 transition-all duration-300 ease-in-out shrink-0 select-none",
          isCollapsed ? "w-20" : "w-64"
        )}
      >
        {renderSidebarContent(false)}
      </aside>

      {/* Mobile Drawer (with backdrop overlay & accessible slide-in) */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 flex"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation Drawer"
        >
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity animate-fade-in"
            onClick={onCloseMobile}
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-slide-in-left">
            {renderSidebarContent(true)}
          </div>
        </div>
      )}
    </>
  );
}
