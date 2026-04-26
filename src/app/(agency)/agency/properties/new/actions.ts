"use server";

import { redirect } from "next/navigation";

import { createAgencyProperty } from "@/lib/agency/properties";
import { getAgencyUserByEmail } from "@/lib/agency/transactions";
import { requireUserRole } from "@/lib/auth/session";
import { createPropertySchema } from "@/lib/validations/property";

function redirectWithError(message: string): never {
  redirect(`/agency/properties/new?error=${encodeURIComponent(message)}`);
}

export async function createPropertyAction(formData: FormData) {
  const parsed = createPropertySchema.safeParse({
    title: formData.get("title"),
    addressLine: formData.get("addressLine"),
    city: formData.get("city"),
    province: formData.get("province"),
    propertyType: formData.get("propertyType"),
    squareMeters: formData.get("squareMeters"),
    bedrooms: formData.get("bedrooms"),
    bathrooms: formData.get("bathrooms"),
    price: formData.get("price"),
    expenses: formData.get("expenses"),
    externalUrl: formData.get("externalUrl"),
    photoUrls: formData.get("photoUrls"),
    targetTrustScore: formData.get("targetTrustScore"),
    acceptedGuarantees: formData.getAll("acceptedGuarantees"),
    preferredProfile: formData.get("preferredProfile") || undefined,
    acceptsPets: formData.get("acceptsPets") === "on",
    acceptsSmokers: formData.get("acceptsSmokers") === "on",
    acceptsChildren: formData.get("acceptsChildren") === "on",
    compatibilityNotes: formData.get("compatibilityNotes"),
    description: formData.get("description"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    redirectWithError(parsed.error.issues[0]?.message ?? "No se pudo guardar la propiedad.");
  }

  const data = parsed.data;
  const session = await requireUserRole("agency");
  const email = session.user?.email;

  if (!email) {
    redirect("/login?error=Sesión%20inválida");
  }

  const agency = await getAgencyUserByEmail(email);

  if (!agency) {
    redirect("/login?error=No%20se%20encontró%20la%20inmobiliaria");
  }

  const property = await createAgencyProperty(agency.id, {
    title: data.title,
    description: data.description || "",
    addressLine: data.addressLine,
    city: data.city,
    province: data.province,
    propertyType: data.propertyType,
    status: data.status,
    squareMeters: data.squareMeters,
    bedrooms: data.bedrooms,
    bathrooms: data.bathrooms,
    price: data.price,
    expenses: data.expenses,
    externalUrl: data.externalUrl || undefined,
    photos: data.photoUrls,
    targetTrustScore: data.targetTrustScore,
    acceptedGuarantees: data.acceptedGuarantees,
    acceptsPets: data.acceptsPets,
    acceptsSmokers: data.acceptsSmokers,
    acceptsChildren: data.acceptsChildren,
    preferredProfile: data.preferredProfile,
    compatibilityNotes: data.compatibilityNotes || undefined,
  });

  redirect(`/agency/properties/${property.id}?message=Propiedad%20creada`);
}
