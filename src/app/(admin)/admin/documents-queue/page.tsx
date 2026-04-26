import { DocumentVerificationStatus } from "@prisma/client";

import { reviewFlaggedDocumentAction } from "@/app/(admin)/admin/documents-queue/actions";
import {
  getDocumentTypeLabel,
  getDocumentVerificationStatusLabel,
  getDocumentVerificationStatusTone,
} from "@/lib/documents";
import { resolveStoredDocumentPreviewUrl } from "@/lib/storage";
import { prisma } from "@/lib/db/prisma";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AdminDocumentsQueuePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getSearchValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminDocumentsQueuePage({
  searchParams,
}: AdminDocumentsQueuePageProps) {
  const params = await searchParams;
  const message = getSearchValue(params.message);
  const error = getSearchValue(params.error);

  const documents = await prisma.document.findMany({
    where: {
      verificationStatus: DocumentVerificationStatus.FLAGGED,
    },
    orderBy: [{ suspiciousScore: "desc" }, { uploadedAt: "desc" }],
    select: {
      id: true,
      type: true,
      displayName: true,
      fileName: true,
      mimeType: true,
      url: true,
      base64Data: true,
      suspiciousReason: true,
      suspiciousScore: true,
      verificationStatus: true,
      uploadedAt: true,
      tenantProfile: {
        select: {
          dni: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      },
    },
  });

  const statusClasses = {
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    rose: "border-rose-200 bg-rose-50 text-rose-700",
    slate: "border-slate-200 bg-slate-100 text-slate-700",
  };

  return (
    <main className="space-y-6">
      <section className="bg-background rounded-4xl border p-8 shadow-sm">
        <p className="text-sm tracking-[0.22em] text-rose-700 uppercase">Revisión manual</p>
        <h2 className="mt-4 text-3xl font-semibold">Cola de documentos flaggeados</h2>
        <p className="text-muted-foreground mt-4 leading-8">
          Cuando la IA detecta una anomalía con confianza alta, el documento queda retenido acá
          para una decisión humana antes de seguir el flujo operativo.
        </p>
      </section>

      {message ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {documents.length === 0 ? (
        <section className="bg-background rounded-4xl border p-8 shadow-sm">
          <p className="text-sm tracking-[0.22em] text-emerald-700 uppercase">Sin pendientes</p>
          <h3 className="mt-3 text-2xl font-semibold">No hay documentos esperando revisión.</h3>
          <p className="text-muted-foreground mt-3 leading-8">
            Los próximos documentos sospechosos van a aparecer automáticamente en esta cola.
          </p>
        </section>
      ) : (
        <section className="grid gap-4">
          {documents.map((document) => {
            const tone = getDocumentVerificationStatusTone(document.verificationStatus);
            const tenantName =
              `${document.tenantProfile.user.firstName} ${document.tenantProfile.user.lastName}`.trim();
            const previewUrl = resolveStoredDocumentPreviewUrl({
              url: document.url,
              mimeType: document.mimeType,
              base64: document.base64Data,
            });

            return (
              <article key={document.id} className="bg-background rounded-4xl border p-6 shadow-sm">
                <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-2xl font-semibold">{document.displayName}</h3>
                      <span
                        className={cn(
                          "inline-flex rounded-full border px-3 py-1 text-xs font-semibold",
                          statusClasses[tone]
                        )}
                      >
                        {getDocumentVerificationStatusLabel(document.verificationStatus)}
                      </span>
                      <span className="text-muted-foreground text-sm">
                        {getDocumentTypeLabel(document.type)}
                      </span>
                    </div>

                    <div className="text-muted-foreground grid gap-1 text-sm">
                      <p>Inquilino: {tenantName}</p>
                      <p>Email: {document.tenantProfile.user.email}</p>
                      <p>DNI: {document.tenantProfile.dni}</p>
                      <p>Archivo: {document.fileName}</p>
                      <p>Subido: {new Intl.DateTimeFormat("es-AR", { dateStyle: "medium", timeStyle: "short" }).format(document.uploadedAt)}</p>
                      <p>
                        Confianza del flag:{" "}
                        {document.suspiciousScore !== null
                          ? `${Math.round(document.suspiciousScore * 100)}%`
                          : "Sin score"}
                      </p>
                    </div>

                    <div className="rounded-3xl border border-amber-200 bg-amber-50/70 p-5">
                      <p className="text-sm font-medium text-amber-800">Motivo del flag</p>
                      <p className="mt-2 text-sm leading-7 text-amber-900">
                        {document.suspiciousReason ?? "La IA no devolvió un motivo textual."}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {previewUrl ? (
                        <a
                          href={previewUrl}
                          target="_blank"
                          rel="noreferrer"
                          className={cn(buttonVariants({ variant: "outline" }), "rounded-2xl")}
                        >
                          Ver documento
                        </a>
                      ) : (
                        <span className="text-muted-foreground rounded-2xl border px-4 py-2 text-sm">
                          Vista previa no disponible
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="w-full max-w-xl rounded-4xl border p-5">
                    <p className="text-sm tracking-[0.22em] text-rose-700 uppercase">Resolver</p>
                    <p className="text-muted-foreground mt-3 text-sm leading-7">
                      Dejá una nota corta y definí si el documento sigue validado o se rechaza.
                    </p>

                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                      <DocumentReviewForm documentId={document.id} decision="approve" />
                      <DocumentReviewForm documentId={document.id} decision="reject" />
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}

function DocumentReviewForm({
  documentId,
  decision,
}: {
  documentId: string;
  decision: "approve" | "reject";
}) {
  const isApprove = decision === "approve";

  return (
    <form action={reviewFlaggedDocumentAction} className="rounded-3xl border p-4">
      <input type="hidden" name="documentId" value={documentId} />
      <input type="hidden" name="decision" value={decision} />
      <p className="text-sm font-medium">{isApprove ? "Aprobar documento" : "Rechazar documento"}</p>
      <textarea
        name="reviewNote"
        rows={4}
        className="mt-3 w-full rounded-2xl border px-4 py-3 text-sm"
        placeholder={
          isApprove
            ? "Ej. Validado manualmente contra el archivo original."
            : "Ej. El importe no coincide con la declaración del perfil."
        }
      />
      <button
        className={cn(
          buttonVariants({ variant: isApprove ? "default" : "destructive" }),
          "mt-4 w-full rounded-2xl"
        )}
      >
        {isApprove ? "Aprobar" : "Rechazar"}
      </button>
    </form>
  );
}
