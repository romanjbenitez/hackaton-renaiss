"use client";

import { useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CandidateSummaryResult = {
  summary: string;
  topCandidateId: string;
  highlights: Array<{ candidateId: string; strength: string }>;
};

type CandidateSummaryPanelProps = {
  propertyId: string;
  candidates?: Array<{
    id: string;
    label: string;
  }>;
};

export function CandidateSummaryPanel({ propertyId, candidates = [] }: CandidateSummaryPanelProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [result, setResult] = useState<CandidateSummaryResult | null>(null);

  async function generateSummary() {
    setStatus("loading");
    try {
      const response = await fetch("/api/ai/candidates-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId, limit: 5 }),
      });

      if (!response.ok) throw new Error("Error al generar el resumen");

      const data = (await response.json()) as CandidateSummaryResult;
      setResult(data);
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  function resolveLabel(candidateId: string) {
    return candidates.find((candidate) => candidate.id === candidateId)?.label ?? candidateId;
  }

  return (
    <div className="bg-background rounded-4xl border p-8 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm tracking-[0.22em] text-sky-700 uppercase">Resumen IA</p>
          <h2 className="mt-3 text-2xl font-semibold">Análisis comparativo de candidatos</h2>
          <p className="text-muted-foreground mt-2 text-sm leading-7">
            GROK analiza los candidatos de esta propiedad y genera un resumen comparativo con el
            perfil más fuerte destacado.
          </p>
        </div>

        {status !== "loading" ? (
          <button
            className={cn(buttonVariants({ variant: status === "done" ? "outline" : "default" }), "rounded-2xl")}
            type="button"
            onClick={generateSummary}
          >
            {status === "done" ? "Regenerar resumen" : "Generar resumen IA"}
          </button>
        ) : (
          <div className="flex items-center gap-3 text-sm text-sky-700">
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-sky-700 border-t-transparent" />
            Analizando candidatos…
          </div>
        )}
      </div>

      {status === "loading" ? (
        <div className="mt-6 space-y-4">
          <div className="h-4 w-full animate-pulse rounded-2xl bg-zinc-100" />
          <div className="h-4 w-5/6 animate-pulse rounded-2xl bg-zinc-100" />
          <div className="h-4 w-4/6 animate-pulse rounded-2xl bg-zinc-100" />
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-3xl bg-zinc-100" />
            ))}
          </div>
        </div>
      ) : null}

      {status === "error" ? (
        <div className="mt-6 rounded-3xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-900">
          No se pudo generar el resumen. Revisá la conexión con el modelo de IA y volvé a intentar.
        </div>
      ) : null}

      {status === "done" && result ? (
        <div className="mt-6 space-y-5">
          <div className="bg-muted/40 rounded-3xl border p-5">
            <p className="text-sm font-medium">Síntesis comparativa</p>
            <p className="text-muted-foreground mt-3 text-sm leading-7">{result.summary}</p>
          </div>

          {result.highlights.length > 0 ? (
            <div>
              <p className="text-sm font-medium">Fortalezas por candidato</p>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {result.highlights.map((highlight) => (
                  <article
                    key={highlight.candidateId}
                    className="rounded-3xl border border-sky-100 bg-sky-50/60 p-4"
                  >
                    <p className="text-xs text-sky-700 uppercase tracking-wider">
                      {resolveLabel(highlight.candidateId)}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-sky-950">{highlight.strength}</p>
                  </article>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {status === "idle" ? (
        <div className="mt-6 rounded-3xl border border-dashed p-5 text-center text-sm text-zinc-500">
          Hacé clic en &quot;Generar resumen IA&quot; para analizar los candidatos de esta propiedad con GROK.
        </div>
      ) : null}
    </div>
  );
}
