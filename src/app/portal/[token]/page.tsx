import { notFound } from "next/navigation";

import {
  formatDateTime,
  getCandidateDisplayName,
  getPortalTransactionByToken,
  getTransactionStageDescription,
  getTransactionStageLabel,
  getTransactionStageTone,
  getTransactionStages,
} from "@/lib/agency/transactions";
import { cn } from "@/lib/utils";

const stageToneStyles = {
  complete: "border-emerald-200 bg-emerald-50 text-emerald-950",
  current: "border-sky-200 bg-sky-50 text-sky-950",
  upcoming: "border-zinc-200 bg-zinc-50 text-zinc-700",
} as const;

type PortalPageProps = {
  params: Promise<{ token: string }>;
};

export default async function PortalPage({ params }: PortalPageProps) {
  const { token } = await params;
  const transaction = await getPortalTransactionByToken(token);

  if (!transaction) {
    notFound();
  }

  const stages = getTransactionStages();
  const candidateName = getCandidateDisplayName(transaction.candidacy);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.14),_transparent_28%),linear-gradient(to_bottom,_#ffffff,_#f5f9ff)] px-6 py-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="bg-background rounded-4xl border p-8 shadow-sm">
          <p className="text-sm tracking-[0.22em] text-sky-700 uppercase">Portal de seguimiento</p>
          <h1 className="mt-3 text-4xl font-semibold text-balance">{transaction.property.title}</h1>
          <p className="text-muted-foreground mt-3 max-w-3xl leading-8">
            {transaction.property.addressLine}, {transaction.property.city} · {candidateName}
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border p-5">
              <p className="text-muted-foreground text-sm">Estado actual</p>
              <p className="mt-2 text-lg font-semibold">
                {getTransactionStageLabel(transaction.currentStage)}
              </p>
            </div>
            <div className="rounded-3xl border p-5">
              <p className="text-muted-foreground text-sm">Próximo paso</p>
              <p className="mt-2 text-lg font-semibold">
                {getTransactionStageDescription(transaction.currentStage)}
              </p>
            </div>
            <div className="rounded-3xl border p-5">
              <p className="text-muted-foreground text-sm">Propietario</p>
              <p className="mt-2 text-lg font-semibold">{transaction.ownerName ?? "Sin dato"}</p>
            </div>
          </div>
        </section>

        <section className="bg-background rounded-4xl border p-8 shadow-sm">
          <p className="text-sm tracking-[0.22em] text-sky-700 uppercase">Avance</p>
          <div className="mt-6 grid gap-4 lg:grid-cols-5">
            {stages.map((stage) => (
              <article
                key={stage}
                className={cn(
                  "rounded-3xl border p-5",
                  stageToneStyles[getTransactionStageTone(transaction.currentStage, stage)]
                )}
              >
                <p className="text-xs tracking-[0.18em] uppercase">
                  {getTransactionStageLabel(stage)}
                </p>
                <p className="mt-3 text-sm leading-6">{getTransactionStageDescription(stage)}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="bg-background rounded-4xl border p-8 shadow-sm">
            <p className="text-sm tracking-[0.22em] text-sky-700 uppercase">Historial</p>
            <div className="mt-6 space-y-4">
              {transaction.states.map((state) => (
                <article key={state.id} className="rounded-3xl border p-5">
                  <p className="font-semibold">{getTransactionStageLabel(state.stage)}</p>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {formatDateTime(state.createdAt)}
                  </p>
                  <p className="text-muted-foreground mt-3 text-sm leading-7">
                    {state.note || "Sin observaciones públicas."}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section className="bg-background rounded-4xl border p-8 shadow-sm">
            <p className="text-sm tracking-[0.22em] text-sky-700 uppercase">Documentos visibles</p>
            <div className="mt-6 space-y-4">
              {transaction.documents.length > 0 ? (
                transaction.documents.map((document) => (
                  <article key={document.id} className="rounded-3xl border p-5">
                    <p className="font-semibold">{document.name}</p>
                    <p className="text-muted-foreground mt-1 text-sm">
                      {getTransactionStageLabel(document.stage)} · {formatDateTime(document.createdAt)}
                    </p>
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
                  Todavía no hay documentos compartidos para esta operación.
                </div>
              )}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
