import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const roleCards = [
  {
    href: "/register/tenant",
    eyebrow: "Inquilino",
    title: "Pasaporte portable con score y documentación",
    description: "Perfil verificado para postularse más rápido y compartirlo entre inmobiliarias.",
  },
  {
    href: "/register/agency",
    eyebrow: "Inmobiliaria",
    title: "CRM operativo para propiedades, candidatos y transacciones",
    description: "Alta de propiedades, ranking de candidatos y seguimiento compartido del proceso.",
  },
  {
    href: "/login?role=admin",
    eyebrow: "Admin",
    title: "Gobernanza de agencias, documentos y métricas",
    description:
      "Control del marketplace con aprobaciones, alertas y vista global de la plataforma.",
  },
];

export default function Home() {
  return (
    <main className="from-background via-background to-muted/40 min-h-screen bg-linear-to-b">
      <section className="mx-auto max-w-6xl px-6 py-16 lg:px-10 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-8">
            <p className="text-muted-foreground text-sm tracking-[0.32em] uppercase">
              Plataforma inmobiliaria
            </p>
            <div className="space-y-5">
              <h1 className="max-w-4xl text-5xl leading-tight font-semibold text-balance lg:text-7xl">
                Menos fricción en alquileres. Más trazabilidad y mejor ranking de candidatos.
              </h1>
              <p className="text-muted-foreground max-w-2xl text-lg leading-8">
                POC full-stack para hackathon con foco en pasaporte inquilino, CRM de inmobiliaria y
                capa de IA para score y compatibilidad.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/login" className={cn(buttonVariants({ size: "lg" }), "rounded-2xl")}>
                Iniciar sesión
              </Link>
              <Link
                href="/register"
                className={cn(buttonVariants({ variant: "outline", size: "lg" }), "rounded-2xl")}
              >
                Crear cuenta
              </Link>
            </div>
          </div>

          <div className="bg-background rounded-4xl border p-8 shadow-sm">
            <p className="text-muted-foreground text-sm tracking-[0.28em] uppercase">Módulos</p>
            <ul className="mt-6 space-y-4">
              <li className="rounded-3xl border p-4">
                Score de confianza con fallback estructurado.
              </li>
              <li className="rounded-3xl border p-4">
                Compatibilidad perfil-propiedad explicada en español.
              </li>
              <li className="rounded-3xl border p-4">
                Tablero de estados con portal compartido para cliente.
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {roleCards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="bg-background rounded-4xl border p-6 shadow-sm transition-transform hover:-translate-y-1"
            >
              <p className="text-muted-foreground text-sm tracking-[0.22em] uppercase">
                {card.eyebrow}
              </p>
              <h2 className="mt-4 text-2xl font-semibold text-balance">{card.title}</h2>
              <p className="text-muted-foreground mt-3 leading-7">{card.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
