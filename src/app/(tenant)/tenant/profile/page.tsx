import Link from "next/link";

import { TrustScoreOverview } from "@/components/tenant/trust-score-overview";
import { buttonVariants } from "@/components/ui/button";
import { ensureCurrentTenantContext } from "@/lib/auth/actors";
import { requireUserRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { mapTenantDocumentsFromDatabaseWithPreview } from "@/lib/tenant/documents-server";
import { getTenantOnboardingDraft } from "@/lib/tenant/onboarding";
import { cn } from "@/lib/utils";

type TenantProfilePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getSearchValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getProfileTypeLabel(value: string | undefined) {
  switch (value) {
    case "EMPLOYED":
      return "Relación de dependencia";
    case "MONOTRIBUTISTA":
      return "Monotributista";
    case "SELF_EMPLOYED":
      return "Autónomo";
    case "RETIRED":
      return "Jubilado";
    default:
      return "Sin definir";
  }
}

function getGuaranteeLabel(value: string | undefined) {
  switch (value) {
    case "MORTGAGE":
      return "Garantía hipotecaria";
    case "CAUTION_INSURANCE":
      return "Seguro de caución";
    default:
      return "Todavía no definida";
  }
}

export default async function TenantProfilePage({ searchParams }: TenantProfilePageProps) {
  await requireUserRole("tenant");
  const params = await searchParams;
  const message = getSearchValue(params.message);
  const error = getSearchValue(params.error);
  const draft = await getTenantOnboardingDraft();
  const tenant = await ensureCurrentTenantContext();
  const documents = tenant?.tenantProfile
    ? await prisma.document.findMany({
        where: {
          tenantProfileId: tenant.tenantProfile.id,
        },
        orderBy: {
          uploadedAt: "desc",
        },
        select: {
          id: true,
          type: true,
          displayName: true,
          fileName: true,
          mimeType: true,
          storageKey: true,
          url: true,
          uploadedAt: true,
          verificationStatus: true,
          suspicious: true,
          suspiciousReason: true,
          suspiciousScore: true,
          base64Data: true,
        },
      })
    : [];
  const storedDocuments = await mapTenantDocumentsFromDatabaseWithPreview(documents);

  if (!draft.step1) {
    return (
      <main className="bg-background rounded-4xl border p-8 shadow-sm">
        <p className="text-sm tracking-[0.22em] text-emerald-700 uppercase">Perfil</p>
        <h1 className="mt-4 text-4xl font-semibold text-balance">
          Todavía no tenés un perfil para compartir.
        </h1>
        <p className="text-muted-foreground mt-4 max-w-2xl leading-8">
          Completá el onboarding para generar tu score inicial y preparar tu pasaporte inquilino.
        </p>
        <Link href="/tenant/onboarding" className={cn(buttonVariants(), "mt-6 rounded-2xl")}>
          Ir al onboarding
        </Link>
      </main>
    );
  }

  return (
    <main className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <section className="bg-background rounded-4xl border p-8 shadow-sm">
        {message ? (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
            {message}
          </div>
        ) : null}
        {error ? (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-950">
            {error}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm tracking-[0.22em] text-emerald-700 uppercase">Pasaporte</p>
            <h1 className="mt-3 text-4xl font-semibold text-balance">Perfil del inquilino</h1>
            <p className="text-muted-foreground mt-3">
              Este resumen combina datos personales, estilo de vida y garantía declarada.
            </p>
          </div>
          <Link
            href="/tenant/documents"
            className={cn(buttonVariants({ variant: "outline" }), "rounded-2xl")}
          >
            Cargar documentación
          </Link>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border p-5">
            <p className="text-muted-foreground text-sm">DNI</p>
            <p className="mt-2 text-lg font-semibold">{draft.step1.dni}</p>
          </div>
          <div className="rounded-3xl border p-5">
            <p className="text-muted-foreground text-sm">Tipo de perfil</p>
            <p className="mt-2 text-lg font-semibold">
              {getProfileTypeLabel(draft.step1.profileType)}
            </p>
          </div>
          <div className="rounded-3xl border p-5">
            <p className="text-muted-foreground text-sm">Ocupación</p>
            <p className="mt-2 text-lg font-semibold">{draft.step1.occupation}</p>
          </div>
          <div className="rounded-3xl border p-5">
            <p className="text-muted-foreground text-sm">Ingreso mensual</p>
            <p className="mt-2 text-lg font-semibold">
              {new Intl.NumberFormat("es-AR", {
                style: "currency",
                currency: "ARS",
                maximumFractionDigits: 0,
              }).format(draft.step1.monthlyIncome)}
            </p>
          </div>
          <div className="rounded-3xl border p-5">
            <p className="text-muted-foreground text-sm">Grupo familiar</p>
            <p className="mt-2 text-lg font-semibold">
              {draft.step2?.familyMembers ?? 1} integrante(s)
            </p>
          </div>
          <div className="rounded-3xl border p-5">
            <p className="text-muted-foreground text-sm">Garantía</p>
            <p className="mt-2 text-lg font-semibold">
              {getGuaranteeLabel(draft.step2?.guaranteeType)}
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <TrustScoreOverview
          tenantProfile={{
            dni: draft.step1.dni,
            profileType: draft.step1.profileType,
            occupation: draft.step1.occupation,
            monthlyIncome: draft.step1.monthlyIncome,
            guaranteeType: draft.step2?.guaranteeType ?? "NONE",
            hasPets: draft.step2?.hasPets ?? false,
            isSmoker: draft.step2?.isSmoker ?? false,
            hasChildren: draft.step2?.hasChildren ?? false,
            familyMembers: draft.step2?.familyMembers ?? 1,
          }}
          persistedScore={tenant?.tenantProfile?.trustScore ?? null}
          persistedExplanation={tenant?.tenantProfile?.trustScoreExplanation ?? null}
          persistedImprovementSuggestion={tenant?.tenantProfile?.improvementSuggestion ?? null}
          initialDocuments={storedDocuments}
        />

        <div className="bg-background rounded-4xl border p-8 shadow-sm">
          <p className="text-sm tracking-[0.22em] text-emerald-700 uppercase">Revisión documental</p>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-muted-foreground text-sm">
              Subí el DNI y los comprobantes para completar el legajo de la persona.
            </p>
            <Link
              href="/tenant/documents"
              className={cn(buttonVariants({ variant: "outline" }), "rounded-2xl")}
            >
              Ir a documentos
            </Link>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border p-5">
              <p className="text-muted-foreground text-sm">Verificados</p>
              <p className="mt-2 text-2xl font-semibold">
                {storedDocuments.filter((document) => document.rawVerificationStatus === "VERIFIED").length}
              </p>
            </div>
            <div className="rounded-3xl border p-5">
              <p className="text-muted-foreground text-sm">Pendientes de revisión</p>
              <p className="mt-2 text-2xl font-semibold">
                {storedDocuments.filter((document) => document.rawVerificationStatus === "FLAGGED").length}
              </p>
            </div>
            <div className="rounded-3xl border p-5">
              <p className="text-muted-foreground text-sm">Rechazados</p>
              <p className="mt-2 text-2xl font-semibold">
                {storedDocuments.filter((document) => document.rawVerificationStatus === "REJECTED").length}
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {storedDocuments
              .filter((document) => document.feedbackMessage)
              .slice(0, 4)
              .map((document) => (
                <div key={document.id} className="rounded-3xl border p-4">
                  <p className="font-medium">{document.label}</p>
                  <p className="text-muted-foreground mt-2 text-sm leading-6">
                    {document.feedbackMessage}
                  </p>
                </div>
              ))}
          </div>
        </div>

        <div className="bg-background rounded-4xl border p-8 shadow-sm">
          <p className="text-sm tracking-[0.22em] text-emerald-700 uppercase">Estilo de vida</p>
          <div className="mt-4 space-y-3 text-sm leading-7">
            <p>Mascotas: {draft.step2?.hasPets ? "Sí" : "No"}</p>
            <p>Fumador: {draft.step2?.isSmoker ? "Sí" : "No"}</p>
            <p>Hijos: {draft.step2?.hasChildren ? "Sí" : "No"}</p>
            <p>Detalle de garantía: {draft.step2?.guaranteeDetails || "Sin detalle adicional."}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/tenant/onboarding"
            className={cn(buttonVariants({ variant: "outline" }), "rounded-2xl")}
          >
            Editar onboarding
          </Link>
          <Link href="/tenant" className={cn(buttonVariants(), "rounded-2xl")}>
            Volver al panel
          </Link>
        </div>
      </section>
    </main>
  );
}
