import { cn } from "@/lib/utils";
import { getSurfaceToneClasses } from "@/lib/ui";

type CompatibilityBadgeProps = {
  score: number | null | undefined;
  explanation?: string | null;
  matchPoints?: string[];
  conflicts?: string[];
  className?: string;
};

function getTone(score: number) {
  if (score >= 80) return getSurfaceToneClasses("success");
  if (score >= 65) return getSurfaceToneClasses("info");
  if (score >= 45) return getSurfaceToneClasses("warning");
  return getSurfaceToneClasses("danger");
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
          "inline-flex items-center rounded-full border px-4 py-1 text-sm font-medium",
          getSurfaceToneClasses("neutral"),
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
