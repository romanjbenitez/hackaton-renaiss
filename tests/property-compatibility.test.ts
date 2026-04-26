import assert from "node:assert/strict";
import test from "node:test";

import { resolvePropertyCompatibility } from "../src/lib/tenant/property-compatibility";

test("resolvePropertyCompatibility prefers persisted AI fields from the latest application", () => {
  const result = resolvePropertyCompatibility(
    {
      aiCompatibilityScore: 91,
      aiCompatibilityExplanation: "Compatibilidad persistida.",
      aiCompatibilityMatchPoints: ["Ingreso suficiente"],
      aiCompatibilityConflicts: [],
    },
    {
      compatibilityScore: 74,
      explanation: "Compatibilidad local.",
      matchPoints: ["Tiene garantía"],
      conflicts: ["Sin historial"],
    }
  );

  assert.deepEqual(result, {
    compatibilityScore: 91,
    explanation: "Compatibilidad persistida.",
    matchPoints: ["Ingreso suficiente"],
    conflicts: [],
  });
});

test("resolvePropertyCompatibility falls back when there is no persisted compatibility yet", () => {
  const fallback = {
    compatibilityScore: 74,
    explanation: "Compatibilidad local.",
    matchPoints: ["Tiene garantía"],
    conflicts: ["Sin historial"],
  };

  const result = resolvePropertyCompatibility(
    {
      aiCompatibilityScore: null,
      aiCompatibilityExplanation: null,
      aiCompatibilityMatchPoints: null,
      aiCompatibilityConflicts: null,
    },
    fallback
  );

  assert.equal(result, fallback);
});
