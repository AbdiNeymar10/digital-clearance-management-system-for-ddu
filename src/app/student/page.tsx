import * as React from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { requireRole } from "@/lib/auth/authorization";
import { getStudentRequests } from "@/lib/actions/clearance-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  GraduationCap,
  ShieldCheck,
  PlusCircle,
  FileText,
  Building,
  ArrowRight,
  Sparkles,
  Clock,
  CheckCircle2,
  BookOpen,
  Receipt,
  Utensils,
  BookMarked,
  Coins,
} from "lucide-react";

export default async function StudentDashboardPage() {
  const auth = await requireRole("STUDENT", "/student");

  const studentName = auth?.profile.full_name || "Kenenisa Tsegaye Bekele";
  const studentEmail = auth?.profile.email || "kenenisa.tsegaye@student.ddu.edu.et";
  const studentId = auth?.profile.student_id || "DDU/14829/12";
  const studentCollege = auth?.profile.college || "College of Computing and Informatics";
  const studentDepartment = auth?.profile.department || "Software Engineering";
  const isActive = auth?.profile.is_active ?? true;

  const reqRes = await getStudentRequests();
  const requests = reqRes.success && reqRes.data ? reqRes.data : [];
  const activeRequest = requests.find((r) =>
    ["SUBMITTED", "UNDER_REVIEW", "ACTION_REQUIRED", "READY_FOR_REGISTRAR"].includes(r.status)
  );

  const unitsList = [
    { code: "REGISTRAR", name: "University Registrar", icon: GraduationCap, scope: "Final clearance certification and official transcript release" },
    { code: "FINANCE", name: "Cost Sharing & Finance", icon: Receipt, scope: "Tuition settlement, non-cafe claims, and property liability receipt" },
    { code: "LIBRARY", name: "Library System", icon: BookOpen, scope: "Circulation accountability, borrowed book returns & library dues" },
    { code: "DORMITORY", name: "Student Housing", icon: Building, scope: "Hostel room inspection, room key surrender & locker audit" },
    { code: "CAFETERIA", name: "Food & Dining Services", icon: Utensils, scope: "Meal card deactivation and cafeteria utensil returns" },
    { code: "BOOKSTORE", name: "University Bookstore", icon: BookMarked, scope: "Curriculum text surrender and course laboratory manual verification" },
    { code: "STUDENT_LOAN", name: "Student Loan Desk", icon: Coins, scope: "National cost-sharing contract signing and loan beneficiary records" },
    { code: "FACULTY_OFFICES", name: "Faculty & Academic Offices", icon: ShieldCheck, scope: "Academic advisor sign-off, capstone repository, and Dean approval" },
  ];

  return (
    <DashboardShell
      role="STUDENT"
      title="Student Clearance Portal"
      breadcrumbs={[{ label: "Student Portal" }]}
      userEmail={studentEmail}
      fullName={studentName}
      studentId={studentId}
      college={studentCollege}
      department={studentDepartment}
      activeRequestsCount={activeRequest ? 1 : 0}
    >
      {/* Page Header */}
      <PageHeader
        title="Student Clearance Portal"
        description="Official digital clearance management system for Dire Dawa University. Submit and monitor multi-unit institutional clearances in real-time."
        icon={GraduationCap}
        badgeText={isActive ? "Account Active" : "Suspended"}
        badgeVariant={isActive ? "cleared" : "action_required"}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/student/requests/new">
              <Button variant="primary" size="sm" className="bg-blue-600 hover:bg-blue-500 font-semibold shadow-md">
                <PlusCircle className="w-4 h-4 mr-1.5" />
                <span>New Application</span>
              </Button>
            </Link>
            <Link href="/student/requests">
              <Button variant="outline-light" size="sm">
                <FileText className="w-4 h-4 mr-1.5" />
                <span>My Requests ({requests.length})</span>
              </Button>
            </Link>
          </div>
        }
      />

      {/* Student Profile Identity Banner */}
      <div className="ddu-glass-card rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-slate-800">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600/30 to-teal-500/20 border border-blue-500/40 text-blue-400 flex items-center justify-center font-bold text-xl shrink-0 shadow-inner">
            <GraduationCap className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl font-bold text-white tracking-tight">
                {studentName}
              </h2>
              <Badge variant="cleared" size="sm">
                Verified Student
              </Badge>
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-2 font-mono flex-wrap">
              <span className="text-teal-400 font-semibold">ID: {studentId}</span>
              <span>•</span>
              <span>{studentCollege}</span>
              <span>•</span>
              <span>{studentDepartment}</span>
            </p>
          </div>
        </div>

        <div className="px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 font-medium flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-teal-400" />
          <span>Role: STUDENT</span>
        </div>
      </div>

      {/* Statistics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Clearance Status"
          value={activeRequest ? "In Progress" : requests.length > 0 ? "Processed" : "Not Started"}
          subtitle={activeRequest ? activeRequest.clearance_type_name : "Ready to apply"}
          icon={Clock}
          variant={activeRequest ? "teal" : "blue"}
          badgeText={activeRequest ? activeRequest.status.replace(/_/g, " ") : undefined}
          href={activeRequest ? `/student/requests/${activeRequest.id}` : "/student/requests/new"}
        />

        <StatCard
          title="Cleared Units"
          value={activeRequest ? `${activeRequest.cleared_tasks_count} / ${activeRequest.total_tasks_count || 8}` : "0 / 8"}
          subtitle="Mandatory clearance units"
          icon={CheckCircle2}
          variant="emerald"
          badgeText="Parallel Engine"
          href={activeRequest ? `/student/requests/${activeRequest.id}` : undefined}
        />

        <StatCard
          title="Total Requests"
          value={requests.length}
          subtitle="Submitted applications & drafts"
          icon={FileText}
          variant="indigo"
          badgeText="Records"
          href="/student/requests"
        />

        <StatCard
          title="Mandatory Units"
          value="8 Units"
          subtitle="Concurrent parallel audit"
          icon={Building}
          variant="amber"
          badgeText="Zero Exemptions"
          href="#units-guide"
        />
      </div>

      {/* Active Clearance Request Quick Tile (if exists) */}
      {activeRequest ? (
        <div className="bg-gradient-to-r from-blue-950/90 via-[#0b1a2e] to-teal-950/40 border border-blue-500/40 rounded-2xl p-6 shadow-2xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-blue-500/20 pb-4">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-teal-500" />
              </span>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Active Clearance Application In Progress
                </h3>
                <span className="text-xs text-slate-400">
                  Application ID: <span className="font-mono text-slate-300">{activeRequest.id}</span>
                </span>
              </div>
            </div>
            <Badge variant="in_review" size="md">
              {activeRequest.status.replace(/_/g, " ")}
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Clearance Type</span>
              <span className="text-white font-bold text-sm block mt-0.5">{activeRequest.clearance_type_name}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Academic Term</span>
              <span className="text-slate-200 font-semibold text-sm block mt-0.5">{activeRequest.academic_term_name}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Unit Verification</span>
              <span className="text-teal-400 font-bold font-mono text-sm block mt-0.5">
                {activeRequest.cleared_tasks_count} of {activeRequest.total_tasks_count || 8} Units Cleared
              </span>
            </div>
          </div>

          {/* Visual Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Overall Department Clearance Progress</span>
              <span className="font-mono text-teal-400 font-semibold">
                {Math.round(((activeRequest.cleared_tasks_count || 0) / (activeRequest.total_tasks_count || 8)) * 100)}%
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-teal-400 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.max(
                    5,
                    Math.round(((activeRequest.cleared_tasks_count || 0) / (activeRequest.total_tasks_count || 8)) * 100)
                  )}%`,
                }}
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Link href={`/student/requests/${activeRequest.id}`}>
              <Button variant="primary" size="sm" className="bg-blue-600 hover:bg-blue-500 font-semibold shadow-lg">
                <span>View Department Tasks & Sign-offs</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        /* Start Request CTA */
        <div className="ddu-glass-card border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2 text-teal-400 font-semibold text-xs tracking-wider uppercase">
              <Sparkles className="w-4 h-4" />
              <span>Digital Clearance Application System</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Initiate Your Digital University Clearance
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Choose between Graduation, Withdrawal, or Transfer. Submitting creates parallel review tasks across all 8 required university units simultaneously with zero physical paperwork.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <Link href="/student/requests/new" className="w-full sm:w-auto">
              <Button variant="primary" size="md" className="bg-blue-600 hover:bg-blue-500 font-bold w-full sm:w-auto shadow-lg shadow-blue-900/30">
                <PlusCircle className="w-4 h-4 mr-2" />
                <span>Start New Application</span>
              </Button>
            </Link>

            <Link href="/student/requests" className="w-full sm:w-auto">
              <Button variant="outline-light" size="md" className="w-full sm:w-auto">
                <FileText className="w-4 h-4 mr-2" />
                <span>View Requests ({requests.length})</span>
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Recent Clearance Requests Table Preview */}
      {requests.length > 0 && (
        <div className="ddu-glass-card border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" />
                <span>Recent Clearance Applications</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                History of digital clearance submissions and their current statuses.
              </p>
            </div>
            <Link href="/student/requests">
              <Button variant="ghost" size="sm" className="text-teal-400 hover:text-teal-300 text-xs">
                <span>View All ({requests.length})</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800/80 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Academic Term</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Cleared Units</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {requests.slice(0, 3).map((req) => (
                  <tr key={req.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-3 font-semibold text-white">
                      {req.clearance_type_name}
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      {req.academic_term_name}
                    </td>
                    <td className="py-3 px-3">
                      <Badge
                        variant={
                          req.status === "APPROVED"
                            ? "cleared"
                            : req.status === "REJECTED" || req.status === "ACTION_REQUIRED"
                            ? "action_required"
                            : req.status === "DRAFT"
                            ? "neutral"
                            : "in_review"
                        }
                        size="sm"
                      >
                        {req.status.replace(/_/g, " ")}
                      </Badge>
                    </td>
                    <td className="py-3 px-3 font-mono text-teal-400">
                      {req.cleared_tasks_count} / {req.total_tasks_count || 8} Cleared
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Link href={`/student/requests/${req.id}`}>
                        <Button variant="outline-light" size="sm" className="text-[11px] h-7 px-2.5">
                          <span>Details</span>
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 8 Required Units Architecture Card */}
      <div id="units-guide" className="ddu-glass-card border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Building className="w-4 h-4 text-blue-400" />
              <span>The 8 Mandatory Clearance Review Units</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              All 8 university departments conduct accountability and liability checks concurrently in parallel.
            </p>
          </div>
          <Badge variant="neutral" size="sm" className="hidden sm:inline-flex font-mono text-[10px]">
            No Exemptions
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {unitsList.map((unit) => {
            const UnitIcon = unit.icon;
            return (
              <div
                key={unit.code}
                className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-2 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-teal-400 font-mono font-semibold">
                    {unit.code}
                  </span>
                  <UnitIcon className="w-4 h-4 text-slate-500" />
                </div>
                <div className="text-white font-semibold text-xs">
                  {unit.name}
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {unit.scope}
                </p>
                <div className="pt-1 text-[10px] text-teal-500 font-mono">
                  Concurrent Parallel Check
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardShell>
  );
}
