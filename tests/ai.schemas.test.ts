import test from "node:test";
import assert from "node:assert/strict";

import { compatibilityAiSchema, trustScoreAiSchema } from "../src/lib/ai/schemas";

test("trustScoreAiSchema parses valid payloads", () => {
  const payload = {
    score: 78,
    dimensions: {
      docCompleteness: 85,
      incomeConsistency: 70,
      guaranteeType: 82,
      platformHistory: 74,
    },
    improvementSuggestion: "Sumar un recibo más para robustecer ingresos.",
    flags: ["Documento pendiente"],
    explanation: "El perfil está bien respaldado y no muestra inconsistencias graves.",
  };

  const result = trustScoreAiSchema.safeParse(payload);

  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.score, 78);
    assert.deepEqual(result.data.flags, ["Documento pendiente"]);
  }
});

test("trustScoreAiSchema rejects out-of-range values", () => {
  const result = trustScoreAiSchema.safeParse({
    score: 120,
    dimensions: {
      docCompleteness: 85,
      incomeConsistency: 70,
      guaranteeType: 82,
      platformHistory: 74,
    },
    improvementSuggestion: "Completar perfil.",
    flags: [],
    explanation: "Texto válido",
  });

  assert.equal(result.success, false);
});

test("compatibilityAiSchema fills default arrays when omitted", () => {
  const result = compatibilityAiSchema.parse({
    compatibilityScore: 84,
    explanation: "Buen encaje general entre perfil y propiedad.",
  });

  assert.deepEqual(result.matchPoints, []);
  assert.deepEqual(result.conflicts, []);
});

test("compatibilityAiSchema rejects empty explanations", () => {
  const result = compatibilityAiSchema.safeParse({
    compatibilityScore: 84,
    explanation: "",
    matchPoints: [],
    conflicts: [],
  });

  assert.equal(result.success, false);
});
