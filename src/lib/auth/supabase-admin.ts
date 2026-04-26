import "server-only";

import { createClient } from "@supabase/supabase-js";

import { isSupabaseEnvValueConfigured } from "@/lib/auth/config";

export function isSupabaseAdminConfigured() {
  return (
    isSupabaseEnvValueConfigured(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    isSupabaseEnvValueConfigured(process.env.SUPABASE_SERVICE_ROLE_KEY)
  );
}

export function createSupabaseAdminClient() {
  if (!isSupabaseAdminConfigured()) {
    return null;
  }

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
