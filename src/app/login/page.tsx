import Link from "next/link";

import { roleLabels, normalizeRole, type AppRole, isSupabaseConfigured } from "@/lib/auth/config";
import { getDemoUserForUi } from "@/lib/auth/demo";
import { signInWithGoogleAction, signInWithPasswordAction } from "@/lib/auth/actions";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const loginRoles: AppRole[] = ["tenant", "agency", "admin"];

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getSearchValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const selectedRole = normalizeRole(getSearchValue(params.role)) ?? "tenant";
  const error = getSearchValue(params.error);
  const message = getSearchValue(params.message);
  const nextPath = getSearchValue(params.next) ?? `/${selectedRole}`;
  const isConfigured = isSupabaseConfigured();
  const demoUsers = getDemoUserForUi().filter((user) => user.role === selectedRole);

  return (
    <main className="from-background via-background to-muted/40 flex min-h-screen bg-linear-to-b">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-12 lg:grid-cols-[1.1fr_0.9fr] lg:px-10">
        <section className="border-border/60 bg-card/70 flex flex-col justify-between rounded-4xl border p-8 shadow-sm backdrop-blur lg:p-10">
          <div className="space-y-6">
            <span className="text-muted-foreground text-sm tracking-[0.3em] uppercase">
              PropTech 2026
            </span>
            <div className="space-y-4">
              <h1 className="max-w-xl text-4xl leading-tight font-semibold text-balance lg:text-6xl">
                Ingresá al flujo correcto según tu rol.
              </h1>
              <p className="text-muted-foreground max-w-2xl text-lg leading-8">
                La plataforma separa accesos para inquilinos, inmobiliarias y administración. El
                selector de rol define a qué experiencia entrás después del login.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {loginRoles.map((role) => (
              <Link
                key={role}
                href={`/login?role=${role}`}
                className={cn(
                  "rounded-3xl border p-4 text-left transition-colors",
                  selectedRole === role
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-background hover:bg-muted"
                )}
              >
                <p className="text-sm tracking-[0.22em] uppercase">
                  {role === "tenant" ? "01" : role === "agency" ? "02" : "03"}
                </p>
                <p className="mt-3 text-xl font-medium">{roleLabels[role]}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="border-border/60 bg-background rounded-4xl border p-8 shadow-sm lg:p-10">
          <div className="space-y-6">
            <div>
              <p className="text-muted-foreground text-sm tracking-[0.3em] uppercase">Acceso</p>
              <h2 className="mt-3 text-3xl font-semibold">
                Entrar como {roleLabels[selectedRole]}
              </h2>
            </div>

            {error ? (
              <div className="border-destructive/30 bg-destructive/10 text-destructive rounded-2xl border px-4 py-3 text-sm">
                {error}
              </div>
            ) : null}

            {message ? (
              <div className="border-border bg-muted rounded-2xl border px-4 py-3 text-sm">
                {message}
              </div>
            ) : null}

            {demoUsers.length > 0 ? (
              <div className="space-y-4 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-4 text-sm text-amber-950">
                <p>
                  {isConfigured
                    ? "Las credenciales demo se sincronizan automáticamente con Supabase Auth en el primer login."
                    : "Falta configurar `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Mientras tanto, el login funciona en modo demo con credenciales mock."}
                </p>
                <p className="text-xs">
                  Mostrando cuentas para {roleLabels[selectedRole]}. Cambiá el selector de rol para
                  ver las otras credenciales.
                </p>
                <ul className="space-y-3">
                  {demoUsers.map((user) => (
                    <li
                      key={user.email}
                      className="rounded-2xl border border-amber-200 bg-white/60 p-3"
                    >
                      <p className="font-medium">
                        {roleLabels[user.role]} · {user.label}
                      </p>
                      <p>`{user.email}`</p>
                      <p>`{user.password}`</p>
                      <p className="text-xs opacity-80">{user.reference}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <form action={signInWithPasswordAction} className="space-y-4">
              <input type="hidden" name="role" value={selectedRole} />
              <input type="hidden" name="next" value={nextPath} />

              <label className="block space-y-2">
                <span className="text-sm font-medium">Email</span>
                <input
                  className="border-input bg-background h-12 w-full rounded-2xl border px-4"
                  name="email"
                  type="email"
                  placeholder="nombre@empresa.com"
                  required
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium">Contraseña</span>
                <input
                  className="border-input bg-background h-12 w-full rounded-2xl border px-4"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                />
              </label>

              <button className={cn(buttonVariants({ size: "lg" }), "w-full rounded-2xl")}>
                Ingresar con email
              </button>
            </form>

            <form action={signInWithGoogleAction}>
              <input type="hidden" name="role" value={selectedRole} />
              <input type="hidden" name="next" value={nextPath} />
              <button
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "w-full rounded-2xl"
                )}
              >
                Continuar con Google
              </button>
            </form>

            <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-sm">
              <span>¿Todavía no tenés cuenta?</span>
              <Link
                href={selectedRole === "admin" ? "/register" : `/register/${selectedRole}`}
                className="text-foreground font-medium underline underline-offset-4"
              >
                Crear cuenta
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
