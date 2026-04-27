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
      trustScore: 55,
      guaranteeType: "NONE",
      hasPets: true,
      isSmoker: true,
      hasChildren: true,
      familyMembers: 4,
    },
    property: {
      title: "PH en Caballito",
      city: "CABA",
      province: "Buenos Aires",
      price: 450_000,
      squareMeters: 34,
      bedrooms: 1,
      targetTrustScore: 80,
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
  assert.ok(result.conflicts.includes("El tamaño del grupo familiar queda ajustado para esta unidad"));
  assert.ok(
    result.conflicts.includes("El perfil preferido de la propiedad no coincide")
  );
  assert.match(result.explanation, /Compatibilidad baja o riesgosa/);
});

test("deriveCompatibilityFallback favors aligned candidates", () => {
  const result = deriveCompatibilityFallback({
    tenantProfile: {
      profileType: "EMPLOYED",
      monthlyIncome: 2_000_000,
      trustScore: 88,
      guaranteeType: "CAUTION_INSURANCE",
      hasPets: false,
      isSmoker: false,
      hasChildren: false,
      familyMembers: 2,
    },
    property: {
      title: "Departamento 3 ambientes",
      city: "CABA",
      province: "Buenos Aires",
      price: 450_000,
      squareMeters: 58,
      bedrooms: 2,
      targetTrustScore: 75,
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
  assert.ok(result.matchPoints.includes("Tu trust score alcanza el objetivo pedido"));
  assert.match(result.explanation, /Compatibilidad alta|Compatibilidad sólida/);
});

test("deriveCompatibilityFallback differentiates similar listings using trust target and unit fit", () => {
  const tenantProfile = {
    profileType: "EMPLOYED" as const,
    monthlyIncome: 1_500_000,
    trustScore: 72,
    guaranteeType: "CAUTION_INSURANCE" as const,
    hasPets: false,
    isSmoker: false,
    hasChildren: true,
    familyMembers: 3,
  };

  const strongerMatch = deriveCompatibilityFallback({
    tenantProfile,
    property: {
      title: "3 ambientes luminoso",
      city: "CABA",
      province: "Buenos Aires",
      price: 420_000,
      squareMeters: 64,
      bedrooms: 2,
      targetTrustScore: 65,
      acceptedGuarantees: ["CAUTION_INSURANCE"],
      acceptsPets: true,
      acceptsSmokers: false,
      acceptsChildren: true,
      preferredProfile: "EMPLOYED",
    },
  });

  const weakerMatch = deriveCompatibilityFallback({
    tenantProfile,
    property: {
      title: "Monoambiente premium",
      city: "CABA",
      province: "Buenos Aires",
      price: 420_000,
      squareMeters: 28,
      bedrooms: 1,
      targetTrustScore: 85,
      acceptedGuarantees: ["MORTGAGE"],
      acceptsPets: true,
      acceptsSmokers: false,
      acceptsChildren: false,
      preferredProfile: "MONOTRIBUTISTA",
    },
  });

  assert.ok(strongerMatch.compatibilityScore > weakerMatch.compatibilityScore);
});
