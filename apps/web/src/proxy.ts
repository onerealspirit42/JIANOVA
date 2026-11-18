import { NextResponse, type NextRequest } from "next/server";

const locales = ["en", "ar"];
const defaultLocale = "en";

/**
 * Pick a supported language from the browser's Accept-Language header,
 * e.g. "ar-SA,ar;q=0.9,en;q=0.8" -> "ar". Falls back to English.
 */
function getLocale(request: NextRequest): string {
  const header = request.headers.get("accept-language") ?? "";

  const ranked = header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const qParam = params.find((p) => p.trim().startsWith("q="));
      return {
        tag: tag.trim().toLowerCase(),
        quality: qParam ? parseFloat(qParam.trim().slice(2)) : 1,
      };
    })
    .filter((item) => item.tag && item.quality > 0)
    .sort((a, b) => b.quality - a.quality);

  for (const { tag } of ranked) {
    const base = tag.split("-")[0];
    if (locales.includes(base)) return base;
  }
  return defaultLocale;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const hasLocale = locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );
  if (hasLocale) return;

  request.nextUrl.pathname = `/${getLocale(request)}${pathname}`;
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  // Skip Next.js internals and any path that looks like a file (has a dot).
  matcher: ["/((?!_next|.*\\..*).*)"],
};
