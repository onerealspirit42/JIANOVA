"use client";

import { useEffect } from "react";

/** The taste-skill kit's scripts: nav, motion, moments, the heroes' moments. */
const SCRIPTS = ["/assets/system.js", "/assets/motion/motion.js", "/assets/layout/layout.js"];

/**
 * The blocks that settle into place as they come into view (jianova.css,
 * "page motion"). Not the hero (it has its own entrance) and not the two
 * moments (#steps and #idea move with the scroll in their own way).
 */
const SECTION = "main > section:not(.hero, [data-moment])";
const REVEAL = [
  `${SECTION} .section-head`,
  `${SECTION} .part-frame`,
  `${SECTION} .swatches`,
  `${SECTION} .color-frame`,
  `${SECTION} .phone-shot`,
  `${SECTION} .faq__item`,
  `${SECTION} .rows > li`,
  `${SECTION} .tile`,
  `${SECTION} .meaning-frame`,
  "footer.closing .closing__cta > *",
  "footer.closing .closing__links > .grid > *",
].join(", ");

/** Pictures that fade in as they arrive (the rest are in view at once or belong to a moment). */
const FADE_IN_IMAGES = ".part-frame img, img.phone-shot";

/**
 * Pages load ahead of the click: the browser fetches a page of the site while
 * the pointer rests on its link (or a finger presses it), so moving between
 * pages is nearly instant. Downloads and links within the page are left out.
 * Added from script: browsers ignore rules that React writes as inner HTML.
 */
const SPECULATION_RULES = {
  prefetch: [
    {
      source: "document",
      where: {
        and: [
          { href_matches: "/*" },
          { not: { selector_matches: "[download], [href^='#'], [href*='.']" } },
        ],
      },
      eagerness: "moderate",
    },
  ],
};

/** How long a reveal takes (jianova.css: 1200 ms) plus room for its delay. */
const REVEAL_MS = 1300;

/**
 * Loads the kit's scripts once React has hydrated the page. The scripts
 * rewrite parts of the page (they split the statement into words and move
 * the steps' pictures), so running them before hydration would make React's
 * copy of the page disagree with the HTML.
 *
 * It also lets links to a section of the same page glide there instead of
 * jumping. Only clicks on such links glide: keyboard focus and the browser's
 * own scrolling stay instant, and reduced motion keeps the jump.
 *
 * And it runs the page's soft arrivals: blocks below the first screen rise
 * into place as they come into view, and pictures fade in as they load; and
 * it lets the browser fetch the next page ahead of the click.
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
    if (HTMLScriptElement.supports?.("speculationrules")) {
      const rules = document.createElement("script");
      rules.type = "speculationrules";
      rules.textContent = JSON.stringify(SPECULATION_RULES);
      document.head.appendChild(rules);
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

  // The bar marks the section on screen: its word keeps the line (jianova.css),
  // which moves from word to word as the page scrolls.
  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const links = [...document.querySelectorAll<HTMLAnchorElement>(".nav__links a.nav__link[href^='#']")];
    const sections = links
      .map((link) => document.getElementById(decodeURIComponent(link.hash.slice(1))))
      .filter((el): el is HTMLElement => el !== null);
    if (!sections.length) return;
    const onScreen = new Set<string>();
    const spy = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) onScreen.add(entry.target.id);
          else onScreen.delete(entry.target.id);
        }
        const current = sections.find((el) => onScreen.has(el.id))?.id;
        for (const link of links) {
          if (link.hash.slice(1) === current) link.setAttribute("aria-current", "location");
          else link.removeAttribute("aria-current");
        }
      },
      // a thin band just above the middle of the screen: the section crossing it is the one being read
      { rootMargin: "-45% 0px -50% 0px" },
    );
    sections.forEach((el) => spy.observe(el));
    return () => spy.disconnect();
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      root.dataset.motion === "off" ||
      !("IntersectionObserver" in window)
    )
      return;
    const timers = new Set<number>();

    // Blocks below the first screen wait out of sight; blocks already on
    // screen (or scrolled past) stay exactly as they are.
    // The observer reports every block once, at once, then each arrival.
    let reported = false;
    const reveal = new IntersectionObserver(
      (entries) => {
        reported = true;
        let order = 0;
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          reveal.unobserve(el);
          // Blocks arriving together step in one after another.
          const delay = Math.min(order++, 4) * 90;
          el.style.setProperty("--rv-delay", `${delay}ms`);
          el.classList.add("is-in");
          // Once in place, the block goes back to its own styles (its hovers, its transitions).
          const timer = window.setTimeout(() => {
            el.classList.remove("rv", "is-in");
            el.style.removeProperty("--rv-delay");
            timers.delete(timer);
          }, delay + REVEAL_MS);
          timers.add(timer);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    const fold = window.innerHeight * 0.92;
    const waiting: HTMLElement[] = [];
    document.querySelectorAll<HTMLElement>(REVEAL).forEach((el) => {
      if (el.getBoundingClientRect().top < fold) return;
      el.classList.add("rv");
      reveal.observe(el);
      waiting.push(el);
    });
    // If that first report never comes (a browser or an extension that breaks
    // the observer), nothing is left hidden: every block is shown as it is.
    const failsafe = window.setTimeout(() => {
      if (reported || !waiting.length) return;
      reveal.disconnect();
      waiting.forEach((el) => el.classList.remove("rv", "is-in"));
    }, 2000);
    timers.add(failsafe);

    // Pictures still loading fade in when they arrive.
    document.querySelectorAll<HTMLImageElement>(FADE_IN_IMAGES).forEach((img) => {
      if (img.complete) return;
      img.classList.add("is-loading");
      img.addEventListener(
        "load",
        () => {
          img.classList.add("is-arrived");
          requestAnimationFrame(() => img.classList.remove("is-loading"));
        },
        { once: true },
      );
      img.addEventListener("error", () => img.classList.remove("is-loading"), { once: true });
    });

    return () => {
      reveal.disconnect();
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  return null;
}
