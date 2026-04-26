/**
 * Auth guard tests — API mode (no browser required).
 * Verifies that protected routes redirect unauthenticated requests to /login.
 */
import { test, expect } from "@playwright/test";

const protectedRoutes = [
  "/tenant",
  "/tenant/documents",
  "/tenant/profile",
  "/tenant/onboarding",
  "/tenant/properties",
  "/agency",
  "/agency/properties",
  "/agency/transactions",
  "/admin",
];

for (const route of protectedRoutes) {
  test(`unauthenticated ${route} ends up at /login`, async ({ request }) => {
    const response = await request.get(route);

    expect(response.ok()).toBe(true);
    expect(new URL(response.url()).pathname).toMatch(/^\/login/);
  });
}
