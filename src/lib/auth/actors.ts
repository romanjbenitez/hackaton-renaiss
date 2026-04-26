import "server-only";

import { UserRole } from "@prisma/client";

import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { getTenantOnboardingDraft, type TenantOnboardingDraft } from "@/lib/tenant/onboarding";

function fallbackNamePart(value: string | null | undefined, fallback: string) {
  if (value && value.trim().length > 0) {
    return value.trim();
  }

  return fallback;
}

export async function getCurrentAgencyUser() {
  const session = await getCurrentSession();
  const email = session.user?.email;

  if (!email) {
    return null;
  }

  return prisma.user.findFirst({
    where: {
      email,
      role: UserRole.AGENCY,
    },
    select: {
      id: true,
      email: true,
      companyName: true,
      firstName: true,
      lastName: true,
    },
  });
}

type CurrentTenantContext = {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  tenantProfile: {
    id: string;
    trustScore: number;
    trustScoreExplanation: string | null;
    improvementSuggestion: string | null;
    monthlyIncome: number | null;
    guaranteeType: "MORTGAGE" | "CAUTION_INSURANCE" | "NONE";
    hasPets: boolean;
    isSmoker: boolean;
    hasChildren: boolean;
    familyMembers: number;
    profileType: "EMPLOYED" | "MONOTRIBUTISTA" | "SELF_EMPLOYED" | "RETIRED";
  } | null;
  draft: TenantOnboardingDraft;
};

export async function ensureCurrentTenantContext(): Promise<CurrentTenantContext | null> {
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

  const user = await prisma.user.upsert({
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
      email: true,
      firstName: true,
      lastName: true,
      tenantProfile: {
        select: {
          id: true,
          trustScore: true,
          trustScoreExplanation: true,
          improvementSuggestion: true,
          monthlyIncome: true,
          guaranteeType: true,
          hasPets: true,
          isSmoker: true,
          hasChildren: true,
          familyMembers: true,
          profileType: true,
        },
      },
    },
  });

  const draft = await getTenantOnboardingDraft();

  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    },
    tenantProfile: user.tenantProfile
      ? {
          ...user.tenantProfile,
          monthlyIncome: user.tenantProfile.monthlyIncome
            ? Number(user.tenantProfile.monthlyIncome)
            : null,
        }
      : null,
    draft,
  };
}
