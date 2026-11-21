/*
  word-highlight - one statement's words turn from grey to ink, word by word, as the statement crosses
  the middle of the screen. Scrubbed to the scrollbar (it runs back when the visitor scrolls up); a
  <strong> word turns to the accent instead of the ink. For the one statement a page stands on, 12 to
  40 words, on its own ground or beside one picture.

    <section class="section" data-moment="word-highlight">
      <div class="container"><p class="mo-wh__text">Give tasks to <strong>Relay</strong> like a teammate …</p></div>
    </section>

  opts: from 0.85 (the statement's top at this share of the screen's height turns the first word),
        to 0.45 (its bottom at this share turns the last).
  Reduced motion, no script: the whole statement in ink. It runs on a phone too (one paragraph's
  colours, no layout, no pin).
*/
export const phone = true;
export default function (root, opts, lib) {
  const text = root.matches('p, h2, h3, blockquote') ? root : (root.querySelector('.mo-wh__text') || [...root.querySelectorAll('p, h2, h3, blockquote')].find(p => !p.matches('.t-label, .t-small, .muted')));
  if (!text) return {};
  root.classList.add('mo-wh');
  const words = lib.split(text, 'words').map(i => i.parentElement);
  if (lib.reduced()) { words.forEach(w => w.classList.add('is-on')); root.classList.add('is-done'); return {}; }
  const from = opts.from ?? 0.85, to = opts.to ?? 0.45;
  // JIANOVA: opts.pin holds the statement in the middle of the screen (jianova.css, "statement held")
  // while the section scrolls past, and the words light while it holds. The held block is the
  // statement itself, not a screen round it, so when it lets go the next section follows it at
  // once: its height (--idea-h) sets where it holds and how tall the section is.
  const pin = opts.pin === true;
  const box = pin ? (root.querySelector(':scope > .wrap') || text.parentElement) : null;
  let held = { h: 0, top: 0 };
  const fit = () => {
    root.style.setProperty('--idea-h', `${box.offsetHeight}px`);
    held = { h: box.offsetHeight, top: parseFloat(getComputedStyle(box).top) || 0 };
  };
  let ro = null;
  if (pin) {
    root.classList.add('is-pinned');
    fit();
    ro = new ResizeObserver(fit);
    ro.observe(box);
    addEventListener('resize', fit);
  }
  let n = -1;
  const s = lib.scrub(pin ? root : text, (p, r) => {
    const vh = innerHeight, start = vh * from, end = vh * to;
    // (pinned: the share of the hold gone by, from the moment the statement stops to the moment it lets go)
    const t = pin ? lib.clamp(((held.top - r.top) / Math.max(1, r.height - held.h) - 0.08) / 0.7) : lib.clamp((start - r.top) / Math.max(1, (start - end) + r.height));
    const atEnd = innerHeight + scrollY >= document.documentElement.scrollHeight - 2;   // page bottom: it can climb no further, the statement stands in full ink
    const k = atEnd ? words.length : Math.round(t * words.length);
    if (k === n) return;
    n = k;
    words.forEach((w, i) => w.classList.toggle('is-on', i < k));
  }, { mode: pin ? 'hold' : 'view' });
  return { destroy() { s.destroy(); ro?.disconnect(); removeEventListener('resize', fit); root.style.removeProperty('--idea-h'); } };
}
