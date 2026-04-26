"use client";

import { useMemo } from "react";

import { AlertBanner } from "@/components/ui/alert-banner";
import { StatCard } from "@/components/ui/stat-card";
import { StatusPill } from "@/components/ui/status-pill";
import { TrustScoreBadge } from "@/components/tenant/trust-score-badge";
import { deriveTrustScoreFallback } from "@/lib/ai/fallback";
import {
  mapDocumentsToAiSummary,
  type GuaranteeType,
  type ProfileType,
  type StoredTenantDocument,
} from "@/lib/tenant/documents";
import type { SemanticTone } from "@/lib/ui";

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

function getFlagTone(flag: string): SemanticTone {
  return flag.toLowerCase().includes("alert") ? "danger" : "warning";
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
              <StatCard label={dimensionLabels[key]} value={`${value}/100`} />
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
              <StatusPill key={flag} tone={getFlagTone(flag)}>
                {flag}
              </StatusPill>
            ))}
          </div>
        ) : (
          <AlertBanner tone="success" className="mt-6 rounded-3xl">
            No hay alertas principales en el legajo actual.
          </AlertBanner>
        )}
      </div>
    </div>
  );
}
