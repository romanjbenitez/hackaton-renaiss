import "server-only";

import type { User } from "@supabase/supabase-js";

import type { DemoUserRecord } from "@/lib/auth/demo";
import { createSupabaseAdminClient, isSupabaseAdminConfigured } from "@/lib/auth/supabase-admin";

function buildUserMetadata(user: DemoUserRecord) {
  return {
    first_name: user.firstName,
    last_name: user.lastName,
    company_name: user.companyName ?? null,
    role: user.role,
    source: user.source,
    reference: user.reference ?? null,
  };
}

async function findSupabaseUserByEmail(email: string) {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return null;
  }

  const perPage = 200;

  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });

    if (error) {
      throw new Error(error.message);
    }

    const match =
      data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase()) ?? null;

    if (match || data.users.length < perPage) {
      return match;
    }
  }

  return null;
}

async function updateExistingSupabaseUser(existingUser: User, user: DemoUserRecord) {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    throw new Error("Supabase admin no configurado.");
  }

  const { data, error } = await supabase.auth.admin.updateUserById(existingUser.id, {
    email: user.email,
    password: user.password,
    email_confirm: true,
    user_metadata: buildUserMetadata(user),
    app_metadata: {
      role: user.role,
      source: user.source,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  return data.user;
}

export async function ensureSupabaseAuthUserForDemoUser(user: DemoUserRecord) {
  if (!isSupabaseAdminConfigured()) {
    return null;
  }

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return null;
  }

  const createResult = await supabase.auth.admin.createUser({
    email: user.email,
    password: user.password,
    email_confirm: true,
    user_metadata: buildUserMetadata(user),
    app_metadata: {
      role: user.role,
      source: user.source,
    },
  });

  if (!createResult.error) {
    return createResult.data.user;
  }

  const existingUser = await findSupabaseUserByEmail(user.email);

  if (!existingUser) {
    throw new Error(createResult.error.message);
  }

  return updateExistingSupabaseUser(existingUser, user);
}
