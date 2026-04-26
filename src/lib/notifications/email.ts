import { Resend } from "resend";

import type { TransactionStageType } from "@prisma/client";

const resendApiKey = process.env.RESEND_API_KEY;
const resendFromEmail = process.env.RESEND_FROM_EMAIL;

const resend = resendApiKey ? new Resend(resendApiKey) : null;

type TransactionStageEmailInput = {
  to: string;
  transactionId: string;
  propertyTitle: string;
  propertyAddress: string;
  stage: TransactionStageType;
  stageLabel: string;
  portalUrl?: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getStageCopy(stage: TransactionStageType) {
  switch (stage) {
    case "CANDIDATE_SELECTED":
      return "Se seleccionó un candidato para avanzar con la operación.";
    case "DOCS_COMPLETE":
      return "La documentación fue marcada como completa.";
    case "CONTRACT_REVIEW":
      return "El contrato entró en etapa de revisión.";
    case "CONTRACT_SIGNED":
      return "El contrato ya fue firmado.";
    case "KEYS_DELIVERED":
      return "La entrega de llaves fue completada.";
    default:
      return "Hubo un avance en la transacción.";
  }
}

export async function sendTransactionStageEmail(input: TransactionStageEmailInput) {
  if (!resend || !resendFromEmail) {
    return { skipped: true as const };
  }

  const subject = `PropTech: ${input.stageLabel} - ${input.propertyTitle}`;
  const portalSection = input.portalUrl
    ? `<p>Podés revisar el detalle en <a href="${escapeHtml(input.portalUrl)}">${escapeHtml(
        input.portalUrl
      )}</a>.</p>`
    : "";

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
      <h2 style="margin-bottom: 16px;">Actualización de transacción</h2>
      <p>${escapeHtml(getStageCopy(input.stage))}</p>
      <p><strong>Propiedad:</strong> ${escapeHtml(input.propertyTitle)}</p>
      <p><strong>Dirección:</strong> ${escapeHtml(input.propertyAddress)}</p>
      <p><strong>Estado:</strong> ${escapeHtml(input.stageLabel)}</p>
      ${portalSection}
      <p style="margin-top: 24px; color: #6b7280;">Transacción ${escapeHtml(input.transactionId)}</p>
    </div>
  `;

  await resend.emails.send({
    from: resendFromEmail,
    to: input.to,
    subject,
    html,
  });

  return { skipped: false as const };
}
