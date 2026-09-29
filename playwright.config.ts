import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e",
  timeout: 60000,
  use: {
    baseURL: "http://127.0.0.1:4173",
    viewport: { width: 1440, height: 1100 },
    headless: true,
    screenshot: "only-on-failure",
    reducedMotion: "reduce",
  },
  webServer: {
    command: "node scripts/serve-preview.cjs",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: true,
  },
});
