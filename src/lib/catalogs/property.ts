import type { PropertyType } from "@prisma/client";

export type PropertySort = "compatibility_desc" | "price_asc" | "price_desc" | "recent_desc";
export type RuleFilter = "all" | "yes" | "no";
export type PriceRangeFilter =
  | "all"
  | "up_to_400k"
  | "400k_to_800k"
  | "800k_to_1500k"
  | "more_than_1500k";

export const propertySortLabels: Record<PropertySort, string> = {
  compatibility_desc: "Mayor compatibilidad",
  price_asc: "Menor precio",
  price_desc: "Mayor precio",
  recent_desc: "Más recientes",
};

export const propertyTypeLabels: Record<PropertyType, string> = {
  APARTMENT: "Departamento",
  HOUSE: "Casa",
  PH: "PH",
  STUDIO: "Monoambiente",
  OFFICE: "Oficina",
  COMMERCIAL: "Local",
  LAND: "Lote",
  OTHER: "Otro",
};

export const priceRangeLabels: Record<Exclude<PriceRangeFilter, "all">, string> = {
  up_to_400k: "Hasta $400.000",
  "400k_to_800k": "$400.000 a $800.000",
  "800k_to_1500k": "$800.000 a $1.500.000",
  more_than_1500k: "Más de $1.500.000",
};

export function getPropertyTypeLabel(propertyType: PropertyType | string) {
  if (propertyType in propertyTypeLabels) {
    return propertyTypeLabels[propertyType as PropertyType];
  }

  return propertyType;
}

export function matchesPriceRange(price: number, range: PriceRangeFilter) {
  switch (range) {
    case "up_to_400k":
      return price <= 400000;
    case "400k_to_800k":
      return price >= 400000 && price <= 800000;
    case "800k_to_1500k":
      return price >= 800000 && price <= 1500000;
    case "more_than_1500k":
      return price >= 1500000;
    default:
      return true;
  }
}

