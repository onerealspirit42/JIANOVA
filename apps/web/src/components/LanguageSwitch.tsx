import Link from "next/link";

type LanguageSwitchProps = {
  /** The language the link switches TO, e.g. "ar" when the page is English. */
  target: string;
  /** Where the link goes; defaults to the home page in the target language. */
  href?: string;
  /** The link text, written in the target language. */
  label: string;
};

/**
 * A plain link to the same page in the other language. It is a normal link,
 * so it works without JavaScript, can be opened in a new tab, and is read
 * correctly by screen readers (the `lang` attribute sets pronunciation).
 */
export function LanguageSwitch({ target, href, label }: LanguageSwitchProps) {
  return (
    <Link
      href={href ?? `/${target}`}
      lang={target}
      hrefLang={target}
      className="rounded-sm py-2 text-sm underline-offset-8 hover:underline"
    >
      {label}
    </Link>
  );
}
