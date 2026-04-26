import type {
  CandidacySource,
  CandidacyStatus,
  GuaranteeType,
  TransactionStageType,
} from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

const transactionStages: TransactionStageType[] = [
  "CANDIDATE_SELECTED",
  "DOCS_COMPLETE",
  "CONTRACT_REVIEW",
  "CONTRACT_SIGNED",
  "KEYS_DELIVERED",
];

export type AgencyTransactionListItem = Awaited<ReturnType<typeof getAgencyTransactions>>[number];
export type AgencyTransactionDetail = Awaited<ReturnType<typeof getAgencyTransactionById>>;
type CandidateLike = {
  manualCandidateName?: string | null;
  manualCandidateEmail?: string | null;
  manualCandidatePhone?: string | null;
  tenant?: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string | null;
  } | null;
};

export async function getAgencyUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      companyName: true,
    },
  });
}

export async function getAgencyTransactions(agencyId: string) {
  return prisma.transaction.findMany({
    where: {
      property: {
        agencyId,
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
    select: {
      id: true,
      currentStage: true,
      startedAt: true,
      completedAt: true,
      shareToken: true,
      property: {
        select: {
          id: true,
          title: true,
          addressLine: true,
          city: true,
          price: true,
        },
      },
      candidacy: {
        select: {
          id: true,
          status: true,
          source: true,
          scoreAtSubmission: true,
          monthlyIncome: true,
          rentToIncomeRatio: true,
          manualCandidateName: true,
          manualCandidateEmail: true,
          tenant: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          tenantProfile: {
            select: {
              monthlyIncome: true,
              guaranteeType: true,
            },
          },
        },
      },
      documents: {
        select: {
          id: true,
        },
      },
      notes: {
        select: {
          id: true,
        },
      },
    },
  });
}

export async function getAgencyTransactionById(transactionId: string, agencyId: string) {
  return prisma.transaction.findFirst({
    where: {
      id: transactionId,
      property: {
        agencyId,
      },
    },
    select: {
      id: true,
      currentStage: true,
      shareToken: true,
      startedAt: true,
      completedAt: true,
      ownerName: true,
      ownerEmail: true,
      clientEmail: true,
      property: {
        select: {
          id: true,
          title: true,
          addressLine: true,
          city: true,
          price: true,
        },
      },
      candidacy: {
        select: {
          id: true,
          status: true,
          source: true,
          scoreAtSubmission: true,
          monthlyIncome: true,
          rentToIncomeRatio: true,
          guaranteeType: true,
          aiCompatibilityScore: true,
          aiCompatibilityExplanation: true,
          manualCandidateName: true,
          manualCandidateEmail: true,
          manualCandidatePhone: true,
          tenant: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
          tenantProfile: {
            select: {
              monthlyIncome: true,
              guaranteeType: true,
              profileType: true,
            },
          },
        },
      },
      states: {
        orderBy: {
          createdAt: "asc",
        },
        select: {
          id: true,
          stage: true,
          note: true,
          isCurrent: true,
          createdAt: true,
          changedBy: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      },
      documents: {
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          stage: true,
          name: true,
          mimeType: true,
          url: true,
          visibleToClient: true,
          createdAt: true,
        },
      },
      notes: {
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          content: true,
          visibleToClient: true,
          createdAt: true,
          author: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      },
    },
  });
}

export async function getPortalTransactionByToken(shareToken: string) {
  return prisma.transaction.findUnique({
    where: { shareToken },
    select: {
      id: true,
      currentStage: true,
      startedAt: true,
      ownerName: true,
      property: {
        select: {
          title: true,
          addressLine: true,
          city: true,
        },
      },
      candidacy: {
        select: {
          manualCandidateName: true,
          tenant: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      documents: {
        where: {
          visibleToClient: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          stage: true,
          name: true,
          url: true,
          createdAt: true,
        },
      },
      states: {
        orderBy: {
          createdAt: "asc",
        },
        select: {
          id: true,
          stage: true,
          note: true,
          createdAt: true,
        },
      },
    },
  });
}

export function getTransactionStages() {
  return transactionStages;
}

export function getTransactionStageLabel(stage: TransactionStageType) {
  switch (stage) {
    case "CANDIDATE_SELECTED":
      return "Candidato seleccionado";
    case "DOCS_COMPLETE":
      return "Documentación completa";
    case "CONTRACT_REVIEW":
      return "Contrato en revisión";
    case "CONTRACT_SIGNED":
      return "Contrato firmado";
    case "KEYS_DELIVERED":
      return "Llaves entregadas";
  }
}

export function getTransactionStageDescription(stage: TransactionStageType) {
  switch (stage) {
    case "CANDIDATE_SELECTED":
      return "Se eligió al candidato y arranca el circuito operativo.";
    case "DOCS_COMPLETE":
      return "La carpeta ya está lista para pasar a contrato.";
    case "CONTRACT_REVIEW":
      return "Las partes revisan cláusulas y observaciones.";
    case "CONTRACT_SIGNED":
      return "El contrato ya fue firmado por las partes.";
    case "KEYS_DELIVERED":
      return "Operación cerrada y posesión entregada.";
  }
}

export function getTransactionStageTone(
  currentStage: TransactionStageType,
  stage: TransactionStageType
) {
  const currentIndex = transactionStages.indexOf(currentStage);
  const stageIndex = transactionStages.indexOf(stage);

  if (stageIndex < currentIndex) {
    return "complete";
  }

  if (stageIndex === currentIndex) {
    return "current";
  }

  return "upcoming";
}

export function getNextTransactionStage(stage: TransactionStageType) {
  const index = transactionStages.indexOf(stage);

  if (index === -1 || index === transactionStages.length - 1) {
    return null;
  }

  return transactionStages[index + 1];
}

export function getGuaranteeLabel(value?: GuaranteeType | null) {
  switch (value) {
    case "MORTGAGE":
      return "Garantía hipotecaria";
    case "CAUTION_INSURANCE":
      return "Seguro de caución";
    case "NONE":
      return "Sin garantía";
    default:
      return "Sin dato";
  }
}

export function getCandidacySourceLabel(value: CandidacySource) {
  return value === "MANUAL" ? "Carga manual" : "Plataforma";
}

export function getCandidacyStatusLabel(value: CandidacyStatus) {
  switch (value) {
    case "SUBMITTED":
      return "Postulado";
    case "IN_REVIEW":
      return "En revisión";
    case "SHORTLISTED":
      return "Finalista";
    case "REJECTED":
      return "Rechazado";
    case "SELECTED":
      return "Seleccionado";
    case "WITHDRAWN":
      return "Retirado";
  }
}

export function formatCurrency(value: number | string | { toString(): string } | null | undefined) {
  if (value === null || value === undefined) {
    return "Sin dato";
  }

  const amount = typeof value === "number" ? value : Number(value.toString());

  if (Number.isNaN(amount)) {
    return "Sin dato";
  }

  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDateTime(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);

  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function getCandidateDisplayName(candidacy: CandidateLike) {
  if (candidacy.manualCandidateName) {
    return candidacy.manualCandidateName;
  }

  if (candidacy.tenant) {
    return `${candidacy.tenant.firstName} ${candidacy.tenant.lastName}`;
  }

  return "Candidato sin nombre";
}

export function getCandidateEmail(candidacy: CandidateLike) {
  return candidacy.manualCandidateEmail ?? candidacy.tenant?.email ?? null;
}

export function getCandidatePhone(candidacy: CandidateLike) {
  return candidacy.manualCandidatePhone ?? candidacy.tenant?.phone ?? null;
}
