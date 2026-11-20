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
  colorsLegend: string;
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

  return (
    <div className="[display:grid] flex-1 lg:grid-cols-[minmax(0,1fr)_380px]">
      {/* Stage */}
      <div className="designer-stage relative h-[56svh] min-h-[340px] lg:h-auto lg:min-h-[calc(100svh-5rem)]">
        <LazyShoeStage
          design={design}
          interactive
          highlightPart={selectedPart}
          highlightTick={selectionTick}
          onSelectPart={selectPart}
          label={messages.stageLabel}
          messages={{
            loading: messages.loading,
            unavailable: messages.unavailable,
            view: messages.view,
          }}
          className="absolute inset-0"
        />
        <p className="pointer-events-none absolute inset-x-0 bottom-4 px-6 text-center text-xs text-balance text-brand-200/80">
          {messages.hint}
        </p>
      </div>

      {/* Controls */}
      <section
        aria-labelledby="configurator-title"
        className="border-line bg-surface px-6 py-8 sm:px-10 lg:border-s lg:px-8 lg:py-10"
      >
        <h1 id="configurator-title" className="text-brand-900">
          {messages.title}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-pretty text-ink-500">{messages.intro}</p>
        {IS_STAND_IN_MODEL && (
          <p className="mt-4 rounded-sm bg-brand-50 px-3 py-2 text-xs leading-relaxed text-brand-700">
            {messages.modelNote}
          </p>
        )}

        <fieldset className="mt-8">
          <legend className="text-sm font-medium text-brand-900">
            {messages.partsLegend}
          </legend>
          <div className="mt-3 [display:grid] grid-cols-2 gap-2">
            {PART_IDS.map((part) => (
              <label
                key={part}
                className="flex cursor-pointer items-center gap-3 rounded-sm border border-line px-3 py-2.5 text-sm text-brand-900 transition-[border-color,background-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-brand-300 has-checked:border-brand-900 has-checked:bg-brand-50 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-brand-500"
              >
                <input
                  type="radio"
                  name="part"
                  value={part}
                  checked={selectedPart === part}
                  onChange={(e) => isPartId(e.target.value) && selectPart(e.target.value)}
                  className="sr-only"
                />
                <span
                  aria-hidden
                  className="size-3.5 shrink-0 rounded-full ring-1 ring-black/10 transition-[background-color] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                  style={{ backgroundColor: COLORS[design[part]] }}
                />
                {messages.parts[part]}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-8">
          <legend className="text-sm font-medium text-brand-900">
            {messages.colorsLegend.replace("{part}", messages.parts[selectedPart])}
          </legend>
          <div className="mt-3 flex flex-wrap gap-3">
            {COLOR_IDS.map((color) => (
              <label
                key={color}
                title={messages.colors[color]}
                className="relative [display:grid] size-11 cursor-pointer place-items-center rounded-full has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-brand-500"
              >
                <input
                  type="radio"
                  name="color"
                  value={color}
                  checked={selectedColor === color}
                  onChange={(e) => {
                    if (isColorId(e.target.value)) setColor(selectedPart, e.target.value);
                    setLinkStatus("");
                  }}
                  aria-label={messages.colors[color]}
                  className="peer sr-only"
                />
                <span
                  aria-hidden
                  className="size-9 rounded-full ring-1 ring-black/10 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] peer-checked:scale-90"
                  style={{ backgroundColor: COLORS[color] }}
                />
                <span
                  aria-hidden
                  className="absolute inset-0 rounded-full ring-0 ring-brand-900 transition-[box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] peer-checked:ring-2"
                />
              </label>
            ))}
          </div>
          <p className="mt-3 text-sm text-ink-500" aria-live="polite">
            {messages.colors[selectedColor]}
          </p>
        </fieldset>

        <div className="mt-8 flex flex-wrap items-baseline gap-x-6 gap-y-2">
          <button
            type="button"
            onClick={reset}
            className="py-2 text-sm text-brand-900 underline underline-offset-8 transition-colors duration-300 hover:text-brand-500"
          >
            {messages.reset}
          </button>
          <button
            type="button"
            onClick={copyLink}
            className="py-2 text-sm text-brand-900 underline underline-offset-8 transition-colors duration-300 hover:text-brand-500"
          >
            {messages.copyLink}
          </button>
          {/* Stays mounted so screen readers announce the text when it appears. */}
          <p role="status" className="text-sm text-ink-500">
            {linkStatus === "copied" && !canUndo && messages.linkCopied}
            {linkStatus === "failed" && !canUndo && messages.linkFailed}
            {canUndo && (
              <>
                {messages.resetDone}{" "}
                <button
                  type="button"
                  onClick={undoReset}
                  className="ms-1 py-2 font-medium text-brand-900 underline underline-offset-8 transition-colors duration-300 hover:text-brand-500"
                >
                  {messages.undo}
                </button>
              </>
            )}
          </p>
        </div>
      </section>
    </div>
  );
}
