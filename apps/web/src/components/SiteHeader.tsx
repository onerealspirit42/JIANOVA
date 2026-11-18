import Link from "next/link";
import { Wordmark } from "@/components/brand/Wordmark";
import { LanguageSwitch } from "@/components/LanguageSwitch";

type SiteHeaderProps = {
  lang: string;
  /** Path after the language segment, e.g. "" or "/customize". */
  path?: string;
  labels: { nav: string; customize: string; switchLanguage: string; home: string };
  /** Light text for use over the dark stage. */
  inverted?: boolean;
};

export function SiteHeader({ lang, path = "", labels, inverted = false }: SiteHeaderProps) {
  const otherLang = lang === "ar" ? "en" : "ar";
  const tone = inverted ? "text-white" : "text-brand-900";

  return (
    <header className={`relative z-10 ${tone}`}>
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 sm:px-10">
        <Link href={`/${lang}`} aria-label={labels.home} className="rounded-sm">
          <Wordmark decorative className="h-5 w-auto sm:h-6" />
        </Link>
        <nav aria-label={labels.nav} className="flex items-center gap-6">
          <Link
            href={`/${lang}/customize`}
            aria-current={path === "/customize" ? "page" : undefined}
            className="rounded-sm py-2 text-sm underline-offset-8 hover:underline aria-[current=page]:underline"
          >
            {labels.customize}
          </Link>
          <LanguageSwitch
            target={otherLang}
            href={`/${otherLang}${path}`}
            label={labels.switchLanguage}
          />
        </nav>
      </div>
    </header>
  );
}
