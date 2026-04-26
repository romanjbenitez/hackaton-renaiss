import Link from "next/link";
import { AgencyStatus, UserRole } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const stageLabels: Record<string, string> = {
  CANDIDATE_SELECTED: "Candidato seleccionado",
  DOCS_COMPLETE: "Documentación completa",
  CONTRACT_REVIEW: "Revisión de contrato",
  CONTRACT_SIGNED: "Contrato firmado",
  KEYS_DELIVERED: "Llaves entregadas",
};

export default function AdminDashboardPage() {
  return <AdminDashboardContent />;
}

async function AdminDashboardContent() {
  const [agencyCounts, tenantsCount, transactionsByStage] = await Promise.all([
    prisma.user.groupBy({
      by: ["agencyStatus"],
      where: {
        role: UserRole.AGENCY,
      },
      _count: {
        _all: true,
      },
    }),
    prisma.user.count({
      where: {
        role: UserRole.TENANT,
        isActive: true,
      },
    }),
    prisma.transaction.groupBy({
      by: ["currentStage"],
      _count: {
        _all: true,
      },
    }),
  ]);

  const approvedAgencies =
    agencyCounts.find((item) => item.agencyStatus === AgencyStatus.APPROVED)?._count._all ?? 0;
  const pendingAgencies =
    agencyCounts.find((item) => item.agencyStatus === AgencyStatus.PENDING)?._count._all ?? 0;
  const rejectedAgencies =
    agencyCounts.find((item) => item.agencyStatus === AgencyStatus.REJECTED)?._count._all ?? 0;
  const activeTransactionsCount = transactionsByStage.reduce((sum, item) => sum + item._count._all, 0);

  return (
    <main className="grid gap-6 md:grid-cols-2">
      <section className="bg-background rounded-4xl border p-8 shadow-sm">
        <p className="text-sm tracking-[0.22em] text-rose-700 uppercase">Métricas globales</p>
        <h2 className="mt-4 text-3xl font-semibold">Visión operativa de la plataforma</h2>
        <p className="text-muted-foreground mt-4 leading-8">
          El panel ya consolida altas de inmobiliarias, base de inquilinos y transacciones activas
          para priorizar moderación y seguimiento.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/admin/agencies" className={cn(buttonVariants(), "rounded-2xl")}>
            Revisar inmobiliarias
          </Link>
          <Link
            href="/admin/documents-queue"
            className={cn(buttonVariants({ variant: "outline" }), "rounded-2xl")}
          >
            Ver documentos flaggeados
          </Link>
        </div>
      </section>
      <section className="bg-background rounded-4xl border p-8 shadow-sm">
        <p className="text-sm tracking-[0.22em] text-rose-700 uppercase">Estado actual</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <MetricCard label="Inmobiliarias aprobadas" value={approvedAgencies} />
          <MetricCard label="Inmobiliarias pendientes" value={pendingAgencies} />
          <MetricCard label="Inquilinos activos" value={tenantsCount} />
          <MetricCard label="Transacciones activas" value={activeTransactionsCount} />
        </div>
      </section>
      <section className="bg-background rounded-4xl border p-8 shadow-sm md:col-span-2">
        <p className="text-sm tracking-[0.22em] text-rose-700 uppercase">Transacciones por etapa</p>
        <div className="mt-4 grid gap-4 md:grid-cols-5">
          {transactionsByStage.map((item) => (
            <MetricCard
              key={item.currentStage}
              label={stageLabels[item.currentStage] ?? item.currentStage.replaceAll("_", " ")}
              value={item._count._all}
            />
          ))}
          <MetricCard label="Inmobiliarias rechazadas" value={rejectedAgencies} />
        </div>
      </section>

      <section className="bg-background rounded-4xl border p-8 shadow-sm md:col-span-2">
        <p className="text-sm tracking-[0.22em] text-rose-700 uppercase">Foco operativo</p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <MetricCard label="Pendientes de aprobación" value={pendingAgencies} />
          <MetricCard label="Aprobadas" value={approvedAgencies} />
          <MetricCard label="Transacciones en curso" value={activeTransactionsCount} />
        </div>
      </section>
    </main>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl border p-5">
      <p className="text-muted-foreground text-sm">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </div>
  );
}
