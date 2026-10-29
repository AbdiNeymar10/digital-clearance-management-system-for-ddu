import * as React from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { requireRole } from "@/lib/auth/authorization";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { getStudentAccountsList } from "@/lib/actions/student-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Award,
  ShieldCheck,
  Scale,
  UserPlus,
  Users,
  CheckCircle2,
  Clock,
  FileCheck,
  ArrowRight,
  GraduationCap,
  Sparkles,
} from "lucide-react";

export default async function RegistrarDashboardPage() {
  const auth = await requireRole("REGISTRAR", "/registrar");

  const officerName = auth?.profile.full_name || "Office of the University Registrar Desk";
  const officerEmail = auth?.profile.email || "registrar.officer@ddu.edu.et";
  const isActive = auth?.profile.is_active ?? true;

  // Live Supabase metrics
  let totalRequests = 0;
  let readyForRegistrar = 0;
  let approvedRequests = 0;
  let underReviewRequests = 0;
  let studentsCount = 0;

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerSupabaseClient();
      const { data: reqs } = await supabase.from("clearance_requests").select("status");
      if (reqs) {
        totalRequests = reqs.length;
        readyForRegistrar = reqs.filter((r) => r.status === "READY_FOR_REGISTRAR").length;
        approvedRequests = reqs.filter((r) => r.status === "APPROVED").length;
        underReviewRequests = reqs.filter((r) =>
          ["SUBMITTED", "UNDER_REVIEW", "ACTION_REQUIRED"].includes(r.status)
        ).length;
      }
      const students = await getStudentAccountsList();
      studentsCount = students.length;
    } catch (e) {
      console.warn("Registrar query:", e);
    }
  }

  return (
    <DashboardShell
      role="REGISTRAR"
      title="Registrar Directorate Console"
      breadcrumbs={[{ label: "University Registrar" }, { label: "Clearance Governance" }]}
      userEmail={officerEmail}
      fullName={officerName}
    >
      {/* Page Header */}
      <PageHeader
        title="Office of the University Registrar"
        description="Institutional academic authority desk for Dire Dawa University. Exercise final clearance sign-off authority and manage student provisioning."
        icon={Award}
        badgeText={isActive ? "Official Academic Authority" : "Suspended"}
        badgeVariant={isActive ? "cleared" : "action_required"}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="neutral" size="sm" className="font-mono text-xs hidden sm:inline-flex">
              Total Applications: {totalRequests}
            </Badge>
            <Link href="/admin/students">
              <Button variant="primary" size="sm" className="bg-blue-600 hover:bg-blue-500 font-semibold shadow-md">
                <UserPlus className="w-4 h-4 mr-1.5" />
                <span>Student Account Provisioning</span>
              </Button>
            </Link>
          </div>
        }
      />

      {/* Profile & Institutional Authority Banner */}
      <div className="ddu-glass-card rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-slate-800">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-600/30 to-blue-500/20 border border-teal-500/40 text-teal-400 flex items-center justify-center font-bold text-xl shrink-0">
            <Award className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl font-bold text-white tracking-tight">
                {officerName}
              </h2>
              <Badge variant="cleared" size="sm">
                Academic Authority Active
              </Badge>
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-2 font-mono flex-wrap">
              <span>{officerEmail}</span>
              <span>•</span>
              <span className="text-teal-400 font-semibold">Office of the Registrar</span>
              <span>•</span>
              <span>Main Campus Administration</span>
            </p>
          </div>
        </div>

        <div className="px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 font-medium flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-teal-400" />
          <span>Role: REGISTRAR</span>
        </div>
      </div>

      {/* Institutional Statistics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Ready For Final Seal"
          value={readyForRegistrar}
          subtitle="All 8 units cleared by departments"
          icon={CheckCircle2}
          variant="teal"
          badgeText={readyForRegistrar > 0 ? "Action Required" : "Up to Date"}
        />

        <StatCard
          title="Under Review"
          value={underReviewRequests}
          subtitle="Departing cohort applications"
          icon={Clock}
          variant="amber"
          badgeText="In Progress"
        />

        <StatCard
          title="Approved Certificates"
          value={approvedRequests}
          subtitle="Final official sign-offs issued"
          icon={FileCheck}
          variant="emerald"
          badgeText="Released"
        />

        <StatCard
          title="Provisioned Students"
          value={studentsCount}
          subtitle="Active student directory"
          icon={Users}
          variant="blue"
          badgeText="Provisioning Desk"
          href="/admin/students"
        />
      </div>

      {/* Quick Action: Student Provisioning Integration */}
      <div className="bg-gradient-to-r from-blue-950/80 via-[#0b1a2e] to-teal-950/40 border border-blue-500/30 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center gap-2 text-teal-400 font-semibold text-xs tracking-wider uppercase">
            <Sparkles className="w-4 h-4" />
            <span>Authorized Registrar Function</span>
          </div>
          <h3 className="text-lg font-bold text-white tracking-tight">
            Student Account Provisioning & Activation Desk
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            The Registrar holds institutional permission to provision graduating and withdrawing students, register academic program details, and dispatch secure 72-hour account claim links.
          </p>
        </div>

        <Link href="/admin/students">
          <Button variant="primary" size="md" className="bg-blue-600 hover:bg-blue-500 font-bold shadow-lg shadow-blue-900/30 whitespace-nowrap">
            <UserPlus className="w-4 h-4 mr-2" />
            <span>Open Student Management Desk</span>
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </Link>
      </div>

      {/* Institutional Governance Callout */}
      <div id="governance" className="p-5 rounded-2xl bg-[#0b1a2e] border border-teal-500/30 text-xs text-slate-300 flex items-start gap-4 shadow-lg">
        <Scale className="w-6 h-6 text-teal-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-white">Institutional Governance & Separation of Powers</h4>
          <p className="text-slate-300/90 leading-relaxed">
            Under Dire Dawa University academic governance, the Registrar exercises exclusive authority over the issuance of final academic clearance certificates, official transcripts, and graduation clearances. System administration, role configuration, and database maintenance remain strictly isolated within the Administrator role.
          </p>
        </div>
      </div>

      {/* 8 Mandatory Units Clearance Audit Card */}
      <div id="unit-audits" className="ddu-glass-card rounded-2xl p-6 shadow-xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-white font-bold text-base">
            <GraduationCap className="w-4 h-4 text-teal-400" />
            <h3>The 8-Department Clearance Audit Standard</h3>
          </div>
          <Badge variant="neutral" size="sm" className="font-mono text-[10px]">
            Academic Senate Regulation
          </Badge>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Before the Registrar issues a final Digital Clearance Certificate, the student application must attain explicit approval across all 8 university clearance units concurrently:
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {[
            { code: "REGISTRAR", name: "1. Registrar Directorate" },
            { code: "FINANCE", name: "2. Cost Sharing & Finance" },
            { code: "LIBRARY", name: "3. Library System" },
            { code: "DORMITORY", name: "4. Student Housing" },
            { code: "CAFETERIA", name: "5. Cafeteria Services" },
            { code: "BOOKSTORE", name: "6. University Bookstore" },
            { code: "STUDENT_LOAN", name: "7. Student Loan Desk" },
            { code: "FACULTY_OFFICES", name: "8. Faculty & Academic" },
          ].map((unit) => (
            <div
              key={unit.code}
              className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-1"
            >
              <div className="text-[10px] text-teal-400 font-mono font-semibold">
                {unit.code}
              </div>
              <div className="text-white font-medium text-xs truncate">
                {unit.name}
              </div>
              <div className="text-[10px] text-slate-500">
                Parallel Review
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}
