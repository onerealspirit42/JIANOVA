import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
// Self-hosted faces. The taste skill dealt Instrument Serif / Instrument Sans
// for English; Arabic falls through to Noto Naskh Arabic (headings) and
// IBM Plex Sans Arabic (text). Browsers download only the subsets in use.
import "@fontsource/instrument-serif/400.css";
import "@fontsource/instrument-sans/400.css";
import "@fontsource/instrument-sans/500.css";
import "@fontsource/noto-naskh-arabic/arabic-400.css";
import "@fontsource/ibm-plex-sans-arabic/arabic-400.css";
import "@fontsource/ibm-plex-sans-arabic/arabic-500.css";
import "../globals.css";
import { KitScripts } from "@/components/site/KitScripts";
import { getDictionary, hasLocale, locales } from "./dictionaries";

export async function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = await getDictionary(lang);

  return {
    title: dict.meta.title,
    description: dict.meta.description,
    alternates: {
      languages: Object.fromEntries(locales.map((l) => [l, `/${l}`])),
    },
    openGraph: {
      type: "website",
      title: dict.meta.title,
      description: dict.meta.description,
      images: [{ url: "/share.jpg", width: 1200, height: 630, alt: dict.meta.shareAlt }],
    },
    twitter: { card: "summary_large_image" },
    // The taste skill's checker reads the kind of site from these.
    other: { "site-kind": "other", "page-type": "product" },
  };
}

export const viewport: Viewport = {
  themeColor: "#faf9fb",
  viewportFit: "cover",
};

/** The hero's entrance and the moments' guard, set before the first paint. */
const HEAD_SCRIPT =
  "document.documentElement.classList.add('m-enter');setTimeout(()=>document.documentElement.classList.add('m-enter-done'),700);" +
  "document.documentElement.classList.add('mo-js');setTimeout(()=>document.documentElement.classList.add('mo-safe'),2500);";

export default async function RootLayout({
  children,
  params,
}: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  return (
    <html
      lang={lang}
      dir={lang === "ar" ? "rtl" : "ltr"}
      data-type="product"
      data-radius="soft"
      data-buttons="block"
      data-motion=""
      // The head script adds classes to <html> before React hydrates.
      suppressHydrationWarning
    >
      <head>
        {/* The taste-skill kit (public/assets), in the order it asks for. Plain
            files on purpose: the kit's checker and scripts expect them. */}
        {/* eslint-disable @next/next/no-css-tags */}
        <link rel="stylesheet" href="/assets/system.css" />
        <link rel="stylesheet" href="/assets/ui/cards.css" />
        <link rel="stylesheet" href="/assets/motion/motion.css" />
        <link rel="stylesheet" href="/assets/layout/layout.css" />
        <link rel="stylesheet" href="/assets/icons/icon.css" />
        {/* JIANOVA's palette and type tokens, after layout.css. */}
        <link rel="stylesheet" href="/assets/jianova.css" />
        {/* eslint-enable @next/next/no-css-tags */}
        <script dangerouslySetInnerHTML={{ __html: HEAD_SCRIPT }} />
        <link rel="modulepreload" href="/assets/moments/moments.js" />
        <link rel="modulepreload" href="/assets/moments/lib.js" />
      </head>
      <body>
        {children}
        <KitScripts />
      </body>
    </html>
  );
}
