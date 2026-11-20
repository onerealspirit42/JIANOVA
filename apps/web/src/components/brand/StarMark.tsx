/**
 * The JIANOVA star: four points parted at the centre by two crossing lines,
 * a runner's legs crossing mid-stride.
 * From scripts/brand/build-logo.mjs, on a 70 x 100 box.
 */
export const STAR_PATH =
  "M19.48,37.00 C24.09,30.22 28.22,19.37 35.00,0.00 C41.78,19.37 45.91,30.22 50.52,37.00 L35.00,47.86 Z M52.63,39.79 C56.93,44.85 61.98,47.19 70.00,50.00 C61.98,52.81 56.93,55.15 52.63,60.21 L38.05,50.00 Z M50.52,63.00 C45.91,69.78 41.78,80.63 35.00,100.00 C28.22,80.63 24.09,69.78 19.48,63.00 L35.00,52.14 Z M17.37,60.21 C13.07,55.15 8.02,52.81 0.00,50.00 C8.02,47.19 13.07,44.85 17.37,39.79 L31.95,50.00 Z";
export const STAR_WIDTH = 70;
export const STAR_HEIGHT = 100;

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
