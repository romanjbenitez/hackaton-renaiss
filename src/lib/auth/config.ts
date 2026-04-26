export const appRoles = ["tenant", "agency", "admin"] as const;

export type AppRole = (typeof appRoles)[number];

export const roleLabels: Record<AppRole, string> = {
  tenant: "Inquilino",
  agency: "Inmobiliaria",
  admin: "Administrador",
};

export function isAppRole(value: string | null | undefined): value is AppRole {
  return appRoles.includes(value as AppRole);
}

export function normalizeRole(value: unknown): AppRole | null {
  return typeof value === "string" && isAppRole(value) ? value : null;
}

export function getDefaultRolePath(role: AppRole) {
  return `/${role}`;
}

export function getRoleFromPathname(pathname: string) {
  const segment = pathname.split("/").filter(Boolean)[0];

  return normalizeRole(segment);
}

export function getLoginRedirect(reason?: string) {
  const search = reason ? `?error=${encodeURIComponent(reason)}` : "";

  return `/login${search}`;
}

export function getAuthCallbackUrl(nextPath = "/") {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const encodedNext = encodeURIComponent(nextPath);

  return `${appUrl}/auth/callback?next=${encodedNext}`;
}

export function isSupabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
