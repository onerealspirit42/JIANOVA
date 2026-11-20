import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { STAR_PATH, StarMark } from "@/components/brand/StarMark";
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

/**
 * The meaning: the star 3x (210 x 300, centred on 220, 200), its two crossing
 * lines drawn on through the gaps (slope 0.70, the star's own proportion), and
 * the four points named for the moments of a stride. The foot goes round the
 * star the way the runner faces: lands in front, carries the weight below,
 * pushes off behind, flies over the top. In Arabic the runner faces left.
 */
function MeaningDiagram({ label, phases, rtl }: { label: string; phases: Record<"landing" | "support" | "pushOff" | "flight", string>; rtl: boolean }) {
  const [dx, dy] = [142.5, 99.75];
  return (
    <svg className="brand-diagram" viewBox="0 0 440 400" role="img" aria-label={label}>
      <path d={STAR_PATH} fill="currentColor" transform="translate(115 50) scale(3)" />
      <g stroke="currentColor" strokeWidth="1.2" strokeDasharray="4 5" opacity="0.55">
        <line x1={220 - dx} y1={200 + dy} x2={220 + dx} y2={200 - dy} />
        <line x1={220 - dx} y1={200 - dy} x2={220 + dx} y2={200 + dy} />
      </g>
      <g fill="currentColor" fontSize="17" fontFamily="var(--font-text)" textAnchor="middle">
        <text x="220" y="32">{phases.flight}</text>
        <text x="220" y="384">{phases.support}</text>
        <text x="384" y="206">{rtl ? phases.pushOff : phases.landing}</text>
        <text x="56" y="206">{rtl ? phases.landing : phases.pushOff}</text>
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

        <section className="section ground-surface" id="meaning" aria-labelledby="meaning-h">
          <div className="wrap grid">
            <div className="span-5">
              <div className="section-head">
                <h2 id="meaning-h">{t.meaning.title}</h2>
                <p>{t.meaning.lead}</p>
              </div>
              <ul className="rows">
                {t.meaning.rows.map((row) => (
                  <li key={row.name}>
                    <span className="rows__name">{row.name}</span>
                    <p>{row.text}</p>
                  </li>
                ))}
              </ul>
            </div>
            <div className="span-6 start-7 meaning-frame">
              <MeaningDiagram label={t.meaning.diagramLabel} phases={t.meaning.phases} rtl={lang === "ar"} />
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
                <ul className="tile__links">
                  <li><a className="link" href="/brand/jianova-logo.svg" download>{t.files.download}</a></li>
                  <li><a className="link" href="/brand/jianova-logo-white.svg" download>{t.files.downloadWhite}</a></li>
                </ul>
              </div>
              <div className="tile span-3">
                <div className="tile__media logo-frame logo-frame--dark"><Logo decorative layout="stacked" /></div>
                <div className="tile__head"><h3>{t.files.items.stacked}</h3></div>
                <ul className="tile__links">
                  <li><a className="link" href="/brand/jianova-logo-stacked.svg" download>{t.files.download}</a></li>
                  <li><a className="link" href="/brand/jianova-logo-stacked-white.svg" download>{t.files.downloadWhite}</a></li>
                </ul>
              </div>
              <div className="tile span-3">
                <div className="tile__media logo-frame logo-frame--icon"><StarMark /></div>
                <div className="tile__head"><h3>{t.files.items.star}</h3></div>
                <ul className="tile__links">
                  <li><a className="link" href="/brand/jianova-star.svg" download>{t.files.download}</a></li>
                  <li><a className="link" href="/brand/jianova-star-white.svg" download>{t.files.downloadWhite}</a></li>
                </ul>
              </div>
              <div className="tile span-3">
                <div className="tile__media logo-frame logo-frame--icon">
                  <img src="/brand/jianova-app-icon.svg" alt="" width={120} height={120} style={{ width: "34%", height: "auto" }} />
                </div>
                <div className="tile__head"><h3>{t.files.items.icon}</h3></div>
                <ul className="tile__links">
                  <li><a className="link" href="/brand/jianova-app-icon.svg" download>{t.files.download}</a></li>
                  <li><a className="link" href="/brand/jianova-app-icon-512.png" download>{t.files.downloadPng}</a></li>
                </ul>
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
