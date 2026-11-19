import { COLOR_IDS, DEFAULT_DESIGN, PART_IDS, type Design } from "./parts";

/**
 * A design in the page address: one digit per part (in PART_IDS order), each
 * the index of its colour in COLOR_IDS, e.g. ?d=0044404. Short enough to
 * share, and readable without any server.
 */
export const DESIGN_PARAM = "d";

export function encodeDesign(design: Design): string {
  return PART_IDS.map((part) => COLOR_IDS.indexOf(design[part])).join("");
}

/** The design in `value`, or null when it is missing or not a valid code. */
export function decodeDesign(value: string | null): Design | null {
  if (!value || value.length !== PART_IDS.length) return null;
  const design = { ...DEFAULT_DESIGN };
  for (let i = 0; i < PART_IDS.length; i++) {
    const index = Number(value[i]);
    if (!Number.isInteger(index) || index < 0 || index >= COLOR_IDS.length) return null;
    design[PART_IDS[i]] = COLOR_IDS[index];
  }
  return design;
}

export const isDefaultDesign = (design: Design) =>
  PART_IDS.every((part) => design[part] === DEFAULT_DESIGN[part]);
