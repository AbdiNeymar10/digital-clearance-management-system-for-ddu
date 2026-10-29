-- =============================================================================
-- Dire Dawa University (DDU) Digital Clearance Management System (DCMS)
-- Migration: 20261023000001_initial_schema.sql
-- Description: Foundational tables (profiles, departments, department_staff_assignments),
--              repeatable seed data for 8 clearance units, RLS policies, and triggers.
-- =============================================================================

-- 1. Custom Role Enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE public.user_role AS ENUM (
      'STUDENT',
      'DEPARTMENT_STAFF',
      'REGISTRAR',
      'ADMINISTRATOR'
    );
  END IF;
END $$;

-- 2. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role public.user_role NOT NULL DEFAULT 'STUDENT'::public.user_role,
  student_id TEXT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_student_id UNIQUE (student_id)
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_student_id ON public.profiles(student_id);

-- 3. Departments Table (8 Institutional Clearance Units)
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_departments_code ON public.departments(code);

-- 4. Department Staff Assignments Table
CREATE TABLE IF NOT EXISTS public.department_staff_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_active_staff_department UNIQUE (staff_id, department_id)
);

CREATE INDEX IF NOT EXISTS idx_staff_assignments_staff ON public.department_staff_assignments(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_assignments_dept ON public.department_staff_assignments(department_id);

-- =============================================================================
-- 5. Safe Repeatable Seed for the 8 Required DDU Clearance Units
-- =============================================================================
INSERT INTO public.departments (name, code, is_active)
VALUES
  ('Office of the University Registrar', 'REGISTRAR', true),
  ('Cost Sharing & University Finance', 'FINANCE', true),
  ('University Library System', 'LIBRARY', true),
  ('Student Housing & Dormitory', 'DORMITORY', true),
  ('Student Cafeteria & Food Services', 'CAFETERIA', true),
  ('University Bookstore', 'BOOKSTORE', true),
  ('Student Loan & Cost Sharing', 'STUDENT_LOAN', true),
  ('Faculty & Academic Offices', 'FACULTY_OFFICES', true)
ON CONFLICT (code) DO UPDATE
SET
  name = EXCLUDED.name,
  is_active = EXCLUDED.is_active;

-- =============================================================================
-- 6. Helper Functions (Avoid Recursive RLS with Fixed Search Path)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id UUID)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text FROM public.profiles WHERE id = p_user_id LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_user_active(p_user_id UUID)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(is_active, false) FROM public.profiles WHERE id = p_user_id LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_admin(p_user_id UUID)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (public.get_user_role(p_user_id) = 'ADMINISTRATOR' AND public.is_user_active(p_user_id));
$$;

CREATE OR REPLACE FUNCTION public.is_staff_for_department(p_user_id UUID, p_dept_id UUID)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.department_staff_assignments
    WHERE staff_id = p_user_id AND department_id = p_dept_id
  );
$$;

-- Revoke default public execution and grant to authenticated and service_role
REVOKE ALL ON FUNCTION public.get_user_role(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_role(UUID) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.is_user_active(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_user_active(UUID) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.is_admin(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.is_staff_for_department(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_staff_for_department(UUID, UUID) TO authenticated, service_role;

-- =============================================================================
-- 7. Row Level Security (RLS) Configuration
-- =============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.department_staff_assignments ENABLE ROW LEVEL SECURITY;

-- 7.1 Profiles RLS Policies
-- Users can view their own profile
CREATE POLICY "profiles_select_own"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Administrators can view all profiles
CREATE POLICY "profiles_select_admin"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Registrar can view all student profiles for clearance governance
CREATE POLICY "profiles_select_registrar_students"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    public.get_user_role(auth.uid()) = 'REGISTRAR'
    AND role = 'STUDENT'
    AND public.is_user_active(auth.uid())
  );

-- Department staff can view student profiles to verify student identities
CREATE POLICY "profiles_select_staff_students"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    public.get_user_role(auth.uid()) = 'DEPARTMENT_STAFF'
    AND role = 'STUDENT'
    AND public.is_user_active(auth.uid())
  );

-- Non-admin users can update their own non-protected profile information (e.g. full_name)
CREATE POLICY "profiles_update_own"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id AND public.is_user_active(auth.uid()))
  WITH CHECK (auth.uid() = id);

-- Administrators can manage (insert/update/delete) any profile
CREATE POLICY "profiles_admin_all"
  ON public.profiles
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- 7.2 Departments RLS Policies
-- All authenticated users can view active departments
CREATE POLICY "departments_select_active"
  ON public.departments
  FOR SELECT
  TO authenticated
  USING (is_active = true OR public.is_admin(auth.uid()));

-- Only administrators can manage departments
CREATE POLICY "departments_admin_manage"
  ON public.departments
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- 7.3 Department Staff Assignments RLS Policies
-- Staff can view their own assignments
CREATE POLICY "assignments_select_own"
  ON public.department_staff_assignments
  FOR SELECT
  TO authenticated
  USING (staff_id = auth.uid() AND public.is_user_active(auth.uid()));

-- Administrators and Registrar can view all assignments for institutional management
CREATE POLICY "assignments_select_management"
  ON public.department_staff_assignments
  FOR SELECT
  TO authenticated
  USING (
    public.get_user_role(auth.uid()) IN ('ADMINISTRATOR', 'REGISTRAR')
    AND public.is_user_active(auth.uid())
  );

-- Only administrators can insert, update, or remove staff assignments
CREATE POLICY "assignments_admin_manage"
  ON public.department_staff_assignments
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- =============================================================================
-- 8. Privilege Escalation Prevention Trigger
-- =============================================================================

CREATE OR REPLACE FUNCTION public.protect_profile_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If updater is not an active Administrator, prevent modifying sensitive attributes
  IF NOT public.is_admin(auth.uid()) AND current_user != 'service_role' THEN
    IF (NEW.role IS DISTINCT FROM OLD.role) THEN
      RAISE EXCEPTION 'Unauthorized: Users cannot modify their own role.';
    END IF;
    IF (NEW.is_active IS DISTINCT FROM OLD.is_active) THEN
      RAISE EXCEPTION 'Unauthorized: Users cannot modify their activation status.';
    END IF;
    IF (NEW.student_id IS DISTINCT FROM OLD.student_id AND OLD.student_id IS NOT NULL) THEN
      RAISE EXCEPTION 'Unauthorized: Student ID cannot be reassigned once established.';
    END IF;
    IF (NEW.id IS DISTINCT FROM OLD.id) THEN
      RAISE EXCEPTION 'Unauthorized: Profile UUID cannot be altered.';
    END IF;
  END IF;

  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_fields ON public.profiles;
CREATE TRIGGER trg_protect_profile_fields
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_fields();

-- =============================================================================
-- 9. Automatic Profile Creation on Supabase Auth Signup
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role public.user_role;
  v_full_name text;
  v_student_id text;
BEGIN
  -- Extract user metadata if provided during signup, otherwise safe defaults
  v_role := COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'STUDENT'::public.user_role);
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
  v_student_id := NEW.raw_user_meta_data->>'student_id';

  -- Only allow STUDENT role to be assigned automatically from metadata unless service role
  IF v_role != 'STUDENT'::public.user_role AND current_user != 'service_role' THEN
    v_role := 'STUDENT'::public.user_role;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role, student_id, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    v_full_name,
    v_role,
    v_student_id,
    true
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
