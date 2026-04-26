"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getAgencyUserByEmail } from "@/lib/agency/transactions";
import { requireUserRole } from "@/lib/auth/session";
import { createManualCandidacy } from "@/lib/candidacies/service";

function getCandidatesPath(propertyId: string) {
  return `/agency/properties/${propertyId}/candidates`;
}

function redirectWithError(propertyId: string, message: string): never {
  redirect(`${getCandidatesPath(propertyId)}?error=${encodeURIComponent(message)}`);
}

function redirectWithMessage(propertyId: string, message: string): never {
  redirect(`${getCandidatesPath(propertyId)}?message=${encodeURIComponent(message)}`);
}

export async function createManualCandidacyAction(formData: FormData) {
  const session = await requireUserRole("agency");
  const email = session.user?.email;
  const propertyId = String(formData.get("propertyId") ?? "");

  if (!propertyId) {
    redirect("/agency/properties?error=Propiedad%20inválida");
  }

  if (!email) {
    redirect("/login?error=Sesión%20inválida");
  }

  const agency = await getAgencyUserByEmail(email);

  if (!agency) {
    redirect("/login?error=No%20se%20encontró%20la%20inmobiliaria");
  }

  const result = await createManualCandidacy(propertyId, agency.id, {
    fullName: String(formData.get("fullName") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    monthlyIncome: String(formData.get("monthlyIncome") ?? ""),
    guaranteeType: String(formData.get("guaranteeType") ?? "") as
      | "MORTGAGE"
      | "CAUTION_INSURANCE"
      | "NONE",
  });

  if (!result.ok) {
    redirectWithError(propertyId, result.error);
  }

  revalidatePath(`/agency/properties/${propertyId}`);
  revalidatePath(getCandidatesPath(propertyId));
  redirectWithMessage(propertyId, "Candidato cargado correctamente.");
}
