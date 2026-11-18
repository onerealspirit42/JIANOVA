import type { ReactNode } from "react";

/**
 * Centered text on the dark stage. With `busy`, a quiet loading line is shown
 * and the text is announced to screen readers instead of displayed.
 */
export function StageMessage({
  children,
  busy = false,
}: {
  children?: ReactNode;
  busy?: boolean;
}) {
  return (
    <div
      role={busy ? "status" : undefined}
      className="flex h-full w-full items-center justify-center p-6 text-center text-sm text-brand-200"
    >
      {busy ? (
        <>
          <span aria-hidden className="block h-px w-16 animate-pulse bg-brand-300/60" />
          <span className="sr-only">{children}</span>
        </>
      ) : (
        children
      )}
    </div>
  );
}
