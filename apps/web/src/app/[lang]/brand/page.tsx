import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { StarMark } from "@/components/brand/StarMark";
import { ActionBar } from "@/components/site/ActionBar";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteNav } from "@/components/site/SiteNav";
import { COLOR_IDS, COLORS } from "@/features/configurator/parts";
import { getDictionary, hasLocale } from "../dictionaries";

export async function generateMetadata({ params }: PageProps<"/[lang]/brand">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return {
    title: dict.meta.brandTitle,
    description: dict.meta.brandDescription,
    openGraph: { title: dict.meta.brandTitle, description: dict.meta.brandDescription },
  };
}

/** Tips and inner corners of the star on its 64 x 100 box (see StarMark). */
const TOP = "16.52,44.22 32,0 47.48,44.22";
const RIGHT = "47.48,44.22 64,50 47.48,55.78";
const BOTTOM = "47.48,55.78 32,100 16.52,55.78";
const LEFT = "16.52,55.78 0,50 16.52,44.22";

/** The A, four A's turned to the four points, and the star they make. */
function StarDiagram({ label, theA, four, star }: { label: string; theA: string; four: string; star: string }) {
  return (
    <svg className="brand-diagram" viewBox="0 0 640 300" role="img" aria-label={label}>
      <g fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="miter" strokeMiterlimit="12">
        {/* The A from the wordmark, 40 units tall, scaled 4x: tip at (110, 50). */}
        <g transform="translate(54 50) scale(4)">
          <clipPath id="a-clip">
            <rect x="-2" y="0" width="34" height="40" />
          </clipPath>
          <path clipPath="url(#a-clip)" d="M-1.05 43 L14 0 L29.05 43" strokeWidth="0.6" />
        </g>
        {/* The 38.6 degree tip */}
        <path d="M 99.5 80 A 32 32 0 0 0 120.5 80" strokeWidth="1.2" opacity="0.6" />
        {/* Four A's, one per point */}
        <g transform="translate(282 50) scale(2)" strokeWidth="1.2">
          <polyline points={TOP} />
          <polyline points={RIGHT} opacity="0.75" />
          <polyline points={BOTTOM} opacity="0.55" />
          <polyline points={LEFT} opacity="0.4" />
        </g>
      </g>
      <polygon points="32,0 47.48,44.22 64,50 47.48,55.78 32,100 16.52,55.78 0,50 16.52,44.22" fill="currentColor" transform="translate(482 50) scale(2)" />
      <g fill="currentColor" fontSize="15" fontFamily="var(--font-text)" textAnchor="middle">
        <text x="110" y="122" fontSize="13" opacity="0.8">38.6°</text>
        <text x="110" y="282">{theA}</text>
        <text x="346" y="282">{four}</text>
        <text x="546" y="282">{star}</text>
      </g>
    </svg>
  );
}

export default async function BrandPage({ params }: PageProps<"/[lang]/brand">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const t = dict.brand;
  const alternate = lang === "ar" ? "/en/brand" : "/ar/brand";

  return (
    <>
      <SiteNav lang={lang} dict={dict} page="brand" alternate={alternate} />

      <main id="top">
        <section className="hero hero--product" data-enter aria-labelledby="hero-h">
          <div className="wrap">
            <div className="hero-text hero__in">
              <div className="hero__head">
                <div>
                  <h1 id="hero-h">{t.hero.title}</h1>
                  <p className="hero__lead">{t.hero.lead}</p>
                </div>
                <div className="btn-row">
                  <a className="btn btn--primary" href="/brand/jianova-logo.svg" download>
                    {t.hero.primary}
                  </a>
                  <a className="btn btn--secondary" href="#colors">
                    {t.hero.secondary}
                  </a>
                </div>
              </div>
              <div className="hero__stage logo-frame">
                <Logo className="w-full" />
              </div>
            </div>
          </div>
        </section>

        <section className="section" id="star" aria-labelledby="star-h">
          <div className="wrap grid">
            <div className="span-5 section-head">
              <h2 id="star-h">{t.star.title}</h2>
              <p>{t.star.text}</p>
            </div>
            <div className="span-6 start-7 diagram-frame">
              <StarDiagram label={t.star.diagramLabel} theA={t.star.theA} four={t.star.four} star={t.star.star} />
            </div>
          </div>
        </section>

        <section className="section" id="files" aria-labelledby="files-h">
          <div className="wrap">
            <div className="section-head">
              <h2 id="files-h">{t.files.title}</h2>
              <p>{t.files.lead}</p>
            </div>
            <div className="grid">
              <div className="tile span-3">
                <div className="tile__media logo-frame"><Logo decorative /></div>
                <div className="tile__head"><h3>{t.files.items.logo}</h3></div>
                <p>
                  <a className="link" href="/brand/jianova-logo.svg" download>{t.files.download}</a>
                  {" · "}
                  <a className="link" href="/brand/jianova-logo-white.svg" download>{t.files.downloadWhite}</a>
                </p>
              </div>
              <div className="tile span-3">
                <div className="tile__media logo-frame logo-frame--dark"><Logo decorative layout="stacked" /></div>
                <div className="tile__head"><h3>{t.files.items.stacked}</h3></div>
                <p>
                  <a className="link" href="/brand/jianova-logo-stacked.svg" download>{t.files.download}</a>
                  {" · "}
                  <a className="link" href="/brand/jianova-logo-stacked-white.svg" download>{t.files.downloadWhite}</a>
                </p>
              </div>
              <div className="tile span-3">
                <div className="tile__media logo-frame logo-frame--icon"><StarMark /></div>
                <div className="tile__head"><h3>{t.files.items.star}</h3></div>
                <p>
                  <a className="link" href="/brand/jianova-star.svg" download>{t.files.download}</a>
                  {" · "}
                  <a className="link" href="/brand/jianova-star-white.svg" download>{t.files.downloadWhite}</a>
                </p>
              </div>
              <div className="tile span-3">
                <div className="tile__media logo-frame logo-frame--icon">
                  <img src="/brand/jianova-app-icon.svg" alt="" width={120} height={120} style={{ width: "34%", height: "auto" }} />
                </div>
                <div className="tile__head"><h3>{t.files.items.icon}</h3></div>
                <p>
                  <a className="link" href="/brand/jianova-app-icon.svg" download>{t.files.download}</a>
                  {" · "}
                  <a className="link" href="/brand/jianova-app-icon-512.png" download>{t.files.downloadPng}</a>
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="section ground-brand" id="colors" aria-labelledby="colors-h">
          <div className="wrap grid">
            <div className="span-5 section-head">
              <h2 id="colors-h">{t.colors.title}</h2>
              <p>{t.colors.lead}</p>
              <h3>{t.colors.typeTitle}</h3>
              <p>{t.colors.typeText}</p>
            </div>
            <div className="span-6 start-7">
              <ul className="rows">
                {t.colors.rows.map((row) => (
                  <li key={row.hex}>
                    <span className="rows__name">
                      <span className="color-chip" style={{ background: row.hex }} aria-hidden />
                      {row.name} <span dir="ltr">{row.hex}</span>
                    </span>
                    <span className="rows__value">{row.use}</span>
                  </li>
                ))}
                <li>
                  <span className="rows__name">{t.colors.shoeColors}</span>
                  <span className="rows__value">
                    {COLOR_IDS.map((id) => (
                      <span key={id} className="color-chip" style={{ background: COLORS[id] }} title={dict.configurator.colors[id]} aria-hidden />
                    ))}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section className="section" id="use" aria-labelledby="use-h">
          <div className="wrap grid">
            <div className="span-5 section-head">
              <h2 id="use-h">{t.use.title}</h2>
              <p>{t.use.lead}</p>
            </div>
            <div className="span-6 start-7">
              <ul className="rows">
                {t.use.rows.map((row) => (
                  <li key={row.name}>
                    <span className="rows__name">{row.name}</span>
                    <span className="rows__value">{row.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter lang={lang} dict={dict} page="brand" alternate={alternate} />
      <ActionBar lang={lang} dict={dict} />
    </>
  );
}
