import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY ?? "";

/** True when both Supabase env vars are set for the current build. */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

let client: SupabaseClient | null = null;

/**
 * Shared Supabase browser client for RBAC tables and future realtime/storage features.
 * Returns null when env vars are missing so callers can fall back to the .NET API.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) {
    return null;
  }

  if (!client) {
    client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return client;
}

/** Lightweight connectivity probe against the migrated `modules` table. */
export async function checkSupabaseConnection(): Promise<{
  ok: boolean;
  moduleCount?: number;
  error?: string;
}> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { ok: false, error: "Supabase env vars are not configured" };
  }

  const { count, error } = await supabase
    .from("modules")
    .select("module_id", { count: "exact", head: true });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true, moduleCount: count ?? 0 };
}
