"use client";

import dynamic from "next/dynamic";
import { StageMessage } from "./StageMessage";

/**
 * The 3D stage, loaded only in the browser and only when needed, so three.js
 * never blocks the first paint of the page.
 */
export const LazyShoeStage = dynamic(
  () => import("./ShoeStage").then((m) => m.ShoeStage),
  {
    ssr: false,
    loading: () => <StageMessage busy />,
  },
);
