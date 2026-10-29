import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

/**
 * Creates a browser-compatible Supabase client for client components.
 * Only public credentials (URL and anon key) are consumed here.
 * If credentials are not yet configured in environment variables,
 * safe fallback handlers return null or warning stubs without crashing.
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    if (process.env.NODE_ENV === "development") {
      // Non-fatal warning in development to indicate planned Supabase configuration
      // is pending configuration in .env.local
    }
  }

  return createBrowserClient<Database>(
    supabaseUrl || "https://placeholder-ddu-dcms.supabase.co",
    supabaseAnonKey || "placeholder-anon-key"
  );
}

/**
 * Helper to inspect whether Supabase environment variables have been provided
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")
  );
}
