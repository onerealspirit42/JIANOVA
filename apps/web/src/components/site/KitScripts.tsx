"use client";

import { useEffect } from "react";

/** The taste-skill kit's scripts: nav, motion, moments, the heroes' moments. */
const SCRIPTS = ["/assets/system.js", "/assets/motion/motion.js", "/assets/layout/layout.js"];

/**
 * Loads the kit's scripts once React has hydrated the page. The scripts
 * rewrite parts of the page (they split the statement into words and move
 * the steps' pictures), so running them before hydration would make React's
 * copy of the page disagree with the HTML.
 */
export function KitScripts() {
  useEffect(() => {
    const root = document.documentElement;
    if (root.dataset.kitLoaded) return;
    root.dataset.kitLoaded = "true";
    for (const src of SCRIPTS) {
      const script = document.createElement("script");
      script.type = "module";
      script.src = src;
      document.body.appendChild(script);
    }
  }, []);
  return null;
}
