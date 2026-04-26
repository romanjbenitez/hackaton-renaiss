import "server-only";

import { deriveCompatibilityFallback } from "@/lib/ai/fallback";
import { ensureCurrentTenantContext } from "@/lib/auth/actors";
import { prisma } from "@/lib/db/prisma";
import { resolvePropertyCompatibility } from "@/lib/tenant/property-compatibility";

function getDraftTenantSummary(
  draft: NonNullable<Awaited<ReturnType<typeof ensureCurrentTenantContext>>>["draft"]
) {
  if (!draft.step1 || !draft.step2) {
    return null;
  }

  return {
    profileType: draft.step1.profileType,
    monthlyIncome: draft.step1.monthlyIncome,
    guaranteeType: draft.step2.guaranteeType,
    hasPets: draft.step2.hasPets,
    isSmoker: draft.step2.isSmoker,
    hasChildren: draft.step2.hasChildren,
    familyMembers: draft.step2.familyMembers,
    trustScore: 0,
  };
}

export async function getTenantPublishedProperties() {
  const tenantContext = await ensureCurrentTenantContext();

  if (!tenantContext) {
    return null;
  }

  const properties = await prisma.property.findMany({
    where: {
      status: "PUBLISHED",
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      title: true,
      addressLine: true,
      city: true,
      province: true,
      propertyType: true,
      squareMeters: true,
      price: true,
      photos: true,
      targetTrustScore: true,
      acceptedGuarantees: true,
      acceptsPets: true,
      acceptsSmokers: true,
      acceptsChildren: true,
      preferredProfile: true,
      compatibilityNotes: true,
      candidacies: {
        where: {
          tenantId: tenantContext.user.id,
          source: "PLATFORM",
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
        select: {
          id: true,
          status: true,
          aiCompatibilityScore: true,
          aiCompatibilityExplanation: true,
          aiCompatibilityMatchPoints: true,
          aiCompatibilityConflicts: true,
        },
      },
    },
  });

  const tenantSummary = tenantContext.tenantProfile ?? getDraftTenantSummary(tenantContext.draft);

  return {
    hasCompleteProfile: Boolean(tenantContext.draft.step1 && tenantContext.draft.step2),
    properties: properties.map((property) => {
      const latestApplication = property.candidacies[0] ?? null;
      const fallbackCompatibility = tenantSummary
        ? deriveCompatibilityFallback({
            tenantProfile: {
              profileType: tenantSummary.profileType,
              monthlyIncome: tenantSummary.monthlyIncome,
              guaranteeType: tenantSummary.guaranteeType,
              hasPets: tenantSummary.hasPets,
              isSmoker: tenantSummary.isSmoker,
              hasChildren: tenantSummary.hasChildren,
              familyMembers: tenantSummary.familyMembers,
              trustScore: tenantSummary.trustScore,
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
          })
        : null;
      return {
        ...property,
        price: Number(property.price),
        compatibility: resolvePropertyCompatibility(latestApplication, fallbackCompatibility),
        latestApplication,
      };
    }),
  };
}
