import { defineConfig, devices } from "@playwright/test";

const onCi = process.env.CI !== undefined;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  retries: onCi ? 2 : 0,
  workers: onCi ? 1 : undefined,
  use: {
    baseURL: "http://127.0.0.1:4173",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run preview -- --host 127.0.0.1 --port 4173 --strictPort",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: false,
  },
});
