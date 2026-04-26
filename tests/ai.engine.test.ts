import test from "node:test";
import assert from "node:assert/strict";

import {
  deriveCompatibilityFallback,
  deriveTrustScoreFallback,
} from "../src/lib/ai/fallback";

test("deriveTrustScoreFallback penalizes missing documentation and missing guarantee", () => {
  const result = deriveTrustScoreFallback({
    tenantProfile: {
      profileType: "EMPLOYED",
      monthlyIncome: null,
      guaranteeType: "NONE",
      platformHistoryScore: null,
    },
    documents: [],
  });

  assert.equal(result.dimensions.docCompleteness, 30);
  assert.ok(result.flags.includes("Falta DNI"));
  assert.ok(result.flags.includes("Faltan comprobantes de ingresos"));
  assert.ok(result.flags.includes("Garantía no declarada"));
  assert.match(result.explanation, /Score calculado localmente/);
  assert.ok(result.score >= 0 && result.score <= 100);
});

test("deriveTrustScoreFallback rewards complete profiles with backing documents", () => {
  const result = deriveTrustScoreFallback({
    tenantProfile: {
      profileType: "EMPLOYED",
      monthlyIncome: 2_400_000,
      guaranteeType: "MORTGAGE",
      platformHistoryScore: 88,
    },
    documents: [
      { type: "DNI", displayName: "DNI frente" },
      { type: "PAYSLIP", displayName: "Recibo abril" },
      { type: "MORTGAGE_GUARANTEE", displayName: "Escritura" },
    ],
  });

  assert.equal(result.dimensions.docCompleteness, 100);
  assert.equal(result.dimensions.guaranteeType, 92);
  assert.equal(result.dimensions.platformHistory, 88);
  assert.deepEqual(result.flags, []);
  assert.ok(result.score >= 80);
});

test("deriveCompatibilityFallback surfaces conflicts when property rules do not match the profile", () => {
  const result = deriveCompatibilityFallback({
    tenantProfile: {
      profileType: "EMPLOYED",
      monthlyIncome: 900_000,
      guaranteeType: "NONE",
      hasPets: true,
      isSmoker: true,
      hasChildren: true,
    },
    property: {
      title: "PH en Caballito",
      city: "CABA",
      province: "Buenos Aires",
      price: 450_000,
      acceptedGuarantees: ["CAUTION_INSURANCE"],
      acceptsPets: false,
      acceptsSmokers: false,
      acceptsChildren: false,
      preferredProfile: "MONOTRIBUTISTA",
    },
  });

  assert.ok(result.compatibilityScore < 60);
  assert.ok(result.conflicts.includes("La propiedad no acepta mascotas"));
  assert.ok(result.conflicts.includes("La propiedad no acepta fumadores"));
  assert.ok(result.conflicts.includes("La propiedad no acepta niños"));
  assert.ok(
    result.conflicts.includes("El perfil preferido de la propiedad no coincide")
  );
  assert.match(result.explanation, /Compatibilidad moderada/);
});

test("deriveCompatibilityFallback favors aligned candidates", () => {
  const result = deriveCompatibilityFallback({
    tenantProfile: {
      profileType: "EMPLOYED",
      monthlyIncome: 2_000_000,
      guaranteeType: "CAUTION_INSURANCE",
      hasPets: false,
      isSmoker: false,
      hasChildren: false,
    },
    property: {
      title: "Departamento 3 ambientes",
      city: "CABA",
      province: "Buenos Aires",
      price: 450_000,
      acceptedGuarantees: ["CAUTION_INSURANCE", "MORTGAGE"],
      acceptsPets: true,
      acceptsSmokers: false,
      acceptsChildren: true,
      preferredProfile: "EMPLOYED",
    },
  });

  assert.ok(result.compatibilityScore >= 90);
  assert.equal(result.conflicts.length, 0);
  assert.ok(result.matchPoints.includes("Relación ingreso/alquiler saludable"));
  assert.ok(
    result.matchPoints.includes("La garantía declarada encaja con la propiedad")
  );
  assert.match(result.explanation, /Compatibilidad sólida/);
});
