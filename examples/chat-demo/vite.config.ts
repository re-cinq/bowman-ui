import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// GitHub Pages serves a project site under "/<repo>/", so the deploy workflow
// hands that prefix in through VITE_BASE_PATH. Unset - every local run, the
// Playwright suite and scripts/consumer-app.sh included - the app is served
// from the root. The trailing slash Vite wants is added here rather than in
// the workflow, so a value copied from actions/configure-pages ("/bowman-ui")
// works unedited.
const configuredBasePath = process.env.VITE_BASE_PATH ?? "/";
const base = configuredBasePath.endsWith("/") ? configuredBasePath : `${configuredBasePath}/`;

export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
});
