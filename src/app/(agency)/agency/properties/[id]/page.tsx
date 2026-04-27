import Link from "next/link";
import { notFound } from "next/navigation";

import {
  formatCurrency,
  getAgencyPropertyById,
  getGuaranteeLabel,
  getPropertyCompatibilitySummary,
  getPropertyStatusLabel,
  getPropertyStatusTone,
  getPropertyTypeLabel,
  getTenantProfileTypeLabel,
} from "@/lib/agency/properties";
import { getAgencyUserByEmail } from "@/lib/agency/transactions";
import { getPropertyCandidacies } from "@/lib/candidacies/service";
import { requireUserRole } from "@/lib/auth/session";
import { PropertyCandidatesSummary } from "@/components/agency/property-candidates-summary";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const toneStyles = {
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-950",
  amber: "border-amber-200 bg-amber-50 text-amber-950",
  sky: "border-sky-200 bg-sky-50 text-sky-950",
  slate: "border-slate-200 bg-slate-100 text-slate-900",
  zinc: "border-zinc-200 bg-zinc-100 text-zinc-900",
} as const;

type AgencyPropertyDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getSearchValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AgencyPropertyDetailPage({
  params,
  searchParams,
}: AgencyPropertyDetailPageProps) {
  const [{ id }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const session = await requireUserRole("agency");
  const email = session.user?.email;

  if (!email) {
    notFound();
  }

  const agency = await getAgencyUserByEmail(email);

  if (!agency) {
    notFound();
  }

  const property = await getAgencyPropertyById(id, agency.id);
  const candidacies = await getPropertyCandidacies(id, agency.id);

  if (!property) {
    notFound();
  }

  const message = getSearchValue(resolvedSearchParams.message);
  const tone = getPropertyStatusTone(property.status);
  const total = candidacies.length;
  const manualCount = candidacies.filter((candidate) => candidate.source === "MANUAL").length;
  const platformCount = total - manualCount;
  const averageScore =
    total > 0
      ? Math.round(candidacies.reduce((sum, candidate) => sum + candidate.scoreAtSubmission, 0) / total)
      : null;
  const bestCandidate = candidacies[0]
    ? {
        name:
          candidacies[0].manualCandidateName ??
          (candidacies[0].tenant
            ? `${candidacies[0].tenant.firstName} ${candidacies[0].tenant.lastName}`
            : "Candidato sin nombre"),
        score: candidacies[0].scoreAtSubmission,
        source: candidacies[0].source,
      }
    : null;

  return (
    <main className="space-y-6">
      {message ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
          {message}
        </div>
      ) : null}

      <section className="bg-background grid gap-6 rounded-4xl border p-8 shadow-sm lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={cn("rounded-full border px-3 py-1 text-xs font-medium", toneStyles[tone])}
            >
              {getPropertyStatusLabel(property.status)}
            </span>
            <span className="text-muted-foreground text-sm">
              {getPropertyTypeLabel(property.propertyType)}
            </span>
          </div>

          <h1 className="mt-4 text-4xl font-semibold text-balance">{property.title}</h1>
          <p className="text-muted-foreground mt-3 max-w-2xl leading-8">
            {property.description || "Sin descripción adicional."}
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border p-5">
              <p className="text-muted-foreground text-sm">Ubicación</p>
              <p className="mt-2 text-lg font-semibold">
                {property.addressLine}, {property.city}
              </p>
              <p className="text-muted-foreground mt-1 text-sm">{property.province}</p>
            </div>
            <div className="rounded-3xl border p-5">
              <p className="text-muted-foreground text-sm">Alquiler</p>
              <p className="mt-2 text-lg font-semibold">{formatCurrency(property.price)}</p>
              <p className="text-muted-foreground mt-1 text-sm">
                Expensas {formatCurrency(property.expenses)}
              </p>
            </div>
            <div className="rounded-3xl border p-5">
              <p className="text-muted-foreground text-sm">Superficie</p>
              <p className="mt-2 text-lg font-semibold">{property.squareMeters} m2</p>
              <p className="text-muted-foreground mt-1 text-sm">
                {property.bedrooms} ambientes · {property.bathrooms} baños
              </p>
            </div>
            <div className="rounded-3xl border p-5">
              <p className="text-muted-foreground text-sm">Perfil objetivo</p>
              <p className="mt-2 text-lg font-semibold">
                Score {property.targetTrustScore}+ requerido
              </p>
              <p className="text-muted-foreground mt-1 text-sm">
                {getTenantProfileTypeLabel(property.preferredProfile)}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={`/agency/properties/${property.id}/edit`}
              className={cn(buttonVariants(), "rounded-2xl")}
            >
              Editar propiedad
            </Link>
            <Link
              href="/agency/properties"
              className={cn(buttonVariants({ variant: "outline" }), "rounded-2xl")}
            >
              Volver al listado
            </Link>
            <Link
              href="/agency/properties/new"
              className={cn(buttonVariants({ variant: "outline" }), "rounded-2xl")}
            >
              Cargar otra propiedad
            </Link>
            {property.externalUrl ? (
              <a
                href={property.externalUrl}
                target="_blank"
                rel="noreferrer"
                className={cn(buttonVariants({ variant: "ghost" }), "rounded-2xl")}
              >
                Abrir publicación externa
              </a>
            ) : null}
          </div>
        </div>

        <div
          className="min-h-80 rounded-[2rem] bg-cover bg-center"
          style={{ backgroundImage: `url(${property.photos[0]})` }}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="bg-background rounded-4xl border p-8 shadow-sm">
          <p className="text-sm tracking-[0.22em] text-sky-700 uppercase">Ficha compatibilidad</p>
          <ul className="mt-4 space-y-3 text-sm leading-7">
            {getPropertyCompatibilitySummary(property).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          {property.compatibilityNotes ? (
            <div className="bg-muted/40 mt-6 rounded-3xl border p-5">
              <p className="text-sm font-medium">Notas del broker</p>
              <p className="text-muted-foreground mt-2 text-sm leading-7">
                {property.compatibilityNotes}
              </p>
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            {property.acceptedGuarantees.map((guarantee) => (
              <span key={guarantee} className="rounded-full border px-3 py-1">
                {getGuaranteeLabel(guarantee)}
              </span>
            ))}
          </div>
        </div>

        <PropertyCandidatesSummary
          propertyId={property.id}
          total={total}
          platformCount={platformCount}
          manualCount={manualCount}
          averageScore={averageScore}
          bestCandidate={bestCandidate}
        />
      </section>
    </main>
  );
}
