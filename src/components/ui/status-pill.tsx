import { cn } from "@/lib/utils";
import { getSurfaceToneClasses, type SemanticTone } from "@/lib/ui";

type StatusPillProps = {
  children: React.ReactNode;
  tone?: SemanticTone;
  className?: string;
};

export function StatusPill({
  children,
  tone = "neutral",
  className,
}: StatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium",
        getSurfaceToneClasses(tone),
        className
      )}
    >
      {children}
    </span>
  );
}

