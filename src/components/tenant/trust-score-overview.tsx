"use client";

import { useMemo } from "react";

import { TrustScoreBadge } from "@/components/tenant/trust-score-badge";
import { deriveTrustScoreFallback } from "@/lib/ai/fallback";
import {
  mapDocumentsToAiSummary,
  type GuaranteeType,
  type ProfileType,
  type StoredTenantDocument,
} from "@/lib/tenant/documents";

type TrustScoreOverviewProps = {
  tenantProfile: {
    dni?: string;
    profileType: ProfileType;
    occupation?: string;
    monthlyIncome?: number;
    guaranteeType: GuaranteeType;
    hasPets: boolean;
    isSmoker: boolean;
    hasChildren: boolean;
    familyMembers: number;
  };
  initialDocuments?: StoredTenantDocument[];
  persistedScore?: number | null;
  persistedExplanation?: string | null;
  persistedImprovementSuggestion?: string | null;
};

const dimensionLabels = {
  docCompleteness: "Cobertura documental",
  incomeConsistency: "Consistencia de ingresos",
  guaranteeType: "Garantía declarada",
  platformHistory: "Historial de plataforma",
} as const;

function getBarTone(value: number) {
  if (value >= 80) return "bg-emerald-500";
  if (value >= 65) return "bg-sky-500";
  if (value >= 45) return "bg-amber-500";
  return "bg-rose-500";
}

export function TrustScoreOverview({
  tenantProfile,
  initialDocuments = [],
  persistedScore,
  persistedExplanation,
  persistedImprovementSuggestion,
}: TrustScoreOverviewProps) {
  const fallbackResult = useMemo(() => {
    return deriveTrustScoreFallback({
      tenantProfile: {
        dni: tenantProfile.dni,
        profileType: tenantProfile.profileType,
        occupation: tenantProfile.occupation,
        monthlyIncome: tenantProfile.monthlyIncome,
        guaranteeType: tenantProfile.guaranteeType,
        hasPets: tenantProfile.hasPets,
        isSmoker: tenantProfile.isSmoker,
        hasChildren: tenantProfile.hasChildren,
        familyMembers: tenantProfile.familyMembers,
      },
      documents: mapDocumentsToAiSummary(initialDocuments),
    });
  }, [initialDocuments, tenantProfile]);

  const dimensions = Object.entries(fallbackResult.dimensions) as Array<
    [keyof typeof fallbackResult.dimensions, number]
  >;
  const visibleScore = persistedScore ?? fallbackResult.score;
  const visibleExplanation = persistedExplanation ?? fallbackResult.explanation;
  const visibleImprovementSuggestion =
    persistedImprovementSuggestion ?? fallbackResult.improvementSuggestion;
  const visibleFlags = fallbackResult.flags;

  return (
    <div className="space-y-6">
      <div className="bg-background rounded-4xl border p-8 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm tracking-[0.22em] text-emerald-700 uppercase">Trust score</p>
            <h2 className="mt-3 text-2xl font-semibold">Lectura automática del legajo</h2>
            <p className="text-muted-foreground mt-3 text-sm leading-7">{visibleExplanation}</p>
          </div>
          <TrustScoreBadge score={visibleScore} />
        </div>

        <div className="mt-6 grid gap-4">
          {dimensions.map(([key, value]) => (
            <div key={key} className="rounded-3xl border p-4">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-medium">{dimensionLabels[key]}</p>
                <span className="text-sm font-semibold">{value}/100</span>
              </div>
              <div className="bg-muted mt-3 h-2 overflow-hidden rounded-full">
                <div
                  className={`h-full rounded-full ${getBarTone(value)}`}
                  style={{ width: `${value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-background rounded-4xl border p-8 shadow-sm">
        <p className="text-sm tracking-[0.22em] text-emerald-700 uppercase">Siguiente mejora</p>
        <p className="mt-4 text-sm leading-7">{visibleImprovementSuggestion}</p>

        {visibleFlags.length > 0 ? (
          <div className="mt-6 flex flex-wrap gap-2">
            {visibleFlags.map((flag) => (
              <span
                key={flag}
                className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-950"
              >
                {flag}
              </span>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
            No hay alertas principales en el legajo actual.
          </div>
        )}
      </div>
    </div>
  );
}
