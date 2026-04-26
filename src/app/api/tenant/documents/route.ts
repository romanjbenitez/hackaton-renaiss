import { DocumentType } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { ensureCurrentTenantContext } from "@/lib/auth/actors";
import { prisma } from "@/lib/db/prisma";
import { uploadDocumentToStorage } from "@/lib/storage-server";
import { mapTenantDocumentFromDatabase } from "@/lib/tenant/documents";

export const runtime = "nodejs";

const requestSchema = z.object({
  documentType: z.nativeEnum(DocumentType),
  label: z.string().min(1),
});

export async function POST(request: Request) {
  const formData = await request.formData().catch(() => null);

  if (!formData) {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  const parsed = requestSchema.safeParse({
    documentType: formData.get("documentType"),
    label: formData.get("label"),
  });
  const file = formData.get("file");

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Payload inválido" },
      { status: 400 }
    );
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Falta el archivo a subir." }, { status: 400 });
  }

  const tenantContext = await ensureCurrentTenantContext();

  if (!tenantContext?.tenantProfile) {
    return NextResponse.json(
      { error: "Completá tu perfil antes de subir documentación." },
      { status: 400 }
    );
  }

  const mimeType = file.type || "application/octet-stream";
  const uploadedAt = new Date();

  let storedDocument;

  try {
    storedDocument = await uploadDocumentToStorage({
      documentType: parsed.data.documentType,
      fileName: file.name,
      mimeType,
      fileBuffer: await file.arrayBuffer(),
      scope: `tenant-${tenantContext.tenantProfile.id}`,
      uploadedAt,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo subir el documento a Supabase Storage.",
      },
      { status: 500 }
    );
  }

  const document = await prisma.document.create({
    data: {
      tenantProfileId: tenantContext.tenantProfile.id,
      uploadedByUserId: tenantContext.user.id,
      type: parsed.data.documentType,
      displayName: parsed.data.label,
      fileName: file.name,
      mimeType,
      storageKey: storedDocument.storageKey,
      url: null,
      base64Data: null,
      uploadedAt,
    },
    select: {
      id: true,
      type: true,
      displayName: true,
      fileName: true,
      mimeType: true,
      storageKey: true,
      url: true,
      uploadedAt: true,
      verificationStatus: true,
      suspicious: true,
      suspiciousReason: true,
      suspiciousScore: true,
      base64Data: true,
    },
  });

  return NextResponse.json({
    document: mapTenantDocumentFromDatabase(document, storedDocument.signedUrl),
    tenantProfileId: tenantContext.tenantProfile.id,
  });
}
