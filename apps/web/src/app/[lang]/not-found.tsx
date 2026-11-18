import Link from "next/link";
import { lang } from "next/root-params";
import { Wordmark } from "@/components/brand/Wordmark";
import { getDictionary, hasLocale } from "./dictionaries";

export default async function NotFound() {
  const current = await lang();
  // Fall back to English if the language segment itself is invalid.
  const locale = hasLocale(current) ? current : "en";
  const dict = await getDictionary(locale);

  return (
    <main
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
      className="flex flex-1 flex-col items-center justify-center gap-8 px-6 text-center"
    >
      <Wordmark className="h-6 w-auto text-brand-900" />
      <h1 className="text-2xl font-light text-brand-900 sm:text-3xl">
        {dict.notFound.title}
      </h1>
      <Link
        href={`/${locale}`}
        className="rounded-sm px-1 py-2 text-sm text-brand-900 underline underline-offset-8 transition-colors hover:text-brand-500"
      >
        {dict.notFound.back}
      </Link>
    </main>
  );
}
