import { DocumentType } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { ensureCurrentTenantContext } from "@/lib/auth/actors";
import { prisma } from "@/lib/db/prisma";
import { createStoredDocumentRecord } from "@/lib/storage";
import { mapTenantDocumentFromDatabase } from "@/lib/tenant/documents";

export const runtime = "nodejs";

const requestSchema = z.object({
  documentType: z.nativeEnum(DocumentType),
  label: z.string().min(1),
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  base64Data: z.string().min(10),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Payload inválido" },
      { status: 400 }
    );
  }

  const tenantContext = await ensureCurrentTenantContext();

  if (!tenantContext?.tenantProfile) {
    return NextResponse.json(
      { error: "Completá tu perfil antes de subir documentación." },
      { status: 400 }
    );
  }

  const storedDocument = createStoredDocumentRecord({
    documentType: parsed.data.documentType,
    fileName: parsed.data.fileName,
    mimeType: parsed.data.mimeType,
    base64: parsed.data.base64Data,
    scope: "tenant-documents",
  });

  const document = await prisma.document.create({
    data: {
      tenantProfileId: tenantContext.tenantProfile.id,
      uploadedByUserId: tenantContext.user.id,
      type: parsed.data.documentType,
      displayName: parsed.data.label,
      fileName: parsed.data.fileName,
      mimeType: parsed.data.mimeType,
      storageKey: storedDocument.storageKey,
      base64Data: parsed.data.base64Data,
    },
    select: {
      id: true,
      type: true,
      displayName: true,
      fileName: true,
      mimeType: true,
      storageKey: true,
      uploadedAt: true,
      verificationStatus: true,
      suspicious: true,
      suspiciousReason: true,
      suspiciousScore: true,
      base64Data: true,
    },
  });

  return NextResponse.json({
    document: mapTenantDocumentFromDatabase(document),
    tenantProfileId: tenantContext.tenantProfile.id,
  });
}
