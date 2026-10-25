// Selected work (v2).
// Desktop: the section pins and the heading plus every card ride one rail that slides
// sideways with the scroll. The rail follows the scroll through a soft lerp (no snapping),
// and it can be dragged with the mouse or pushed with a sideways trackpad swipe.
// Phones, short screens and reduced motion: a native swipe row with scroll-snap.
// Filter chips hide cards by data-cat; every card opens a project view.
(() => {
  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  const section = document.querySelector(".work");
  if (!section) return;
  const pin = section.querySelector(".work-pin");
  const rail = section.querySelector(".wk-rail");
  const side = section.querySelector(".work-side");
  const track = section.querySelector(".track");
  const cards = [...section.querySelectorAll(".card")];
  const imgs = cards.map((c) => c.querySelector(".card-media img"));
  const now = section.querySelector(".work-count .now");
  const totalEl = section.querySelector(".wk-total");
  const bar = section.querySelector(".work-progress i");
  const prev = section.querySelector(".wn-prev");
  const next = section.querySelector(".wn-next");
  const title = section.querySelector(".work-title");
  const chips = [...section.querySelectorAll(".wk-chip")];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const lenis = () => (window.KA && KA.lenis) || null;

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const pad = (k) => String(k).padStart(2, "0");
  const easeOut = (t) => 1 - Math.pow(1 - t, 4);

  let visible = cards.slice(); // cards that pass the current filter
  let viewOpen = false;

  // ---------- card data (read once from the markup) ----------
  const data = cards.map((card) => {
    const h3 = card.querySelector("h3");
    const facts = {};
    card.querySelectorAll(".card-cap dl > div").forEach((d) => {
      facts[d.querySelector("dt").textContent.trim().toLowerCase()] = d.querySelector("dd").textContent.trim();
    });
    return {
      name: h3.firstChild.textContent.trim(),
      kind: h3.querySelector("span")?.textContent.trim() || "",
      src: imgs[cards.indexOf(card)].currentSrc || imgs[cards.indexOf(card)].src,
      alt: imgs[cards.indexOf(card)].alt,
      role: card.dataset.role || "[Her role]",
      cats: (card.dataset.cat || "").split(/\s+/).filter(Boolean),
      ...facts,
    };
  });

  // the picture is the button that opens the project view
  cards.forEach((card, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "wk-open";
    b.setAttribute("aria-label", `Open project: ${data[i].name}, ${data[i].kind}`);
    b.innerHTML = '<span class="wk-pill" aria-hidden="true">View project</span>';
    card.querySelector(".card-media").appendChild(b);
  });

  // ---------- heading reveal ----------
  if (!reduce) {
    gsap.from(title.querySelectorAll(".w3"), {
      yPercent: 110, duration: 1.1, ease: "expo.out", stagger: 0.08,
      scrollTrigger: { trigger: section, start: "top 75%" },
    });
  }

  // ---------- counter + progress (shared) ----------
  let shown = -1;
  function setCount(k) {
    k = clamp(k, 0, visible.length - 1);
    if (k === shown) return;
    const up = k > shown;
    shown = k;
    now.textContent = pad(k + 1);
    if (!reduce) gsap.fromTo(now, { yPercent: up ? 60 : -60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.45, ease: "expo.out", overwrite: true });
    prev.disabled = k === 0;
    next.disabled = k === visible.length - 1;
  }
  const setBar = (p) => gsap.set(bar, { scaleX: gsap.utils.interpolate(1 / visible.length, 1, clamp(p, 0, 1)) });

  // mode hooks, filled in by whichever layout is active
  const mode = { go: () => {}, after: () => {}, index: () => 0, active: () => false };

  // ---------- desktop: pinned rail ----------
  const mm = gsap.matchMedia();
  mm.add("(min-width: 900px) and (min-height: 560px) and (prefers-reduced-motion: no-preference)", () => {
    section.classList.add("wk-pinned");
    const setX = gsap.quickSetter(rail, "x", "px");
    const drift = imgs.map((img) => gsap.quickSetter(img, "xPercent"));
    gsap.set(imgs, { scale: 1.14 });

    let travel = 0, centres = [], cur = 0, dragging = false;
    function measure() {
      travel = Math.max(0, rail.offsetWidth - innerWidth);
      centres = cards.map((c) => track.offsetLeft + c.offsetLeft + c.offsetWidth / 2);
    }

    const st = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: () => { measure(); return `+=${Math.max(1, Math.round(travel))}`; },
      pin,
      invalidateOnRefresh: true,
      onRefresh: (self) => { measure(); cur = self.progress; paint(); },
    });

    function paint() {
      const x = -cur * travel;
      setX(x);
      const vw = innerWidth;
      visible.forEach((c) => {
        const i = cards.indexOf(c);
        // the picture slides a little against the motion, like looking through a window
        drift[i](clamp((centres[i] + x - vw / 2) / vw, -1, 1) * -6);
      });
      const m = visible.length;
      setCount(m > 1 ? Math.round(cur * (m - 1)) : 0);
      setBar(cur);
    }

    // the rail eases toward the scroll position every frame: the "scrub", without snapping
    const tick = () => {
      const target = st.progress;
      const d = target - cur;
      if (Math.abs(d * travel) < 0.1) {
        if (cur === target) return;
        cur = target;
      } else {
        const k = dragging ? 0.3 : 0.11;
        cur += d * (1 - Math.pow(1 - k, gsap.ticker.deltaRatio(60)));
      }
      paint();
    };
    gsap.ticker.add(tick);

    const scrollFor = (p) => st.start + clamp(p, 0, 1) * (st.end - st.start);
    function go(k) {
      const m = visible.length;
      k = clamp(k, 0, m - 1);
      const y = scrollFor(m > 1 ? k / (m - 1) : 0);
      const l = lenis();
      if (l) l.scrollTo(y, { duration: 1.1, easing: easeOut });
      else scrollTo({ top: y, behavior: "smooth" });
    }

    // cards glide in from the right as the section arrives
    gsap.from(cards, {
      x: () => innerWidth * 0.18, opacity: 0, duration: 1.3, ease: "expo.out", stagger: 0.07,
      scrollTrigger: { trigger: section, start: "top 70%" },
    });

    // ---- mouse drag with a throw ----
    let pid = null, sx = 0, sy0 = 0, moved = false, vx = 0, lx = 0, lt = 0, suppress = false;
    const onDown = (e) => {
      if (e.pointerType !== "mouse" || e.button !== 0 || !lenis() || !st.isActive || viewOpen) return;
      pid = e.pointerId; sx = lx = e.clientX; lt = performance.now(); vx = 0; moved = false;
      sy0 = lenis().targetScroll;
    };
    const onMove = (e) => {
      if (e.pointerId !== pid) return;
      const dx = e.clientX - sx;
      if (!moved) {
        if (Math.abs(dx) < 6) return;
        moved = dragging = true;
        section.classList.add("wk-dragging");
        getSelection()?.removeAllRanges();
      }
      const t = performance.now(), dt = Math.max(1, t - lt);
      vx = vx * 0.6 + ((e.clientX - lx) / dt) * 0.4; // px per ms, lightly smoothed
      lx = e.clientX; lt = t;
      lenis().scrollTo(clamp(sy0 - dx, st.start, st.end), { immediate: true, force: true });
    };
    const onUp = (e) => {
      if (e.pointerId !== pid) return;
      pid = null;
      if (!moved) return;
      suppress = true;
      section.classList.remove("wk-dragging");
      const l = lenis();
      const from = l.targetScroll;
      const fresh = performance.now() - lt < 80; // a pause before letting go means no throw
      const to = clamp(from - (fresh ? vx * 380 : 0), st.start, st.end);
      l.scrollTo(to, { duration: clamp(Math.abs(to - from) / 900, 0.5, 1.2), easing: easeOut, onComplete: () => (dragging = false) });
      setTimeout(() => (dragging = false), 1300);
    };
    const onClickCapture = (e) => { if (suppress) { e.stopPropagation(); e.preventDefault(); suppress = false; } };
    rail.addEventListener("pointerdown", onDown);
    addEventListener("pointermove", onMove);
    addEventListener("pointerup", onUp);
    addEventListener("pointercancel", onUp);
    rail.addEventListener("click", onClickCapture, true);

    // ---- sideways trackpad swipes move the rail too ----
    const onWheel = (e) => {
      const l = lenis();
      if (!l || !st.isActive || viewOpen) return;
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      e.lenisStopPropagation = true; // tell Lenis this one is handled
      l.scrollTo(clamp(l.targetScroll + e.deltaX, st.start, st.end), { programmatic: false });
    };
    section.addEventListener("wheel", onWheel, { passive: false });

    // tabbing to a card brings it into view (and stops the browser scrolling the clipped pin)
    const onFocus = (e) => {
      pin.scrollLeft = 0;
      const c = e.target.closest(".card");
      if (c && e.target.matches(":focus-visible")) go(visible.indexOf(c));
    };
    pin.addEventListener("focusin", onFocus);

    Object.assign(mode, {
      go,
      index: () => shown,
      active: () => st.isActive,
      after: (fadeSide) => {
        ScrollTrigger.refresh();
        const l = lenis();
        if (st.isActive || scrollY > st.start + 2) {
          if (l) l.scrollTo(st.start, { immediate: true, force: true });
          else scrollTo(0, st.start);
        }
        cur = 0; shown = -1; paint();
        if (fadeSide) gsap.to(side, { opacity: 1, duration: 0.5, ease: "power2.out" });
      },
    });

    return () => {
      section.classList.remove("wk-pinned", "wk-dragging");
      gsap.ticker.remove(tick);
      rail.removeEventListener("pointerdown", onDown);
      removeEventListener("pointermove", onMove);
      removeEventListener("pointerup", onUp);
      removeEventListener("pointercancel", onUp);
      rail.removeEventListener("click", onClickCapture, true);
      section.removeEventListener("wheel", onWheel);
      pin.removeEventListener("focusin", onFocus);
      gsap.set([rail, ...imgs], { clearProps: "transform" });
      Object.assign(mode, { go: rowGo, index: rowIndex, active: rowActive, after: rowAfter });
      shown = -1; syncRow();
    };
  });

  // ---------- phones: native swipe row ----------
  const stepW = () => (visible[1] ? visible[1].offsetLeft - visible[0].offsetLeft : visible[0].offsetWidth + 16);
  const rowIndex = () => clamp(Math.round(track.scrollLeft / stepW()), 0, visible.length - 1);
  function syncRow() {
    if (section.classList.contains("wk-pinned")) return;
    const max = track.scrollWidth - track.clientWidth;
    const p = max > 0 ? track.scrollLeft / max : 0;
    setCount(p > 0.98 ? visible.length - 1 : rowIndex());
    setBar(p);
  }
  function rowGo(k) {
    k = clamp(k, 0, visible.length - 1);
    track.scrollTo({ left: visible[k].offsetLeft - visible[0].offsetLeft, behavior: reduce ? "auto" : "smooth" });
  }
  const rowActive = () => {
    const r = section.getBoundingClientRect();
    return r.top < innerHeight * 0.5 && r.bottom > innerHeight * 0.5;
  };
  const rowAfter = () => { track.scrollLeft = 0; shown = -1; syncRow(); };
  if (!section.classList.contains("wk-pinned")) Object.assign(mode, { go: rowGo, index: rowIndex, active: rowActive, after: rowAfter });
  track.addEventListener("scroll", syncRow, { passive: true });
  syncRow();

  // ---------- arrows + keys ----------
  prev.addEventListener("click", () => mode.go(shown - 1));
  next.addEventListener("click", () => mode.go(shown + 1));
  addEventListener("keydown", (e) => {
    if (viewOpen || e.defaultPrevented || e.target.closest?.("input, textarea, select, [contenteditable]")) return;
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    if (!mode.active()) return;
    e.preventDefault();
    mode.go(shown + (e.key === "ArrowRight" ? 1 : -1));
  });

  // ---------- filters ----------
  let filtering = null;
  function applyFilter(f) {
    const keep = cards.filter((c) => f === "all" || (c.dataset.cat || "").split(/\s+/).includes(f));
    if (!keep.length) return;
    chips.forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.f === f)));
    filtering?.kill();
    const pinned = section.classList.contains("wk-pinned");
    const leaving = cards.filter((c) => !c.classList.contains("wk-gone"));
    // on desktop the heading slides with the rail; fade it too if the jump back will move it
    const fadeSide = pinned && Math.abs(gsap.getProperty(rail, "x")) > 4;
    const tl = gsap.timeline();
    filtering = tl;
    if (reduce) {
      tl.add(swap);
    } else {
      tl.to(leaving, { opacity: 0, scale: 0.94, y: 12, duration: 0.26, ease: "power2.in", stagger: 0.02, overwrite: "auto" });
      if (fadeSide) tl.to(side, { opacity: 0, duration: 0.26, ease: "power2.in" }, 0);
      tl.add(swap);
      tl.fromTo(keep, { opacity: 0, scale: 0.94, y: 18 }, { opacity: 1, scale: 1, y: 0, duration: 0.7, ease: "expo.out", stagger: 0.06, clearProps: "opacity,scale,y" });
    }
    function swap() {
      cards.forEach((c) => c.classList.toggle("wk-gone", !keep.includes(c)));
      visible = keep;
      totalEl.textContent = pad(keep.length);
      mode.after(fadeSide);
    }
  }
  chips.forEach((chip) => chip.addEventListener("click", () => {
    if (chip.getAttribute("aria-pressed") === "true") return;
    applyFilter(chip.dataset.f);
  }));

  // ---------- project view ----------
  const view = document.createElement("div");
  view.className = "wk-view";
  view.hidden = true;
  view.innerHTML = `
    <div class="wk-scrim" data-close></div>
    <div class="wk-panel" role="dialog" aria-modal="true" aria-labelledby="wk-name" data-lenis-prevent>
      <button class="wk-close" type="button" aria-label="Close project" data-close></button>
      <div class="wk-media">
        <div class="wk-big"><img alt=""></div>
        <div class="wk-thumbs">
          <span class="wk-thumb wk-t1"><img alt=""></span>
          <span class="wk-thumb">[Frame 2]</span>
          <span class="wk-thumb">[Clip, 0:15]</span>
        </div>
      </div>
      <div class="wk-info">
        <p class="wk-kick"></p>
        <h3 class="wk-name" id="wk-name"></h3>
        <p class="wk-kind"></p>
        <dl class="wk-facts"></dl>
        <div class="wk-tags"></div>
        <div class="wk-step">
          <button type="button" class="wk-prev"><small>Previous</small><b></b></button>
          <button type="button" class="wk-next"><small>Next</small><b></b></button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(view);
  const $v = (s) => view.querySelector(s);
  const panel = $v(".wk-panel");
  const big = $v(".wk-big img");
  const t1 = $v(".wk-t1 img");
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  let at = 0, lastFocus = null;

  function fill(card) {
    const d = data[cards.indexOf(card)];
    const pos = visible.indexOf(card);
    const m = visible.length;
    $v(".wk-kick").textContent = `Project ${pad(pos + 1)} of ${pad(m)}`;
    $v(".wk-name").textContent = d.name;
    $v(".wk-kind").textContent = d.kind;
    big.src = t1.src = d.src;
    big.alt = d.alt;
    const rows = [
      ["Client", d.name],
      ["Via", d.via || "[Agency]"],
      ["The brief", d.brief || "[One line on the brief]"],
      ["My role", d.role],
      ["Made", d.made || "[Deliverables]"],
      ["Turnaround", d.turnaround || "[Time]"],
    ];
    $v(".wk-facts").innerHTML = rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join("");
    $v(".wk-tags").innerHTML = [...d.cats.map(cap), "[Tool]"].map((t) => `<span>${esc(t)}</span>`).join("");
    const p = visible[(pos - 1 + m) % m], n = visible[(pos + 1) % m];
    $v(".wk-prev b").textContent = data[cards.indexOf(p)].name;
    $v(".wk-next b").textContent = data[cards.indexOf(n)].name;
    $v(".wk-step").style.display = m > 1 ? "" : "none";
    panel.scrollTop = 0;
  }

  function openView(card, opener) {
    at = visible.indexOf(card);
    if (at < 0) return;
    lastFocus = opener || document.activeElement;
    fill(card);
    view.hidden = false;
    viewOpen = true;
    const l = lenis();
    if (l) l.stop(); else document.documentElement.classList.add("wk-lock");
    if (!reduce) {
      gsap.fromTo($v(".wk-scrim"), { opacity: 0 }, { opacity: 1, duration: 0.4, ease: "power2.out" });
      gsap.fromTo(panel, { y: 48, opacity: 0, scale: 0.98 }, { y: 0, opacity: 1, scale: 1, duration: 0.7, ease: "expo.out" });
      gsap.fromTo($v(".wk-big"), { scale: 1.04 }, { scale: 1, duration: 1, ease: "expo.out" });
    }
    $v(".wk-close").focus({ preventScroll: true });
  }

  function closeView() {
    if (!viewOpen) return;
    viewOpen = false;
    const done = () => {
      view.hidden = true;
      const l = lenis();
      if (l) l.start(); else document.documentElement.classList.remove("wk-lock");
      lastFocus?.focus?.({ preventScroll: true });
    };
    if (reduce) return done();
    gsap.to($v(".wk-scrim"), { opacity: 0, duration: 0.3, ease: "power2.in" });
    gsap.to(panel, { y: 30, opacity: 0, duration: 0.3, ease: "power2.in", onComplete: done });
  }

  function step(dir) {
    const m = visible.length;
    at = (at + dir + m) % m;
    const card = visible[at];
    lastFocus = card.querySelector(".wk-open");
    if (reduce) return fill(card);
    gsap.timeline()
      .to([$v(".wk-media"), $v(".wk-info")], { opacity: 0, x: -24 * dir, duration: 0.18, ease: "power2.in" })
      .add(() => fill(card))
      .fromTo([$v(".wk-media"), $v(".wk-info")], { opacity: 0, x: 28 * dir }, { opacity: 1, x: 0, duration: 0.5, ease: "expo.out", stagger: 0.04 });
  }

  section.addEventListener("click", (e) => {
    const b = e.target.closest(".wk-open");
    if (b) openView(b.closest(".card"), b);
  });
  view.addEventListener("click", (e) => {
    if (e.target.closest("[data-close]")) closeView();
    else if (e.target.closest(".wk-prev")) step(-1);
    else if (e.target.closest(".wk-next")) step(1);
  });
  view.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { e.preventDefault(); closeView(); return; }
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") { e.preventDefault(); step(e.key === "ArrowRight" ? 1 : -1); return; }
    if (e.key !== "Tab") return;
    // keep focus inside the dialog
    const f = [...panel.querySelectorAll("button")].filter((b) => b.offsetParent !== null);
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    else if (!panel.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
  });
})();
