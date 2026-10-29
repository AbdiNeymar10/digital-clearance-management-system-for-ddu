import * as React from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { requireRole } from "@/lib/auth/authorization";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Search,
  Filter,
  FileText,
  Award,
} from "lucide-react";

export default async function DepartmentDashboardPage() {
  const auth = await requireRole("DEPARTMENT_STAFF", "/department");

  const staffName = auth?.profile.full_name || "Tadesse Hailu (Circulation Head)";
  const staffEmail = auth?.profile.email || "tadesse.hailu@ddu.edu.et";
  const isActive = auth?.profile.is_active ?? true;

  // Attempt to fetch live department tasks if Supabase is configured
  let totalTasks = 0;
  let pendingTasks = 0;
  let clearedTasks = 0;
  let liabilityTasks = 0;
  let assignedDepartmentName = "University Library System";
  let assignedDepartmentCode = "LIBRARY";

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerSupabaseClient();
      
      // Query staff assignment if exists
      if (auth?.profile.id) {
        const { data: assignment } = await supabase
          .from("department_staff_assignments")
          .select("department_id, departments(name, code)")
          .eq("staff_id", auth.profile.id)
          .maybeSingle();

        if (assignment && assignment.departments) {
          const dept = assignment.departments as unknown as { name: string; code: string };
          assignedDepartmentName = dept.name;
          assignedDepartmentCode = dept.code;
        }
      }

      // Query real tasks count
      const { data: tasks } = await supabase
        .from("clearance_department_tasks")
        .select("status");

      if (tasks) {
        totalTasks = tasks.length;
        pendingTasks = tasks.filter((t) => t.status === "PENDING" || t.status === "IN_REVIEW").length;
        clearedTasks = tasks.filter((t) => t.status === "CLEARED").length;
        liabilityTasks = tasks.filter((t) => t.status === "HAS_LIABILITY").length;
      }
    } catch (e) {
      console.warn("Department dashboard task query:", e);
    }
  }

  return (
    <DashboardShell
      role="DEPARTMENT_STAFF"
      title="Department Review Desk"
      breadcrumbs={[{ label: "Department Staff" }, { label: "Review Console" }]}
      userEmail={staffEmail}
      fullName={staffName}
      department={assignedDepartmentName}
    >
      {/* Page Header */}
      <PageHeader
        title="Department Review Desk"
        description="Verify student asset returns, record liabilities, and approve department-level clearances concurrently in parallel."
        icon={Building2}
        badgeText={isActive ? "Authorized Officer" : "Suspended"}
        badgeVariant={isActive ? "in_review" : "action_required"}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="in_review" size="md" className="font-mono text-xs">
              Unit: {assignedDepartmentCode}
            </Badge>
          </div>
        }
      />

      {/* Staff Identity & Assigned Clearance Unit Card */}
      <div className="ddu-glass-card rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-slate-800">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-600/30 to-amber-500/10 border border-amber-500/40 text-amber-400 flex items-center justify-center font-bold text-xl shrink-0">
            <Building2 className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl font-bold text-white tracking-tight">
                {staffName}
              </h2>
              <Badge variant="in_review" size="sm">
                Active Staff Reviewer
              </Badge>
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-2 font-mono flex-wrap">
              <span>{staffEmail}</span>
              <span>•</span>
              <span className="text-teal-400 font-semibold">{assignedDepartmentName}</span>
              <span>•</span>
              <span>Main Campus</span>
            </p>
          </div>
        </div>

        <div className="px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 font-medium flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-amber-400" />
          <span>Role: DEPARTMENT_STAFF</span>
        </div>
      </div>

      {/* Statistics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Assigned Unit"
          value={assignedDepartmentCode}
          subtitle={assignedDepartmentName}
          icon={Building2}
          variant="amber"
          badgeText="Unit Reviewer"
        />

        <StatCard
          title="Pending Queue"
          value={pendingTasks}
          subtitle="Awaiting staff accountability audit"
          icon={Clock}
          variant="blue"
          badgeText={pendingTasks > 0 ? "Requires Action" : "Caught Up"}
        />

        <StatCard
          title="Cleared Approvals"
          value={clearedTasks}
          subtitle="Signed-off clearance records"
          icon={CheckCircle2}
          variant="emerald"
          badgeText="Completed"
        />

        <StatCard
          title="Active Liabilities"
          value={liabilityTasks}
          subtitle="Outstanding dues or missing items"
          icon={AlertTriangle}
          variant="indigo"
          badgeText="Holds Recorded"
        />
      </div>

      {/* Department Review Queue Console */}
      <div className="ddu-glass-card rounded-2xl p-6 shadow-xl border border-slate-800 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-400" />
              <span>Pending Student Clearance Reviews ({pendingTasks})</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live departmental verification queue for students registered under current academic term.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="neutral" size="sm" className="font-mono text-xs">
              Term: 2025/2026-T1
            </Badge>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950/70 p-3 rounded-xl border border-slate-800">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Student ID or name..."
              disabled
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-300 placeholder:text-slate-500 cursor-not-allowed opacity-80"
              title="Search active when student queue is populated"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400 w-full sm:w-auto overflow-x-auto">
            <Filter className="w-3.5 h-3.5" />
            <span className="font-medium">Filter:</span>
            <span className="px-2.5 py-1 rounded-md bg-blue-600 text-white font-semibold text-[11px]">
              All Queue ({totalTasks})
            </span>
            <span className="px-2.5 py-1 rounded-md text-slate-400 hover:text-slate-200 text-[11px]">
              Pending ({pendingTasks})
            </span>
            <span className="px-2.5 py-1 rounded-md text-slate-400 hover:text-slate-200 text-[11px]">
              Cleared ({clearedTasks})
            </span>
          </div>
        </div>

        {/* Empty State / Live Queue */}
        {totalTasks === 0 ? (
          <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-amber-600/10 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white">No Clearance Tasks Pending Review</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                When students submit their clearance applications for this academic term, your department ({assignedDepartmentName}) will receive parallel verification tasks automatically.
              </p>
            </div>
            <div className="pt-1">
              <span className="inline-flex items-center gap-1.5 text-[11px] text-teal-400 font-mono bg-teal-950/40 border border-teal-500/20 px-3 py-1 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Department Review Pipeline Active & Ready</span>
              </span>
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-400">
            {totalTasks} task records in database.
          </div>
        )}
      </div>

      {/* Assigned Unit Details & Accountability Card */}
      <div id="assigned-unit" className="ddu-glass-card rounded-2xl p-6 shadow-xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5 text-white font-bold text-base">
            <BookOpen className="w-4 h-4 text-teal-400" />
            <h3>Assigned Clearance Unit Scope: {assignedDepartmentName}</h3>
          </div>
          <Badge variant="cleared" size="sm">
            Unit Code: {assignedDepartmentCode}
          </Badge>
        </div>

        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          As authorized review staff for <strong>{assignedDepartmentName}</strong>, your verification establishes that the departing student holds zero outstanding institutional encumbrances with your directorate.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
            <span className="text-[10px] text-teal-400 font-mono font-semibold uppercase">1. Custody Check</span>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Verify all borrowed equipment, textbooks, lockers, keys, or meal cards are surrendered in good order.
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
            <span className="text-[10px] text-amber-400 font-mono font-semibold uppercase">2. Liability Recording</span>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              If property is lost or damaged, enter specific remarks so the student can settle reimbursement at Finance.
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
            <span className="text-[10px] text-emerald-400 font-mono font-semibold uppercase">3. Parallel Clearance</span>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Your sign-off immediately updates the student&apos;s real-time progress toward final Registrar clearance release.
            </p>
          </div>
        </div>
      </div>

      {/* Review Guidelines & Standards Card */}
      <div id="guidelines" className="ddu-glass-card rounded-2xl p-6 shadow-xl border border-slate-800 space-y-4">
        <div className="flex items-center gap-2.5 text-white font-bold text-base border-b border-slate-800 pb-3">
          <Award className="w-4 h-4 text-amber-400" />
          <h3>Institutional Review Protocol (Dire Dawa University DCMS)</h3>
        </div>

        <div className="space-y-2 text-xs text-slate-300">
          <ul className="list-disc list-inside space-y-1.5 text-slate-300/90 leading-relaxed">
            <li>Review decisions must be completed within <strong>48 hours</strong> of student submission.</li>
            <li>All hold entries must specify concrete action items (e.g., &quot;Return Vol 2 Microelectronics to Main Library Desk 3&quot;).</li>
            <li>Every decision is immutably timestamped with your authenticated officer identity in PostgreSQL audit logs.</li>
            <li>Staff permissions are isolated strictly to this assigned department.</li>
          </ul>
        </div>
      </div>
    </DashboardShell>
  );
}
