import { redirect } from "next/navigation";

import {
  getDefaultRolePath,
  getLoginRedirect,
  isSupabaseConfigured,
  normalizeRole,
  type AppRole,
} from "@/lib/auth/config";
import { syncAuthUserToProfile, syncProfileUser } from "@/lib/auth/profile";
import { getDemoSessionFromCookies } from "@/lib/auth/demo";
import { createServerSupabaseClient } from "@/lib/auth/server";

type CurrentSession = Awaited<ReturnType<typeof getCurrentSession>>;
type AuthorizedSession = {
  role: AppRole;
  session: NonNullable<CurrentSession["session"]>;
  user: NonNullable<CurrentSession["user"]>;
  dbUser: CurrentSession["dbUser"];
};

export async function getCurrentSession() {
  if (!isSupabaseConfigured()) {
    const demoSession = await getDemoSessionFromCookies();

    if (!demoSession) {
      return { role: null, session: null, user: null, dbUser: null };
    }

    const role = normalizeRole(demoSession.role);
    const dbUser = role
      ? await syncProfileUser({
          email: demoSession.user.email,
          role,
          firstName: demoSession.user.user_metadata.first_name,
          lastName: demoSession.user.user_metadata.last_name,
          companyName: demoSession.user.user_metadata.company_name,
        })
      : null;

    return { ...demoSession, dbUser };
  }

  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return { role: null, session: null, user: null, dbUser: null };
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  const verifiedUser = userError ? null : (user ?? null);
  const role = normalizeRole(verifiedUser?.app_metadata.role ?? verifiedUser?.user_metadata.role);
  const dbUser = verifiedUser && role ? await syncAuthUserToProfile(verifiedUser, role) : null;

  return {
    role,
    session: verifiedUser ? session : null,
    user: verifiedUser,
    dbUser,
  };
}

export async function requireUserRole(role: AppRole): Promise<AuthorizedSession> {
  const session = await getCurrentSession();

  if (!session.user) {
    redirect(getLoginRedirect("Iniciá sesión para continuar."));
  }

  if (!session.role) {
    redirect(getLoginRedirect("Tu cuenta no tiene un rol asignado."));
  }

  if (session.role !== role) {
    redirect(getDefaultRolePath(session.role));
  }

  return session as AuthorizedSession;
}
