import "server-only";

import { UserRole } from "@prisma/client";
import { z } from "zod";

import { deriveTrustScoreFallback } from "@/lib/ai/fallback";
import { prisma } from "@/lib/db/prisma";
import { getCurrentSession } from "@/lib/auth/session";
import { onboardingStep1Schema, onboardingStep2Schema } from "@/lib/validations/tenant";
import { calculateBaseScore } from "@/lib/tenant/scoring";

export type TenantOnboardingStep1 = z.output<typeof onboardingStep1Schema>;
export type TenantOnboardingStep2 = z.output<typeof onboardingStep2Schema>;

export type TenantOnboardingDraft = {
  step1?: TenantOnboardingStep1;
  step2?: TenantOnboardingStep2;
  updatedAt?: string;
};

function fallbackNamePart(value: string | null | undefined, fallback: string) {
  if (value && value.trim().length > 0) {
    return value.trim();
  }

  return fallback;
}

async function getOrCreateCurrentTenantUser() {
  const session = await getCurrentSession();
  const email = session.user?.email;

  if (!email) {
    return null;
  }

  const firstName = fallbackNamePart(
    session.user?.user_metadata.first_name as string | undefined,
    "Usuario"
  );
  const lastName = fallbackNamePart(
    session.user?.user_metadata.last_name as string | undefined,
    "Demo"
  );

  return prisma.user.upsert({
    where: { email },
    update: {
      firstName,
      lastName,
      role: UserRole.TENANT,
    },
    create: {
      email,
      firstName,
      lastName,
      role: UserRole.TENANT,
    },
    select: {
      id: true,
      updatedAt: true,
      tenantProfile: {
        select: {
          id: true,
          dni: true,
          profileType: true,
          occupation: true,
          monthlyIncome: true,
          trustScore: true,
          trustScoreExplanation: true,
          improvementSuggestion: true,
          hasPets: true,
          isSmoker: true,
          hasChildren: true,
          familyMembers: true,
          guaranteeType: true,
          guaranteeDetails: true,
          onboardingCompletedAt: true,
          updatedAt: true,
          _count: {
            select: {
              documents: true,
            },
          },
        },
      },
    },
  });
}

export async function getTenantOnboardingDraft() {
  const user = await getOrCreateCurrentTenantUser();

  if (!user?.tenantProfile) {
    return {};
  }

  const step1: TenantOnboardingStep1 = {
    dni: user.tenantProfile.dni,
    profileType: user.tenantProfile.profileType,
    occupation: user.tenantProfile.occupation ?? "",
    monthlyIncome: user.tenantProfile.monthlyIncome
      ? Number(user.tenantProfile.monthlyIncome)
      : 0,
  };

  const step2 = user.tenantProfile.onboardingCompletedAt
    ? ({
        hasPets: user.tenantProfile.hasPets,
        isSmoker: user.tenantProfile.isSmoker,
        hasChildren: user.tenantProfile.hasChildren,
        familyMembers: user.tenantProfile.familyMembers,
        guaranteeType: user.tenantProfile.guaranteeType,
        guaranteeDetails: user.tenantProfile.guaranteeDetails ?? "",
      } satisfies TenantOnboardingStep2)
    : undefined;

  return {
    step1,
    step2,
    updatedAt: user.tenantProfile.updatedAt.toISOString(),
  } satisfies TenantOnboardingDraft;
}

export async function saveTenantOnboardingDraft(input: TenantOnboardingDraft) {
  const user = await getOrCreateCurrentTenantUser();

  if (!user || !input.step1) {
    return;
  }

  const snapshot = getTenantProfileSnapshot(input);
  const existingDocuments = user.tenantProfile
    ? await prisma.document.findMany({
        where: {
          tenantProfileId: user.tenantProfile.id,
        },
        select: {
          id: true,
          type: true,
          displayName: true,
          verificationStatus: true,
          suspicious: true,
          suspiciousScore: true,
        },
      })
    : [];

  const trustFallback = deriveTrustScoreFallback({
    tenantProfile: {
      dni: input.step1.dni,
      profileType: input.step1.profileType,
      occupation: input.step1.occupation,
      monthlyIncome: input.step1.monthlyIncome,
      guaranteeType: input.step2?.guaranteeType ?? "NONE",
      hasPets: input.step2?.hasPets ?? false,
      isSmoker: input.step2?.isSmoker ?? false,
      hasChildren: input.step2?.hasChildren ?? false,
      familyMembers: input.step2?.familyMembers ?? 1,
      platformHistoryScore: user.tenantProfile?.trustScore ?? undefined,
    },
    documents: existingDocuments,
  });

  const trustData = {
    trustScore: trustFallback.score,
    trustScoreExplanation: trustFallback.explanation,
    improvementSuggestion: trustFallback.improvementSuggestion,
  };

  await prisma.tenantProfile.upsert({
    where: { userId: user.id },
    update: {
      dni: input.step1.dni,
      profileType: input.step1.profileType,
      occupation: input.step1.occupation,
      monthlyIncome: input.step1.monthlyIncome,
      hasPets: input.step2?.hasPets ?? false,
      isSmoker: input.step2?.isSmoker ?? false,
      hasChildren: input.step2?.hasChildren ?? false,
      familyMembers: input.step2?.familyMembers ?? 1,
      guaranteeType: input.step2?.guaranteeType ?? "NONE",
      guaranteeDetails: input.step2?.guaranteeDetails || null,
      onboardingCompletedAt: input.step2 ? new Date() : null,
      ...trustData,
    },
    create: {
      userId: user.id,
      dni: input.step1.dni,
      profileType: input.step1.profileType,
      occupation: input.step1.occupation,
      monthlyIncome: input.step1.monthlyIncome,
      trustScore: trustData.trustScore,
      trustScoreExplanation: trustData.trustScoreExplanation,
      improvementSuggestion: trustData.improvementSuggestion,
      hasPets: input.step2?.hasPets ?? false,
      isSmoker: input.step2?.isSmoker ?? false,
      hasChildren: input.step2?.hasChildren ?? false,
      familyMembers: input.step2?.familyMembers ?? 1,
      guaranteeType: input.step2?.guaranteeType ?? "NONE",
      guaranteeDetails: input.step2?.guaranteeDetails || null,
      onboardingCompletedAt: input.step2 ? new Date() : null,
    },
  });
}

export async function clearTenantOnboardingDraft() {
  return;
}

export function getTenantProfileSnapshot(draft: TenantOnboardingDraft) {
  const step1 = draft.step1;
  const step2 = draft.step2;
  const baseScore = calculateBaseScore({
    hasDni: Boolean(step1?.dni),
    hasIncomeProof: false,
    hasGuaranteeProof: step2?.guaranteeType ? step2.guaranteeType !== "NONE" : false,
    hasLifestyleProfile: Boolean(step2),
    hasMonthlyIncome: Boolean(step1?.monthlyIncome),
    guaranteeType: step2?.guaranteeType ?? "NONE",
  });

  const suggestions = [
    !step1?.dni ? "Cargá tu DNI para validar identidad y sumar confianza." : null,
    !step1?.monthlyIncome
      ? "Completá tus ingresos para mejorar la relación ingreso/alquiler."
      : null,
    !step2
      ? "Completá tu perfil de estilo de vida para mejorar el matching con propiedades."
      : null,
    step2?.guaranteeType === "NONE"
      ? "Declará una garantía hipotecaria o seguro de caución para subir el score."
      : null,
    "Subí comprobantes de ingresos cuando habilitemos documentos para empujar el score por encima de 80.",
  ].filter(Boolean) as string[];

  return {
    baseScore,
    suggestions,
  };
}
