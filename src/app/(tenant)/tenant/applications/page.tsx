import { ensureCurrentTenantContext } from "@/lib/auth/actors";
import { requireUserRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { ApplicationsList } from "@/components/tenant/applications-list";

export default async function TenantApplicationsPage() {
  await requireUserRole("tenant");
  const tenant = await ensureCurrentTenantContext();

  const applications = tenant
    ? await prisma.candidacy.findMany({
        where: {
          tenantId: tenant.user.id,
          source: "PLATFORM",
        },
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          status: true,
          scoreAtSubmission: true,
          guaranteeType: true,
          property: {
            select: {
              title: true,
              addressLine: true,
              city: true,
              propertyType: true,
            },
          },
          tenant: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      })
    : [];

  return <ApplicationsList applications={applications} />;
}
