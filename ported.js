// Ported Oct 25 from the IG-style build (site-backup-ig/ig.js + close.js), without the Instagram parts:
// Figma boxes draw themselves and brush strokes wipe on, the review cards (arrows, dots, swipe,
// autoplay), the "Find me" card tilt and the footer logotype. process.js runs the process section.
(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const SCOPE = ".ps, .qs, .fm, .ft";

  // ---------- Figma boxes + brushes: add .is-in when they scroll into view ----------
  // (brushes marked data-manual are driven by their own section script)
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add("is-in");
      io.unobserve(e.target);
    });
  }, { rootMargin: "0px 0px -12% 0px", threshold: 0.2 });
  document.querySelectorAll(SCOPE).forEach((sec) => {
    sec.querySelectorAll(".fig-box:not(.is-in), .brush:not(.is-in)").forEach((el) => {
      if (reduce) { el.classList.add("is-in"); return; }
      if (el.dataset.manual !== undefined) return;
      io.observe(el);
    });
  });

  // the footer name builds itself once it's in view (ScrollTrigger below; this observer only if GSAP is missing)
  const wm = document.querySelector(".cl-wm");
  const playLogo = () => wm?.classList.add("is-in");
  if (wm && !reduce) wm.classList.add("is-armed");
  if (wm && !reduce && !(window.gsap && window.ScrollTrigger)) {
    const lo = new IntersectionObserver(([e]) => { if (e.isIntersecting) { playLogo(); lo.disconnect(); } }, { threshold: 0.1 });
    lo.observe(wm);
  }

  if (!window.gsap) return;
  const phone = matchMedia("(max-width: 720px)");
  const ST = window.ScrollTrigger;
  if (ST) gsap.registerPlugin(ST);
  const glide = (y) => {
    const l = window.KA?.lenis;
    if (l) l.scrollTo(y, { duration: Math.min(2.2, 0.8 + Math.abs(y - scrollY) / 5000) });
    else scrollTo({ top: y, behavior: reduce ? "auto" : "smooth" });
  };

  // ---------- reviews: one card in focus, the neighbours tilted and soft behind it ----------
  const rv = document.querySelector(".cl-rv");
  const cards = [...document.querySelectorAll(".cl-rv-card")];
  const dots = [...document.querySelectorAll(".cl-rv-dot")];
  const n = cards.length;
  let qi = 0, timer = null, hovered = false, focused = false, inView = false, started = false;
  const HOLD = 7;
  const paused = () => hovered || focused || !inView;
  // offset of card k from the active one: 0 centre, -1 left, +1 right, beyond that off stage
  const slotOf = (k) => { let o = (k - qi) % n; if (o < 0) o += n; if (o > n / 2) o -= n; return o; };
  function pose(o, card) {
    if (o === 0) return { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1 };
    const s = Math.sign(o), off = Math.abs(o) > 1, mob = phone.matches;
    const w = card.offsetWidth, h = card.offsetHeight;
    const scale = mob ? 0.86 : 0.6;
    return {
      x: s * w * (mob ? 0.93 : 0.62) * (off ? 1.5 : 1),
      // keep the side cards' top edge a little above the active card's
      y: -(h * (1 - scale)) / 2 - (mob ? 8 : 34),
      scale, rotation: s * (mob ? 3 : 5),
      opacity: off ? 0 : mob ? 0.55 : 1,
    };
  }
  let lastSlot = cards.map(slotOf);
  function layout(animate) {
    cards.forEach((c, k) => {
      const o = slotOf(k), was = lastSlot[k], on = o === 0;
      c.classList.toggle("is-on", on);
      c.classList.toggle("is-far", !on);
      c.setAttribute("aria-hidden", String(!on));
      gsap.killTweensOf(c);
      gsap.set(c, { zIndex: on ? 3 : Math.abs(o) > 1 ? 0 : 1 });
      const p = pose(o, c);
      if (!animate || reduce) { gsap.set(c, p); return; }
      if (Math.abs(o - was) > 1) {
        // wrapping from one edge to the other: slip out, come back in from the far side
        gsap.timeline()
          .to(c, { ...pose(2 * Math.sign(was), c), duration: 0.35, ease: "power2.in" })
          .set(c, pose(2 * Math.sign(o), c))
          .to(c, { ...p, duration: 0.8, ease: "expo.out" });
      } else gsap.to(c, { ...p, duration: 0.9, ease: "expo.out" });
    });
    lastSlot = cards.map(slotOf);
  }
  function show(k, first) {
    if (!n) return;
    started = true;
    qi = ((k % n) + n) % n;
    dots.forEach((d, j) => {
      d.classList.toggle("is-on", j === qi);
      d.setAttribute("aria-current", j === qi ? "true" : "false");
      gsap.set(d.querySelector("i"), { scaleX: j < qi ? 1 : 0 });
    });
    if (!first) layout(true);
    runTimer();
  }
  function runTimer() {
    if (timer) timer.kill();
    timer = null;
    if (reduce || !dots[qi]) return;
    timer = gsap.fromTo(dots[qi].querySelector("i"), { scaleX: 0 }, { scaleX: 1, duration: HOLD, ease: "none", paused: paused(),
      onComplete: () => show(qi + 1) });
  }
  const syncTimer = () => { if (timer) paused() ? timer.pause() : timer.resume(); };
  if (rv && n) {
    layout(false);
    rv.classList.add("is-ready");
    dots.forEach((d, k) => d.addEventListener("click", () => show(k)));
    rv.querySelector(".cl-rv-prev")?.addEventListener("click", () => show(qi - 1));
    rv.querySelector(".cl-rv-next")?.addEventListener("click", () => show(qi + 1));
    // tap a card behind to bring it forward
    cards.forEach((c, k) => c.addEventListener("click", () => { if (k !== qi) show(k); }));
    rv.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") { e.preventDefault(); show(qi - 1); }
      else if (e.key === "ArrowRight") { e.preventDefault(); show(qi + 1); }
    });
    rv.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") { hovered = true; syncTimer(); } });
    rv.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") { hovered = false; syncTimer(); } });
    rv.addEventListener("focusin", () => { focused = true; syncTimer(); });
    rv.addEventListener("focusout", (e) => { if (!rv.contains(e.relatedTarget)) { focused = false; syncTimer(); } });

    // swipe on touch: the stage follows the finger a little, then the next card comes forward
    const stage = rv.querySelector(".cl-rv-stage");
    let sx = 0, sy = 0, swiping = false;
    stage.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "mouse") return;
      swiping = true; sx = e.clientX; sy = e.clientY;
    });
    stage.addEventListener("pointermove", (e) => {
      if (!swiping || reduce) return;
      const dx = e.clientX - sx;
      if (Math.abs(dx) > Math.abs(e.clientY - sy)) gsap.set(stage, { x: dx * 0.25 });
    });
    const endSwipe = (e, cancel) => {
      if (!swiping) return;
      swiping = false;
      gsap.to(stage, { x: 0, duration: 0.5, ease: "expo.out" });
      if (cancel) return;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) show(qi + (dx < 0 ? 1 : -1));
    };
    stage.addEventListener("pointerup", (e) => endSwipe(e));
    stage.addEventListener("pointercancel", (e) => endSwipe(e, true));

    let rT = 0;
    addEventListener("resize", () => { clearTimeout(rT); rT = setTimeout(() => layout(false), 150); });
    new IntersectionObserver(([en]) => {
      inView = en.isIntersecting;
      if (inView && !started) show(0, true);
      else syncTimer();
    }, { threshold: 0.35 }).observe(rv);
  }

  // "Back to top" glides instead of jumping
  document.querySelectorAll('.ft a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
    const id = a.getAttribute("href").slice(1);
    const el = id && id !== "top" ? document.getElementById(id) : null;
    if (id && id !== "top" && !el) return;
    e.preventDefault();
    glide(el ? el.getBoundingClientRect().top + scrollY - 20 : 0);
  }));

  // ---------- "Find me" cards: tilt toward the cursor, a soft light follows it ----------
  // (the tilt lives on the inner wrapper; the card itself is what the reveal animates)
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (fine && !reduce) {
    document.querySelectorAll(".cl-fm-card").forEach((card) => {
      const inner = card.querySelector(".cl-fm-in");
      if (!inner) return;
      gsap.set(inner, { transformPerspective: 900 });
      const rx = gsap.quickTo(inner, "rotationX", { duration: 0.6, ease: "power3.out" });
      const ry = gsap.quickTo(inner, "rotationY", { duration: 0.6, ease: "power3.out" });
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        ry((px - 0.5) * 10);
        rx((0.5 - py) * 12);
        inner.style.setProperty("--mx", `${px * 100}%`);
        inner.style.setProperty("--my", `${py * 100}%`);
      });
      card.addEventListener("pointerleave", () => { rx(0); ry(0); });
    });
  }

  // ---------- scroll reveals ----------
  if (ST && !reduce) {
    const on = (trigger, start = "top 82%") => ({ trigger, start, once: true });
    if (document.querySelector(".cl-rv-stage")) {
      gsap.from(".cl-rv-stage", { y: 70, opacity: 0, duration: 1.2, ease: "expo.out", scrollTrigger: on(".cl-rv", "top 85%") });
      // arrows and dots are centred with CSS translate: fade only, then hand the inline styles back
      gsap.from(".cl-rv-arrow, .cl-rv-dots", { opacity: 0, duration: 0.8, delay: 0.3, clearProps: "all", scrollTrigger: on(".cl-rv", "top 85%") });
    }
    if (document.querySelector(".cl-fm-title")) {
      gsap.from(".cl-fm-title .kw", { yPercent: 110, duration: 1.1, ease: "expo.out", stagger: 0.08, scrollTrigger: on(".fm") });
      gsap.from(".cl-fm-card", { y: 70, opacity: 0, rotation: (i) => (i - 1) * 2.5, duration: 1.2, ease: "expo.out", stagger: 0.1, scrollTrigger: on(".cl-fm-grid", "top 90%") });
    }
    if (document.querySelector(".ps-h")) gsap.from(".ps-h .kw", { yPercent: 110, duration: 1.1, ease: "expo.out", stagger: 0.08, scrollTrigger: on(".ps", "top 75%") });
    if (wm) {
      // the logotype rises as the page runs out, then builds itself once it's in view
      gsap.fromTo(wm, { yPercent: 38 }, { yPercent: 0, ease: "none", scrollTrigger: { trigger: ".ft", start: "top bottom", end: "bottom bottom", scrub: 0.6 } });
      ST.create({ trigger: wm, start: "top 92%", once: true, onEnter: playLogo });
    }
  }
})();
