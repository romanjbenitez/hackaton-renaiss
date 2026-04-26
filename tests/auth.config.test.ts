import test from "node:test";
import assert from "node:assert/strict";

import { isSupabaseConfigured, isSupabaseEnvValueConfigured } from "../src/lib/auth/config";

test("isSupabaseEnvValueConfigured rejects placeholder values", () => {
  assert.equal(isSupabaseEnvValueConfigured(undefined), false);
  assert.equal(isSupabaseEnvValueConfigured(""), false);
  assert.equal(isSupabaseEnvValueConfigured("TU_ANON_KEY"), false);
  assert.equal(isSupabaseEnvValueConfigured("TU_SERVICE_ROLE_KEY"), false);
  assert.equal(isSupabaseEnvValueConfigured("your-anon-key"), false);
  assert.equal(isSupabaseEnvValueConfigured("your-service-role-key"), false);
  assert.equal(isSupabaseEnvValueConfigured("https://your-project.supabase.co"), false);
});

test("isSupabaseConfigured only enables Supabase with real values", () => {
  const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const originalAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://your-project.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "TU_ANON_KEY";
  assert.equal(isSupabaseConfigured(), false);

  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "sb_publishable_xxx";
  assert.equal(isSupabaseConfigured(), true);

  if (originalUrl === undefined) {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  } else {
    process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
  }

  if (originalAnon === undefined) {
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  } else {
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalAnon;
  }
});
