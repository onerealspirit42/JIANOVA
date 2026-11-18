import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { SkipLink } from "@/components/SkipLink";
import { Configurator } from "@/features/configurator/Configurator";
import { getDictionary, hasLocale } from "../dictionaries";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/customize">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return { title: dict.meta.customizeTitle };
}

export default async function CustomizePage({
  params,
}: PageProps<"/[lang]/customize">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  return (
    <>
      <SkipLink label={dict.common.skipToContent} />
      <div className="bg-brand-950 text-white">
        <SiteHeader
          lang={lang}
          path="/customize"
          inverted
          labels={{
            nav: dict.common.navLabel,
            customize: dict.common.customize,
            switchLanguage: dict.common.switchLanguage,
            home: dict.common.home,
          }}
        />
      </div>
      <main id="content" className="flex flex-1 flex-col">
        <Configurator messages={dict.configurator} />
      </main>
    </>
  );
}
