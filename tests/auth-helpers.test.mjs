import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

// Pure logic unit tests for authorization and security functions
function validatePassword(password) {
  if (!password || password.length < 8) {
    return {
      valid: false,
      message: "Password must be at least 8 characters long.",
    };
  }
  return { valid: true };
}

function getDashboardRouteForRole(role) {
  switch (role) {
    case "STUDENT":
      return "/student";
    case "DEPARTMENT_STAFF":
      return "/department";
    case "REGISTRAR":
      return "/registrar";
    case "ADMINISTRATOR":
      return "/admin";
    default:
      return "/login";
  }
}

export function isRoleAuthorized(userRole, allowedRoles) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  return roles.includes(userRole);
}

describe("DDU DCMS Password Validation Rules", () => {
  it("should reject empty or null passwords", () => {
    assert.equal(validatePassword("").valid, false);
    assert.equal(validatePassword(null).valid, false);
    assert.equal(validatePassword(undefined).valid, false);
  });

  it("should reject passwords shorter than 8 characters", () => {
    assert.equal(validatePassword("1234567").valid, false);
    assert.equal(validatePassword("short").valid, false);
    assert.match(validatePassword("short").message, /at least 8 characters/);
  });

  it("should accept passwords with 8 or more characters", () => {
    assert.equal(validatePassword("12345678").valid, true);
    assert.equal(validatePassword("DDU-Clearance-2026!").valid, true);
    assert.equal(validatePassword("long_secure_passphrase").valid, true);
  });
});

describe("DDU DCMS Role-Based Route Mapping", () => {
  it("should route STUDENT to /student", () => {
    assert.equal(getDashboardRouteForRole("STUDENT"), "/student");
  });

  it("should route DEPARTMENT_STAFF to /department", () => {
    assert.equal(getDashboardRouteForRole("DEPARTMENT_STAFF"), "/department");
  });

  it("should route REGISTRAR to /registrar", () => {
    assert.equal(getDashboardRouteForRole("REGISTRAR"), "/registrar");
  });

  it("should route ADMINISTRATOR to /admin", () => {
    assert.equal(getDashboardRouteForRole("ADMINISTRATOR"), "/admin");
  });

  it("should fallback unknown roles to /login", () => {
    assert.equal(getDashboardRouteForRole("UNKNOWN"), "/login");
  });
});

describe("DDU DCMS Role Permission Matrix", () => {
  it("STUDENT should only be authorized for student routes", () => {
    assert.equal(isRoleAuthorized("STUDENT", ["STUDENT"]), true);
    assert.equal(isRoleAuthorized("STUDENT", ["DEPARTMENT_STAFF"]), false);
    assert.equal(isRoleAuthorized("STUDENT", ["REGISTRAR"]), false);
    assert.equal(isRoleAuthorized("STUDENT", ["ADMINISTRATOR"]), false);
  });

  it("DEPARTMENT_STAFF should only be authorized for department review routes", () => {
    assert.equal(isRoleAuthorized("DEPARTMENT_STAFF", ["DEPARTMENT_STAFF"]), true);
    assert.equal(isRoleAuthorized("DEPARTMENT_STAFF", ["ADMINISTRATOR"]), false);
  });

  it("REGISTRAR authority must remain distinct from ADMINISTRATOR", () => {
    assert.equal(isRoleAuthorized("REGISTRAR", ["REGISTRAR"]), true);
    assert.equal(isRoleAuthorized("REGISTRAR", ["ADMINISTRATOR"]), false);
  });
});

describe("DDU DCMS Supabase SQL Migration Integrity", () => {
  const migrationPath = path.resolve(
    process.cwd(),
    "supabase/migrations/20261023000001_initial_schema.sql"
  );

  it("migration file exists in version control", () => {
    assert.ok(fs.existsSync(migrationPath), "Migration file must exist");
  });

  it("contains all 8 required seeded clearance units", () => {
    const sql = fs.readFileSync(migrationPath, "utf-8");
    const requiredCodes = [
      "REGISTRAR",
      "FINANCE",
      "LIBRARY",
      "DORMITORY",
      "CAFETERIA",
      "BOOKSTORE",
      "STUDENT_LOAN",
      "FACULTY_OFFICES",
    ];

    for (const code of requiredCodes) {
      assert.ok(
        sql.includes(code),
        `Migration must seed unit with code: ${code}`
      );
    }
  });

  it("enables RLS on profiles, departments, and staff assignments", () => {
    const sql = fs.readFileSync(migrationPath, "utf-8");
    assert.ok(sql.includes("ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;"));
    assert.ok(sql.includes("ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;"));
    assert.ok(sql.includes("ALTER TABLE public.department_staff_assignments ENABLE ROW LEVEL SECURITY;"));
  });

  it("includes privilege escalation prevention trigger", () => {
    const sql = fs.readFileSync(migrationPath, "utf-8");
    assert.ok(sql.includes("protect_profile_fields"));
    assert.ok(sql.includes("Users cannot modify their own role"));
    assert.ok(sql.includes("Users cannot modify their activation status"));
  });
});
