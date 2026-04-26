import { cn } from "@/lib/utils";
import { getTrustScoreLabel, getTrustScoreTone } from "@/lib/tenant/scoring";

type TrustScoreBadgeProps = {
  score: number;
  className?: string;
};

const toneClasses = {
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-950",
  sky: "border-sky-200 bg-sky-50 text-sky-950",
  amber: "border-amber-200 bg-amber-50 text-amber-950",
  rose: "border-rose-200 bg-rose-50 text-rose-950",
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
