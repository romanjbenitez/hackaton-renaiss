import { CompatibilityBadge } from "@/components/ui/compatibility-badge";
import { buttonVariants } from "@/components/ui/button";
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
          <div className="rounded-2xl border p-3">
            <p className="text-muted-foreground">Precio</p>
            <p className="mt-1 font-medium">${price.toLocaleString("es-AR")}</p>
          </div>
          <div className="rounded-2xl border p-3">
            <p className="text-muted-foreground">Superficie</p>
            <p className="mt-1 font-medium">{squareMeters} m²</p>
          </div>
        </div>

        {compatibilitySummary ? (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
            {compatibilitySummary}
          </div>
        ) : null}

        {applicationStatus ? (
          <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-medium text-sky-950">
            Ya postulada: {applicationStatus}
          </div>
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
