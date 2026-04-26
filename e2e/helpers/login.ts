const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const SUPABASE_PROJECT_REF = SUPABASE_URL.replace("https://", "").split(".")[0];
const AUTH_COOKIE_NAME = `sb-${SUPABASE_PROJECT_REF}-auth-token`;
const CHUNK_SIZE = 3180;

type SupabaseSession = {
  access_token: string;
  token_type: string;
  expires_in: number;
  expires_at?: number;
  refresh_token: string;
  user: unknown;
};

const DEMO_CREDENTIALS = {
  tenant: {
    email: "monica.rosa.alustiza+13452513@demo.proptech.ar",
    password: "demo-13452513",
  },
  agency: {
    email: "contacto@remax-palermo.ar",
    password: "demo-agency",
  },
} as const;

function sessionToCookieHeader(session: SupabaseSession): string {
  const json = JSON.stringify(session);
  const b64 = Buffer.from(json, "utf8")
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  const value = `base64-${b64}`;

  const chunks: string[] = [];
  for (let i = 0; i < value.length; i += CHUNK_SIZE) {
    chunks.push(value.slice(i, i + CHUNK_SIZE));
  }

  return chunks
    .map((chunk, i) =>
      chunks.length === 1
        ? `${AUTH_COOKIE_NAME}=${chunk}`
        : `${AUTH_COOKIE_NAME}.${i}=${chunk}`
    )
    .join("; ");
}

type CookieEntry = {
  name: string;
  value: string;
  domain: string;
  path: string;
  httpOnly: boolean;
  sameSite: "Lax";
};

function sessionToCookies(session: SupabaseSession, domain: string): CookieEntry[] {
  const json = JSON.stringify(session);
  const b64 = Buffer.from(json, "utf8")
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  const value = `base64-${b64}`;

  const chunks: string[] = [];
  for (let i = 0; i < value.length; i += CHUNK_SIZE) {
    chunks.push(value.slice(i, i + CHUNK_SIZE));
  }

  return chunks.map((chunk, i) => ({
    name: chunks.length === 1 ? AUTH_COOKIE_NAME : `${AUTH_COOKIE_NAME}.${i}`,
    value: chunk,
    domain,
    path: "/",
    httpOnly: true,
    sameSite: "Lax" as const,
  }));
}

/**
 * Returns cookies for context.addCookies(), or null if Supabase is unreachable.
 * Results are cached per test run.
 */
export async function getAuthCookies(
  role: "tenant" | "agency",
  domain = "localhost"
): Promise<CookieEntry[] | null> {
  const session = await getSession(role);
  if (!session) return null;
  return sessionToCookies(session, domain);
}

/**
 * Returns a cookie header string for a demo user, or null if Supabase is unreachable.
 * Results are cached per test run.
 */
const sessionCache = new Map<string, SupabaseSession | null>();

async function getSession(role: "tenant" | "agency"): Promise<SupabaseSession | null> {
  if (sessionCache.has(role)) return sessionCache.get(role) ?? null;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    sessionCache.set(role, null);
    return null;
  }

  const { email, password } = DEMO_CREDENTIALS[role];

  try {
    const response = await fetch(
      `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
      {
        method: "POST",
        headers: { apikey: SUPABASE_ANON_KEY, "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      }
    );

    if (!response.ok) {
      sessionCache.set(role, null);
      return null;
    }

    const data = (await response.json()) as SupabaseSession & { error?: string };
    const session = data.access_token ? data : null;
    sessionCache.set(role, session);
    return session;
  } catch {
    sessionCache.set(role, null);
    return null;
  }
}

/**
 * Returns a `cookie` header string with valid Supabase auth for the given demo role.
 * Returns null if Supabase auth is unavailable.
 */
export async function getAuthCookieHeader(
  role: "tenant" | "agency"
): Promise<string | null> {
  const session = await getSession(role);
  if (!session) return null;
  return sessionToCookieHeader(session);
}
