"use client";

import { createContext, useContext } from "react";
import dynamic from "next/dynamic";
import { StageMessage } from "./StageMessage";
import type { ShoeStageProps } from "./ShoeStage";

/** Carries the localized loading text into the placeholder shown while loading. */
const LoadingLabel = createContext("");

function Loading() {
  return <StageMessage busy>{useContext(LoadingLabel)}</StageMessage>;
}

const DynamicShoeStage = dynamic(
  () => import("./ShoeStage").then((m) => m.ShoeStage),
  { ssr: false, loading: () => <Loading /> },
);

/**
 * The 3D stage, loaded only in the browser and only when needed, so three.js
 * never blocks the first paint of the page.
 */
export function LazyShoeStage(props: ShoeStageProps) {
  return (
    <LoadingLabel value={props.messages.loading}>
      <DynamicShoeStage {...props} />
    </LoadingLabel>
  );
}
