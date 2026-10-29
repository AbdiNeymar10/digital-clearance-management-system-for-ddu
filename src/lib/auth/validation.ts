import type { UserRole } from "@/types/database";

/**
 * Validates password criteria: minimum 8 characters.
 * Safe for both Client Components and Server Components.
 */
export function validatePassword(password: string): {
  valid: boolean;
  message?: string;
} {
  if (!password || password.length < 8) {
    return {
      valid: false,
      message: "Password must be at least 8 characters long.",
    };
  }
  return { valid: true };
}

/**
 * Returns the canonical dashboard route for a given user role.
 * Safe for both Client Components and Server Components.
 */
export function getDashboardRouteForRole(role: UserRole): string {
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
