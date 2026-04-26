import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { signUpAction, signInWithGoogleAction } from "@/lib/auth/actions";
import { cn } from "@/lib/utils";

type RegisterTenantPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getSearchValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function RegisterTenantPage({ searchParams }: RegisterTenantPageProps) {
  const params = await searchParams;
  const error = getSearchValue(params.error);

  return (
    <main className="bg-muted/30 flex min-h-screen items-center px-6 py-12">
      <div className="mx-auto grid w-full max-w-5xl gap-8 lg:grid-cols-[0.85fr_1.15fr]">
        <section className="bg-background rounded-4xl border p-8 shadow-sm">
          <p className="text-sm tracking-[0.22em] text-emerald-700 uppercase">Inquilino</p>
          <h1 className="mt-4 text-4xl font-semibold text-balance">Creá tu pasaporte inquilino</h1>
          <p className="text-muted-foreground mt-4 text-lg leading-8">
            Este alta deja preparada la cuenta para onboarding, documentos y score de confianza.
          </p>
        </section>

        <section className="bg-background rounded-4xl border p-8 shadow-sm">
          {error ? (
            <div className="border-destructive/30 bg-destructive/10 text-destructive mb-6 rounded-2xl border px-4 py-3 text-sm">
              {error}
            </div>
          ) : null}

          <form action={signUpAction} className="grid gap-4 md:grid-cols-2">
            <input type="hidden" name="role" value="tenant" />

            <label className="space-y-2">
              <span className="text-sm font-medium">Nombre</span>
              <input className="h-12 w-full rounded-2xl border px-4" name="firstName" required />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium">Apellido</span>
              <input className="h-12 w-full rounded-2xl border px-4" name="lastName" required />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium">Email</span>
              <input
                className="h-12 w-full rounded-2xl border px-4"
                name="email"
                type="email"
                required
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium">Teléfono</span>
              <input className="h-12 w-full rounded-2xl border px-4" name="phone" />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium">Contraseña</span>
              <input
                className="h-12 w-full rounded-2xl border px-4"
                name="password"
                type="password"
                required
              />
            </label>

            <button
              className={cn(buttonVariants({ size: "lg" }), "mt-2 rounded-2xl md:col-span-2")}
            >
              Crear cuenta de inquilino
            </button>
          </form>

          <form action={signInWithGoogleAction} className="mt-4">
            <input type="hidden" name="role" value="tenant" />
            <input type="hidden" name="next" value="/tenant" />
            <button
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "w-full rounded-2xl"
              )}
            >
              Continuar con Google
            </button>
          </form>

          <div className="text-muted-foreground mt-6 flex items-center gap-3 text-sm">
            <span>¿Ya tenés cuenta?</span>
            <Link
              href="/login?role=tenant"
              className="text-foreground underline underline-offset-4"
            >
              Iniciar sesión
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
