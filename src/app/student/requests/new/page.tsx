import * as React from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { requireRole } from "@/lib/auth/authorization";
import {
  getClearanceConfig,
  getClearanceRequestDetail,
} from "@/lib/actions/clearance-actions";
import { StudentRequestFormClient } from "@/components/student/StudentRequestFormClient";

interface NewClearanceRequestPageProps {
  searchParams: Promise<{ draftId?: string }>;
}

export default async function NewClearanceRequestPage({
  searchParams,
}: NewClearanceRequestPageProps) {
  const auth = await requireRole("STUDENT", "/student/requests/new");
  const { draftId } = await searchParams;

  const studentName = auth?.profile.full_name || "Kenenisa Tsegaye Bekele";
  const studentEmail = auth?.profile.email || "kenenisa.tsegaye@student.ddu.edu.et";
  const studentId = auth?.profile.student_id || "DDU/14829/12";
  const studentCollege = auth?.profile.college || "College of Computing and Informatics";
  const studentDepartment = auth?.profile.department || "Software Engineering";

  // Load types & active terms
  const configRes = await getClearanceConfig();
  const types = configRes.success && configRes.data ? configRes.data.types : [];
  const terms = configRes.success && configRes.data ? configRes.data.terms : [];

  // If editing an existing draft, fetch its details
  let initialDraft = null;
  if (draftId) {
    const draftRes = await getClearanceRequestDetail(draftId);
    if (draftRes.success && draftRes.data && draftRes.data.status === "DRAFT") {
      initialDraft = draftRes.data;
    }
  }

  return (
    <DashboardShell
      role="STUDENT"
      title="Submit Clearance Application"
      breadcrumbs={[
        { label: "Student Portal", href: "/student" },
        { label: "My Requests", href: "/student/requests" },
        { label: initialDraft ? "Edit Draft" : "New Application" },
      ]}
      userEmail={studentEmail}
      fullName={studentName}
      studentId={studentId}
      college={studentCollege}
      department={studentDepartment}
    >
      <StudentRequestFormClient
        types={types}
        terms={terms}
        studentName={studentName}
        studentId={studentId}
        studentEmail={studentEmail}
        studentCollege={studentCollege}
        studentDepartment={studentDepartment}
        initialDraft={initialDraft}
      />
    </DashboardShell>
  );
}
