import Link from "next/link";
import { redirect } from "next/navigation";

import {
  formatCurrency,
  getAgencyProperties,
  getPropertyStatusLabel,
  getPropertyStatusTone,
  getPropertyTypeLabel,
} from "@/lib/agency/properties";
import { getAgencyUserByEmail } from "@/lib/agency/transactions";
import { requireUserRole } from "@/lib/auth/session";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const toneStyles = {
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-950",
  amber: "border-amber-200 bg-amber-50 text-amber-950",
  sky: "border-sky-200 bg-sky-50 text-sky-950",
  slate: "border-slate-200 bg-slate-100 text-slate-900",
  zinc: "border-zinc-200 bg-zinc-100 text-zinc-900",
} as const;

export default async function AgencyPropertiesPage() {
  const session = await requireUserRole("agency");
  const email = session.user?.email;

  if (!email) {
    redirect("/login?error=Sesión%20inválida");
  }

  const agency = await getAgencyUserByEmail(email);

  if (!agency) {
    redirect("/login?error=No%20se%20encontró%20la%20inmobiliaria");
  }

  const properties = await getAgencyProperties(agency.id);
  const publishedCount = properties.filter((property) => property.status === "PUBLISHED").length;
  const averageTicket =
    properties.length > 0
      ? formatCurrency(
          Math.round(
            properties.reduce((total, property) => total + property.price, 0) / properties.length
          )
        )
      : "—";

  return (
    <main className="space-y-6">
      <section className="bg-background rounded-4xl border p-8 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm tracking-[0.22em] text-sky-700 uppercase">Propiedades</p>
            <h1 className="mt-3 text-4xl font-semibold text-balance">
              Inventario operativo para publicar y rankear candidatos
            </h1>
            <p className="text-muted-foreground mt-3 max-w-3xl leading-8">
              Gestioná el inventario publicado, revisá la ficha de compatibilidad y abrí el detalle
              operativo de cada inmueble desde el backoffice.
            </p>
          </div>
          <Link href="/agency/properties/new" className={cn(buttonVariants(), "rounded-2xl")}>
            Nueva propiedad
          </Link>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border p-5">
            <p className="text-muted-foreground text-sm">Total</p>
            <p className="mt-2 text-3xl font-semibold">{properties.length}</p>
          </div>
          <div className="rounded-3xl border p-5">
            <p className="text-muted-foreground text-sm">Publicadas</p>
            <p className="mt-2 text-3xl font-semibold">{publishedCount}</p>
          </div>
          <div className="rounded-3xl border p-5">
            <p className="text-muted-foreground text-sm">Ticket promedio</p>
            <p className="mt-2 text-3xl font-semibold">{averageTicket}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4">
        {properties.map((property) => {
          const tone = getPropertyStatusTone(property.status);

          return (
            <article
              key={property.id}
              className="bg-background grid gap-5 rounded-4xl border p-6 shadow-sm lg:grid-cols-[220px_1fr]"
            >
              <div
                className="min-h-48 rounded-3xl bg-cover bg-center"
                style={{ backgroundImage: `url(${property.photos[0]})` }}
              />

              <div className="flex flex-col justify-between gap-5">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-medium",
                        toneStyles[tone]
                      )}
                    >
                      {getPropertyStatusLabel(property.status)}
                    </span>
                    <span className="text-muted-foreground text-sm">
                      {getPropertyTypeLabel(property.propertyType)}
                    </span>
                  </div>

                  <h2 className="mt-4 text-2xl font-semibold">{property.title}</h2>
                  <p className="text-muted-foreground mt-2 leading-7">
                    {property.addressLine}, {property.city}, {property.province}
                  </p>
                  <p className="text-muted-foreground mt-3 line-clamp-2 leading-7">
                    {property.description}
                  </p>
                </div>

                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div className="flex flex-wrap gap-3 text-sm">
                    <span className="rounded-full border px-3 py-1">
                      {property.squareMeters} m2
                    </span>
                    <span className="rounded-full border px-3 py-1">{property.bedrooms} amb.</span>
                    <span className="rounded-full border px-3 py-1">
                      Score objetivo {property.targetTrustScore}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="text-right">
                      <p className="text-2xl font-semibold">{formatCurrency(property.price)}</p>
                      <p className="text-muted-foreground text-sm">
                        Expensas {formatCurrency(property.expenses)}
                      </p>
                    </div>
                    <Link
                      href={`/agency/properties/${property.id}`}
                      className={cn(buttonVariants({ variant: "outline" }), "rounded-2xl")}
                    >
                      Ver detalle
                    </Link>
                    <Link
                      href={`/agency/properties/${property.id}/candidates`}
                      className={cn(buttonVariants({ variant: "outline" }), "rounded-2xl")}
                    >
                      Ver candidatos
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
