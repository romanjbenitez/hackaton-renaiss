import { CompatibilityBadge } from "@/components/ui/compatibility-badge";
import { AlertBanner } from "@/components/ui/alert-banner";
import { buttonVariants } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { cn } from "@/lib/utils";

type PropertyCardProps = {
  propertyId: string;
  title: string;
  addressLine: string;
  price: number;
  squareMeters: number;
  propertyType: string;
  compatibilityScore: number;
  compatibilitySummary?: string;
  compatibilityExplanation?: string;
  compatibilityMatchPoints?: string[];
  compatibilityConflicts?: string[];
  photoUrl?: string;
  canApply: boolean;
  applyAction: (formData: FormData) => void | Promise<void>;
  applicationStatus?: string | null;
};

export function PropertyCard({
  propertyId,
  title,
  addressLine,
  price,
  squareMeters,
  propertyType,
  compatibilityScore,
  compatibilitySummary,
  compatibilityExplanation,
  compatibilityMatchPoints,
  compatibilityConflicts,
  photoUrl,
  canApply,
  applyAction,
  applicationStatus,
}: PropertyCardProps) {
  return (
    <article className="bg-background overflow-hidden rounded-4xl border shadow-sm">
      <div className="bg-muted aspect-[16/10] w-full">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt={title} className="h-full w-full object-cover" />
        ) : null}
      </div>

      <div className="space-y-5 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm tracking-[0.2em] text-emerald-700 uppercase">{propertyType}</p>
            <h2 className="mt-3 text-2xl font-semibold">{title}</h2>
            <p className="text-muted-foreground mt-2">{addressLine}</p>
          </div>
          <CompatibilityBadge
            score={compatibilityScore}
            explanation={compatibilityExplanation}
            matchPoints={compatibilityMatchPoints}
            conflicts={compatibilityConflicts}
          />
        </div>

        <div className="grid gap-3 text-sm md:grid-cols-2">
          <StatCard label="Precio" value={`$${price.toLocaleString("es-AR")}`} />
          <StatCard label="Superficie" value={`${squareMeters} m²`} />
        </div>

        {compatibilitySummary ? (
          <AlertBanner tone="success">
            {compatibilitySummary}
          </AlertBanner>
        ) : null}

        {applicationStatus ? (
          <AlertBanner tone="info" className="font-medium">
            Ya postulada: {applicationStatus}
          </AlertBanner>
        ) : (
          <form action={applyAction}>
            <input type="hidden" name="propertyId" value={propertyId} />
            <button
              className={cn(buttonVariants({ size: "lg" }), "w-full rounded-2xl")}
              type="submit"
              disabled={!canApply}
            >
              {canApply ? "Postularme" : "Completá tu perfil para postularte"}
            </button>
          </form>
        )}
      </div>
    </article>
  );
}
