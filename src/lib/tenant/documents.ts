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

function estimateSizeLabel(base64Data?: string | null) {
  if (!base64Data) {
    return "Sin tamaño";
  }

  const [, rawBase64 = base64Data] = base64Data.split(",");
  const padding = rawBase64.endsWith("==") ? 2 : rawBase64.endsWith("=") ? 1 : 0;
  const bytes = Math.max(0, Math.floor((rawBase64.length * 3) / 4) - padding);

  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function mapTenantDocumentFromDatabase(document: {
  id: string;
  type: DocumentType;
  displayName: string;
  fileName: string;
  mimeType: string;
  storageKey: string | null;
  uploadedAt: Date;
  verificationStatus: DocumentVerificationStatus;
  suspicious: boolean;
  suspiciousReason: string | null;
  suspiciousScore: number | null;
  base64Data?: string | null;
}) {
  return {
    id: document.id,
    documentType: document.type,
    label: document.displayName || getDocumentTypeLabel(document.type),
    fileName: document.fileName,
    mimeType: document.mimeType,
    sizeLabel: estimateSizeLabel(document.base64Data),
    storageKey: document.storageKey ?? "",
    uploadedAt: document.uploadedAt.toISOString(),
    verificationStatus: getDocumentVerificationStatusLabel(document.verificationStatus),
    rawVerificationStatus: document.verificationStatus,
    previewUrl: resolveStoredDocumentPreviewUrl({
      url: null,
      mimeType: document.mimeType,
      base64: document.base64Data,
    }),
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
