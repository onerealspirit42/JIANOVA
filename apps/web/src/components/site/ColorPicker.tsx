"use client";

import { useRef, useState } from "react";
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
 * A chosen colourway loads first and then fades in over the one before
 * (jianova.css: .color-frame img), so the swap never flashes the ground.
 */
export function ColorPicker({ legend, alt, names, initial = "royal" }: ColorPickerProps) {
  const [color, setColor] = useState<ColorId>(initial);
  const chosen = useRef<ColorId>(initial);
  // What is on screen: the colourway shown (`on`) and the one it covers (`under`).
  const [shown, setShown] = useState<{ on: ColorId; under: ColorId | null }>({ on: initial, under: null });
  // Every colourway asked for so far stays in the page (the browser keeps them).
  const [loaded, setLoaded] = useState<ColorId[]>([initial]);
  const name = names[color];

  const reveal = (id: ColorId) =>
    setShown((s) => (s.on === id ? s : { on: id, under: s.on }));

  const choose = (id: ColorId) => {
    chosen.current = id;
    setColor(id);
    if (loaded.includes(id)) reveal(id);
    else setLoaded((l) => [...l, id]);
  };

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
      <div className="span-6 start-7 color-frame" role="img" aria-label={alt.replace("{color}", name)}>
        {loaded.map((id) => (
          <img
            key={id}
            src={`/images/shoe/colour-${id}-sm.webp`}
            srcSet={`/images/shoe/colour-${id}-sm.webp 800w, /images/shoe/colour-${id}.webp 1600w`}
            sizes="(min-width: 1024px) 628px, 100vw"
            width={1600}
            height={1200}
            alt=""
            loading={id === initial ? "lazy" : "eager"}
            className={id === shown.on ? "is-on" : id === shown.under ? "is-under" : undefined}
            onLoad={(e) => {
              // The newest choice fades in once its picture is ready to draw.
              if (id === initial) return;
              const img = e.currentTarget;
              (img.decode ? img.decode() : Promise.resolve())
                .catch(() => {})
                .then(() => {
                  if (chosen.current === id) reveal(id);
                });
            }}
          />
        ))}
      </div>
    </div>
  );
}
