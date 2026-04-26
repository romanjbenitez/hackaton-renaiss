import type { PropertyType } from "@prisma/client";

import { PropertyCard } from "@/components/tenant/property-card";

type PropertiesCatalogProps = {
  hasCompleteProfile: boolean;
  message?: string;
  error?: string;
  applyAction: (formData: FormData) => void | Promise<void>;
  properties: Array<{
    id: string;
    title: string;
    addressLine: string;
    city?: string;
    price: number;
    squareMeters: number | null;
    propertyType: PropertyType;
    photos: string[];
    compatibility: {
      compatibilityScore: number;
      explanation: string;
      matchPoints: string[];
      conflicts: string[];
    } | null;
    latestApplication?: {
      status: string;
    } | null;
  }>;
};

export function PropertiesCatalog({
  hasCompleteProfile,
  message,
  error,
  applyAction,
  properties,
}: PropertiesCatalogProps) {
  return (
    <main className="space-y-6">
      <section className="bg-background rounded-4xl border p-8 shadow-sm">
        <p className="text-sm tracking-[0.22em] text-emerald-700 uppercase">Propiedades</p>
        <h1 className="mt-4 text-4xl font-semibold">Opciones compatibles con tu perfil</h1>
        {message ? (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
            {message}
          </div>
        ) : null}
        {error ? (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-950">
            {error}
          </div>
        ) : null}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        {properties.map((property) => (
          <PropertyCard
            key={property.id}
            propertyId={property.id}
            title={property.title}
            addressLine={
              property.city ? `${property.addressLine}, ${property.city}` : property.addressLine
            }
            price={property.price}
            squareMeters={property.squareMeters ?? 0}
            propertyType={property.propertyType}
            compatibilityScore={property.compatibility?.compatibilityScore ?? 0}
            compatibilityExplanation={property.compatibility?.explanation}
            compatibilityMatchPoints={property.compatibility?.matchPoints}
            compatibilityConflicts={property.compatibility?.conflicts}
            photoUrl={property.photos[0]}
            canApply={hasCompleteProfile}
            applyAction={applyAction}
            applicationStatus={property.latestApplication?.status ?? null}
          />
        ))}
      </section>
    </main>
  );
}
