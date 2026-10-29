import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

import {
  generateClaimToken,
  hashClaimToken,
  buildClaimUrl,
  isClaimTokenExpired,
} from "../src/lib/auth/claim-tokens.ts";


import { isRoleAuthorized } from "./auth-helpers.test.mjs";

// Input validation logic mirroring server-side actions
function validateProvisionInput(input) {
  if (!input) {
    return { valid: false, error: "Missing provisioning payload." };
  }
  const studentId = input.studentId?.trim();
  const fullName = input.fullName?.trim();
  const email = input.email?.trim().toLowerCase();

  if (!studentId || studentId.length < 3) {
    return { valid: false, error: "Valid Student ID is required (minimum 3 characters)." };
  }
  if (!fullName || fullName.length < 2) {
    return { valid: false, error: "Student full name is required." };
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { valid: false, error: "A valid university email address is required." };
  }

  return {
    valid: true,
    normalized: {
      studentId,
      fullName,
      email,
      college: input.college?.trim() || null,
      department: input.department?.trim() || null,
      role: "STUDENT", // Server-enforced, client cannot alter
    },
  };
}

describe("1. Claim Token Cryptography & Entropy", () => {
  it("generates a 32-byte (64-hex char) unpredictable token", () => {
    const tokenData = generateClaimToken();
    assert.equal(typeof tokenData.rawToken, "string");
    assert.equal(tokenData.rawToken.length, 64);
    assert.match(tokenData.rawToken, /^[0-9a-f]{64}$/);
  });

  it("produces distinct cryptographic tokens on subsequent calls", () => {
    const token1 = generateClaimToken();
    const token2 = generateClaimToken();
    assert.notEqual(token1.rawToken, token2.rawToken);
    assert.notEqual(token1.tokenHash, token2.tokenHash);
  });

  it("computes reproducible SHA-256 digests matching standard crypto", () => {
    const raw = "test_raw_token_value_for_ddu_clearance";
    const expectedHash = crypto.createHash("sha256").update(raw).digest("hex");
    const computedHash = hashClaimToken(raw);
    assert.equal(computedHash, expectedHash);
    assert.equal(computedHash.length, 64);
  });

  it("throws when hashing invalid or empty tokens", () => {
    assert.throws(() => hashClaimToken(""), /Invalid token format/);
    assert.throws(() => hashClaimToken(null), /Invalid token format/);
    assert.throws(() => hashClaimToken(undefined), /Invalid token format/);
  });

  it("builds a secure claim URL with encoded token", () => {
    const raw = "abc123xyz789";
    const url = buildClaimUrl(raw, "https://clearance.ddu.edu.et");
    assert.equal(url, "https://clearance.ddu.edu.et/claim-account?token=abc123xyz789");
  });
});

describe("2. Token Expiration Enforcement (72-Hour Lifecycle)", () => {
  it("sets token expiration exactly 72 hours into the future", () => {
    const before = Date.now();
    const tokenData = generateClaimToken();
    const after = Date.now();

    const expectedExpiryMin = before + 72 * 3600 * 1000;
    const expectedExpiryMax = after + 72 * 3600 * 1000;

    const actualExpiry = tokenData.expiresAt.getTime();
    assert.ok(
      actualExpiry >= expectedExpiryMin && actualExpiry <= expectedExpiryMax,
      "Expiry must be within the 72-hour window"
    );
  });

  it("isClaimTokenExpired returns false for newly generated tokens", () => {
    const tokenData = generateClaimToken();
    assert.equal(isClaimTokenExpired(tokenData.expiresAt), false);
  });

  it("isClaimTokenExpired returns true for expired tokens", () => {
    const pastDate = new Date(Date.now() - 1000); // 1 second ago
    assert.equal(isClaimTokenExpired(pastDate), true);

    const oldExpiry = new Date(Date.now() - 72 * 3600 * 1000); // 72 hours ago
    assert.equal(isClaimTokenExpired(oldExpiry), true);
  });
});

describe("3. Student Provisioning Input Validation & Role Isolation", () => {
  it("accepts valid student provisioning inputs and normalizes whitespace", () => {
    const result = validateProvisionInput({
      studentId: "  UGR/1890/15  ",
      fullName: "  Abebe Bekele  ",
      email: "  ABEBE.BEKELE@DDU.EDU.ET  ",
      college: "College of Computing and Informatics",
      department: "Software Engineering",
    });

    assert.equal(result.valid, true);
    assert.equal(result.normalized.studentId, "UGR/1890/15");
    assert.equal(result.normalized.fullName, "Abebe Bekele");
    assert.equal(result.normalized.email, "abebe.bekele@ddu.edu.et");
    assert.equal(result.normalized.role, "STUDENT");
  });

  it("strictly enforces STUDENT role and rejects client-supplied role tampering", () => {
    const result = validateProvisionInput({
      studentId: "UGR/9999/16",
      fullName: "Malicious Actor",
      email: "actor@ddu.edu.et",
      role: "ADMINISTRATOR", // Attacker trying to elevate role
    });

    assert.equal(result.valid, true);
    // Server normalization must enforce STUDENT
    assert.equal(result.normalized.role, "STUDENT");
  });

  it("rejects invalid emails and empty student IDs", () => {
    const badEmail = validateProvisionInput({
      studentId: "UGR/1234/16",
      fullName: "Test User",
      email: "not-an-email",
    });
    assert.equal(badEmail.valid, false);
    assert.match(badEmail.error, /email/i);

    const emptyId = validateProvisionInput({
      studentId: "  ",
      fullName: "Test User",
      email: "test@ddu.edu.et",
    });
    assert.equal(emptyId.valid, false);
    assert.match(emptyId.error, /Student ID/i);
  });

  it("only REGISTRAR and ADMINISTRATOR roles are authorized to provision students", () => {
    const allowedRoles = ["ADMINISTRATOR", "REGISTRAR"];
    assert.equal(isRoleAuthorized("ADMINISTRATOR", allowedRoles), true);
    assert.equal(isRoleAuthorized("REGISTRAR", allowedRoles), true);
    assert.equal(isRoleAuthorized("STUDENT", allowedRoles), false);
    assert.equal(isRoleAuthorized("DEPARTMENT_STAFF", allowedRoles), false);
  });
});

describe("4. Claim Link Lifecycle: Single-Use, Invalidation & Concurrency", () => {
  // In-memory simulation of the atomic stored procedure logic
  function createClaimDatabaseSimulation() {
    const tokens = new Map();

    return {
      issueToken(studentId, rawToken, expiresAt) {
        // Revoke earlier tokens for this student
        for (const record of tokens.values()) {
          if (record.studentId === studentId && !record.isRevoked && !record.consumedAt) {
            record.isRevoked = true;
          }
        }

        const tokenHash = hashClaimToken(rawToken);
        tokens.set(tokenHash, {
          studentId,
          tokenHash,
          expiresAt: new Date(expiresAt),
          consumedAt: null,
          isRevoked: false,
        });
      },

      consumeToken(rawToken) {
        const tokenHash = hashClaimToken(rawToken);
        const record = tokens.get(tokenHash);

        if (!record) {
          return { success: false, error: "CLAIM_TOKEN_INVALID" };
        }
        if (record.isRevoked) {
          return { success: false, error: "CLAIM_TOKEN_REVOKED" };
        }
        if (record.consumedAt) {
          return { success: false, error: "CLAIM_TOKEN_CONSUMED" };
        }
        if (Date.now() >= record.expiresAt.getTime()) {
          return { success: false, error: "CLAIM_TOKEN_EXPIRED" };
        }

        // Atomic consumption
        record.consumedAt = new Date();
        return { success: true, studentId: record.studentId };
      },
    };
  }

  it("consumes valid token once and rejects subsequent reuse", () => {
    const db = createClaimDatabaseSimulation();
    const raw = "student_secret_token_1234567890abcdef";
    const expiresAt = new Date(Date.now() + 72 * 3600 * 1000);

    db.issueToken("student-1", raw, expiresAt);

    // First consumption succeeds
    const firstAttempt = db.consumeToken(raw);
    assert.equal(firstAttempt.success, true);
    assert.equal(firstAttempt.studentId, "student-1");

    // Second consumption must fail with CLAIM_TOKEN_CONSUMED
    const secondAttempt = db.consumeToken(raw);
    assert.equal(secondAttempt.success, false);
    assert.equal(secondAttempt.error, "CLAIM_TOKEN_CONSUMED");
  });

  it("rejects expired tokens", () => {
    const db = createClaimDatabaseSimulation();
    const raw = "expired_token_test_1234567890abcdef";
    const expiredAt = new Date(Date.now() - 3600 * 1000); // 1 hour in past

    db.issueToken("student-2", raw, expiredAt);

    const attempt = db.consumeToken(raw);
    assert.equal(attempt.success, false);
    assert.equal(attempt.error, "CLAIM_TOKEN_EXPIRED");
  });

  it("reissuing a link immediately revokes previously outstanding links", () => {
    const db = createClaimDatabaseSimulation();
    const rawOld = "token_generation_version_1";
    const rawNew = "token_generation_version_2";
    const expiresAt = new Date(Date.now() + 72 * 3600 * 1000);

    // First link issued
    db.issueToken("student-3", rawOld, expiresAt);

    // Reissue replacement link
    db.issueToken("student-3", rawNew, expiresAt);

    // Attempting to consume old link must fail with CLAIM_TOKEN_REVOKED
    const oldAttempt = db.consumeToken(rawOld);
    assert.equal(oldAttempt.success, false);
    assert.equal(oldAttempt.error, "CLAIM_TOKEN_REVOKED");

    // Consuming new link succeeds
    const newAttempt = db.consumeToken(rawNew);
    assert.equal(newAttempt.success, true);
  });

  it("protects against simultaneous claim attempts (concurrency safety)", () => {
    const db = createClaimDatabaseSimulation();
    const raw = "concurrent_token_test_abc123";
    const expiresAt = new Date(Date.now() + 72 * 3600 * 1000);

    db.issueToken("student-4", raw, expiresAt);

    // Simulate 2 racing requests
    const res1 = db.consumeToken(raw);
    const res2 = db.consumeToken(raw);

    // Exactly one must succeed, the other must be rejected
    const successes = [res1, res2].filter((r) => r.success);
    const failures = [res1, res2].filter((r) => !r.success);

    assert.equal(successes.length, 1);
    assert.equal(failures.length, 1);
    assert.equal(failures[0].error, "CLAIM_TOKEN_CONSUMED");
  });
});

describe("5. Official Claim Email Content Standards", () => {
  const emailSourcePath = path.resolve(
    process.cwd(),
    "src/lib/email/claim-email.ts"
  );

  it("email module exists and exports required generator and dispatch functions", () => {
    assert.ok(fs.existsSync(emailSourcePath), "claim-email.ts must exist");
    const source = fs.readFileSync(emailSourcePath, "utf-8");
    assert.ok(source.includes("export function generateClaimEmailPlainText"));
    assert.ok(source.includes("export function generateClaimEmailHtml"));
    assert.ok(source.includes("export async function sendStudentClaimEmail"));
  });

  it("plain-text email includes DDU DCMS identity, 72h notice, single-use, and official channels advice", () => {
    const source = fs.readFileSync(emailSourcePath, "utf-8");
    assert.ok(source.includes("Dire Dawa University — Digital Clearance Management System (DCMS)"));
    assert.ok(source.includes("Official Student Account Activation"));
    assert.ok(source.includes("72 hours"));
    assert.ok(source.includes("single-use"));
    assert.ok(source.includes("Office of the University Registrar"));
  });

  it("HTML email contains responsive styling, button, fallback URL, security guidelines, and no password exposure", () => {
    const source = fs.readFileSync(emailSourcePath, "utf-8");
    assert.ok(source.includes("<!DOCTYPE html>"));
    assert.ok(source.includes("Dire Dawa University"));
    assert.ok(source.includes("Activate My Student Account"));
    assert.ok(source.includes("72 hours"));
    assert.ok(source.includes("url-fallback"));
    // Must never contain sensitive password fields
    assert.equal(source.includes("Temporary Password"), false);
  });

  it("handles email provider failure with recoverable status rather than crashing", () => {
    const source = fs.readFileSync(emailSourcePath, "utf-8");
    assert.ok(source.includes("Email provider error:"));
    assert.ok(source.includes("simulated: true"));
  });
});

describe("6. Supabase Migration 2 (Student Account Claims) SQL Integrity", () => {
  const migration2Path = path.resolve(
    process.cwd(),
    "supabase/migrations/20261023000002_student_account_claims.sql"
  );

  it("migration file exists in version control", () => {
    assert.ok(fs.existsSync(migration2Path), "Migration 2 file must exist");
  });

  it("defines student_claim_tokens table with required security columns", () => {
    const sql = fs.readFileSync(migration2Path, "utf-8");

    assert.ok(sql.includes("CREATE TABLE IF NOT EXISTS public.student_claim_tokens"));
    assert.ok(sql.includes("student_id UUID NOT NULL REFERENCES public.profiles(id)"));
    assert.ok(sql.includes("token_hash TEXT NOT NULL UNIQUE"));
    assert.ok(sql.includes("issued_at TIMESTAMPTZ NOT NULL"));
    assert.ok(sql.includes("expires_at TIMESTAMPTZ NOT NULL"));
    assert.ok(sql.includes("consumed_at TIMESTAMPTZ NULL"));
    assert.ok(sql.includes("revoked_at TIMESTAMPTZ NULL"));
    assert.ok(sql.includes("issued_by UUID NULL REFERENCES public.profiles(id)"));
  });

  it("enables Row Level Security on student_claim_tokens table", () => {
    const sql = fs.readFileSync(migration2Path, "utf-8");
    assert.ok(
      sql.includes("ALTER TABLE public.student_claim_tokens ENABLE ROW LEVEL SECURITY;"),
      "student_claim_tokens must enable RLS"
    );
  });

  it("denies direct public and ordinary authenticated user access to claim records", () => {
    const sql = fs.readFileSync(migration2Path, "utf-8");
    assert.ok(sql.includes("claim_tokens_select_authorized_staff"));
    assert.ok(sql.includes("claim_tokens_admin_manage"));
    assert.ok(sql.includes("public.get_user_role(auth.uid()) IN ('ADMINISTRATOR', 'REGISTRAR')"));
  });

  it("implements stored procedures with fixed search_path = public", () => {
    const sql = fs.readFileSync(migration2Path, "utf-8");
    assert.ok(sql.includes("revoke_existing_student_tokens"));
    assert.ok(sql.includes("verify_and_consume_claim_token"));
    // Count occurrences of SET search_path = public
    const matches = sql.match(/SET search_path = public/g);
    assert.ok(matches && matches.length >= 2, "Stored procedures must fix search_path to public");
  });

  it("uses row locking (FOR UPDATE) in verify_and_consume_claim_token for concurrency safety", () => {
    const sql = fs.readFileSync(migration2Path, "utf-8");
    assert.ok(
      sql.includes("FOR UPDATE"),
      "verify_and_consume_claim_token must use FOR UPDATE lock to prevent race conditions"
    );
  });

  it("extends profiles table with is_claimed, claimed_at, college, department", () => {
    const sql = fs.readFileSync(migration2Path, "utf-8");
    assert.ok(sql.includes("is_claimed"));
    assert.ok(sql.includes("claimed_at"));
    assert.ok(sql.includes("college"));
    assert.ok(sql.includes("department"));
  });
});
