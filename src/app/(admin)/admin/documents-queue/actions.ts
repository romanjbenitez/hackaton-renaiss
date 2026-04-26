"use server";

import { DocumentVerificationStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUserRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

function redirectWithMessage(message: string): never {
  redirect(`/admin/documents-queue?message=${encodeURIComponent(message)}`);
}

function redirectWithError(message: string): never {
  redirect(`/admin/documents-queue?error=${encodeURIComponent(message)}`);
}

function buildReviewReason(previousReason: string | null, note: string) {
  const trimmedNote = note.trim();

  if (!trimmedNote) {
    return previousReason;
  }

  return previousReason
    ? `${previousReason}\n\nNota de revisión: ${trimmedNote}`
    : `Nota de revisión: ${trimmedNote}`;
}

export async function reviewFlaggedDocumentAction(formData: FormData) {
  const session = await requireUserRole("admin");
  const documentId = String(formData.get("documentId") ?? "").trim();
  const decision = String(formData.get("decision") ?? "").trim();
  const reviewNote = String(formData.get("reviewNote") ?? "");

  if (!documentId) {
    redirectWithError("No se recibió el documento a revisar.");
  }

  if (decision !== "approve" && decision !== "reject") {
    redirectWithError("La decisión de revisión es inválida.");
  }

  if (!session.dbUser?.id) {
    redirectWithError("No se encontró el usuario administrador en la base.");
  }

  const document = await prisma.document.findUnique({
    where: { id: documentId },
    select: {
      id: true,
      displayName: true,
      suspiciousReason: true,
      tenantProfile: {
        select: {
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  });

  if (!document) {
    redirectWithError("No se encontró el documento.");
  }

  const verificationStatus =
    decision === "approve" ? DocumentVerificationStatus.VERIFIED : DocumentVerificationStatus.REJECTED;

  await prisma.document.update({
    where: { id: documentId },
    data: {
      verificationStatus,
      suspicious: decision === "reject",
      reviewedByUserId: session.dbUser.id,
      verifiedAt: new Date(),
      suspiciousReason: buildReviewReason(document.suspiciousReason, reviewNote),
    },
  });

  revalidatePath("/admin/documents-queue");
  revalidatePath("/admin");
  revalidatePath("/tenant/documents");
  revalidatePath("/tenant/profile");
  revalidatePath("/tenant");

  const tenantName = `${document.tenantProfile.user.firstName} ${document.tenantProfile.user.lastName}`.trim();
  redirectWithMessage(
    `${document.displayName} de ${tenantName} quedó ${decision === "approve" ? "verificado" : "rechazado"}.`
  );
}
