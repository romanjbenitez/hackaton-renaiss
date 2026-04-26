import assert from "node:assert/strict";
import test from "node:test";

import {
  getPropertyTypeLabel,
  matchesPriceRange,
  priceRangeLabels,
  propertySortLabels,
} from "../src/lib/catalogs/property";

test("property labels expose user-facing text for known types", () => {
  assert.equal(getPropertyTypeLabel("APARTMENT"), "Departamento");
  assert.equal(getPropertyTypeLabel("COMMERCIAL"), "Local");
  assert.equal(getPropertyTypeLabel("OTHER"), "Otro");
  assert.equal(getPropertyTypeLabel("CUSTOM_TYPE"), "CUSTOM_TYPE");
});

test("price range filters handle boundaries consistently", () => {
  assert.equal(matchesPriceRange(400000, "up_to_400k"), true);
  assert.equal(matchesPriceRange(400001, "up_to_400k"), false);

  assert.equal(matchesPriceRange(400000, "400k_to_800k"), true);
  assert.equal(matchesPriceRange(800000, "400k_to_800k"), true);
  assert.equal(matchesPriceRange(399999, "400k_to_800k"), false);
  assert.equal(matchesPriceRange(800001, "400k_to_800k"), false);

  assert.equal(matchesPriceRange(800000, "800k_to_1500k"), true);
  assert.equal(matchesPriceRange(1500000, "800k_to_1500k"), true);
  assert.equal(matchesPriceRange(1500001, "800k_to_1500k"), false);

  assert.equal(matchesPriceRange(1500000, "more_than_1500k"), true);
  assert.equal(matchesPriceRange(1499999, "more_than_1500k"), false);
  assert.equal(matchesPriceRange(123456, "all"), true);
});

test("catalog labels stay complete for filters and sorting", () => {
  assert.deepEqual(Object.keys(propertySortLabels).sort(), [
    "compatibility_desc",
    "price_asc",
    "price_desc",
    "recent_desc",
  ]);
  assert.equal(priceRangeLabels.up_to_400k, "Hasta $400.000");
  assert.equal(priceRangeLabels.more_than_1500k, "Más de $1.500.000");
});

