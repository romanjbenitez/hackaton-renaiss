"use server";

import { revalidatePath } from "next/cache";

import { requireUserRole } from "@/lib/auth/session";
import { createPlatformCandidacy } from "@/lib/candidacies/service";

export type ApplyToPropertyActionState = {
  ok: boolean;
  message?: string;
  error?: string;
};

export async function applyToPropertyAction(
  _previousState: ApplyToPropertyActionState,
  formData: FormData
): Promise<ApplyToPropertyActionState> {
  await requireUserRole("tenant");

  const propertyId = String(formData.get("propertyId") ?? "");

  if (!propertyId) {
    return {
      ok: false,
      error: "Propiedad inválida.",
    };
  }

  const result = await createPlatformCandidacy(propertyId);

  if (!result.ok) {
    return {
      ok: false,
      error: result.error,
    };
  }

  revalidatePath("/tenant/properties");
  revalidatePath("/tenant/applications");

  return {
    ok: true,
    message: "Postulación realizada.",
  };
}
