export function trustScorePrompt() {
  return [
    "Analizá el perfil y los documentos de un inquilino.",
    "Devolvé SOLO JSON válido con score, dimensions, improvementSuggestion, flags y explanation.",
    "El score debe reflejar cobertura documental, consistencia de ingresos, tipo de garantía y historial de plataforma.",
  ].join(" ");
}

export function compatibilityPrompt() {
  return [
    "Analizá la compatibilidad entre un perfil de inquilino y una propiedad.",
    "Devolvé SOLO JSON válido con compatibilityScore, explanation, matchPoints y conflicts.",
    "Explicá de forma concreta qué encaja y qué choca entre ambos perfiles.",
  ].join(" ");
}

export function candidatesSummaryPrompt() {
  return [
    "Compará candidatos de una propiedad y devolvé SOLO JSON válido.",
    "Incluí summary, topCandidateId y highlights con candidateId y strength.",
    "Elegí como topCandidateId el candidato con mejor equilibrio entre score, garantía y consistencia.",
  ].join(" ");
}

export function docFraudDetectionPrompt() {
  return [
    "Evaluá si un comprobante de ingresos podría estar alterado.",
    "Devolvé SOLO JSON válido con suspicious, confidence y reason.",
    "No inventes certezas: si no hay señales fuertes, marcá suspicious false.",
  ].join(" ");
}
