-- =============================================================================
-- Dire Dawa University (DDU) Digital Clearance Management System (DCMS)
-- Migration: 20261023000002_student_account_claims.sql
-- Description: Student account provisioning extensions, student_claim_tokens table,
--              72-hour token lifecycle, atomic consumption, and RLS policies.
-- =============================================================================

-- 1. Extend profiles table for student claiming and optional academic info
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_claimed BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS college TEXT NULL,
  ADD COLUMN IF NOT EXISTS department TEXT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_is_claimed ON public.profiles(is_claimed);

-- 2. Create student_claim_tokens Table
CREATE TABLE IF NOT EXISTS public.student_claim_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (timezone('utc'::text, now()) + INTERVAL '72 hours'),
  consumed_at TIMESTAMPTZ NULL,
  revoked_at TIMESTAMPTZ NULL,
  issued_by UUID NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  delivery_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (delivery_status IN ('PENDING', 'SENT', 'FAILED')),
  delivery_error TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_claim_tokens_hash ON public.student_claim_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_claim_tokens_student ON public.student_claim_tokens(student_id);
CREATE INDEX IF NOT EXISTS idx_claim_tokens_expires ON public.student_claim_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_claim_tokens_consumed ON public.student_claim_tokens(consumed_at);
CREATE INDEX IF NOT EXISTS idx_claim_tokens_revoked ON public.student_claim_tokens(revoked_at);

-- 3. Atomic Helper Functions for Token Invalidation and Consumption

-- 3.1 Revoke any existing active claim links for a student when a new one is issued
CREATE OR REPLACE FUNCTION public.revoke_existing_student_tokens(p_student_id UUID, p_actor_id UUID)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  -- Validate that caller is Administrator or Registrar or service role
  IF (public.get_user_role(auth.uid()) NOT IN ('ADMINISTRATOR', 'REGISTRAR') AND current_user != 'service_role') THEN
    RAISE EXCEPTION 'Unauthorized: Only Registrar and Administrator may revoke or reissue claim tokens.';
  END IF;

  UPDATE public.student_claim_tokens
  SET revoked_at = timezone('utc'::text, now())
  WHERE student_id = p_student_id
    AND consumed_at IS NULL
    AND revoked_at IS NULL;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- 3.2 Atomically verify and consume claim token
CREATE OR REPLACE FUNCTION public.verify_and_consume_claim_token(p_token_hash TEXT)
RETURNS TABLE (
  student_profile_id UUID,
  student_number TEXT,
  student_email TEXT,
  student_name TEXT,
  token_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token RECORD;
BEGIN
  -- Atomically select and lock the token row
  SELECT * INTO v_token
  FROM public.student_claim_tokens
  WHERE token_hash = p_token_hash
  FOR UPDATE;

  -- Validation checks
  IF NOT FOUND THEN
    RAISE EXCEPTION 'CLAIM_TOKEN_INVALID: The provided claim token does not exist.';
  END IF;

  IF v_token.consumed_at IS NOT NULL THEN
    RAISE EXCEPTION 'CLAIM_TOKEN_CONSUMED: This claim link has already been used.';
  END IF;

  IF v_token.revoked_at IS NOT NULL THEN
    RAISE EXCEPTION 'CLAIM_TOKEN_REVOKED: This claim link has been revoked. Please request a new link from the Registrar.';
  END IF;

  IF v_token.expires_at <= timezone('utc'::text, now()) THEN
    RAISE EXCEPTION 'CLAIM_TOKEN_EXPIRED: This claim link has expired (72-hour validity window).';
  END IF;

  -- Mark token as consumed atomically
  UPDATE public.student_claim_tokens
  SET consumed_at = timezone('utc'::text, now())
  WHERE id = v_token.id;

  -- Mark student profile as claimed
  UPDATE public.profiles
  SET
    is_claimed = true,
    claimed_at = timezone('utc'::text, now()),
    updated_at = timezone('utc'::text, now())
  WHERE id = v_token.student_id;

  -- Return verified student profile information
  RETURN QUERY
  SELECT
    p.id AS student_profile_id,
    p.student_id AS student_number,
    p.email AS student_email,
    p.full_name AS student_name,
    v_token.id AS token_id
  FROM public.profiles p
  WHERE p.id = v_token.student_id;
END;
$$;

-- Revoke default public execution
REVOKE ALL ON FUNCTION public.revoke_existing_student_tokens(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.revoke_existing_student_tokens(UUID, UUID) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.verify_and_consume_claim_token(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_and_consume_claim_token(TEXT) TO authenticated, service_role;

-- 4. Row Level Security for student_claim_tokens
ALTER TABLE public.student_claim_tokens ENABLE ROW LEVEL SECURITY;

-- 4.1 Deny direct access to public and non-authorized roles
-- Only Administrators and Registrar can view claim token status and audit metadata (no raw token is stored)
CREATE POLICY "claim_tokens_select_authorized_staff"
  ON public.student_claim_tokens
  FOR SELECT
  TO authenticated
  USING (
    public.get_user_role(auth.uid()) IN ('ADMINISTRATOR', 'REGISTRAR')
    AND public.is_user_active(auth.uid())
  );

-- All modifications (INSERT, UPDATE, DELETE) must go through trusted server-side routines (service role)
-- or authorized functions. No client may insert or alter claim tokens directly.
CREATE POLICY "claim_tokens_admin_manage"
  ON public.student_claim_tokens
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- 5. Extend Privilege Escalation Protection on profiles for is_claimed and claimed_at
CREATE OR REPLACE FUNCTION public.protect_profile_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If updater is not an active Administrator, Registrar, or service_role, restrict sensitive fields
  IF NOT public.is_admin(auth.uid())
     AND public.get_user_role(auth.uid()) != 'REGISTRAR'
     AND current_user != 'service_role' THEN
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
    IF (NEW.is_claimed IS DISTINCT FROM OLD.is_claimed) THEN
      RAISE EXCEPTION 'Unauthorized: Direct modification of account claimed state is prohibited.';
    END IF;
  END IF;

  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;
