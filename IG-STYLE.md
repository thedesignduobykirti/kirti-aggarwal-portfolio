# IG style: shared rules for every section (Oct 13 rebuild)

The site now looks like Kirti's own Instagram posts (brand "the Design Dux", handle @the.designduoo).
Concept frames to match: `../concepts/ig-style/01-hero.png` … `08-findme-footer.png`. Her real post for reference:
`/Users/tanishqaggarwal/.t3codex/userdata/attachments/ea5e3936-af24-4435-88ca-580cc06b9b45-e90193e0-ab6d-4fa5-8936-f2e0fb9e507c.png`

## Already built (in `css/ig.css` + `ig.js`, do NOT edit those two files)
- Page background: grey paper wall + drifting window-light shadow (fixed, behind everything). Sections are transparent by default.
- Tokens: `--ig-text` (off-white type), `--ig-text-soft`, `--ig-line`, `--ig-magenta #e0177a`, `--ig-denim #1f3a5f`, `--ig-card` (white), `--ig-card-text`, `--ig-card-soft`, `--ig-ease`.
- Type: General Sans only. `.t-thin` (300) for the first line, `.t-heavy` (700, tight) for the key word. NO serif, NO italics anywhere.
- Heading pattern: `<h2 class="ig-h"><span class="t-thin">Hand me any part of the</span> <span class="fig-box t-heavy">brief.</span></h2>`
- `.fig-box`: Figma selection box (outline + 8 handles). It draws itself when `.is-in` is added (ig.js does this on scroll for every `.fig-box` and `.brush` present at load; call `KA.igReveal(container)` after injecting new ones).
- `.brush` wrapper + `<img>`: `assets/ig/brush-magenta.webp` (diagonal swoosh), `assets/ig/brush-denim.webp` (horizontal swoosh). Position absolutely; they wipe on (`.rtl` for right-to-left).
- `.ig-note`: Instagram notification card: `<span class="ig-note"><b>@studio</b> <span class="ig-msg">can you start Monday?</span><span class="ig-time">Now</span></span>`. `.is-far` = blurred background card.
- `.ig-ic` icons: `heart`, `heart on`, `comment`, `send`, `save`, `verified` (e.g. `<i class="ig-ic send"></i>`), coloured by `color`/background.
- `.ig-btn` white pill button (`.ig-play` magenta play dot inside), `.ig-btn.magenta`.
- Logo: `assets/ig/logo-badge.png` (denim circle badge), `assets/ig/logo-mark.svg` (white logotype; best used as a CSS mask: `-webkit-mask:url(assets/ig/logo-mark.svg) center/contain no-repeat; background:#fff`).
- Nav is done (logo + name left, links right). Old variables `--cocoa/--cream/--pop` now map to the new look so old CSS doesn't break, but restyle your section fully.

## Rules
- Contrast: white type on the grey wall; dark type only on white cards. Body text ≥ 15px, ≥ 4.5:1.
- Motion: GSAP 3.13 + ScrollTrigger + Lenis (`KA.lenis`). GSAP owns `transform` AND folds CSS `translate`/`rotate` into it on elements it animates, so put extra offsets/tilts on an inner wrapper GSAP never touches. Respect `prefers-reduced-motion`. No live `filter: blur()` on big moving layers. `will-change` only while animating.
- Copy: plain words, sentence case, no em dashes. Keep `[bracket]` placeholders for unconfirmed facts.
- Prefix every new class with your lane prefix and grep `style.css` + `css/*.css` before naming (old collisions: `.hl`, `.next`, `.head`, `.cur`, `.tool`).
- Work only in your files. Small `Edit` calls on `index.html`, only inside your section's block (other agents edit other blocks at the same time; re-read on failure; never rewrite the whole file).
- Site is served at http://localhost:5288 (don't start another server).
- QA with Playwright from your own temp folder: `mkdir -p /tmp/<lane>qa && cd /tmp/<lane>qa && echo '{"type":"module"}' > package.json && ln -sfn ~/.npm/_npx/2334a3ea0ef73d73/node_modules node_modules`, then `chromium.launch({channel:'chrome'})`. (The topperly-sims Playwright hangs: iCloud.) Check 1440x900 and 390x844, zero console errors, no horizontal overflow. Save screenshots to `../qa/ig-<lane>-*.png`. Delete temp scripts.
- Do not deploy, do not git commit.
