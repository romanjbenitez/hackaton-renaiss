import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function RegisterPage() {
  return (
    <main className="bg-muted/30 flex min-h-screen items-center px-6 py-12">
      <div className="mx-auto grid w-full max-w-4xl gap-6 md:grid-cols-2">
        <section className="bg-background rounded-4xl border p-8 shadow-sm">
          <p className="text-muted-foreground text-sm tracking-[0.3em] uppercase">Registro</p>
          <h1 className="mt-4 text-4xl font-semibold text-balance">
            Elegí cómo querés entrar a la plataforma.
          </h1>
          <p className="text-muted-foreground mt-4 text-lg leading-8">
            El flujo cambia según si vas a postularte a propiedades o gestionar candidaturas desde
            una inmobiliaria.
          </p>
        </section>

        <section className="grid gap-4">
          <Link
            href="/register/tenant"
            className="bg-background rounded-4xl border p-6 shadow-sm transition-transform hover:-translate-y-0.5"
          >
            <p className="text-sm tracking-[0.22em] text-emerald-700 uppercase">Inquilino</p>
            <h2 className="mt-3 text-2xl font-semibold">Crear pasaporte inquilino</h2>
            <p className="text-muted-foreground mt-3">
              Alta rápida para empezar con onboarding, documentos y score de confianza.
            </p>
          </Link>

          <Link
            href="/register/agency"
            className="bg-background rounded-4xl border p-6 shadow-sm transition-transform hover:-translate-y-0.5"
          >
            <p className="text-sm tracking-[0.22em] text-sky-700 uppercase">Inmobiliaria</p>
            <h2 className="mt-3 text-2xl font-semibold">Registrar una inmobiliaria</h2>
            <p className="text-muted-foreground mt-3">
              Crea la cuenta de la agencia y dejala lista para aprobación del admin.
            </p>
          </Link>

          <Link href="/login" className={cn(buttonVariants({ variant: "outline" }), "rounded-2xl")}>
            Ya tengo cuenta
          </Link>
        </section>
      </div>
    </main>
  );
}
