"use client";

import { useEffect } from "react";
import Lenis from "lenis";

declare global {
  interface Window {
    /** The page's smooth scroll while it runs, for links within the page (KitScripts.tsx). */
    __jianovaLenis?: Lenis;
  }
}

/**
 * Smooth scrolling for a mouse wheel or a trackpad: the page glides to where
 * the wheel sends it instead of stepping, so everything that moves with the
 * scroll (the turn, the steps, the statement) moves smoothly too. Each step of
 * the glide is announced (jianova:smoothscroll) so the turn draws in that same
 * frame. Touch screens keep their own scrolling; reduced motion and motion
 * turned off keep the browser's.
 */
export function SmoothScroll() {
  useEffect(() => {
    const root = document.documentElement;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || root.dataset.motion === "off") return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true, syncTouch: false, autoRaf: true });
    const step = () => document.dispatchEvent(new Event("jianova:smoothscroll"));
    lenis.on("scroll", step);
    window.__jianovaLenis = lenis;
    window.__jianovaSmooth = true;
    return () => {
      lenis.off("scroll", step);
      lenis.destroy();
      delete window.__jianovaLenis;
      delete window.__jianovaSmooth;
    };
  }, []);
  return null;
}
