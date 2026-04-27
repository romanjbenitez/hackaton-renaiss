import "server-only";

import type {
  GuaranteeType,
  PropertyStatus,
  PropertyType,
  TenantProfileType,
} from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

export type AgencyPropertyRecord = Awaited<ReturnType<typeof getAgencyProperties>>[number];

export async function getAgencyProperties(agencyId: string) {
  const properties = await prisma.property.findMany({
    where: {
      agencyId,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      title: true,
      description: true,
      addressLine: true,
      city: true,
      province: true,
      propertyType: true,
      status: true,
      squareMeters: true,
      bedrooms: true,
      bathrooms: true,
      price: true,
      currency: true,
      expenses: true,
      externalUrl: true,
      photos: true,
      targetTrustScore: true,
      acceptedGuarantees: true,
      acceptsPets: true,
      acceptsSmokers: true,
      acceptsChildren: true,
      preferredProfile: true,
      compatibilityNotes: true,
      createdAt: true,
    },
  });

  return properties.map((property) => ({
    ...property,
    price: Number(property.price),
    expenses: property.expenses ? Number(property.expenses) : 0,
  }));
}

export async function createAgencyProperty(
  agencyId: string,
  input: {
    title: string;
    description: string;
    addressLine: string;
    city: string;
    province: string;
    propertyType: PropertyType;
    status: PropertyStatus;
    squareMeters: number;
    bedrooms: number;
    bathrooms: number;
    price: number;
    expenses: number;
    externalUrl?: string;
    photos: string[];
    targetTrustScore: number;
    acceptedGuarantees: GuaranteeType[];
    acceptsPets: boolean;
    acceptsSmokers: boolean;
    acceptsChildren: boolean;
    preferredProfile?: TenantProfileType;
    compatibilityNotes?: string;
  }
) {
  const property = await prisma.property.create({
    data: {
      agencyId,
      title: input.title,
      description: input.description,
      addressLine: input.addressLine,
      city: input.city,
      province: input.province,
      propertyType: input.propertyType,
      status: input.status,
      squareMeters: input.squareMeters,
      bedrooms: input.bedrooms,
      bathrooms: input.bathrooms,
      price: input.price,
      expenses: input.expenses,
      externalUrl: input.externalUrl,
      photos: input.photos,
      targetTrustScore: input.targetTrustScore,
      acceptedGuarantees: input.acceptedGuarantees,
      acceptsPets: input.acceptsPets,
      acceptsSmokers: input.acceptsSmokers,
      acceptsChildren: input.acceptsChildren,
      preferredProfile: input.preferredProfile,
      compatibilityNotes: input.compatibilityNotes,
      publishedAt: input.status === "PUBLISHED" ? new Date() : null,
    },
    select: {
      id: true,
    },
  });

  return property;
}

export async function updateAgencyProperty(
  id: string,
  agencyId: string,
  input: {
    title: string;
    description: string;
    addressLine: string;
    city: string;
    province: string;
    propertyType: PropertyType;
    status: PropertyStatus;
    squareMeters: number;
    bedrooms: number;
    bathrooms: number;
    price: number;
    expenses: number;
    externalUrl?: string;
    photos: string[];
    targetTrustScore: number;
    acceptedGuarantees: GuaranteeType[];
    acceptsPets: boolean;
    acceptsSmokers: boolean;
    acceptsChildren: boolean;
    preferredProfile?: TenantProfileType;
    compatibilityNotes?: string;
  }
) {
  return prisma.property.updateMany({
    where: { id, agencyId },
    data: {
      title: input.title,
      description: input.description,
      addressLine: input.addressLine,
      city: input.city,
      province: input.province,
      propertyType: input.propertyType,
      status: input.status,
      squareMeters: input.squareMeters,
      bedrooms: input.bedrooms,
      bathrooms: input.bathrooms,
      price: input.price,
      expenses: input.expenses,
      externalUrl: input.externalUrl ?? null,
      photos: input.photos,
      targetTrustScore: input.targetTrustScore,
      acceptedGuarantees: input.acceptedGuarantees,
      acceptsPets: input.acceptsPets,
      acceptsSmokers: input.acceptsSmokers,
      acceptsChildren: input.acceptsChildren,
      preferredProfile: input.preferredProfile ?? null,
      compatibilityNotes: input.compatibilityNotes ?? null,
    },
  });
}

export async function getAgencyPropertyById(id: string, agencyId: string) {
  const property = await prisma.property.findFirst({
    where: {
      id,
      agencyId,
    },
    select: {
      id: true,
      title: true,
      description: true,
      addressLine: true,
      city: true,
      province: true,
      propertyType: true,
      status: true,
      squareMeters: true,
      bedrooms: true,
      bathrooms: true,
      price: true,
      currency: true,
      expenses: true,
      externalUrl: true,
      photos: true,
      targetTrustScore: true,
      acceptedGuarantees: true,
      acceptsPets: true,
      acceptsSmokers: true,
      acceptsChildren: true,
      preferredProfile: true,
      compatibilityNotes: true,
      createdAt: true,
      _count: {
        select: {
          candidacies: true,
        },
      },
    },
  });

  if (!property) {
    return null;
  }

  return {
    ...property,
    price: Number(property.price),
    expenses: property.expenses ? Number(property.expenses) : 0,
  };
}

export async function getPublishedProperties() {
  const properties = await prisma.property.findMany({
    where: {
      status: "PUBLISHED",
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      title: true,
      addressLine: true,
      city: true,
      province: true,
      propertyType: true,
      squareMeters: true,
      price: true,
      photos: true,
      targetTrustScore: true,
      acceptedGuarantees: true,
      acceptsPets: true,
      acceptsSmokers: true,
      acceptsChildren: true,
    },
  });

  return properties.map((property) => ({
    ...property,
    price: Number(property.price),
  }));
}

export function getPropertyTypeLabel(value: PropertyType) {
  switch (value) {
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
      return "Otro";
  }
}

export function getPropertyStatusLabel(value: PropertyStatus) {
  switch (value) {
    case "DRAFT":
      return "Borrador";
    case "PUBLISHED":
      return "Publicada";
    case "PAUSED":
      return "Pausada";
    case "RENTED":
      return "Alquilada";
    case "ARCHIVED":
      return "Archivada";
  }
}

export function getPropertyStatusTone(value: PropertyStatus) {
  switch (value) {
    case "PUBLISHED":
      return "emerald";
    case "PAUSED":
      return "amber";
    case "RENTED":
      return "sky";
    case "ARCHIVED":
      return "slate";
    default:
      return "zinc";
  }
}

export function getGuaranteeLabel(value: GuaranteeType) {
  switch (value) {
    case "MORTGAGE":
      return "Garantía hipotecaria";
    case "CAUTION_INSURANCE":
      return "Seguro de caución";
    default:
      return "Sin garantía";
  }
}

export function getTenantProfileTypeLabel(value?: TenantProfileType | null) {
  switch (value) {
    case "EMPLOYED":
      return "Relación de dependencia";
    case "MONOTRIBUTISTA":
      return "Monotributista";
    case "SELF_EMPLOYED":
      return "Autónomo";
    case "RETIRED":
      return "Jubilado";
    default:
      return "Cualquier perfil";
  }
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
}

export function getPropertyCompatibilitySummary(property: {
  targetTrustScore: number | null;
  acceptsPets: boolean;
  acceptsSmokers: boolean;
  acceptsChildren: boolean;
  acceptedGuarantees: GuaranteeType[];
  preferredProfile?: TenantProfileType | null;
}) {
  const checklist = [
    `Score aspiracional desde ${property.targetTrustScore ?? 0}.`,
    property.acceptsPets ? "Acepta mascotas." : "No acepta mascotas.",
    property.acceptsSmokers ? "Acepta fumadores." : "No acepta fumadores.",
    property.acceptsChildren
      ? "Acepta grupo familiar con hijos."
      : "Orientada a hogares sin hijos.",
    `Garantías habilitadas: ${property.acceptedGuarantees.map(getGuaranteeLabel).join(", ")}.`,
  ];

  if (property.preferredProfile) {
    checklist.unshift(`Perfil preferido: ${getTenantProfileTypeLabel(property.preferredProfile)}.`);
  }

  return checklist;
}
