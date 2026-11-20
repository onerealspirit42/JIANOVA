"use client";

import { useEffect, useRef } from "react";
import { COLORS, type ColorId } from "@/features/configurator/parts";
import { TURN_BOXES, TURN_FRAMES, TURN_LOOKS, TURN_STILL } from "./turn-frames";

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
/** The share of the gap a value closes in dt seconds when it eases with time constant tau. */
const ease = (dt: number, tau: number) => 1 - Math.exp(-dt / tau);

/** Where the turn happens in the scroll (0 at the top of the hero, 1 when its stage lets go). */
const TURN_FROM = 0.06;
const TURN_TO = 0.92;
/** The three captions: the scroll position each one is centred on, and half its span. */
const CAPTIONS_AT = [0.31, 0.53, 0.75];
const CAPTION_SPAN = 0.11;
/** Frame pixels kept round each frame's box when it is cut out (its soft shadow reaches 11 past it). */
const CROP_PAD = 14;
/** How fast the drawn turn catches up with a finger's scroll, in seconds (a wheel is smoothed by the page: SmoothScroll.tsx). */
const CATCH_UP = 0.09;
/** Once the scroll has rested this long (ms), the turn settles on the nearest whole frame. */
const SETTLE_AFTER = 160;

type Box = readonly [number, number, number, number];
/** A frame ready to draw: its picture (decoded once, cut to the shoe) and the part of the frame it covers, in frame pixels. */
type Frame = { src: CanvasImageSource; crop: Box };

declare global {
  interface Window {
    /** Set while the page scrolls smoothly (SmoothScroll.tsx): the turn then draws in step with it. */
    __jianovaSmooth?: boolean;
  }
}

/**
 * The first screen and the turn: the hero's words and the shoe; as the page
 * scrolls, the words go up with it, the stage holds, darkens to a lit studio
 * (the header and the phone's action bar turn dark with it, html.is-studio),
 * and the shoe grows and turns a full circle while it changes colourway, under
 * three captions. 61 rendered frames (scripts/stills/render-turn.mjs) are cut
 * to the shoe and decoded once as they arrive; one canvas shows the current
 * frame, dissolving briefly into the next halfway between whole frames, and is
 * moved, grown and tilted by the compositor. The page scrolls natively (smoothly with a
 * wheel), and the words sit outside the stage, so they move exactly with it.
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
    const lead = section.querySelector<HTMLElement>(".turn__lead");
    const pin = section.querySelector<HTMLElement>(".turn__pin");
    const view = section.querySelector<HTMLElement>(".turn__view");
    const ground = section.querySelector<HTMLElement>(".turn__ground");
    const still = section.querySelector<HTMLImageElement>(".turn__still");
    const canvas = section.querySelector<HTMLCanvasElement>(".turn__frame");
    const caps = [...section.querySelectorAll<HTMLElement>(".turn__cap")];
    const looks = section.querySelector<HTMLElement>(".turn__looks");
    const lookItems = [...section.querySelectorAll<HTMLElement>(".turn__looks li")];
    const ctx = canvas?.getContext("2d");
    if (!lead || !pin || !view || !ground || !still || !canvas || !ctx) return;

    const { count, width: FW, height: FH } = TURN_FRAMES;
    const touch = window.matchMedia("(pointer: coarse)").matches;
    // a phone draws the shoe at most about 770 device pixels wide: the 1100-pixel set is enough there
    const small = window.innerWidth < 640;
    const srcScale = small ? 1100 / FW : 1;

    // Each frame is cut to its box (and the shadow round it); the canvas is big enough for any of
    // them with the box centred, in frame pixels.
    const crops: Box[] = TURN_BOXES.map(([bx, by, bw, bh]) => {
      const x0 = Math.max(0, bx - CROP_PAD), y0 = Math.max(0, by - CROP_PAD);
      return [x0, y0, Math.min(FW, bx + bw + CROP_PAD) - x0, Math.min(FH, by + bh + CROP_PAD) - y0];
    });
    let CW = 0, CH = 0;
    TURN_BOXES.forEach(([bx, by, bw, bh], i) => {
      const [x0, y0, w, h] = crops[i];
      const cx = bx + bw / 2, cy = by + bh / 2;
      CW = Math.max(CW, 2 * Math.max(cx - x0, x0 + w - cx));
      CH = Math.max(CH, 2 * Math.max(cy - y0, y0 + h - cy));
    });
    CW = Math.ceil(CW);
    CH = Math.ceil(CH);

    const frames: (Frame | null)[] = Array(count).fill(null);
    let geometry = { W: 0, H: 0, phone: false, s0: 0, rx: 0, ry: 0, tx: 0, ty: 0 };
    let targets: number[] = [];
    /** What the canvas holds now (frames, dissolve, scale), so an unchanged picture is not drawn again. */
    let key = "";
    /** Device pixels per frame pixel in the cut frames and on the canvas (set once, from the first screen). */
    let q = 0;

    /** The still's own box, untransformed (the hero's entrance grows the picture for a moment as the page loads). */
    const stillBox = () => {
      const parent = still.offsetParent as HTMLElement | null;
      const base = parent?.getBoundingClientRect() ?? { left: 0, top: 0 };
      return {
        left: base.left + (parent?.clientLeft ?? 0) + still.offsetLeft,
        top: base.top + (parent?.clientTop ?? 0) + still.offsetTop,
        width: still.offsetWidth,
        height: still.offsetHeight,
      };
    };

    /** Where frame 0 sits at rest (the still shows the shoe whole, centred by object-fit: contain) and where each frame goes. */
    const measure = () => {
      const vr = view.getBoundingClientRect();
      const ir = stillBox();
      const W = vr.width, H = vr.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      // the still is the TURN_STILL part of frame 0: s0 CSS pixels to a frame pixel, (ox, oy) where the frame's corner falls
      const [sx, sy, sw, sh] = TURN_STILL;
      const s0 = Math.min(ir.width / sw, ir.height / sh);
      const ox = ir.left - vr.left + (ir.width - sw * s0) / 2 - sx * s0;
      const oy = ir.top - vr.top + (ir.height - sh * s0) / 2 - sy * s0;
      const [bx0, by0, bw0, bh0] = TURN_BOXES[0];
      const phone = W < 640;
      // (a short screen, a phone on its side, keeps the shoe lower and smaller, clear of the caption line)
      const short = !phone && H < 520;
      geometry = { W, H, phone, s0, rx: ox + (bx0 + bw0 / 2) * s0, ry: oy + (by0 + bh0 / 2) * s0, tx: W / 2, ty: H * (phone ? 0.52 : short ? 0.6 : 0.56) };
      // The shoe's size for each frame once it has moved to the middle: it fills a target box, coming
      // a little closer as it faces you, never so close that the frame shows its pixels.
      const Wt = phone ? W * 0.88 : W * 0.7;
      const Ht = phone ? H * 0.42 : short ? H * 0.42 : H * 0.52;
      const side = Math.min(Wt / bw0, Ht / bh0);
      targets = TURN_BOXES.map(([, , bw, bh]) => Math.min(side * (Math.min(Wt / bw, Ht / bh) / side) ** (phone ? 0.55 : 0.35), 1.9 / dpr));
      if (!q) {
        q = Math.min(srcScale, Math.max(...targets) * dpr);
        canvas.width = Math.ceil(CW * q);
        canvas.height = Math.ceil(CH * q);
        canvas.style.width = `${CW}px`;
        canvas.style.height = `${CH}px`;
      }
      key = "";
    };

    const nearest = (f: number) => {
      if (frames[f]) return f;
      for (let d = 1; d < count; d++) {
        if (frames[f - d]) return f - d;
        if (frames[f + d]) return f + d;
      }
      return -1;
    };

    /** Draws frame f on the canvas, its box centred, scaled by r about the centre, at the given alpha. */
    const paint = (f: number, r: number, alpha: number) => {
      const frame = frames[f]!;
      const [bx, by, bw, bh] = TURN_BOXES[f];
      const [x0, y0, w, h] = frame.crop;
      const cx = (CW / 2) * q, cy = (CH / 2) * q;
      ctx.globalAlpha = alpha;
      ctx.drawImage(
        frame.src,
        cx + (x0 - (bx + bw / 2)) * q * r,
        cy + (y0 - (by + bh / 2)) * q * r,
        w * q * r,
        h * q * r,
      );
    };

    let wasStudio = false;
    /** Lays out the stage for the scroll position p (the words use the page's own, raw position). */
    const draw = (raw: number, run: number, p: number, fpos: number) => {
      const { s0, rx, ry, tx, ty, phone } = geometry;

      // The words go up with the page by themselves; they fade as they go.
      lead.style.opacity = (1 - smooth(0.02, 0.16, raw)).toFixed(3);

      // The studio: a lit stage behind the shoe, from the turn's start to just before it lets go.
      const dark = smooth(0.1, 0.24, p) * (1 - smooth(0.86, 0.97, p));
      ground.style.opacity = dark.toFixed(3);
      const studio = dark > 0.5;
      if (studio !== wasStudio) root.classList.toggle("is-studio", (wasStudio = studio));

      caps.forEach((cap, i) => {
        const d = (p - CAPTIONS_AT[i]) / CAPTION_SPAN;
        cap.style.opacity = (smooth(-1, -0.55, d) * (1 - smooth(0.55, 1, d))).toFixed(3);
        cap.style.transform = `translate3d(0, ${(-d * 28).toFixed(1)}px, 0)`;
      });
      const f = Math.round(fpos);
      if (looks) looks.style.opacity = (smooth(0.2, 0.3, p) * (1 - smooth(0.84, 0.9, p))).toFixed(3);
      lookItems.forEach((li, i) => li.classList.toggle("is-on", TURN_LOOKS[f] === i));

      // The frames to show: two neighbours dissolving in the middle of the step between them, or,
      // while the frames still arrive, the nearest one there is.
      const lo = Math.floor(fpos);
      const hi = Math.min(count - 1, lo + 1);
      const pair = hi !== lo && frames[lo] !== null && frames[hi] !== null;
      const a = pair ? lo : nearest(Math.round(fpos));
      const b = pair ? hi : a;
      // (a short dissolve: long enough to soften the step from frame to frame, too short to show two shoes)
      const t = pair ? smooth(0.38, 0.62, fpos - lo) : 0;

      // At rest the sharp still shows; once the page moves (and a frame is ready), the canvas takes over.
      const atRest = p * run < 1 || a < 0;
      still.style.opacity = atRest ? "1" : "0";
      canvas.style.opacity = atRest ? "0" : "1";
      if (atRest) return;

      // Move from the rest place to the middle of the stage, growing, then hold there.
      const e = easeInOut(smooth(0, 0.16, p));
      const size = (frame: number) => s0 + (targets[frame] - s0) * e;
      const cx = rx + (tx - rx) * e;
      const cy = ry + (ty - ry) * e;
      const tilt = phone ? -7 * e * (1 - smooth(0.82, 0.95, p)) : 0;
      canvas.style.transform = `translate3d(${(cx - CW / 2).toFixed(2)}px, ${(cy - CH / 2).toFixed(2)}px, 0) rotate(${tilt.toFixed(3)}deg) scale(${size(a).toFixed(5)})`;

      const r = b === a ? 1 : size(b) / size(a);
      const next = `${a}:${b}:${t.toFixed(3)}:${r.toFixed(4)}`;
      if (next === key) return;
      key = next;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = "source-over";
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (t < 0.002) paint(a, 1, 1);
      else if (t > 0.998) paint(b, r, 1);
      else {
        // added, not laid over: where both frames are solid the shoe stays solid as one gives way to the other
        paint(a, 1, 1 - t);
        ctx.globalCompositeOperation = "lighter";
        paint(b, r, t);
        ctx.globalCompositeOperation = "source-over";
      }
      ctx.globalAlpha = 1;
    };

    // The drawn position follows the scroll: at once with a wheel (the page already scrolls smoothly)
    // or a smooth-scrolled page, easing on a touch screen so the turn never jumps from one scroll event
    // to the next. When the scroll rests, the frame settles on a whole one (no dissolve left half done).
    let shown = -1;
    let settle = 0;
    let lastScroll = 0;
    let lastTime = 0;
    let raf = 0;
    let idle = 0;
    const tick = (now: number) => {
      raf = 0;
      const dt = lastTime ? Math.min(0.05, (now - lastTime) / 1000) : 1 / 60;
      lastTime = now;
      const rect = section.getBoundingClientRect();
      const run = Math.max(1, rect.height - pin.offsetHeight);
      const raw = clamp(-rect.top / run);
      const easing = touch && !window.__jianovaSmooth;
      shown = shown < 0 || !easing ? raw : shown + (raw - shown) * ease(dt, CATCH_UP);
      if (Math.abs(raw - shown) * run < 0.25) shown = raw;
      const frameAt = clamp((shown - TURN_FROM) / (TURN_TO - TURN_FROM)) * (count - 1);
      const resting = shown === raw && now - lastScroll > SETTLE_AFTER;
      const settleTo = resting ? Math.round(frameAt) - frameAt : 0;
      settle += (settleTo - settle) * ease(dt, 0.08);
      if (Math.abs(settleTo - settle) < 0.003) settle = settleTo;
      draw(raw, run, shown, clamp(frameAt + settle, 0, count - 1));
      if (shown !== raw || settle !== settleTo) raf = requestAnimationFrame(tick);
      else lastTime = 0;
    };
    const request = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const moved = () => {
      lastScroll = performance.now();
      window.clearTimeout(idle);
      idle = window.setTimeout(request, SETTLE_AFTER + 20);
    };
    const onScroll = () => {
      moved();
      request();
    };
    // a smooth-scrolled page reports each step of its scroll as it makes it: draw in that same frame
    const onSmooth = () => {
      moved();
      if (raf) cancelAnimationFrame(raf);
      tick(performance.now());
    };

    // Frames load coarse to fine (every 30th first), so the turn shows from the start and sharpens.
    const order: number[] = [];
    for (const step of [count - 1, 30, 15, 8, 4, 2, 1]) {
      for (let i = 0; i < count; i += step) if (!order.includes(i)) order.push(i);
    }
    let next = 0;
    let started = false;
    let alive = true;
    const retried = new Set<number>();
    /** Decodes a loaded frame once, cut to the shoe and sized for this screen (the plain picture where that is not possible). */
    const prepare = async (img: HTMLImageElement, i: number): Promise<Frame> => {
      const crop = crops[i];
      if (typeof createImageBitmap === "function") {
        const k = img.naturalWidth / FW;
        const [sx, sy, sw, sh] = crop.map((v) => Math.round(v * k));
        const resize = { resizeWidth: Math.max(1, Math.round(crop[2] * q)), resizeHeight: Math.max(1, Math.round(crop[3] * q)), resizeQuality: "high" as const };
        try {
          return { src: await createImageBitmap(img, sx, sy, sw, sh, resize), crop };
        } catch {
          try {
            return { src: await createImageBitmap(img, sx, sy, sw, sh), crop };
          } catch {
            /* the plain picture below */
          }
        }
      }
      await img.decode().catch(() => {});
      return { src: img, crop: [0, 0, FW, FH] };
    };
    const loadNext = () => {
      if (!alive || next >= order.length) return;
      const i = order[next++];
      const img = new Image();
      img.decoding = "async";
      img.src = `/images/shoe/turn/${String(i).padStart(2, "0")}${small ? "-sm" : ""}.webp`;
      img.decode().then(
        () =>
          prepare(img, i).then((frame) => {
            if (!alive) {
              if (frame.src instanceof ImageBitmap) frame.src.close();
              return;
            }
            frames[i] = frame;
            key = "";
            request();
            loadNext();
          }),
        () => {
          // a frame that failed (a host that timed out) is asked for once more, after the rest
          if (!retried.has(i)) {
            retried.add(i);
            order.push(i);
          }
          loadNext();
        },
      );
    };
    const startLoading = () => {
      if (started) return;
      started = true;
      for (let n = 0; n < 4; n++) loadNext();
    };

    // The words sit over the stage, outside it, so the still waits under them as before: their height
    // is the still's top margin (jianova.css: --lead-h), set before the section goes live.
    const fitLead = () => section.style.setProperty("--lead-h", `${lead.offsetHeight}px`);
    fitLead();
    section.classList.add("is-live");
    const leadObserver = new ResizeObserver(() => {
      fitLead();
      measure();
      request();
    });
    leadObserver.observe(lead);

    const io = new IntersectionObserver(([entry]) => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("jianova:smoothscroll", onSmooth);
      if (entry.isIntersecting) {
        window.addEventListener("scroll", onScroll, { passive: true });
        document.addEventListener("jianova:smoothscroll", onSmooth);
        request();
      } else {
        root.classList.remove("is-studio");
        wasStudio = false;
      }
    });
    io.observe(section);
    const onResize = () => {
      measure();
      request();
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", startLoading, { once: true, passive: true });
    const idleStart = window.setTimeout(startLoading, 1200);
    measure();
    request();
    document.fonts?.ready.then(() => {
      if (!alive) return;
      fitLead();
      measure();
      request();
    });

    return () => {
      alive = false;
      io.disconnect();
      leadObserver.disconnect();
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("jianova:smoothscroll", onSmooth);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", startLoading);
      window.clearTimeout(idleStart);
      window.clearTimeout(idle);
      if (raf) cancelAnimationFrame(raf);
      for (const frame of frames) if (frame && frame.src instanceof ImageBitmap) frame.src.close();
      section.classList.remove("is-live");
      section.style.removeProperty("--lead-h");
      root.classList.remove("is-studio");
      lead.style.opacity = ground.style.opacity = still.style.opacity = canvas.style.opacity = canvas.style.transform = "";
    };
  }, []);

  return (
    <section ref={sectionRef} className="hero hero--product turn" data-enter aria-labelledby="hero-h">
      <div className="turn__lead">
        <div className="wrap">
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
        </div>
      </div>
      <div className="turn__pin">
        <div className="turn__ground" aria-hidden />
        <div className="turn__view">
          <div className="wrap turn__rest">
            <div className="hero__stage">
              <img
                className="is-cutout turn__still"
                src="/images/shoe/turn/hero.webp"
                srcSet="/images/shoe/turn/hero-sm.webp 1074w, /images/shoe/turn/hero.webp 2148w"
                sizes="(min-width: 1024px) 72vw, 100vw"
                width={2148}
                height={1224}
                alt={props.alt}
                fetchPriority="high"
              />
            </div>
          </div>
          <canvas className="turn__frame" aria-hidden />
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
      </div>
    </section>
  );
}
