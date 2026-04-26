import { z } from "zod";

const guaranteeTypes = ["MORTGAGE", "CAUTION_INSURANCE", "NONE"] as const;
const tenantProfileTypes = ["EMPLOYED", "MONOTRIBUTISTA", "SELF_EMPLOYED", "RETIRED"] as const;
const documentVerificationStatuses = ["PENDING", "VERIFIED", "REJECTED", "FLAGGED"] as const;
const documentTypes = [
  "DNI",
  "PAYSLIP",
  "MONOTRIBUTO_CERTIFICATE",
  "MONOTRIBUTO_PAYMENT",
  "INCOME_AFFIDAVIT",
  "RETIREMENT_RECEIPT",
  "MORTGAGE_GUARANTEE",
  "CAUTION_INSURANCE",
  "CONTRACT",
  "OTHER",
] as const;

export const documentSummarySchema = z.object({
  id: z.string().optional(),
  type: z.enum(documentTypes),
  displayName: z.string().min(1),
  verificationStatus: z.enum(documentVerificationStatuses).optional(),
  suspicious: z.boolean().optional(),
  suspiciousScore: z.number().min(0).max(1).optional(),
});

export const tenantAiInputSchema = z.object({
  tenantProfile: z.object({
    dni: z.string().optional(),
    profileType: z.enum(tenantProfileTypes),
    occupation: z.string().nullable().optional(),
    monthlyIncome: z.number().positive().nullable().optional(),
    trustScore: z.number().min(0).max(100).optional(),
    guaranteeType: z.enum(guaranteeTypes).optional(),
    hasPets: z.boolean().optional(),
    isSmoker: z.boolean().optional(),
    hasChildren: z.boolean().optional(),
    familyMembers: z.number().int().min(1).optional(),
    platformHistoryScore: z.number().min(0).max(100).nullable().optional(),
  }),
  documents: z.array(documentSummarySchema).default([]),
});

export const trustScoreAiSchema = z.object({
  score: z.number().int().min(0).max(100),
  dimensions: z.object({
    docCompleteness: z.number().int().min(0).max(100),
    incomeConsistency: z.number().int().min(0).max(100),
    guaranteeType: z.number().int().min(0).max(100),
    platformHistory: z.number().int().min(0).max(100),
  }),
  improvementSuggestion: z.string().min(1),
  flags: z.array(z.string()).default([]),
  explanation: z.string().min(1),
});

export const compatibilityAiInputSchema = z.object({
  tenantProfile: z.object({
    profileType: z.enum(tenantProfileTypes),
    monthlyIncome: z.number().positive().nullable().optional(),
    guaranteeType: z.enum(guaranteeTypes).optional(),
    hasPets: z.boolean().optional(),
    isSmoker: z.boolean().optional(),
    hasChildren: z.boolean().optional(),
    familyMembers: z.number().int().min(1).optional(),
    trustScore: z.number().min(0).max(100).optional(),
  }),
  property: z.object({
    title: z.string().min(1),
    city: z.string().min(1),
    province: z.string().min(1),
    price: z.number().positive(),
    targetTrustScore: z.number().min(0).max(100).nullable().optional(),
    acceptedGuarantees: z.array(z.enum(guaranteeTypes)).default([]),
    acceptsPets: z.boolean(),
    acceptsSmokers: z.boolean(),
    acceptsChildren: z.boolean(),
    preferredProfile: z.enum(tenantProfileTypes).nullable().optional(),
    compatibilityNotes: z.string().nullable().optional(),
  }),
});

export const compatibilityAiSchema = z.object({
  compatibilityScore: z.number().int().min(0).max(100),
  explanation: z.string().min(1),
  matchPoints: z.array(z.string()).default([]),
  conflicts: z.array(z.string()).default([]),
});

export const candidatesSummaryAiSchema = z.object({
  summary: z.string().min(1),
  topCandidateId: z.string().min(1),
  highlights: z.array(
    z.object({
      candidateId: z.string().min(1),
      strength: z.string().min(1),
    })
  ),
});

export const documentFraudAiSchema = z.object({
  suspicious: z.boolean(),
  confidence: z.number().min(0).max(1),
  reason: z.string().min(1),
});

export type TrustScoreAiOutput = z.output<typeof trustScoreAiSchema>;
export type CompatibilityAiOutput = z.output<typeof compatibilityAiSchema>;
