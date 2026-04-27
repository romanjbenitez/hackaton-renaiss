"use client";

import { useMemo, useState } from "react";

import { CompatibilityBadge } from "@/components/ui/compatibility-badge";
import { AlertBanner } from "@/components/ui/alert-banner";
import { buttonVariants } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { StatusPill } from "@/components/ui/status-pill";
import { cn } from "@/lib/utils";
import { inputClassName } from "@/lib/ui";

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

function formatIncome(value: number | null) {
  if (!value) return "Sin dato";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatRatio(value: number | null) {
  if (value === null) return { label: "Sin dato", tone: "neutral" as const };
  const pct = Math.round(value * 100);
  if (pct <= 35) return { label: `${pct}% ✓`, tone: "success" as const };
  if (pct <= 50) return { label: `${pct}%`, tone: "warning" as const };
  return { label: `${pct}%`, tone: "danger" as const };
}

function truncateEmail(email: string) {
  if (email.length <= 32) return email;
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const shortLocal = local && local.length > 12 ? local.slice(0, 12) + "…" : local;
  return `${shortLocal}@${domain}`;
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

        {message ? <AlertBanner tone="success">{message}</AlertBanner> : null}
        {error ? <AlertBanner tone="danger">{error}</AlertBanner> : null}

        <form action={createManualCandidacyAction} className="rounded-3xl border p-5">
          <input type="hidden" name="propertyId" value={property.id} />
          <h2 className="text-xl font-semibold">Carga manual de candidato externo</h2>
          <p className="text-muted-foreground mt-2 text-sm">
            Registrá nombre, contacto, garantía e ingreso para calcular un score estimado.
          </p>

          <div className="mt-5 grid gap-4">
            <input className={inputClassName} placeholder="Nombre completo" name="fullName" />
            <input className={inputClassName} placeholder="Email" name="email" type="email" />
            <input className={inputClassName} placeholder="Teléfono" name="phone" />
            <input
              className={inputClassName}
              placeholder="Ingreso mensual"
              type="number"
              name="monthlyIncome"
              min="1"
            />
            <select className={inputClassName} name="guaranteeType" defaultValue="CAUTION_INSURANCE">
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
            className={inputClassName}
            value={sourceFilter}
            onChange={(event) => setSourceFilter(event.target.value as "ALL" | CandidateRecord["source"])}
          >
            <option value="ALL">Todas las fuentes</option>
            <option value="MANUAL">Manual</option>
            <option value="PLATFORM">Plataforma</option>
          </select>

          <select
            className={inputClassName}
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
            className={inputClassName}
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
                      {truncateEmail(getCandidateEmail(candidate))} · {getCandidatePhone(candidate)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill tone="info" className="px-4 py-1 text-sm">
                      Score {candidate.scoreAtSubmission}
                    </StatusPill>
                    <CompatibilityBadge
                      score={candidate.aiCompatibilityScore}
                      explanation={candidate.aiCompatibilityExplanation}
                      matchPoints={candidate.aiCompatibilityMatchPoints}
                      conflicts={candidate.aiCompatibilityConflicts}
                    />
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                  <StatCard label="Fuente" value={getSourceLabel(candidate.source)} />
                  <StatCard label="Garantía" value={getGuaranteeLabel(candidate.guaranteeType)} />
                  <StatCard label="Ingreso mensual" value={formatIncome(candidate.monthlyIncome)} />
                  {(() => {
                    const ratio = formatRatio(candidate.rentToIncomeRatio);
                    return (
                      <div className="rounded-2xl border p-4">
                        <p className="text-muted-foreground text-sm">Alquiler / ingreso</p>
                        <p
                          className={cn("mt-2 text-xl font-semibold", {
                            "text-emerald-700": ratio.tone === "success",
                            "text-amber-700": ratio.tone === "warning",
                            "text-rose-700": ratio.tone === "danger",
                          })}
                        >
                          {ratio.label}
                        </p>
                      </div>
                    );
                  })()}
                </div>
              </li>
            ))
          )}
        </ul>
      </section>
    </main>
  );
}
