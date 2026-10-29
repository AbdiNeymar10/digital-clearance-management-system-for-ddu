import * as React from "react";
import { requireRole } from "@/lib/auth/authorization";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StudentManagementClient } from "@/components/admin/StudentManagementClient";
import { getStudentAccountsList } from "@/lib/actions/student-actions";
import { ShieldAlert, UserPlus } from "lucide-react";

export default async function AdminStudentsPage() {
  const auth = await requireRole(["ADMINISTRATOR", "REGISTRAR"], "/admin/students");

  const userRole = (auth?.profile.role || "ADMINISTRATOR") as "ADMINISTRATOR" | "REGISTRAR";
  const userEmail = auth?.profile.email || "staff.officer@ddu.edu.et";
  const userName = auth?.profile.full_name || (userRole === "REGISTRAR" ? "Office of the University Registrar" : "System Administrator");

  const initialStudents = await getStudentAccountsList();

  const parentBreadcrumb =
    userRole === "REGISTRAR"
      ? { label: "University Registrar", href: "/registrar" }
      : { label: "System Administration", href: "/admin" };

  return (
    <DashboardShell
      role={userRole}
      title="Student Account Provisioning"
      breadcrumbs={[parentBreadcrumb, { label: "Student Provisioning Desk" }]}
      userEmail={userEmail}
      fullName={userName}
    >
      {/* Page Header */}
      <PageHeader
        title="Student Account Provisioning"
        description="Provision graduating and withdrawing student records, dispatch secure single-use 72-hour activation links, and audit claiming status."
        icon={UserPlus}
        badgeText={`${initialStudents.length} Students`}
        badgeVariant="info"
      />

      {/* Governance Scope Notice */}
      <div className="p-4 rounded-xl bg-[#0b1a2e] border border-blue-500/30 text-xs text-slate-300 flex items-start gap-3 shadow-lg">
        <ShieldAlert className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-semibold text-white block">
            Authorized Account Management Authority ({userRole})
          </span>
          <p className="text-slate-300/90 leading-relaxed text-[11px]">
            The Registrar and Administrator hold permission to provision student accounts and dispatch secure 72-hour activation links. In accordance with university policy, student provisioning does not grant authority to override individual departmental clearance sign-offs.
          </p>
        </div>
      </div>

      {/* Client Account Management Interface */}
      <StudentManagementClient
        initialStudents={initialStudents}
        userRole={userRole}
        userEmail={userEmail}
      />
    </DashboardShell>
  );
}
