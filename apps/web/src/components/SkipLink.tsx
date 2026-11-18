export function SkipLink({ label }: { label: string }) {
  return (
    <a
      href="#content"
      className="sr-only rounded-sm bg-brand-900 text-sm text-white focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-20 focus:px-4 focus:py-2"
    >
      {label}
    </a>
  );
}
