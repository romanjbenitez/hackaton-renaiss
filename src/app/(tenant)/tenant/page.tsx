import Link from "next/link";

import { TrustScoreBadge } from "@/components/tenant/trust-score-badge";
import { buttonVariants } from "@/components/ui/button";
import { getTenantOnboardingDraft, getTenantProfileSnapshot } from "@/lib/tenant/onboarding";
import { cn } from "@/lib/utils";

export default async function TenantDashboardPage() {
  const draft = await getTenantOnboardingDraft();
  const hasProfile = Boolean(draft.step1);
  const hasCompletedOnboarding = Boolean(draft.step1 && draft.step2);
  const snapshot = getTenantProfileSnapshot(draft);

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
          {hasProfile
            ? "Ya cargaste parte de tu perfil. Terminá el onboarding para mejorar el matching con propiedades y mostrar una versión más confiable a las inmobiliarias."
            : "Todavía no cargaste tu perfil base. Empezá por DNI, ocupación e ingresos para generar tu score inicial."}
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          {hasCompletedOnboarding ? <TrustScoreBadge score={snapshot.baseScore} /> : null}
          <Link
            href={hasProfile ? "/tenant/onboarding?step=2" : "/tenant/onboarding"}
            className={cn(buttonVariants(), "rounded-2xl")}
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
        </div>
      </section>
      <section className="bg-background rounded-4xl border p-8 shadow-sm">
        <p className="text-sm tracking-[0.22em] text-emerald-700 uppercase">Próximos pasos</p>
        <ul className="mt-4 space-y-3 text-sm leading-7">
          <li>
            {draft.step1
              ? "Revisar datos personales e ingresos."
              : "Completar datos personales y tipo de perfil."}
          </li>
          <li>
            {draft.step2
              ? "Preparar la carga de DNI y comprobantes de ingresos."
              : "Definir estilo de vida, grupo familiar y garantía."}
          </li>
          <li>
            {hasCompletedOnboarding
              ? (snapshot.suggestions[0] ?? "Subí documentación para empujar el score.")
              : "Generar el score de confianza inicial."}
          </li>
        </ul>
      </section>
    </main>
  );
}
