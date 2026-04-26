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

function hasConfiguredEnvValue(value: string | undefined) {
  if (!value) {
    return false;
  }

  const normalized = value.trim();

  if (!normalized) {
    return false;
  }

  const placeholderValues = new Set([
    "TU_ANON_KEY",
    "TU_SERVICE_ROLE_KEY",
    "your-anon-key",
    "your-service-role-key",
    "your-project-url",
    "https://your-project.supabase.co",
  ]);

  return !placeholderValues.has(normalized);
}

export function isSupabaseConfigured() {
  return (
    hasConfiguredEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    hasConfiguredEnvValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  );
}

export function isSupabaseEnvValueConfigured(value: string | undefined) {
  return hasConfiguredEnvValue(value);
}
