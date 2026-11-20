"use client";

import { useEffect, useRef } from "react";
import { COLORS, type ColorId } from "@/features/configurator/parts";
import { TURN_BOXES, TURN_FRAMES, TURN_LOOKS } from "./turn-frames";

type TurnHeroProps = {
  title: string;
  lead: string;
  primary: { label: string; href: string };
  secondary: { label: string; href: string };
  alt: string;
  captions: readonly string[];
  looksLabel: string;
  /** Names of the turn's three looks, in order (brand, ember, oasis). */
  lookNames: readonly string[];
};

/** The main colour of each look the turn passes through (scripts/stills/render-turn.mjs). */
const LOOK_COLORS: readonly ColorId[] = ["royal", "ember", "oasis"];

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/** Where the turn happens in the scroll (0 at the top of the hero, 1 when its stage lets go). */
const TURN_FROM = 0.06;
const TURN_TO = 0.92;
/** The three captions: the scroll position each one is centred on, and half its span. */
const CAPTIONS_AT = [0.31, 0.53, 0.75];
const CAPTION_SPAN = 0.11;
/** The hero still is frame 0 at this many pixels across (turn/hero.webp). */
const STILL_WIDTH = 2400;
/** object-position of the still in its box (jianova.css: .turn__still). */
const STILL_POS = [0.5, 0.46];

/**
 * The first screen and the turn: the hero's words and the shoe; as the page
 * scrolls, the words go up with it, the stage holds, darkens to a lit studio
 * (the header and the phone's action bar turn dark with it, html.is-studio),
 * and the shoe grows and turns a full circle while it changes colourway, under
 * three captions. 61 rendered frames (scripts/stills/render-turn.mjs) are
 * drawn on a canvas from the scroll position; the page scrolls natively.
 *
 * Without script, with reduced motion or with motion turned off, it is the
 * still hero: the words and frame 0 (turn/hero.webp) on one screen.
 */
export function TurnHero(props: TurnHeroProps) {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const root = document.documentElement;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || root.dataset.motion === "off") return;
    const pin = section.querySelector<HTMLElement>(".turn__pin");
    const head = section.querySelector<HTMLElement>(".hero__head");
    const still = section.querySelector<HTMLImageElement>(".turn__still");
    const canvas = section.querySelector<HTMLCanvasElement>(".turn__canvas");
    const caps = [...section.querySelectorAll<HTMLElement>(".turn__cap")];
    const looks = section.querySelector<HTMLElement>(".turn__looks");
    const lookItems = [...section.querySelectorAll<HTMLElement>(".turn__looks li")];
    const ctx = canvas?.getContext("2d");
    if (!pin || !head || !still || !canvas || !ctx) return;

    const { count, width: FW, height: FH } = TURN_FRAMES;
    const frames: (HTMLImageElement | null)[] = Array(count).fill(null);
    const ready = new Set<number>();
    let geometry = { W: 0, H: 0, dpr: 1, phone: false, s0: 0, ox: 0, oy: 0 };
    let raf = 0;
    let lastKey = "";

    section.classList.add("is-live");

    /** Where frame 0 sits at rest: the still's own box, as object-fit: cover lays it out. */
    const measure = () => {
      const pr = pin.getBoundingClientRect();
      const ir = still.getBoundingClientRect();
      const W = pr.width, H = pr.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      const k = Math.max(ir.width / STILL_WIDTH, ir.height / (STILL_WIDTH * 0.75));
      const r = STILL_WIDTH / FW;
      geometry = {
        W, H, dpr,
        phone: W < 640,
        s0: k * r,
        ox: ir.left - pr.left + (ir.width - STILL_WIDTH * k) * STILL_POS[0],
        oy: ir.top - pr.top + (ir.height - STILL_WIDTH * 0.75 * k) * STILL_POS[1],
      };
      lastKey = "";
    };

    /** The shoe's size for frame f once it has moved to the middle: it fills a target box, turning toward you. */
    const targetScale = (f: number) => {
      const { W, H, phone, dpr } = geometry;
      const [, , bw0, bh0] = TURN_BOXES[0];
      const [, , bw, bh] = TURN_BOXES[f];
      const Wt = phone ? W * 0.88 : W * 0.7;
      const Ht = phone ? H * 0.42 : H * 0.52;
      const side = Math.min(Wt / bw0, Ht / bh0);
      const raw = Math.min(Wt / bw, Ht / bh);
      // the shoe comes a little closer as it faces you, never so much that the frame shows its pixels
      return Math.min(side * (raw / side) ** (phone ? 0.55 : 0.35), 1.9 / dpr);
    };

    const nearest = (f: number) => {
      if (ready.has(f)) return f;
      for (let d = 1; d < count; d++) {
        if (ready.has(f - d)) return f - d;
        if (ready.has(f + d)) return f + d;
      }
      return -1;
    };

    const draw = () => {
      raf = 0;
      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight;
      const run = Math.max(1, rect.height - vh);
      const scrolled = clamp(-rect.top, 0, run);
      const p = scrolled / run;
      const { W, H, dpr, phone, s0, ox, oy } = geometry;

      // The words scroll away with the page (the stage holds), fading as they go.
      head.style.transform = `translate3d(0, ${-scrolled}px, 0)`;
      head.style.opacity = String(1 - smooth(0.02, 0.16, p));

      // The studio: a lit stage behind the shoe, from the turn's start to just before it lets go.
      const dark = smooth(0.1, 0.24, p) * (1 - smooth(0.86, 0.97, p));
      section.style.setProperty("--turn-dark", dark.toFixed(3));
      // while it is dark, the header and the phone's action bar turn to dark glass (jianova.css)
      root.classList.toggle("is-studio", dark > 0.5);

      caps.forEach((cap, i) => {
        const d = (p - CAPTIONS_AT[i]) / CAPTION_SPAN;
        const o = smooth(-1, -0.55, d) * (1 - smooth(0.55, 1, d));
        cap.style.opacity = o.toFixed(3);
        cap.style.transform = `translate3d(0, ${(-d * 28).toFixed(1)}px, 0)`;
      });

      const f = Math.round(clamp((p - TURN_FROM) / (TURN_TO - TURN_FROM)) * (count - 1));
      if (looks) looks.style.opacity = smooth(0.2, 0.3, p) * (1 - smooth(0.84, 0.9, p)) + "";
      lookItems.forEach((li, i) => li.classList.toggle("is-on", TURN_LOOKS[f] === i));

      // At rest the sharp still shows; once the page moves, the canvas takes over.
      const atRest = scrolled < 1;
      still.style.opacity = atRest ? "1" : "0";
      canvas.style.opacity = atRest ? "0" : "1";
      const shown = nearest(f);
      const key = `${shown}:${scrolled.toFixed(1)}:${W}x${H}`;
      if (atRest || shown < 0 || key === lastKey) return;
      lastKey = key;

      // Move from the rest place to the middle of the stage, then hold there.
      const e = easeInOut(smooth(0, 0.16, p));
      const [bx, by, bw, bh] = TURN_BOXES[shown];
      const [bx0, by0, bw0, bh0] = TURN_BOXES[0];
      const restX = ox + (bx0 + bw0 / 2) * s0;
      const restY = oy + (by0 + bh0 / 2) * s0;
      const cx = restX + (W / 2 - restX) * e;
      const cy = restY + (H * (phone ? 0.52 : 0.56) - restY) * e;
      const s = s0 + (targetScale(shown) - s0) * e;
      const tilt = phone ? (-7 * Math.PI / 180) * e * (1 - smooth(0.82, 0.95, p)) : 0;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.translate(cx, cy);
      ctx.rotate(tilt);
      ctx.scale(s, s);
      // (drawn at the frame's own size: the phone set maps onto the same frame pixels)
      ctx.drawImage(frames[shown]!, -(bx + bw / 2), -(by + bh / 2), FW, FH);
    };
    const request = () => {
      if (!raf) raf = requestAnimationFrame(draw);
    };

    // Frames load coarse to fine (every 8th first), so the turn shows from the start and sharpens.
    const order: number[] = [];
    for (const step of [count - 1, 30, 15, 8, 4, 2, 1]) {
      for (let i = 0; i < count; i += step) if (!order.includes(i)) order.push(i);
    }
    let next = 0;
    let started = false;
    const small = window.innerWidth < 640;
    const loadNext = () => {
      if (next >= order.length) return;
      const i = order[next++];
      const img = new Image();
      img.decoding = "async";
      // a phone draws the shoe at most about 770 device pixels wide: the 1100-pixel set is enough there
      img.src = `/images/shoe/turn/${String(i).padStart(2, "0")}${small ? "-sm" : ""}.webp`;
      const done = () => {
        frames[i] = img;
        ready.add(i);
        lastKey = "";
        request();
        loadNext();
      };
      img.decode().then(done, () => (img.complete && img.naturalWidth ? done() : loadNext()));
    };
    const startLoading = () => {
      if (started) return;
      started = true;
      for (let n = 0; n < 4; n++) loadNext();
    };

    const io = new IntersectionObserver(([entry]) => {
      window.removeEventListener("scroll", request);
      if (entry.isIntersecting) {
        window.addEventListener("scroll", request, { passive: true });
        request();
      } else root.classList.remove("is-studio");
    });
    io.observe(section);
    const onResize = () => {
      measure();
      request();
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", startLoading, { once: true, passive: true });
    const idle = window.setTimeout(startLoading, 1200);
    measure();
    request();
    document.fonts?.ready.then(() => {
      measure();
      request();
    });

    return () => {
      io.disconnect();
      window.removeEventListener("scroll", request);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", startLoading);
      window.clearTimeout(idle);
      if (raf) cancelAnimationFrame(raf);
      section.classList.remove("is-live");
      root.classList.remove("is-studio");
      head.style.transform = head.style.opacity = still.style.opacity = canvas.style.opacity = "";
    };
  }, []);

  return (
    <section ref={sectionRef} className="hero hero--product turn" data-enter aria-labelledby="hero-h">
      <div className="turn__pin">
        <div className="turn__ground" aria-hidden />
        <div className="wrap">
          <div className="hero-text hero__in">
            <div className="hero__head">
              <div>
                <h1 id="hero-h">{props.title}</h1>
                <p className="hero__lead">{props.lead}</p>
              </div>
              <div className="btn-row">
                <a className="btn btn--primary" href={props.primary.href}>
                  {props.primary.label}
                </a>
                <a className="btn btn--secondary" href={props.secondary.href}>
                  {props.secondary.label}
                </a>
              </div>
            </div>
            <div className="hero__stage">
              <img
                className="is-cutout turn__still"
                src="/images/shoe/turn/hero.webp"
                srcSet="/images/shoe/turn/hero-sm.webp 1200w, /images/shoe/turn/hero.webp 2400w"
                sizes="(min-width: 1440px) 1280px, 100vw"
                width={2400}
                height={1800}
                alt={props.alt}
                fetchPriority="high"
              />
            </div>
          </div>
        </div>
        <canvas className="turn__canvas" aria-hidden />
        <div className="turn__captions">
          {props.captions.map((caption) => (
            <p key={caption} className="turn__cap">
              {caption}
            </p>
          ))}
        </div>
        <ol className="turn__looks" aria-label={props.looksLabel}>
          {props.lookNames.map((name, i) => (
            <li key={name}>
              <span className="turn__dot" aria-hidden style={{ background: COLORS[LOOK_COLORS[i]] }} />
              {name}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
