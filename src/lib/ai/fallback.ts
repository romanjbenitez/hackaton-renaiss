import type { GuaranteeType, TenantProfileType } from "@prisma/client";

import { calculateBaseScore } from "../tenant/scoring";
import type { CompatibilityAiOutput, TrustScoreAiOutput } from "./schemas";

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

function formatMoney(value?: number | null) {
  if (!value || Number.isNaN(value)) return "sin dato";
  return new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(value);
}

function countRelevantDocuments(documents: DocumentSnapshot[]) {
  const byType = new Map<string, DocumentSnapshot[]>();

  for (const document of documents) {
    const list = byType.get(document.type) ?? [];
    list.push(document);
    byType.set(document.type, list);
  }

  const hasDni = Boolean(byType.get("DNI")?.length);
  const hasIncomeProof = Boolean(
    byType.get("PAYSLIP")?.length ||
      byType.get("MONOTRIBUTO_CERTIFICATE")?.length ||
      byType.get("MONOTRIBUTO_PAYMENT")?.length ||
      byType.get("INCOME_AFFIDAVIT")?.length ||
      byType.get("RETIREMENT_RECEIPT")?.length
  );
  const hasGuaranteeProof = Boolean(
    byType.get("MORTGAGE_GUARANTEE")?.length || byType.get("CAUTION_INSURANCE")?.length
  );

  return { hasDni, hasIncomeProof, hasGuaranteeProof };
}

export function deriveTrustScoreFallback(input: {
  tenantProfile: TenantProfileSnapshot;
  documents: DocumentSnapshot[];
}): TrustScoreAiOutput {
  const documentCoverage = countRelevantDocuments(input.documents);
  const baseScore = calculateBaseScore({
    hasDni: documentCoverage.hasDni,
    hasIncomeProof: documentCoverage.hasIncomeProof,
    hasGuaranteeProof: documentCoverage.hasGuaranteeProof,
    hasLifestyleProfile: true,
    hasMonthlyIncome: Boolean(input.tenantProfile.monthlyIncome),
    guaranteeType: input.tenantProfile.guaranteeType ?? "NONE",
  });

  const incomeConsistency = clampScore(
    documentCoverage.hasIncomeProof
      ? 70 + (input.tenantProfile.monthlyIncome ? 10 : 0)
      : 35 + (input.tenantProfile.monthlyIncome ? 10 : 0)
  );
  const guaranteeType = clampScore(
    input.tenantProfile.guaranteeType === "MORTGAGE"
      ? 92
      : input.tenantProfile.guaranteeType === "CAUTION_INSURANCE"
        ? 84
        : 48
  );
  const platformHistory = clampScore(input.tenantProfile.platformHistoryScore ?? baseScore);
  const docCompleteness = clampScore(
    30 +
      (documentCoverage.hasDni ? 25 : 0) +
      (documentCoverage.hasIncomeProof ? 25 : 0) +
      (documentCoverage.hasGuaranteeProof ? 20 : 0)
  );

  const score = clampScore(
    baseScore * 0.3 +
      docCompleteness * 0.3 +
      incomeConsistency * 0.2 +
      guaranteeType * 0.1 +
      platformHistory * 0.1
  );

  const flags = [
    !documentCoverage.hasDni ? "Falta DNI" : null,
    !documentCoverage.hasIncomeProof ? "Faltan comprobantes de ingresos" : null,
    input.tenantProfile.guaranteeType === "NONE" ? "Garantía no declarada" : null,
  ].filter(Boolean) as string[];

  return {
    score,
    dimensions: {
      docCompleteness,
      incomeConsistency,
      guaranteeType,
      platformHistory,
    },
    improvementSuggestion:
      flags[0] ?? "Perfil consistente; conviene sumar documentación para sostener el score.",
    flags,
    explanation: `Score calculado localmente con DNI, ingresos, garantía y cobertura documental. Ingreso mensual: ${formatMoney(input.tenantProfile.monthlyIncome)}.`,
  };
}

export function deriveCompatibilityFallback(input: {
  tenantProfile: TenantProfileSnapshot;
  property: PropertySnapshot;
}): CompatibilityAiOutput {
  const income = input.tenantProfile.monthlyIncome ?? 0;
  const rent = input.property.price || 1;
  const ratio = income > 0 ? rent / income : 1.5;
  const acceptedGuarantees = input.property.acceptedGuarantees ?? [];
  const trustScore = input.tenantProfile.trustScore;
  const trustGap =
    trustScore != null && input.property.targetTrustScore != null
      ? trustScore - input.property.targetTrustScore
      : null;
  const familyMembers = input.tenantProfile.familyMembers ?? 1;
  const squareMeters = input.property.squareMeters ?? null;
  const bedrooms = input.property.bedrooms ?? null;
  const estimatedCapacity =
    bedrooms != null && bedrooms > 0 ? bedrooms + 1 : squareMeters != null ? Math.max(1, Math.floor(squareMeters / 22)) : null;
  const householdFit =
    estimatedCapacity == null
      ? 0
      : familyMembers <= estimatedCapacity
        ? familyMembers === estimatedCapacity
          ? 6
          : 10
        : familyMembers - estimatedCapacity >= 2
          ? -16
          : -9;

  const matchPoints = [
    ratio <= 0.3 ? "Relación ingreso/alquiler saludable" : ratio <= 0.4 ? "Ingreso razonable para el alquiler" : null,
    acceptedGuarantees.includes(input.tenantProfile.guaranteeType ?? "NONE")
      ? "La garantía declarada encaja con la propiedad"
      : null,
    trustGap != null && trustGap >= 0 ? "Tu trust score alcanza el objetivo pedido" : null,
    householdFit >= 6 ? "El tamaño del hogar encaja con la unidad" : null,
    input.property.acceptsPets || !input.tenantProfile.hasPets ? "No hay choque por mascotas" : null,
    input.property.acceptsSmokers || !input.tenantProfile.isSmoker ? "No hay choque por fumador" : null,
    input.property.acceptsChildren || !input.tenantProfile.hasChildren ? "No hay choque por niños" : null,
  ].filter(Boolean) as string[];

  const conflicts = [
    ratio > 0.4 ? "El alquiler queda exigente frente al ingreso declarado" : null,
    trustGap != null && trustGap < -10
      ? `Tu trust score queda ${Math.abs(trustGap)} puntos debajo del objetivo`
      : trustGap != null && trustGap < 0
        ? "Tu trust score queda apenas por debajo del objetivo"
        : null,
    householdFit <= -9 ? "El tamaño del grupo familiar queda ajustado para esta unidad" : null,
    input.tenantProfile.hasPets && !input.property.acceptsPets ? "La propiedad no acepta mascotas" : null,
    input.tenantProfile.isSmoker && !input.property.acceptsSmokers ? "La propiedad no acepta fumadores" : null,
    input.tenantProfile.hasChildren && !input.property.acceptsChildren ? "La propiedad no acepta niños" : null,
    input.property.preferredProfile && input.property.preferredProfile !== input.tenantProfile.profileType
      ? "El perfil preferido de la propiedad no coincide"
      : null,
  ].filter(Boolean) as string[];

  const compatibilityScore = clampScore(
    48 +
      (ratio <= 0.28 ? 22 : ratio <= 0.35 ? 14 : ratio <= 0.45 ? 4 : -16) +
      (acceptedGuarantees.includes(input.tenantProfile.guaranteeType ?? "NONE") ? 14 : -10) +
      (trustGap == null ? 0 : trustGap >= 0 ? 10 : trustGap >= -10 ? -3 : -14) +
      householdFit +
      (input.property.acceptsPets || !input.tenantProfile.hasPets ? 4 : -10) +
      (input.property.acceptsSmokers || !input.tenantProfile.isSmoker ? 3 : -6) +
      (input.property.acceptsChildren || !input.tenantProfile.hasChildren ? 3 : -7) +
      (input.property.preferredProfile
        ? input.property.preferredProfile === input.tenantProfile.profileType
          ? 6
          : -5
        : 0)
  );

  const explanation =
    compatibilityScore >= 85
      ? "Compatibilidad alta: el perfil cumple bien con las condiciones económicas y operativas de la propiedad."
      : compatibilityScore >= 65
        ? conflicts.length > 0
          ? `Compatibilidad moderada con algunos ajustes: ${conflicts[0]}.`
          : "Compatibilidad sólida: el perfil encaja razonablemente bien con la ficha de la propiedad."
        : `Compatibilidad baja o riesgosa: ${conflicts[0] ?? "hay varias fricciones entre tu perfil y la publicación"}.`;

  return {
    compatibilityScore,
    explanation,
    matchPoints,
    conflicts,
  };
}
