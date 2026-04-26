import { ensureCurrentTenantContext } from "@/lib/auth/actors";
import { requireUserRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { mapTenantDocumentsFromDatabaseWithPreview } from "@/lib/tenant/documents-server";
import { DocumentsManager } from "@/components/tenant/documents-manager";
import { getTenantOnboardingDraft } from "@/lib/tenant/onboarding";

export default async function TenantDocumentsPage() {
  await requireUserRole("tenant");
  const draft = await getTenantOnboardingDraft();
  const tenant = await ensureCurrentTenantContext();
  const initialDocuments = tenant?.tenantProfile
    ? await prisma.document.findMany({
        where: {
          tenantProfileId: tenant.tenantProfile.id,
        },
        orderBy: {
          uploadedAt: "desc",
        },
        select: {
          id: true,
          type: true,
          displayName: true,
          fileName: true,
          mimeType: true,
          storageKey: true,
          url: true,
          uploadedAt: true,
          verificationStatus: true,
          suspicious: true,
          suspiciousReason: true,
          suspiciousScore: true,
          base64Data: true,
        },
      })
    : [];
  const mappedDocuments = await mapTenantDocumentsFromDatabaseWithPreview(initialDocuments);

  return (
    <DocumentsManager
      profileType={draft.step1?.profileType ?? "EMPLOYED"}
      initialGuaranteeType={draft.step2?.guaranteeType ?? "NONE"}
      monthlyIncome={draft.step1?.monthlyIncome}
      tenantProfileId={tenant?.tenantProfile?.id ?? null}
      initialTrustScore={tenant?.tenantProfile?.trustScore ?? null}
      initialTrustExplanation={tenant?.tenantProfile?.trustScoreExplanation ?? null}
      initialTrustImprovementSuggestion={tenant?.tenantProfile?.improvementSuggestion ?? null}
      initialDocuments={mappedDocuments}
    />
  );
}
