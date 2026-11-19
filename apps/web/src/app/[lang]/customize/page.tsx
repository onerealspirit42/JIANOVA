import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteNav } from "@/components/site/SiteNav";
import { Configurator } from "@/features/configurator/Configurator";
import { getDictionary, hasLocale } from "../dictionaries";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/customize">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return {
    title: dict.meta.customizeTitle,
    description: dict.meta.customizeDescription,
    openGraph: { title: dict.meta.customizeTitle, description: dict.meta.customizeDescription },
  };
}

export default async function CustomizePage({
  params,
}: PageProps<"/[lang]/customize">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  return (
    <>
      <SiteNav
        lang={lang}
        dict={dict}
        page="customize"
        alternate={lang === "ar" ? "/en/customize" : "/ar/customize"}
      />
      <main id="top" className="designer">
        <Configurator messages={dict.configurator} />
      </main>
    </>
  );
}
