import * as React from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { requireRole } from "@/lib/auth/authorization";
import { getClearanceRequestDetail } from "@/lib/actions/clearance-actions";
import { StudentRequestDetailClient } from "@/components/student/StudentRequestDetailClient";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StudentRequestDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function StudentRequestDetailPage({
  params,
}: StudentRequestDetailPageProps) {
  const auth = await requireRole("STUDENT", "/student/requests");
  const { id } = await params;

  const studentName = auth?.profile.full_name || "Kenenisa Tsegaye Bekele";
  const studentEmail = auth?.profile.email || "kenenisa.tsegaye@student.ddu.edu.et";
  const studentId = auth?.profile.student_id || "DDU/14829/12";
  const studentCollege = auth?.profile.college || "College of Computing and Informatics";
  const studentDepartment = auth?.profile.department || "Software Engineering";
  const profileId = auth?.profile.id || "student-dev-kenenisa";

  const res = await getClearanceRequestDetail(id);

  if (!res.success || !res.data) {
    return (
      <DashboardShell
        role="STUDENT"
        title="Application Details"
        breadcrumbs={[
          { label: "Student Portal", href: "/student" },
          { label: "My Requests", href: "/student/requests" },
          { label: "Not Found" },
        ]}
        userEmail={studentEmail}
        fullName={studentName}
        studentId={studentId}
        college={studentCollege}
        department={studentDepartment}
      >
        <div className="max-w-md mx-auto my-12 text-center space-y-4">
          <div className="bg-[#0b1a2e] border border-slate-800 rounded-2xl p-8 shadow-xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-400 mx-auto flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-white">Clearance Request Not Found</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                {res.error || "The requested clearance application does not exist or you do not have permission to view it."}
              </p>
            </div>
            <div className="pt-2">
              <Link href="/student/requests">
                <Button variant="primary" size="sm" className="bg-blue-600 hover:bg-blue-500">
                  <ArrowLeft className="w-4 h-4 mr-1.5" />
                  <span>Return to My Requests</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </DashboardShell>
    );
  }

  const isOwner = res.data.student_id === profileId;

  return (
    <DashboardShell
      role="STUDENT"
      title="Application Details"
      breadcrumbs={[
        { label: "Student Portal", href: "/student" },
        { label: "My Requests", href: "/student/requests" },
        { label: `${res.data.clearance_type?.name || "Clearance"} (${res.data.id.slice(0, 8)})` },
      ]}
      userEmail={studentEmail}
      fullName={studentName}
      studentId={studentId}
      college={studentCollege}
      department={studentDepartment}
    >
      <StudentRequestDetailClient
        request={res.data}
        isStudentOwner={isOwner}
        userRole="STUDENT"
      />
    </DashboardShell>
  );
}
