"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { COLOR_IDS, COLORS, type ColorId } from "@/features/configurator/parts";

type ColorPickerProps = {
  legend: string;
  /** Picture description with a {color} placeholder. */
  alt: string;
  names: Record<ColorId, string>;
  initial?: ColorId;
};

/**
 * Eight swatches that swap the shoe's picture to that colour of upper
 * (stills rendered by scripts/stills/render-stills.mjs). Native radio inputs,
 * so arrow keys move between colours and screen readers announce each one.
 *
 * A chosen colourway fades in over the one before (jianova.css:
 * .color-frame img) once it is ready to draw, so the swap never flashes the
 * ground. The other colourways load quietly as the section comes near, so a
 * choice usually changes the picture at once.
 */
export function ColorPicker({ legend, alt, names, initial = "royal" }: ColorPickerProps) {
  const [color, setColor] = useState<ColorId>(initial);
  const chosen = useRef<ColorId>(initial);
  // What is on screen: the colourway shown (`on`) and the one it covers (`under`).
  const [shown, setShown] = useState<{ on: ColorId; under: ColorId | null }>({ on: initial, under: null });
  // The colourways in the page (loading or loaded) and those ready to draw.
  const [mounted, setMounted] = useState<ColorId[]>([initial]);
  const ready = useRef(new Set<ColorId>([initial]));
  const frame = useRef<HTMLDivElement>(null);
  const name = names[color];

  const reveal = (id: ColorId) =>
    setShown((s) => (s.on === id ? s : { on: id, under: s.on }));

  const choose = (id: ColorId) => {
    chosen.current = id;
    setColor(id);
    if (ready.current.has(id)) reveal(id);
    else setMounted((m) => (m.includes(id) ? m : [...m, id]));
  };

  // Load the other colourways when the section is near, while the browser is idle.
  useEffect(() => {
    const el = frame.current;
    if (!el || !("IntersectionObserver" in window)) return;
    // Safari has no requestIdleCallback: a short timeout stands in for it.
    const idleApi = typeof window.requestIdleCallback === "function";
    let idle = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        const loadAll = () => setMounted((m) => [...m, ...COLOR_IDS.filter((id) => !m.includes(id))]);
        idle = idleApi ? window.requestIdleCallback(loadAll, { timeout: 1500 }) : window.setTimeout(loadAll, 300);
      },
      { rootMargin: "600px 0px" },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      if (idleApi) window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
    };
  }, []);

  return (
    <div className="grid">
      <div className="span-5">
        <fieldset className="swatches">
          <legend>{legend}</legend>
          {COLOR_IDS.map((id) => (
            <label key={id} className="swatch">
              <input
                type="radio"
                name="upper-color"
                value={id}
                checked={color === id}
                onChange={() => choose(id)}
              />
              <span className="swatch__dot" aria-hidden style={{ background: COLORS[id] }} />
              {names[id]}
            </label>
          ))}
        </fieldset>
      </div>
      <div
        ref={frame}
        className="span-6 start-7 color-frame"
        role="img"
        aria-label={alt.replace("{color}", name)}
        // the light the shoe stands in takes a tint of the chosen colour (jianova.css)
        style={{ "--glow": COLORS[color] } as CSSProperties}
      >
        {mounted.map((id) => (
          <img
            key={id}
            src={`/images/shoe/colour-${id}-sm.webp`}
            srcSet={`/images/shoe/colour-${id}-sm.webp 800w, /images/shoe/colour-${id}.webp 1600w`}
            sizes="(min-width: 1024px) 50vw, 100vw"
            width={1600}
            height={1200}
            alt=""
            loading={id === initial ? "lazy" : "eager"}
            fetchPriority={id === initial ? undefined : "low"}
            className={id === shown.on ? "is-on" : id === shown.under ? "is-under" : undefined}
            onLoad={(e) => {
              if (id === initial) return;
              // Ready once decoded; the current choice then fades in.
              const img = e.currentTarget;
              (img.decode ? img.decode() : Promise.resolve())
                .catch(() => {})
                .then(() => {
                  ready.current.add(id);
                  if (chosen.current === id) reveal(id);
                });
            }}
          />
        ))}
      </div>
    </div>
  );
}
