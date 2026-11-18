import type { SVGProps } from "react";

/** Line icons drawn on a 24px grid in currentColor, 1.5px stroke. */
function Icon({ children, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      {children}
    </svg>
  );
}

export const TurnLeftIcon = () => (
  <Icon>
    <path d="M4 10a8 8 0 1 1 1.6 6.4" />
    <path d="M4 4v6h6" />
  </Icon>
);

export const TurnRightIcon = () => (
  <Icon>
    <path d="M20 10a8 8 0 1 0-1.6 6.4" />
    <path d="M20 4v6h-6" />
  </Icon>
);

export const ZoomInIcon = () => (
  <Icon>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M20 20l-4.4-4.4M11 8.5v5M8.5 11h5" />
  </Icon>
);

export const ZoomOutIcon = () => (
  <Icon>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M20 20l-4.4-4.4M8.5 11h5" />
  </Icon>
);

export const PauseIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="M9 6v12M15 6v12" />
  </Icon>
);

/** The triangle is shifted 1px toward its point so it looks centred. */
export const PlayIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="M9 6.5v11l9-5.5z" />
  </Icon>
);
