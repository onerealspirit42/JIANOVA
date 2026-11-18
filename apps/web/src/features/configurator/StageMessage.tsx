import type { ReactNode } from "react";

/** Centered text on the dark stage; with `busy`, a quiet loading indicator. */
export function StageMessage({
  children,
  busy = false,
}: {
  children?: ReactNode;
  busy?: boolean;
}) {
  return (
    <div
      aria-busy={busy || undefined}
      className="flex h-full w-full items-center justify-center p-6 text-center text-sm text-brand-200"
    >
      {busy ? (
        <span className="block h-px w-16 animate-pulse bg-brand-300/60" />
      ) : (
        children
      )}
    </div>
  );
}
