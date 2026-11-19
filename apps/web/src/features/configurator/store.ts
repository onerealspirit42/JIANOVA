import { create } from "zustand";
import {
  DEFAULT_DESIGN,
  type ColorId,
  type Design,
  type PartId,
} from "./parts";

type ConfiguratorState = {
  design: Design;
  selectedPart: PartId;
  /** Increments on every selection so the model can flash the chosen part. */
  selectionTick: number;
  /** The design before the last reset, kept so the reset can be undone. */
  beforeReset: Design | null;
  selectPart: (part: PartId) => void;
  setColor: (part: PartId, color: ColorId) => void;
  reset: () => void;
  undoReset: () => void;
  /** Replace the whole design, e.g. from a shared link. */
  loadDesign: (design: Design) => void;
};

export const useConfigurator = create<ConfiguratorState>((set) => ({
  design: DEFAULT_DESIGN,
  selectedPart: "upper",
  selectionTick: 0,
  beforeReset: null,
  selectPart: (part) =>
    set((s) => ({ selectedPart: part, selectionTick: s.selectionTick + 1 })),
  setColor: (part, color) =>
    set((s) => ({ design: { ...s.design, [part]: color }, beforeReset: null })),
  reset: () =>
    set((s) =>
      s.design === DEFAULT_DESIGN
        ? s
        : { design: DEFAULT_DESIGN, beforeReset: s.design },
    ),
  undoReset: () =>
    set((s) =>
      s.beforeReset ? { design: s.beforeReset, beforeReset: null } : s,
    ),
  loadDesign: (design) => set({ design, beforeReset: null }),
}));
