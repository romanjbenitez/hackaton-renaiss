import Link from "next/link";
import { AgencyStatus } from "@prisma/client";

import { signOutAction } from "@/lib/auth/actions";
import { requireUserRole } from "@/lib/auth/session";
import { getAgencyStatusLabel, getAgencyStatusTone } from "@/lib/auth/profile";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function AgencyLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await requireUserRole("agency");
  const companyName =
    session.dbUser?.companyName ?? (session.user?.user_metadata.company_name as string | undefined);
  const agencyStatus = session.dbUser?.agencyStatus ?? AgencyStatus.PENDING;
  const statusTone = getAgencyStatusTone(agencyStatus);
  const statusClasses = {
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    rose: "border-rose-200 bg-rose-50 text-rose-700",
  };
  const isApproved = agencyStatus === AgencyStatus.APPROVED;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.15),_transparent_32%),linear-gradient(to_bottom,_transparent,_rgba(15,23,42,0.03))]">
      <header className="bg-background/80 border-b backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-sm tracking-[0.22em] text-sky-700 uppercase">Inmobiliaria</p>
            <h1 className="text-xl font-semibold">{companyName ?? session.user?.email}</h1>
            <p
              className={cn(
                "mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-semibold",
                statusClasses[statusTone]
              )}
            >
              Estado: {getAgencyStatusLabel(agencyStatus)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/agency"
              className={cn(buttonVariants({ variant: "outline" }), "rounded-2xl")}
            >
              Panel
            </Link>
            {isApproved ? (
              <>
                <Link
                  href="/agency/properties"
                  className={cn(buttonVariants({ variant: "outline" }), "rounded-2xl")}
                >
                  Propiedades
                </Link>
                <Link
                  href="/agency/transactions"
                  className={cn(buttonVariants({ variant: "outline" }), "rounded-2xl")}
                >
                  Transacciones
                </Link>
              </>
            ) : null}
            <form action={signOutAction}>
              <button className={cn(buttonVariants({ variant: "ghost" }), "rounded-2xl")}>
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-6 py-8">
        {isApproved ? (
          children
        ) : (
          <main className="grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
            <section className="bg-background rounded-4xl border p-8 shadow-sm">
              <p className="text-sm tracking-[0.22em] text-sky-700 uppercase">Validación</p>
              <h2 className="mt-4 text-3xl font-semibold">
                {agencyStatus === AgencyStatus.REJECTED
                  ? "La cuenta fue rechazada por administración."
                  : "La cuenta está pendiente de aprobación."}
              </h2>
              <p className="text-muted-foreground mt-4 leading-8">
                {agencyStatus === AgencyStatus.REJECTED
                  ? "Un administrador revisó la alta y todavía no habilitó el acceso operativo. Podés reintentar el registro o contactar soporte."
                  : "Ya registramos la inmobiliaria en la plataforma. Hasta que un administrador la apruebe, el acceso a propiedades, candidatos y transacciones queda bloqueado."}
              </p>
            </section>
            <section className="bg-background rounded-4xl border p-8 shadow-sm">
              <p className="text-sm tracking-[0.22em] text-sky-700 uppercase">Qué sigue</p>
              <ul className="mt-4 space-y-3 text-sm leading-7">
                <li>Verificamos los datos de la inmobiliaria y su email laboral.</li>
                <li>Cuando cambie el estado vas a poder operar desde este mismo panel.</li>
                <li>Mientras tanto, la sesión queda disponible para seguimiento y cierre.</li>
              </ul>
            </section>
          </main>
        )}
      </div>
    </div>
  );
}
