import { isSupabaseConfigured } from "@/lib/auth/config";
import { getDemoUserForUi } from "@/lib/auth/demo";
import { signInWithGoogleAction, signInWithPasswordAction } from "@/lib/auth/actions";
import { LoginAccessPanel } from "@/components/auth/login-access-panel";

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getSearchValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const error = getSearchValue(params.error);
  const message = getSearchValue(params.message);
  const nextPath = getSearchValue(params.next) ?? "/";
  const isConfigured = isSupabaseConfigured();
  const demoUsers = [
    ...getDemoUserForUi().filter((user) => user.role === "tenant").slice(0, 4),
    ...getDemoUserForUi().filter((user) => user.role !== "tenant"),
  ];

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
                Un solo acceso, el sistema resuelve tu rol.
              </h1>
              <p className="text-muted-foreground max-w-2xl text-lg leading-8">
                Inquilinos, inmobiliarias y administración usan el mismo login. Después de
                autenticarte, la app detecta tu rol y te lleva al flujo correcto.
              </p>
            </div>
          </div>
        </section>

        <section className="border-border/60 bg-background rounded-4xl border p-8 shadow-sm lg:p-10">
          <LoginAccessPanel
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
