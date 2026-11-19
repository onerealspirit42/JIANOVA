/**
 * The JIANOVA star: four points, each with the 38.6 degree tip of the
 * wordmark's A (the A has no crossbar), joined by smooth curves, and split
 * into two halves with the right one a step higher: a pair, mid-stride.
 * From scripts/brand/build-logo.mjs, on a 70 x 105 box.
 */
export const STAR_PATH =
  "M33.20,99.88 C20.87,65.06 17.52,61.13 0.00,55.00 C17.52,48.87 20.87,44.94 33.20,10.12 Z M36.80,5.12 C49.13,39.94 52.48,43.87 70.00,50.00 C52.48,56.13 49.13,60.06 36.80,94.88 Z";
export const STAR_WIDTH = 70;
export const STAR_HEIGHT = 105;

type StarMarkProps = {
  className?: string;
  /** Set a name when the star stands alone and means something. */
  label?: string;
};

export function StarMark({ className, label }: StarMarkProps) {
  return (
    <svg
      viewBox={`0 0 ${STAR_WIDTH} ${STAR_HEIGHT}`}
      className={className}
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true, focusable: false })}
    >
      <path d={STAR_PATH} fill="currentColor" />
    </svg>
  );
}
