"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  getAgencyTransactionById,
  getAgencyUserByEmail,
  getNextTransactionStage,
  getTransactionStageLabel,
} from "@/lib/agency/transactions";
import { requireUserRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { sendTransactionStageEmail } from "@/lib/notifications/email";

function getDetailPath(transactionId: string) {
  return `/agency/transactions/${transactionId}`;
}

function redirectWithError(transactionId: string, message: string): never {
  redirect(`${getDetailPath(transactionId)}?error=${encodeURIComponent(message)}`);
}

function redirectWithMessage(transactionId: string, message: string): never {
  redirect(`${getDetailPath(transactionId)}?message=${encodeURIComponent(message)}`);
}

async function getAgencyContext() {
  const session = await requireUserRole("agency");
  const email = session.user?.email;

  if (!email) {
    redirect("/login?error=Sesión%20inválida");
  }

  const agency = await getAgencyUserByEmail(email);

  if (!agency) {
    redirect("/login?error=No%20se%20encontró%20la%20inmobiliaria");
  }

  return agency;
}

export async function advanceTransactionStageAction(formData: FormData) {
  const transactionId = String(formData.get("transactionId") ?? "");
  const note = String(formData.get("note") ?? "").trim();

  if (!transactionId) {
    redirect("/agency/transactions?error=Transacción%20inválida");
  }

  const agency = await getAgencyContext();
  const transaction = await getAgencyTransactionById(transactionId, agency.id);

  if (!transaction) {
    redirectWithError(transactionId, "No se encontró la transacción.");
  }

  const nextStage = getNextTransactionStage(transaction.currentStage);

  if (!nextStage) {
    redirectWithError(transactionId, "La transacción ya está en su último estado.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.transactionState.updateMany({
      where: {
        transactionId,
        isCurrent: true,
      },
      data: {
        isCurrent: false,
      },
    });

    await tx.transactionState.create({
      data: {
        transactionId,
        stage: nextStage,
        note: note || `Avance a ${getTransactionStageLabel(nextStage).toLowerCase()}.`,
        changedById: agency.id,
        isCurrent: true,
      },
    });

    await tx.transaction.update({
      where: { id: transactionId },
      data: {
        currentStage: nextStage,
        completedAt: nextStage === "KEYS_DELIVERED" ? new Date() : null,
      },
    });
  });

  const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/portal/${transaction.shareToken}`;
  const notificationTargets = [transaction.clientEmail, transaction.ownerEmail]
    .filter((email): email is string => Boolean(email))
    .filter((email, index, emails) => emails.indexOf(email) === index);

  await Promise.allSettled(
    notificationTargets.map((email) =>
      sendTransactionStageEmail({
        to: email,
        transactionId: transactionId,
        propertyTitle: transaction.property.title,
        propertyAddress: `${transaction.property.addressLine}, ${transaction.property.city}`,
        stage: nextStage,
        stageLabel: getTransactionStageLabel(nextStage),
        portalUrl,
      })
    )
  );

  revalidatePath("/agency/transactions");
  revalidatePath(getDetailPath(transactionId));
  redirectWithMessage(transactionId, `La transacción avanzó a ${getTransactionStageLabel(nextStage)}.`);
}

export async function addTransactionDocumentAction(formData: FormData) {
  const transactionId = String(formData.get("transactionId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();
  const mimeType = String(formData.get("mimeType") ?? "").trim() || "application/pdf";
  const stage = String(formData.get("stage") ?? "").trim();
  const visibleToClient = formData.get("visibleToClient") === "on";

  if (!transactionId) {
    redirect("/agency/transactions?error=Transacción%20inválida");
  }

  if (!name || !url || !stage) {
    redirectWithError(transactionId, "Completá nombre, URL y etapa del documento.");
  }

  const agency = await getAgencyContext();
  const transaction = await getAgencyTransactionById(transactionId, agency.id);

  if (!transaction) {
    redirectWithError(transactionId, "No se encontró la transacción.");
  }

  await prisma.transactionDocument.create({
    data: {
      transactionId,
      name,
      url,
      mimeType,
      stage: stage as Parameters<typeof getTransactionStageLabel>[0],
      visibleToClient,
    },
  });

  revalidatePath(getDetailPath(transactionId));
  redirectWithMessage(transactionId, "Documento adjuntado correctamente.");
}

export async function addTransactionInternalNoteAction(formData: FormData) {
  const transactionId = String(formData.get("transactionId") ?? "");
  const content = String(formData.get("content") ?? "").trim();

  if (!transactionId) {
    redirect("/agency/transactions?error=Transacción%20inválida");
  }

  if (!content) {
    redirectWithError(transactionId, "Escribí una nota interna antes de guardar.");
  }

  const agency = await getAgencyContext();
  const transaction = await getAgencyTransactionById(transactionId, agency.id);

  if (!transaction) {
    redirectWithError(transactionId, "No se encontró la transacción.");
  }

  await prisma.transactionNote.create({
    data: {
      transactionId,
      authorId: agency.id,
      content,
      visibleToClient: false,
    },
  });

  revalidatePath(getDetailPath(transactionId));
  redirectWithMessage(transactionId, "Nota interna guardada.");
}
