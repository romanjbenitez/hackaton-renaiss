"use server";

import { redirect } from "next/navigation";

import {
  getAuthCallbackUrl,
  getDefaultRolePath,
  getLoginRedirect,
  isAppRole,
  isSupabaseConfigured,
  normalizeRole,
  type AppRole,
} from "@/lib/auth/config";
import {
  clearDemoSessionCookie,
  findDemoUserByCredentials,
  setDemoSessionCookie,
} from "@/lib/auth/demo";
import { ensureSupabaseAuthUserForDemoUser } from "@/lib/auth/supabase-demo-sync";
import { createServerSupabaseClient } from "@/lib/auth/server";

function getErrorRedirect(pathname: string, message: string) {
  return `${pathname}?error=${encodeURIComponent(message)}`;
}

function getNextPath(formData: FormData, fallbackRole: AppRole) {
  const nextPath = formData.get("next");

  if (typeof nextPath === "string" && nextPath.startsWith("/")) {
    return nextPath;
  }

  return getDefaultRolePath(fallbackRole);
}

export async function signInWithPasswordAction(formData: FormData) {
  const roleValue = formData.get("role");
  const email = formData.get("email");
  const password = formData.get("password");

  if (!isSupabaseConfigured()) {
    if (typeof roleValue !== "string" || !isAppRole(roleValue)) {
      redirect(getErrorRedirect("/login", "Seleccioná un rol válido."));
    }

    if (typeof email !== "string" || typeof password !== "string") {
      redirect(getErrorRedirect("/login", "Completá email y contraseña."));
    }

    const demoUser = findDemoUserByCredentials(roleValue, email, password);

    if (!demoUser) {
      redirect(getErrorRedirect("/login", "Credenciales demo inválidas."));
    }

    await setDemoSessionCookie(demoUser);
    redirect(getNextPath(formData, demoUser.role));
  }

  if (typeof roleValue !== "string" || !isAppRole(roleValue)) {
    redirect(getErrorRedirect("/login", "Seleccioná un rol válido."));
  }

  if (typeof email !== "string" || typeof password !== "string") {
    redirect(getErrorRedirect("/login", "Completá email y contraseña."));
  }

  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    redirect(getErrorRedirect("/login", "No se pudo inicializar Supabase."));
  }

  const matchingDemoUser = findDemoUserByCredentials(roleValue, email, password);

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

  if (signedInRole && signedInRole !== roleValue) {
    await supabase.auth.signOut();
    redirect(getErrorRedirect("/login", "El rol seleccionado no coincide con tu cuenta."));
  }

  redirect(getNextPath(formData, signedInRole));
}

export async function signInWithGoogleAction(formData: FormData) {
  const roleValue = formData.get("role");

  if (!isSupabaseConfigured()) {
    redirect(
      getErrorRedirect("/login", "Google OAuth no está disponible mientras la app corre en modo demo.")
    );
  }

  if (typeof roleValue !== "string" || !isAppRole(roleValue)) {
    redirect(getErrorRedirect("/login", "Seleccioná un rol válido."));
  }

  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    redirect(getErrorRedirect("/login", "No se pudo inicializar Supabase."));
  }

  const nextPath = getNextPath(formData, roleValue);
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: getAuthCallbackUrl(nextPath),
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

  if (
    typeof firstName !== "string" ||
    typeof lastName !== "string" ||
    typeof email !== "string" ||
    typeof password !== "string"
  ) {
    redirect(getErrorRedirect(`/register/${roleValue}`, "Completá los campos obligatorios."));
  }

  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    redirect(getLoginRedirect("No se pudo inicializar Supabase."));
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: getAuthCallbackUrl(getDefaultRolePath(roleValue)),
      data: {
        role: roleValue,
        first_name: firstName,
        last_name: lastName,
        company_name: typeof companyName === "string" ? companyName : null,
        phone: typeof phone === "string" ? phone : null,
      },
    },
  });

  if (error) {
    redirect(getErrorRedirect(`/register/${roleValue}`, error.message));
  }

  redirect(
    `/login?role=${roleValue}&message=${encodeURIComponent(
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
