import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Supabase Auth Callback Handler.
 * Exchanges authorization code for session cookies and redirects user to target destination.
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/";

  if (code) {
    try {
      const supabase = await createServerSupabaseClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error) {
        return NextResponse.redirect(new URL(next, requestUrl.origin));
      }

      console.error("Auth callback session exchange error:", error.message);
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(error.message)}`, requestUrl.origin)
      );
    } catch (err) {
      console.error("Unexpected error during auth code exchange:", err);
      return NextResponse.redirect(
        new URL("/login?error=auth_callback_failed", requestUrl.origin)
      );
    }
  }

  // No code provided in query params
  return NextResponse.redirect(new URL("/login", requestUrl.origin));
}
