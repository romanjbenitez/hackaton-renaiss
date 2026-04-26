"use client";

import { useMemo, useState } from "react";

import { CompatibilityBadge } from "@/components/ui/compatibility-badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CandidateRecord = {
  id: string;
  source: "MANUAL" | "PLATFORM";
  status: string;
  scoreAtSubmission: number;
  monthlyIncome: number | null;
  rentToIncomeRatio: number | null;
  guaranteeType: "MORTGAGE" | "CAUTION_INSURANCE" | "NONE" | null;
  aiCompatibilityScore: number | null;
  aiCompatibilityExplanation: string | null;
  aiCompatibilityMatchPoints: string[];
  aiCompatibilityConflicts: string[];
  manualCandidateName: string | null;
  manualCandidateEmail: string | null;
  manualCandidatePhone: string | null;
  tenant: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
  } | null;
};

type CandidatesManagerProps = {
  property: {
    id: string;
    title: string;
    addressLine: string;
  };
  candidacies: CandidateRecord[];
  message?: string;
  error?: string;
  createManualCandidacyAction: (formData: FormData) => void | Promise<void>;
};

function getCandidateName(candidate: CandidateRecord) {
  if (candidate.manualCandidateName) return candidate.manualCandidateName;
  if (candidate.tenant) return `${candidate.tenant.firstName} ${candidate.tenant.lastName}`;
  return "Candidato sin nombre";
}

function getCandidateEmail(candidate: CandidateRecord) {
  return candidate.manualCandidateEmail ?? candidate.tenant?.email ?? "Sin email";
}

function getCandidatePhone(candidate: CandidateRecord) {
  return candidate.manualCandidatePhone ?? candidate.tenant?.phone ?? "Sin teléfono";
}

function getSourceLabel(value: CandidateRecord["source"]) {
  return value === "MANUAL" ? "Carga manual" : "Plataforma";
}

function getGuaranteeLabel(value: CandidateRecord["guaranteeType"]) {
  switch (value) {
    case "MORTGAGE":
      return "Hipotecaria";
    case "CAUTION_INSURANCE":
      return "Caución";
    case "NONE":
      return "Sin garantía";
    default:
      return "Sin dato";
  }
}

export function CandidatesManager({
  property,
  candidacies,
  message,
  error,
  createManualCandidacyAction,
}: CandidatesManagerProps) {
  const [sourceFilter, setSourceFilter] = useState<"ALL" | CandidateRecord["source"]>("ALL");
  const [guaranteeFilter, setGuaranteeFilter] = useState<
    "ALL" | "MORTGAGE" | "CAUTION_INSURANCE" | "NONE"
  >("ALL");
  const [ratioFilter, setRatioFilter] = useState<"ALL" | "healthy" | "watch">("ALL");

  const propertyCandidacies = useMemo(() => {
    return candidacies
      .filter((candidate) => sourceFilter === "ALL" || candidate.source === sourceFilter)
      .filter((candidate) => guaranteeFilter === "ALL" || candidate.guaranteeType === guaranteeFilter)
      .filter((candidate) => {
        if (ratioFilter === "ALL") return true;
        if (candidate.rentToIncomeRatio === null) return false;
        if (ratioFilter === "healthy") return candidate.rentToIncomeRatio <= 0.35;
        return candidate.rentToIncomeRatio > 0.35;
      });
  }, [candidacies, guaranteeFilter, ratioFilter, sourceFilter]);

  return (
    <main className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
      <section className="bg-background space-y-6 rounded-4xl border p-8 shadow-sm">
        <div>
          <p className="text-sm tracking-[0.22em] text-sky-700 uppercase">Candidatos</p>
          <h1 className="mt-4 text-4xl font-semibold">{property.title}</h1>
          <p className="text-muted-foreground mt-3">{property.addressLine}</p>
        </div>

        {message ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
            {message}
          </div>
        ) : null}
        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-950">
            {error}
          </div>
        ) : null}

        <form action={createManualCandidacyAction} className="rounded-3xl border p-5">
          <input type="hidden" name="propertyId" value={property.id} />
          <h2 className="text-xl font-semibold">Carga manual de candidato externo</h2>
          <p className="text-muted-foreground mt-2 text-sm">
            Registrá nombre, contacto, garantía e ingreso para calcular un score estimado.
          </p>

          <div className="mt-5 grid gap-4">
            <input className="h-12 rounded-2xl border px-4" placeholder="Nombre completo" name="fullName" />
            <input className="h-12 rounded-2xl border px-4" placeholder="Email" name="email" type="email" />
            <input className="h-12 rounded-2xl border px-4" placeholder="Teléfono" name="phone" />
            <input
              className="h-12 rounded-2xl border px-4"
              placeholder="Ingreso mensual"
              type="number"
              name="monthlyIncome"
              min="1"
            />
            <select className="h-12 rounded-2xl border px-4" name="guaranteeType" defaultValue="CAUTION_INSURANCE">
              <option value="CAUTION_INSURANCE">Seguro de caución</option>
              <option value="MORTGAGE">Garantía hipotecaria</option>
              <option value="NONE">Sin garantía</option>
            </select>

            <button className={cn(buttonVariants({ size: "lg" }), "rounded-2xl")} type="submit">
              Agregar candidato
            </button>
          </div>
        </form>
      </section>

      <section className="bg-background space-y-6 rounded-4xl border p-8 shadow-sm">
        <div className="grid gap-3 md:grid-cols-3">
          <select
            className="h-12 rounded-2xl border px-4"
            value={sourceFilter}
            onChange={(event) => setSourceFilter(event.target.value as "ALL" | CandidateRecord["source"])}
          >
            <option value="ALL">Todas las fuentes</option>
            <option value="MANUAL">Manual</option>
            <option value="PLATFORM">Plataforma</option>
          </select>

          <select
            className="h-12 rounded-2xl border px-4"
            value={guaranteeFilter}
            onChange={(event) =>
              setGuaranteeFilter(event.target.value as "ALL" | "MORTGAGE" | "CAUTION_INSURANCE" | "NONE")
            }
          >
            <option value="ALL">Todas las garantías</option>
            <option value="MORTGAGE">Hipotecaria</option>
            <option value="CAUTION_INSURANCE">Caución</option>
            <option value="NONE">Sin garantía</option>
          </select>

          <select
            className="h-12 rounded-2xl border px-4"
            value={ratioFilter}
            onChange={(event) => setRatioFilter(event.target.value as "ALL" | "healthy" | "watch")}
          >
            <option value="ALL">Todas las ratios</option>
            <option value="healthy">Ingreso saludable</option>
            <option value="watch">Ingreso ajustado</option>
          </select>
        </div>

        <ul className="space-y-4">
          {propertyCandidacies.length === 0 ? (
            <li className="text-muted-foreground rounded-3xl border border-dashed p-6 text-sm">
              Todavía no hay candidatos para esta propiedad.
            </li>
          ) : (
            propertyCandidacies.map((candidate) => (
              <li key={candidate.id} className="rounded-3xl border p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold">{getCandidateName(candidate)}</h2>
                    <p className="text-muted-foreground mt-2 text-sm">
                      {getCandidateEmail(candidate)} · {getCandidatePhone(candidate)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="rounded-full border border-sky-200 bg-sky-50 px-4 py-1 text-sm font-medium text-sky-950">
                      Score {candidate.scoreAtSubmission}
                    </span>
                    <CompatibilityBadge
                      score={candidate.aiCompatibilityScore}
                      explanation={candidate.aiCompatibilityExplanation}
                      matchPoints={candidate.aiCompatibilityMatchPoints}
                      conflicts={candidate.aiCompatibilityConflicts}
                    />
                  </div>
                </div>

                <div className="mt-5 grid gap-3 text-sm md:grid-cols-4">
                  <div className="rounded-2xl border p-3">
                    <p className="text-muted-foreground">Fuente</p>
                    <p className="mt-1 font-medium">{getSourceLabel(candidate.source)}</p>
                  </div>
                  <div className="rounded-2xl border p-3">
                    <p className="text-muted-foreground">Garantía</p>
                    <p className="mt-1 font-medium">{getGuaranteeLabel(candidate.guaranteeType)}</p>
                  </div>
                  <div className="rounded-2xl border p-3">
                    <p className="text-muted-foreground">Ingreso</p>
                    <p className="mt-1 font-medium">
                      {candidate.monthlyIncome
                        ? `$${candidate.monthlyIncome.toLocaleString("es-AR")}`
                        : "Sin dato"}
                    </p>
                  </div>
                  <div className="rounded-2xl border p-3">
                    <p className="text-muted-foreground">Ingreso / alquiler</p>
                    <p className="mt-1 font-medium">{candidate.rentToIncomeRatio ?? "Sin dato"}</p>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </section>
    </main>
  );
}
