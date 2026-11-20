import { Logo } from "@/components/brand/Logo";
import type { Dictionary, Locale } from "@/app/[lang]/dictionaries";

type SiteFooterProps = {
  lang: Locale;
  dict: Dictionary;
  page: "home" | "brand" | "other";
  alternate: string;
};

/**
 * The closing section (taste-skill kit): row 1 the dealt "close-type" (one
 * line and the main action as the big button), row 2 the dealt
 * "footer-columns" directory and the legal row.
 */
export function SiteFooter({ lang, dict, page, alternate }: SiteFooterProps) {
  const home = page === "home" ? "" : `/${lang}`;
  const other = lang === "ar" ? "en" : "ar";
  const { footer } = dict;

  return (
    <footer className="footer closing" id="contact" aria-labelledby="close-h">
      <div className="wrap">
        <div className="closing__cta close--type">
          <div className="section-head">
            <h2 id="close-h">{footer.closeTitle}</h2>
            <p>{footer.closeLine}</p>
          </div>
          <a className="btn btn--primary btn--xl" href={`/${lang}/customize`}>
            {dict.common.mainAction}
          </a>
        </div>
        <div className="closing__links">
          <div className="grid">
            <div className="span-4 stack-4">
              <a className="nav__logo" translate="no" href={page === "home" ? "#top" : `/${lang}`} aria-label={dict.common.home}>
                <Logo decorative />
              </a>
              <p className="footer__lede">{footer.lede}</p>
            </div>
            <div className="span-2 footer__col">
              <h3>{footer.groups.shoe}</h3>
              <ul>
                <li><a href={`${home}#parts`}>{footer.links.parts}</a></li>
                <li><a href={`${home}#steps`}>{footer.links.steps}</a></li>
                <li><a href={`${home}#colors`}>{footer.links.colors}</a></li>
              </ul>
            </div>
            <div className="span-2 footer__col">
              <h3>{footer.groups.designer}</h3>
              <ul>
                <li><a href={`/${lang}/customize`}>{dict.common.mainAction}</a></li>
              </ul>
            </div>
            <div className="span-2 footer__col">
              <h3>{footer.groups.brand}</h3>
              <ul>
                <li><a href={`/${lang}/brand`}>{footer.links.logo}</a></li>
              </ul>
            </div>
            <div className="span-2 footer__col">
              <h3>{footer.groups.help}</h3>
              <ul>
                <li><a href={`${home}#questions`}>{footer.links.questions}</a></li>
                <li><a href={alternate} lang={other} hrefLang={other}>{dict.common.switchLanguage}</a></li>
              </ul>
            </div>
          </div>
          <div className="footer__legal">
            <span>{footer.legal}</span>
            {/* The one credit line: the stand-in shoe's licence asks for it. */}
            <span>
              {footer.credit.before}
              <a href="https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/MaterialsVariantsShoe" lang="en">
                {footer.credit.title}
              </a>
              {footer.credit.after}
              <a href="https://creativecommons.org/licenses/by/4.0/" lang="en">
                {footer.credit.license}
              </a>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
