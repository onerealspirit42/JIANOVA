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
  selectPart: (part: PartId) => void;
  setColor: (part: PartId, color: ColorId) => void;
  reset: () => void;
};

export const useConfigurator = create<ConfiguratorState>((set) => ({
  design: DEFAULT_DESIGN,
  selectedPart: "upper",
  selectionTick: 0,
  selectPart: (part) =>
    set((s) => ({ selectedPart: part, selectionTick: s.selectionTick + 1 })),
  setColor: (part, color) =>
    set((s) => ({ design: { ...s.design, [part]: color } })),
  reset: () => set({ design: DEFAULT_DESIGN }),
}));
