import * as React from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { requireRole } from "@/lib/auth/authorization";
import { getStudentRequests } from "@/lib/actions/clearance-actions";
import { StudentRequestsListClient } from "@/components/student/StudentRequestsListClient";

export default async function StudentRequestsPage() {
  const auth = await requireRole("STUDENT", "/student/requests");

  const studentName = auth?.profile.full_name || "Kenenisa Tsegaye Bekele";
  const studentEmail = auth?.profile.email || "kenenisa.tsegaye@student.ddu.edu.et";
  const studentId = auth?.profile.student_id || "DDU/14829/12";
  const studentCollege = auth?.profile.college || "College of Computing and Informatics";
  const studentDepartment = auth?.profile.department || "Software Engineering";

  const res = await getStudentRequests();
  const requests = res.success && res.data ? res.data : [];
  const activeCount = requests.filter((r) =>
    ["SUBMITTED", "UNDER_REVIEW", "ACTION_REQUIRED", "READY_FOR_REGISTRAR"].includes(r.status)
  ).length;

  return (
    <DashboardShell
      role="STUDENT"
      title="My Clearance Requests"
      breadcrumbs={[
        { label: "Student Portal", href: "/student" },
        { label: "My Requests" },
      ]}
      userEmail={studentEmail}
      fullName={studentName}
      studentId={studentId}
      college={studentCollege}
      department={studentDepartment}
      activeRequestsCount={activeCount}
    >
      <StudentRequestsListClient
        initialRequests={requests}
        studentName={studentName}
        studentId={studentId}
      />
    </DashboardShell>
  );
}
