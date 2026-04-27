"use server";

import { redirect } from "next/navigation";

import {
  getAuthCallbackUrl,
  getDefaultRolePath,
  getLoginRedirect,
  isAppRole,
  isSupabaseConfigured,
  normalizeRole,
} from "@/lib/auth/config";
import {
  clearDemoSessionCookie,
  findDemoUserByLogin,
  setDemoSessionCookie,
} from "@/lib/auth/demo";
import { ensureSupabaseAuthUserForDemoUser } from "@/lib/auth/supabase-demo-sync";
import { createServerSupabaseClient } from "@/lib/auth/server";

function getErrorRedirect(pathname: string, message: string) {
  return `${pathname}?error=${encodeURIComponent(message)}`;
}

function getNextPath(formData: FormData, fallbackPath: string) {
  const nextPath = formData.get("next");

  if (typeof nextPath === "string" && nextPath.startsWith("/") && nextPath !== "/") {
    return nextPath;
  }

  return fallbackPath;
}

export async function signInWithPasswordAction(formData: FormData) {
  const email = formData.get("email");
  const password = formData.get("password");

  if (!isSupabaseConfigured()) {
    if (typeof email !== "string" || typeof password !== "string") {
      redirect(getErrorRedirect("/login", "Completá email y contraseña."));
    }

    const demoUser = findDemoUserByLogin(email, password);

    if (!demoUser) {
      redirect(getErrorRedirect("/login", "Credenciales demo inválidas."));
    }

    await setDemoSessionCookie(demoUser);
    redirect(getNextPath(formData, getDefaultRolePath(demoUser.role)));
  }

  if (typeof email !== "string" || typeof password !== "string") {
    redirect(getErrorRedirect("/login", "Completá email y contraseña."));
  }

  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    redirect(getErrorRedirect("/login", "No se pudo inicializar Supabase."));
  }

  const matchingDemoUser = findDemoUserByLogin(email, password);

  if (matchingDemoUser) {
    try {
      await ensureSupabaseAuthUserForDemoUser(matchingDemoUser);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo sincronizar el usuario demo.";
      redirect(getErrorRedirect("/login", message));
    }
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(getErrorRedirect("/login", error.message));
  }

  const signedInRole = normalizeRole(data.user?.app_metadata.role ?? data.user?.user_metadata.role);

  if (!signedInRole) {
    await supabase.auth.signOut();
    redirect(getErrorRedirect("/login", "Tu cuenta no tiene un rol asignado."));
  }

  redirect(getNextPath(formData, getDefaultRolePath(signedInRole)));
}

export async function signInWithGoogleAction(formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirect(
      getErrorRedirect("/login", "Google OAuth no está disponible mientras la app corre en modo demo.")
    );
  }

  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    redirect(getErrorRedirect("/login", "No se pudo inicializar Supabase."));
  }

  const nextPath = formData.get("next");
  const resolvedNextPath =
    typeof nextPath === "string" && nextPath.startsWith("/") && nextPath !== "/" ? nextPath : "/";
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: getAuthCallbackUrl(resolvedNextPath),
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error || !data.url) {
    redirect(getErrorRedirect("/login", error?.message ?? "No se pudo iniciar Google OAuth."));
  }

  redirect(data.url);
}

export async function signUpAction(formData: FormData) {
  const roleValue = formData.get("role");
  const firstName = formData.get("firstName");
  const lastName = formData.get("lastName");
  const email = formData.get("email");
  const password = formData.get("password");
  const companyName = formData.get("companyName");
  const phone = formData.get("phone");

  if (!isSupabaseConfigured()) {
    redirect(
      getLoginRedirect("El registro está deshabilitado en modo demo. Usá una de las credenciales de prueba.")
    );
  }

  if (typeof roleValue !== "string" || !isAppRole(roleValue) || roleValue === "admin") {
    redirect(getLoginRedirect("El rol de registro no es válido."));
  }

  const registrationRole: "tenant" | "agency" = roleValue;

  if (
    typeof firstName !== "string" ||
    typeof lastName !== "string" ||
    typeof email !== "string" ||
    typeof password !== "string"
  ) {
    redirect(getErrorRedirect(`/register/${registrationRole}`, "Completá los campos obligatorios."));
  }

  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    redirect(getLoginRedirect("No se pudo inicializar Supabase."));
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: getAuthCallbackUrl(getDefaultRolePath(registrationRole)),
      data: {
        role: registrationRole,
        first_name: firstName,
        last_name: lastName,
        company_name: typeof companyName === "string" ? companyName : null,
        phone: typeof phone === "string" ? phone : null,
      },
    },
  });

  if (error) {
    redirect(getErrorRedirect(`/register/${registrationRole}`, error.message));
  }

  redirect(
    `/login?message=${encodeURIComponent(
      "Cuenta creada. Revisá tu email para confirmar el acceso."
    )}`
  );
}

export async function signOutAction() {
  if (!isSupabaseConfigured()) {
    await clearDemoSessionCookie();
    redirect("/login?message=Sesión%20cerrada");
  }

  const supabase = await createServerSupabaseClient();

  if (supabase) {
    await supabase.auth.signOut();
  }

  redirect("/login?message=Sesión%20cerrada");
}
