"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { CandidacyStatus, TransactionStageType } from "@prisma/client";

import { getAgencyUserByEmail } from "@/lib/agency/transactions";
import { requireUserRole } from "@/lib/auth/session";
import { createManualCandidacy } from "@/lib/candidacies/service";
import { prisma } from "@/lib/db/prisma";

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

export async function selectCandidacyAction(formData: FormData) {
  const session = await requireUserRole("agency");
  const email = session.user?.email;
  const propertyId = String(formData.get("propertyId") ?? "");
  const candidacyId = String(formData.get("candidacyId") ?? "");

  if (!propertyId || !candidacyId) {
    redirect("/agency/properties?error=Selección%20inválida");
  }

  if (!email) {
    redirect("/login?error=Sesión%20inválida");
  }

  const agency = await getAgencyUserByEmail(email);

  if (!agency) {
    redirect("/login?error=No%20se%20encontró%20la%20inmobiliaria");
  }

  const candidacy = await prisma.candidacy.findFirst({
    where: {
      id: candidacyId,
      propertyId,
      property: {
        agencyId: agency.id,
      },
    },
    select: {
      id: true,
      propertyId: true,
      transaction: {
        select: {
          id: true,
        },
      },
      status: true,
      manualCandidateEmail: true,
      tenant: {
        select: {
          email: true,
        },
      },
    },
  });

  if (!candidacy) {
    redirectWithError(propertyId, "No se encontró el candidato.");
  }

  if (candidacy.transaction?.id) {
    redirect(`/agency/transactions/${candidacy.transaction.id}?message=${encodeURIComponent("La transacción ya existía para este candidato.")}`);
  }

  const transaction = await prisma.$transaction(async (tx) => {
    await tx.candidacy.update({
      where: { id: candidacy.id },
      data: {
        status: CandidacyStatus.SELECTED,
      },
    });

    const createdTransaction = await tx.transaction.create({
      data: {
        propertyId: candidacy.propertyId,
        candidacyId: candidacy.id,
        currentStage: TransactionStageType.CANDIDATE_SELECTED,
        clientEmail: candidacy.manualCandidateEmail ?? candidacy.tenant?.email ?? null,
      },
      select: {
        id: true,
      },
    });

    await tx.transactionState.create({
      data: {
        transactionId: createdTransaction.id,
        stage: TransactionStageType.CANDIDATE_SELECTED,
        note: "Candidato seleccionado para iniciar la operación.",
        changedById: agency.id,
        isCurrent: true,
      },
    });

    return createdTransaction;
  });

  revalidatePath(`/agency/properties/${propertyId}`);
  revalidatePath(getCandidatesPath(propertyId));
  revalidatePath("/agency/transactions");
  redirect(
    `/agency/transactions/${transaction.id}?message=${encodeURIComponent("Candidato seleccionado. Ya podés avanzar el circuito.")}`
  );
}
