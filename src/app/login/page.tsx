import Link from "next/link";

import { roleLabels, normalizeRole, type AppRole, isSupabaseConfigured } from "@/lib/auth/config";
import { getDemoUserForUi } from "@/lib/auth/demo";
import { signInWithGoogleAction, signInWithPasswordAction } from "@/lib/auth/actions";
import { LoginAccessPanel } from "@/components/auth/login-access-panel";
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
          <LoginAccessPanel
            selectedRole={selectedRole}
            nextPath={nextPath}
            error={error}
            message={message}
            isConfigured={isConfigured}
            demoUsers={demoUsers}
            signInWithPasswordAction={signInWithPasswordAction}
            signInWithGoogleAction={signInWithGoogleAction}
          />
        </section>
      </div>
    </main>
  );
}
