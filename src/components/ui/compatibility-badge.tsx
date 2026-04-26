import { cn } from "@/lib/utils";

type CompatibilityBadgeProps = {
  score: number | null | undefined;
  explanation?: string | null;
  matchPoints?: string[];
  conflicts?: string[];
  className?: string;
};

function getTone(score: number) {
  if (score >= 80) return "border-emerald-200 bg-emerald-50 text-emerald-950";
  if (score >= 65) return "border-sky-200 bg-sky-50 text-sky-950";
  if (score >= 45) return "border-amber-200 bg-amber-50 text-amber-950";
  return "border-rose-200 bg-rose-50 text-rose-950";
}

export function CompatibilityBadge({
  score,
  explanation,
  matchPoints = [],
  conflicts = [],
  className,
}: CompatibilityBadgeProps) {
  if (score == null) {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-4 py-1 text-sm font-medium text-zinc-700",
          className
        )}
      >
        Compatibilidad pendiente
      </span>
    );
  }

  const visiblePoints = [...matchPoints.slice(0, 2), ...conflicts.slice(0, 2)];

  return (
    <div className={cn("group relative inline-flex", className)}>
      <span
        className={cn(
          "inline-flex items-center rounded-full border px-4 py-1 text-sm font-medium",
          getTone(score)
        )}
      >
        Compatibilidad {score}%
      </span>

      {(explanation || visiblePoints.length > 0) ? (
        <div className="pointer-events-none absolute top-full left-1/2 z-20 mt-3 hidden w-72 -translate-x-1/2 rounded-3xl border bg-white p-4 text-left shadow-xl group-hover:block group-focus-within:block">
          {explanation ? <p className="text-sm leading-6 text-zinc-800">{explanation}</p> : null}
          {visiblePoints.length > 0 ? (
            <ul className="mt-3 space-y-2 text-xs leading-5 text-zinc-600">
              {visiblePoints.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
