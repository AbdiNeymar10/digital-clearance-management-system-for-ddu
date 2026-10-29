import * as React from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { requireRole } from "@/lib/auth/authorization";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { getStudentAccountsList } from "@/lib/actions/student-actions";
import { DEPARTMENTS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Settings,
  ShieldAlert,
  ShieldCheck,
  UserPlus,
  Users,
  Building2,
  Lock,
  ArrowRight,
  Database,
  Sparkles,
  CheckCircle2,
  Key,
} from "lucide-react";

export default async function AdminDashboardPage() {
  const auth = await requireRole("ADMINISTRATOR", "/admin");

  const adminName = auth?.profile.full_name || "DDU ICT Directorate Administrator";
  const adminEmail = auth?.profile.email || "system.admin@ddu.edu.et";
  const isActive = auth?.profile.is_active ?? true;

  // Real statistics
  let studentsCount = 0;
  let totalRequests = 0;
  let claimedStudentsCount = 0;

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerSupabaseClient();
      const { data: reqs } = await supabase.from("clearance_requests").select("id");
      if (reqs) totalRequests = reqs.length;

      const students = await getStudentAccountsList();
      studentsCount = students.length;
      claimedStudentsCount = students.filter((s) => s.is_claimed).length;
    } catch (e) {
      console.warn("Admin dashboard query error:", e);
    }
  }

  return (
    <DashboardShell
      role="ADMINISTRATOR"
      title="System Administration Console"
      breadcrumbs={[{ label: "System Administration" }, { label: "Console Overview" }]}
      userEmail={adminEmail}
      fullName={adminName}
    >
      {/* Page Header */}
      <PageHeader
        title="ICT Directorate Administration"
        description="Central system administration, PostgreSQL Row Level Security (RLS) enforcement, and student account lifecycle provisioning."
        icon={Settings}
        badgeText={isActive ? "Root Privileges" : "Suspended"}
        badgeVariant={isActive ? "demo" : "action_required"}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/admin/students">
              <Button variant="primary" size="sm" className="bg-blue-600 hover:bg-blue-500 font-semibold shadow-md">
                <UserPlus className="w-4 h-4 mr-1.5" />
                <span>Student Provisioning Desk</span>
              </Button>
            </Link>
          </div>
        }
      />

      {/* Admin Identity Banner */}
      <div className="ddu-glass-card rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-slate-800">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-600/30 to-blue-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center font-bold text-xl shrink-0">
            <Settings className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl font-bold text-white tracking-tight">
                {adminName}
              </h2>
              <Badge variant="demo" size="sm">
                System Administrator
              </Badge>
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-2 font-mono flex-wrap">
              <span>{adminEmail}</span>
              <span>•</span>
              <span className="text-teal-400 font-semibold">Directorate for ICT</span>
              <span>•</span>
              <span>Central Computing Center</span>
            </p>
          </div>
        </div>

        <div className="px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 font-medium flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-cyan-400" />
          <span>Role: ADMINISTRATOR</span>
        </div>
      </div>

      {/* System Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Student Accounts"
          value={studentsCount}
          subtitle={`${claimedStudentsCount} active claimed accounts`}
          icon={Users}
          variant="indigo"
          badgeText="Directory"
          href="/admin/students"
        />

        <StatCard
          title="Clearance Units"
          value={`${DEPARTMENTS.length} Units`}
          subtitle="Mandatory clearance directorates"
          icon={Building2}
          variant="blue"
          badgeText="Parallel Engine"
          href="#departments"
        />

        <StatCard
          title="Clearance Records"
          value={totalRequests}
          subtitle="Total applications created"
          icon={Database}
          variant="teal"
          badgeText="PostgreSQL"
        />

        <StatCard
          title="RLS Security"
          value="Enforced"
          subtitle="PostgreSQL Row Level Security"
          icon={ShieldCheck}
          variant="emerald"
          badgeText="Privilege Guard"
          href="#audit-logs"
        />
      </div>

      {/* Quick Action: Student Provisioning Desk */}
      <div className="bg-gradient-to-r from-blue-950/80 via-[#0b1a2e] to-teal-950/40 border border-blue-500/30 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center gap-2 text-teal-400 font-semibold text-xs tracking-wider uppercase">
            <Sparkles className="w-4 h-4" />
            <span>Administrative Core Desk</span>
          </div>
          <h3 className="text-lg font-bold text-white tracking-tight">
            Manage Student Accounts & Account Activation Claim Links
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Provision new undergraduate student records, filter account directory by claim status, and dispatch cryptographically secure 72-hour single-use claim tokens.
          </p>
        </div>

        <Link href="/admin/students">
          <Button variant="primary" size="md" className="bg-blue-600 hover:bg-blue-500 font-bold shadow-lg shadow-blue-900/30 whitespace-nowrap">
            <UserPlus className="w-4 h-4 mr-2" />
            <span>Manage Student Accounts</span>
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </Link>
      </div>

      {/* 8 Mandatory Clearance Units Table */}
      <div id="departments" className="ddu-glass-card rounded-2xl p-6 shadow-xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-white font-bold text-base">
            <Building2 className="w-4 h-4 text-cyan-400" />
            <h3>Configured Clearance Departments ({DEPARTMENTS.length} Units)</h3>
          </div>
          <Badge variant="cleared" size="sm">
            All Units Active
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-3">Order</th>
                <th className="py-2.5 px-3">Unit Code</th>
                <th className="py-2.5 px-3">Department Name</th>
                <th className="py-2.5 px-3">Audit Scope</th>
                <th className="py-2.5 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {DEPARTMENTS.map((dept) => (
                <tr key={dept.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-3 text-slate-400">#{dept.order}</td>
                  <td className="py-3 px-3 font-bold text-teal-400">{dept.code}</td>
                  <td className="py-3 px-3 font-sans font-semibold text-white">{dept.name}</td>
                  <td className="py-3 px-3 font-sans text-slate-300 text-[11px] max-w-xs truncate">{dept.scope}</td>
                  <td className="py-3 px-3 text-right">
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 px-2 py-0.5 rounded-full font-sans">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Active</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Security Architecture & PostgreSQL Isolation Notice */}
      <div id="audit-logs" className="ddu-glass-card rounded-2xl p-6 shadow-xl border border-slate-800 space-y-4">
        <div className="flex items-center gap-2.5 text-white font-bold text-base border-b border-slate-800 pb-3">
          <Lock className="w-4 h-4 text-cyan-400" />
          <h3>System Security & PostgreSQL Row Level Security (RLS)</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-1.5 text-cyan-400 font-mono font-semibold">
              <Key className="w-3.5 h-3.5" />
              <span>Cryptographic Hashing</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed font-sans">
              Student account claim tokens are hashed using SHA-256 before storage in PostgreSQL. Plain tokens are never retained.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-1.5 text-teal-400 font-mono font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Privilege Guards</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed font-sans">
              PostgreSQL trigger functions strictly prevent privilege escalation by rejecting client-side role modifications.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-1.5 text-emerald-400 font-mono font-semibold">
              <Database className="w-3.5 h-3.5" />
              <span>Immutable Audit Logs</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed font-sans">
              Department decisions and student claim events generate append-only audit records with authenticated actor IDs and timestamps.
            </p>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
