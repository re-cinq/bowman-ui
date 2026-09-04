// Regenerates the documentation index's hero image, src/docs/assets/
// chat-hero.png, reproducibly: it starts the demo's own Vite dev server, opens
// hero.html (which renders src/docs/HeroPreview.tsx through the real library
// AppShell/AppSidebar/ConversationList/ChatMessageList/ChatComposer, the full
// app surface, one light theme), and screenshots the [data-hero-capture]
// element. The same PNG is then copied to docs/assets/hero-split.png, so the
// root README shows the identical capture.
//
// Prerequisite: @re-cinq/bowman-ui must be installed in this demo (the packed
// tarball, exactly as scripts/consumer-app.sh installs it), because the
// committed package.json deliberately declares no dependency on it.
//
//   node scripts/capture-hero.mjs
//
// It lives under scripts/, not tests/, so Playwright's testDir ("./tests")
// never runs it in the gating suite (npm test / scripts/consumer-app.sh).

import { spawn } from "node:child_process";
import { once } from "node:events";
import { copyFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import process from "node:process";
import { setTimeout as sleep } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const here = dirname(fileURLToPath(import.meta.url));
const appDir = resolve(here, "..");
const repoRoot = resolve(appDir, "../..");
const outputPath = resolve(appDir, "src/docs/assets/chat-hero.png");
const readmeImagePath = resolve(repoRoot, "docs/assets/hero-split.png");
const port = 5199;
const url = `http://127.0.0.1:${port}/hero.html`;

const server = spawn(
  "npx",
  ["vite", "--host", "127.0.0.1", "--port", String(port), "--strictPort"],
  { cwd: appDir, stdio: "inherit" },
);

let browser;

try {
  browser = await chromium.launch();
  const page = await browser.newPage({
    colorScheme: "light",
    deviceScaleFactor: 2,
    viewport: { width: 1360, height: 880 },
  });

  const deadline = Date.now() + 30_000;

  for (;;) {
    try {
      await page.goto(url, { waitUntil: "networkidle" });
      break;
    } catch (error) {
      if (Date.now() > deadline) {
        throw error;
      }
      await sleep(250);
    }
  }

  const capture = page.locator("[data-hero-capture]");

  await capture.waitFor({ state: "visible" });
  await page.waitForTimeout(300);
  await capture.screenshot({ path: outputPath });
  await copyFile(outputPath, readmeImagePath);
  process.stdout.write(`Wrote ${outputPath}\n`);
  process.stdout.write(`Wrote ${readmeImagePath}\n`);
} finally {
  await browser?.close();
  server.kill("SIGTERM");
  await once(server, "exit").catch(() => {});
}
