// "How a project runs": one paper object, six moments, driven by scroll.
// brief card -> folds into an envelope -> "65% PAID" stamp slams down -> unfolds into the
// draft artboard -> red-pen review gets two ticks -> folds into a box, the files burst out.
(() => {
  const sec = document.querySelector(".mo");
  if (!sec || !window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s) => sec.querySelector(s);
  const $$ = (s) => [...sec.querySelectorAll(s)];

  const world = $(".mo-world"), tilt = $(".mo-tilt"), float = $(".mo-float"), obj = $(".mo-obj");
  const floor = $(".mo-floor"), stamp = $(".mo-stamp"), brief = $(".mo-brief"), poster = $(".mo-poster");
  const crease = $(".mo-crease"), print = $(".mo-print"), tag = $(".mo-tag");
  const ink = $(".mo-ink");
  obj.appendChild(ink); // the ink sits on top of the closed envelope, not inside one flap
  const F = { t: $(".f-t"), b: $(".f-b"), l: $(".f-l"), r: $(".f-r") };
  const C = { l: $(".fc-l"), r: $(".fc-r"), b: $(".fc-b"), t: $(".fc-t"), k: $(".fc-k") };
  const steps = $$(".mo-step"), lines = $$(".mo-line"), prog = $$(".mo-prog li"), cta = $(".mo-cta");

  // ---------- fit the 1000 x 700 world to the screen ----------
  function fit() {
    const vw = innerWidth, vh = innerHeight, mob = vw <= 900;
    const k = mob ? Math.min(vw * 0.98 / 790, vh * 0.6 / 600) : Math.min(vw * 0.64 / 800, vh * 0.86 / 600, 1.4);
    sec.style.setProperty("--k", k.toFixed(3));
    sec.style.setProperty("--wx", mob ? "50%" : "65%");
    sec.style.setProperty("--wy", mob ? "35%" : "50%");
  }
  fit();
  addEventListener("resize", fit);

  // ---------- pieces created in code ----------
  const specks = $(".mo-specks");
  for (let i = 0; i < 16; i++) specks.appendChild(document.createElement("i"));
  const burst = $(".mo-burst");
  const cols = ["#f2b6a6", "#fff3e2", "#8fb0e8", "#e0705f", "#ffd27a"];
  for (let i = 0; i < 34; i++) {
    const c = document.createElement("span");
    c.className = "cf";
    c.style.background = cols[i % cols.length];
    burst.appendChild(c);
  }
  // fixed pseudo-random so scrubbing back and forth always looks the same
  let seed = 7;
  const rnd = (a, b) => { seed = (seed * 16807) % 2147483647; return a + ((seed - 1) / 2147483646) * (b - a); };

  // ---------- starting state ----------
  gsap.set(obj, { rotationX: 16, rotationY: -20, rotationZ: -4 });
  gsap.set(F.t, { transformOrigin: "50% 0%", z: 4, rotationX: 100 });
  gsap.set(F.b, { transformOrigin: "50% 100%", z: 3, rotationX: -100 });
  gsap.set(F.l, { transformOrigin: "0% 50%", z: 2, rotationY: -100 });
  gsap.set(F.r, { transformOrigin: "100% 50%", z: 2, rotationY: 100 });
  gsap.set(ink, { z: 6, xPercent: -50, yPercent: -50, rotation: -8, left: "50%", top: "50%", translate: "none" });
  gsap.set(tag, { z: 5, rotation: -70, transformOrigin: "0% 0%" });
  gsap.set(C.l, { transformOrigin: "100% 50%" });
  gsap.set(C.r, { transformOrigin: "0% 50%" });
  gsap.set(C.b, { transformOrigin: "50% 0%" });
  gsap.set(C.t, { transformOrigin: "50% 100%" });
  gsap.set(C.k, { z: -300, rotationY: 180 });
  gsap.set(steps[0], { opacity: 1 });
  gsap.set(lines[0], { opacity: 1 });
  const pieces = $$(".mo-poster > *:not(.mo-p-head):not(.mo-p-list)");
  const words = $$(".mo-p-head span");
  const pens = $$(".mo-pen path");
  const ticks = $$(".mo-note .tick path");
  [...pens, ...ticks].forEach((p) => { const L = p.getTotalLength(); p.style.strokeDasharray = L; p.style.strokeDashoffset = L; });

  if (reduce) {
    // one calm frame: the finished draft, and every step listed
    sec.classList.add("mo-static");
    gsap.set([brief], { opacity: 0 });
    gsap.set(obj, { width: 760, height: 470, rotationX: 6, rotationY: -10, rotationZ: 0 });
    gsap.set([poster, crease], { opacity: 1 });
    steps.forEach((s) => gsap.set(s, { opacity: 1, position: "static" }));
    lines.forEach((s) => gsap.set(s, { opacity: 1, position: "static" }));
    gsap.set(cta, { opacity: 1 });
    cta.classList.add("on");
    return;
  }

  // ---------- the copy changes with each scene ----------
  const tl = gsap.timeline({ defaults: { ease: "power2.inOut" } });
  function stepTo(i, at) {
    tl.to([steps[i - 1], lines[i - 1]], { opacity: 0, y: -26, duration: 0.25, ease: "power2.in" }, at)
      .fromTo([steps[i], lines[i]], { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.35, ease: "power3.out" }, at + 0.2);
  }
  const fill = (i, a, b) => tl.fromTo(prog[i], { "--f": 0 }, { "--f": 1, duration: b - a, ease: "none" }, a);

  // 1. the brief: a moment to read it
  fill(0, 0, 1);

  // 2. it folds itself into an envelope, a quote tag swings on
  stepTo(1, 1.1);
  tl.to(obj, { rotationX: 8, rotationY: 14, rotationZ: 2, duration: 1.3 }, 1.0)
    .to(F.l, { rotationY: 0, duration: 0.6 }, 1.0).to(F.l, { opacity: 1, duration: 0.15, ease: "none" }, 1.0)
    .to(F.r, { rotationY: 0, duration: 0.6 }, 1.08).to(F.r, { opacity: 1, duration: 0.15, ease: "none" }, 1.08)
    .to(F.b, { rotationX: 0, duration: 0.6 }, 1.35).to(F.b, { opacity: 1, duration: 0.15, ease: "none" }, 1.35)
    .to(F.t, { rotationX: 0, duration: 0.65, ease: "power3.in" }, 1.65).to(F.t, { opacity: 1, duration: 0.15, ease: "none" }, 1.65)
    .to(tag, { opacity: 1, duration: 0.1, ease: "none" }, 2.2)
    .to(tag, { rotation: 0, duration: 0.6, ease: "elastic.out(1, 0.35)" }, 2.2)
    .set(brief, { opacity: 0 }, 2.3);
  fill(1, 1, 2.8);

  // 3. the stamp slams down: ink, specks, a jolt
  stepTo(2, 2.8);
  tl.set(stamp, { opacity: 1 }, 2.85)
    .fromTo(stamp, { y: -560, rotation: -18 }, { y: 0, rotation: -4, duration: 0.42, ease: "power4.in" }, 2.85)
    .fromTo(stamp, { scaleY: 1 }, { scaleY: 0.93, duration: 0.05, ease: "none", transformOrigin: "50% 100%" }, 3.27)
    .to(stamp, { scaleY: 1, duration: 0.12, ease: "power2.out" }, 3.32)
    .fromTo(ink, { opacity: 0, scale: 1.35 }, { opacity: 0.95, scale: 1, duration: 0.1, ease: "power4.out" }, 3.27)
    .fromTo(float, { x: 0, y: 0 }, { keyframes: [{ x: -9, y: 7, duration: 0.04 }, { x: 7, y: -4, duration: 0.05 }, { x: -3, y: 2, duration: 0.05 }, { x: 0, y: 0, duration: 0.07 }], ease: "none" }, 3.27)
    .to(stamp, { y: -620, rotation: 14, duration: 0.5, ease: "power3.in" }, 3.55)
    .set(stamp, { opacity: 0 }, 4.06);
  [...specks.children].forEach((s, i) => {
    const a = (i / 16) * Math.PI * 2 + rnd(-0.2, 0.2), r = rnd(120, 260);
    tl.fromTo(s, { x: 0, y: 0, opacity: 0, scale: rnd(0.6, 1.6) },
      { x: Math.cos(a) * r, y: Math.sin(a) * r * 0.7 + 40, opacity: 0, duration: 0.5, ease: "power3.out",
        keyframes: { opacity: [0, 1, 1, 0] } }, 3.27);
  });
  fill(2, 2.8, 4.2);

  // 4. it opens out into the first draft, and the design flies into place
  stepTo(3, 4.25);
  tl.to(tag, { opacity: 0, rotation: 50, duration: 0.25 }, 4.2)
    .to(ink, { opacity: 0, y: -60, duration: 0.3 }, 4.2)
    .to(F.t, { rotationX: 100, duration: 0.5, ease: "power2.in" }, 4.2).to(F.t, { opacity: 0, duration: 0.15 }, 4.55)
    .to(F.b, { rotationX: -100, duration: 0.5, ease: "power2.in" }, 4.35).to(F.b, { opacity: 0, duration: 0.15 }, 4.7)
    .to([F.l, F.r], { rotationY: (i) => (i ? 100 : -100), duration: 0.5, ease: "power2.in" }, 4.45).to([F.l, F.r], { opacity: 0, duration: 0.15 }, 4.8)
    .to(obj, { width: 760, height: 470, rotationX: 6, rotationY: -10, rotationZ: 0, duration: 0.7, ease: "power3.inOut" }, 4.75)
    .to(floor, { scaleX: 1.7, duration: 0.7 }, 4.75)
    .to(poster, { opacity: 1, duration: 0.01 }, 5.05)
    .to(crease, { opacity: 1, duration: 0.3 }, 5.2);
  pieces.forEach((p, i) => {
    tl.from(p, { x: rnd(-520, 520), y: rnd(-380, 380), rotation: rnd(-120, 120), scale: 0.3, opacity: 0, duration: 0.7, ease: "back.out(1.3)" }, 5.1 + i * 0.07);
  });
  tl.from(words, { y: 50, opacity: 0, duration: 0.45, ease: "power3.out", stagger: 0.07 }, 5.25);
  fill(3, 4.2, 6.3);

  // 5. review: red pen, two notes, both ticked off
  stepTo(4, 6.35);
  tl.to(pens[0], { strokeDashoffset: 0, duration: 0.4, ease: "power1.inOut" }, 6.4)
    .to(pens[1], { strokeDashoffset: 0, duration: 0.4, ease: "power1.inOut" }, 6.6)
    .to(pens[2], { strokeDashoffset: 0, duration: 0.2, ease: "power1.inOut" }, 6.9)
    .fromTo(".mo-note.n1", { y: -80, rotation: -24, opacity: 0 }, { y: 0, rotation: -4, opacity: 1, duration: 0.35, ease: "back.out(2)" }, 6.8)
    .fromTo(".mo-note.n2", { y: -80, rotation: 22, opacity: 0 }, { y: 0, rotation: 5, opacity: 1, duration: 0.35, ease: "back.out(2)" }, 7.0)
    .to(ticks[0], { strokeDashoffset: 0, duration: 0.2, ease: "power2.out" }, 7.45)
    .to(ticks[1], { strokeDashoffset: 0, duration: 0.2, ease: "power2.out" }, 7.7);
  fill(4, 6.3, 8.1);

  // 6. it folds into a box, the lid pops, the files burst out
  stepTo(5, 8.2);
  tl.to([".mo-note", ".mo-pen"], { opacity: 0, duration: 0.2 }, 8.1)
    .to([poster, crease], { opacity: 0, duration: 0.3 }, 8.2)
    .to(print, { opacity: 1, duration: 0.3 }, 8.5)
    .to(obj, { width: 300, height: 300, duration: 0.6, ease: "power3.inOut" }, 8.2)
    .to(floor, { scaleX: 0.9, duration: 0.6 }, 8.2)
    .to(obj, { rotationX: -20, rotationY: 34, rotationZ: 0, duration: 1.0 }, 8.6)
    .to([C.l, C.r, C.b, C.t], { opacity: 1, duration: 0.1, ease: "none" }, 8.82)
    .to(C.l, { rotationY: -90, duration: 0.5 }, 8.9)
    .to(C.r, { rotationY: 90, duration: 0.5 }, 8.95)
    .to(C.b, { rotationX: -90, duration: 0.5 }, 9.0)
    .to(C.k, { opacity: 1, duration: 0.1 }, 9.2)
    .to(C.t, { rotationX: 90, duration: 0.45, ease: "power3.in" }, 9.3)
    // the lid pops off
    .to(C.t, { y: -300, z: 80, rotationX: 220, rotationZ: 30, duration: 0.6, ease: "power2.out" }, 9.95)
    .to(C.t, { opacity: 0, duration: 0.2 }, 10.35);
  $$(".mo-file").forEach((f, i) => {
    const a = -Math.PI / 2 + (i - 2.5) * 0.5;
    tl.fromTo(f, { x: 0, y: 40, scale: 0.2, rotation: 0, opacity: 0 },
      { x: Math.cos(a) * rnd(300, 380), y: Math.sin(a) * rnd(110, 150) + 10, scale: 1, rotation: rnd(-18, 18), opacity: 1, duration: 0.65, ease: "back.out(1.6)" }, 10.0 + i * 0.05);
  });
  $$(".mo-burst .cf").forEach((c) => {
    const x = rnd(-420, 420), up = rnd(-330, -160);
    tl.fromTo(c, { x: 0, y: 30, rotation: 0, opacity: 0 },
      { keyframes: [{ x: x * 0.6, y: up, opacity: 1, rotation: rnd(-200, 200), duration: 0.45, ease: "power2.out" },
                    { x, y: up + rnd(220, 380), opacity: 0, rotation: rnd(-400, 400), duration: 0.75, ease: "power1.in" }] }, 10.0 + rnd(0, 0.15));
  });
  tl.to(cta, { opacity: 1, duration: 0.3, onStart: () => cta.classList.add("on"), onReverseComplete: () => cta.classList.remove("on") }, 10.2);
  fill(5, 8.1, 10.6);
  tl.to({}, { duration: 0.6 }, 10.8); // a beat to enjoy it before the page moves on

  ScrollTrigger.create({
    trigger: sec,
    start: "top top",
    end: () => `+=${Math.round(innerHeight * 3.4)}`,
    pin: $(".mo-pin"),
    scrub: 0.8,
    animation: tl,
    invalidateOnRefresh: true,
  });

  // ---------- entrance, idle float and a little pointer tilt ----------
  gsap.fromTo(float, { y: 160, rotationX: 40, opacity: 0 }, { y: 0, rotationX: 0, opacity: 1, ease: "none",
    scrollTrigger: { trigger: sec, start: "top 85%", end: "top 15%", scrub: 0.8 } });
  gsap.from($$(".mo-eyebrow, .mo-title, .mo-lines, .mo-prog"), { y: 40, opacity: 0, stagger: 0.08, duration: 1, ease: "expo.out",
    scrollTrigger: { trigger: sec, start: "top 55%" } });
  const bob = gsap.to(tilt, { y: -12, rotationZ: 1.2, duration: 2.4, ease: "sine.inOut", yoyo: true, repeat: -1 });
  ScrollTrigger.create({ trigger: sec, start: "top bottom", end: "bottom top", onToggle: (s) => (s.isActive ? bob.resume() : bob.pause()) });
  if (matchMedia("(hover: hover)").matches) {
    const rx = gsap.quickTo(world.querySelector(".mo-tilt"), "rotationY", { duration: 0.8, ease: "power3.out" });
    const ry = gsap.quickTo(world.querySelector(".mo-tilt"), "rotationX", { duration: 0.8, ease: "power3.out" });
    sec.addEventListener("pointermove", (e) => { rx((e.clientX / innerWidth - 0.5) * 14); ry(-(e.clientY / innerHeight - 0.5) * 10); });
    sec.addEventListener("pointerleave", () => { rx(0); ry(0); });
  }
})();
