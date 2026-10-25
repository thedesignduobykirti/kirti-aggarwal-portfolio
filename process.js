// "How we'll work together": the six steps play like Instagram stories.
// Desktop: the section pins and scroll drives everything. The active story sits in the middle at
// full size, its bar fills, then the row slides left and the next one comes forward. Each story's
// sticker plays when it becomes active. Click a side story to jump to it.
// Phones: a swipe row. Tap the right side for next, the left third for back, hold to pause;
// the active bar fills on its own and moves on, like IG.
// Reduced motion / no JS: the CSS shows all six, still.
(() => {
  const sec = document.querySelector(".ps");
  if (!sec || !window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  const pin = sec.querySelector(".ps-pin");
  const head = sec.querySelector(".ps-head");
  const reel = sec.querySelector(".ps-reel");
  const stories = [...sec.querySelectorAll(".ps-story")];
  const end = sec.querySelector(".ps-end");
  const N = stories.length;
  const fills = stories.map((s) => [...s.querySelectorAll(".ps-bars b")]);
  const shades = stories.map((s) => s.querySelector(".ps-shade"));
  const titles = stories.map((s) => s.querySelector(".ps-t").textContent.trim());

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const seg = (p, a, b) => clamp((p - a) / (b - a));
  const inOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  // ---------- brushes wipe on as the section arrives ----------
  // (they are data-manual: a brush clipped to zero width never counts as intersecting, so the
  // shared observer in ig.js would never reveal it)
  const brushes = [...sec.querySelectorAll(".brush")];
  ScrollTrigger.create({
    trigger: sec, start: "top 72%", once: true,
    onEnter: () => brushes.forEach((b, i) => setTimeout(() => b.classList.add("is-in"), i * 260)),
  });

  // ---------- the CTA scrolls smoothly to the brief form ----------
  end.querySelector("a").addEventListener("click", (e) => {
    const el = document.getElementById("brief");
    const l = window.KA && KA.lenis;
    if (!el || !l) return;
    e.preventDefault();
    l.scrollTo(el, { duration: 1.4, easing: inOut });
  });

  // ---------- bars: story k shows k-1 full bars, its own bar per the active one ----------
  const barCache = stories.map(() => new Array(N).fill(-1));
  function setBars(a, fill) {
    for (let k = 0; k < N; k++) {
      for (let j = 0; j < N; j++) {
        const v = j < k ? 1 : j > k ? 0 : k < a ? 1 : k > a ? 0 : fill;
        if (Math.abs(barCache[k][j] - v) < 0.002) continue;
        barCache[k][j] = v;
        fills[k][j].style.transform = `scaleX(${v.toFixed(4)})`;
      }
    }
  }
  function clearBars() {
    fills.flat().forEach((b) => (b.style.transform = ""));
    barCache.forEach((r) => r.fill(-1));
  }

  // ---------- one paused sticker timeline per story ----------
  function stickers(card, i) {
    const q = gsap.utils.selector(card);
    const tl = gsap.timeline({ paused: true, defaults: { ease: "back.out(1.8)" } });
    const spark = (sel, at) => tl.fromTo(q(sel + " path"), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.32, stagger: 0.05, ease: "power2.out" }, at);
    switch (i) {
      case 0: // doc lands, link and voice note pop on
        tl.from(q(".ps-doc"), { y: 40, rotation: -14, opacity: 0, duration: 0.7, ease: "power3.out" }, 0)
          .from(q(".ps-doc i"), { scaleX: 0, transformOrigin: "0 50%", duration: 0.4, stagger: 0.06, ease: "power2.out" }, 0.25)
          .from(q(".ps-link"), { scale: 0, rotation: 40, duration: 0.55 }, 0.3)
          .from(q(".ps-mic"), { scale: 0, duration: 0.55, ease: "back.out(2.4)" }, 0.5);
        spark(".ps-k1", 0.65);
        break;
      case 1: // the quote slides in, lines write, the clock spins to 4
        tl.from(q(".ps-quote"), { y: 40, rotation: 6, opacity: 0, duration: 0.7, ease: "power3.out" }, 0)
          .from(q(".ps-quote i"), { scaleX: 0, duration: 0.45, stagger: 0.1, ease: "power2.out" }, 0.3)
          .from(q(".ps-clock"), { scale: 0, rotation: -30, duration: 0.55, ease: "back.out(2.2)" }, 0.45)
          .from(q(".ps-mh"), { rotation: -720, transformOrigin: "50% 100%", duration: 1.1, ease: "power3.out" }, 0.55);
        spark(".ps-k2", 0.75);
        break;
      case 2: { // PAID slaps on: drops in big, squashes, settles, the card jolts
        const st = q(".ps-st")[0];
        tl.fromTo(q(".ps-paid"), { scale: 2.6, rotation: -22, opacity: 0 },
          { keyframes: [
            { scale: 0.88, rotation: 2, opacity: 1, duration: 0.22, ease: "power4.in" },
            { scale: 1.06, rotation: -1, duration: 0.12, ease: "power2.out" },
            { scale: 1, rotation: 0, duration: 0.32, ease: "back.out(3)" },
          ] }, 0.1)
          .fromTo(st, { x: 0, y: 0 }, { keyframes: [{ x: -6, y: 5, duration: 0.05 }, { x: 5, y: -3, duration: 0.06 }, { x: -2, y: 1, duration: 0.06 }, { x: 0, y: 0, duration: 0.08 }], ease: "none" }, 0.32);
        spark(".ps-k3a", 0.34);
        spark(".ps-k3b", 0.36);
        break;
      }
      case 3: // the draft comes up, the tag sticks on, a pen circles it
        tl.from(q(".ps-draft"), { y: 44, rotation: 5, opacity: 0, duration: 0.75, ease: "power3.out" }, 0)
          .from(q(".ps-tag"), { scale: 0, rotation: -40, duration: 0.5, ease: "back.out(2.6)" }, 0.5)
          .fromTo(q(".ps-tag path"), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.7, ease: "power2.inOut" }, 0.75);
        break;
      case 4: // two comments pop in, then each gets ticked
        tl.from(q(".ps-c1"), { y: 26, scale: 0.6, opacity: 0, duration: 0.55 }, 0)
          .from(q(".ps-c2"), { y: 26, scale: 0.6, opacity: 0, duration: 0.55 }, 0.4)
          .from(q(".ps-c1 .ps-ok"), { scale: 0, rotation: -120, duration: 0.45, ease: "back.out(3)" }, 1.05)
          .from(q(".ps-c2 .ps-ok"), { scale: 0, rotation: -120, duration: 0.45, ease: "back.out(3)" }, 1.35);
        spark(".ps-k5", 1.4);
        break;
      case 5: // the files pop out of the middle
        tl.from(q(".ps-file"), { x: (k) => [70, -60, 20][k], y: 50, scale: 0, rotation: 0, duration: 0.6, stagger: 0.12, ease: "back.out(2)" }, 0.1);
        spark(".ps-k6", 0.5);
        break;
    }
    tl.progress(1);
    return tl;
  }

  const mm = gsap.matchMedia();
  const DESK = "(min-width: 761px) and (min-height: 561px)";
  mm.add({ desk: DESK, mob: `not all and ${DESK}`, reduce: "(prefers-reduced-motion: reduce)" }, (ctx) => {
    const { desk, mob, reduce } = ctx.conditions;
    if (desk && !reduce) return desktop();
    if (mob) return phone(reduce);
  });

  // =====================================================================
  // DESKTOP: pinned, scroll-played
  // =====================================================================
  function desktop() {
    sec.classList.add("ps-live");
    const tls = stories.map((s, i) => stickers(s.querySelector(".ps-card"), i));
    const SIDE = 0.8;             // side stories, relative to the active one
    const SPAN = N + 0.25;        // six stories, then a short hold on the last one with the CTA
    const FILL = 0.74;            // share of each story spent filling its bar; the rest is the slide
    let W = 300, gap = 22, over = 0.7;
    const S = { z: 0, p: 0, a: -1 };
    let endOn = false;

    // side stories become buttons that jump to them
    const gos = stories.map((s, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "ps-go";
      b.setAttribute("aria-label", `Play step ${i + 1} of ${N}: ${titles[i]}`);
      b.addEventListener("click", () => jump(i));
      s.querySelector(".ps-card").after(b);
      return b;
    });

    gsap.set(end, { autoAlpha: 0, y: 14 });

    function fit() {
      const vw = innerWidth, vh = innerHeight;
      const top = Math.max(84, Math.round(vh * 0.1));
      sec.style.setProperty("--ps-head", top + "px");
      const hb = top + head.offsetHeight;
      const room = vh - hb - Math.max(28, vh * 0.05) - Math.max(24, vh * 0.04);
      W = Math.round(Math.min(340, (room * 9) / 16, vw * 0.27));
      gap = Math.round(W * 0.075);
      over = Math.min(SIDE, (vw - 64 - (N - 1) * gap) / (N * W));
      sec.style.setProperty("--ps-w", W + "px");
      const h = (W * 16) / 9;
      sec.style.setProperty("--ps-top", Math.round(hb + Math.max(28, vh * 0.05) + (room - h) / 2) + "px");
      render();
    }

    // scroll -> which story, how full its bar, where the row sits
    function state() {
      const pos = S.p * SPAN;
      const a = Math.min(N - 1, Math.floor(pos));
      const local = pos - a;
      const fill = seg(local, 0, FILL);
      const slide = a < N - 1 ? inOut(seg(local, FILL, 1)) : 0;
      const ez = inOut(S.z);
      return { a, fill, c: a + slide + (1 - ez) * 2.5, ez, done: a === N - 1 && local > 0.86 };
    }

    function render() {
      const { a, fill, c, ez, done } = state();
      // sizes: in the overview every story is small; in story mode the one at c is full size
      const sc = stories.map((_, i) => {
        const story = SIDE + (1 - SIDE) * Math.max(0, 1 - Math.abs(i - c));
        return over + (story - over) * ez;
      });
      const X = [];
      let x = 0;
      sc.forEach((s, i) => { const w = W * s; if (i) x += gap; X[i] = x + w / 2; x += w; });
      const f = Math.min(N - 1, Math.floor(c)), t = c - f;
      const T = X[f] + ((X[Math.min(N - 1, f + 1)] ?? X[f]) - X[f]) * t;
      stories.forEach((el, i) => {
        el.style.transform = `translate3d(${(X[i] - T).toFixed(2)}px,0,0) scale(${sc[i].toFixed(4)})`;
        el.style.zIndex = String(10 - Math.round(Math.abs(i - c)));
        shades[i].style.opacity = (Math.min(1, Math.abs(i - c)) * 0.42 * ez).toFixed(3);
      });
      setBars(a, ez > 0.5 ? fill : 0);
      activate(ez > 0.6 ? a : -1);
      if (done !== endOn) {
        endOn = done;
        gsap.to(end, { autoAlpha: done ? 1 : 0, y: done ? 0 : 14, duration: done ? 0.6 : 0.3, ease: done ? "power3.out" : "power2.in", overwrite: true });
      }
    }

    function activate(a) {
      if (a === S.a) return;
      if (S.a >= 0) { tls[S.a].progress(1).pause(); stories[S.a].classList.remove("is-active"); }
      S.a = a;
      if (a >= 0) { stories[a].classList.add("is-active"); tls[a].restart(); }
    }

    // the overview row turns into story 01 as the section reaches the top
    const intro = ScrollTrigger.create({
      trigger: sec, start: "top 78%", end: "top top",
      onUpdate: (s) => { S.z = s.progress; render(); },
      onRefresh: (s) => { S.z = s.progress; },
    });
    const st = ScrollTrigger.create({
      trigger: sec, start: "top top",
      end: () => "+=" + Math.round(innerHeight * 2.4),
      pin, pinSpacing: true, anticipatePin: 1, invalidateOnRefresh: true,
      onUpdate: (s) => { S.p = s.progress; render(); },
      onRefresh: (s) => { S.p = s.progress; },
    });

    function jump(i) {
      const y = st.start + (st.end - st.start) * ((i + 0.03) / SPAN);
      const from = Math.max(0, S.a);
      const l = window.KA && KA.lenis;
      if (l) l.scrollTo(y, { duration: 0.9 + 0.22 * Math.abs(i - from), easing: inOut });
      else scrollTo({ top: y, behavior: "smooth" });
    }

    ScrollTrigger.addEventListener("refreshInit", fit);
    ScrollTrigger.addEventListener("refresh", render);
    fit();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { fit(); ScrollTrigger.refresh(); });

    return () => {
      ScrollTrigger.removeEventListener("refreshInit", fit);
      ScrollTrigger.removeEventListener("refresh", render);
      intro.kill(); st.kill();
      tls.forEach((t) => t.kill());
      gos.forEach((b) => b.remove());
      stories.forEach((el) => { el.style.transform = ""; el.style.zIndex = ""; el.classList.remove("is-active"); });
      shades.forEach((s) => (s.style.opacity = ""));
      clearBars();
      sec.classList.remove("ps-live");
      ["--ps-w", "--ps-top", "--ps-head"].forEach((v) => sec.style.removeProperty(v));
    };
  }

  // =====================================================================
  // PHONES: swipe row, tap zones, auto-progress (still when reduced)
  // =====================================================================
  function phone(still) {
    sec.classList.add("ps-swipe");
    const tls = still ? [] : stories.map((s, i) => stickers(s.querySelector(".ps-card"), i));
    const DUR = 5.5;
    let a = -1, run = null, inView = false, held = false, settle = 0, downAt = 0;

    const step = () => stories[1].offsetLeft - stories[0].offsetLeft;
    const nearest = () => clamp(Math.round(reel.scrollLeft / step()), 0, N - 1);

    function setActive(i) {
      if (i === a) return;
      if (a >= 0) { stories[a].classList.remove("is-active"); tls[a]?.progress(1).pause(); }
      a = i;
      stories[a].classList.add("is-active");
      if (still) return;
      setBars(a, 0);
      tls[a].restart();
      run?.kill();
      run = gsap.fromTo(fills[a][a], { scaleX: 0 }, {
        scaleX: 1, duration: DUR, ease: "none", paused: !inView || held,
        onUpdate() { barCache[a][a] = this.progress(); },
        onComplete: () => { if (a < N - 1) go(a + 1); },
      });
    }

    function go(i) {
      i = clamp(i, 0, N - 1);
      reel.scrollTo({ left: i * step(), behavior: still ? "auto" : "smooth" });
      setActive(i);
    }

    // read the story from the scroll position only once the row stops moving, so a smooth
    // scroll to the next story never flicks back to the one it is leaving
    const onScroll = () => {
      clearTimeout(settle);
      settle = setTimeout(() => setActive(nearest()), 120);
    };
    // tap: a side story jumps to it; on the active one, the left third goes back, the rest goes on
    const onClick = (e) => {
      // releasing a long press only resumes, it does not skip
      if (downAt && performance.now() - downAt > 350) { downAt = 0; return; }
      downAt = 0;
      const li = e.target.closest(".ps-story");
      if (!li) return;
      const i = stories.indexOf(li);
      if (i !== a) return go(i);
      const r = li.getBoundingClientRect();
      go(e.clientX - r.left < r.width / 3 ? a - 1 : a + 1);
    };
    // hold to pause, like IG
    const hold = () => { held = true; downAt = performance.now(); run?.pause(); };
    const release = () => { held = false; if (inView) run?.resume(); };

    reel.addEventListener("scroll", onScroll, { passive: true });
    reel.addEventListener("click", onClick);
    if (!still) {
      reel.addEventListener("pointerdown", hold);
      ["pointerup", "pointercancel", "pointerleave"].forEach((t) => reel.addEventListener(t, release));
    }
    let seen = false;
    const io = new IntersectionObserver(([e]) => {
      inView = e.isIntersecting;
      // the first story's sticker waits until the row is actually on screen
      if (inView && !seen) { seen = true; tls[a]?.restart(); }
      if (!run) return;
      if (inView && !held) run.resume(); else run.pause();
    }, { threshold: 0.55 });
    io.observe(reel);

    a = -1;
    setActive(nearest());

    return () => {
      reel.removeEventListener("scroll", onScroll);
      reel.removeEventListener("click", onClick);
      reel.removeEventListener("pointerdown", hold);
      ["pointerup", "pointercancel", "pointerleave"].forEach((t) => reel.removeEventListener(t, release));
      io.disconnect();
      clearTimeout(settle);
      run?.kill();
      tls.forEach((t) => t.kill());
      stories.forEach((el) => el.classList.remove("is-active"));
      clearBars();
      sec.classList.remove("ps-swipe");
    };
  }
})();
