/**
 * Database schema TypeScript definitions for Supabase PostgreSQL tables.
 * Reflects Prompt 2, Prompt 3, and Prompt 4 migrations:
 * - profiles (extended with is_claimed, claimed_at, college, department)
 * - departments
 * - department_staff_assignments
 * - student_claim_tokens
 * - academic_terms
 * - clearance_types
 * - clearance_requests
 * - clearance_department_tasks
 * - clearance_audit_logs
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole =
  | "STUDENT"
  | "DEPARTMENT_STAFF"
  | "REGISTRAR"
  | "ADMINISTRATOR";

export type ClearanceTypeCode = "GRADUATION" | "WITHDRAWAL" | "TRANSFER";

export type ClearanceRequestStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "ACTION_REQUIRED"
  | "READY_FOR_REGISTRAR"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED";

export type DepartmentTaskStatus =
  | "PENDING"
  | "IN_REVIEW"
  | "CLEARED"
  | "HAS_LIABILITY"
  | "REJECTED";

export type DepartmentReviewStatus =
  | DepartmentTaskStatus
  | "pending"
  | "in_review"
  | "approved"
  | "rejected"
  | "waived";

export type TokenDeliveryStatus = "PENDING" | "SENT" | "FAILED";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          role: UserRole;
          student_id: string | null;
          is_active: boolean;
          is_claimed: boolean;
          claimed_at: string | null;
          college: string | null;
          department: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          role?: UserRole;
          student_id?: string | null;
          is_active?: boolean;
          is_claimed?: boolean;
          claimed_at?: string | null;
          college?: string | null;
          department?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          role?: UserRole;
          student_id?: string | null;
          is_active?: boolean;
          is_claimed?: boolean;
          claimed_at?: string | null;
          college?: string | null;
          department?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      departments: {
        Row: {
          id: string;
          name: string;
          code: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          code: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          code?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      department_staff_assignments: {
        Row: {
          id: string;
          staff_id: string;
          department_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          staff_id: string;
          department_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          staff_id?: string;
          department_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      student_claim_tokens: {
        Row: {
          id: string;
          student_id: string;
          token_hash: string;
          issued_at: string;
          expires_at: string;
          consumed_at: string | null;
          revoked_at: string | null;
          issued_by: string | null;
          delivery_status: TokenDeliveryStatus;
          delivery_error: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          token_hash: string;
          issued_at?: string;
          expires_at?: string;
          consumed_at?: string | null;
          revoked_at?: string | null;
          issued_by?: string | null;
          delivery_status?: TokenDeliveryStatus;
          delivery_error?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          token_hash?: string;
          issued_at?: string;
          expires_at?: string;
          consumed_at?: string | null;
          revoked_at?: string | null;
          issued_by?: string | null;
          delivery_status?: TokenDeliveryStatus;
          delivery_error?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      academic_terms: {
        Row: {
          id: string;
          code: string;
          name: string;
          start_date: string | null;
          end_date: string | null;
          is_available_for_new_requests: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          start_date?: string | null;
          end_date?: string | null;
          is_available_for_new_requests?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          name?: string;
          start_date?: string | null;
          end_date?: string | null;
          is_available_for_new_requests?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      clearance_types: {
        Row: {
          id: string;
          code: ClearanceTypeCode;
          name: string;
          description: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: ClearanceTypeCode;
          name: string;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: ClearanceTypeCode;
          name?: string;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      clearance_requests: {
        Row: {
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
        };
        Insert: {
          id?: string;
          student_id: string;
          clearance_type_id: string;
          academic_term_id: string;
          status?: ClearanceRequestStatus;
          student_notes?: string | null;
          phone_number?: string | null;
          submitted_at?: string | null;
          cancelled_at?: string | null;
          cancellation_reason?: string | null;
          approved_at?: string | null;
          rejected_at?: string | null;
          rejection_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          clearance_type_id?: string;
          academic_term_id?: string;
          status?: ClearanceRequestStatus;
          student_notes?: string | null;
          phone_number?: string | null;
          submitted_at?: string | null;
          cancelled_at?: string | null;
          cancellation_reason?: string | null;
          approved_at?: string | null;
          rejected_at?: string | null;
          rejection_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      clearance_department_tasks: {
        Row: {
          id: string;
          request_id: string;
          department_id: string;
          status: DepartmentTaskStatus;
          decision_notes: string | null;
          decided_at: string | null;
          decided_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          request_id: string;
          department_id: string;
          status?: DepartmentTaskStatus;
          decision_notes?: string | null;
          decided_at?: string | null;
          decided_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          request_id?: string;
          department_id?: string;
          status?: DepartmentTaskStatus;
          decision_notes?: string | null;
          decided_at?: string | null;
          decided_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      clearance_audit_logs: {
        Row: {
          id: string;
          request_id: string | null;
          actor_id: string | null;
          action: string;
          from_status: string | null;
          to_status: string | null;
          details: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          request_id?: string | null;
          actor_id?: string | null;
          action: string;
          from_status?: string | null;
          to_status?: string | null;
          details?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          request_id?: string | null;
          actor_id?: string | null;
          action?: string;
          from_status?: string | null;
          to_status?: string | null;
          details?: Json | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      revoke_existing_student_tokens: {
        Args: { p_student_id: string; p_actor_id: string };
        Returns: number;
      };
      verify_and_consume_claim_token: {
        Args: { p_token_hash: string };
        Returns: {
          student_profile_id: string;
          student_number: string;
          student_email: string;
          student_name: string;
          token_id: string;
        }[];
      };
      submit_clearance_request: {
        Args: { p_request_id: string; p_actor_id: string };
        Returns: {
          request_id: string;
          status: string;
          tasks_created: number;
        }[];
      };
      cancel_clearance_request: {
        Args: { p_request_id: string; p_actor_id: string; p_reason: string };
        Returns: {
          request_id: string;
          status: string;
        }[];
      };
    };
    Enums: {
      user_role: UserRole;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type Profile = Tables<"profiles">;
export type Department = Tables<"departments">;
export type DepartmentStaffAssignment = Tables<"department_staff_assignments">;
export type StudentClaimToken = Tables<"student_claim_tokens">;
export type AcademicTerm = Tables<"academic_terms">;
export type ClearanceType = Tables<"clearance_types">;
export type ClearanceRequest = Tables<"clearance_requests">;
export type ClearanceDepartmentTask = Tables<"clearance_department_tasks">;
export type ClearanceAuditLog = Tables<"clearance_audit_logs">;
