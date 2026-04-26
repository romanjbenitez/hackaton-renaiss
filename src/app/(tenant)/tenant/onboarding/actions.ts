"use server";

import { redirect } from "next/navigation";

import { onboardingStep1Schema, onboardingStep2Schema } from "@/lib/validations/tenant";
import { getTenantOnboardingDraft, saveTenantOnboardingDraft } from "@/lib/tenant/onboarding";

function redirectWithError(step: "1" | "2", message: string) {
  redirect(`/tenant/onboarding?step=${step}&error=${encodeURIComponent(message)}`);
}

export async function saveOnboardingStep1Action(formData: FormData) {
  const parsed = onboardingStep1Schema.safeParse({
    dni: formData.get("dni"),
    profileType: formData.get("profileType"),
    occupation: formData.get("occupation"),
    monthlyIncome: formData.get("monthlyIncome"),
  });

  if (!parsed.success) {
    redirectWithError("1", parsed.error.issues[0]?.message ?? "No se pudo validar el paso 1.");
  }

  const draft = await getTenantOnboardingDraft();

  await saveTenantOnboardingDraft({
    ...draft,
    step1: parsed.data,
  });

  redirect("/tenant/onboarding?step=2");
}

export async function saveOnboardingStep2Action(formData: FormData) {
  const parsed = onboardingStep2Schema.safeParse({
    hasPets: formData.get("hasPets"),
    isSmoker: formData.get("isSmoker"),
    hasChildren: formData.get("hasChildren"),
    familyMembers: formData.get("familyMembers"),
    guaranteeType: formData.get("guaranteeType"),
    guaranteeDetails: formData.get("guaranteeDetails"),
  });

  if (!parsed.success) {
    redirectWithError("2", parsed.error.issues[0]?.message ?? "No se pudo validar el paso 2.");
  }

  const draft = await getTenantOnboardingDraft();

  if (!draft.step1) {
    redirectWithError("1", "Completá primero tus datos personales.");
  }

  await saveTenantOnboardingDraft({
    ...draft,
    step2: parsed.data,
  });

  redirect("/tenant/profile?message=Perfil%20actualizado");
}
