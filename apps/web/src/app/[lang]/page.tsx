import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SkipLink } from "@/components/SkipLink";
import { LazyShoeStage } from "@/features/configurator/LazyShoeStage";
import { DEFAULT_DESIGN } from "@/features/configurator/parts";
import { getDictionary, hasLocale } from "./dictionaries";

export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  return (
    <>
      <SkipLink label={dict.common.skipToContent} />

      {/* The header floats over the hero so the dark stage runs behind both. */}
      <SiteHeader
        lang={lang}
        inverted
        className="absolute inset-x-0 top-0"
        labels={{
          nav: dict.common.navLabel,
          customize: dict.common.customize,
          switchLanguage: dict.common.switchLanguage,
          home: dict.common.home,
        }}
      />

      <main id="content" className="flex-1">
        {/* Hero: the shoe on a dark stage is the one bold element of the page. */}
        <section aria-labelledby="hero-title" className="stage text-white">
          <div className="mx-auto grid w-full max-w-7xl items-center gap-4 px-6 pt-[4.5rem] pb-10 sm:px-10 lg:min-h-svh lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:pb-16">
            <div className="hero-copy pt-8 lg:pt-0">
              <h1
                id="hero-title"
                className="max-w-[12ch] text-[2.75rem] leading-[1.05] font-light tracking-tight text-balance sm:text-6xl lg:text-7xl rtl:max-w-[14ch] rtl:leading-[1.35] rtl:tracking-normal"
              >
                {dict.hero.title}
              </h1>
              <p className="mt-6 max-w-md text-base leading-relaxed text-pretty text-brand-200 sm:text-lg rtl:leading-loose">
                {dict.hero.intro}
              </p>
              <Link
                href={`/${lang}/customize`}
                className="mt-10 inline-flex h-12 items-center rounded-full bg-white px-7 text-sm font-medium text-brand-900 transition-[background-color,scale] duration-150 ease-out hover:bg-brand-100 active:scale-[0.96]"
              >
                {dict.hero.cta}
              </Link>
            </div>

            <div className="hero-stage relative h-[52svh] min-h-[300px] lg:h-[72svh]">
              <LazyShoeStage
                design={DEFAULT_DESIGN}
                autoRotate
                label={dict.hero.stageLabel}
                messages={{
                  loading: dict.configurator.loading,
                  unavailable: dict.configurator.unavailable,
                  view: dict.configurator.view,
                }}
                className="absolute inset-0"
              />
            </div>

            <p className="text-xs text-brand-200/70 lg:col-span-2">
              {dict.hero.placeholderNote}
            </p>
          </div>
        </section>

        <section aria-labelledby="vision-heading">
          <div className="mx-auto w-full max-w-7xl px-6 py-24 sm:px-10 sm:py-36">
            <h2 id="vision-heading" className="sr-only">
              {dict.vision.heading}
            </h2>
            <p className="max-w-[22ch] text-3xl leading-[1.2] font-light text-balance text-brand-900 sm:text-5xl rtl:max-w-[26ch] rtl:leading-[1.5]">
              {dict.vision.text}
            </p>
          </div>
        </section>

        <section aria-labelledby="status-heading" className="bg-brand-50">
          <div className="mx-auto grid w-full max-w-7xl gap-6 px-6 py-16 sm:px-10 sm:py-20 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
            <h2 id="status-heading" className="text-xl font-normal text-brand-900">
              {dict.status.heading}
            </h2>
            <div className="max-w-xl">
              <p className="text-base leading-relaxed text-pretty text-ink-500 rtl:leading-loose">
                {dict.status.text}
              </p>
              <Link
                href={`/${lang}/customize`}
                className="mt-6 inline-block rounded-sm py-1 text-sm text-brand-900 underline underline-offset-8 transition-colors hover:text-brand-500"
              >
                {dict.status.link}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter rights={dict.common.rights} />
    </>
  );
}
