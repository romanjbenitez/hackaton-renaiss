// Auth setup is only used when running browser projects.
// In API-only mode this file is not referenced by any project dependency.
import { test as setup } from "@playwright/test";
import { injectDemoSession } from "./helpers/demo-cookie";

setup("authenticate as tenant", async ({ context, page }) => {
  await injectDemoSession(context, "tenant");
  await page.goto("/tenant");
  await page.waitForURL("/tenant");
  await context.storageState({ path: ".playwright/tenant.json" });
});

setup("authenticate as agency", async ({ context, page }) => {
  await injectDemoSession(context, "agency");
  await page.goto("/agency");
  await page.waitForURL("/agency");
  await context.storageState({ path: ".playwright/agency.json" });
});
