import type {
  DocumentType,
  DocumentVerificationStatus,
  Prisma,
  TenantProfileType,
} from "@prisma/client";

import {
  getDocumentTypeLabel,
  getDocumentTenantFeedback,
  getDocumentVerificationStatusLabel,
} from "../documents";
import { resolveStoredDocumentPreviewUrl } from "../storage";
import { estimateByteSizeFromBase64 } from "../storage";

export type ProfileType = TenantProfileType;
export type GuaranteeType = "MORTGAGE" | "CAUTION_INSURANCE" | "NONE";

export type StoredTenantDocument = {
  id: string;
  documentType: DocumentType;
  label: string;
  fileName: string;
  mimeType: string;
  sizeLabel: string;
  storageKey: string;
  uploadedAt: string;
  verificationStatus: string;
  rawVerificationStatus: DocumentVerificationStatus;
  previewUrl: string | null;
  suspicious?: boolean;
  suspiciousReason?: string;
  suspiciousConfidence?: number;
  feedbackMessage?: string;
};

function estimateSizeLabel(byteSize?: number | null) {
  if (typeof byteSize !== "number") {
    return "Sin tamaño";
  }

  if (byteSize < 1024) return `${byteSize} B`;
  if (byteSize < 1024 * 1024) return `${(byteSize / 1024).toFixed(1)} KB`;
  return `${(byteSize / (1024 * 1024)).toFixed(1)} MB`;
}

export function mapTenantDocumentFromDatabase(document: {
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
}, previewUrl?: string | null) {
  const effectivePreviewUrl =
    previewUrl ??
    resolveStoredDocumentPreviewUrl({
      url: document.url ?? null,
      mimeType: document.mimeType,
      base64: document.base64Data,
    });
  const byteSize = document.base64Data ? estimateByteSizeFromBase64(document.base64Data) : null;

  return {
    id: document.id,
    documentType: document.type,
    label: document.displayName || getDocumentTypeLabel(document.type),
    fileName: document.fileName,
    mimeType: document.mimeType,
    sizeLabel: estimateSizeLabel(byteSize),
    storageKey: document.storageKey ?? "",
    uploadedAt: document.uploadedAt.toISOString(),
    verificationStatus: getDocumentVerificationStatusLabel(document.verificationStatus),
    rawVerificationStatus: document.verificationStatus,
    previewUrl: effectivePreviewUrl,
    suspicious: document.suspicious || undefined,
    suspiciousReason: document.suspiciousReason ?? undefined,
    suspiciousConfidence: document.suspiciousScore ?? undefined,
    feedbackMessage: getDocumentTenantFeedback(
      document.verificationStatus,
      document.suspiciousReason
    ),
  } satisfies StoredTenantDocument;
}

export function mapDocumentsToAiSummary(documents: StoredTenantDocument[]) {
  return documents.map((document) => ({
    id: document.id,
    type: document.documentType,
    displayName: document.label,
    verificationStatus: document.rawVerificationStatus,
    suspicious: document.suspicious,
    suspiciousScore: document.suspiciousConfidence,
  }));
}

export function toNumber(value: Prisma.Decimal | number | null | undefined) {
  if (value == null) return null;
  return Number(value);
}
