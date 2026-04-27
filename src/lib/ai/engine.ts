import type { GuaranteeType, TenantProfileType } from "@prisma/client";

import {
  compatibilityAiSchema,
  trustScoreAiSchema,
  type CompatibilityAiOutput,
  type TrustScoreAiOutput,
} from "./schemas";
import { deriveCompatibilityFallback, deriveTrustScoreFallback } from "./fallback";
import { generateGrokJsonOutput, parseJsonFromModelOutput } from "./grok";
import { compatibilityPrompt, trustScorePrompt } from "./prompts";

type TenantProfileSnapshot = {
  dni?: string | null;
  profileType: TenantProfileType;
  occupation?: string | null;
  monthlyIncome?: number | null;
  trustScore?: number;
  guaranteeType?: GuaranteeType | null;
  hasPets?: boolean;
  isSmoker?: boolean;
  hasChildren?: boolean;
  familyMembers?: number;
  platformHistoryScore?: number | null;
};

type DocumentSnapshot = {
  id?: string;
  type: string;
  displayName: string;
  verificationStatus?: string;
  suspicious?: boolean;
  suspiciousScore?: number | null;
};

type PropertySnapshot = {
  title: string;
  city: string;
  province: string;
  price: number;
  squareMeters?: number | null;
  bedrooms?: number | null;
  targetTrustScore?: number | null;
  acceptedGuarantees?: GuaranteeType[];
  acceptsPets: boolean;
  acceptsSmokers: boolean;
  acceptsChildren: boolean;
  preferredProfile?: TenantProfileType | null;
  compatibilityNotes?: string | null;
};

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export async function generateTrustScore(input: {
  tenantProfile: TenantProfileSnapshot;
  documents: DocumentSnapshot[];
}): Promise<TrustScoreAiOutput> {
  const fallback = deriveTrustScoreFallback(input);
  const raw = await generateGrokJsonOutput({
    system: trustScorePrompt(),
    user: JSON.stringify({
      tenantProfile: input.tenantProfile,
      documents: input.documents,
    }),
  });

  if (!raw) {
    return fallback;
  }

  const parsed = parseJsonFromModelOutput<unknown>(raw);
  const validated = trustScoreAiSchema.safeParse(parsed);

  if (!validated.success) {
    return fallback;
  }

  return {
    ...validated.data,
    score: clampScore(validated.data.score),
    dimensions: {
      docCompleteness: clampScore(validated.data.dimensions.docCompleteness),
      incomeConsistency: clampScore(validated.data.dimensions.incomeConsistency),
      guaranteeType: clampScore(validated.data.dimensions.guaranteeType),
      platformHistory: clampScore(validated.data.dimensions.platformHistory),
    },
    improvementSuggestion: validated.data.improvementSuggestion.trim(),
    flags: validated.data.flags.map((flag) => flag.trim()).filter(Boolean),
    explanation: validated.data.explanation.trim(),
  };
}

export async function generateCompatibility(input: {
  tenantProfile: TenantProfileSnapshot;
  property: PropertySnapshot;
}): Promise<CompatibilityAiOutput> {
  const fallback = deriveCompatibilityFallback(input);
  const raw = await generateGrokJsonOutput({
    system: compatibilityPrompt(),
    user: JSON.stringify(input),
  });

  if (!raw) {
    return fallback;
  }

  const parsed = parseJsonFromModelOutput<unknown>(raw);
  const validated = compatibilityAiSchema.safeParse(parsed);

  if (!validated.success) {
    return fallback;
  }

  return {
    compatibilityScore: clampScore(validated.data.compatibilityScore),
    explanation: validated.data.explanation.trim(),
    matchPoints: validated.data.matchPoints.map((item) => item.trim()).filter(Boolean),
    conflicts: validated.data.conflicts.map((item) => item.trim()).filter(Boolean),
  };
}
