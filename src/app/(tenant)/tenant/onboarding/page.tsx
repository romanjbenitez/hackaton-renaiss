import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getTenantOnboardingDraft } from "@/lib/tenant/onboarding";
import {
  saveOnboardingStep1Action,
  saveOnboardingStep2Action,
} from "@/app/(tenant)/tenant/onboarding/actions";

type TenantOnboardingPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getSearchValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function TenantOnboardingPage({ searchParams }: TenantOnboardingPageProps) {
  const params = await searchParams;
  const currentStep = getSearchValue(params.step) === "2" ? "2" : "1";
  const error = getSearchValue(params.error);
  const draft = await getTenantOnboardingDraft();

  return (
    <main className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <section className="bg-background rounded-4xl border p-8 shadow-sm">
        <p className="text-sm tracking-[0.22em] text-emerald-700 uppercase">Onboarding</p>
        <h1 className="mt-4 text-4xl font-semibold text-balance">
          Construí tu pasaporte inquilino en dos pasos.
        </h1>
        <div className="mt-8 space-y-3">
          {[
            {
              id: "1",
              title: "Datos personales",
              description: "DNI, tipo de perfil, ocupación e ingresos.",
            },
            {
              id: "2",
              title: "Estilo de vida",
              description: "Mascotas, fumador, grupo familiar y garantía.",
            },
          ].map((step) => (
            <div
              key={step.id}
              className={cn(
                "rounded-3xl border p-4",
                currentStep === step.id ? "border-foreground bg-muted" : "border-border"
              )}
            >
              <p className="text-sm font-medium">{step.title}</p>
              <p className="text-muted-foreground mt-1 text-sm">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-background rounded-4xl border p-8 shadow-sm">
        {error ? (
          <div className="border-destructive/30 bg-destructive/10 text-destructive mb-6 rounded-2xl border px-4 py-3 text-sm">
            {error}
          </div>
        ) : null}

        {currentStep === "1" ? (
          <form action={saveOnboardingStep1Action} className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <h2 className="text-2xl font-semibold">Paso 1. Datos personales</h2>
              <p className="text-muted-foreground mt-2">
                Este bloque define tu perfil base y el ingreso estimado para el scoring.
              </p>
            </div>

            <label className="space-y-2">
              <span className="text-sm font-medium">DNI</span>
              <input
                className="h-12 w-full rounded-2xl border px-4"
                name="dni"
                defaultValue={draft.step1?.dni}
                placeholder="30123456"
                required
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium">Tipo de perfil</span>
              <select
                className="h-12 w-full rounded-2xl border px-4"
                name="profileType"
                defaultValue={draft.step1?.profileType ?? "EMPLOYED"}
              >
                <option value="EMPLOYED">Relación de dependencia</option>
                <option value="MONOTRIBUTISTA">Monotributista</option>
                <option value="SELF_EMPLOYED">Autónomo</option>
                <option value="RETIRED">Jubilado</option>
              </select>
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium">Ocupación</span>
              <input
                className="h-12 w-full rounded-2xl border px-4"
                name="occupation"
                defaultValue={draft.step1?.occupation}
                placeholder="Analista de datos"
                required
              />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium">Ingreso mensual</span>
              <input
                className="h-12 w-full rounded-2xl border px-4"
                name="monthlyIncome"
                defaultValue={draft.step1?.monthlyIncome?.toString()}
                placeholder="1200000"
                required
              />
            </label>

            <button
              className={cn(buttonVariants({ size: "lg" }), "mt-2 rounded-2xl md:col-span-2")}
            >
              Continuar al paso 2
            </button>
          </form>
        ) : (
          <form action={saveOnboardingStep2Action} className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <h2 className="text-2xl font-semibold">Paso 2. Estilo de vida y garantía</h2>
              <p className="text-muted-foreground mt-2">
                Esto afecta el matching con propiedades y el score de confianza base.
              </p>
            </div>

            <label className="space-y-2">
              <span className="text-sm font-medium">¿Tenés mascotas?</span>
              <select
                className="h-12 w-full rounded-2xl border px-4"
                name="hasPets"
                defaultValue={draft.step2?.hasPets ? "true" : "false"}
              >
                <option value="false">No</option>
                <option value="true">Sí</option>
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium">¿Fumás?</span>
              <select
                className="h-12 w-full rounded-2xl border px-4"
                name="isSmoker"
                defaultValue={draft.step2?.isSmoker ? "true" : "false"}
              >
                <option value="false">No</option>
                <option value="true">Sí</option>
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium">¿Tenés hijos?</span>
              <select
                className="h-12 w-full rounded-2xl border px-4"
                name="hasChildren"
                defaultValue={draft.step2?.hasChildren ? "true" : "false"}
              >
                <option value="false">No</option>
                <option value="true">Sí</option>
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium">Composición familiar</span>
              <input
                className="h-12 w-full rounded-2xl border px-4"
                name="familyMembers"
                type="number"
                min="1"
                max="10"
                defaultValue={draft.step2?.familyMembers?.toString() ?? "1"}
                required
              />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium">Tipo de garantía</span>
              <select
                className="h-12 w-full rounded-2xl border px-4"
                name="guaranteeType"
                defaultValue={draft.step2?.guaranteeType ?? "NONE"}
              >
                <option value="NONE">Todavía no definida</option>
                <option value="MORTGAGE">Garantía hipotecaria</option>
                <option value="CAUTION_INSURANCE">Seguro de caución</option>
              </select>
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium">Detalle adicional</span>
              <textarea
                className="min-h-28 w-full rounded-2xl border px-4 py-3"
                name="guaranteeDetails"
                defaultValue={draft.step2?.guaranteeDetails ?? ""}
                placeholder="Ejemplo: garantía de familiar directo en CABA."
              />
            </label>

            <div className="flex flex-wrap gap-3 md:col-span-2">
              <Link
                href="/tenant/onboarding?step=1"
                className={cn(buttonVariants({ variant: "outline" }), "rounded-2xl")}
              >
                Volver al paso 1
              </Link>
              <button className={cn(buttonVariants({ size: "lg" }), "rounded-2xl")}>
                Guardar perfil y ver score
              </button>
            </div>
          </form>
        )}
      </section>
    </main>
  );
}
