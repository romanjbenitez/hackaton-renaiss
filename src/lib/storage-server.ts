import "server-only";

import { createSupabaseAdminClient, isSupabaseAdminConfigured } from "@/lib/auth/supabase-admin";
import { createDataUrl, createStorageKey } from "@/lib/storage";

const DEFAULT_BUCKET = "tenant-documents";
const PHOTOS_BUCKET = "property-photos";

declare global {
  var __proptechSupabaseBucketReady: Promise<void> | undefined;
}

function getStorageBucketName() {
  return process.env.SUPABASE_STORAGE_BUCKET?.trim() || DEFAULT_BUCKET;
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  return Buffer.from(buffer).toString("base64");
}

async function ensureBucketExists() {
  if (!isSupabaseAdminConfigured()) {
    throw new Error("Falta configurar Supabase admin para Storage.");
  }

  if (!globalThis.__proptechSupabaseBucketReady) {
    globalThis.__proptechSupabaseBucketReady = (async () => {
      const supabase = createSupabaseAdminClient();

      if (!supabase) {
        throw new Error("No se pudo inicializar Supabase admin.");
      }

      const bucketName = getStorageBucketName();
      const { data, error } = await supabase.storage.getBucket(bucketName);

      if (!error && data) {
        return;
      }

      const createResult = await supabase.storage.createBucket(bucketName, {
        public: false,
        fileSizeLimit: 10 * 1024 * 1024,
      });

      if (createResult.error && !createResult.error.message.toLowerCase().includes("already exists")) {
        throw new Error(createResult.error.message);
      }
    })();
  }

  return globalThis.__proptechSupabaseBucketReady;
}

export async function uploadDocumentToStorage(input: {
  documentType: string;
  fileName: string;
  mimeType: string;
  fileBuffer: ArrayBuffer;
  scope?: string;
  uploadedAt?: Date;
}) {
  await ensureBucketExists();

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    throw new Error("No se pudo inicializar Supabase admin.");
  }

  const uploadedAt = input.uploadedAt ?? new Date();
  const storageKey = createStorageKey({
    documentType: input.documentType,
    fileName: input.fileName,
    scope: input.scope,
    uploadedAt,
  });

  const { error } = await supabase.storage.from(getStorageBucketName()).upload(storageKey, input.fileBuffer, {
    contentType: input.mimeType,
    upsert: true,
  });

  if (error) {
    throw new Error(error.message);
  }

  const { data: signedUrlData, error: signedUrlError } = await supabase.storage
    .from(getStorageBucketName())
    .createSignedUrl(storageKey, 60 * 60);

  if (signedUrlError) {
    throw new Error(signedUrlError.message);
  }

  return {
    storageKey,
    signedUrl: signedUrlData.signedUrl,
    uploadedAt,
  };
}

export async function deleteStoredDocumentsFromStorage(storageKeys: Array<string | null | undefined>) {
  const keysToDelete = storageKeys.filter(
    (storageKey): storageKey is string => typeof storageKey === "string" && storageKey.trim().length > 0
  );

  if (keysToDelete.length === 0 || !isSupabaseAdminConfigured()) {
    return;
  }

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return;
  }

  const { error } = await supabase.storage.from(getStorageBucketName()).remove(keysToDelete);

  if (error) {
    throw new Error(error.message);
  }
}

export async function uploadPropertyPhotoToStorage(file: File): Promise<string> {
  if (!isSupabaseAdminConfigured()) {
    throw new Error("Falta configurar Supabase admin para Storage.");
  }

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    throw new Error("No se pudo inicializar Supabase admin.");
  }

  const { error: bucketError } = await supabase.storage.getBucket(PHOTOS_BUCKET);

  if (bucketError) {
    await supabase.storage.createBucket(PHOTOS_BUCKET, {
      public: true,
      fileSizeLimit: 10 * 1024 * 1024,
    });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const key = `photos/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage
    .from(PHOTOS_BUCKET)
    .upload(key, await file.arrayBuffer(), {
      contentType: file.type || "image/jpeg",
      upsert: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabase.storage.from(PHOTOS_BUCKET).getPublicUrl(key);

  return data.publicUrl;
}

export async function resolveStoredDocumentPreviewUrlFromStorage(input: {
  url?: string | null;
  storageKey?: string | null;
  mimeType: string;
  base64?: string | null;
}) {
  if (input.url) {
    return input.url;
  }

  if (input.base64) {
    return createDataUrl(input.mimeType, input.base64);
  }

  if (!input.storageKey || !isSupabaseAdminConfigured()) {
    return null;
  }

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.storage
    .from(getStorageBucketName())
    .createSignedUrl(input.storageKey, 60 * 60);

  if (error) {
    return null;
  }

  return data.signedUrl;
}

export async function getStoredDocumentDataUrl(input: {
  url?: string | null;
  storageKey?: string | null;
  mimeType: string;
  base64Data?: string | null;
}) {
  if (input.base64Data) {
    return createDataUrl(input.mimeType, input.base64Data);
  }

  if (!input.storageKey || !isSupabaseAdminConfigured()) {
    return null;
  }

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.storage.from(getStorageBucketName()).download(input.storageKey);

  if (error || !data) {
    return null;
  }

  const base64 = arrayBufferToBase64(await data.arrayBuffer());

  return createDataUrl(input.mimeType, base64);
}
