import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.signOut();
  } catch (err) {
    console.error("Sign-out error:", err);
  }

  const origin = new URL(request.url).origin;
  return NextResponse.redirect(new URL("/login?signed_out=true", origin), {
    status: 303,
  });
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.signOut();
  } catch (err) {
    console.error("Sign-out error:", err);
  }

  const origin = new URL(request.url).origin;
  return NextResponse.redirect(new URL("/login?signed_out=true", origin));
}
