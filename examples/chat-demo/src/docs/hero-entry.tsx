// Mount point for hero.html, the capture-only page scripts/capture-hero.mjs
// drives. Kept out of main.tsx so nothing in the published app depends on it.

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HeroPreview } from "./HeroPreview";
import "../styles.css";

const rootElement = document.getElementById("root");

if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <HeroPreview />
    </StrictMode>
  );
}
