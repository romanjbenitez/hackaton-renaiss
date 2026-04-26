import Link from "next/link";

import { TrustScoreBadge } from "@/components/tenant/trust-score-badge";
import { buttonVariants } from "@/components/ui/button";
import { ensureCurrentTenantContext } from "@/lib/auth/actors";
import { requireUserRole } from "@/lib/auth/session";
import { deriveTrustScoreFallback } from "@/lib/ai/fallback";
import { prisma } from "@/lib/db/prisma";
import { getTenantOnboardingDraft, getTenantProfileSnapshot } from "@/lib/tenant/onboarding";
import { cn } from "@/lib/utils";

export default async function TenantDashboardPage() {
  await requireUserRole("tenant");
  const draft = await getTenantOnboardingDraft();
  const tenant = await ensureCurrentTenantContext();
  const hasProfile = Boolean(draft.step1);
  const hasCompletedOnboarding = Boolean(draft.step1 && draft.step2);
  const snapshot = getTenantProfileSnapshot(draft);
  const documents = tenant?.tenantProfile
    ? await prisma.document.findMany({
        where: {
          tenantProfileId: tenant.tenantProfile.id,
        },
        select: {
          id: true,
          type: true,
          displayName: true,
          verificationStatus: true,
          suspicious: true,
          suspiciousScore: true,
        },
      })
    : [];
  const profileForScore = draft.step1
    ? {
        dni: draft.step1.dni,
        profileType: draft.step1.profileType,
        occupation: draft.step1.occupation,
        monthlyIncome: draft.step1.monthlyIncome,
        guaranteeType: draft.step2?.guaranteeType ?? tenant?.tenantProfile?.guaranteeType ?? "NONE",
        hasPets: draft.step2?.hasPets ?? tenant?.tenantProfile?.hasPets ?? false,
        isSmoker: draft.step2?.isSmoker ?? tenant?.tenantProfile?.isSmoker ?? false,
        hasChildren: draft.step2?.hasChildren ?? tenant?.tenantProfile?.hasChildren ?? false,
        familyMembers: draft.step2?.familyMembers ?? tenant?.tenantProfile?.familyMembers ?? 1,
        platformHistoryScore: tenant?.tenantProfile?.trustScore ?? undefined,
      }
    : null;
  const fallbackTrust = profileForScore
    ? deriveTrustScoreFallback({
        tenantProfile: profileForScore,
        documents,
      })
    : null;
  const visibleScore = tenant?.tenantProfile?.trustScore ?? fallbackTrust?.score ?? snapshot.baseScore;
  const hasDniDocument = documents.some((document) => document.type === "DNI");
  const hasIncomeProof = documents.some((document) =>
    [
      "PAYSLIP",
      "MONOTRIBUTO_CERTIFICATE",
      "MONOTRIBUTO_PAYMENT",
      "INCOME_AFFIDAVIT",
      "RETIREMENT_RECEIPT",
    ].includes(document.type)
  );
  const hasGuaranteeProof = documents.some((document) =>
    ["MORTGAGE_GUARANTEE", "CAUTION_INSURANCE"].includes(document.type)
  );
  const nextSteps = hasCompletedOnboarding
    ? [
        hasDniDocument ? "DNI cargado y listo para validación." : "Subí tu DNI para completar identidad.",
        hasIncomeProof
          ? "Los comprobantes de ingresos ya están en tu legajo."
          : "Subí comprobantes de ingresos para reforzar el score.",
        hasGuaranteeProof
          ? "La garantía ya tiene respaldo documental cargado."
          : "Adjuntá la documentación de garantía para cerrar el legajo.",
      ]
    : [
        draft.step1
          ? "Revisar datos personales e ingresos."
          : "Completar datos personales y tipo de perfil.",
        draft.step2
          ? "Preparar la carga de DNI y comprobantes de ingresos."
          : "Definir estilo de vida, grupo familiar y garantía.",
        "Generar el score de confianza inicial.",
      ];

  return (
    <main className="grid gap-6 md:grid-cols-2">
      <section className="bg-background rounded-4xl border p-8 shadow-sm">
        <p className="text-sm tracking-[0.22em] text-emerald-700 uppercase">Estado</p>
        <h2 className="mt-4 text-3xl font-semibold">
          {hasCompletedOnboarding
            ? "Tu pasaporte ya tiene score inicial"
            : "Pasaporte listo para completar"}
        </h2>
        <p className="text-muted-foreground mt-4 leading-8">
          {hasCompletedOnboarding
            ? "Tu perfil base ya está completo. Desde acá podés revisar documentación, score y matching con propiedades."
            : hasProfile
            ? "Ya cargaste parte de tu perfil. Terminá el onboarding para mejorar el matching con propiedades y mostrar una versión más confiable a las inmobiliarias."
            : "Todavía no cargaste tu perfil base. Empezá por DNI, ocupación e ingresos para generar tu score inicial."}
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          {hasCompletedOnboarding ? <TrustScoreBadge score={visibleScore} /> : null}
          <Link
            href="/tenant/properties"
            className={cn(buttonVariants(), "rounded-2xl")}
          >
            Ver publicaciones
          </Link>
          <Link
            href={hasProfile ? "/tenant/onboarding?step=2" : "/tenant/onboarding"}
            className={cn(buttonVariants({ variant: "outline" }), "rounded-2xl")}
          >
            {hasProfile ? "Continuar onboarding" : "Empezar onboarding"}
          </Link>
          {hasCompletedOnboarding ? (
            <Link
              href="/tenant/profile"
              className={cn(buttonVariants({ variant: "outline" }), "rounded-2xl")}
            >
              Ver perfil
            </Link>
          ) : null}
          {hasCompletedOnboarding ? (
            <Link
              href="/tenant/documents"
              className={cn(buttonVariants({ variant: "outline" }), "rounded-2xl")}
            >
              Cargar DNI y documentos
            </Link>
          ) : null}
        </div>
      </section>
      <section className="bg-background rounded-4xl border p-8 shadow-sm">
        <p className="text-sm tracking-[0.22em] text-emerald-700 uppercase">Próximos pasos</p>
        <ul className="mt-4 space-y-3 text-sm leading-7">
          {nextSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
