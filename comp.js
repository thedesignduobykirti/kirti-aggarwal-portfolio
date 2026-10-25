// "How we'll work together": the project + payment flow as a motion editor.
// The section pins; scroll moves the playhead. Each of the six layers is one step of a project and
// owns a slice of the timeline. While the playhead is inside a slice, that step's moment plays on
// the stage and the side column shows which step it is. It ends on a summary strip and a CTA.
// The playhead can also be dragged, and the ruler clicked.
(() => {
  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  const section = document.querySelector(".cp");
  if (!section) return;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const $ = (s, r = section) => r.querySelector(s);
  const $$ = (s, r = section) => [...r.querySelectorAll(s)];
  const clamp = (v) => Math.min(1, Math.max(0, v));
  const seg = (p, a, b) => clamp((p - a) / (b - a));
  const lerp = (a, b, t) => a + (b - a) * t;
  const inOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const out = (t) => 1 - Math.pow(1 - t, 3);
  const pad = (n) => String(n).padStart(2, "0");

  const scenes = $$(".cp-sc");
  const rows = $$(".cp-row");
  const marks = $$(".cp-mark");
  const tl = $(".cp-tl");
  const tc = $(".cp-tc");
  const countN = $(".cp-count-n");

  // ---------- timing: six step slices, then the summary ----------
  const W = 0.13;
  const S = rows.map((_, i) => 0.05 + i * W);          // slice starts
  const R = 0.05 + 6 * W;                                // summary starts at 0.83
  rows.forEach((r, i) => {
    r.style.setProperty("--a", Math.max(0.01, S[i] - 0.025).toFixed(3));
    r.style.setProperty("--b", (S[i] + W - 0.012).toFixed(3));
  });
  [...S, R].forEach((at, k) => marks[k] && marks[k].style.setProperty("--at", at.toFixed(3)));

  // ---------- each step's moment, from its local progress t (0..1) ----------
  // every moment is finished by t ~ 0.6 (the middle of its slice), so a quick glance reads the end state
  const pop = (el, k, y = 12) => {
    el.style.opacity = k.toFixed(3);
    el.style.transform = `translateY(${(1 - k) * y}px) scale(${0.94 + 0.06 * k})`;
  };
  const sc = (n) => scenes[n];

  // 1 brief
  const mail = $(".cp-mail", sc(0)), chips = $$(".cp-chip", sc(0)), mailOk = $(".cp-mail-ok", sc(0));
  // 2 quote
  const qCard = $(".cp-quote", sc(1)), qRows = $$(".cp-qrow", sc(1));
  // 3 advance
  const advCard = $(".cp-pay-adv", sc(2)), advFill = $(".cp-payfill", sc(2)), advPct = $(".cp-paypct", sc(2));
  const advOk = $(".cp-pay-ok", sc(2)), advGo = $(".cp-go", sc(2));
  // 4 draft
  const dTrack = $(".cp-dtrack i", sc(3)), dFrame = $(".cp-dframe", sc(3));
  // 5 revisions
  const dots = $$(".cp-dot", sc(4)), notes = $$(".cp-note", sc(4)), oks = $$(".cp-note .cp-ok", sc(4)), round = $(".cp-rv-round b", sc(4));
  // 6 final payment + files
  const finCard = $(".cp-pay-fin", sc(5)), finFill = $(".cp-payfill", sc(5)), finPct = $(".cp-paypct", sc(5));
  const finOk = $(".cp-pay-ok", sc(5)), files = $$(".cp-files span", sc(5));
  // summary
  const sumBar = $(".cp-sum-bar i", sc(6)), sumPct = $(".cp-sum-pct", sc(6)), sumItems = $$(".cp-sum-list li", sc(6)), cta = $(".cp-cta", sc(6));

  const ADV = 0.65; // middle of the [60–70]% advance

  const play = [
    // 1 the brief card arrives, the Drive and Figma links drop in, "received"
    (t) => {
      pop(mail, out(seg(t, 0, 0.15)), 18);
      chips.forEach((c, j) => {
        const k = out(seg(t, 0.12 + j * 0.12, 0.28 + j * 0.12));
        c.style.opacity = k.toFixed(3);
        c.style.transform = `translate(${(1 - k) * -40}px, ${(1 - k) * -26}px) rotate(${(1 - k) * -8}deg)`;
      });
      mailOk.style.opacity = seg(t, 0.42, 0.5).toFixed(3);
    },
    // 2 the quote fills in line by line, total last
    (t) => {
      pop(qCard, out(seg(t, 0, 0.15)), 18);
      qRows.forEach((r, j) => pop(r, out(seg(t, 0.1 + j * 0.08, 0.2 + j * 0.08)), 8));
    },
    // 3 advance: the bar fills into the advance band, the tick lands, work starts
    (t) => {
      pop(advCard, out(seg(t, 0, 0.12)), 18);
      const f = inOut(seg(t, 0.1, 0.4)) * ADV;
      advFill.style.transform = `scaleX(${f.toFixed(4)})`;
      advPct.textContent = Math.round(f * 100);
      pop(advOk, out(seg(t, 0.4, 0.48)), 8);
      pop(advGo, out(seg(t, 0.48, 0.58)), 8);
    },
    // 4 the clock from advance to draft runs forward, the draft frame lands
    (t) => {
      dTrack.style.transform = `scaleX(${inOut(seg(t, 0.02, 0.35)).toFixed(4)})`;
      pop(dFrame, out(seg(t, 0.3, 0.5)), 24);
    },
    // 5 two comments land, both get done, then round two opens
    (t) => {
      dots.forEach((p, j) => { const k = out(seg(t, 0.04 + j * 0.1, 0.12 + j * 0.1)); p.style.transform = `scale(${k})`; });
      notes.forEach((n, j) => pop(n, out(seg(t, 0.06 + j * 0.1, 0.16 + j * 0.1))));
      oks.forEach((o, j) => { o.style.opacity = seg(t, 0.3 + j * 0.1, 0.36 + j * 0.1).toFixed(3); });
      round.textContent = t > 0.78 ? "2" : "1";
    },
    // 6 the balance fills the bar to 100%, "paid in full", then the files go out
    (t) => {
      pop(finCard, out(seg(t, 0, 0.12)), 18);
      const f = lerp(ADV, 1, inOut(seg(t, 0.1, 0.32)));
      finFill.style.transform = `scaleX(${f.toFixed(4)})`;
      finPct.textContent = Math.round(f * 100);
      pop(finOk, out(seg(t, 0.32, 0.4)), 8);
      files.forEach((s, j) => pop(s, out(seg(t, 0.4 + j * 0.05, 0.5 + j * 0.05)), 14));
    },
    // summary: the bar completes, the six steps line up, the button arrives
    (t) => {
      const b = seg(t, 0, 0.35);
      sumBar.style.transform = `scaleX(${b})`;
      sumPct.textContent = `${Math.round(b * 100)}%`;
      sumItems.forEach((li, j) => pop(li, out(seg(t, 0.1 + j * 0.06, 0.3 + j * 0.06)), 10));
      pop(cta, out(seg(t, 0.5, 0.7)), 10);
    },
  ];

  // ---------- one frame of the whole section from progress p ----------
  const windows = [...S.map((s) => [s, s + W]), [R, 1.01]];
  let lastStep = -1;
  function render(p) {
    // timecode: the comp is 30 seconds at 24 fps
    const secs = p * 30;
    tc.textContent = `00:00:${pad(Math.floor(secs))}:${pad(Math.floor((secs % 1) * 24))}`;
    tl.style.setProperty("--ph", p.toFixed(4));

    scenes.forEach((el, i) => {
      const [a, b] = windows[i];
      const fadeIn = i === 0 ? 1 : seg(p, a - 0.005, a + 0.02);
      const fadeOut = i === scenes.length - 1 ? 1 : 1 - seg(p, b - 0.02, b + 0.005);
      const v = Math.min(fadeIn, fadeOut);
      el.style.opacity = v.toFixed(3);
      el.style.visibility = v > 0.01 ? "visible" : "hidden";
      el.style.transform = `translateY(${(1 - fadeIn) * 24 - (1 - fadeOut) * 24}px)`;
      if (v > 0.01) play[i](seg(p, a + 0.01, b - 0.03));
    });

    // side counter: which step is on screen (the summary keeps 06)
    let step = 0;
    S.forEach((s, i) => { if (p >= s - 0.005) step = i; });
    if (step !== lastStep) { countN.textContent = pad(step + 1); lastStep = step; }

    rows.forEach((r, i) => {
      const a = S[i] - 0.025, b = S[i] + W - 0.012;
      const on = p >= S[i] && p < S[i] + W;
      r.classList.toggle("on", on);
      r.style.setProperty("--lit", on ? "1" : p >= b ? ".55" : "0");
      r.style.setProperty("--done", p >= b ? "1" : "0");
      r.querySelector(".k1").classList.toggle("fired", p >= a);
      r.querySelector(".k2").classList.toggle("fired", p >= b);
    });
    let cur = 0;
    marks.forEach((m, k) => { const hit = p >= parseFloat(m.style.getPropertyValue("--at")) - 0.005; m.classList.toggle("hit", hit); if (hit) cur = k; });
    marks.forEach((m, k) => m.classList.toggle("cur", k === cur));
  }

  // ---------- reduced motion: every step in its finished state, stacked ----------
  if (reduce) {
    section.classList.add("static");
    play.forEach((f) => f(1));
    scenes.forEach((s) => (s.style.opacity = 1));
    rows.forEach((r) => { r.style.setProperty("--grow", 1); r.style.setProperty("--done", 1); r.style.setProperty("--lit", ".55"); });
    marks.forEach((m) => m.classList.add("hit"));
    tl.style.setProperty("--ph", 1);
    return;
  }

  render(0);

  const st = ScrollTrigger.create({
    trigger: section,
    start: "top top",
    end: () => `+=${Math.round(innerHeight * 3)}`,
    pin: $(".cp-pin"),
    scrub: true,
    invalidateOnRefresh: true,
    onUpdate: (self) => render(self.progress),
    onRefresh: (self) => render(self.progress),
  });

  // clips draw in once, left to right, as the editor arrives
  gsap.to(rows, {
    "--grow": 1, duration: 0.9, ease: "power3.inOut", stagger: 0.07,
    scrollTrigger: { trigger: section, start: "top 70%" },
  });
  gsap.from(".cp-editor", {
    y: 60, opacity: 0, duration: 1.1, ease: "expo.out",
    scrollTrigger: { trigger: section, start: "top 80%" },
  });

  // ---------- drag the playhead to scrub ----------
  const head = $(".cp-head");
  const track = $(".cp-ruler");
  let dragging = false;
  const scrubTo = (x) => {
    const r = track.getBoundingClientRect();
    const p = clamp((x - r.left) / r.width);
    const y = st.start + p * (st.end - st.start);
    if (window.KA && KA.lenis) KA.lenis.scrollTo(y, { immediate: true });
    else scrollTo(0, y);
  };
  head.addEventListener("pointerdown", (e) => { dragging = true; head.setPointerCapture(e.pointerId); e.preventDefault(); });
  head.addEventListener("pointermove", (e) => { if (dragging) scrubTo(e.clientX); });
  head.addEventListener("pointerup", () => (dragging = false));
  // clicking the ruler jumps the playhead there
  track.addEventListener("click", (e) => scrubTo(e.clientX));
})();
