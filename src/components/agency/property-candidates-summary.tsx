import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PropertyCandidatesSummaryProps = {
  propertyId: string;
  total: number;
  platformCount: number;
  manualCount: number;
  averageScore: number | null;
  bestCandidate:
    | {
        name: string;
        score: number;
        source: "PLATFORM" | "MANUAL";
      }
    | null;
};

export function PropertyCandidatesSummary({
  propertyId,
  total,
  platformCount,
  manualCount,
  averageScore,
  bestCandidate,
}: PropertyCandidatesSummaryProps) {
  return (
    <div className="bg-background rounded-4xl border p-8 shadow-sm">
      <p className="text-sm tracking-[0.22em] text-sky-700 uppercase">Candidatos</p>
      <h2 className="mt-3 text-2xl font-semibold">Resumen de postulaciones</h2>
      <p className="text-muted-foreground mt-3 text-sm leading-7">
        Consolida postulaciones manuales y de plataforma tomadas sobre esta propiedad.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border p-4">
          <p className="text-muted-foreground text-sm">Total</p>
          <p className="mt-2 text-2xl font-semibold">{total}</p>
        </div>
        <div className="rounded-3xl border p-4">
          <p className="text-muted-foreground text-sm">Score promedio</p>
          <p className="mt-2 text-2xl font-semibold">{averageScore ?? "-"}</p>
        </div>
        <div className="rounded-3xl border p-4">
          <p className="text-muted-foreground text-sm">Mejor score</p>
          <p className="mt-2 text-2xl font-semibold">{bestCandidate?.score ?? "-"}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-3">
        <div className="rounded-3xl border p-4">
          <p className="font-medium">Origen de candidaturas</p>
          <p className="text-muted-foreground mt-2 text-sm">
            {platformCount} plataforma · {manualCount} carga manual
          </p>
        </div>

        {bestCandidate ? (
          <div className="rounded-3xl border p-4">
            <p className="font-medium">Mejor perfil actual</p>
            <p className="mt-2 text-sm font-semibold">{bestCandidate.name}</p>
            <p className="text-muted-foreground mt-1 text-sm">
              {bestCandidate.source === "PLATFORM" ? "Plataforma" : "Carga manual"} · Score{" "}
              {bestCandidate.score}
            </p>
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed p-4">
            <p className="font-medium">Todavía no hay postulaciones</p>
            <p className="text-muted-foreground mt-2 text-sm">
              Esta propiedad ya está lista para recibir candidatos desde plataforma o carga manual.
            </p>
          </div>
        )}
      </div>

      <Link
        href={`/agency/properties/${propertyId}/candidates`}
        className={cn(buttonVariants({ size: "lg" }), "mt-6 rounded-2xl")}
      >
        Abrir candidatos
      </Link>
    </div>
  );
}
