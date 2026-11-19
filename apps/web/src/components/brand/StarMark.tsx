/**
 * The JIANOVA star: four points, each with the 38.6 degree tip of the
 * wordmark's A (the A has no crossbar), joined by smooth curves; the vertical
 * points are longer than the horizontal ones. From scripts/brand/build-logo.mjs,
 * on a 74 x 100 box.
 */
export const STAR_PATH =
  "M37.00,0.00 C49.12,34.62 55.78,43.62 74.00,50.00 C55.78,56.38 49.12,65.38 37.00,100.00 C24.88,65.38 18.22,56.38 0.00,50.00 C18.22,43.62 24.88,34.62 37.00,0.00 Z";
export const STAR_WIDTH = 74;

type StarMarkProps = {
  className?: string;
  /** Set a name when the star stands alone and means something. */
  label?: string;
};

export function StarMark({ className, label }: StarMarkProps) {
  return (
    <svg
      viewBox="0 0 74 100"
      className={className}
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true, focusable: false })}
    >
      <path d={STAR_PATH} fill="currentColor" />
    </svg>
  );
}
