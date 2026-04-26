"use server";

import { redirect } from "next/navigation";

import { requireUserRole } from "@/lib/auth/session";
import { createPlatformCandidacy } from "@/lib/candidacies/service";

function redirectWithError(message: string): never {
  redirect(`/tenant/properties?error=${encodeURIComponent(message)}`);
}

function redirectWithMessage(message: string): never {
  redirect(`/tenant/properties?message=${encodeURIComponent(message)}`);
}

export async function applyToPropertyAction(formData: FormData) {
  await requireUserRole("tenant");

  const propertyId = String(formData.get("propertyId") ?? "");

  if (!propertyId) {
    redirectWithError("Propiedad inválida.");
  }

  const result = await createPlatformCandidacy(propertyId);

  if (!result.ok) {
    redirectWithError(result.error);
  }

  redirectWithMessage("Postulación creada correctamente.");
}
