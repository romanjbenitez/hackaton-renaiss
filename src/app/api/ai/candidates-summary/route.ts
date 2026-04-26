import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db/prisma";
import { candidatesSummaryAiSchema } from "@/lib/ai/schemas";
import { generateGrokJsonOutput, parseJsonFromModelOutput } from "@/lib/ai/grok";
import { candidatesSummaryPrompt } from "@/lib/ai/prompts";

export const runtime = "nodejs";

const requestSchema = z.object({
  propertyId: z.string().min(1),
  limit: z.number().int().min(1).max(25).optional().default(5),
  persist: z.boolean().optional().default(false),
});

function buildFallbackSummary(candidates: Array<{ id: string; label: string; score: number }>) {
  const top = candidates[0];
  const highlights = candidates.slice(0, 3).map((candidate) => ({
    candidateId: candidate.id,
    strength: `${candidate.label} con score ${candidate.score}.`,
  }));

  return candidatesSummaryAiSchema.parse({
    summary: top
      ? `Los candidatos más fuertes son ${candidates
          .slice(0, 3)
          .map((candidate) => candidate.label)
          .join(", ")}. El mejor balance lo tiene ${top.label}.`
      : "No hay candidatos para resumir.",
    topCandidateId: top?.id ?? "",
    highlights,
  });
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

  const property = await prisma.property.findUnique({
    where: { id: parsed.data.propertyId },
    select: {
      id: true,
      title: true,
      candidacies: {
        orderBy: [{ scoreAtSubmission: "desc" }, { updatedAt: "desc" }],
        take: parsed.data.limit,
        select: {
          id: true,
          scoreAtSubmission: true,
          rentToIncomeRatio: true,
          guaranteeType: true,
          source: true,
          manualCandidateName: true,
          tenant: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          tenantProfile: {
            select: {
              trustScore: true,
              guaranteeType: true,
            },
          },
        },
      },
    },
  });

  if (!property) {
    return NextResponse.json({ error: "No se encontró la propiedad" }, { status: 404 });
  }

  const candidates = property.candidacies.map((candidate) => {
    const label =
      candidate.manualCandidateName ??
      (candidate.tenant ? `${candidate.tenant.firstName} ${candidate.tenant.lastName}` : "Candidato sin nombre");

    return {
      id: candidate.id,
      label,
      score: candidate.scoreAtSubmission,
      rentToIncomeRatio: candidate.rentToIncomeRatio,
      guaranteeType: candidate.guaranteeType,
      source: candidate.source,
      tenantTrustScore: candidate.tenantProfile?.trustScore ?? null,
    };
  });

  const fallback = buildFallbackSummary(candidates);
  const raw = await generateGrokJsonOutput({
    system: candidatesSummaryPrompt(),
    user: JSON.stringify({
      property: {
        id: property.id,
        title: property.title,
      },
      candidates,
    }),
  });

  const validated = raw ? candidatesSummaryAiSchema.safeParse(parseJsonFromModelOutput(raw)) : null;
  const result = validated?.success ? validated.data : fallback;

  if (parsed.data.persist && result.topCandidateId) {
    await prisma.candidacy.updateMany({
      where: {
        propertyId: property.id,
      },
      data: {
        notes: `Resumen IA generado para la propiedad ${property.title}.`,
      },
    });
  }

  return NextResponse.json({
    ...result,
    propertyId: property.id,
  });
}
