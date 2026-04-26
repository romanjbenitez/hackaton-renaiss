import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { createClient } from "@supabase/supabase-js";

import demoUsers from "../src/lib/auth/demo-users.json";

type DemoUserRecord = (typeof demoUsers)[number];

function loadEnvFile(filePath: string) {
  if (!existsSync(filePath)) {
    return;
  }

  const content = readFileSync(filePath, "utf8");

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");

    if (separatorIndex < 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const rawValue = line.slice(separatorIndex + 1).trim();
    const normalizedValue = rawValue.replace(/^['"]|['"]$/g, "");

    if (!(key in process.env)) {
      process.env[key] = normalizedValue;
    }
  }
}

function ensureEnvLoaded() {
  const cwd = process.cwd();

  loadEnvFile(path.join(cwd, ".env"));
  loadEnvFile(path.join(cwd, ".env.local"));
}

function getBucketName() {
  return process.env.SUPABASE_STORAGE_BUCKET?.trim() || "tenant-documents";
}

function buildMetadata(user: DemoUserRecord) {
  return {
    first_name: user.firstName,
    last_name: user.lastName,
    company_name: user.companyName ?? null,
    role: user.role,
    source: user.source,
    reference: user.reference ?? null,
  };
}

async function findUserByEmail(
  supabase: ReturnType<typeof createClient<any>>,
  email: string
) {
  const perPage = 200;

  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });

    if (error) {
      throw new Error(error.message);
    }

    const match =
      data.users.find((candidate) => candidate.email?.toLowerCase() === email.toLowerCase()) ??
      null;

    if (match || data.users.length < perPage) {
      return match;
    }
  }

  return null;
}

async function ensureBucket(supabase: ReturnType<typeof createClient<any>>) {
  const bucketName = getBucketName();
  const { data, error } = await supabase.storage.getBucket(bucketName);

  if (!error && data) {
    return bucketName;
  }

  const createResult = await supabase.storage.createBucket(bucketName, {
    public: false,
    fileSizeLimit: 10 * 1024 * 1024,
  });

  if (createResult.error && !createResult.error.message.toLowerCase().includes("already exists")) {
    throw new Error(createResult.error.message);
  }

  return bucketName;
}

async function syncUser(
  supabase: ReturnType<typeof createClient<any>>,
  user: DemoUserRecord
) {
  const createResult = await supabase.auth.admin.createUser({
    email: user.email,
    password: user.password,
    email_confirm: true,
    user_metadata: buildMetadata(user),
    app_metadata: {
      role: user.role,
      source: user.source,
    },
  });

  if (!createResult.error) {
    return { email: user.email, action: "created" as const };
  }

  const existingUser = await findUserByEmail(supabase, user.email);

  if (!existingUser) {
    throw new Error(createResult.error.message);
  }

  const updateResult = await supabase.auth.admin.updateUserById(existingUser.id, {
    email: user.email,
    password: user.password,
    email_confirm: true,
    user_metadata: buildMetadata(user),
    app_metadata: {
      role: user.role,
      source: user.source,
    },
  });

  if (updateResult.error) {
    throw new Error(updateResult.error.message);
  }

  return { email: user.email, action: "updated" as const };
}

async function main() {
  ensureEnvLoaded();

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY. Configuralas en .env o .env.local."
    );
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  const bucketName = await ensureBucket(supabase);
  const results = [];

  for (const user of demoUsers) {
    const result = await syncUser(supabase, user);
    results.push(result);
  }

  console.log(`Bucket listo: ${bucketName}`);
  console.log(`Usuarios sincronizados: ${results.length}`);

  for (const result of results) {
    console.log(`- ${result.action}: ${result.email}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
