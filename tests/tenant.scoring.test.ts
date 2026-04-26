import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateBaseScore,
  getTrustScoreLabel,
  getTrustScoreTone,
} from "../src/lib/tenant/scoring";

test("calculateBaseScore clamps and rewards complete applicant information", () => {
  const minimalScore = calculateBaseScore({
    hasDni: false,
    hasIncomeProof: false,
    hasGuaranteeProof: false,
    hasLifestyleProfile: false,
    hasMonthlyIncome: false,
    guaranteeType: "NONE",
  });

  const strongScore = calculateBaseScore({
    hasDni: true,
    hasIncomeProof: true,
    hasGuaranteeProof: true,
    hasLifestyleProfile: true,
    hasMonthlyIncome: true,
    guaranteeType: "MORTGAGE",
  });

  assert.equal(minimalScore, 15);
  assert.equal(strongScore, 100);
});

test("calculateBaseScore differentiates guarantee quality", () => {
  const cautionScore = calculateBaseScore({
    hasDni: true,
    hasIncomeProof: true,
    hasGuaranteeProof: false,
    hasLifestyleProfile: true,
    hasMonthlyIncome: true,
    guaranteeType: "CAUTION_INSURANCE",
  });

  const noGuaranteeScore = calculateBaseScore({
    hasDni: true,
    hasIncomeProof: true,
    hasGuaranteeProof: false,
    hasLifestyleProfile: true,
    hasMonthlyIncome: true,
    guaranteeType: "NONE",
  });

  assert.equal(cautionScore - noGuaranteeScore, 7);
});

test("trust score labels and tones stay aligned on thresholds", () => {
  assert.equal(getTrustScoreLabel(80), "Excelente");
  assert.equal(getTrustScoreLabel(65), "Bueno");
  assert.equal(getTrustScoreLabel(45), "Regular");
  assert.equal(getTrustScoreLabel(44), "Riesgoso");

  assert.equal(getTrustScoreTone(80), "emerald");
  assert.equal(getTrustScoreTone(65), "sky");
  assert.equal(getTrustScoreTone(45), "amber");
  assert.equal(getTrustScoreTone(44), "rose");
});

