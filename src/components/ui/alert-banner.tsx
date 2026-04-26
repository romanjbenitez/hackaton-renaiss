import { cn } from "@/lib/utils";
import { getSurfaceToneClasses, type SemanticTone } from "@/lib/ui";

type AlertBannerProps = {
  children: React.ReactNode;
  tone?: SemanticTone;
  className?: string;
};

export function AlertBanner({
  children,
  tone = "neutral",
  className,
}: AlertBannerProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-3 text-sm",
        getSurfaceToneClasses(tone),
        className
      )}
    >
      {children}
    </div>
  );
}

