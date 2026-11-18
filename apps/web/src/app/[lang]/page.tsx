import { notFound } from "next/navigation";
import { Wordmark } from "@/components/brand/Wordmark";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { getDictionary, hasLocale } from "./dictionaries";

export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  const dict = await getDictionary(lang);
  const otherLang = lang === "ar" ? "en" : "ar";

  return (
    <>
      <a
        href="#content"
        className="sr-only rounded-sm bg-brand-900 text-sm text-white focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-10 focus:px-4 focus:py-2"
      >
        {dict.common.skipToContent}
      </a>

      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6 sm:px-10 sm:py-8">
        <Wordmark className="h-5 w-auto text-brand-900 sm:h-6" />
        <LanguageSwitch target={otherLang} label={dict.common.switchLanguage} />
      </header>

      <main id="content" className="flex-1">
        {/* Hero */}
        <section className="mx-auto w-full max-w-6xl px-6 pb-24 pt-20 sm:px-10 sm:pb-32 sm:pt-32">
          <p className="text-xs uppercase tracking-[0.32em] text-ink-500 rtl:tracking-normal rtl:text-sm">
            {dict.hero.status}
          </p>
          <h1 className="mt-8 max-w-3xl text-4xl font-light leading-[1.15] text-brand-900 sm:text-6xl rtl:leading-[1.4]">
            {dict.hero.title}
          </h1>
          <p className="mt-8 max-w-xl text-base leading-relaxed text-ink-500 sm:text-lg rtl:leading-loose">
            {dict.hero.intro}
          </p>
        </section>

        {/* Vision */}
        <section
          aria-labelledby="vision-heading"
          className="border-t border-line"
        >
          <div className="mx-auto grid w-full max-w-6xl gap-6 px-6 py-16 sm:grid-cols-[1fr_2fr] sm:gap-10 sm:px-10 sm:py-24">
            <h2
              id="vision-heading"
              className="text-xs uppercase tracking-[0.32em] text-ink-500 rtl:tracking-normal rtl:text-sm"
            >
              {dict.vision.heading}
            </h2>
            <p className="max-w-2xl text-2xl font-light leading-snug text-brand-900 sm:text-3xl rtl:leading-relaxed">
              {dict.vision.text}
            </p>
          </div>
        </section>

        {/* What we are building (honest: nothing here is released yet) */}
        <section
          aria-labelledby="building-heading"
          className="border-t border-line"
        >
          <div className="mx-auto w-full max-w-6xl px-6 py-16 sm:px-10 sm:py-24">
            <h2
              id="building-heading"
              className="text-xs uppercase tracking-[0.32em] text-ink-500 rtl:tracking-normal rtl:text-sm"
            >
              {dict.building.heading}
            </h2>
            <p className="mt-4 text-sm text-ink-500">{dict.building.note}</p>

            <ul className="mt-12 grid gap-10 sm:grid-cols-3 sm:gap-12">
              {dict.building.items.map((item) => (
                <li key={item.title} className="border-t border-brand-900 pt-6">
                  <h3 className="text-lg font-normal text-brand-900">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-ink-500 rtl:leading-loose">
                    {item.text}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-8 text-xs text-ink-500 sm:px-10">
          <span>
            © JIANOVA. {dict.common.rights}
          </span>
        </div>
      </footer>
    </>
  );
}
