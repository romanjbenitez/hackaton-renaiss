import type { GuaranteeType, ProfileType } from "@/lib/tenant/documents";

export type RequiredDocument = {
  documentType: string;
  label: string;
  helperText: string;
  accept?: string;
};

const requiredDocumentsByProfile: Record<ProfileType, RequiredDocument[]> = {
  EMPLOYED: [
    {
      documentType: "DNI",
      label: "DNI",
      helperText: "Frente o imagen legible del documento.",
      accept: "image/*,.pdf",
    },
    {
      documentType: "PAYSLIP",
      label: "Ultimos 3 recibos de sueldo",
      helperText: "Subi un PDF o imagen con los tres recibos consolidados.",
      accept: "image/*,.pdf",
    },
  ],
  MONOTRIBUTISTA: [
    {
      documentType: "DNI",
      label: "DNI",
      helperText: "Frente o imagen legible del documento.",
      accept: "image/*,.pdf",
    },
    {
      documentType: "MONOTRIBUTO_CERTIFICATE",
      label: "Constancia de monotributo",
      helperText: "Comprobante de inscripcion vigente.",
      accept: ".pdf,image/*",
    },
    {
      documentType: "MONOTRIBUTO_PAYMENT",
      label: "Ultimos 3 pagos",
      helperText: "Podes consolidarlos en un solo PDF.",
      accept: ".pdf,image/*",
    },
  ],
  SELF_EMPLOYED: [
    {
      documentType: "DNI",
      label: "DNI",
      helperText: "Frente o imagen legible del documento.",
      accept: "image/*,.pdf",
    },
    {
      documentType: "INCOME_AFFIDAVIT",
      label: "Declaracion jurada de ingresos",
      helperText: "Comprobante emitido por contador o declaracion equivalente.",
      accept: ".pdf,image/*",
    },
  ],
  RETIRED: [
    {
      documentType: "DNI",
      label: "DNI",
      helperText: "Frente o imagen legible del documento.",
      accept: "image/*,.pdf",
    },
    {
      documentType: "RETIREMENT_RECEIPT",
      label: "Ultimo recibo de jubilacion",
      helperText: "Comprobante mensual mas reciente.",
      accept: ".pdf,image/*",
    },
  ],
};

const guaranteeDocumentTypes: Record<GuaranteeType, string | null> = {
  MORTGAGE: "MORTGAGE_GUARANTEE",
  CAUTION_INSURANCE: "CAUTION_INSURANCE",
  NONE: null,
};

const guaranteeLabels: Record<GuaranteeType, string> = {
  MORTGAGE: "Garantia hipotecaria",
  CAUTION_INSURANCE: "Seguro de caucion",
  NONE: "Sin garantia definida",
};

export function getRequiredDocuments(profileType: ProfileType) {
  return requiredDocumentsByProfile[profileType];
}

export function getGuaranteeDocumentType(guaranteeType: GuaranteeType) {
  return guaranteeDocumentTypes[guaranteeType];
}

export function getGuaranteeLabel(guaranteeType: GuaranteeType) {
  return guaranteeLabels[guaranteeType];
}

