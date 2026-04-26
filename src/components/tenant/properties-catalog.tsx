"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { PropertyType } from "@prisma/client";

import { PropertyCard } from "@/components/tenant/property-card";
import { AlertBanner } from "@/components/ui/alert-banner";
import { buttonVariants } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/status-pill";
import {
  getPropertyTypeLabel,
  matchesPriceRange,
  priceRangeLabels,
  propertySortLabels,
  type PriceRangeFilter,
  type PropertySort,
  type RuleFilter,
} from "@/lib/catalogs/property";
import { cn } from "@/lib/utils";
import { inputClassName } from "@/lib/ui";

type PropertyRecord = {
  id: string;
  title: string;
  addressLine: string;
  city?: string;
  price: number;
  squareMeters: number | null;
  propertyType: PropertyType;
  photos: string[];
  acceptsPets?: boolean;
  acceptsSmokers?: boolean;
  acceptsChildren?: boolean;
  compatibility: {
    compatibilityScore: number;
    explanation: string;
    matchPoints: string[];
    conflicts: string[];
  } | null;
  latestApplication?: {
    status: string;
  } | null;
};

type PropertiesCatalogProps = {
  hasCompleteProfile: boolean;
  message?: string;
  error?: string;
  applyAction: (formData: FormData) => void | Promise<void>;
  properties: PropertyRecord[];
};

type CatalogFilters = {
  sort: PropertySort;
  propertyType: string;
  query: string;
  city: string;
  priceRange: PriceRangeFilter;
  pets: RuleFilter;
  smokers: RuleFilter;
  children: RuleFilter;
  onlyAvailable: boolean;
};

type ActiveFilter = {
  key: keyof CatalogFilters;
  label: string;
  reset: Partial<CatalogFilters>;
};

const defaultFilters: CatalogFilters = {
  sort: "compatibility_desc",
  propertyType: "all",
  query: "",
  city: "all",
  priceRange: "all",
  pets: "all",
  smokers: "all",
  children: "all",
  onlyAvailable: false,
};

function parseFilters(searchParams: Pick<URLSearchParams, "get">): CatalogFilters {
  return {
    sort: (searchParams.get("sort") as PropertySort | null) ?? defaultFilters.sort,
    propertyType: searchParams.get("type") ?? defaultFilters.propertyType,
    query: searchParams.get("q") ?? defaultFilters.query,
    city: searchParams.get("city") ?? defaultFilters.city,
    priceRange: (searchParams.get("price") as PriceRangeFilter | null) ?? defaultFilters.priceRange,
    pets: (searchParams.get("pets") as RuleFilter | null) ?? defaultFilters.pets,
    smokers: (searchParams.get("smokers") as RuleFilter | null) ?? defaultFilters.smokers,
    children: (searchParams.get("children") as RuleFilter | null) ?? defaultFilters.children,
    onlyAvailable: searchParams.get("available") === "1",
  };
}

function buildCompatibilitySummary(property: PropertyRecord) {
  const score = property.compatibility?.compatibilityScore ?? 0;
  const matchPoint = property.compatibility?.matchPoints[0];
  const conflict = property.compatibility?.conflicts[0];

  if (score >= 80 && matchPoint) return `Buen match: ${matchPoint}.`;
  if (score >= 60 && matchPoint) return `Compatibilidad sólida: ${matchPoint}.`;
  if (conflict) return `Atención: ${conflict}.`;

  return property.compatibility?.explanation ?? null;
}

function getPriceRangeLabel(priceRange: PriceRangeFilter) {
  return priceRange === "all" ? "Cualquier precio" : priceRangeLabels[priceRange];
}

function matchesRuleFilter(value: boolean | undefined, filter: RuleFilter) {
  if (filter === "all") return true;
  if (filter === "yes") return Boolean(value);
  return !value;
}

function getFilteredProperties(properties: PropertyRecord[], filters: CatalogFilters) {
  return properties.filter((property) => {
    const haystack = `${property.title} ${property.addressLine} ${property.city ?? ""}`.toLowerCase();
    const normalizedQuery = filters.query.toLowerCase();

    if (normalizedQuery && !haystack.includes(normalizedQuery)) return false;
    if (filters.propertyType !== "all" && property.propertyType !== filters.propertyType) return false;
    if (filters.city !== "all" && property.city !== filters.city) return false;
    if (filters.onlyAvailable && property.latestApplication) return false;
    if (!matchesPriceRange(property.price, filters.priceRange)) return false;
    if (!matchesRuleFilter(property.acceptsPets, filters.pets)) return false;
    if (!matchesRuleFilter(property.acceptsSmokers, filters.smokers)) return false;
    if (!matchesRuleFilter(property.acceptsChildren, filters.children)) return false;

    return true;
  });
}

function getSortedProperties(properties: PropertyRecord[], sort: PropertySort) {
  return [...properties].sort((left, right) => {
    switch (sort) {
      case "price_asc":
        return left.price - right.price;
      case "price_desc":
        return right.price - left.price;
      case "recent_desc":
        return 0;
      default: {
        const compatibilityDelta =
          (right.compatibility?.compatibilityScore ?? 0) - (left.compatibility?.compatibilityScore ?? 0);

        return compatibilityDelta !== 0 ? compatibilityDelta : left.price - right.price;
      }
    }
  });
}

function buildActiveFilters(filters: CatalogFilters): ActiveFilter[] {
  return [
    filters.sort !== defaultFilters.sort
      ? { key: "sort", label: `Orden: ${propertySortLabels[filters.sort]}`, reset: { sort: defaultFilters.sort } }
      : null,
    filters.propertyType !== defaultFilters.propertyType
      ? {
          key: "propertyType",
          label: `Tipo: ${getPropertyTypeLabel(filters.propertyType)}`,
          reset: { propertyType: defaultFilters.propertyType },
        }
      : null,
    filters.query
      ? { key: "query", label: `Búsqueda: ${filters.query}`, reset: { query: defaultFilters.query } }
      : null,
    filters.city !== defaultFilters.city
      ? { key: "city", label: `Ciudad: ${filters.city}`, reset: { city: defaultFilters.city } }
      : null,
    filters.priceRange !== defaultFilters.priceRange
      ? {
          key: "priceRange",
          label: `Precio: ${getPriceRangeLabel(filters.priceRange)}`,
          reset: { priceRange: defaultFilters.priceRange },
        }
      : null,
    filters.pets !== defaultFilters.pets
      ? {
          key: "pets",
          label: filters.pets === "yes" ? "Acepta mascotas" : "No acepta mascotas",
          reset: { pets: defaultFilters.pets },
        }
      : null,
    filters.smokers !== defaultFilters.smokers
      ? {
          key: "smokers",
          label: filters.smokers === "yes" ? "Acepta fumadores" : "No acepta fumadores",
          reset: { smokers: defaultFilters.smokers },
        }
      : null,
    filters.children !== defaultFilters.children
      ? {
          key: "children",
          label: filters.children === "yes" ? "Acepta niños" : "No acepta niños",
          reset: { children: defaultFilters.children },
        }
      : null,
    filters.onlyAvailable
      ? { key: "onlyAvailable", label: "Solo no postuladas", reset: { onlyAvailable: false } }
      : null,
  ].filter(Boolean) as ActiveFilter[];
}

export function PropertiesCatalog({
  hasCompleteProfile,
  message,
  error,
  applyAction,
  properties,
}: PropertiesCatalogProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filters = useMemo(() => parseFilters(searchParams), [searchParams]);

  function updateFilters(nextValues: Partial<CatalogFilters>) {
    const params = new URLSearchParams(searchParams.toString());
    const merged = { ...filters, ...nextValues };

    const mappings: Array<[string, string | boolean, string | boolean]> = [
      ["sort", merged.sort, defaultFilters.sort],
      ["type", merged.propertyType, defaultFilters.propertyType],
      ["q", merged.query, defaultFilters.query],
      ["city", merged.city, defaultFilters.city],
      ["price", merged.priceRange, defaultFilters.priceRange],
      ["pets", merged.pets, defaultFilters.pets],
      ["smokers", merged.smokers, defaultFilters.smokers],
      ["children", merged.children, defaultFilters.children],
      ["available", merged.onlyAvailable, defaultFilters.onlyAvailable],
    ];

    for (const [key, value, fallback] of mappings) {
      if (String(value) === String(fallback)) {
        params.delete(key);
      } else {
        params.set(key, value === true ? "1" : String(value));
      }
    }

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  const availableCities = useMemo(
    () =>
      Array.from(new Set(properties.map((property) => property.city).filter(Boolean))).sort((a, b) =>
        String(a).localeCompare(String(b), "es")
      ),
    [properties]
  );
  const availablePropertyTypes = useMemo(
    () =>
      Array.from(new Set(properties.map((property) => property.propertyType))).sort((a, b) =>
        a.localeCompare(b, "es")
      ),
    [properties]
  );
  const activeFilters = useMemo(() => buildActiveFilters(filters), [filters]);
  const sortedProperties = useMemo(() => {
    return getSortedProperties(getFilteredProperties(properties, filters), filters.sort);
  }, [filters, properties]);

  return (
    <main className="space-y-6">
      <section className="bg-background rounded-4xl border p-8 shadow-sm">
        <p className="text-sm tracking-[0.22em] text-emerald-700 uppercase">Propiedades</p>
        <h1 className="mt-4 text-4xl font-semibold">Opciones compatibles con tu perfil</h1>

        {message ? <AlertBanner tone="success" className="mt-6">{message}</AlertBanner> : null}
        {error ? <AlertBanner tone="danger" className="mt-6">{error}</AlertBanner> : null}

        <div className="mt-6 grid gap-4 xl:grid-cols-[1.4fr_0.6fr]">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <label className="block space-y-2 md:col-span-2 xl:col-span-1">
              <span className="text-sm font-medium">Buscar</span>
              <input
                className={inputClassName}
                value={filters.query}
                onChange={(event) => updateFilters({ query: event.target.value })}
                placeholder="Título, calle o ciudad"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium">Tipo</span>
              <select
                className={inputClassName}
                value={filters.propertyType}
                onChange={(event) => updateFilters({ propertyType: event.target.value })}
              >
                <option value="all">Todos</option>
                {availablePropertyTypes.map((propertyType) => (
                  <option key={propertyType} value={propertyType}>
                    {getPropertyTypeLabel(propertyType)}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium">Ciudad</span>
              <select
                className={inputClassName}
                value={filters.city}
                onChange={(event) => updateFilters({ city: event.target.value })}
              >
                <option value="all">Todas</option>
                {availableCities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium">Precio</span>
              <select
                className={inputClassName}
                value={filters.priceRange}
                onChange={(event) => updateFilters({ priceRange: event.target.value as PriceRangeFilter })}
              >
                <option value="all">Cualquier precio</option>
                {Object.entries(priceRangeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-3 rounded-2xl border px-4 py-3">
              <input
                type="checkbox"
                checked={filters.onlyAvailable}
                onChange={(event) => updateFilters({ onlyAvailable: event.target.checked })}
              />
              <span className="text-sm font-medium">Solo no postuladas</span>
            </label>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-medium">Ordenar por</span>
            <select
              className={inputClassName}
              value={filters.sort}
              onChange={(event) => updateFilters({ sort: event.target.value as PropertySort })}
            >
              {Object.entries(propertySortLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <label className="block space-y-2">
            <span className="text-sm font-medium">Mascotas</span>
            <select
              className={inputClassName}
              value={filters.pets}
              onChange={(event) => updateFilters({ pets: event.target.value as RuleFilter })}
            >
              <option value="all">Indistinto</option>
              <option value="yes">Acepta mascotas</option>
              <option value="no">No acepta mascotas</option>
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium">Fumadores</span>
            <select
              className={inputClassName}
              value={filters.smokers}
              onChange={(event) => updateFilters({ smokers: event.target.value as RuleFilter })}
            >
              <option value="all">Indistinto</option>
              <option value="yes">Acepta fumadores</option>
              <option value="no">No acepta fumadores</option>
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium">Niños</span>
            <select
              className={inputClassName}
              value={filters.children}
              onChange={(event) => updateFilters({ children: event.target.value as RuleFilter })}
            >
              <option value="all">Indistinto</option>
              <option value="yes">Acepta niños</option>
              <option value="no">No acepta niños</option>
            </select>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div className="text-muted-foreground text-sm">
            {sortedProperties.length} propiedad{sortedProperties.length === 1 ? "" : "es"} disponibles
          </div>
          {activeFilters.length > 0 ? (
            <button
              type="button"
              onClick={() => router.replace(pathname, { scroll: false })}
              className={cn(buttonVariants({ variant: "outline" }), "rounded-2xl")}
            >
              Limpiar filtros
            </button>
          ) : null}
        </div>

        {activeFilters.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {activeFilters.map((filter) => (
              <button
                key={filter.key}
                type="button"
                onClick={() => updateFilters(filter.reset)}
              >
                <StatusPill tone="success" className="text-sm">
                  {filter.label} ×
                </StatusPill>
              </button>
            ))}
          </div>
        ) : null}

        {!sortedProperties.length ? (
          <AlertBanner tone="neutral" className="mt-6 rounded-3xl text-slate-600">
            No hay propiedades que coincidan con los filtros actuales.
          </AlertBanner>
        ) : null}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        {sortedProperties.map((property) => (
          <PropertyCard
            key={property.id}
            propertyId={property.id}
            title={property.title}
            addressLine={property.city ? `${property.addressLine}, ${property.city}` : property.addressLine}
            price={property.price}
            squareMeters={property.squareMeters ?? 0}
            propertyType={getPropertyTypeLabel(property.propertyType)}
            compatibilityScore={property.compatibility?.compatibilityScore ?? 0}
            compatibilitySummary={buildCompatibilitySummary(property) ?? undefined}
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
