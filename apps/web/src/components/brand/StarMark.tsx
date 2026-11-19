/**
 * The JIANOVA star: four points, each with the 38.6 degree tip of the
 * wordmark's A (the A has no crossbar), the vertical points longer than the
 * horizontal ones. Points from scripts/brand/build-logo.mjs, on a 64 x 100 box.
 */
export const STAR_POINTS =
  "32,0 47.48,44.22 64,50 47.48,55.78 32,100 16.52,55.78 0,50 16.52,44.22";

type StarMarkProps = {
  className?: string;
  /** Set a name when the star stands alone and means something. */
  label?: string;
};

export function StarMark({ className, label }: StarMarkProps) {
  return (
    <svg
      viewBox="0 0 64 100"
      className={className}
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true, focusable: false })}
    >
      <polygon points={STAR_POINTS} fill="currentColor" />
    </svg>
  );
}
