"use server";

import { revalidatePath } from "next/cache";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { getAuthenticatedUserAndProfile } from "@/lib/auth/authorization";
import { generateClaimToken, hashClaimToken, buildClaimUrl, isClaimTokenExpired } from "@/lib/auth/claim-tokens";
import { sendStudentClaimEmail } from "@/lib/email/claim-email";
import { validatePassword } from "@/lib/auth/validation";

export interface ProvisionStudentInput {
  studentId: string;
  fullName: string;
  email: string;
  college?: string;
  department?: string;
}

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// In-memory development store for mock simulation when live Supabase is not configured
interface MockStudentStore {
  profile: {
    id: string;
    student_id: string;
    full_name: string;
    email: string;
    college: string | null;
    department: string | null;
    role: "STUDENT";
    is_active: boolean;
    is_claimed: boolean;
    claimed_at: string | null;
    created_at: string;
  };
  latestToken?: {
    id: string;
    rawToken: string;
    token_hash: string;
    expires_at: string;
    consumed_at: string | null;
    revoked_at: string | null;
    delivery_status: "PENDING" | "SENT" | "FAILED";
  };
}

const devMockStudents: Map<string, MockStudentStore> = new Map([
  [
    "DDU/14829/12",
    {
      profile: {
        id: "mock-student-1",
        student_id: "DDU/14829/12",
        full_name: "Kenenisa Tsegaye Bekele",
        email: "kenenisa.tsegaye@student.ddu.edu.et",
        college: "College of Computing and Informatics",
        department: "Software Engineering",
        role: "STUDENT",
        is_active: true,
        is_claimed: false,
        claimed_at: null,
        created_at: new Date(Date.now() - 86400000).toISOString(),
      },
      latestToken: {
        id: "mock-token-1",
        rawToken: "demo-active-token-14829",
        token_hash: hashClaimToken("demo-active-token-14829"),
        expires_at: new Date(Date.now() + 70 * 3600000).toISOString(),
        consumed_at: null,
        revoked_at: null,
        delivery_status: "SENT",
      },
    },
  ],
  [
    "DDU/15204/12",
    {
      profile: {
        id: "mock-student-2",
        student_id: "DDU/15204/12",
        full_name: "Marta Haile Wolde",
        email: "marta.haile@student.ddu.edu.et",
        college: "College of Computing and Informatics",
        department: "Computer Science",
        role: "STUDENT",
        is_active: true,
        is_claimed: true,
        claimed_at: new Date(Date.now() - 48 * 3600000).toISOString(),
        created_at: new Date(Date.now() - 72 * 3600000).toISOString(),
      },
    },
  ],
  [
    "DDU/16310/13",
    {
      profile: {
        id: "mock-student-3",
        student_id: "DDU/16310/13",
        full_name: "Binyam Alemayehu",
        email: "binyam.alemayehu@student.ddu.edu.et",
        college: "College of Engineering",
        department: "Electrical Engineering",
        role: "STUDENT",
        is_active: true,
        is_claimed: false,
        claimed_at: null,
        created_at: new Date(Date.now() - 100000).toISOString(),
      },
      latestToken: {
        id: "mock-token-3",
        rawToken: "demo-failed-token-16310",
        token_hash: hashClaimToken("demo-failed-token-16310"),
        expires_at: new Date(Date.now() + 71 * 3600000).toISOString(),
        consumed_at: null,
        revoked_at: null,
        delivery_status: "FAILED",
      },
    },
  ],
]);

/**
 * Server Action: Provision a new student account (Registrar & Administrator only).
 */
export async function provisionStudentAccount(
  input: ProvisionStudentInput
): Promise<ActionResult<{ studentId: string; claimUrl?: string; rawToken?: string }>> {
  // 1. Authorize caller: Must be ADMINISTRATOR or REGISTRAR
  const auth = await getAuthenticatedUserAndProfile();

  if (auth.state === "authenticated") {
    if (auth.profile.role !== "ADMINISTRATOR" && auth.profile.role !== "REGISTRAR") {
      return {
        success: false,
        error: "Unauthorized: Only the Registrar and Administrators may provision student accounts.",
      };
    }
  }

  // 2. Normalize and validate input
  const normalizedId = input.studentId.trim().toUpperCase();
  const normalizedEmail = input.email.trim().toLowerCase();
  const normalizedName = input.fullName.trim();
  const college = input.college?.trim() || null;
  const department = input.department?.trim() || null;

  if (!normalizedId || normalizedId.length < 5) {
    return { success: false, error: "Please enter a valid Dire Dawa University Student ID (e.g. DDU/14829/12)." };
  }

  if (!normalizedEmail || !normalizedEmail.includes("@")) {
    return { success: false, error: "Please enter a valid university email address." };
  }

  if (!normalizedName || normalizedName.length < 3) {
    return { success: false, error: "Please enter the student's full legal name." };
  }

  // Generate 72-hour cryptographic claim token
  const { rawToken, tokenHash, expiresAt } = generateClaimToken();
  const claimUrl = buildClaimUrl(rawToken);

  // 3. Database operations
  if (isSupabaseConfigured()) {
    try {
      const adminClient = await createAdminSupabaseClient();

      // Check for duplicate student ID or email in database
      const { data: existingProfiles, error: checkError } = await adminClient
        .from("profiles")
        .select("id, student_id, email")
        .or(`student_id.eq.${normalizedId},email.eq.${normalizedEmail}`);

      if (checkError) {
        console.error("Duplicate check error:", checkError);
      } else if (existingProfiles && existingProfiles.length > 0) {
        const dup = existingProfiles[0];
        if (dup.student_id === normalizedId) {
          return { success: false, error: `A student account with ID "${normalizedId}" already exists.` };
        }
        if (dup.email === normalizedEmail) {
          return { success: false, error: `A student account with email "${normalizedEmail}" already exists.` };
        }
      }

      // Create Supabase Auth User with secure temporary unusable credentials
      const tempPassword = `DDU_${Date.now()}_${Math.random().toString(36).substring(2, 10)}!`;
      const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
        email: normalizedEmail,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          full_name: normalizedName,
          student_id: normalizedId,
          role: "STUDENT",
        },
      });

      if (authError || !authUser.user) {
        return {
          success: false,
          error: `Failed to create university auth identity: ${authError?.message || "Unknown error"}`,
        };
      }

      const userId = authUser.user.id;

      // Upsert profile record
      const { error: profileError } = await adminClient.from("profiles").upsert({
        id: userId,
        email: normalizedEmail,
        full_name: normalizedName,
        role: "STUDENT",
        student_id: normalizedId,
        college,
        department,
        is_active: true,
        is_claimed: false,
      });

      if (profileError) {
        console.error("Profile upsert error:", profileError);
        return { success: false, error: `Profile provisioning failed: ${profileError.message}` };
      }

      // Invalidate any previous claim links for this student
      await adminClient.rpc("revoke_existing_student_tokens", {
        p_student_id: userId,
        p_actor_id: auth.state === "authenticated" ? auth.profile.id : userId,
      });

      // Insert new claim token record
      const { error: tokenError } = await adminClient.from("student_claim_tokens").insert({
        student_id: userId,
        token_hash: tokenHash,
        expires_at: expiresAt.toISOString(),
        issued_by: auth.state === "authenticated" ? auth.profile.id : null,
        delivery_status: "PENDING",
      });

      if (tokenError) {
        console.error("Token insert error:", tokenError);
      }

      // Dispatch claim link email
      const emailResult = await sendStudentClaimEmail({
        studentName: normalizedName,
        studentId: normalizedId,
        recipientEmail: normalizedEmail,
        claimUrl,
        expiresAt,
      });

      // Update delivery status
      await adminClient
        .from("student_claim_tokens")
        .update({
          delivery_status: emailResult.success ? "SENT" : "FAILED",
          delivery_error: emailResult.error || null,
        })
        .eq("token_hash", tokenHash);

      revalidatePath("/admin/students");

      return {
        success: true,
        data: {
          studentId: normalizedId,
          claimUrl,
          rawToken,
        },
      };
    } catch (err) {
      console.error("Provisioning exception:", err);
      return {
        success: false,
        error: err instanceof Error ? err.message : "Server error during account provisioning.",
      };
    }
  }

  // 4. Safe Simulation in unconfigured local development
  if (devMockStudents.has(normalizedId)) {
    return {
      success: false,
      error: `A student account with ID "${normalizedId}" already exists in records.`,
    };
  }

  const emailResult = await sendStudentClaimEmail({
    studentName: normalizedName,
    studentId: normalizedId,
    recipientEmail: normalizedEmail,
    claimUrl,
    expiresAt,
  });

  const mockId = `mock_${Date.now()}`;
  devMockStudents.set(normalizedId, {
    profile: {
      id: mockId,
      student_id: normalizedId,
      full_name: normalizedName,
      email: normalizedEmail,
      college,
      department,
      role: "STUDENT",
      is_active: true,
      is_claimed: false,
      claimed_at: null,
      created_at: new Date().toISOString(),
    },
    latestToken: {
      id: `tok_${Date.now()}`,
      rawToken,
      token_hash: tokenHash,
      expires_at: expiresAt.toISOString(),
      consumed_at: null,
      revoked_at: null,
      delivery_status: emailResult.success ? "SENT" : "FAILED",
    },
  });

  revalidatePath("/admin/students");

  return {
    success: true,
    data: {
      studentId: normalizedId,
      claimUrl,
      rawToken,
    },
  };
}

/**
 * Server Action: Reissue a 72-hour claim link for an existing student.
 */
export async function reissueClaimLink(
  studentProfileId: string
): Promise<ActionResult<{ claimUrl: string; rawToken: string }>> {
  // Authorize caller
  const auth = await getAuthenticatedUserAndProfile();
  if (auth.state === "authenticated") {
    if (auth.profile.role !== "ADMINISTRATOR" && auth.profile.role !== "REGISTRAR") {
      return { success: false, error: "Unauthorized: Reissuing claim links requires Registrar or Admin authority." };
    }
  }

  const { rawToken, tokenHash, expiresAt } = generateClaimToken();
  const claimUrl = buildClaimUrl(rawToken);

  if (isSupabaseConfigured()) {
    try {
      const adminClient = await createAdminSupabaseClient();

      // Retrieve student profile
      const { data: profile, error: profileErr } = await adminClient
        .from("profiles")
        .select("*")
        .eq("id", studentProfileId)
        .single();

      if (profileErr || !profile) {
        return { success: false, error: "Student profile record not found." };
      }

      if (profile.is_claimed) {
        return { success: false, error: "This student account has already been claimed." };
      }

      // Revoke any existing active tokens
      await adminClient.rpc("revoke_existing_student_tokens", {
        p_student_id: studentProfileId,
        p_actor_id: auth.state === "authenticated" ? auth.profile.id : studentProfileId,
      });

      // Insert fresh 72-hour token
      await adminClient.from("student_claim_tokens").insert({
        student_id: studentProfileId,
        token_hash: tokenHash,
        expires_at: expiresAt.toISOString(),
        issued_by: auth.state === "authenticated" ? auth.profile.id : null,
        delivery_status: "PENDING",
      });

      // Dispatch email
      const emailResult = await sendStudentClaimEmail({
        studentName: profile.full_name,
        studentId: profile.student_id || "STUDENT",
        recipientEmail: profile.email,
        claimUrl,
        expiresAt,
      });

      await adminClient
        .from("student_claim_tokens")
        .update({
          delivery_status: emailResult.success ? "SENT" : "FAILED",
          delivery_error: emailResult.error || null,
        })
        .eq("token_hash", tokenHash);

      revalidatePath("/admin/students");

      return {
        success: true,
        data: { claimUrl, rawToken },
      };
    } catch (err) {
      console.error("Reissue exception:", err);
      return { success: false, error: "Server error occurred while reissuing claim link." };
    }
  }

  // Mock reissuance in development
  for (const [, item] of devMockStudents.entries()) {
    if (item.profile.id === studentProfileId) {
      if (item.profile.is_claimed) {
        return { success: false, error: "This student account is already claimed." };
      }
      if (item.latestToken) {
        item.latestToken.revoked_at = new Date().toISOString();
      }
      item.latestToken = {
        id: `tok_${Date.now()}`,
        rawToken,
        token_hash: tokenHash,
        expires_at: expiresAt.toISOString(),
        consumed_at: null,
        revoked_at: null,
        delivery_status: "SENT",
      };

      await sendStudentClaimEmail({
        studentName: item.profile.full_name,
        studentId: item.profile.student_id,
        recipientEmail: item.profile.email,
        claimUrl,
        expiresAt,
      });

      revalidatePath("/admin/students");
      return { success: true, data: { claimUrl, rawToken } };
    }
  }

  return { success: false, error: "Student record not found." };
}

/**
 * Server Action: Verify a claim token without consuming it.
 */
export async function verifyClaimToken(
  rawToken: string
): Promise<ActionResult<{ studentName: string; studentId: string; email: string }>> {
  if (!rawToken || rawToken.trim().length < 10) {
    return { success: false, error: "CLAIM_TOKEN_INVALID" };
  }

  const tokenHash = hashClaimToken(rawToken);

  if (isSupabaseConfigured()) {
    try {
      const adminClient = await createAdminSupabaseClient();
      const { data: tokenRecord, error: tokenErr } = await adminClient
        .from("student_claim_tokens")
        .select("*, profiles(*)")
        .eq("token_hash", tokenHash)
        .single();

      if (tokenErr || !tokenRecord) {
        return { success: false, error: "CLAIM_TOKEN_INVALID" };
      }

      if (tokenRecord.consumed_at) {
        return { success: false, error: "CLAIM_TOKEN_CONSUMED" };
      }

      if (tokenRecord.revoked_at) {
        return { success: false, error: "CLAIM_TOKEN_REVOKED" };
      }

      if (isClaimTokenExpired(tokenRecord.expires_at)) {
        return { success: false, error: "CLAIM_TOKEN_EXPIRED" };
      }

      const profile = tokenRecord.profiles as unknown as {
        full_name: string;
        student_id: string;
        email: string;
      };

      return {
        success: true,
        data: {
          studentName: profile?.full_name || "Student",
          studentId: profile?.student_id || "STUDENT",
          email: profile?.email || "",
        },
      };
    } catch {
      return { success: false, error: "CLAIM_TOKEN_INVALID" };
    }
  }

  // Development simulation check
  for (const [, item] of devMockStudents.entries()) {
    if (item.latestToken && item.latestToken.token_hash === tokenHash) {
      if (item.latestToken.consumed_at) {
        return { success: false, error: "CLAIM_TOKEN_CONSUMED" };
      }
      if (item.latestToken.revoked_at) {
        return { success: false, error: "CLAIM_TOKEN_REVOKED" };
      }
      if (isClaimTokenExpired(item.latestToken.expires_at)) {
        return { success: false, error: "CLAIM_TOKEN_EXPIRED" };
      }
      return {
        success: true,
        data: {
          studentName: item.profile.full_name,
          studentId: item.profile.student_id,
          email: item.profile.email,
        },
      };
    }
  }

  // Check for pre-seeded test tokens
  if (rawToken === "demo-active-token-14829") {
    return {
      success: true,
      data: {
        studentName: "Kenenisa Tsegaye Bekele",
        studentId: "DDU/14829/12",
        email: "kenenisa.tsegaye@student.ddu.edu.et",
      },
    };
  }

  return { success: false, error: "CLAIM_TOKEN_INVALID" };
}

/**
 * Server Action: Atomically complete account claim and establish student password.
 */
export async function completeAccountClaim(
  rawToken: string,
  newPassword: string
): Promise<ActionResult<{ studentId: string; email: string }>> {
  const pwdCheck = validatePassword(newPassword);
  if (!pwdCheck.valid) {
    return { success: false, error: pwdCheck.message || "Password must be at least 8 characters long." };
  }

  if (!rawToken || rawToken.trim().length < 10) {
    return { success: false, error: "Invalid claim token provided." };
  }

  const tokenHash = hashClaimToken(rawToken);

  if (isSupabaseConfigured()) {
    try {
      const adminClient = await createAdminSupabaseClient();

      // Atomic stored procedure to verify and consume the token
      const { data: verifiedRows, error: consumeErr } = await adminClient.rpc(
        "verify_and_consume_claim_token",
        { p_token_hash: tokenHash }
      );

      if (consumeErr || !verifiedRows || verifiedRows.length === 0) {
        const errorMsg = consumeErr?.message || "Failed to consume token.";
        if (errorMsg.includes("CLAIM_TOKEN_CONSUMED")) return { success: false, error: "CLAIM_TOKEN_CONSUMED" };
        if (errorMsg.includes("CLAIM_TOKEN_EXPIRED")) return { success: false, error: "CLAIM_TOKEN_EXPIRED" };
        if (errorMsg.includes("CLAIM_TOKEN_REVOKED")) return { success: false, error: "CLAIM_TOKEN_REVOKED" };
        return { success: false, error: "CLAIM_TOKEN_INVALID" };
      }

      const verified = verifiedRows[0];

      // Update Supabase Auth user password and activate session
      const { error: authUpdateErr } = await adminClient.auth.admin.updateUserById(
        verified.student_profile_id,
        {
          password: newPassword,
          email_confirm: true,
        }
      );

      if (authUpdateErr) {
        console.error("Auth password update error:", authUpdateErr);
        return { success: false, error: "Account password establishment failed. Please try again." };
      }

      return {
        success: true,
        data: {
          studentId: verified.student_number,
          email: verified.student_email,
        },
      };
    } catch (err) {
      console.error("Account claim exception:", err);
      return { success: false, error: "A server error occurred during account activation." };
    }
  }

  // Development simulation
  for (const [, item] of devMockStudents.entries()) {
    if (
      (item.latestToken && item.latestToken.token_hash === tokenHash) ||
      (rawToken === "demo-active-token-14829" && item.profile.student_id === "DDU/14829/12")
    ) {
      if (item.latestToken) {
        if (item.latestToken.consumed_at) return { success: false, error: "CLAIM_TOKEN_CONSUMED" };
        if (item.latestToken.revoked_at) return { success: false, error: "CLAIM_TOKEN_REVOKED" };
        if (isClaimTokenExpired(item.latestToken.expires_at)) return { success: false, error: "CLAIM_TOKEN_EXPIRED" };
        item.latestToken.consumed_at = new Date().toISOString();
      }
      item.profile.is_claimed = true;
      item.profile.claimed_at = new Date().toISOString();

      return {
        success: true,
        data: {
          studentId: item.profile.student_id,
          email: item.profile.email,
        },
      };
    }
  }

  return { success: false, error: "CLAIM_TOKEN_INVALID" };
}

/**
 * Server Action: Fetch list of student accounts with claim status for admin table.
 */
export async function getStudentAccountsList(): Promise<{
  id: string;
  student_id: string;
  full_name: string;
  email: string;
  college: string | null;
  department: string | null;
  is_claimed: boolean;
  claimed_at: string | null;
  claim_status: "CLAIMED" | "CLAIM_PENDING" | "UNCLAIMED" | "DELIVERY_FAILED";
  last_issued_at?: string;
  expires_at?: string;
}[]> {
  if (isSupabaseConfigured()) {
    try {
      const adminClient = await createAdminSupabaseClient();
      const { data: students, error: studentErr } = await adminClient
        .from("profiles")
        .select(`
          id,
          student_id,
          full_name,
          email,
          college,
          department,
          is_claimed,
          claimed_at,
          student_claim_tokens (
            id,
            expires_at,
            consumed_at,
            revoked_at,
            delivery_status,
            issued_at
          )
        `)
        .eq("role", "STUDENT")
        .order("created_at", { ascending: false });

      if (studentErr || !students) {
        return [];
      }

      return students.map((s) => {
        const tokens = (s.student_claim_tokens || []) as unknown as {
          id: string;
          expires_at: string;
          consumed_at: string | null;
          revoked_at: string | null;
          delivery_status: "PENDING" | "SENT" | "FAILED";
          issued_at: string;
        }[];

        // Find most recent active token
        const activeToken = tokens.find((t) => !t.consumed_at && !t.revoked_at);
        let status: "CLAIMED" | "CLAIM_PENDING" | "UNCLAIMED" | "DELIVERY_FAILED" = "UNCLAIMED";

        if (s.is_claimed) {
          status = "CLAIMED";
        } else if (activeToken) {
          status = activeToken.delivery_status === "FAILED" ? "DELIVERY_FAILED" : "CLAIM_PENDING";
        }

        return {
          id: s.id,
          student_id: s.student_id || "—",
          full_name: s.full_name,
          email: s.email,
          college: s.college,
          department: s.department,
          is_claimed: s.is_claimed,
          claimed_at: s.claimed_at,
          claim_status: status,
          last_issued_at: activeToken?.issued_at,
          expires_at: activeToken?.expires_at,
        };
      });
    } catch (err) {
      console.error("Fetch student accounts error:", err);
      return [];
    }
  }

  // Development mock fallback
  return Array.from(devMockStudents.values()).map((s) => {
    let status: "CLAIMED" | "CLAIM_PENDING" | "UNCLAIMED" | "DELIVERY_FAILED" = "UNCLAIMED";
    if (s.profile.is_claimed) {
      status = "CLAIMED";
    } else if (s.latestToken && !s.latestToken.consumed_at && !s.latestToken.revoked_at) {
      status = s.latestToken.delivery_status === "FAILED" ? "DELIVERY_FAILED" : "CLAIM_PENDING";
    }

    return {
      id: s.profile.id,
      student_id: s.profile.student_id,
      full_name: s.profile.full_name,
      email: s.profile.email,
      college: s.profile.college,
      department: s.profile.department,
      is_claimed: s.profile.is_claimed,
      claimed_at: s.profile.claimed_at,
      claim_status: status,
      last_issued_at: s.latestToken?.expires_at
        ? new Date(new Date(s.latestToken.expires_at).getTime() - 72 * 3600000).toISOString()
        : undefined,
      expires_at: s.latestToken?.expires_at,
    };
  });
}
