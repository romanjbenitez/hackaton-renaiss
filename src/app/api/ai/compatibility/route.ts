import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/lib/db/prisma";
import { generateCompatibility } from "@/lib/ai/engine";

export const runtime = "nodejs";

const requestSchema = z.object({
  candidacyId: z.string().min(1).optional(),
  tenantProfileId: z.string().min(1).optional(),
  propertyId: z.string().min(1).optional(),
  persist: z.boolean().optional().default(true),
});

function toNumber(value: Prisma.Decimal | number | null | undefined) {
  if (value == null) return null;
  return Number(value);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Payload inválido" },
      { status: 400 }
    );
  }

  let tenantProfileId = parsed.data.tenantProfileId ?? null;
  let propertyId = parsed.data.propertyId ?? null;
  let candidacyId = parsed.data.candidacyId ?? null;

  let tenantProfile: {
    profileType: "EMPLOYED" | "MONOTRIBUTISTA" | "SELF_EMPLOYED" | "RETIRED";
    monthlyIncome: number | null;
    guaranteeType: "MORTGAGE" | "CAUTION_INSURANCE" | "NONE" | null;
    hasPets: boolean;
    isSmoker: boolean;
    hasChildren: boolean;
    familyMembers: number;
    trustScore: number;
  } | null = null;

  let property: {
    title: string;
    city: string;
    province: string;
    price: number;
    targetTrustScore: number | null;
    acceptedGuarantees: Array<"MORTGAGE" | "CAUTION_INSURANCE" | "NONE">;
    acceptsPets: boolean;
    acceptsSmokers: boolean;
    acceptsChildren: boolean;
    preferredProfile: "EMPLOYED" | "MONOTRIBUTISTA" | "SELF_EMPLOYED" | "RETIRED" | null;
    compatibilityNotes: string | null;
  } | null = null;

  if (candidacyId && !tenantProfileId && !propertyId) {
    const candidacy = await prisma.candidacy.findUnique({
      where: { id: candidacyId },
      select: {
        id: true,
        tenantProfileId: true,
        propertyId: true,
        tenantProfile: {
          select: {
            profileType: true,
            monthlyIncome: true,
            guaranteeType: true,
            hasPets: true,
            isSmoker: true,
            hasChildren: true,
            familyMembers: true,
            trustScore: true,
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

    if (!candidacy) {
      return NextResponse.json({ error: "No se encontró la candidatura" }, { status: 404 });
    }

    candidacyId = candidacy.id;
    tenantProfileId = candidacy.tenantProfileId;
    propertyId = candidacy.propertyId;
    tenantProfile = candidacy.tenantProfile
      ? {
          ...candidacy.tenantProfile,
          monthlyIncome: toNumber(candidacy.tenantProfile.monthlyIncome),
          guaranteeType: candidacy.tenantProfile.guaranteeType,
        }
      : null;
    property = candidacy.property
      ? {
          ...candidacy.property,
          price: toNumber(candidacy.property.price) ?? 0,
          acceptedGuarantees: candidacy.property.acceptedGuarantees as Array<
            "MORTGAGE" | "CAUTION_INSURANCE" | "NONE"
          >,
          preferredProfile: candidacy.property.preferredProfile,
          compatibilityNotes: candidacy.property.compatibilityNotes,
        }
      : null;
  }

  if ((tenantProfileId || propertyId) && (!tenantProfile || !property)) {
    if (!tenantProfileId || !propertyId) {
      return NextResponse.json(
        { error: "Falta tenantProfileId o propertyId para calcular compatibilidad" },
        { status: 400 }
      );
    }

    const [databaseProfile, databaseProperty] = await Promise.all([
      prisma.tenantProfile.findUnique({
        where: { id: tenantProfileId },
        select: {
          profileType: true,
          monthlyIncome: true,
          guaranteeType: true,
          hasPets: true,
          isSmoker: true,
          hasChildren: true,
          familyMembers: true,
          trustScore: true,
        },
      }),
      prisma.property.findUnique({
        where: { id: propertyId },
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
      }),
    ]);

    if (!databaseProfile || !databaseProperty) {
      return NextResponse.json({ error: "No se encontró el perfil o la propiedad" }, { status: 404 });
    }

    tenantProfile = {
      profileType: databaseProfile.profileType,
      monthlyIncome: toNumber(databaseProfile.monthlyIncome),
      guaranteeType: databaseProfile.guaranteeType,
      hasPets: databaseProfile.hasPets,
      isSmoker: databaseProfile.isSmoker,
      hasChildren: databaseProfile.hasChildren,
      familyMembers: databaseProfile.familyMembers,
      trustScore: databaseProfile.trustScore,
    };
    property = {
      title: databaseProperty.title,
      city: databaseProperty.city,
      province: databaseProperty.province,
      price: toNumber(databaseProperty.price) ?? 0,
      targetTrustScore: databaseProperty.targetTrustScore,
      acceptedGuarantees: databaseProperty.acceptedGuarantees as Array<
        "MORTGAGE" | "CAUTION_INSURANCE" | "NONE"
      >,
      acceptsPets: databaseProperty.acceptsPets,
      acceptsSmokers: databaseProperty.acceptsSmokers,
      acceptsChildren: databaseProperty.acceptsChildren,
      preferredProfile: databaseProperty.preferredProfile,
      compatibilityNotes: databaseProperty.compatibilityNotes,
    };
  }

  if (!tenantProfile || !property) {
    return NextResponse.json(
      { error: "Faltan datos de tenantProfile y/o property" },
      { status: 400 }
    );
  }

  const result = await generateCompatibility({
    tenantProfile,
    property,
  });

  if (parsed.data.persist && candidacyId) {
    await prisma.candidacy.update({
      where: { id: candidacyId },
      data: {
        aiCompatibilityScore: result.compatibilityScore,
        aiCompatibilityExplanation: result.explanation,
        aiCompatibilityMatchPoints: result.matchPoints,
        aiCompatibilityConflicts: result.conflicts,
      },
    });
  }

  return NextResponse.json({
    ...result,
    persisted: Boolean(parsed.data.persist && candidacyId),
    candidacyId,
    tenantProfileId,
    propertyId,
  });
}
