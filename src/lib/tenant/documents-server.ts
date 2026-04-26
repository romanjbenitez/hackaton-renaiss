import "server-only";

import type { DocumentType, DocumentVerificationStatus } from "@prisma/client";

import { resolveStoredDocumentPreviewUrlFromStorage } from "@/lib/storage-server";
import { mapTenantDocumentFromDatabase } from "@/lib/tenant/documents";

type DocumentRecord = {
  id: string;
  type: DocumentType;
  displayName: string;
  fileName: string;
  mimeType: string;
  storageKey: string | null;
  url?: string | null;
  uploadedAt: Date;
  verificationStatus: DocumentVerificationStatus;
  suspicious: boolean;
  suspiciousReason: string | null;
  suspiciousScore: number | null;
  base64Data?: string | null;
};

export async function mapTenantDocumentFromDatabaseWithPreview(document: DocumentRecord) {
  const previewUrl = await resolveStoredDocumentPreviewUrlFromStorage({
    url: document.url ?? null,
    storageKey: document.storageKey ?? null,
    mimeType: document.mimeType,
    base64: document.base64Data,
  });

  return mapTenantDocumentFromDatabase(document, previewUrl);
}

export async function mapTenantDocumentsFromDatabaseWithPreview(documents: DocumentRecord[]) {
  return Promise.all(documents.map(mapTenantDocumentFromDatabaseWithPreview));
}
