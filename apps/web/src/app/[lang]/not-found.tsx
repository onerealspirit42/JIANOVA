import { lang } from "next/root-params";
import { SiteNav } from "@/components/site/SiteNav";
import { getDictionary, hasLocale } from "./dictionaries";

export default async function NotFound() {
  const current = await lang();
  // Fall back to English if the language segment itself is invalid.
  const locale = hasLocale(current) ? current : "en";
  const dict = await getDictionary(locale);

  return (
    <>
      <SiteNav lang={locale} dict={dict} page="other" alternate={locale === "ar" ? "/en" : "/ar"} />
      <main id="top">
        <section className="section" aria-labelledby="nf-h">
          <div className="wrap">
            <div className="section-head">
              <h1 id="nf-h">{dict.notFound.title}</h1>
              <p>
                <a className="link" href={`/${locale}`}>
                  {dict.notFound.back}
                </a>
              </p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
