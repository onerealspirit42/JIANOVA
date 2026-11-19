import type { Dictionary, Locale } from "@/app/[lang]/dictionaries";

/**
 * The phone action bar (taste-skill kit): fixed at the foot under 640px with
 * the main action. The kit's system.js shows it once the hero's button has
 * scrolled away and hides it while another copy of the action is on screen;
 * with it, the bar's own button moves into the menu sheet on phones.
 */
export function ActionBar({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  return (
    <nav className="actionbar" aria-label={dict.common.quickActions}>
      <a className="btn btn--primary" href={`/${lang}/customize`}>
        {dict.common.mainAction}
      </a>
    </nav>
  );
}
