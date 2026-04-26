"use server";

import { AgencyStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUserRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

function redirectWithMessage(message: string): never {
  redirect(`/admin/agencies?message=${encodeURIComponent(message)}`);
}

function redirectWithError(message: string): never {
  redirect(`/admin/agencies?error=${encodeURIComponent(message)}`);
}

export async function updateAgencyStatusAction(formData: FormData) {
  await requireUserRole("admin");

  const agencyId = String(formData.get("agencyId") ?? "").trim();
  const statusValue = String(formData.get("status") ?? "").trim();

  if (!agencyId) {
    redirectWithError("No se recibió la inmobiliaria a actualizar.");
  }

  if (!Object.values(AgencyStatus).includes(statusValue as AgencyStatus)) {
    redirectWithError("Estado de inmobiliaria inválido.");
  }

  const agency = await prisma.user.findFirst({
    where: {
      id: agencyId,
      role: "AGENCY",
    },
    select: {
      firstName: true,
      lastName: true,
      companyName: true,
    },
  });

  if (!agency) {
    redirectWithError("No se encontró la inmobiliaria.");
  }

  await prisma.user.update({
    where: { id: agencyId },
    data: {
      agencyStatus: statusValue as AgencyStatus,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/agencies");
  revalidatePath("/agency");

  redirectWithMessage(
    `${agency.companyName ?? `${agency.firstName} ${agency.lastName}`.trim()} quedó ${getStatusMessage(statusValue as AgencyStatus)}.`
  );
}

function getStatusMessage(status: AgencyStatus) {
  switch (status) {
    case AgencyStatus.APPROVED:
      return "aprobada";
    case AgencyStatus.REJECTED:
      return "rechazada";
    default:
      return "pendiente";
  }
}
