// Credentials: her ID badge hangs from a lanyard (verlet rope, drag to swing it) and her
// qualifications are stamped onto a passport one by one once it's on screen. Once every
// stamp has landed the badge's seal turns green: verified. Tools run as a slow logo strip.
(() => {
  const section = document.querySelector(".cr");
  if (!section || !window.gsap) return;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const zone = section.querySelector(".cr-badge-zone");
  const badge = section.querySelector(".badge");
  const ropeA = section.querySelector(".cr-rope-a");
  const ropeB = section.querySelector(".cr-rope-b");
  const stamps = [...section.querySelectorAll(".stamp")];
  const passport = section.querySelector(".passport");

  // ---------- lanyard: a verlet rope with the badge as a heavy end point ----------
  const N = 14;
  let pts = [], seg = 20, anchor = { x: 0, y: 0 }, bw = 260, zw = 0, zh = 0;
  function layout() {
    zw = zone.clientWidth; zh = zone.clientHeight;
    bw = badge.offsetWidth;
    // the lanyard hangs from a pin inside its own section: it never reaches up into the section above
    anchor = { x: zw * 0.5, y: 14 };
    const ropeLen = Math.max(110, zh - badge.offsetHeight - 150); // room for the stretch, so the badge never hangs onto the heading
    seg = ropeLen / N;
  }
  // always start hanging straight down, at rest: nothing to settle, so nothing jitters
  function reset() {
    layout();
    pts = [];
    for (let i = 0; i <= N; i++) {
      const x = anchor.x, y = anchor.y + i * seg;
      pts.push({ x, y, px: x, py: y });
    }
    // let gravity take up the rope's tiny stretch off-screen, then zero the velocity,
    // so the first visible frames don't sag by a pixel or two
    const g = grab; grab = null;
    for (let s = 0; s < 120; s++) step();
    pts.forEach((p) => { p.px = p.x; p.py = p.y; });
    grab = g;
  }
  // one sideways push, more at the badge end than near the hook: a single gentle swing
  function push(v) {
    for (let i = 1; i <= N; i++) pts[i].px = pts[i].x - v * (i / N);
  }

  let grab = null;
  const G = 0.55;
  function step() {
    for (let i = 1; i <= N; i++) {
      const p = pts[i];
      const vx = (p.x - p.px) * 0.978, vy = (p.y - p.py) * 0.978;
      p.px = p.x; p.py = p.y;
      p.x += vx; p.y += vy + G;
    }
    if (grab) {
      // you can pull it around, but never further than the lanyard reaches or above the hook
      const e = pts[N], max = seg * N;
      let dx = grab.x - anchor.x, dy = Math.max(grab.y - anchor.y, seg * N * 0.25);
      const d = Math.hypot(dx, dy);
      if (d > max) { dx *= max / d; dy *= max / d; }
      e.x = anchor.x + dx; e.y = anchor.y + dy;
    }
    const e0 = pts[N];
    if (e0.y < anchor.y + seg * N * 0.2) e0.y = anchor.y + seg * N * 0.2;
    for (let k = 0; k < 16; k++) {
      pts[0].x = anchor.x; pts[0].y = anchor.y;
      for (let i = 0; i < N; i++) {
        const a = pts[i], b = pts[i + 1];
        const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 0.001;
        const diff = (d - seg) / d;
        // the anchor doesn't move; the badge end is heavy, so the rope gives way first
        const wa = i === 0 ? 0 : 1, wb = i + 1 === N ? (grab ? 0 : 0.35) : 1;
        const s = diff / (wa + wb || 1);
        a.x += dx * s * wa; a.y += dy * s * wa;
        b.x -= dx * s * wb; b.y -= dy * s * wb;
      }
    }
  }
  // rounded to 0.1px so a rope at rest writes identical values every frame
  const r1 = (n) => Math.round(n * 10) / 10;
  // the pin the lanyard hangs from
  const pinDot = (() => {
    const svg = ropeA.ownerSVGElement, NS = "http://www.w3.org/2000/svg";
    const g = document.createElementNS(NS, "g");
    g.innerHTML = '<circle r="11" fill="#0b2147"/><circle r="5" fill="#dbe8fb"/>';
    svg.appendChild(g);
    return g;
  })();
  function draw() {
    pinDot.setAttribute("transform", `translate(${anchor.x},${anchor.y})`);
    let d = `M${r1(pts[0].x)},${r1(pts[0].y)}`;
    for (let i = 1; i < N; i++) {
      const mx = (pts[i].x + pts[i + 1].x) / 2, my = (pts[i].y + pts[i + 1].y) / 2;
      d += ` Q${r1(pts[i].x)},${r1(pts[i].y)} ${r1(mx)},${r1(my)}`;
    }
    d += ` L${r1(pts[N].x)},${r1(pts[N].y)}`;
    ropeA.setAttribute("d", d);
    ropeB.setAttribute("d", d);
    const e = pts[N], f = pts[N - 2];
    const ang = Math.atan2(e.y - f.y, e.x - f.x) - Math.PI / 2;
    badge.style.transform = `translate3d(${r1(e.x - bw / 2)}px, ${r1(e.y - 6)}px, 0) rotate(${Math.round(ang * 1e4) / 1e4}rad)`;
  }

  reset();
  draw();

  if (!reduce) {
    let running = false, visible = false, swung = false, last = 0;
    const loop = (t) => {
      if (!visible) { running = false; return; }
      // fixed-step physics so it behaves the same at 60 Hz and 120 Hz
      const steps = Math.min(4, Math.max(1, Math.round((t - (last || t - 16.7)) / 16.7)));
      last = t;
      for (let s = 0; s < steps; s++) step();
      draw();
      requestAnimationFrame(loop);
    };
    new IntersectionObserver(([en]) => {
      visible = en.isIntersecting;
      if (visible && !running) { running = true; last = 0; requestAnimationFrame(loop); }
    }, { rootMargin: "100px" }).observe(section);
    // the swing plays once, when a good part of the badge is actually on screen
    const swingIO = new IntersectionObserver(([en]) => {
      if (!en.isIntersecting || swung) return;
      swung = true; swingIO.disconnect();
      push(2.4);
    }, { threshold: 0.35 });
    swingIO.observe(zone);

    // drag the badge
    const local = (ev) => { const r = zone.getBoundingClientRect(); return { x: ev.clientX - r.left, y: ev.clientY - r.top - 8 }; };
    badge.addEventListener("pointerdown", (ev) => {
      badge.setPointerCapture(ev.pointerId);
      grab = local(ev);
    });
    badge.addEventListener("pointermove", (ev) => { if (grab) grab = local(ev); });
    const release = () => { grab = null; };
    badge.addEventListener("pointerup", release);
    badge.addEventListener("pointercancel", release);
  }

  // resize: only rebuild when the zone really changed size (phone URL bars fire resize too),
  // and rebuild straight at rest instead of stretching a live rope
  let rz;
  addEventListener("resize", () => {
    clearTimeout(rz);
    rz = setTimeout(() => {
      if (zone.clientWidth === zw && zone.clientHeight === zh && badge.offsetWidth === bw) return;
      grab = null; reset(); draw();
    }, 120);
  });

  // ---------- tools: a slow, seamless logo strip ----------
  const marquee = section.querySelector(".cr-marquee");
  const track = section.querySelector(".cr-track");
  if (marquee && track) {
    const originals = [...track.children];
    let clones = [];
    function buildStrip() {
      clones.forEach((c) => c.remove());
      clones = [];
      marquee.classList.remove("is-running");
      const view = marquee.clientWidth;
      if (!view) return;
      const addSet = () => originals.forEach((li) => {
        const k = li.cloneNode(true);
        k.setAttribute("aria-hidden", "true");
        clones.push(k);
        track.appendChild(k);
      });
      // lay out in one row, add one copy, and measure the exact (subpixel) distance from
      // the first chip to its copy: that is how far one loop travels
      marquee.classList.add("is-running");
      track.style.animation = "none";
      addSet();
      const setW = clones[0].getBoundingClientRect().left - originals[0].getBoundingClientRect().left;
      // enough copies that the strip never shows a hole: view + one set to scroll through
      const copies = Math.max(2, Math.ceil(view / setW) + 1);
      for (let c = 2; c < copies; c++) addSet();
      track.style.animation = "";
      track.style.setProperty("--cr-set", `${setW.toFixed(2)}px`);
      track.style.setProperty("--cr-dur", `${(setW / 34).toFixed(2)}s`); // ~34px a second
    }
    if (!reduce) {
      const ready = document.fonts ? document.fonts.ready : Promise.resolve();
      ready.then(buildStrip);
      let mw = 0;
      new ResizeObserver(([en]) => {
        const w = Math.round(en.contentRect.width);
        if (w === mw) return;
        mw = w;
        buildStrip();
      }).observe(marquee);
    }
  }

  // ---------- stamps: slam in one by one once the passport is on screen ----------
  let landed = 0;
  const seal = badge.querySelector(".badge-seal i");
  function setVerified(jolt) {
    const all = landed === stamps.length;
    badge.classList.toggle("verified", all);
    gsap.to(seal, { "--tick": all ? 1 : 0, duration: all ? 0.5 : 0.2, ease: all ? "expo.out" : "power2.out" });
    // a small nudge on the badge when it gets verified
    if (all && jolt && !reduce && !grab) pts[N].px -= 1.6;
  }
  function slam(st) {
    st.classList.add("inked");
    gsap.fromTo(st, { scale: 2.1, opacity: 0 }, { scale: 1, opacity: 0.92, duration: 0.26, ease: "power4.in", overwrite: true,
      onComplete: () => {
        // shake via CSS vars on the `translate` property, so it never fights the passport's entrance transform
        gsap.fromTo(passport, { "--cr-sx": "0px", "--cr-sy": "0px" }, { keyframes: [
          { "--cr-sx": "-3px", "--cr-sy": "2px", duration: 0.04 },
          { "--cr-sx": "2px", "--cr-sy": "-1px", duration: 0.05 },
          { "--cr-sx": "0px", "--cr-sy": "0px", duration: 0.08 },
        ], overwrite: true });
        gsap.fromTo(st, { scale: 0.97 }, { scale: 1, duration: 0.3, ease: "power2.out" });
      } });
  }

  if (reduce || !window.ScrollTrigger) {
    stamps.forEach((s) => s.classList.add("inked"));
    landed = stamps.length; setVerified(false);
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  gsap.from(section.querySelectorAll(".w5"), {
    yPercent: 110, duration: 1.1, ease: "expo.out", stagger: 0.08,
    scrollTrigger: { trigger: section.querySelector(".cr-title"), start: "top 85%" },
  });
  gsap.from(passport, { y: 50, rotate: -2, opacity: 0, duration: 1.1, ease: "expo.out", scrollTrigger: { trigger: passport, start: "top 92%" } });
  gsap.from(section.querySelector(".cr-tools"), { y: 18, opacity: 0, duration: 0.8, ease: "expo.out", scrollTrigger: { trigger: section.querySelector(".cr-tools"), start: "top 94%" } });

  // a timed sequence, not scrubbed: ~0.35s apart, then the seal goes green
  const GAP = 0.35;
  const seq = gsap.timeline({ paused: true });
  stamps.forEach((s, i) => seq.call(() => { slam(s); landed = i + 1; setVerified(i === stamps.length - 1); }, null, 0.15 + i * GAP));

  function clearStamps() {
    seq.pause(0);
    stamps.forEach((s) => { gsap.killTweensOf(s); s.classList.remove("inked"); gsap.set(s, { opacity: 0, scale: 1 }); });
    landed = 0; setVerified(false);
  }

  ScrollTrigger.create({
    trigger: passport,
    // phones stack the passport tall, so wait until more of it is up on screen
    start: () => (innerWidth <= 900 ? "top 55%" : "top 62%"),
    onEnter: () => { if (!seq.isActive() && seq.progress() === 0) seq.play(0); },
  });
  // replay only after the whole section has dropped back below the fold
  ScrollTrigger.create({ trigger: section, start: "top bottom", onLeaveBack: clearStamps });
})();
