import { DocumentType, DocumentVerificationStatus } from "@prisma/client";

export function getDocumentTypeLabel(type: DocumentType) {
  switch (type) {
    case DocumentType.DNI:
      return "DNI";
    case DocumentType.PAYSLIP:
      return "Recibo de sueldo";
    case DocumentType.MONOTRIBUTO_CERTIFICATE:
      return "Constancia de monotributo";
    case DocumentType.MONOTRIBUTO_PAYMENT:
      return "Pago de monotributo";
    case DocumentType.INCOME_AFFIDAVIT:
      return "Declaración jurada de ingresos";
    case DocumentType.RETIREMENT_RECEIPT:
      return "Recibo de jubilación";
    case DocumentType.MORTGAGE_GUARANTEE:
      return "Garantía hipotecaria";
    case DocumentType.CAUTION_INSURANCE:
      return "Seguro de caución";
    case DocumentType.CONTRACT:
      return "Contrato";
    default:
      return "Otro documento";
  }
}

export function getDocumentVerificationStatusLabel(status: DocumentVerificationStatus) {
  switch (status) {
    case DocumentVerificationStatus.VERIFIED:
      return "Verificado";
    case DocumentVerificationStatus.REJECTED:
      return "Rechazado";
    case DocumentVerificationStatus.FLAGGED:
      return "Pendiente de revisión";
    default:
      return "Pendiente";
  }
}

export function getDocumentVerificationStatusTone(status: DocumentVerificationStatus) {
  switch (status) {
    case DocumentVerificationStatus.VERIFIED:
      return "emerald";
    case DocumentVerificationStatus.REJECTED:
      return "rose";
    case DocumentVerificationStatus.FLAGGED:
      return "amber";
    default:
      return "slate";
  }
}

export function getDocumentTenantFeedback(
  status: DocumentVerificationStatus,
  reason?: string | null
) {
  switch (status) {
    case DocumentVerificationStatus.VERIFIED:
      return reason?.trim().length
        ? `Validado manualmente. ${reason}`
        : "Documento validado correctamente.";
    case DocumentVerificationStatus.REJECTED:
      return reason?.trim().length
        ? `Documento rechazado. ${reason}`
        : "Documento rechazado por revisión manual.";
    case DocumentVerificationStatus.FLAGGED:
      return reason?.trim().length
        ? `Pendiente de revisión. ${reason}`
        : "El documento quedó retenido para revisión manual.";
    default:
      return reason?.trim().length ? reason : "Documento pendiente de validación.";
  }
}
