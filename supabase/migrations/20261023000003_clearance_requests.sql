-- =============================================================================
-- Dire Dawa University (DDU) Digital Clearance Management System (DCMS)
-- Migration: 20261023000003_clearance_requests.sql
-- Description: Academic terms, clearance types, clearance requests,
--              departmental tasks, audit logs, active-request uniqueness,
--              and atomic submission/cancellation stored procedures.
-- =============================================================================

-- =============================================================================
-- 1. Academic Terms Table
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.academic_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  start_date DATE NULL,
  end_date DATE NULL,
  is_available_for_new_requests BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_academic_terms_code ON public.academic_terms(code);
CREATE INDEX IF NOT EXISTS idx_academic_terms_available ON public.academic_terms(is_available_for_new_requests);

-- Seed Initial Academic Terms for DDU (Development Seed Data)
INSERT INTO public.academic_terms (code, name, start_date, end_date, is_available_for_new_requests)
VALUES
  ('2025-2026-T1', '2025/2026 Academic Year — Semester I', '2025-10-01', '2026-02-15', true),
  ('2025-2026-T2', '2025/2026 Academic Year — Semester II', '2026-02-23', '2026-07-15', true),
  ('2024-2025-T2', '2024/2025 Academic Year — Semester II (Closed)', '2025-02-20', '2025-07-10', false)
ON CONFLICT (code) DO UPDATE
SET
  name = EXCLUDED.name,
  is_available_for_new_requests = EXCLUDED.is_available_for_new_requests;

-- =============================================================================
-- 2. Clearance Types Table (Graduation, Withdrawal, Transfer)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.clearance_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_clearance_types_code ON public.clearance_types(code);

-- Seed the 3 Approved DDU Clearance Types
INSERT INTO public.clearance_types (code, name, description, is_active)
VALUES
  ('GRADUATION', 'Graduation Clearance', 'Formal clearance procedure for students completing degree requirements to graduate.', true),
  ('WITHDRAWAL', 'Withdrawal Clearance', 'Institutional clearance for students voluntarily withdrawing or terminating academic registration.', true),
  ('TRANSFER', 'Transfer Clearance', 'Clearance for students formally transferring to another university or higher learning institution.', true)
ON CONFLICT (code) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active;

-- =============================================================================
-- 3. Clearance Requests Table
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.clearance_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  clearance_type_id UUID NOT NULL REFERENCES public.clearance_types(id) ON DELETE RESTRICT,
  academic_term_id UUID NOT NULL REFERENCES public.academic_terms(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (
    status IN (
      'DRAFT',
      'SUBMITTED',
      'UNDER_REVIEW',
      'ACTION_REQUIRED',
      'READY_FOR_REGISTRAR',
      'APPROVED',
      'REJECTED',
      'CANCELLED'
    )
  ),
  student_notes TEXT NULL,
  phone_number TEXT NULL,
  submitted_at TIMESTAMPTZ NULL,
  cancelled_at TIMESTAMPTZ NULL,
  cancellation_reason TEXT NULL,
  approved_at TIMESTAMPTZ NULL,
  rejected_at TIMESTAMPTZ NULL,
  rejection_reason TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_clearance_requests_student ON public.clearance_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_clearance_requests_term ON public.clearance_requests(academic_term_id);
CREATE INDEX IF NOT EXISTS idx_clearance_requests_type ON public.clearance_requests(clearance_type_id);
CREATE INDEX IF NOT EXISTS idx_clearance_requests_status ON public.clearance_requests(status);

-- =============================================================================
-- 3.1 Strict Active-Request Uniqueness (1 Active Request Per Student Per Term)
-- Drafts, cancelled requests, terminally rejected requests, and approved requests
-- do not occupy the active slot.
-- Active states: SUBMITTED, UNDER_REVIEW, ACTION_REQUIRED, READY_FOR_REGISTRAR
-- =============================================================================
CREATE UNIQUE INDEX IF NOT EXISTS idx_clearance_requests_one_active_per_term
  ON public.clearance_requests(student_id, academic_term_id)
  WHERE status IN ('SUBMITTED', 'UNDER_REVIEW', 'ACTION_REQUIRED', 'READY_FOR_REGISTRAR');

-- =============================================================================
-- 4. Departmental Tasks Table (Parallel Review for All 8 Required Clearance Units)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.clearance_department_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.clearance_requests(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (
    status IN ('PENDING', 'IN_REVIEW', 'CLEARED', 'HAS_LIABILITY', 'REJECTED')
  ),
  decision_notes TEXT NULL,
  decided_at TIMESTAMPTZ NULL,
  decided_by UUID NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_request_department_task UNIQUE (request_id, department_id)
);

CREATE INDEX IF NOT EXISTS idx_dept_tasks_request ON public.clearance_department_tasks(request_id);
CREATE INDEX IF NOT EXISTS idx_dept_tasks_dept ON public.clearance_department_tasks(department_id);
CREATE INDEX IF NOT EXISTS idx_dept_tasks_status ON public.clearance_department_tasks(status);

-- =============================================================================
-- 5. Audit Log Table (Append-Only Audit Trail)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.clearance_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES public.clearance_requests(id) ON DELETE SET NULL,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  from_status TEXT NULL,
  to_status TEXT NULL,
  details JSONB NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_request ON public.clearance_audit_logs(request_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.clearance_audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.clearance_audit_logs(created_at);

-- =============================================================================
-- 6. Atomic Stored Procedures: Submission & Cancellation
-- =============================================================================

-- 6.1 Atomic Submission & Parallel 8-Department Task Creation
CREATE OR REPLACE FUNCTION public.submit_clearance_request(
  p_request_id UUID,
  p_actor_id UUID
)
RETURNS TABLE (
  request_id UUID,
  status TEXT,
  tasks_created INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request RECORD;
  v_term RECORD;
  v_dept RECORD;
  v_task_count INTEGER := 0;
  v_total_departments INTEGER := 0;
BEGIN
  -- 1. Atomically lock the request row
  SELECT * INTO v_request
  FROM public.clearance_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'REQUEST_NOT_FOUND: The specified clearance request does not exist.';
  END IF;

  -- 2. Authorization check: Actor must be the student owner or Administrator
  IF (v_request.student_id != p_actor_id AND NOT public.is_admin(p_actor_id) AND current_user != 'service_role') THEN
    RAISE EXCEPTION 'UNAUTHORIZED: You may only submit your own clearance request.';
  END IF;

  -- 3. State check: Only DRAFT requests can be submitted
  IF v_request.status != 'DRAFT' THEN
    RAISE EXCEPTION 'INVALID_STATE: Only draft clearance requests can be submitted. Current status: %', v_request.status;
  END IF;

  -- 4. Term availability validation
  SELECT * INTO v_term
  FROM public.academic_terms
  WHERE id = v_request.academic_term_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'INVALID_TERM: The selected academic term record was not found.';
  END IF;

  IF NOT v_term.is_available_for_new_requests THEN
    RAISE EXCEPTION 'TERM_NOT_AVAILABLE: The selected academic term (%) is closed for new clearance submissions.', v_term.name;
  END IF;

  -- 5. Active-request uniqueness check
  IF EXISTS (
    SELECT 1 FROM public.clearance_requests
    WHERE student_id = v_request.student_id
      AND academic_term_id = v_request.academic_term_id
      AND id != v_request.id
      AND status IN ('SUBMITTED', 'UNDER_REVIEW', 'ACTION_REQUIRED', 'READY_FOR_REGISTRAR')
  ) THEN
    RAISE EXCEPTION 'ACTIVE_REQUEST_EXISTS: You already have an active clearance request for academic term %. Please open your existing active request.', v_term.name;
  END IF;

  -- 6. Verify all 8 clearance departments exist and are active
  SELECT COUNT(*) INTO v_total_departments
  FROM public.departments
  WHERE is_active = true;

  IF v_total_departments < 8 THEN
    RAISE EXCEPTION 'SYSTEM_CONFIGURATION_ERROR: All 8 clearance departments must be active before requests can be submitted.';
  END IF;

  -- 7. Atomically transition request status to SUBMITTED
  UPDATE public.clearance_requests
  SET
    status = 'SUBMITTED',
    submitted_at = timezone('utc'::text, now()),
    updated_at = timezone('utc'::text, now())
  WHERE id = v_request.id;

  -- 8. Atomically spawn all 8 required departmental tasks in parallel
  FOR v_dept IN
    SELECT id, code, name FROM public.departments WHERE is_active = true ORDER BY name ASC
  LOOP
    INSERT INTO public.clearance_department_tasks (
      request_id,
      department_id,
      status,
      created_at,
      updated_at
    )
    VALUES (
      v_request.id,
      v_dept.id,
      'PENDING',
      timezone('utc'::text, now()),
      timezone('utc'::text, now())
    )
    ON CONFLICT (request_id, department_id) DO NOTHING;

    v_task_count := v_task_count + 1;
  END LOOP;

  -- 9. Record immutable audit log entry
  INSERT INTO public.clearance_audit_logs (
    request_id,
    actor_id,
    action,
    from_status,
    to_status,
    details
  )
  VALUES (
    v_request.id,
    p_actor_id,
    'REQUEST_SUBMITTED',
    'DRAFT',
    'SUBMITTED',
    jsonb_build_object(
      'submitted_at', timezone('utc'::text, now()),
      'tasks_initialized', v_task_count,
      'academic_term_id', v_request.academic_term_id
    )
  );

  RETURN QUERY
  SELECT v_request.id AS request_id, 'SUBMITTED'::text AS status, v_task_count AS tasks_created;
END;
$$;

-- 6.2 Atomic Request Cancellation
CREATE OR REPLACE FUNCTION public.cancel_clearance_request(
  p_request_id UUID,
  p_actor_id UUID,
  p_reason TEXT
)
RETURNS TABLE (
  request_id UUID,
  status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request RECORD;
  v_trimmed_reason TEXT;
BEGIN
  v_trimmed_reason := TRIM(p_reason);

  IF v_trimmed_reason IS NULL OR LENGTH(v_trimmed_reason) < 3 THEN
    RAISE EXCEPTION 'REASON_REQUIRED: A meaningful cancellation reason (minimum 3 characters) is required to cancel a request.';
  END IF;

  -- 1. Atomically lock the request row
  SELECT * INTO v_request
  FROM public.clearance_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'REQUEST_NOT_FOUND: The specified clearance request does not exist.';
  END IF;

  -- 2. Authorization check
  IF (v_request.student_id != p_actor_id AND NOT public.is_admin(p_actor_id) AND current_user != 'service_role') THEN
    RAISE EXCEPTION 'UNAUTHORIZED: You may only cancel your own clearance request.';
  END IF;

  -- 3. Business rule checks
  IF v_request.status = 'APPROVED' THEN
    RAISE EXCEPTION 'CANNOT_CANCEL_APPROVED: This clearance request has received final Registrar approval and cannot be cancelled.';
  END IF;

  IF v_request.status = 'CANCELLED' THEN
    RAISE EXCEPTION 'ALREADY_CANCELLED: This clearance request is already cancelled.';
  END IF;

  IF v_request.status = 'REJECTED' THEN
    RAISE EXCEPTION 'ALREADY_TERMINATED: This clearance request was rejected and is already in a terminal state.';
  END IF;

  IF v_request.status = 'DRAFT' THEN
    RAISE EXCEPTION 'CANNOT_CANCEL_DRAFT: Draft requests cannot be cancelled. You may delete or edit the draft directly.';
  END IF;

  -- 4. Atomically cancel the request and release the active-request slot
  UPDATE public.clearance_requests
  SET
    status = 'CANCELLED',
    cancelled_at = timezone('utc'::text, now()),
    cancellation_reason = v_trimmed_reason,
    updated_at = timezone('utc'::text, now())
  WHERE id = v_request.id;

  -- 5. Record immutable audit log
  INSERT INTO public.clearance_audit_logs (
    request_id,
    actor_id,
    action,
    from_status,
    to_status,
    details
  )
  VALUES (
    v_request.id,
    p_actor_id,
    'REQUEST_CANCELLED',
    v_request.status,
    'CANCELLED',
    jsonb_build_object(
      'cancellation_reason', v_trimmed_reason,
      'cancelled_at', timezone('utc'::text, now())
    )
  );

  RETURN QUERY
  SELECT v_request.id AS request_id, 'CANCELLED'::text AS status;
END;
$$;

-- Revoke default public execution & grant to authenticated
REVOKE ALL ON FUNCTION public.submit_clearance_request(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_clearance_request(UUID, UUID) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.cancel_clearance_request(UUID, UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cancel_clearance_request(UUID, UUID, TEXT) TO authenticated, service_role;

-- =============================================================================
-- 7. Row Level Security Policies
-- =============================================================================

-- 7.1 academic_terms RLS
ALTER TABLE public.academic_terms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "academic_terms_select_authenticated"
  ON public.academic_terms
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "academic_terms_admin_all"
  ON public.academic_terms
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- 7.2 clearance_types RLS
ALTER TABLE public.clearance_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clearance_types_select_authenticated"
  ON public.clearance_types
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "clearance_types_admin_all"
  ON public.clearance_types
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- 7.3 clearance_requests RLS
ALTER TABLE public.clearance_requests ENABLE ROW LEVEL SECURITY;

-- Students view their own requests; Staff/Registrar/Admin view all
CREATE POLICY "clearance_requests_select"
  ON public.clearance_requests
  FOR SELECT
  TO authenticated
  USING (
    student_id = auth.uid()
    OR public.get_user_role(auth.uid()) IN ('DEPARTMENT_STAFF', 'REGISTRAR', 'ADMINISTRATOR')
  );

-- Students can insert DRAFT or new requests for themselves
CREATE POLICY "clearance_requests_insert_student"
  ON public.clearance_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    student_id = auth.uid()
    AND public.get_user_role(auth.uid()) = 'STUDENT'
    AND public.is_user_active(auth.uid())
  );

-- Students can ONLY update their own requests while in DRAFT status
CREATE POLICY "clearance_requests_update_student_draft"
  ON public.clearance_requests
  FOR UPDATE
  TO authenticated
  USING (
    student_id = auth.uid()
    AND status = 'DRAFT'
    AND public.is_user_active(auth.uid())
  )
  WITH CHECK (
    student_id = auth.uid()
    AND status = 'DRAFT'
  );

-- Students can delete their own DRAFT requests
CREATE POLICY "clearance_requests_delete_student_draft"
  ON public.clearance_requests
  FOR DELETE
  TO authenticated
  USING (
    student_id = auth.uid()
    AND status = 'DRAFT'
  );

-- 7.4 clearance_department_tasks RLS
ALTER TABLE public.clearance_department_tasks ENABLE ROW LEVEL SECURITY;

-- Students can view tasks for their own requests; Staff/Registrar/Admin can view appropriate tasks
CREATE POLICY "dept_tasks_select"
  ON public.clearance_department_tasks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.clearance_requests r
      WHERE r.id = clearance_department_tasks.request_id
        AND r.student_id = auth.uid()
    )
    OR public.get_user_role(auth.uid()) IN ('REGISTRAR', 'ADMINISTRATOR')
    OR public.is_staff_for_department(auth.uid(), clearance_department_tasks.department_id)
  );

-- 7.5 clearance_audit_logs RLS (Append-Only)
ALTER TABLE public.clearance_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_logs_select"
  ON public.clearance_audit_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.clearance_requests r
      WHERE r.id = clearance_audit_logs.request_id
        AND r.student_id = auth.uid()
    )
    OR public.get_user_role(auth.uid()) IN ('DEPARTMENT_STAFF', 'REGISTRAR', 'ADMINISTRATOR')
  );

CREATE POLICY "audit_logs_insert"
  ON public.clearance_audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
