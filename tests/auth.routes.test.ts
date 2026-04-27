import assert from "node:assert/strict";
import test from "node:test";

import {
  getAuthCallbackUrl,
  getDefaultRolePath,
  getLoginRedirect,
  getRoleFromPathname,
  normalizeRole,
} from "../src/lib/auth/config";

test("normalizeRole accepts only supported app roles", () => {
  assert.equal(normalizeRole("tenant"), "tenant");
  assert.equal(normalizeRole("agency"), "agency");
  assert.equal(normalizeRole("admin"), "admin");
  assert.equal(normalizeRole("owner"), null);
  assert.equal(normalizeRole(undefined), null);
  assert.equal(normalizeRole(42), null);
});

test("role paths and pathname parsing stay aligned", () => {
  assert.equal(getDefaultRolePath("tenant"), "/tenant/properties");
  assert.equal(getDefaultRolePath("agency"), "/agency");
  assert.equal(getRoleFromPathname("/tenant/properties"), "tenant");
  assert.equal(getRoleFromPathname("/agency/transactions/123"), "agency");
  assert.equal(getRoleFromPathname("/public"), null);
  assert.equal(getRoleFromPathname("/"), null);
});

test("login redirect encodes the error reason when present", () => {
  assert.equal(getLoginRedirect(), "/login");
  assert.equal(
    getLoginRedirect("Iniciá sesión para continuar."),
    "/login?error=Inici%C3%A1%20sesi%C3%B3n%20para%20continuar."
  );
});

test("auth callback URL preserves the next path and falls back to localhost", () => {
  const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;

  delete process.env.NEXT_PUBLIC_APP_URL;
  assert.equal(
    getAuthCallbackUrl("/tenant/documents?tab=1"),
    "http://localhost:3000/auth/callback?next=%2Ftenant%2Fdocuments%3Ftab%3D1"
  );

  process.env.NEXT_PUBLIC_APP_URL = "https://proptech.example.com";
  assert.equal(
    getAuthCallbackUrl("/agency/properties/new"),
    "https://proptech.example.com/auth/callback?next=%2Fagency%2Fproperties%2Fnew"
  );

  if (originalAppUrl === undefined) {
    delete process.env.NEXT_PUBLIC_APP_URL;
  } else {
    process.env.NEXT_PUBLIC_APP_URL = originalAppUrl;
  }
});
