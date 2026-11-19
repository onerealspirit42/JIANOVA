import { useId } from "react";
import { STAR_POINTS } from "./StarMark";

type LogoProps = {
  className?: string;
  /** Hide from assistive tech when a parent link already names it. */
  decorative?: boolean;
  /** "horizontal": the star beside the name; "stacked": the star above it. */
  layout?: "horizontal" | "stacked";
};

/**
 * The JIANOVA logo: the star and the wordmark. The wordmark is drawn in
 * strokes on a 40-unit cap height and its A has no crossbar. Colour follows
 * currentColor; size it with a height class.
 *
 * Horizontal: the star is 1.2 times the cap height, 14 units from the name.
 * Stacked: a 64-unit star centred 22 units above the name.
 */
export function Logo({ className, decorative = false, layout = "horizontal" }: LogoProps) {
  const clipId = `logo-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const stacked = layout === "stacked";
  // Star box: 64 x 100 units, scaled to the lockup's star height.
  const starH = stacked ? 64 : 48;
  const starScale = starH / 100;
  const starW = 64 * starScale;
  const width = stacked ? 219.62 : starW + 14 + 219.62;
  const height = stacked ? 64 + 22 + 40 : 48;
  const starX = stacked ? (219.62 - starW) / 2 : 0;
  const nameX = stacked ? 0 : starW + 14;
  const nameY = stacked ? 64 + 22 : 4;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      {...(decorative
        ? { "aria-hidden": true, focusable: false }
        : { role: "img", "aria-label": "JIANOVA" })}
    >
      <polygon
        points={STAR_POINTS}
        fill="currentColor"
        transform={`translate(${starX} 0) scale(${starScale})`}
      />
      <g transform={`translate(${nameX} ${nameY})`}>
        <clipPath id={clipId}>
          <rect width="219.62" height="40" />
        </clipPath>
        <g
          clipPath={`url(#${clipId})`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeMiterlimit="10"
        >
          <path transform="translate(-8 0)" d="M17 0 V31 A9 9 0 0 1 8 40" />
          <path transform="translate(21.4 0)" d="M0 0 V40" />
          <path transform="translate(31.87 0)" d="M-1.05 43 L14 0 L29.05 43" />
          <path transform="translate(69.84 0)" d="M0 43 V0 L24 40 V-3" />
          <circle cx="124.04" cy="20" r="18.8" />
          <path transform="translate(153.31 0)" d="M-1.05 -3 L14 40 L29.05 -3" />
          <path transform="translate(190.35 0)" d="M-1.05 43 L14 0 L29.05 43" />
        </g>
      </g>
    </svg>
  );
}
