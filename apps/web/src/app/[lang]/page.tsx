import type { CSSProperties } from "react";
import { notFound } from "next/navigation";
import { ActionBar } from "@/components/site/ActionBar";
import { ColorPicker } from "@/components/site/ColorPicker";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteNav } from "@/components/site/SiteNav";
import { TurnHero } from "@/components/site/TurnHero";
import { getDictionary, hasLocale } from "./dictionaries";

/*
  Built with the taste skill (design-taste-frontend 2.5).
  Kind: product (site-kind other, page type product).
  Deal: hero product (the shoe render on the stage; the brief asks for 3D) ·
        palette: the client's own colours (start.mjs brand), royal purple #241039 ·
        type instrument-serif (Instrument Serif / Instrument Sans; Arabic:
        Noto Naskh Arabic / IBM Plex Sans Arabic) · radius soft · nav-split ·
        footer-columns · close-type · rhythm brand-band · buttons block ·
        mark: the client's star logo · moments: pinned-chapters (#steps),
        word-highlight (#idea).
  Sections: hero and turn (the shoe turns a full circle with the scroll,
  TurnHero.tsx) · parts (a pair of close-ups) · steps (pinned
  chapters, three views) · idea (statement) · colors (brand band, swatches swap
  the picture) · questions (faq) · footer.closing.
*/

const shoe = (name: string) => ({
  src: `/images/shoe/${name}-sm.webp`,
  srcSet: `/images/shoe/${name}-sm.webp 800w, /images/shoe/${name}.webp 1600w`,
});

const PART_IMAGES: Record<string, string> = {
  laces: "part-laces",
  heel: "part-heel",
};

const STEP_IMAGES = ["step-part", "step-colour", "step-turn"];

/** The two close-ups the parts section shows. */
const PAIR = ["laces", "heel"] as const;

export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const t = dict.home;
  const alternate = lang === "ar" ? "/en" : "/ar";

  return (
    <>
      <SiteNav lang={lang} dict={dict} page="home" alternate={alternate} />

      <main id="top">
        <TurnHero
          title={t.hero.title}
          lead={t.hero.lead}
          primary={{ label: dict.common.mainAction, href: `/${lang}/customize` }}
          secondary={{ label: t.hero.secondary, href: "#colors" }}
          alt={t.hero.alt}
          captions={t.turn.captions}
          looksLabel={t.turn.looksLabel}
          lookNames={[dict.configurator.colors.royal, dict.configurator.colors.ember, dict.configurator.colors.oasis]}
        />

        <section className="section" id="parts" aria-labelledby="parts-h">
          <div className="wrap">
            <div className="section-head">
              <h2 id="parts-h">{t.parts.title}</h2>
              <p>{t.parts.lead}</p>
            </div>
            {/* Composition "pair": two close-ups at one ratio, tops level. */}
            <div className="grid">
              {PAIR.map((id) => {
                const item = t.parts.items.find((i) => i.id === id)!;
                return (
                  <div key={id} className="span-6 frame frame--photo part-frame">
                    <img
                      {...shoe(PART_IMAGES[id])}
                      sizes="(min-width: 1024px) 628px, 100vw"
                      width={1600}
                      height={1200}
                      alt={item.alt}
                      loading="lazy"
                      data-parallax
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section
          className="section"
          id="steps"
          style={{ "--h": 2 } as CSSProperties}
          data-moment="pinned-chapters"
          aria-labelledby="steps-h"
        >
          <div className="wrap mo-pc__grid">
            <div className="mo-pc__text">
              <h2 id="steps-h">{t.steps.title}</h2>
              <ol className="mo-pc__steps">
                {t.steps.items.map((step, i) => (
                  <li key={step.title} className="mo-pc__step">
                    <h3>{step.title}</h3>
                    <p>{step.text}</p>
                    <figure className="mo-pc__visual">
                      <img
                        {...shoe(STEP_IMAGES[i])}
                        sizes="(min-width: 1024px) 628px, 100vw"
                        width={1600}
                        height={1000}
                        alt={step.alt}
                        loading="lazy"
                      />
                    </figure>
                  </li>
                ))}
              </ol>
            </div>
            <div className="mo-pc__visuals frame" />
          </div>
        </section>

        <section
          className="section statement ground-surface"
          id="idea"
          data-moment="word-highlight"
          data-moment-opts='{"pin":true}'
          aria-labelledby="idea-h"
        >
          <div className="wrap">
            <h2 id="idea-h" className="t-label">
              {t.idea.title}
            </h2>
            {/* The kit's word-highlight hides each word span and labels the paragraph,
                which screen readers ignore on a <p>; they read this copy instead. */}
            <p className="sr-only">
              {t.idea.before}
              {t.idea.strong}
              {t.idea.after}
            </p>
            <p className="mo-wh__text" aria-hidden="true">
              {t.idea.before}
              <strong>{t.idea.strong}</strong>
              {t.idea.after}
            </p>
          </div>
        </section>

        <section className="section ground-brand" id="colors" aria-labelledby="colors-h">
          <div className="wrap">
            <div className="section-head">
              <h2 id="colors-h">{t.colors.title}</h2>
              <p>{t.colors.lead}</p>
            </div>
            <ColorPicker
              legend={t.colors.legend}
              alt={t.colors.alt}
              names={dict.configurator.colors}
            />
          </div>
        </section>

        <section className="section" id="questions" aria-labelledby="questions-h">
          <div className="wrap grid">
            <div className="span-5">
              <div className="section-head">
                <h2 id="questions-h">{t.questions.title}</h2>
                <p>{t.questions.lead}</p>
              </div>
              {/* The designer itself, on a phone (a screenshot of /customize). */}
              <img
                className="phone-shot"
                src={`/images/designer-${lang}.webp`}
                width={520}
                height={1125}
                alt={t.questions.phoneAlt}
                loading="lazy"
              />
            </div>
            <div className="span-6 start-7 faq">
              {t.questions.items.map((item) => (
                <div key={item.q} className="faq__item">
                  <h3>{item.q}</h3>
                  <p>{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter lang={lang} dict={dict} page="home" alternate={alternate} />
      <ActionBar lang={lang} dict={dict} />
    </>
  );
}
