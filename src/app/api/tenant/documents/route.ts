import { DocumentType } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { ensureCurrentTenantContext } from "@/lib/auth/actors";
import { prisma } from "@/lib/db/prisma";
import { deleteStoredDocumentsFromStorage, uploadDocumentToStorage } from "@/lib/storage-server";
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

  const tenantProfileId = tenantContext.tenantProfile.id;

  const mimeType = file.type || "application/octet-stream";
  const uploadedAt = new Date();
  const existingDocuments = await prisma.document.findMany({
    where: {
      tenantProfileId,
      type: parsed.data.documentType,
    },
    select: {
      id: true,
      storageKey: true,
    },
  });

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

  const document = await prisma.$transaction(async (tx) => {
    if (existingDocuments.length > 0) {
      await tx.document.deleteMany({
        where: {
          id: {
            in: existingDocuments.map((existingDocument) => existingDocument.id),
          },
        },
      });
    }

    return tx.document.create({
      data: {
        tenantProfileId,
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
  });

  try {
    await deleteStoredDocumentsFromStorage(existingDocuments.map((document) => document.storageKey));
  } catch {
    // The latest upload remains valid even if old storage cleanup fails.
  }

  return NextResponse.json({
    document: mapTenantDocumentFromDatabase(document, storedDocument.signedUrl),
    tenantProfileId,
  });
}
