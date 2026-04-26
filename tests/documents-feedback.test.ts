import assert from "node:assert/strict";
import test from "node:test";

import { DocumentType, DocumentVerificationStatus } from "@prisma/client";

import {
  getDocumentTenantFeedback,
  getDocumentVerificationStatusLabel,
} from "../src/lib/documents";
import { mapTenantDocumentFromDatabase } from "../src/lib/tenant/documents";

test("getDocumentTenantFeedback exposes admin review notes to the tenant", () => {
  const feedback = getDocumentTenantFeedback(
    DocumentVerificationStatus.REJECTED,
    "Nota de revisión: la imagen está cortada."
  );

  assert.equal(feedback, "Documento rechazado. Nota de revisión: la imagen está cortada.");
});

test("getDocumentTenantFeedback keeps pending documents neutral even with an AI reason", () => {
  const feedback = getDocumentTenantFeedback(
    DocumentVerificationStatus.PENDING,
    "El documento tiene poca evidencia verificable o metadata insuficiente."
  );

  assert.equal(
    feedback,
    "Pendiente de validación. El documento tiene poca evidencia verificable o metadata insuficiente."
  );
});

test("mapTenantDocumentFromDatabase keeps tenant-visible review feedback and raw status", () => {
  const mapped = mapTenantDocumentFromDatabase({
    id: "doc-1",
    type: DocumentType.DNI,
    displayName: "DNI frente",
    fileName: "dni-frente.pdf",
    mimeType: "application/pdf",
    storageKey: "documents/doc-1",
    uploadedAt: new Date("2026-04-25T12:00:00.000Z"),
    verificationStatus: DocumentVerificationStatus.FLAGGED,
    suspicious: true,
    suspiciousReason: "Pendiente por validación manual.",
    suspiciousScore: 0.82,
    base64Data: null,
  });

  assert.equal(mapped.verificationStatus, getDocumentVerificationStatusLabel(DocumentVerificationStatus.FLAGGED));
  assert.equal(mapped.rawVerificationStatus, DocumentVerificationStatus.FLAGGED);
  assert.equal(mapped.feedbackMessage, "Pendiente de revisión. Pendiente por validación manual.");
});
