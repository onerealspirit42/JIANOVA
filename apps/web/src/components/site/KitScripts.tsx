"use client";

import { useEffect } from "react";

/** The taste-skill kit's scripts: nav, motion, moments, the heroes' moments. */
const SCRIPTS = ["/assets/system.js", "/assets/motion/motion.js", "/assets/layout/layout.js"];

/**
 * Loads the kit's scripts once React has hydrated the page. The scripts
 * rewrite parts of the page (they split the statement into words and move
 * the steps' pictures), so running them before hydration would make React's
 * copy of the page disagree with the HTML.
 *
 * It also lets links to a section of the same page glide there instead of
 * jumping. Only clicks on such links glide: keyboard focus and the browser's
 * own scrolling stay instant, and reduced motion keeps the jump.
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

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element | null)?.closest?.("a[href*='#']");
      if (!(link instanceof HTMLAnchorElement) || link.target) return;
      const url = new URL(link.href);
      if (url.origin !== location.origin || url.pathname !== location.pathname || !url.hash) return;
      const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
      if (!target) return;
      event.preventDefault();
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
      history.pushState(history.state, "", url.hash);
      // Move focus with the view, as a jump to an anchor does, without a second scroll.
      if (!target.matches("a, button, input, select, textarea, [tabindex]")) target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
