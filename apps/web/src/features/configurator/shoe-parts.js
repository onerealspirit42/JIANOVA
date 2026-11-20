/**
 * The shoe's parts in the model's order (the `_part` attribute, 0 to 6); must
 * match PART_IDS in parts.ts. A module of its own with no imports, so pages
 * that only need the parts and colours (the home page) do not load three.js
 * with the material. Plain JavaScript so the stills page imports it as is.
 */
export const SHOE_PARTS = ["upper", "tabs", "laces", "lining", "heel", "midsole", "outsole"];
