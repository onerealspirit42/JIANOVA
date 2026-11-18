import { Wordmark } from "@/components/brand/Wordmark";

export function SiteFooter({ rights }: { rights: string }) {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-6 py-10 text-xs text-ink-500 sm:flex-row sm:items-center sm:justify-between sm:px-10">
        <Wordmark decorative className="h-3.5 w-auto text-brand-900" />
        <p>© JIANOVA. {rights}</p>
      </div>
    </footer>
  );
}
