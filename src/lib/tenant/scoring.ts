import type { GuaranteeType } from "@prisma/client";

export type BaseScoreInput = {
  hasDni: boolean;
  hasIncomeProof: boolean;
  hasGuaranteeProof: boolean;
  hasLifestyleProfile: boolean;
  hasMonthlyIncome: boolean;
  guaranteeType: GuaranteeType | "NONE";
};

export function calculateBaseScore(input: BaseScoreInput) {
  let score = 15;

  if (input.hasDni) score += 20;
  if (input.hasIncomeProof) score += 30;
  if (input.hasLifestyleProfile) score += 10;
  if (input.hasMonthlyIncome) score += 10;

  if (input.guaranteeType === "MORTGAGE") {
    score += 10;
  } else if (input.guaranteeType === "CAUTION_INSURANCE") {
    score += 7;
  }

  if (input.hasGuaranteeProof) {
    score += 5;
  }

  return Math.max(0, Math.min(100, score));
}

export function getTrustScoreLabel(score: number) {
  if (score >= 80) return "Excelente";
  if (score >= 65) return "Bueno";
  if (score >= 45) return "Regular";
  return "Riesgoso";
}

export function getTrustScoreTone(score: number) {
  if (score >= 80) return "emerald";
  if (score >= 65) return "sky";
  if (score >= 45) return "amber";
  return "rose";
}
