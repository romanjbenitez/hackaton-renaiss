import { getCandidateDisplayName, getCandidacyStatusLabel, getGuaranteeLabel } from "@/lib/agency/transactions";

type ApplicationsListProps = {
  applications: Array<{
    id: string;
    status: Parameters<typeof getCandidacyStatusLabel>[0];
    scoreAtSubmission: number;
    guaranteeType: Parameters<typeof getGuaranteeLabel>[0] | null;
    property: {
      title: string;
      addressLine: string;
      city: string;
      propertyType: string;
    };
    tenant: {
      firstName: string;
      lastName: string;
    } | null;
  }>;
};

export function ApplicationsList({ applications }: ApplicationsListProps) {
  return (
    <main className="space-y-6">
      <section className="bg-background rounded-4xl border p-8 shadow-sm">
        <p className="text-sm tracking-[0.22em] text-emerald-700 uppercase">Postulaciones</p>
        <h1 className="mt-4 text-4xl font-semibold">Seguimiento de aplicaciones activas</h1>
      </section>

      <section className="space-y-4">
        {applications.length === 0 ? (
          <div className="bg-background text-muted-foreground rounded-4xl border border-dashed p-8 text-sm shadow-sm">
            Todavía no tenés postulaciones activas.
          </div>
        ) : (
          applications.map((application) => (
            <article key={application.id} className="bg-background rounded-4xl border p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm tracking-[0.2em] text-emerald-700 uppercase">
                    {application.property.propertyType}
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold">{application.property.title}</h2>
                  <p className="text-muted-foreground mt-2">
                    {application.property.addressLine}, {application.property.city}
                  </p>
                </div>
                <span className="rounded-full border border-sky-200 bg-sky-50 px-4 py-1 text-sm font-medium text-sky-950">
                  {getCandidacyStatusLabel(application.status)}
                </span>
              </div>

              <div className="mt-5 grid gap-3 text-sm md:grid-cols-3">
                <div className="rounded-2xl border p-3">
                  <p className="text-muted-foreground">Score</p>
                  <p className="mt-1 font-medium">{application.scoreAtSubmission}</p>
                </div>
                <div className="rounded-2xl border p-3">
                  <p className="text-muted-foreground">Garantía</p>
                  <p className="mt-1 font-medium">{getGuaranteeLabel(application.guaranteeType)}</p>
                </div>
                <div className="rounded-2xl border p-3">
                  <p className="text-muted-foreground">Perfil</p>
                  <p className="mt-1 font-medium">
                    {getCandidateDisplayName({ tenant: application.tenant })}
                  </p>
                </div>
              </div>
            </article>
          ))
        )}
      </section>
    </main>
  );
}
