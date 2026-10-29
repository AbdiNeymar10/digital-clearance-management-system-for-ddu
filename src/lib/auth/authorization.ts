import "server-only";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import type { Database, UserRole } from "@/types/database";
import type { User } from "@supabase/supabase-js";
import { validatePassword, getDashboardRouteForRole } from "./validation";

export { validatePassword, getDashboardRouteForRole };

export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export interface AuthContext {
  user: User;
  profile: ProfileRow;
}

export type AuthCheckResult =
  | { state: "authenticated"; user: User; profile: ProfileRow }
  | { state: "unauthenticated"; error: string }
  | { state: "inactive"; user: User; profile: ProfileRow }
  | { state: "unconfigured"; error: string };

/**
 * Reusable server-side helper to verify user and retrieve active profile from Supabase.
 * Strictly verifies identity through Supabase Auth (server-side getUser) and checks profile in PostgreSQL.
 */
export async function getAuthenticatedUserAndProfile(): Promise<AuthCheckResult> {
  if (!isSupabaseConfigured()) {
    return {
      state: "unconfigured",
      error: "Supabase credentials are not configured in environment variables.",
    };
  }

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        state: "unauthenticated",
        error: userError?.message || "No authenticated session found.",
      };
    }

    // Query trusted profile from database
    const { data: rawProfile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    const profile = rawProfile as ProfileRow | null;

    if (profileError || !profile) {
      return {
        state: "unauthenticated",
        error: "Authenticated user has no matching database profile record.",
      };
    }

    if (!profile.is_active) {
      return {
        state: "inactive",
        user,
        profile,
      };
    }

    return {
      state: "authenticated",
      user,
      profile,
    };
  } catch (err) {
    return {
      state: "unauthenticated",
      error: err instanceof Error ? err.message : "Authentication verification failed.",
    };
  }
}

/**
 * Server-side authorization guard.
 * Requires user to be authenticated and active.
 */
export async function requireAuth(redirectTo = "/login"): Promise<AuthContext | null> {
  const result = await getAuthenticatedUserAndProfile();

  if (result.state === "unconfigured") {
    // If Supabase is unconfigured, return null so calling component can render dev/setup banner
    return null;
  }

  if (result.state === "unauthenticated") {
    redirect(`${redirectTo}?error=session_required`);
  }

  if (result.state === "inactive") {
    redirect(`${redirectTo}?error=account_deactivated`);
  }

  return {
    user: result.user,
    profile: result.profile,
  };
}

/**
 * Enforces role-specific route access on the server.
 * Ensures the user holds one of the permitted roles.
 */
export async function requireRole(
  allowedRoles: UserRole | UserRole[],
  currentPath = ""
): Promise<AuthContext | null> {
  const auth = await requireAuth(`/login${currentPath ? `?redirect=${encodeURIComponent(currentPath)}` : ""}`);

  // In unconfigured environment, allow route to render preview with setup instructions
  if (!auth) {
    return null;
  }

  const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  if (!rolesArray.includes(auth.profile.role)) {
    redirect(
      `/unauthorized?required=${encodeURIComponent(rolesArray.join(","))}&actual=${encodeURIComponent(auth.profile.role)}`
    );
  }

  return auth;
}
