import { UserRole } from "@prisma/client";

import { updateAgencyStatusAction } from "@/app/(admin)/admin/agencies/actions";
import { getAgencyStatusLabel, getAgencyStatusTone } from "@/lib/auth/profile";
import { prisma } from "@/lib/db/prisma";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AdminAgenciesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getSearchValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminAgenciesPage({ searchParams }: AdminAgenciesPageProps) {
  const params = await searchParams;
  const message = getSearchValue(params.message);
  const error = getSearchValue(params.error);

  const agencies = await prisma.user.findMany({
    where: {
      role: UserRole.AGENCY,
    },
    orderBy: [{ agencyStatus: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      companyName: true,
      companySlug: true,
      agencyStatus: true,
      createdAt: true,
    },
  });

  const statusClasses = {
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    rose: "border-rose-200 bg-rose-50 text-rose-700",
  };

  return (
    <main className="space-y-6">
      <section className="bg-background rounded-4xl border p-8 shadow-sm">
        <p className="text-sm tracking-[0.22em] text-rose-700 uppercase">Moderación</p>
        <h2 className="mt-4 text-3xl font-semibold">Aprobación de inmobiliarias</h2>
        <p className="text-muted-foreground mt-4 leading-8">
          Las cuentas nuevas quedan en revisión hasta que administración las apruebe. Desde acá
          también podés rechazar o volver a dejar una cuenta en pendiente.
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

      <section className="grid gap-4">
        {agencies.map((agency) => {
          const tone = getAgencyStatusTone(agency.agencyStatus);

          return (
            <article key={agency.id} className="bg-background rounded-4xl border p-6 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-2xl font-semibold">
                      {agency.companyName ?? `${agency.firstName} ${agency.lastName}`.trim()}
                    </h3>
                    <span
                      className={cn(
                        "inline-flex rounded-full border px-3 py-1 text-xs font-semibold",
                        statusClasses[tone]
                      )}
                    >
                      {getAgencyStatusLabel(agency.agencyStatus)}
                    </span>
                  </div>
                  <div className="text-muted-foreground grid gap-1 text-sm">
                    <p>Responsable: {agency.firstName} {agency.lastName}</p>
                    <p>Email: {agency.email}</p>
                    <p>Teléfono: {agency.phone ?? "No informado"}</p>
                    <p>Slug: {agency.companySlug ?? "Sin slug"}</p>
                    <p>Alta: {new Intl.DateTimeFormat("es-AR", { dateStyle: "medium" }).format(agency.createdAt)}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <StatusButton agencyId={agency.id} status="APPROVED">
                    Aprobar
                  </StatusButton>
                  <StatusButton agencyId={agency.id} status="PENDING" variant="outline">
                    Dejar pendiente
                  </StatusButton>
                  <StatusButton agencyId={agency.id} status="REJECTED" variant="destructive">
                    Rechazar
                  </StatusButton>
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}

function StatusButton({
  agencyId,
  status,
  variant = "default",
  children,
}: {
  agencyId: string;
  status: "APPROVED" | "PENDING" | "REJECTED";
  variant?: "default" | "outline" | "destructive";
  children: React.ReactNode;
}) {
  return (
    <form action={updateAgencyStatusAction}>
      <input type="hidden" name="agencyId" value={agencyId} />
      <input type="hidden" name="status" value={status} />
      <button className={cn(buttonVariants({ variant }), "rounded-2xl")}>{children}</button>
    </form>
  );
}
