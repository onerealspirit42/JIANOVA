"use client";

import { useEffect, useRef, useState } from "react";
import { LazyShoeStage } from "./LazyShoeStage";
import { useConfigurator } from "./store";
import { DESIGN_PARAM, decodeDesign, encodeDesign, isDefaultDesign } from "./share";
import type { ViewMessages } from "./ShoeStage";
import {
  COLOR_IDS,
  COLORS,
  IS_STAND_IN_MODEL,
  PART_IDS,
  isColorId,
  isPartId,
  type ColorId,
  type PartId,
} from "./parts";

export type ConfiguratorMessages = {
  title: string;
  intro: string;
  modelNote: string;
  partsLegend: string;
  /** The colour legend for each part ("Color of the laces"), grammatical in each language. */
  colorFor: Record<PartId, string>;
  reset: string;
  resetDone: string;
  undo: string;
  copyLink: string;
  linkCopied: string;
  linkFailed: string;
  hint: string;
  stageLabel: string;
  loading: string;
  unavailable: string;
  view: ViewMessages;
  parts: Record<PartId, string>;
  colors: Record<ColorId, string>;
};

/**
 * The designer: the 3D stage and its panel. The panel uses the site's own
 * chips (.swatch, as in the home page's colours) and buttons (.btn), so the
 * designer looks like the rest of JIANOVA. Styles: public/assets/jianova.css.
 */
export function Configurator({ messages }: { messages: ConfiguratorMessages }) {
  const design = useConfigurator((s) => s.design);
  const selectedPart = useConfigurator((s) => s.selectedPart);
  const selectionTick = useConfigurator((s) => s.selectionTick);
  const selectPart = useConfigurator((s) => s.selectPart);
  const setColor = useConfigurator((s) => s.setColor);
  const reset = useConfigurator((s) => s.reset);
  const undoReset = useConfigurator((s) => s.undoReset);
  const canUndo = useConfigurator((s) => s.beforeReset !== null);
  const loadDesign = useConfigurator((s) => s.loadDesign);
  const [linkStatus, setLinkStatus] = useState<"" | "copied" | "failed">("");
  // Bumped when a part is chosen in the panel: the camera turns to show it.
  // (A part tapped on the shoe is already in view, so it does not turn.)
  const [focusTick, setFocusTick] = useState(0);
  const readUrl = useRef(false);

  // Open a design from the address (?d=...) once, on arrival.
  useEffect(() => {
    const shared = decodeDesign(new URLSearchParams(window.location.search).get(DESIGN_PARAM));
    if (shared) loadDesign(shared);
    readUrl.current = true;
  }, [loadDesign]);

  // Keep the address in step with the design, so the link saves and shares it,
  // and carry it into the language switch.
  useEffect(() => {
    if (!readUrl.current) return;
    const url = new URL(window.location.href);
    if (isDefaultDesign(design)) url.searchParams.delete(DESIGN_PARAM);
    else url.searchParams.set(DESIGN_PARAM, encodeDesign(design));
    window.history.replaceState(window.history.state, "", url);
    document.querySelectorAll<HTMLAnchorElement>("a[hreflang]").forEach((link) => {
      const target = new URL(link.href);
      target.search = url.search;
      link.href = target.toString();
    });
  }, [design]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setLinkStatus("copied");
    } catch {
      setLinkStatus("failed");
    }
  }

  const selectedColor = design[selectedPart];
  const isDefault = isDefaultDesign(design);

  return (
    <div className="designer__layout">
      {/* Stage: stays in view while the panel scrolls (phones included). */}
      <div className="designer-stage designer__stage">
        <LazyShoeStage
          design={design}
          interactive
          highlightPart={selectedPart}
          highlightTick={selectionTick}
          focusPart={selectedPart}
          focusTick={focusTick}
          onSelectPart={selectPart}
          label={messages.stageLabel}
          messages={{
            loading: messages.loading,
            unavailable: messages.unavailable,
            view: messages.view,
          }}
          className="absolute inset-0"
        />
        <p className="designer__hint">{messages.hint}</p>
      </div>

      <section aria-labelledby="configurator-title" className="designer__panel">
        <div className="designer__head">
          <h1 id="configurator-title">{messages.title}</h1>
          <p>{messages.intro}</p>
        </div>
        {IS_STAND_IN_MODEL && <p className="designer__note">{messages.modelNote}</p>}

        <fieldset className="swatches designer__parts">
          <legend>{messages.partsLegend}</legend>
          {PART_IDS.map((part) => (
            <label key={part} className="swatch">
              <input
                type="radio"
                name="part"
                value={part}
                checked={selectedPart === part}
                onChange={(e) => {
                  if (!isPartId(e.target.value)) return;
                  selectPart(e.target.value);
                  setFocusTick((t) => t + 1);
                }}
                // The chosen part's chip again: light it and turn back to it.
                onClick={() => {
                  if (selectedPart !== part) return;
                  selectPart(part);
                  setFocusTick((t) => t + 1);
                }}
              />
              {/* The part's colour now, fading with the shoe. */}
              <span className="swatch__dot" aria-hidden style={{ background: COLORS[design[part]] }} />
              {messages.parts[part]}
            </label>
          ))}
        </fieldset>

        <fieldset className="swatches designer__colors">
          <legend>{messages.colorFor[selectedPart]}</legend>
          {COLOR_IDS.map((color) => (
            <label key={color} className="swatch">
              <input
                type="radio"
                name="color"
                value={color}
                checked={selectedColor === color}
                onChange={(e) => {
                  if (isColorId(e.target.value)) setColor(selectedPart, e.target.value);
                  setLinkStatus("");
                }}
              />
              <span className="swatch__dot" aria-hidden style={{ background: COLORS[color] }} />
              {messages.colors[color]}
            </label>
          ))}
        </fieldset>

        <div className="btn-row designer__actions">
          <button type="button" className="btn btn--primary" onClick={copyLink}>
            {messages.copyLink}
          </button>
          <button type="button" className="btn btn--secondary" onClick={reset} disabled={isDefault}>
            {messages.reset}
          </button>
        </div>
        {/* Stays mounted so screen readers announce the text when it appears. */}
        <p role="status" className="designer__status">
          {linkStatus === "copied" && !canUndo && messages.linkCopied}
          {linkStatus === "failed" && !canUndo && messages.linkFailed}
          {canUndo && (
            <>
              {messages.resetDone}{" "}
              <button type="button" className="designer__undo" onClick={undoReset}>
                {messages.undo}
              </button>
            </>
          )}
        </p>
      </section>
    </div>
  );
}
