"use client";

import { useMemo, useState } from "react";

import {
  DocumentUploader,
  type UploadedDocumentInput,
} from "@/components/tenant/document-uploader";
import { TrustScoreBadge } from "@/components/tenant/trust-score-badge";
import { AlertBanner } from "@/components/ui/alert-banner";
import { StatCard } from "@/components/ui/stat-card";
import { StatusPill } from "@/components/ui/status-pill";
import { deriveTrustScoreFallback } from "@/lib/ai/fallback";
import {
  getGuaranteeDocumentType,
  getGuaranteeLabel,
  getRequiredDocuments,
} from "@/lib/catalogs/tenant-documents";
import {
  mapDocumentsToAiSummary,
  type GuaranteeType,
  type ProfileType,
  type StoredTenantDocument,
} from "@/lib/tenant/documents";
import { inputClassName, type SemanticTone } from "@/lib/ui";

type DocumentsManagerProps = {
  profileType: ProfileType;
  initialGuaranteeType: GuaranteeType;
  monthlyIncome?: number;
  tenantProfileId?: string | null;
  initialTrustScore?: number | null;
  initialTrustExplanation?: string | null;
  initialTrustImprovementSuggestion?: string | null;
  initialDocuments: StoredTenantDocument[];
};

type DocumentUploadResult = {
  document: StoredTenantDocument;
  tenantProfileId?: string;
};

type DocumentFraudResult = {
  suspicious: boolean;
  confidence: number;
  reason: string;
  flaggedForReview: boolean;
};

type TrustScoreRefreshResult = {
  score: number;
  explanation: string;
  improvementSuggestion: string;
};

function upsertDocumentByType(documents: StoredTenantDocument[], nextDocument: StoredTenantDocument) {
  return [nextDocument, ...documents.filter((document) => document.documentType !== nextDocument.documentType)];
}

function getLatestDocumentByType(documents: StoredTenantDocument[], documentType: string) {
  return documents.find((document) => document.documentType === documentType) ?? null;
}

function getVerificationTone(status: StoredTenantDocument["rawVerificationStatus"]): SemanticTone {
  switch (status) {
    case "REJECTED":
      return "danger";
    case "VERIFIED":
      return "success";
    case "FLAGGED":
      return "warning";
    default:
      return "neutral";
  }
}

async function uploadTenantDocument(
  documentType: string,
  label: string,
  input: UploadedDocumentInput
) {
  const formData = new FormData();
  formData.set("documentType", documentType);
  formData.set("label", label);
  formData.set("file", input.file, input.fileName);

  const response = await fetch("/api/tenant/documents", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as DocumentUploadResult;
}

async function checkUploadedDocument(documentId: string) {
  const response = await fetch("/api/ai/check-document", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      documentId,
      persist: true,
    }),
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as DocumentFraudResult;
}

async function refreshTrustScore(tenantProfileId: string) {
  const response = await fetch("/api/ai/trust-score", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tenantProfileId,
      persist: true,
    }),
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as TrustScoreRefreshResult;
}

export function DocumentsManager({
  profileType,
  initialGuaranteeType,
  monthlyIncome,
  tenantProfileId,
  initialTrustScore,
  initialTrustExplanation,
  initialTrustImprovementSuggestion,
  initialDocuments,
}: DocumentsManagerProps) {
  const [documents, setDocuments] = useState<StoredTenantDocument[]>(initialDocuments);
  const [guaranteeType, setGuaranteeType] = useState<GuaranteeType>(initialGuaranteeType);
  const [persistedTrustScore, setPersistedTrustScore] = useState<number | null>(initialTrustScore ?? null);
  const [persistedTrustExplanation, setPersistedTrustExplanation] = useState<string | null>(
    initialTrustExplanation ?? null
  );
  const [persistedTrustImprovementSuggestion, setPersistedTrustImprovementSuggestion] = useState<string | null>(
    initialTrustImprovementSuggestion ?? null
  );

  const trustScoreFallback = useMemo(
    () =>
      deriveTrustScoreFallback({
        tenantProfile: {
          profileType,
          monthlyIncome,
          guaranteeType,
        },
        documents: mapDocumentsToAiSummary(documents),
      }),
    [documents, guaranteeType, monthlyIncome, profileType]
  );
  const visibleTrustScore = persistedTrustScore ?? trustScoreFallback.score;
  const visibleTrustExplanation = persistedTrustExplanation ?? trustScoreFallback.explanation;
  const visibleTrustImprovementSuggestion =
    persistedTrustImprovementSuggestion ?? trustScoreFallback.improvementSuggestion;
  const requiredDocuments = useMemo(() => getRequiredDocuments(profileType), [profileType]);
  const guaranteeDocumentType = getGuaranteeDocumentType(guaranteeType);
  const guaranteeLabel = getGuaranteeLabel(guaranteeType);

  async function handleUpload(documentType: string, label: string, input: UploadedDocumentInput) {
    const uploadResult = await uploadTenantDocument(documentType, label, input);

    if (!uploadResult) {
      return;
    }

    const nextDocument = {
      ...uploadResult.document,
      sizeLabel:
        uploadResult.document.sizeLabel === "Sin tamaño"
          ? input.sizeLabel
          : uploadResult.document.sizeLabel,
    };

    setDocuments((currentDocuments) => upsertDocumentByType(currentDocuments, nextDocument));

    try {
      const fraudResult = await checkUploadedDocument(nextDocument.id);

      if (fraudResult) {
        setDocuments((currentDocuments) =>
          currentDocuments.map((document) =>
            document.id !== nextDocument.id
              ? document
              : {
                  ...document,
                  verificationStatus: fraudResult.flaggedForReview
                    ? "Pendiente de revisión"
                    : document.verificationStatus,
                  rawVerificationStatus: fraudResult.flaggedForReview ? "FLAGGED" : document.rawVerificationStatus,
                  suspicious: fraudResult.suspicious,
                  suspiciousReason: fraudResult.reason,
                  suspiciousConfidence: fraudResult.confidence,
                  feedbackMessage: fraudResult.flaggedForReview
                    ? `Pendiente de revisión manual. ${fraudResult.reason}`
                    : "Documento recibido y listo para validación automática.",
                }
          )
        );
      }
    } catch {
      // Non-blocking: the document remains uploaded even if the AI check fails.
    }

    const effectiveTenantProfileId = uploadResult.tenantProfileId ?? tenantProfileId;

    if (!effectiveTenantProfileId) {
      return;
    }

    try {
      const trustResult = await refreshTrustScore(effectiveTenantProfileId);

      if (!trustResult) {
        return;
      }

      setPersistedTrustScore(trustResult.score);
      setPersistedTrustExplanation(trustResult.explanation);
      setPersistedTrustImprovementSuggestion(trustResult.improvementSuggestion);
    } catch {
      // Non-blocking: trust score refresh failure should not block document management.
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      <section className="bg-background space-y-6 rounded-4xl border p-8 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm tracking-[0.22em] text-emerald-700 uppercase">Documentación</p>
            <h1 className="mt-3 text-4xl font-semibold">Cargá tu legajo base</h1>
          </div>
          <TrustScoreBadge score={visibleTrustScore} />
        </div>

        <div className="bg-muted/40 rounded-3xl border p-5">
          <p className="text-sm font-medium">Perfil detectado: {profileType}</p>
          <p className="text-muted-foreground mt-2 text-sm">
            Este flujo ajusta automáticamente qué documentos son obligatorios para tu caso.
          </p>
        </div>

        <div className="space-y-4">
          {requiredDocuments.map((document) => {
            const currentDocument = getLatestDocumentByType(documents, document.documentType);

            return (
              <DocumentUploader
                key={document.documentType}
                label={document.label}
                helperText={document.helperText}
                accept={document.accept}
                currentFileName={currentDocument?.fileName ?? null}
                currentStatus={currentDocument?.verificationStatus ?? null}
                onUpload={(input) => handleUpload(document.documentType, document.label, input)}
              />
            );
          })}
        </div>

        <div className="bg-muted/30 rounded-3xl border p-5">
          <p className="text-sm font-medium">Resultado automático del score</p>
          <p className="text-muted-foreground mt-2 text-sm leading-7">
            Cada documento cargado refresca la lectura de confianza y prioriza el score persistido
            cuando ya fue recalculado por IA.
          </p>

          <AlertBanner tone="success" className="mt-4">
            {visibleTrustExplanation}
          </AlertBanner>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <StatCard
              label="Cobertura documental"
              value={`${trustScoreFallback.dimensions.docCompleteness}/100`}
            />
            <StatCard
              label="Consistencia de ingresos"
              value={`${trustScoreFallback.dimensions.incomeConsistency}/100`}
            />
            <StatCard
              label="Garantía"
              value={`${trustScoreFallback.dimensions.guaranteeType}/100`}
            />
            <StatCard
              label="Historial de plataforma"
              value={`${trustScoreFallback.dimensions.platformHistory}/100`}
            />
          </div>

          <p className="mt-5 text-sm leading-7">{visibleTrustImprovementSuggestion}</p>
        </div>

        <div className="bg-muted/30 rounded-3xl border p-5">
          <div className="space-y-2">
            <p className="text-sm font-medium">Garantía para la postulación</p>
            <p className="text-muted-foreground text-sm">
              Definí si vas a presentar garantía hipotecaria o seguro de caución y adjuntá el respaldo.
            </p>
          </div>

          <select
            className={`${inputClassName} mt-4`}
            value={guaranteeType}
            onChange={(event) => setGuaranteeType(event.target.value as GuaranteeType)}
          >
            <option value="NONE">Seleccionar más adelante</option>
            <option value="MORTGAGE">Garantía hipotecaria</option>
            <option value="CAUTION_INSURANCE">Seguro de caución</option>
          </select>

          {guaranteeDocumentType ? (
            <div className="mt-4">
              <DocumentUploader
                label={guaranteeLabel}
                helperText="Subí el documento principal asociado a la garantía elegida."
                accept=".pdf,image/*"
                currentFileName={getLatestDocumentByType(documents, guaranteeDocumentType)?.fileName ?? null}
                currentStatus={
                  getLatestDocumentByType(documents, guaranteeDocumentType)?.verificationStatus ?? null
                }
                onUpload={(input) => handleUpload(guaranteeDocumentType, guaranteeLabel, input)}
              />
            </div>
          ) : null}
        </div>
      </section>

      <aside className="bg-background rounded-4xl border p-8 shadow-sm">
        <p className="text-sm tracking-[0.22em] text-emerald-700 uppercase">Cargados</p>
        <h2 className="mt-3 text-2xl font-semibold">Listado con estado</h2>

        <ul className="mt-6 space-y-3">
          {documents.length === 0 ? (
            <li className="text-muted-foreground rounded-3xl border border-dashed p-5 text-sm">
              Todavía no cargaste documentos. El legajo queda persistido sobre tu perfil.
            </li>
          ) : (
            documents.map((document) => (
              <li key={document.id} className="rounded-3xl border p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium">{document.label}</p>
                    <p className="text-muted-foreground mt-1 text-sm">{document.fileName}</p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      {document.sizeLabel} · {new Date(document.uploadedAt).toLocaleString("es-AR")}
                    </p>
                    {document.feedbackMessage ? (
                      <p className="mt-2 text-xs leading-5 text-slate-700">{document.feedbackMessage}</p>
                    ) : null}
                  </div>
                  <StatusPill tone={getVerificationTone(document.rawVerificationStatus)}>
                    {document.verificationStatus}
                  </StatusPill>
                </div>
              </li>
            ))
          )}
        </ul>
      </aside>
    </div>
  );
}
