export type StoredDocumentRecord = {
  storageKey: string;
  fileName: string;
  mimeType: string;
  base64: string;
  dataUrl: string;
  byteSize: number;
  uploadedAt: string;
};

export type CreateStoredDocumentRecordInput = {
  documentType: string;
  fileName: string;
  mimeType: string;
  base64: string;
  scope?: string;
  uploadedAt?: Date;
};

function normalizeFileName(fileName: string) {
  return fileName
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "");
}

function normalizeSegment(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_-]/g, "");
}

export function stripDataUrlPrefix(base64OrDataUrl: string) {
  const [, rawBase64 = base64OrDataUrl] = base64OrDataUrl.split(",");

  return rawBase64.trim();
}

export function createDataUrl(mimeType: string, base64: string) {
  return `data:${mimeType};base64,${stripDataUrlPrefix(base64)}`;
}

export function resolveStoredDocumentPreviewUrl(input: {
  url?: string | null;
  mimeType: string;
  base64?: string | null;
}) {
  if (input.url) {
    return input.url;
  }

  if (input.base64) {
    return createDataUrl(input.mimeType, input.base64);
  }

  return null;
}

export function estimateByteSizeFromBase64(base64OrDataUrl: string) {
  const normalizedBase64 = stripDataUrlPrefix(base64OrDataUrl);
  const padding = normalizedBase64.endsWith("==") ? 2 : normalizedBase64.endsWith("=") ? 1 : 0;

  return Math.max(0, Math.floor((normalizedBase64.length * 3) / 4) - padding);
}

export function createStorageKey(input: {
  documentType: string;
  fileName: string;
  scope?: string;
  uploadedAt?: Date;
}) {
  const uploadedAt = input.uploadedAt ?? new Date();
  const pathSegments = [
    "stored-documents",
    input.scope ? normalizeSegment(input.scope) : undefined,
    normalizeSegment(input.documentType),
    `${uploadedAt.getTime()}-${normalizeFileName(input.fileName)}`,
  ].filter(Boolean);

  return pathSegments.join("/");
}

export function createStoredDocumentRecord(
  input: CreateStoredDocumentRecordInput
): StoredDocumentRecord {
  const uploadedAt = input.uploadedAt ?? new Date();
  const normalizedBase64 = stripDataUrlPrefix(input.base64);

  return {
    storageKey: createStorageKey({
      documentType: input.documentType,
      fileName: input.fileName,
      scope: input.scope,
      uploadedAt,
    }),
    fileName: normalizeFileName(input.fileName),
    mimeType: input.mimeType,
    base64: normalizedBase64,
    dataUrl: createDataUrl(input.mimeType, normalizedBase64),
    byteSize: estimateByteSizeFromBase64(normalizedBase64),
    uploadedAt: uploadedAt.toISOString(),
  };
}
