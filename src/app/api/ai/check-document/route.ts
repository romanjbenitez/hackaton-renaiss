import { DocumentVerificationStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db/prisma";
import { documentFraudAiSchema } from "@/lib/ai/schemas";
import { generateGrokJsonOutput, parseJsonFromModelOutput } from "@/lib/ai/grok";
import { docFraudDetectionPrompt } from "@/lib/ai/prompts";
import { ensureCurrentTenantContext } from "@/lib/auth/actors";
import { getStoredDocumentDataUrl } from "@/lib/storage-server";

export const runtime = "nodejs";

const requestSchema = z.object({
  documentId: z.string().min(1).optional(),
  document: z.object({
    id: z.string().optional(),
    type: z.string().min(1),
    displayName: z.string().min(1),
    mimeType: z.string().min(1),
    base64Data: z.string().min(10).optional(),
  }).optional(),
  persist: z.boolean().optional().default(true),
});

function buildFallback(document: {
  type: string;
  displayName: string;
  mimeType: string;
  base64Data?: string | null;
}) {
  const hasBase64 = Boolean(document.base64Data);
  const suspicious = !hasBase64 || document.displayName.length < 4;

  return documentFraudAiSchema.parse({
    suspicious,
    confidence: suspicious ? 0.62 : 0.18,
    reason: suspicious
      ? "El documento tiene poca evidencia verificable o metadata insuficiente."
      : "No aparecen señales obvias de manipulación en la metadata recibida.",
  });
}

export async function POST(request: Request) {
  const tenantContext = await ensureCurrentTenantContext();

  if (!tenantContext?.tenantProfile) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Payload inválido" },
      { status: 400 }
    );
  }

  let documentPayload = parsed.data.document ?? null;

  if (!documentPayload && parsed.data.documentId) {
    const document = await prisma.document.findUnique({
      where: { id: parsed.data.documentId },
      select: {
        id: true,
        type: true,
        displayName: true,
        mimeType: true,
        storageKey: true,
        url: true,
        base64Data: true,
        tenantProfileId: true,
      },
    });

    if (!document || document.tenantProfileId !== tenantContext.tenantProfile.id) {
      return NextResponse.json({ error: "No se encontró el documento" }, { status: 404 });
    }

    documentPayload = {
      id: document.id,
      type: document.type,
      displayName: document.displayName,
      mimeType: document.mimeType,
      base64Data:
        (await getStoredDocumentDataUrl({
          url: document.url,
          storageKey: document.storageKey,
          mimeType: document.mimeType,
          base64Data: document.base64Data,
        })) ?? undefined,
    };
  }

  if (!documentPayload) {
    return NextResponse.json({ error: "Falta document o documentId" }, { status: 400 });
  }

  const fallback = buildFallback(documentPayload);
  const raw = await generateGrokJsonOutput({
    system: docFraudDetectionPrompt(),
    user: JSON.stringify(documentPayload),
  });

  const validated = raw ? documentFraudAiSchema.safeParse(parseJsonFromModelOutput(raw)) : null;
  const result = validated?.success ? validated.data : fallback;
  const shouldFlagForReview = result.suspicious && result.confidence > 0.7;

  if (parsed.data.persist && parsed.data.documentId) {
    await prisma.document.update({
      where: {
        id: parsed.data.documentId,
      },
      data: {
        suspicious: result.suspicious,
        suspiciousScore: result.confidence,
        suspiciousReason: result.reason,
        verificationStatus: shouldFlagForReview
          ? DocumentVerificationStatus.FLAGGED
          : DocumentVerificationStatus.PENDING,
      },
    });
  }

  return NextResponse.json({
    ...result,
    flaggedForReview: shouldFlagForReview,
    documentId: parsed.data.documentId ?? documentPayload.id ?? null,
  });
}
