import "server-only";

import { CandidacySource, CandidacyStatus } from "@prisma/client";
import { z } from "zod";

import { generateCompatibility } from "@/lib/ai/engine";
import { ensureCurrentTenantContext } from "@/lib/auth/actors";
import { prisma } from "@/lib/db/prisma";

const manualCandidacySchema = z.object({
  fullName: z.string().min(3).max(120),
  email: z.string().email(),
  phone: z.string().max(40).optional(),
  monthlyIncome: z.coerce.number().positive(),
  guaranteeType: z.enum(["MORTGAGE", "CAUTION_INSURANCE", "NONE"]),
});

function estimateScore(
  monthlyIncome: number,
  ratio: number,
  guaranteeType: "MORTGAGE" | "CAUTION_INSURANCE" | "NONE"
) {
  let score = 40;

  if (ratio <= 0.3) score += 30;
  else if (ratio <= 0.4) score += 20;
  else if (ratio <= 0.5) score += 10;

  if (monthlyIncome >= 1500000) score += 15;
  else if (monthlyIncome >= 900000) score += 10;
  else if (monthlyIncome >= 600000) score += 5;

  if (guaranteeType === "MORTGAGE") score += 15;
  else if (guaranteeType === "CAUTION_INSURANCE") score += 10;

  return Math.min(100, score);
}

export async function getPropertyCandidacies(propertyId: string, agencyId: string) {
  const candidacies = await prisma.candidacy.findMany({
    where: {
      propertyId,
      property: {
        agencyId,
      },
    },
    orderBy: [
      { scoreAtSubmission: "desc" },
      { createdAt: "desc" },
    ],
    select: {
      id: true,
      source: true,
      status: true,
      scoreAtSubmission: true,
      monthlyIncome: true,
      rentToIncomeRatio: true,
      guaranteeType: true,
      aiCompatibilityScore: true,
      aiCompatibilityExplanation: true,
      aiCompatibilityMatchPoints: true,
      aiCompatibilityConflicts: true,
      manualCandidateName: true,
      manualCandidateEmail: true,
      manualCandidatePhone: true,
      createdAt: true,
      tenant: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      },
      tenantProfile: {
        select: {
          id: true,
          monthlyIncome: true,
          guaranteeType: true,
          trustScore: true,
          hasPets: true,
          isSmoker: true,
          hasChildren: true,
          familyMembers: true,
          profileType: true,
        },
      },
      property: {
        select: {
          title: true,
          city: true,
          province: true,
          price: true,
          targetTrustScore: true,
          acceptedGuarantees: true,
          acceptsPets: true,
          acceptsSmokers: true,
          acceptsChildren: true,
          preferredProfile: true,
          compatibilityNotes: true,
        },
      },
    },
  });

  const missingCompatibility = candidacies.filter(
    (candidate) => candidate.tenantProfile && candidate.aiCompatibilityScore == null
  );

  if (missingCompatibility.length > 0) {
    await Promise.all(
      missingCompatibility.map(async (candidate) => {
        const result = await generateCompatibility({
          tenantProfile: {
            profileType: candidate.tenantProfile!.profileType,
            monthlyIncome: candidate.tenantProfile!.monthlyIncome
              ? Number(candidate.tenantProfile!.monthlyIncome)
              : null,
            guaranteeType: candidate.tenantProfile!.guaranteeType,
            hasPets: candidate.tenantProfile!.hasPets,
            isSmoker: candidate.tenantProfile!.isSmoker,
            hasChildren: candidate.tenantProfile!.hasChildren,
            familyMembers: candidate.tenantProfile!.familyMembers,
            trustScore: candidate.tenantProfile!.trustScore,
          },
          property: {
            title: candidate.property.title,
            city: candidate.property.city,
            province: candidate.property.province,
            price: Number(candidate.property.price),
            targetTrustScore: candidate.property.targetTrustScore,
            acceptedGuarantees: candidate.property.acceptedGuarantees,
            acceptsPets: candidate.property.acceptsPets,
            acceptsSmokers: candidate.property.acceptsSmokers,
            acceptsChildren: candidate.property.acceptsChildren,
            preferredProfile: candidate.property.preferredProfile,
            compatibilityNotes: candidate.property.compatibilityNotes,
          },
        });

        await prisma.candidacy.update({
          where: { id: candidate.id },
          data: {
            aiCompatibilityScore: result.compatibilityScore,
            aiCompatibilityExplanation: result.explanation,
            aiCompatibilityMatchPoints: result.matchPoints,
            aiCompatibilityConflicts: result.conflicts,
          },
        });
      })
    );

    return getPropertyCandidacies(propertyId, agencyId);
  }

  return candidacies;
}

export async function createManualCandidacy(
  propertyId: string,
  agencyId: string,
  input: z.input<typeof manualCandidacySchema>
) {
  const parsed = manualCandidacySchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const property = await prisma.property.findFirst({
    where: {
      id: propertyId,
      agencyId,
    },
    select: {
      id: true,
      price: true,
    },
  });

  if (!property) {
    return { ok: false as const, error: "No se encontró la propiedad." };
  }

  const monthlyIncome = parsed.data.monthlyIncome;
  const rentToIncomeRatio = Number((Number(property.price) / monthlyIncome).toFixed(2));
  const scoreAtSubmission = estimateScore(
    monthlyIncome,
    rentToIncomeRatio,
    parsed.data.guaranteeType
  );

  await prisma.candidacy.create({
    data: {
      propertyId: property.id,
      source: CandidacySource.MANUAL,
      status: CandidacyStatus.SUBMITTED,
      scoreAtSubmission,
      monthlyIncome,
      rentToIncomeRatio,
      guaranteeType: parsed.data.guaranteeType,
      manualCandidateName: parsed.data.fullName,
      manualCandidateEmail: parsed.data.email,
      manualCandidatePhone: parsed.data.phone || null,
    },
  });

  return { ok: true as const };
}

export async function createPlatformCandidacy(propertyId: string) {
  const tenantContext = await ensureCurrentTenantContext();

  if (!tenantContext) {
    return { ok: false as const, error: "Sesión inválida." };
  }

  if (!tenantContext.tenantProfile) {
    return {
      ok: false as const,
      error: "Completá tu perfil antes de postularte.",
    };
  }

  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: {
      id: true,
      price: true,
      status: true,
      title: true,
      city: true,
      province: true,
      targetTrustScore: true,
      acceptedGuarantees: true,
      acceptsPets: true,
      acceptsSmokers: true,
      acceptsChildren: true,
      preferredProfile: true,
      compatibilityNotes: true,
    },
  });

  if (!property || property.status !== "PUBLISHED") {
    return { ok: false as const, error: "La propiedad no está disponible para postulación." };
  }

  const alreadyApplied = await prisma.candidacy.findFirst({
    where: {
      propertyId,
      tenantId: tenantContext.user.id,
      source: CandidacySource.PLATFORM,
      status: {
        in: [
          CandidacyStatus.SUBMITTED,
          CandidacyStatus.IN_REVIEW,
          CandidacyStatus.SHORTLISTED,
          CandidacyStatus.SELECTED,
        ],
      },
    },
    select: {
      id: true,
    },
  });

  if (alreadyApplied) {
    return { ok: false as const, error: "Ya existe una postulación activa para esa propiedad." };
  }

  const monthlyIncome = tenantContext.tenantProfile.monthlyIncome ?? 0;
  const rentToIncomeRatio =
    monthlyIncome > 0 ? Number((Number(property.price) / monthlyIncome).toFixed(2)) : null;

  const compatibility = await generateCompatibility({
    tenantProfile: {
      profileType: tenantContext.tenantProfile.profileType,
      monthlyIncome,
      guaranteeType: tenantContext.tenantProfile.guaranteeType,
      hasPets: tenantContext.tenantProfile.hasPets,
      isSmoker: tenantContext.tenantProfile.isSmoker,
      hasChildren: tenantContext.tenantProfile.hasChildren,
      familyMembers: tenantContext.tenantProfile.familyMembers,
      trustScore: tenantContext.tenantProfile.trustScore,
    },
    property: {
      title: property.title,
      city: property.city,
      province: property.province,
      price: Number(property.price),
      targetTrustScore: property.targetTrustScore,
      acceptedGuarantees: property.acceptedGuarantees,
      acceptsPets: property.acceptsPets,
      acceptsSmokers: property.acceptsSmokers,
      acceptsChildren: property.acceptsChildren,
      preferredProfile: property.preferredProfile,
      compatibilityNotes: property.compatibilityNotes,
    },
  });

  await prisma.candidacy.create({
    data: {
      propertyId,
      tenantId: tenantContext.user.id,
      tenantProfileId: tenantContext.tenantProfile.id,
      source: CandidacySource.PLATFORM,
      status: CandidacyStatus.SUBMITTED,
      scoreAtSubmission: tenantContext.tenantProfile.trustScore,
      monthlyIncome: monthlyIncome || null,
      rentToIncomeRatio,
      guaranteeType: tenantContext.tenantProfile.guaranteeType,
      aiCompatibilityScore: compatibility.compatibilityScore,
      aiCompatibilityExplanation: compatibility.explanation,
      aiCompatibilityMatchPoints: compatibility.matchPoints,
      aiCompatibilityConflicts: compatibility.conflicts,
    },
  });

  return { ok: true as const };
}
