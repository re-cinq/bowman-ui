import react from "@vitejs/plugin-react";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["tests/setup.ts"],
    // examples/chat-demo's Playwright suite matches the default spec glob but
    // runs under Playwright inside scripts/consumer-app.sh, never under vitest.
    exclude: [...configDefaults.exclude, "examples/**", "**/.claude/**"],
    coverage: {
      provider: "v8",
      include: ["src/**"],
      // The barrel only re-exports; thresholds are enforced on real component code.
      // src/types/** is excluded because a types-only module emits no statements,
      // so v8 has nothing to count there.
      exclude: ["src/index.ts", "src/types/**"],
      // The floor starts high rather than low-and-ratcheting: C-17 puts
      // characterization tests before each extraction, so every file arrives
      // covered. If a real extraction cannot hold 90 on branches, lower it once,
      // in that PR, with the number and reason recorded - and never again.
      thresholds: { lines: 100, functions: 100, statements: 100, branches: 90 },
    },
  },
});
