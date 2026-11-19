import { Logo } from "@/components/brand/Logo";
import type { Dictionary, Locale } from "@/app/[lang]/dictionaries";

type SiteNavProps = {
  lang: Locale;
  dict: Dictionary;
  /** Which page this is: section links stay on the page only on "home". */
  page: "home" | "brand" | "customize" | "other";
  /** The same page in the other language, e.g. "/ar/brand". */
  alternate: string;
};

/**
 * The fixed site header (taste-skill kit, dealt "nav-split"): four words on
 * the left, the logo in the middle, the language and the main action on the
 * right; a full-screen sheet on phones (system.js opens it).
 *
 * Links are plain <a> elements on purpose: every page loads the kit's scripts
 * once, so moving between pages is a full page load.
 */
export function SiteNav({ lang, dict, page, alternate }: SiteNavProps) {
  const home = page === "home" ? "" : `/${lang}`;
  const other = lang === "ar" ? "en" : "ar";
  const { nav } = dict.common;

  return (
    <header className="nav nav--split">
      <div className="wrap nav__bar">
        <a className="skip-link" href="#top">
          {dict.common.skipToContent}
        </a>
        <a className="nav__logo" translate="no" href={page === "home" ? "#top" : `/${lang}`} aria-label={dict.common.home}>
          <Logo decorative />
        </a>
        <nav className="nav__links" aria-label={dict.common.navLabel}>
          <div className="nav__item">
            <a className="nav__link" href={`${home}#parts`}>{nav.parts}</a>
          </div>
          <div className="nav__item">
            <a className="nav__link" href={`${home}#steps`}>{nav.steps}</a>
          </div>
          <div className="nav__item">
            <a className="nav__link" href={`${home}#colors`}>{nav.colors}</a>
          </div>
          <div className="nav__item">
            <a
              className="nav__link"
              href={`/${lang}/brand`}
              aria-current={page === "brand" ? "page" : undefined}
            >
              {nav.brand}
            </a>
          </div>
        </nav>
        <div className="nav__actions">
          <a className="nav__link" href={alternate} lang={other} hrefLang={other}>
            {dict.common.switchLanguage}
          </a>
          {page !== "customize" && (
            <a className="btn btn--primary" href={`/${lang}/customize`}>
              {dict.common.mainAction}
            </a>
          )}
        </div>
        <button className="nav__toggle" type="button" aria-expanded="false" aria-label={dict.common.menu}>
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path d="M2 5h14M2 13h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </header>
  );
}
