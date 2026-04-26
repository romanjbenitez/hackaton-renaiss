"use client";

import { useMemo, useState } from "react";

import {
  DocumentUploader,
  type UploadedDocumentInput,
} from "@/components/tenant/document-uploader";
import { TrustScoreBadge } from "@/components/tenant/trust-score-badge";
import { deriveTrustScoreFallback } from "@/lib/ai/fallback";
import {
  mapDocumentsToAiSummary,
  type GuaranteeType,
  type ProfileType,
  type StoredTenantDocument,
} from "@/lib/tenant/documents";

type RequiredDocument = {
  documentType: string;
  label: string;
  helperText: string;
  accept?: string;
};

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

function getRequiredDocuments(profileType: ProfileType): RequiredDocument[] {
  switch (profileType) {
    case "EMPLOYED":
      return [
        {
          documentType: "DNI",
          label: "DNI",
          helperText: "Frente o imagen legible del documento.",
          accept: "image/*,.pdf",
        },
        {
          documentType: "PAYSLIP",
          label: "Últimos 3 recibos de sueldo",
          helperText: "Subí un PDF o imagen con los tres recibos consolidados.",
          accept: "image/*,.pdf",
        },
      ];
    case "MONOTRIBUTISTA":
      return [
        {
          documentType: "DNI",
          label: "DNI",
          helperText: "Frente o imagen legible del documento.",
          accept: "image/*,.pdf",
        },
        {
          documentType: "MONOTRIBUTO_CERTIFICATE",
          label: "Constancia de monotributo",
          helperText: "Comprobante de inscripción vigente.",
          accept: ".pdf,image/*",
        },
        {
          documentType: "MONOTRIBUTO_PAYMENT",
          label: "Últimos 3 pagos",
          helperText: "Podés consolidarlos en un solo PDF.",
          accept: ".pdf,image/*",
        },
      ];
    case "SELF_EMPLOYED":
      return [
        {
          documentType: "DNI",
          label: "DNI",
          helperText: "Frente o imagen legible del documento.",
          accept: "image/*,.pdf",
        },
        {
          documentType: "INCOME_AFFIDAVIT",
          label: "Declaración jurada de ingresos",
          helperText: "Comprobante emitido por contador o declaración equivalente.",
          accept: ".pdf,image/*",
        },
      ];
    case "RETIRED":
      return [
        {
          documentType: "DNI",
          label: "DNI",
          helperText: "Frente o imagen legible del documento.",
          accept: "image/*,.pdf",
        },
        {
          documentType: "RETIREMENT_RECEIPT",
          label: "Último recibo de jubilación",
          helperText: "Comprobante mensual más reciente.",
          accept: ".pdf,image/*",
        },
      ];
  }
}

function getGuaranteeDocumentType(guaranteeType: GuaranteeType) {
  if (guaranteeType === "MORTGAGE") return "MORTGAGE_GUARANTEE";
  if (guaranteeType === "CAUTION_INSURANCE") return "CAUTION_INSURANCE";
  return null;
}

function getGuaranteeLabel(guaranteeType: GuaranteeType) {
  if (guaranteeType === "MORTGAGE") return "Garantía hipotecaria";
  if (guaranteeType === "CAUTION_INSURANCE") return "Seguro de caución";
  return "Sin garantía definida";
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
  const [persistedTrustScore, setPersistedTrustScore] = useState<number | null>(
    initialTrustScore ?? null
  );
  const [persistedTrustExplanation, setPersistedTrustExplanation] = useState<string | null>(
    initialTrustExplanation ?? null
  );
  const [persistedTrustImprovementSuggestion, setPersistedTrustImprovementSuggestion] = useState<
    string | null
  >(initialTrustImprovementSuggestion ?? null);

  const trustScoreFallback = useMemo(() => {
    return deriveTrustScoreFallback({
      tenantProfile: {
        profileType,
        monthlyIncome,
        guaranteeType,
      },
      documents: mapDocumentsToAiSummary(documents),
    });
  }, [documents, guaranteeType, monthlyIncome, profileType]);
  const visibleTrustScore = persistedTrustScore ?? trustScoreFallback.score;
  const visibleTrustExplanation = persistedTrustExplanation ?? trustScoreFallback.explanation;
  const visibleTrustImprovementSuggestion =
    persistedTrustImprovementSuggestion ?? trustScoreFallback.improvementSuggestion;

  const requiredDocuments = useMemo(() => getRequiredDocuments(profileType), [profileType]);

  function getLatestDocumentByType(documentType: string) {
    return (
      documents.find((document) => document.documentType === documentType) ??
      null
    );
  }

  async function handleUpload(documentType: string, label: string, input: UploadedDocumentInput) {
    const formData = new FormData();
    formData.set("documentType", documentType);
    formData.set("label", label);
    formData.set("file", input.file, input.fileName);

    const uploadResponse = await fetch("/api/tenant/documents", {
      method: "POST",
      body: formData,
    });

    if (!uploadResponse.ok) {
      return;
    }

    const uploadResult = (await uploadResponse.json()) as {
      document: StoredTenantDocument;
      tenantProfileId?: string;
    };

    const newDoc = {
      ...uploadResult.document,
      sizeLabel: uploadResult.document.sizeLabel === "Sin tamaño" ? input.sizeLabel : uploadResult.document.sizeLabel,
    };
    setDocuments((currentDocuments) => [
      newDoc,
      ...currentDocuments.filter((document) => document.documentType !== newDoc.documentType),
    ]);

    try {
      const response = await fetch("/api/ai/check-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId: newDoc.id,
          persist: true,
        }),
      });

      if (response.ok) {
        const result = (await response.json()) as {
          suspicious: boolean;
          confidence: number;
          reason: string;
          flaggedForReview: boolean;
        };

        setDocuments((currentDocuments) =>
          currentDocuments.map((document) =>
            document.id === newDoc.id
              ? {
                  ...document,
                  verificationStatus: result.flaggedForReview
                    ? "Pendiente de revisión"
                    : document.verificationStatus,
                  rawVerificationStatus: result.flaggedForReview
                    ? "FLAGGED"
                    : document.rawVerificationStatus,
                  suspicious: result.suspicious,
                  suspiciousReason: result.reason,
                  suspiciousConfidence: result.confidence,
                  feedbackMessage: result.flaggedForReview
                    ? `Pendiente de revisión manual. ${result.reason}`
                    : "Documento recibido y listo para validación automática.",
                }
              : document
          )
        );
      }
    } catch {
      // non-blocking: fraud check failure doesn't block upload
    }

    const effectiveTenantProfileId = uploadResult.tenantProfileId ?? tenantProfileId;

    if (effectiveTenantProfileId) {
      void fetch("/api/ai/trust-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantProfileId: effectiveTenantProfileId,
          persist: true,
        }),
      })
        .then(async (response) => {
          if (!response.ok) {
            return null;
          }

          return (await response.json()) as {
            score: number;
            explanation: string;
            improvementSuggestion: string;
          };
        })
        .then((result) => {
          if (!result) {
            return;
          }

          setPersistedTrustScore(result.score);
          setPersistedTrustExplanation(result.explanation);
          setPersistedTrustImprovementSuggestion(result.improvementSuggestion);
        })
        .catch(() => {
          // non-blocking: trust score refresh failure shouldn't block uploads
        });
    }
  }

  const guaranteeDocumentType = getGuaranteeDocumentType(guaranteeType);

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
          {requiredDocuments.map((document) => (
            (() => {
              const currentDocument = getLatestDocumentByType(document.documentType);

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
            })()
          ))}
        </div>

        <div className="bg-muted/30 rounded-3xl border p-5">
          <p className="text-sm font-medium">Resultado automático del score</p>
          <p className="text-muted-foreground mt-2 text-sm leading-7">
            Cada documento cargado refresca la lectura de confianza y prioriza el score
            persistido cuando ya fue recalculado por IA.
          </p>
          <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
            {visibleTrustExplanation}
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border p-4">
              <p className="text-muted-foreground text-sm">Cobertura documental</p>
              <p className="mt-2 text-xl font-semibold">
                {trustScoreFallback.dimensions.docCompleteness}/100
              </p>
            </div>
            <div className="rounded-2xl border p-4">
              <p className="text-muted-foreground text-sm">Consistencia de ingresos</p>
              <p className="mt-2 text-xl font-semibold">
                {trustScoreFallback.dimensions.incomeConsistency}/100
              </p>
            </div>
            <div className="rounded-2xl border p-4">
              <p className="text-muted-foreground text-sm">Garantía</p>
              <p className="mt-2 text-xl font-semibold">
                {trustScoreFallback.dimensions.guaranteeType}/100
              </p>
            </div>
            <div className="rounded-2xl border p-4">
              <p className="text-muted-foreground text-sm">Historial de plataforma</p>
              <p className="mt-2 text-xl font-semibold">
                {trustScoreFallback.dimensions.platformHistory}/100
              </p>
            </div>
          </div>
          <p className="mt-5 text-sm leading-7">{visibleTrustImprovementSuggestion}</p>
        </div>

        <div className="bg-muted/30 rounded-3xl border p-5">
          <div className="space-y-2">
            <p className="text-sm font-medium">Garantía para la postulación</p>
            <p className="text-muted-foreground text-sm">
              Definí si vas a presentar garantía hipotecaria o seguro de caución y adjuntá el
              respaldo.
            </p>
          </div>

          <select
            className="mt-4 h-12 w-full rounded-2xl border px-4"
            value={guaranteeType}
            onChange={(event) => setGuaranteeType(event.target.value as GuaranteeType)}
          >
            <option value="NONE">Seleccionar más adelante</option>
            <option value="MORTGAGE">Garantía hipotecaria</option>
            <option value="CAUTION_INSURANCE">Seguro de caución</option>
          </select>

          {guaranteeDocumentType ? (
            <div className="mt-4">
              {(() => {
                const currentDocument = getLatestDocumentByType(guaranteeDocumentType);

                return (
              <DocumentUploader
                label={getGuaranteeLabel(guaranteeType)}
                helperText="Subí el documento principal asociado a la garantía elegida."
                accept=".pdf,image/*"
                currentFileName={currentDocument?.fileName ?? null}
                currentStatus={currentDocument?.verificationStatus ?? null}
                onUpload={(input) =>
                  handleUpload(guaranteeDocumentType, getGuaranteeLabel(guaranteeType), input)
                }
              />
                );
              })()}
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
                      <p className="mt-2 text-xs leading-5 text-slate-700">
                        {document.feedbackMessage}
                      </p>
                    ) : null}
                  </div>
                  <span
                    className={
                      document.rawVerificationStatus === "REJECTED"
                        ? "rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-medium text-rose-900"
                        : document.rawVerificationStatus === "VERIFIED"
                          ? "rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-900"
                          : document.rawVerificationStatus === "FLAGGED"
                            ? "rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-950"
                            : "rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-900"
                    }
                  >
                    {document.verificationStatus}
                  </span>
                </div>
              </li>
            ))
          )}
        </ul>
      </aside>
    </div>
  );
}
