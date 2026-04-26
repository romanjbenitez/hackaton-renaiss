import Link from "next/link";
import { redirect } from "next/navigation";
import { TransactionStageType } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { getAgencyProperties } from "@/lib/agency/properties";
import { getAgencyTransactions, getAgencyUserByEmail } from "@/lib/agency/transactions";
import { requireUserRole } from "@/lib/auth/session";
import { DashboardCharts } from "@/components/agency/dashboard-charts";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STAGE_LABELS: Record<TransactionStageType, string> = {
  CANDIDATE_SELECTED: "Candidato seleccionado",
  DOCS_COMPLETE: "Docs completos",
  CONTRACT_REVIEW: "Revisión contrato",
  CONTRACT_SIGNED: "Contrato firmado",
  KEYS_DELIVERED: "Llaves entregadas",
};

const STAGE_COLORS: Record<TransactionStageType, string> = {
  CANDIDATE_SELECTED: "#0ea5e9",
  DOCS_COMPLETE: "#14b8a6",
  CONTRACT_REVIEW: "#f59e0b",
  CONTRACT_SIGNED: "#f97316",
  KEYS_DELIVERED: "#22c55e",
};

export default async function AgencyDashboardPage() {
  const session = await requireUserRole("agency");
  const email = session.user?.email;

  if (!email) {
    redirect("/login?error=Sesión%20inválida");
  }

  const agency = await getAgencyUserByEmail(email);

  if (!agency) {
    redirect("/login?error=No%20se%20encontró%20la%20inmobiliaria");
  }

  const [properties, transactions, candidacyStats, closingStates] = await Promise.all([
    getAgencyProperties(agency.id),
    getAgencyTransactions(agency.id),
    prisma.candidacy.groupBy({
      by: ["propertyId"],
      where: {
        property: { agencyId: agency.id },
      },
      _count: { _all: true },
    }),
    prisma.transactionState.findMany({
      where: {
        transaction: {
          property: {
            agencyId: agency.id,
          },
        },
        stage: {
          in: [TransactionStageType.CANDIDATE_SELECTED, TransactionStageType.KEYS_DELIVERED],
        },
      },
      orderBy: {
        createdAt: "asc",
      },
      select: {
        transactionId: true,
        stage: true,
        createdAt: true,
      },
    }),
  ]);

  const publishedCount = properties.filter((p) => p.status === "PUBLISHED").length;
  const draftCount = properties.filter((p) => p.status === "DRAFT").length;
  const activeTransactions = transactions.filter((t) => t.currentStage !== "KEYS_DELIVERED");
  const transactionsByStage = Object.values(TransactionStageType).reduce(
    (accumulator, stage) => {
      accumulator[stage] = 0;
      return accumulator;
    },
    {} as Record<TransactionStageType, number>
  );

  for (const transaction of activeTransactions) {
    transactionsByStage[transaction.currentStage] += 1;
  }

  const totalCandidacies = candidacyStats.reduce((sum, item) => sum + item._count._all, 0);
  const avgCandidaciesPerProperty =
    properties.length > 0
      ? Math.round((totalCandidacies / properties.length) * 10) / 10
      : 0;

  const closingDurations = Array.from(
    closingStates.reduce((map, state) => {
      const current = map.get(state.transactionId) ?? {};

      if (state.stage === TransactionStageType.CANDIDATE_SELECTED && !current.selectedAt) {
        current.selectedAt = state.createdAt;
      }

      if (state.stage === TransactionStageType.KEYS_DELIVERED) {
        current.deliveredAt = state.createdAt;
      }

      map.set(state.transactionId, current);
      return map;
    }, new Map<string, { selectedAt?: Date; deliveredAt?: Date }>())
  )
    .map(([, value]) => {
      if (!value.selectedAt || !value.deliveredAt) {
        return null;
      }

      return (
        (value.deliveredAt.getTime() - value.selectedAt.getTime()) / (1000 * 60 * 60 * 24)
      );
    })
    .filter((value): value is number => value !== null);

  const avgCloseDays =
    closingDurations.length > 0
      ? Math.round(
          (closingDurations.reduce((sum, duration) => sum + duration, 0) /
            closingDurations.length) *
            10
        ) / 10
      : null;
  const propertiesWithoutCandidates = properties.filter(
    (property) => !candidacyStats.some((item) => item.propertyId === property.id)
  );
  const transactionsPendingDocs = activeTransactions.filter((transaction) => transaction.currentStage === "CANDIDATE_SELECTED");
  const mostDemandedProperties = [...candidacyStats]
    .sort((left, right) => right._count._all - left._count._all)
    .slice(0, 3)
    .map((item) => ({
      property: properties.find((property) => property.id === item.propertyId),
      count: item._count._all,
    }))
    .filter((item) => item.property);
  const propertyStatusData = [
    { name: "Publicadas", value: publishedCount, color: "#0ea5e9" },
    { name: "Borradores", value: draftCount, color: "#f59e0b" },
    {
      name: "Otros estados",
      value: Math.max(0, properties.length - publishedCount - draftCount),
      color: "#94a3b8",
    },
  ];
  const transactionStageData = Object.entries(transactionsByStage).map(([stage, count]) => ({
    name: STAGE_LABELS[stage as TransactionStageType],
    value: count,
    color: STAGE_COLORS[stage as TransactionStageType],
  }));

  return (
    <main className="space-y-6">
      <section className="bg-background rounded-4xl border p-8 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm tracking-[0.22em] text-sky-700 uppercase">Dashboard</p>
            <h2 className="mt-4 text-3xl font-semibold">Métricas operativas de la inmobiliaria</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/agency/properties" className={cn(buttonVariants(), "rounded-2xl")}>
              Ver propiedades
            </Link>
            <Link
              href="/agency/transactions"
              className={cn(buttonVariants({ variant: "outline" }), "rounded-2xl")}
            >
              Ver transacciones
            </Link>
            <Link
              href="/agency/properties/new"
              className={cn(buttonVariants({ variant: "outline" }), "rounded-2xl")}
            >
              Cargar inmueble
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="bg-background rounded-3xl border p-5 shadow-sm">
          <p className="text-muted-foreground text-sm">Propiedades cargadas</p>
          <p className="mt-2 text-3xl font-semibold">{properties.length}</p>
          <p className="text-muted-foreground mt-1 text-xs">{publishedCount} publicadas</p>
        </div>
        <div className="bg-background rounded-3xl border p-5 shadow-sm">
          <p className="text-muted-foreground text-sm">Propiedades en borrador</p>
          <p className="mt-2 text-3xl font-semibold">{draftCount}</p>
          <p className="text-muted-foreground mt-1 text-xs">
            {properties.length - publishedCount - draftCount} en otros estados
          </p>
        </div>
        <div className="bg-background rounded-3xl border p-5 shadow-sm">
          <p className="text-muted-foreground text-sm">Transacciones activas</p>
          <p className="mt-2 text-3xl font-semibold">{activeTransactions.length}</p>
          <p className="text-muted-foreground mt-1 text-xs">
            {closingDurations.length} cierres medidos
          </p>
        </div>
        <div className="bg-background rounded-3xl border p-5 shadow-sm">
          <p className="text-muted-foreground text-sm">Candidatos prom. por propiedad</p>
          <p className="mt-2 text-3xl font-semibold">{avgCandidaciesPerProperty}</p>
          <p className="text-muted-foreground mt-1 text-xs">
            {totalCandidacies} candidaturas repartidas en {properties.length || 0} propiedades
          </p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="bg-background rounded-4xl border p-8 shadow-sm">
          <p className="text-sm tracking-[0.22em] text-sky-700 uppercase">Pipeline activo</p>
          <h3 className="mt-3 text-2xl font-semibold">Transacciones por etapa</h3>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Object.entries(transactionsByStage).map(([stage, count]) => (
              <div key={stage} className="rounded-3xl border p-5">
                <p className="text-muted-foreground text-xs">
                  {STAGE_LABELS[stage as TransactionStageType]}
                </p>
                <p className="mt-2 text-2xl font-semibold">{count}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-background rounded-4xl border p-8 shadow-sm">
          <p className="text-sm tracking-[0.22em] text-sky-700 uppercase">Velocidad de cierre</p>
          <h3 className="mt-3 text-2xl font-semibold">Tiempo promedio operativo</h3>
          <p className="mt-6 text-4xl font-semibold">
            {avgCloseDays !== null ? `${avgCloseDays} días` : "—"}
          </p>
          <p className="text-muted-foreground mt-3 text-sm leading-7">
            {avgCloseDays !== null
              ? "Promedio calculado entre el estado candidato seleccionado y llaves entregadas."
              : "Todavía no hay transacciones completas para medir el ciclo de cierre."}
          </p>
        </div>
      </section>

      <DashboardCharts
        propertyStatusData={propertyStatusData}
        transactionStageData={transactionStageData}
      />

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="bg-background rounded-4xl border p-8 shadow-sm">
          <p className="text-sm tracking-[0.22em] text-sky-700 uppercase">Acción rápida</p>
          <h3 className="mt-3 text-2xl font-semibold">Propiedades sin candidatos</h3>
          <p className="mt-5 text-4xl font-semibold">{propertiesWithoutCandidates.length}</p>
          <p className="text-muted-foreground mt-3 text-sm leading-7">
            Publicaciones activas que todavía no recibieron postulaciones y conviene revisar.
          </p>
        </div>

        <div className="bg-background rounded-4xl border p-8 shadow-sm">
          <p className="text-sm tracking-[0.22em] text-sky-700 uppercase">Embudo</p>
          <h3 className="mt-3 text-2xl font-semibold">Operaciones frenadas en documentación</h3>
          <p className="mt-5 text-4xl font-semibold">{transactionsPendingDocs.length}</p>
          <p className="text-muted-foreground mt-3 text-sm leading-7">
            Casos en etapa inicial donde falta empujar el cierre documental del candidato.
          </p>
        </div>

        <div className="bg-background rounded-4xl border p-8 shadow-sm">
          <p className="text-sm tracking-[0.22em] text-sky-700 uppercase">Demanda</p>
          <h3 className="mt-3 text-2xl font-semibold">Propiedades más consultadas</h3>
          <div className="mt-5 space-y-3 text-sm">
            {mostDemandedProperties.length > 0 ? (
              mostDemandedProperties.map((item) => (
                <div key={item.property!.id} className="rounded-2xl border p-3">
                  <p className="font-medium">{item.property!.title}</p>
                  <p className="text-muted-foreground mt-1">{item.count} candidatura(s)</p>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">Todavía no hay propiedades con demanda suficiente para destacar.</p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
