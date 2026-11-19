"use client";

import { useState } from "react";
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
 */
export function ColorPicker({ legend, alt, names, initial = "royal" }: ColorPickerProps) {
  const [color, setColor] = useState<ColorId>(initial);
  const name = names[color];

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
                onChange={() => setColor(id)}
              />
              <span className="swatch__dot" aria-hidden style={{ background: COLORS[id] }} />
              {names[id]}
            </label>
          ))}
        </fieldset>
      </div>
      <div className="span-6 start-7 color-frame">
        {/* Every colourway is in the HTML once it has been chosen; the browser keeps them cached. */}
        <img
          src={`/images/shoe/colour-${color}-sm.webp`}
          srcSet={`/images/shoe/colour-${color}-sm.webp 800w, /images/shoe/colour-${color}.webp 1600w`}
          sizes="(min-width: 1024px) 628px, 100vw"
          width={1600}
          height={1200}
          alt={alt.replace("{color}", name.toLowerCase())}
          loading="lazy"
        />
      </div>
    </div>
  );
}
