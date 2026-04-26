import { test, expect } from "@playwright/test";
import { getAuthCookies } from "./helpers/login";

test.beforeEach(async ({ context }) => {
  const cookies = await getAuthCookies("tenant");
  if (!cookies) {
    test.skip(true, "Supabase auth unavailable for tenant demo user");
    return;
  }
  await context.addCookies(cookies);
});

test.describe("Tenant flows", () => {
  test("dashboard loads and shows status section", async ({ page }) => {
    await page.goto("/tenant");

    await expect(page).toHaveURL("/tenant");
    await expect(page.getByText(/pasaporte/i).first()).toBeVisible();
  });

  test("dashboard shows próximos pasos section", async ({ page }) => {
    await page.goto("/tenant");

    await expect(page.getByText(/próximos pasos/i)).toBeVisible();
  });

  test("dashboard shows Ver publicaciones link", async ({ page }) => {
    await page.goto("/tenant");

    await expect(page.getByRole("link", { name: /ver publicaciones/i })).toBeVisible();
  });

  test("dashboard shows primary action button", async ({ page }) => {
    await page.goto("/tenant");

    await expect(
      page.getByRole("link", { name: /onboarding|ver perfil|completar legajo/i }).first()
    ).toBeVisible();
  });

  test("/properties page loads", async ({ page }) => {
    await page.goto("/tenant/properties");

    await expect(page).toHaveURL("/tenant/properties");
    await expect(page.getByRole("main")).toBeVisible();
  });

  test("/documents page loads", async ({ page }) => {
    await page.goto("/tenant/documents");

    await expect(page).toHaveURL("/tenant/documents");
    await expect(page.getByRole("main")).toBeVisible();
  });

  test("/profile page loads", async ({ page }) => {
    await page.goto("/tenant/profile");

    await expect(page).toHaveURL("/tenant/profile");
    await expect(page.getByRole("main")).toBeVisible();
  });

  test("/onboarding page loads", async ({ page }) => {
    await page.goto("/tenant/onboarding");

    await expect(page).toHaveURL("/tenant/onboarding");
    await expect(page.getByRole("main")).toBeVisible();
  });

  test("tenant session cannot access /agency", async ({ page }) => {
    await page.goto("/agency");

    await expect(page).toHaveURL(/\/login/);
  });
});
