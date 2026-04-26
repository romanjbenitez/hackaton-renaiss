import { cn } from "@/lib/utils";
import { getSurfaceToneClasses } from "@/lib/ui";
import { getTrustScoreLabel, getTrustScoreTone } from "@/lib/tenant/scoring";

type TrustScoreBadgeProps = {
  score: number;
  className?: string;
};

const toneClasses = {
  emerald: getSurfaceToneClasses("success"),
  sky: getSurfaceToneClasses("info"),
  amber: getSurfaceToneClasses("warning"),
  rose: getSurfaceToneClasses("danger"),
} as const;

export function TrustScoreBadge({ score, className }: TrustScoreBadgeProps) {
  const tone = getTrustScoreTone(score);
  const label = getTrustScoreLabel(score);

  return (
    <div
      className={cn(
        "inline-flex items-center gap-3 rounded-full border px-4 py-2 text-sm font-medium",
        toneClasses[tone],
        className
      )}
    >
      <span className="text-lg font-semibold">{score}</span>
      <span>{label}</span>
    </div>
  );
}
