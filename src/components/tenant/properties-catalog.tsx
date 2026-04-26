"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { PropertyType } from "@prisma/client";

import { buttonVariants } from "@/components/ui/button";
import { PropertyCard } from "@/components/tenant/property-card";
import { cn } from "@/lib/utils";

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
  }>;
};

type PropertySort = "compatibility_desc" | "price_asc" | "price_desc" | "recent_desc";
type RuleFilter = "all" | "yes" | "no";

function getPropertyTypeLabel(propertyType: string) {
  switch (propertyType) {
    case "APARTMENT":
      return "Departamento";
    case "HOUSE":
      return "Casa";
    case "PH":
      return "PH";
    case "STUDIO":
      return "Monoambiente";
    case "OFFICE":
      return "Oficina";
    case "COMMERCIAL":
      return "Local";
    case "LAND":
      return "Lote";
    default:
      return propertyType;
  }
}

function getSortLabel(sort: PropertySort) {
  switch (sort) {
    case "price_asc":
      return "Menor precio";
    case "price_desc":
      return "Mayor precio";
    case "recent_desc":
      return "Más recientes";
    default:
      return "Mayor compatibilidad";
  }
}

function getPriceRangeLabel(value: string) {
  switch (value) {
    case "up_to_400k":
      return "Hasta $400.000";
    case "400k_to_800k":
      return "$400.000 a $800.000";
    case "800k_to_1500k":
      return "$800.000 a $1.500.000";
    case "more_than_1500k":
      return "Más de $1.500.000";
    default:
      return value;
  }
}

function buildCompatibilitySummary(property: PropertiesCatalogProps["properties"][number]) {
  const score = property.compatibility?.compatibilityScore ?? 0;
  const matchPoint = property.compatibility?.matchPoints?.[0];
  const conflict = property.compatibility?.conflicts?.[0];

  if (score >= 80 && matchPoint) {
    return `Buen match: ${matchPoint}.`;
  }

  if (score >= 60 && matchPoint) {
    return `Compatibilidad sólida: ${matchPoint}.`;
  }

  if (conflict) {
    return `Atención: ${conflict}.`;
  }

  return property.compatibility?.explanation ?? null;
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
  const [sort, setSort] = useState<PropertySort>("compatibility_desc");
  const [propertyTypeFilter, setPropertyTypeFilter] = useState<string>("all");
  const [searchFilter, setSearchFilter] = useState("");
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [priceRangeFilter, setPriceRangeFilter] = useState<string>("all");
  const [petsFilter, setPetsFilter] = useState<RuleFilter>("all");
  const [smokersFilter, setSmokersFilter] = useState<RuleFilter>("all");
  const [childrenFilter, setChildrenFilter] = useState<RuleFilter>("all");
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  useEffect(() => {
    const nextSort = (searchParams.get("sort") as PropertySort | null) ?? "compatibility_desc";
    setSort(nextSort);
    setSearchFilter(searchParams.get("q") ?? "");
    setPropertyTypeFilter(searchParams.get("type") ?? "all");
    setCityFilter(searchParams.get("city") ?? "all");
    setPriceRangeFilter(searchParams.get("price") ?? "all");
    setPetsFilter((searchParams.get("pets") as RuleFilter | null) ?? "all");
    setSmokersFilter((searchParams.get("smokers") as RuleFilter | null) ?? "all");
    setChildrenFilter((searchParams.get("children") as RuleFilter | null) ?? "all");
    setOnlyAvailable(searchParams.get("available") === "1");
  }, [searchParams]);

  function updateQuery(nextValues: {
    sort?: PropertySort;
    type?: string;
    q?: string;
    city?: string;
    price?: string;
    pets?: RuleFilter;
    smokers?: RuleFilter;
    children?: RuleFilter;
    available?: boolean;
  }) {
    const params = new URLSearchParams(searchParams.toString());
    const entries: Array<[string, string | boolean | undefined, string | boolean]> = [
      ["sort", nextValues.sort, "compatibility_desc"],
      ["q", nextValues.q, ""],
      ["type", nextValues.type, "all"],
      ["city", nextValues.city, "all"],
      ["price", nextValues.price, "all"],
      ["pets", nextValues.pets, "all"],
      ["smokers", nextValues.smokers, "all"],
      ["children", nextValues.children, "all"],
      ["available", nextValues.available, false],
    ];

    for (const [key, value, fallback] of entries) {
      if (value === undefined) {
        continue;
      }

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

  const activeFilters = [
    sort !== "compatibility_desc"
      ? { key: "sort", label: `Orden: ${getSortLabel(sort)}` }
      : null,
    propertyTypeFilter !== "all"
      ? { key: "type", label: `Tipo: ${getPropertyTypeLabel(propertyTypeFilter)}` }
      : null,
    searchFilter ? { key: "q", label: `Búsqueda: ${searchFilter}` } : null,
    cityFilter !== "all" ? { key: "city", label: `Ciudad: ${cityFilter}` } : null,
    priceRangeFilter !== "all"
      ? { key: "price", label: `Precio: ${getPriceRangeLabel(priceRangeFilter)}` }
      : null,
    petsFilter !== "all"
      ? { key: "pets", label: petsFilter === "yes" ? "Acepta mascotas" : "No acepta mascotas" }
      : null,
    smokersFilter !== "all"
      ? {
          key: "smokers",
          label: smokersFilter === "yes" ? "Acepta fumadores" : "No acepta fumadores",
        }
      : null,
    childrenFilter !== "all"
      ? {
          key: "children",
          label: childrenFilter === "yes" ? "Acepta niños" : "No acepta niños",
        }
      : null,
    onlyAvailable ? { key: "available", label: "Solo no postuladas" } : null,
  ].filter(Boolean) as Array<{ key: string; label: string }>;

  const filteredProperties = properties.filter((property) => {
    if (searchFilter) {
      const haystack = `${property.title} ${property.addressLine} ${property.city ?? ""}`.toLowerCase();
      if (!haystack.includes(searchFilter.toLowerCase())) {
        return false;
      }
    }

    if (propertyTypeFilter !== "all" && property.propertyType !== propertyTypeFilter) {
      return false;
    }

    if (cityFilter !== "all" && property.city !== cityFilter) {
      return false;
    }

    if (onlyAvailable && property.latestApplication) {
      return false;
    }

    if (priceRangeFilter === "up_to_400k" && property.price > 400000) {
      return false;
    }

    if (priceRangeFilter === "400k_to_800k" && (property.price < 400000 || property.price > 800000)) {
      return false;
    }

    if (priceRangeFilter === "800k_to_1500k" && (property.price < 800000 || property.price > 1500000)) {
      return false;
    }

    if (priceRangeFilter === "more_than_1500k" && property.price < 1500000) {
      return false;
    }

    if (petsFilter === "yes" && !property.acceptsPets) {
      return false;
    }

    if (petsFilter === "no" && property.acceptsPets) {
      return false;
    }

    if (smokersFilter === "yes" && !property.acceptsSmokers) {
      return false;
    }

    if (smokersFilter === "no" && property.acceptsSmokers) {
      return false;
    }

    if (childrenFilter === "yes" && !property.acceptsChildren) {
      return false;
    }

    if (childrenFilter === "no" && property.acceptsChildren) {
      return false;
    }

    return true;
  });

  const sortedProperties = [...filteredProperties].sort((left, right) => {
    if (sort === "price_asc") {
      return left.price - right.price;
    }

    if (sort === "price_desc") {
      return right.price - left.price;
    }

    if (sort === "recent_desc") {
      return 0;
    }

    const compatibilityDelta =
      (right.compatibility?.compatibilityScore ?? 0) - (left.compatibility?.compatibilityScore ?? 0);

    if (compatibilityDelta !== 0) {
      return compatibilityDelta;
    }

    return left.price - right.price;
  });

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

        <div className="mt-6 grid gap-4 xl:grid-cols-[1.4fr_0.6fr]">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <label className="block space-y-2 md:col-span-2 xl:col-span-1">
              <span className="text-sm font-medium">Buscar</span>
              <input
                className="border-input bg-background h-11 w-full rounded-2xl border px-4"
                value={searchFilter}
                onChange={(event) => updateQuery({ q: event.target.value })}
                placeholder="Título, calle o ciudad"
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium">Tipo</span>
              <select
                className="border-input bg-background h-11 w-full rounded-2xl border px-4"
                value={propertyTypeFilter}
                onChange={(event) => updateQuery({ type: event.target.value })}
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
                className="border-input bg-background h-11 w-full rounded-2xl border px-4"
                value={cityFilter}
                onChange={(event) => updateQuery({ city: event.target.value })}
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
                className="border-input bg-background h-11 w-full rounded-2xl border px-4"
                value={priceRangeFilter}
                onChange={(event) => updateQuery({ price: event.target.value })}
              >
                <option value="all">Cualquier precio</option>
                <option value="up_to_400k">Hasta $400.000</option>
                <option value="400k_to_800k">$400.000 a $800.000</option>
                <option value="800k_to_1500k">$800.000 a $1.500.000</option>
                <option value="more_than_1500k">Más de $1.500.000</option>
              </select>
            </label>

            <label className="flex items-center gap-3 rounded-2xl border px-4 py-3">
              <input
                type="checkbox"
                checked={onlyAvailable}
                onChange={(event) => updateQuery({ available: event.target.checked })}
              />
              <span className="text-sm font-medium">Solo no postuladas</span>
            </label>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-medium">Ordenar por</span>
            <select
              className="border-input bg-background h-11 w-full rounded-2xl border px-4"
              value={sort}
              onChange={(event) => updateQuery({ sort: event.target.value as PropertySort })}
            >
              <option value="compatibility_desc">Mayor compatibilidad</option>
              <option value="price_asc">Menor precio</option>
              <option value="price_desc">Mayor precio</option>
              <option value="recent_desc">Más recientes</option>
            </select>
          </label>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <label className="block space-y-2">
            <span className="text-sm font-medium">Mascotas</span>
            <select
              className="border-input bg-background h-11 w-full rounded-2xl border px-4"
              value={petsFilter}
              onChange={(event) => updateQuery({ pets: event.target.value as RuleFilter })}
            >
              <option value="all">Indistinto</option>
              <option value="yes">Acepta mascotas</option>
              <option value="no">No acepta mascotas</option>
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium">Fumadores</span>
            <select
              className="border-input bg-background h-11 w-full rounded-2xl border px-4"
              value={smokersFilter}
              onChange={(event) => updateQuery({ smokers: event.target.value as RuleFilter })}
            >
              <option value="all">Indistinto</option>
              <option value="yes">Acepta fumadores</option>
              <option value="no">No acepta fumadores</option>
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium">Niños</span>
            <select
              className="border-input bg-background h-11 w-full rounded-2xl border px-4"
              value={childrenFilter}
              onChange={(event) => updateQuery({ children: event.target.value as RuleFilter })}
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
                className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm text-emerald-950"
                onClick={() => {
                  if (filter.key === "sort") updateQuery({ sort: "compatibility_desc" });
                  if (filter.key === "q") updateQuery({ q: "" });
                  if (filter.key === "type") updateQuery({ type: "all" });
                  if (filter.key === "city") updateQuery({ city: "all" });
                  if (filter.key === "price") updateQuery({ price: "all" });
                  if (filter.key === "pets") updateQuery({ pets: "all" });
                  if (filter.key === "smokers") updateQuery({ smokers: "all" });
                  if (filter.key === "children") updateQuery({ children: "all" });
                  if (filter.key === "available") updateQuery({ available: false });
                }}
              >
                {filter.label} ×
              </button>
            ))}
          </div>
        ) : null}

        {!sortedProperties.length ? (
          <div className="mt-6 rounded-3xl border border-dashed p-6 text-sm text-slate-600">
            No hay propiedades que coincidan con los filtros actuales.
          </div>
        ) : null}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        {sortedProperties.map((property) => (
          <PropertyCard
            key={property.id}
            propertyId={property.id}
            title={property.title}
            addressLine={
              property.city ? `${property.addressLine}, ${property.city}` : property.addressLine
            }
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
