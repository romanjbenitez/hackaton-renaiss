import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/lib/db/prisma";
import { documentSummarySchema, tenantAiInputSchema } from "@/lib/ai/schemas";
import { generateTrustScore } from "@/lib/ai/engine";

export const runtime = "nodejs";

const requestSchema = z.object({
  tenantProfileId: z.string().min(1).optional(),
  userId: z.string().min(1).optional(),
  tenantProfile: tenantAiInputSchema.shape.tenantProfile.optional(),
  documents: z.array(documentSummarySchema).optional(),
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

  let tenantProfile = parsed.data.tenantProfile ?? null;
  let documents = parsed.data.documents ?? [];
  let tenantProfileId = parsed.data.tenantProfileId ?? null;

  if ((tenantProfileId || parsed.data.userId) && !tenantProfile) {
    const databaseProfile = await prisma.tenantProfile.findFirst({
      where: tenantProfileId
        ? { id: tenantProfileId }
        : {
            userId: parsed.data.userId ?? undefined,
          },
      select: {
        id: true,
        dni: true,
        profileType: true,
        occupation: true,
        monthlyIncome: true,
        trustScore: true,
        guaranteeType: true,
        hasPets: true,
        isSmoker: true,
        hasChildren: true,
        familyMembers: true,
        platformHistoryScore: true,
        documents: {
          select: {
            id: true,
            type: true,
            displayName: true,
            verificationStatus: true,
            suspicious: true,
            suspiciousScore: true,
          },
        },
      },
    });

    if (!databaseProfile) {
      return NextResponse.json({ error: "No se encontró el perfil" }, { status: 404 });
    }

    tenantProfileId = databaseProfile.id;
    tenantProfile = {
      dni: databaseProfile.dni,
      profileType: databaseProfile.profileType,
      occupation: databaseProfile.occupation,
      monthlyIncome: toNumber(databaseProfile.monthlyIncome),
      trustScore: databaseProfile.trustScore,
      guaranteeType: databaseProfile.guaranteeType,
      hasPets: databaseProfile.hasPets,
      isSmoker: databaseProfile.isSmoker,
      hasChildren: databaseProfile.hasChildren,
      familyMembers: databaseProfile.familyMembers,
      platformHistoryScore: databaseProfile.platformHistoryScore,
    };
    documents = databaseProfile.documents.map((document) => ({
      ...document,
      suspiciousScore: document.suspiciousScore ?? undefined,
    }));
  }

  if (!tenantProfile) {
    return NextResponse.json({ error: "Falta tenantProfile o tenantProfileId" }, { status: 400 });
  }

  const result = await generateTrustScore({
    tenantProfile,
    documents,
  });

  if (parsed.data.persist && tenantProfileId) {
    await prisma.tenantProfile.update({
      where: { id: tenantProfileId },
      data: {
        trustScore: result.score,
        trustScoreExplanation: result.explanation,
        improvementSuggestion: result.improvementSuggestion,
      },
    });
  }

  return NextResponse.json({
    ...result,
    persisted: Boolean(parsed.data.persist && tenantProfileId),
    tenantProfileId,
  });
}
