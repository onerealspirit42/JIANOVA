import { useId } from "react";

type WordmarkProps = {
  className?: string;
};

/**
 * The JIANOVA wordmark.
 *
 * Geometric, single-weight letterforms drawn as strokes on a 40-unit cap
 * height. The letter A deliberately has no horizontal crossbar. The colour
 * follows the surrounding text colour (currentColor); size it with a height
 * or width class, e.g. `h-5` or `w-48`.
 */
export function Wordmark({ className }: WordmarkProps) {
  // Strip characters that are not valid inside a url(#id) reference.
  const clipId = `wm-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;

  return (
    <svg
      viewBox="0 0 219.62 40"
      role="img"
      aria-label="JIANOVA"
      className={className}
    >
      <defs>
        <clipPath id={clipId}>
          <rect width="219.62" height="40" />
        </clipPath>
      </defs>
      <g
        clipPath={`url(#${clipId})`}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinejoin="miter"
        strokeMiterlimit="10"
      >
        {/* J */}
        <path transform="translate(-8 0)" d="M17 0 V31 A9 9 0 0 1 8 40" />
        {/* I */}
        <path transform="translate(21.4 0)" d="M0 0 V40" />
        {/* A (no crossbar) */}
        <path transform="translate(31.87 0)" d="M-1.05 43 L14 0 L29.05 43" />
        {/* N */}
        <path transform="translate(69.84 0)" d="M0 43 V0 L24 40 V-3" />
        {/* O */}
        <circle cx="124.04" cy="20" r="18.8" />
        {/* V */}
        <path
          transform="translate(153.31 0)"
          d="M-1.05 -3 L14 40 L29.05 -3"
        />
        {/* A (no crossbar) */}
        <path transform="translate(190.35 0)" d="M-1.05 43 L14 0 L29.05 43" />
      </g>
    </svg>
  );
}
