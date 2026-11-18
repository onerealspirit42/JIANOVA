import { notFound } from "next/navigation";

/**
 * Catch-all: any path under a language that has no real page lands here and
 * renders the localized 404 page (../not-found.tsx) with a 404 status.
 */
export default function CatchAll() {
  notFound();
}
