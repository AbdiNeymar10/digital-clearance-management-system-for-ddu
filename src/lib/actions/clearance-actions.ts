"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { getAuthenticatedUserAndProfile } from "@/lib/auth/authorization";
import type {
  ClearanceRequestStatus,
  ClearanceTypeCode,
  DepartmentTaskStatus,
} from "@/types/database";

export interface ClearanceTypeItem {
  id: string;
  code: ClearanceTypeCode;
  name: string;
  description: string | null;
  is_active: boolean;
}

export interface AcademicTermItem {
  id: string;
  code: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  is_available_for_new_requests: boolean;
}

export interface DepartmentTaskItem {
  id: string;
  department_id: string;
  department_name: string;
  department_code: string;
  status: DepartmentTaskStatus;
  decision_notes: string | null;
  decided_at: string | null;
  decided_by_name?: string | null;
}

export interface AuditLogItem {
  id: string;
  action: string;
  from_status: string | null;
  to_status: string | null;
  actor_name: string;
  details: Record<string, unknown> | null;
  created_at: string;
}

export interface ClearanceRequestDetail {
  id: string;
  student_id: string;
  student_name: string;
  student_number: string;
  student_email: string;
  student_college: string | null;
  student_department: string | null;
  clearance_type: ClearanceTypeItem;
  academic_term: AcademicTermItem;
  status: ClearanceRequestStatus;
  student_notes: string | null;
  phone_number: string | null;
  submitted_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  tasks: DepartmentTaskItem[];
  audit_logs: AuditLogItem[];
}

export interface ClearanceRequestSummary {
  id: string;
  status: ClearanceRequestStatus;
  clearance_type_name: string;
  clearance_type_code: ClearanceTypeCode;
  academic_term_name: string;
  academic_term_code: string;
  submitted_at: string | null;
  created_at: string;
  cleared_tasks_count: number;
  total_tasks_count: number;
}

export interface SaveDraftInput {
  requestId?: string;
  clearanceTypeId: string;
  academicTermId: string;
  studentNotes?: string;
  phoneNumber?: string;
}

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// =============================================================================
// Development In-Memory Store (Simulates Database Behavior when Supabase is unconfigured)
// =============================================================================

const SEED_TERMS: AcademicTermItem[] = [
  {
    id: "term-2025-2026-t1",
    code: "2025-2026-T1",
    name: "2025/2026 Academic Year — Semester I",
    start_date: "2025-10-01",
    end_date: "2026-02-15",
    is_available_for_new_requests: true,
  },
  {
    id: "term-2025-2026-t2",
    code: "2025-2026-T2",
    name: "2025/2026 Academic Year — Semester II",
    start_date: "2026-02-23",
    end_date: "2026-07-15",
    is_available_for_new_requests: true,
  },
  {
    id: "term-2024-2025-t2",
    code: "2024-2025-T2",
    name: "2024/2025 Academic Year — Semester II (Closed)",
    start_date: "2025-02-20",
    end_date: "2025-07-10",
    is_available_for_new_requests: false,
  },
];

const SEED_CLEARANCE_TYPES: ClearanceTypeItem[] = [
  {
    id: "type-graduation",
    code: "GRADUATION",
    name: "Graduation Clearance",
    description: "Formal clearance procedure for students completing degree requirements to graduate.",
    is_active: true,
  },
  {
    id: "type-withdrawal",
    code: "WITHDRAWAL",
    name: "Withdrawal Clearance",
    description: "Institutional clearance for students voluntarily withdrawing or terminating academic registration.",
    is_active: true,
  },
  {
    id: "type-transfer",
    code: "TRANSFER",
    name: "Transfer Clearance",
    description: "Clearance for students formally transferring to another university or higher learning institution.",
    is_active: true,
  },
];

const SEED_DEPARTMENTS = [
  { id: "dept-1", code: "REGISTRAR", name: "Office of the University Registrar" },
  { id: "dept-2", code: "FINANCE", name: "Cost Sharing & University Finance" },
  { id: "dept-3", code: "LIBRARY", name: "University Library System" },
  { id: "dept-4", code: "DORMITORY", name: "Student Housing & Dormitory" },
  { id: "dept-5", code: "CAFETERIA", name: "Student Cafeteria & Food Services" },
  { id: "dept-6", code: "BOOKSTORE", name: "University Bookstore" },
  { id: "dept-7", code: "STUDENT_LOAN", name: "Student Loan & Cost Sharing" },
  { id: "dept-8", code: "FACULTY_OFFICES", name: "Faculty & Academic Offices" },
];

interface MockRequestRecord {
  id: string;
  student_id: string;
  clearance_type_id: string;
  academic_term_id: string;
  status: ClearanceRequestStatus;
  student_notes: string | null;
  phone_number: string | null;
  submitted_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  tasks: DepartmentTaskItem[];
  audit_logs: AuditLogItem[];
}

const mockRequestsStore: Map<string, MockRequestRecord> = new Map();

// Helper to check active status
function isActiveRequestStatus(status: ClearanceRequestStatus): boolean {
  return ["SUBMITTED", "UNDER_REVIEW", "ACTION_REQUIRED", "READY_FOR_REGISTRAR"].includes(status);
}

// Fallback student profile for local development
const FALLBACK_STUDENT = {
  id: "student-dev-kenenisa",
  full_name: "Kenenisa Tsegaye Bekele",
  student_id: "DDU/14829/12",
  email: "kenenisa.tsegaye@student.ddu.edu.et",
  college: "College of Computing and Informatics",
  department: "Software Engineering",
  role: "STUDENT" as const,
  is_active: true,
};

// =============================================================================
// 1. Get Available Clearance Types & Academic Terms
// =============================================================================
export async function getClearanceConfig(): Promise<ActionResult<{
  types: ClearanceTypeItem[];
  terms: AcademicTermItem[];
}>> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerSupabaseClient();

      const [typesRes, termsRes] = await Promise.all([
        supabase
          .from("clearance_types")
          .select("*")
          .eq("is_active", true)
          .order("name", { ascending: true }),
        supabase
          .from("academic_terms")
          .select("*")
          .order("created_at", { ascending: false }),
      ]);

      if (typesRes.error) throw typesRes.error;
      if (termsRes.error) throw termsRes.error;

      return {
        success: true,
        data: {
          types: (typesRes.data as ClearanceTypeItem[]) || [],
          terms: (termsRes.data as AcademicTermItem[]) || [],
        },
      };
    } catch (err) {
      console.error("Failed to load clearance configuration from Supabase:", err);
      // Fallback to seeds if DB query fails
    }
  }

  return {
    success: true,
    data: {
      types: SEED_CLEARANCE_TYPES,
      terms: SEED_TERMS,
    },
  };
}

// =============================================================================
// 2. List Authenticated Student's Requests
// =============================================================================
export async function getStudentRequests(): Promise<ActionResult<ClearanceRequestSummary[]>> {
  let studentId = FALLBACK_STUDENT.id;

  const auth = await getAuthenticatedUserAndProfile();
  if (auth.state === "authenticated") {
    studentId = auth.profile.id;
  }

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerSupabaseClient();

      const { data, error } = await supabase
        .from("clearance_requests")
        .select(`
          id,
          status,
          submitted_at,
          created_at,
          clearance_types (
            name,
            code
          ),
          academic_terms (
            name,
            code
          ),
          clearance_department_tasks (
            id,
            status
          )
        `)
        .eq("student_id", studentId)
        .order("created_at", { ascending: false });

      if (error) throw error;

interface SupabaseRequestSummaryRow {
  id: string;
  status: ClearanceRequestStatus;
  submitted_at: string | null;
  created_at: string;
  clearance_types: { name: string; code: ClearanceTypeCode } | null;
  academic_terms: { name: string; code: string } | null;
  clearance_department_tasks: { id: string; status: DepartmentTaskStatus }[] | null;
}

      const summaries: ClearanceRequestSummary[] = (
        (data as unknown as SupabaseRequestSummaryRow[]) || []
      ).map((row) => {
        const tasks = row.clearance_department_tasks || [];
        const clearedCount = tasks.filter((t) => t.status === "CLEARED").length;

        return {
          id: row.id,
          status: row.status,
          clearance_type_name: row.clearance_types?.name || "Clearance",
          clearance_type_code: row.clearance_types?.code || "GRADUATION",
          academic_term_name: row.academic_terms?.name || "Academic Term",
          academic_term_code: row.academic_terms?.code || "TERM",
          submitted_at: row.submitted_at,
          created_at: row.created_at,
          cleared_tasks_count: clearedCount,
          total_tasks_count: tasks.length,
        };
      });

      return { success: true, data: summaries };
    } catch (err) {
      console.error("Error fetching student requests from Supabase:", err);
    }
  }

  // Fallback to in-memory store
  const userRequests: ClearanceRequestSummary[] = Array.from(mockRequestsStore.values())
    .filter((r) => r.student_id === studentId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .map((r) => {
      const type = SEED_CLEARANCE_TYPES.find((t) => t.id === r.clearance_type_id) || SEED_CLEARANCE_TYPES[0];
      const term = SEED_TERMS.find((t) => t.id === r.academic_term_id) || SEED_TERMS[0];
      const cleared = r.tasks.filter((t) => t.status === "CLEARED").length;

      return {
        id: r.id,
        status: r.status,
        clearance_type_name: type.name,
        clearance_type_code: type.code,
        academic_term_name: term.name,
        academic_term_code: term.code,
        submitted_at: r.submitted_at,
        created_at: r.created_at,
        cleared_tasks_count: cleared,
        total_tasks_count: r.tasks.length,
      };
    });

  return { success: true, data: userRequests };
}

// =============================================================================
// 3. Get Single Request Details & Decision History
// =============================================================================
export async function getClearanceRequestDetail(
  requestId: string
): Promise<ActionResult<ClearanceRequestDetail>> {
  if (!requestId || requestId.trim().length === 0) {
    return { success: false, error: "Missing required request identifier." };
  }

  let studentId = FALLBACK_STUDENT.id;
  let isStaffOrAdmin = false;

  const auth = await getAuthenticatedUserAndProfile();
  if (auth.state === "authenticated") {
    studentId = auth.profile.id;
    isStaffOrAdmin = ["ADMINISTRATOR", "REGISTRAR", "DEPARTMENT_STAFF"].includes(auth.profile.role);
  }

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerSupabaseClient();

      const { data: rawReq, error } = await supabase
        .from("clearance_requests")
        .select(`
          *,
          profiles!clearance_requests_student_id_fkey (
            id,
            full_name,
            student_id,
            email,
            college,
            department
          ),
          clearance_types (*),
          academic_terms (*),
          clearance_department_tasks (
            id,
            department_id,
            status,
            decision_notes,
            decided_at,
            departments (
              name,
              code
            )
          ),
          clearance_audit_logs (
            id,
            action,
            from_status,
            to_status,
            details,
            created_at,
            profiles (
              full_name
            )
          )
        `)
        .eq("id", requestId)
        .single();

      interface SupabaseTaskRow {
        id: string;
        department_id: string;
        status: DepartmentTaskStatus;
        decision_notes: string | null;
        decided_at: string | null;
        departments: { name: string; code: string } | null;
      }

      interface SupabaseAuditRow {
        id: string;
        action: string;
        from_status: string | null;
        to_status: string | null;
        details: Record<string, unknown> | null;
        created_at: string;
        profiles: { full_name: string } | null;
      }

      interface SupabaseRequestDetailRow {
        id: string;
        student_id: string;
        clearance_type_id: string;
        academic_term_id: string;
        status: ClearanceRequestStatus;
        student_notes: string | null;
        phone_number: string | null;
        submitted_at: string | null;
        cancelled_at: string | null;
        cancellation_reason: string | null;
        approved_at: string | null;
        rejected_at: string | null;
        rejection_reason: string | null;
        created_at: string;
        updated_at: string;
        profiles: {
          id: string;
          full_name: string;
          student_id: string | null;
          email: string;
          college: string | null;
          department: string | null;
        } | null;
        clearance_types: ClearanceTypeItem;
        academic_terms: AcademicTermItem;
        clearance_department_tasks: SupabaseTaskRow[] | null;
        clearance_audit_logs: SupabaseAuditRow[] | null;
      }

      if (error || !rawReq) {
        return { success: false, error: "Clearance request not found or access denied." };
      }

      const req = rawReq as unknown as SupabaseRequestDetailRow;

      // Authorization guard: Student can only view their own requests
      if (!isStaffOrAdmin && req.student_id !== studentId) {
        return { success: false, error: "Unauthorized: You do not have permission to view this clearance request." };
      }

      const tasks: DepartmentTaskItem[] = (
        (req.clearance_department_tasks as unknown as SupabaseTaskRow[]) || []
      ).map((t) => ({
        id: t.id,
        department_id: t.department_id,
        department_name: t.departments?.name || "Department",
        department_code: t.departments?.code || "DEPT",
        status: t.status,
        decision_notes: t.decision_notes,
        decided_at: t.decided_at,
      }));

      const auditLogs: AuditLogItem[] = (
        (req.clearance_audit_logs as unknown as SupabaseAuditRow[]) || []
      )
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .map((l) => ({
          id: l.id,
          action: l.action,
          from_status: l.from_status,
          to_status: l.to_status,
          actor_name: l.profiles?.full_name || "System",
          details: l.details,
          created_at: l.created_at,
        }));

      return {
        success: true,
        data: {
          id: req.id,
          student_id: req.student_id,
          student_name: req.profiles?.full_name || "Student",
          student_number: req.profiles?.student_id || "N/A",
          student_email: req.profiles?.email || "",
          student_college: req.profiles?.college ?? null,
          student_department: req.profiles?.department ?? null,
          clearance_type: req.clearance_types,
          academic_term: req.academic_terms,
          status: req.status,
          student_notes: req.student_notes,
          phone_number: req.phone_number,
          submitted_at: req.submitted_at,
          cancelled_at: req.cancelled_at,
          cancellation_reason: req.cancellation_reason,
          approved_at: req.approved_at,
          rejected_at: req.rejected_at,
          rejection_reason: req.rejection_reason,
          created_at: req.created_at,
          updated_at: req.updated_at,
          tasks,
          audit_logs: auditLogs,
        },
      };
    } catch (err) {
      console.error("Error fetching request details from Supabase:", err);
    }
  }

  // Fallback to in-memory store
  const mockReq = mockRequestsStore.get(requestId);
  if (!mockReq) {
    return { success: false, error: "Clearance request record not found." };
  }

  if (!isStaffOrAdmin && mockReq.student_id !== studentId) {
    return { success: false, error: "Unauthorized: You do not have permission to view this clearance request." };
  }

  const type = SEED_CLEARANCE_TYPES.find((t) => t.id === mockReq.clearance_type_id) || SEED_CLEARANCE_TYPES[0];
  const term = SEED_TERMS.find((t) => t.id === mockReq.academic_term_id) || SEED_TERMS[0];

  return {
    success: true,
    data: {
      id: mockReq.id,
      student_id: mockReq.student_id,
      student_name: FALLBACK_STUDENT.full_name,
      student_number: FALLBACK_STUDENT.student_id,
      student_email: FALLBACK_STUDENT.email,
      student_college: FALLBACK_STUDENT.college,
      student_department: FALLBACK_STUDENT.department,
      clearance_type: type,
      academic_term: term,
      status: mockReq.status,
      student_notes: mockReq.student_notes,
      phone_number: mockReq.phone_number,
      submitted_at: mockReq.submitted_at,
      cancelled_at: mockReq.cancelled_at,
      cancellation_reason: mockReq.cancellation_reason,
      approved_at: mockReq.approved_at,
      rejected_at: mockReq.rejected_at,
      rejection_reason: mockReq.rejection_reason,
      created_at: mockReq.created_at,
      updated_at: mockReq.updated_at,
      tasks: mockReq.tasks,
      audit_logs: mockReq.audit_logs,
    },
  };
}

// =============================================================================
// 4. Save Incomplete Draft Request
// =============================================================================
export async function saveClearanceDraft(
  input: SaveDraftInput
): Promise<ActionResult<{ requestId: string; isNew: boolean }>> {
  let studentId = FALLBACK_STUDENT.id;
  let actorName = FALLBACK_STUDENT.full_name;

  const auth = await getAuthenticatedUserAndProfile();
  if (auth.state === "authenticated") {
    studentId = auth.profile.id;
    actorName = auth.profile.full_name;
  }

  // Basic validation
  if (!input.clearanceTypeId) {
    return { success: false, error: "Please select a clearance type." };
  }
  if (!input.academicTermId) {
    return { success: false, error: "Please select an academic term." };
  }

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerSupabaseClient();

      if (input.requestId) {
        // Update existing owned draft
        const { data: updated, error } = await supabase
          .from("clearance_requests")
          .update({
            clearance_type_id: input.clearanceTypeId,
            academic_term_id: input.academicTermId,
            student_notes: input.studentNotes || null,
            phone_number: input.phoneNumber || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", input.requestId)
          .eq("student_id", studentId)
          .eq("status", "DRAFT")
          .select("id")
          .single();

        if (error || !updated) {
          return {
            success: false,
            error: "Unable to update draft. Ensure the request exists and is still in DRAFT status.",
          };
        }

        // Add audit record
        await supabase.from("clearance_audit_logs").insert({
          request_id: updated.id,
          actor_id: studentId,
          action: "DRAFT_UPDATED",
          from_status: "DRAFT",
          to_status: "DRAFT",
          details: { updated_at: new Date().toISOString() },
        });

        revalidatePath("/student/requests");
        return { success: true, data: { requestId: updated.id, isNew: false } };
      } else {
        // Insert brand new draft
        const { data: created, error } = await supabase
          .from("clearance_requests")
          .insert({
            student_id: studentId,
            clearance_type_id: input.clearanceTypeId,
            academic_term_id: input.academicTermId,
            status: "DRAFT",
            student_notes: input.studentNotes || null,
            phone_number: input.phoneNumber || null,
          })
          .select("id")
          .single();

        if (error || !created) {
          return { success: false, error: `Failed to create draft: ${error?.message || "Unknown error"}` };
        }

        // Add audit record
        await supabase.from("clearance_audit_logs").insert({
          request_id: created.id,
          actor_id: studentId,
          action: "DRAFT_CREATED",
          from_status: null,
          to_status: "DRAFT",
          details: { created_at: new Date().toISOString() },
        });

        revalidatePath("/student/requests");
        return { success: true, data: { requestId: created.id, isNew: true } };
      }
    } catch (err) {
      console.error("Error saving draft in Supabase:", err);
      return { success: false, error: err instanceof Error ? err.message : "Database error while saving draft." };
    }
  }

  // Fallback in-memory draft saving
  if (input.requestId) {
    const existing = mockRequestsStore.get(input.requestId);
    if (!existing || existing.student_id !== studentId) {
      return { success: false, error: "Draft request not found or not owned by student." };
    }
    if (existing.status !== "DRAFT") {
      return { success: false, error: "Submitted clearance requests cannot be modified as drafts." };
    }

    existing.clearance_type_id = input.clearanceTypeId;
    existing.academic_term_id = input.academicTermId;
    existing.student_notes = input.studentNotes || null;
    existing.phone_number = input.phoneNumber || null;
    existing.updated_at = new Date().toISOString();

    existing.audit_logs.unshift({
      id: `audit-${Date.now()}`,
      action: "DRAFT_UPDATED",
      from_status: "DRAFT",
      to_status: "DRAFT",
      actor_name: actorName,
      details: { updated_at: existing.updated_at },
      created_at: new Date().toISOString(),
    });

    return { success: true, data: { requestId: existing.id, isNew: false } };
  }

  const newId = `req-${Date.now()}`;
  const now = new Date().toISOString();
  const newRecord: MockRequestRecord = {
    id: newId,
    student_id: studentId,
    clearance_type_id: input.clearanceTypeId,
    academic_term_id: input.academicTermId,
    status: "DRAFT",
    student_notes: input.studentNotes || null,
    phone_number: input.phoneNumber || null,
    submitted_at: null,
    cancelled_at: null,
    cancellation_reason: null,
    approved_at: null,
    rejected_at: null,
    rejection_reason: null,
    created_at: now,
    updated_at: now,
    tasks: [], // Drafts do NOT have departmental tasks
    audit_logs: [
      {
        id: `audit-${Date.now()}`,
        action: "DRAFT_CREATED",
        from_status: null,
        to_status: "DRAFT",
        actor_name: actorName,
        details: { created_at: now },
        created_at: now,
      },
    ],
  };

  mockRequestsStore.set(newId, newRecord);
  return { success: true, data: { requestId: newId, isNew: true } };
}

// =============================================================================
// 5. Submit Draft Request (Atomic 8-Department Task Creation & Active Slot Check)
// =============================================================================
export async function submitClearanceRequest(
  requestId: string
): Promise<ActionResult<{ requestId: string; tasksCreated: number }>> {
  if (!requestId || requestId.trim().length === 0) {
    return { success: false, error: "Missing required request identifier." };
  }

  let studentId = FALLBACK_STUDENT.id;
  let actorName = FALLBACK_STUDENT.full_name;

  const auth = await getAuthenticatedUserAndProfile();
  if (auth.state === "authenticated") {
    studentId = auth.profile.id;
    actorName = auth.profile.full_name;
  }

  if (isSupabaseConfigured()) {
    try {
      const adminClient = await createAdminSupabaseClient();

      // Invoke the atomic stored procedure defined in Migration 3
      const { data, error } = await adminClient.rpc("submit_clearance_request", {
        p_request_id: requestId,
        p_actor_id: studentId,
      });

      if (error) {
        // Parse custom database errors and return friendly responses
        if (error.message.includes("ACTIVE_REQUEST_EXISTS")) {
          return {
            success: false,
            error:
              "You already have an active clearance request for this academic term. Each student may have only one active clearance request per term. Please open and review your existing active request.",
          };
        }
        if (error.message.includes("TERM_NOT_AVAILABLE")) {
          return {
            success: false,
            error: "The selected academic term is closed for new clearance submissions.",
          };
        }
        return { success: false, error: error.message };
      }

      revalidatePath("/student/requests");
      revalidatePath(`/student/requests/${requestId}`);

      return {
        success: true,
        data: {
          requestId,
          tasksCreated: data?.[0]?.tasks_created || 8,
        },
      };
    } catch (err) {
      console.error("Error executing atomic submission RPC in Supabase:", err);
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to execute request submission transaction.",
      };
    }
  }

  // Fallback in-memory atomic submission
  const req = mockRequestsStore.get(requestId);
  if (!req) {
    return { success: false, error: "Clearance request record not found." };
  }

  if (req.student_id !== studentId) {
    return { success: false, error: "Unauthorized: You may only submit your own clearance request." };
  }

  if (req.status !== "DRAFT") {
    return {
      success: false,
      error: `Only draft requests can be submitted. Current status: ${req.status}`,
    };
  }

  // Validate academic term availability
  const term = SEED_TERMS.find((t) => t.id === req.academic_term_id);
  if (!term || !term.is_available_for_new_requests) {
    return {
      success: false,
      error: "The selected academic term is not available for new clearance submissions.",
    };
  }

  // Active-request uniqueness rule: 1 active request per student per academic term
  const hasExistingActive = Array.from(mockRequestsStore.values()).some(
    (other) =>
      other.student_id === studentId &&
      other.academic_term_id === req.academic_term_id &&
      other.id !== req.id &&
      isActiveRequestStatus(other.status)
  );

  if (hasExistingActive) {
    return {
      success: false,
      error:
        "You already have an active clearance request for this academic term. Each student may have only one active clearance request per term. Please open and review your existing active request.",
    };
  }

  const now = new Date().toISOString();

  // Atomically initialize all 8 clearance tasks in parallel
  const tasks: DepartmentTaskItem[] = SEED_DEPARTMENTS.map((dept) => ({
    id: `task-${dept.code.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    department_id: dept.id,
    department_code: dept.code,
    department_name: dept.name,
    status: "PENDING",
    decision_notes: null,
    decided_at: null,
  }));

  req.status = "SUBMITTED";
  req.submitted_at = now;
  req.updated_at = now;
  req.tasks = tasks;

  req.audit_logs.unshift({
    id: `audit-${Date.now()}`,
    action: "REQUEST_SUBMITTED",
    from_status: "DRAFT",
    to_status: "SUBMITTED",
    actor_name: actorName,
    details: {
      submitted_at: now,
      tasks_initialized: 8,
      academic_term_id: req.academic_term_id,
    },
    created_at: now,
  });

  return {
    success: true,
    data: {
      requestId: req.id,
      tasksCreated: 8,
    },
  };
}

// =============================================================================
// 6. Cancel Submitted Request (Mandatory Reason & Active Slot Release)
// =============================================================================
export async function cancelClearanceRequest(
  requestId: string,
  reason: string
): Promise<ActionResult<{ requestId: string }>> {
  if (!requestId || requestId.trim().length === 0) {
    return { success: false, error: "Missing required request identifier." };
  }

  const trimmedReason = reason?.trim() || "";
  if (trimmedReason.length < 3) {
    return {
      success: false,
      error: "A valid cancellation reason (minimum 3 characters) is required to cancel a request.",
    };
  }

  let studentId = FALLBACK_STUDENT.id;
  let actorName = FALLBACK_STUDENT.full_name;

  const auth = await getAuthenticatedUserAndProfile();
  if (auth.state === "authenticated") {
    studentId = auth.profile.id;
    actorName = auth.profile.full_name;
  }

  if (isSupabaseConfigured()) {
    try {
      const adminClient = await createAdminSupabaseClient();

      const { error } = await adminClient.rpc("cancel_clearance_request", {
        p_request_id: requestId,
        p_actor_id: studentId,
        p_reason: trimmedReason,
      });

      if (error) {
        if (error.message.includes("CANNOT_CANCEL_APPROVED")) {
          return {
            success: false,
            error: "This clearance request has already received final Registrar approval and cannot be cancelled.",
          };
        }
        return { success: false, error: error.message };
      }

      revalidatePath("/student/requests");
      revalidatePath(`/student/requests/${requestId}`);

      return { success: true, data: { requestId } };
    } catch (err) {
      console.error("Error executing cancellation RPC in Supabase:", err);
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to cancel clearance request.",
      };
    }
  }

  // Fallback in-memory cancellation
  const req = mockRequestsStore.get(requestId);
  if (!req) {
    return { success: false, error: "Clearance request record not found." };
  }

  if (req.student_id !== studentId) {
    return { success: false, error: "Unauthorized: You may only cancel your own clearance request." };
  }

  if (req.status === "APPROVED") {
    return {
      success: false,
      error: "Approved clearance requests cannot be cancelled. Please contact the Registrar for assistance.",
    };
  }

  if (req.status === "CANCELLED") {
    return { success: false, error: "This clearance request is already cancelled." };
  }

  if (req.status === "REJECTED") {
    return { success: false, error: "Rejected requests are already closed and cannot be cancelled." };
  }

  if (req.status === "DRAFT") {
    return {
      success: false,
      error: "Draft requests cannot be cancelled; you may discard or edit the draft.",
    };
  }

  const now = new Date().toISOString();
  const priorStatus = req.status;

  req.status = "CANCELLED";
  req.cancelled_at = now;
  req.cancellation_reason = trimmedReason;
  req.updated_at = now;

  req.audit_logs.unshift({
    id: `audit-${Date.now()}`,
    action: "REQUEST_CANCELLED",
    from_status: priorStatus,
    to_status: "CANCELLED",
    actor_name: actorName,
    details: {
      cancellation_reason: trimmedReason,
      cancelled_at: now,
    },
    created_at: now,
  });

  return { success: true, data: { requestId: req.id } };
}
