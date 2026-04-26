import { test, expect } from "@playwright/test";
import { getAuthCookies } from "./helpers/login";

test.beforeEach(async ({ context }) => {
  const cookies = await getAuthCookies("agency");
  if (!cookies) {
    test.skip(true, "Supabase auth unavailable for agency demo user");
    return;
  }
  await context.addCookies(cookies);
});

test.describe("Agency flows", () => {
  test("dashboard loads and shows metrics header", async ({ page }) => {
    await page.goto("/agency");

    await expect(page).toHaveURL("/agency");
    await expect(page.getByRole("heading", { name: /métricas operativas/i })).toBeVisible();
  });

  test("dashboard shows propiedades stat card", async ({ page }) => {
    await page.goto("/agency");

    await expect(page.getByText(/propiedades cargadas/i)).toBeVisible();
  });

  test("dashboard shows transacciones stat card", async ({ page }) => {
    await page.goto("/agency");

    await expect(page.getByText(/transacciones activas/i)).toBeVisible();
  });

  test("dashboard shows Ver propiedades link", async ({ page }) => {
    await page.goto("/agency");

    await expect(page.getByRole("link", { name: /ver propiedades/i })).toBeVisible();
  });

  test("dashboard shows Ver transacciones link", async ({ page }) => {
    await page.goto("/agency");

    await expect(page.getByRole("link", { name: /ver transacciones/i })).toBeVisible();
  });

  test("dashboard shows Cargar inmueble link", async ({ page }) => {
    await page.goto("/agency");

    await expect(page.getByRole("link", { name: /cargar inmueble/i })).toBeVisible();
  });

  test("/properties page loads", async ({ page }) => {
    await page.goto("/agency/properties");

    await expect(page).toHaveURL("/agency/properties");
    await expect(page.getByRole("main")).toBeVisible();
  });

  test("/transactions page loads", async ({ page }) => {
    await page.goto("/agency/transactions");

    await expect(page).toHaveURL("/agency/transactions");
    await expect(page.getByRole("main")).toBeVisible();
  });

  test("agency session cannot access /tenant", async ({ page }) => {
    await page.goto("/tenant");

    await expect(page).toHaveURL(/\/login/);
  });
});
