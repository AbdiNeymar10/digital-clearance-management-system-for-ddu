import { ClearanceRequestStatus, DepartmentReviewStatus, UserRole } from "./database";

export type { ClearanceRequestStatus, DepartmentReviewStatus, UserRole };

export interface StudentProfile {
  id: string;
  fullName: string;
  studentId: string;
  college: string;
  department: string;
  program: string;
  email: string;
  phone?: string;
  admissionYear: string;
}

export interface DepartmentReviewDetail {
  departmentId: string;
  departmentName: string;
  departmentCode: string;
  status: DepartmentReviewStatus;
  reviewerName?: string;
  reviewedAt?: string;
  remarks?: string;
  holdReason?: string;
}

export interface ClearanceRequestSummary {
  id: string;
  trackingCode: string;
  student: StudentProfile;
  clearanceType: "graduation" | "withdrawal" | "transfer";
  academicYear: string;
  overallStatus: ClearanceRequestStatus;
  submissionDate: string;
  completedDate?: string;
  clearedOfficesCount: number;
  totalOfficesCount: number;
  departments: DepartmentReviewDetail[];
  certificateHash?: string;
}

export interface DepartmentOfficerProfile {
  id: string;
  fullName: string;
  email: string;
  departmentId: string;
  departmentName: string;
  staffRole: "officer" | "head_of_department" | "director";
}
