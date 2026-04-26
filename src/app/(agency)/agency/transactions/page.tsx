import Link from "next/link";
import { redirect } from "next/navigation";

import {
  formatCurrency,
  formatDateTime,
  getAgencyTransactions,
  getAgencyUserByEmail,
  getCandidateDisplayName,
  getCandidacyStatusLabel,
  getCandidacySourceLabel,
  getTransactionStageLabel,
} from "@/lib/agency/transactions";
import { requireUserRole } from "@/lib/auth/session";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function AgencyTransactionsPage() {
  const session = await requireUserRole("agency");
  const email = session.user?.email;

  if (!email) {
    redirect("/login?error=Sesión%20inválida");
  }

  const agency = await getAgencyUserByEmail(email);

  if (!agency) {
    redirect("/login?error=No%20se%20encontró%20la%20inmobiliaria");
  }

  const transactions = await getAgencyTransactions(agency.id);
  const activeTransactions = transactions.filter(
    (transaction) => transaction.currentStage !== "KEYS_DELIVERED"
  ).length;

  return (
    <main className="space-y-6">
      <section className="bg-background rounded-4xl border p-8 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm tracking-[0.22em] text-sky-700 uppercase">Transacciones</p>
            <h1 className="mt-3 text-4xl font-semibold text-balance">
              Pipeline operativo desde selección hasta entrega de llaves
            </h1>
            <p className="text-muted-foreground mt-3 max-w-3xl leading-8">
              Cada operación concentra estado actual, historial, documentos y notas internas en una
              sola vista para el broker.
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border p-5">
            <p className="text-muted-foreground text-sm">Transacciones</p>
            <p className="mt-2 text-3xl font-semibold">{transactions.length}</p>
          </div>
          <div className="rounded-3xl border p-5">
            <p className="text-muted-foreground text-sm">Activas</p>
            <p className="mt-2 text-3xl font-semibold">{activeTransactions}</p>
          </div>
          <div className="rounded-3xl border p-5">
            <p className="text-muted-foreground text-sm">Cerradas</p>
            <p className="mt-2 text-3xl font-semibold">{transactions.length - activeTransactions}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4">
        {transactions.length > 0 ? (
          transactions.map((transaction) => (
            <article key={transaction.id} className="bg-background rounded-4xl border p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm tracking-[0.18em] text-sky-700 uppercase">
                    {getTransactionStageLabel(transaction.currentStage)}
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold">{transaction.property.title}</h2>
                  <p className="text-muted-foreground mt-2 leading-7">
                    {transaction.property.addressLine}, {transaction.property.city}
                  </p>
                </div>

                <Link
                  href={`/agency/transactions/${transaction.id}`}
                  className={cn(buttonVariants({ variant: "outline" }), "rounded-2xl")}
                >
                  Abrir tablero
                </Link>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-4">
                <div className="rounded-3xl border p-5">
                  <p className="text-muted-foreground text-sm">Candidato</p>
                  <p className="mt-2 font-semibold">{getCandidateDisplayName(transaction.candidacy)}</p>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {getCandidacySourceLabel(transaction.candidacy.source)}
                  </p>
                </div>
                <div className="rounded-3xl border p-5">
                  <p className="text-muted-foreground text-sm">Score</p>
                  <p className="mt-2 font-semibold">{transaction.candidacy.scoreAtSubmission}</p>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Estado {getCandidacyStatusLabel(transaction.candidacy.status)}
                  </p>
                </div>
                <div className="rounded-3xl border p-5">
                  <p className="text-muted-foreground text-sm">Ticket</p>
                  <p className="mt-2 font-semibold">{formatCurrency(transaction.property.price)}</p>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Inicio {formatDateTime(transaction.startedAt)}
                  </p>
                </div>
                <div className="rounded-3xl border p-5">
                  <p className="text-muted-foreground text-sm">Adjuntos / notas</p>
                  <p className="mt-2 font-semibold">
                    {transaction.documents.length} docs · {transaction.notes.length} notas
                  </p>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Portal token listo para compartir
                  </p>
                </div>
              </div>
            </article>
          ))
        ) : (
          <section className="bg-background rounded-4xl border border-dashed p-8 text-sm text-zinc-600 shadow-sm">
            No hay transacciones creadas todavía para esta inmobiliaria.
          </section>
        )}
      </section>
    </main>
  );
}
