import { test, expect } from "@playwright/test";

test.describe("Login page", () => {
  test("renders role selector and login form", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("link", { name: /inquilino/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /inmobiliaria/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /admin/i })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Contraseña")).toBeVisible();
    await expect(page.getByRole("button", { name: /ingresar con email/i })).toBeVisible();
  });

  test("defaults to tenant role", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByText(/entrar como inquilino/i)).toBeVisible();
  });

  test("switching to agency role shows agency form", async ({ page }) => {
    await page.goto("/login");

    await page.getByRole("link", { name: /inmobiliaria/i }).click();

    await expect(page).toHaveURL(/role=agency/);
    await expect(page.getByText(/entrar como inmobiliaria/i)).toBeVisible();
  });

  test("error param renders inline error message", async ({ page }) => {
    await page.goto("/login?error=Credenciales%20inv%C3%A1lidas");

    await expect(page.getByText(/credenciales inválidas/i)).toBeVisible();
  });

  test("clicking Usar fills email and password fields", async ({ page }) => {
    await page.goto("/login?role=tenant");

    await page.getByRole("button", { name: "Usar" }).first().click();

    await expect(page.getByLabel("Email")).not.toHaveValue("");
    await expect(page.getByLabel("Contraseña")).not.toHaveValue("");
  });

  test("shows Google login button", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByRole("button", { name: /continuar con google/i })).toBeVisible();
  });

  test("shows create account link", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByRole("link", { name: /crear cuenta/i })).toBeVisible();
  });
});
