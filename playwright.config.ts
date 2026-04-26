import { defineConfig, devices } from "@playwright/test";
import { config as loadDotenv } from "dotenv";
import { resolve } from "path";

loadDotenv({ path: resolve(__dirname, ".env") });

export default defineConfig({
  testDir: "./e2e",
  testIgnore: "**/auth.setup.ts",
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  reporter: [["html", { open: "never" }], ["list"]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "api",
      testMatch: "**/auth-guard.spec.ts",
    },
    {
      name: "browser",
      testMatch: ["**/login.spec.ts", "**/tenant.spec.ts", "**/agency.spec.ts"],
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
