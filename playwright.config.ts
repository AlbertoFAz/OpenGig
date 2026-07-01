import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const authFile = "tests/e2e/.auth/user.json";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "html",
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    // 1. Setup: realiza el login y guarda el estado de autenticación
    {
      name: "setup",
      testMatch: /global\.setup\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },

    // 2. Tests públicos: no requieren autenticación
    {
      name: "public",
      testIgnore:
        /global\.setup|concerts\.spec|private-calendar\.spec|profile\.spec|accessibility-auth\.spec/,
      use: { ...devices["Desktop Chrome"] },
    },

    // 3. Tests autenticados: dependen del setup
    {
      name: "authenticated",
      testMatch: /\/(concerts|private-calendar|profile|accessibility-auth)\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: authFile,
      },
      dependencies: ["setup"],
    },
  ],
  ...(process.env.CI ? { workers: 1 } : {}),
  ...(process.env.PLAYWRIGHT_BASE_URL
    ? {}
    : {
        webServer: {
          command: "npm run dev",
          url: "http://localhost:3000",
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
        },
      }),
});
