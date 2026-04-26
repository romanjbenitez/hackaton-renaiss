import assert from "node:assert/strict";
import test from "node:test";

import {
  getGuaranteeDocumentType,
  getGuaranteeLabel,
  getRequiredDocuments,
} from "../src/lib/catalogs/tenant-documents";

test("required documents reflect each tenant profile", () => {
  assert.deepEqual(
    getRequiredDocuments("EMPLOYED").map((document) => document.documentType),
    ["DNI", "PAYSLIP"]
  );
  assert.deepEqual(
    getRequiredDocuments("MONOTRIBUTISTA").map((document) => document.documentType),
    ["DNI", "MONOTRIBUTO_CERTIFICATE", "MONOTRIBUTO_PAYMENT"]
  );
  assert.deepEqual(
    getRequiredDocuments("SELF_EMPLOYED").map((document) => document.documentType),
    ["DNI", "INCOME_AFFIDAVIT"]
  );
  assert.deepEqual(
    getRequiredDocuments("RETIRED").map((document) => document.documentType),
    ["DNI", "RETIREMENT_RECEIPT"]
  );
});

test("guarantee helpers map labels and backing document types consistently", () => {
  assert.equal(getGuaranteeDocumentType("MORTGAGE"), "MORTGAGE_GUARANTEE");
  assert.equal(getGuaranteeDocumentType("CAUTION_INSURANCE"), "CAUTION_INSURANCE");
  assert.equal(getGuaranteeDocumentType("NONE"), null);

  assert.equal(getGuaranteeLabel("MORTGAGE"), "Garantia hipotecaria");
  assert.equal(getGuaranteeLabel("CAUTION_INSURANCE"), "Seguro de caucion");
  assert.equal(getGuaranteeLabel("NONE"), "Sin garantia definida");
});

test("required document metadata keeps upload hints for the UI", () => {
  const employedDocuments = getRequiredDocuments("EMPLOYED");
  const dni = employedDocuments[0];
  const payslip = employedDocuments[1];

  assert.equal(dni.accept, "image/*,.pdf");
  assert.match(dni.helperText, /documento/i);
  assert.equal(payslip.accept, "image/*,.pdf");
  assert.match(payslip.helperText, /PDF|imagen/i);
});

