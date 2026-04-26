import Link from "next/link";
import { notFound } from "next/navigation";

import {
  formatCurrency,
  formatDateTime,
  getAgencyTransactionById,
  getAgencyUserByEmail,
  getCandidateDisplayName,
  getCandidateEmail,
  getCandidatePhone,
  getCandidacySourceLabel,
  getCandidacyStatusLabel,
  getGuaranteeLabel,
  getNextTransactionStage,
  getTransactionStageDescription,
  getTransactionStageLabel,
  getTransactionStageTone,
  getTransactionStages,
} from "@/lib/agency/transactions";
import { requireUserRole } from "@/lib/auth/session";
import { ConfirmSubmitButton } from "@/components/agency/confirm-submit-button";
import { CopyPortalLinkButton } from "@/components/agency/copy-portal-link-button";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import {
  addTransactionDocumentAction,
  addTransactionInternalNoteAction,
  advanceTransactionStageAction,
} from "./actions";

const stageToneStyles = {
  complete: "border-emerald-200 bg-emerald-50 text-emerald-950",
  current: "border-sky-200 bg-sky-50 text-sky-950",
  upcoming: "border-zinc-200 bg-zinc-50 text-zinc-700",
} as const;

type AgencyTransactionDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getSearchValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AgencyTransactionDetailPage({
  params,
  searchParams,
}: AgencyTransactionDetailPageProps) {
  const [{ id }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const session = await requireUserRole("agency");
  const email = session.user?.email;

  if (!email) {
    notFound();
  }

  const agency = await getAgencyUserByEmail(email);

  if (!agency) {
    notFound();
  }

  const transaction = await getAgencyTransactionById(id, agency.id);

  if (!transaction) {
    notFound();
  }

  const message = getSearchValue(resolvedSearchParams.message);
  const error = getSearchValue(resolvedSearchParams.error);
  const stages = getTransactionStages();
  const nextStage = getNextTransactionStage(transaction.currentStage);
  const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/portal/${transaction.shareToken}`;
  const candidateName = getCandidateDisplayName(transaction.candidacy);
  const candidateEmail = getCandidateEmail(transaction.candidacy);
  const candidatePhone = getCandidatePhone(transaction.candidacy);

  return (
    <main className="space-y-6">
      {message ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-950">
          {error}
        </div>
      ) : null}

      <section className="bg-background rounded-4xl border p-8 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm tracking-[0.22em] text-sky-700 uppercase">Transacción activa</p>
            <h1 className="mt-3 text-4xl font-semibold text-balance">{transaction.property.title}</h1>
            <p className="text-muted-foreground mt-3 max-w-3xl leading-8">
              {transaction.property.addressLine}, {transaction.property.city} · {candidateName}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/agency/transactions"
              className={cn(buttonVariants({ variant: "outline" }), "rounded-2xl")}
            >
              Ver todas
            </Link>
            <CopyPortalLinkButton url={portalUrl} />
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          <div className="rounded-3xl border p-5">
            <p className="text-muted-foreground text-sm">Etapa actual</p>
            <p className="mt-2 text-lg font-semibold">
              {getTransactionStageLabel(transaction.currentStage)}
            </p>
          </div>
          <div className="rounded-3xl border p-5">
            <p className="text-muted-foreground text-sm">Inicio</p>
            <p className="mt-2 text-lg font-semibold">{formatDateTime(transaction.startedAt)}</p>
          </div>
          <div className="rounded-3xl border p-5">
            <p className="text-muted-foreground text-sm">Alquiler</p>
            <p className="mt-2 text-lg font-semibold">{formatCurrency(transaction.property.price)}</p>
          </div>
          <div className="rounded-3xl border p-5">
            <p className="text-muted-foreground text-sm">Score de ingreso</p>
            <p className="mt-2 text-lg font-semibold">{transaction.candidacy.scoreAtSubmission}</p>
          </div>
        </div>
      </section>

      <section className="bg-background rounded-4xl border p-8 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm tracking-[0.22em] text-sky-700 uppercase">Stepper operativo</p>
            <h2 className="mt-3 text-2xl font-semibold">Seguimiento del circuito completo</h2>
          </div>

          {nextStage ? (
            <form action={advanceTransactionStageAction} className="w-full max-w-md space-y-3">
              <input type="hidden" name="transactionId" value={transaction.id} />
              <input
                type="text"
                name="note"
                placeholder={`Nota para ${getTransactionStageLabel(nextStage).toLowerCase()}`}
                className="h-12 w-full rounded-2xl border px-4"
              />
              <ConfirmSubmitButton
                confirmMessage={`¿Confirmás avanzar la transacción a ${getTransactionStageLabel(nextStage)}?`}
                className={cn(buttonVariants(), "w-full rounded-2xl")}
              >
                Avanzar a {getTransactionStageLabel(nextStage)}
              </ConfirmSubmitButton>
            </form>
          ) : (
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
              Operación finalizada. Ya se entregaron las llaves.
            </div>
          )}
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-5">
          {stages.map((stage) => {
            const tone = getTransactionStageTone(transaction.currentStage, stage);
            const stateRecord = transaction.states.find((state) => state.stage === stage);

            return (
              <article
                key={stage}
                className={cn("rounded-3xl border p-5", stageToneStyles[tone])}
              >
                <p className="text-xs tracking-[0.18em] uppercase">
                  {tone === "complete" ? "Completado" : tone === "current" ? "Actual" : "Pendiente"}
                </p>
                <h3 className="mt-3 text-lg font-semibold">{getTransactionStageLabel(stage)}</h3>
                <p className="mt-3 text-sm leading-6">{getTransactionStageDescription(stage)}</p>
                <p className="mt-4 text-xs">
                  {stateRecord ? `Último cambio: ${formatDateTime(stateRecord.createdAt)}` : "Sin movimiento todavía"}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
        <div className="space-y-6">
          <section className="bg-background rounded-4xl border p-8 shadow-sm">
            <p className="text-sm tracking-[0.22em] text-sky-700 uppercase">Candidato</p>
            <h2 className="mt-3 text-2xl font-semibold">{candidateName}</h2>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border p-5">
                <p className="text-muted-foreground text-sm">Fuente</p>
                <p className="mt-2 font-semibold">
                  {getCandidacySourceLabel(transaction.candidacy.source)}
                </p>
                <p className="text-muted-foreground mt-2 text-sm">
                  Estado {getCandidacyStatusLabel(transaction.candidacy.status)}
                </p>
              </div>
              <div className="rounded-3xl border p-5">
                <p className="text-muted-foreground text-sm">Garantía</p>
                <p className="mt-2 font-semibold">
                  {getGuaranteeLabel(
                    transaction.candidacy.guaranteeType ??
                      transaction.candidacy.tenantProfile?.guaranteeType
                  )}
                </p>
                <p className="text-muted-foreground mt-2 text-sm">
                  Ratio alquiler/ingreso{" "}
                  {transaction.candidacy.rentToIncomeRatio
                    ? `${Math.round(transaction.candidacy.rentToIncomeRatio * 100)}%`
                    : "Sin dato"}
                </p>
              </div>
              <div className="rounded-3xl border p-5">
                <p className="text-muted-foreground text-sm">Contacto</p>
                <p className="mt-2 font-semibold">{candidateEmail ?? "Sin email"}</p>
                <p className="text-muted-foreground mt-2 text-sm">{candidatePhone ?? "Sin teléfono"}</p>
              </div>
              <div className="rounded-3xl border p-5">
                <p className="text-muted-foreground text-sm">Ingreso mensual</p>
                <p className="mt-2 font-semibold">
                  {formatCurrency(
                    transaction.candidacy.monthlyIncome ??
                      transaction.candidacy.tenantProfile?.monthlyIncome
                  )}
                </p>
                <p className="text-muted-foreground mt-2 text-sm">
                  Compatibilidad IA{" "}
                  {transaction.candidacy.aiCompatibilityScore
                    ? `${transaction.candidacy.aiCompatibilityScore}%`
                    : "pendiente"}
                </p>
              </div>
            </div>

            {transaction.candidacy.aiCompatibilityExplanation ? (
              <div className="bg-muted/40 mt-6 rounded-3xl border p-5">
                <p className="text-sm font-medium">Lectura IA actual</p>
                <p className="text-muted-foreground mt-2 text-sm leading-7">
                  {transaction.candidacy.aiCompatibilityExplanation}
                </p>
              </div>
            ) : null}
          </section>

          <section className="bg-background rounded-4xl border p-8 shadow-sm">
            <p className="text-sm tracking-[0.22em] text-sky-700 uppercase">Historial</p>
            <h2 className="mt-3 text-2xl font-semibold">Cambios de estado registrados</h2>

            <div className="mt-6 space-y-4">
              {transaction.states.map((state) => (
                <article key={state.id} className="rounded-3xl border p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{getTransactionStageLabel(state.stage)}</p>
                      <p className="text-muted-foreground mt-1 text-sm">
                        {formatDateTime(state.createdAt)}
                      </p>
                    </div>
                    {state.isCurrent ? (
                      <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-950">
                        Estado actual
                      </span>
                    ) : null}
                  </div>
                  <p className="text-muted-foreground mt-3 text-sm leading-7">
                    {state.note || "Sin nota adicional."}
                  </p>
                </article>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="bg-background rounded-4xl border p-8 shadow-sm">
            <p className="text-sm tracking-[0.22em] text-sky-700 uppercase">Documentos</p>
            <h2 className="mt-3 text-2xl font-semibold">Adjuntos por etapa</h2>

            <form action={addTransactionDocumentAction} className="mt-6 grid gap-4">
              <input type="hidden" name="transactionId" value={transaction.id} />
              <input
                type="text"
                name="name"
                placeholder="Nombre del documento"
                className="h-12 rounded-2xl border px-4"
              />
              <input
                type="url"
                name="url"
                placeholder="https://..."
                className="h-12 rounded-2xl border px-4"
              />
              <div className="grid gap-4 md:grid-cols-2">
                <select name="stage" defaultValue={transaction.currentStage} className="h-12 rounded-2xl border px-4">
                  {stages.map((stage) => (
                    <option key={stage} value={stage}>
                      {getTransactionStageLabel(stage)}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  name="mimeType"
                  placeholder="application/pdf"
                  defaultValue="application/pdf"
                  className="h-12 rounded-2xl border px-4"
                />
              </div>
              <label className="flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm">
                <input type="checkbox" name="visibleToClient" />
                Visible en el portal compartido
              </label>
              <button type="submit" className={cn(buttonVariants(), "rounded-2xl")}>
                Adjuntar documento
              </button>
            </form>

            <div className="mt-6 space-y-4">
              {transaction.documents.length > 0 ? (
                transaction.documents.map((document) => (
                  <article key={document.id} className="rounded-3xl border p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{document.name}</p>
                        <p className="text-muted-foreground mt-1 text-sm">
                          {getTransactionStageLabel(document.stage)} · {formatDateTime(document.createdAt)}
                        </p>
                      </div>
                      <span className="rounded-full border px-3 py-1 text-xs">
                        {document.visibleToClient ? "Visible al cliente" : "Interno"}
                      </span>
                    </div>
                    <a
                      href={document.url ?? "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex text-sm font-medium text-sky-800 underline underline-offset-4"
                    >
                      Abrir documento
                    </a>
                  </article>
                ))
              ) : (
                <div className="rounded-3xl border border-dashed p-5 text-sm text-zinc-600">
                  Todavía no hay documentos cargados para esta transacción.
                </div>
              )}
            </div>
          </section>

          <section className="bg-background rounded-4xl border p-8 shadow-sm">
            <p className="text-sm tracking-[0.22em] text-sky-700 uppercase">Notas internas</p>
            <h2 className="mt-3 text-2xl font-semibold">Seguimiento interno del equipo</h2>

            <form action={addTransactionInternalNoteAction} className="mt-6 space-y-4">
              <input type="hidden" name="transactionId" value={transaction.id} />
              <textarea
                name="content"
                rows={4}
                placeholder="Dejá contexto para el equipo comercial o legal."
                className="w-full rounded-3xl border px-4 py-3"
              />
              <button type="submit" className={cn(buttonVariants({ variant: "outline" }), "rounded-2xl")}>
                Guardar nota
              </button>
            </form>

            <div className="mt-6 space-y-4">
              {transaction.notes.length > 0 ? (
                transaction.notes.map((note) => (
                  <article key={note.id} className="rounded-3xl border p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">
                          {note.author
                            ? `${note.author.firstName} ${note.author.lastName}`
                            : "Equipo inmobiliario"}
                        </p>
                        <p className="text-muted-foreground mt-1 text-sm">
                          {formatDateTime(note.createdAt)}
                        </p>
                      </div>
                      <span className="rounded-full border px-3 py-1 text-xs">Solo interno</span>
                    </div>
                    <p className="text-muted-foreground mt-3 text-sm leading-7">{note.content}</p>
                  </article>
                ))
              ) : (
                <div className="rounded-3xl border border-dashed p-5 text-sm text-zinc-600">
                  No hay notas internas registradas todavía.
                </div>
              )}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
