import { notFound, redirect } from "next/navigation";

import {
  createManualCandidacyAction,
  selectCandidacyAction,
} from "@/app/(agency)/agency/properties/[id]/candidates/actions";
import { CandidatesManager } from "@/components/agency/candidates-manager";
import { CandidateSummaryPanel } from "@/components/agency/candidate-summary-panel";
import { getAgencyPropertyById } from "@/lib/agency/properties";
import { getAgencyUserByEmail } from "@/lib/agency/transactions";
import { getPropertyCandidacies } from "@/lib/candidacies/service";
import { requireUserRole } from "@/lib/auth/session";

type PropertyCandidatesPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getSearchValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function PropertyCandidatesPage({
  params,
  searchParams,
}: PropertyCandidatesPageProps) {
  const [{ id }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const session = await requireUserRole("agency");
  const email = session.user?.email;

  if (!email) {
    redirect("/login?error=Sesión%20inválida");
  }

  const agency = await getAgencyUserByEmail(email);

  if (!agency) {
    redirect("/login?error=No%20se%20encontró%20la%20inmobiliaria");
  }

  const [property, candidacies] = await Promise.all([
    getAgencyPropertyById(id, agency.id),
    getPropertyCandidacies(id, agency.id),
  ]);

  if (!property) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <CandidateSummaryPanel
        propertyId={id}
        candidates={candidacies.map((candidate) => ({
          id: candidate.id,
          label:
            candidate.manualCandidateName ??
            (candidate.tenant
              ? `${candidate.tenant.firstName} ${candidate.tenant.lastName}`
              : "Candidato sin nombre"),
        }))}
      />
      <CandidatesManager
        property={{
          id: property.id,
          title: property.title,
          addressLine: property.addressLine,
        }}
        candidacies={candidacies.map((candidate) => ({
          ...candidate,
          monthlyIncome: candidate.monthlyIncome ? Number(candidate.monthlyIncome) : null,
          aiCompatibilityScore: candidate.aiCompatibilityScore,
          aiCompatibilityExplanation: candidate.aiCompatibilityExplanation,
          aiCompatibilityMatchPoints: candidate.aiCompatibilityMatchPoints,
          aiCompatibilityConflicts: candidate.aiCompatibilityConflicts,
        }))}
        message={getSearchValue(resolvedSearchParams.message)}
        error={getSearchValue(resolvedSearchParams.error)}
        createManualCandidacyAction={createManualCandidacyAction}
        selectCandidacyAction={selectCandidacyAction}
      />
    </div>
  );
}
