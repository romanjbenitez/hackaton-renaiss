import { AgencyStatus, UserRole, type User } from "@prisma/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";

import { prisma } from "@/lib/db/prisma";

function slugifyCompanyName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

async function buildUniqueCompanySlug(companyName: string) {
  const baseSlug = slugifyCompanyName(companyName) || "inmobiliaria";

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const candidate = attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`;
    const existingUser = await prisma.user.findUnique({
      where: { companySlug: candidate },
      select: { id: true },
    });

    if (!existingUser) {
      return candidate;
    }
  }

  return `${baseSlug}-${crypto.randomUUID().slice(0, 8)}`;
}

function mapRoleToDbRole(role: "tenant" | "agency" | "admin") {
  switch (role) {
    case "tenant":
      return UserRole.TENANT;
    case "agency":
      return UserRole.AGENCY;
    case "admin":
      return UserRole.ADMIN;
  }
}

type AuthUserMetadata = {
  role?: unknown;
  first_name?: unknown;
  last_name?: unknown;
  company_name?: unknown;
  phone?: unknown;
};

type ProfileSyncInput = {
  authUserId?: string | null;
  email: string;
  role: "tenant" | "agency" | "admin";
  firstName: string;
  lastName: string;
  companyName?: string | null;
  phone?: string | null;
};

export function getAgencyStatusLabel(status?: AgencyStatus | null) {
  switch (status) {
    case AgencyStatus.APPROVED:
      return "Aprobada";
    case AgencyStatus.REJECTED:
      return "Rechazada";
    default:
      return "Pendiente";
  }
}

export function getAgencyStatusTone(status?: AgencyStatus | null) {
  switch (status) {
    case AgencyStatus.APPROVED:
      return "emerald";
    case AgencyStatus.REJECTED:
      return "rose";
    default:
      return "amber";
  }
}

export async function syncProfileUser(input: ProfileSyncInput) {
  const existingUser =
    (input.authUserId
      ? await prisma.user.findUnique({
          where: { authUserId: input.authUserId },
          select: {
            id: true,
            companySlug: true,
            agencyStatus: true,
          },
        })
      : null) ??
    (await prisma.user.findUnique({
      where: { email: input.email },
      select: {
        id: true,
        companySlug: true,
        agencyStatus: true,
      },
    }));

  const companySlug =
    input.role === "agency" && input.companyName
      ? existingUser?.companySlug ?? (await buildUniqueCompanySlug(input.companyName))
      : null;

  return prisma.user.upsert({
    where: { email: input.email },
    update: {
      authUserId: input.authUserId ?? undefined,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone ?? null,
      role: mapRoleToDbRole(input.role),
      companyName: input.companyName ?? null,
      companySlug: companySlug ?? undefined,
      agencyStatus:
        input.role === "agency" ? (existingUser?.agencyStatus ?? AgencyStatus.APPROVED) : null,
    },
    create: {
      authUserId: input.authUserId ?? undefined,
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone ?? null,
      role: mapRoleToDbRole(input.role),
      companyName: input.companyName ?? null,
      companySlug: companySlug ?? undefined,
      agencyStatus: input.role === "agency" ? AgencyStatus.APPROVED : null,
    },
  });
}

export async function syncAuthUserToProfile(
  authUser: SupabaseUser,
  role: "tenant" | "agency" | "admin"
) {
  const metadata = authUser.user_metadata as AuthUserMetadata | undefined;
  const email = authUser.email;

  if (!email) {
    return null;
  }

  const firstName =
    typeof metadata?.first_name === "string" && metadata.first_name.trim().length > 0
      ? metadata.first_name.trim()
      : email.split("@")[0];
  const lastName =
    typeof metadata?.last_name === "string" && metadata.last_name.trim().length > 0
      ? metadata.last_name.trim()
      : role === "agency"
        ? "Equipo"
        : "Usuario";
  const companyName =
    typeof metadata?.company_name === "string" && metadata.company_name.trim().length > 0
      ? metadata.company_name.trim()
      : null;
  const phone =
    typeof metadata?.phone === "string" && metadata.phone.trim().length > 0
      ? metadata.phone.trim()
      : null;

  return syncProfileUser({
    authUserId: authUser.id,
    email,
    firstName,
    lastName,
    phone,
    role,
    companyName,
  });
}

export type ProfileUser = Pick<
  User,
  | "id"
  | "email"
  | "firstName"
  | "lastName"
  | "role"
  | "agencyStatus"
  | "companyName"
  | "companySlug"
  | "phone"
>;
