// Scroll dive: the hero copy lifts away and the camera flies at her right eye. Her pupil
// grows into a black ball that swallows the screen, and the reel fades in on the black
// with the heading and proof line around it.
// One pinned scene, driven by a single progress value so every layer stays aligned.
(() => {
  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hero = document.querySelector(".hero");
  const zoom = document.querySelector(".zoom");
  const rig = document.querySelector(".rig");
  const eyeR = document.querySelector('.avatar .eye[data-eye="r"]');
  const irisR = eyeR.querySelector(".iris");
  const win = document.querySelector(".window");
  const video = win.querySelector("video");
  const bigplay = win.querySelector(".bigplay");
  const controls = win.querySelector(".controls");
  const sound = win.querySelector(".sound");
  const head = document.querySelector(".reel-head");
  const proof = document.querySelector(".proof");
  const reelBtn = document.querySelector("[data-reel]");

  window.KA = window.KA || {};
  KA.diving = false;

  // ---------- smooth scroll ----------
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9 });
    KA.lenis = lenis;
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  // ---------- helpers ----------
  const clamp = (v) => Math.min(1, Math.max(0, v));
  const seg = (p, a, b) => clamp((p - a) / (b - a));
  const lerp = (a, b, t) => a + (b - a) * t;
  const inOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const out = (t) => 1 - Math.pow(1 - t, 3);

  // eye position and size at rest (no zoom, no head sway)
  const E = { x: 0, y: 0 };
  let d0 = 100, B = innerHeight, vw = innerWidth, vh = innerHeight;
  const avatar = document.querySelector(".avatar");
  function measure() {
    const zt = zoom.style.transform, rt = rig.style.transform;
    zoom.style.transform = "none";
    rig.style.transform = "none";
    const r = eyeR.getBoundingClientRect();
    const hr = hero.getBoundingClientRect();
    E.x = r.left + r.width / 2 - hr.left;
    E.y = r.top + r.height / 2 - hr.top;
    d0 = r.width;                                        // iris diameter at rest
    // the crop line just under her lower lashes: the dive never shows anything below it (no nose)
    { const ar = avatar.getBoundingClientRect(); B = ar.top + ar.height * 0.835 - hr.top; }
    vw = hero.clientWidth;
    vh = hero.clientHeight;
    zoom.style.transform = zt;
    rig.style.transform = rt;
  }

  // Keep the zoomed avatar sharp without re-drawing it every frame: the GPU layer is
  // re-rasterised only when the zoom passes the next step (toggling will-change makes
  // Chrome draw it fresh at the current scale, once).
  const STEPS = [1, 1.6, 2.5, 4, 6, 8];
  let rasterStep = 0;
  function rasterFor(z) {
    let k = 0;
    while (k < STEPS.length - 1 && STEPS[k] < z * 0.9) k++;
    if (k === rasterStep) return;
    rasterStep = k;
    zoom.style.willChange = "auto";
    requestAnimationFrame(() => { if (KA.diving) zoom.style.willChange = "transform"; });
  }

  // ---------- render one frame of the dive from progress p (0..1) ----------
  // 0-0.40  the camera flies at her right eye while her pupil widens
  // 0.36-0.58  the pupil becomes a black ball that swallows the screen
  // 0.60-0.76  the reel fades in on the black, then the heading and proof
  const player = win.querySelector(".player");
  let userPaused = false;
  let wasDiving = false;
  let dark = false;
  function setDark(v) {
    if (v === dark) return;
    dark = v;
    hero.classList.toggle("dark", v);
    document.body.classList.toggle("is-dark", v);
  }
  function render(p) {
    KA.diving = p > 0.002;
    if (KA.diving !== wasDiving) {
      wasDiving = KA.diving;
      rasterStep = 0;
      zoom.style.willChange = KA.diving ? "transform" : "auto";
      if (!KA.diving) zoom.style.transform = "none";
    }
    if (!KA.diving) {
      hero.style.setProperty("--out", "0");
      zoom.style.visibility = "visible";
      win.style.visibility = "hidden";
      head.style.opacity = proof.style.opacity = "0";
      KA.bgPaused = false;
      setDark(false);
      irisR.style.removeProperty("--pupil");
      if (!video.paused) video.pause();
      return;
    }

    // 1. hero copy lifts away
    hero.style.setProperty("--out", out(seg(p, 0, 0.14)).toFixed(4));

    // 2. fly at the right eye: exponential zoom reads as constant camera speed
    const Dend = Math.min(vw, vh) * 0.5;                  // iris diameter when the approach settles
    const b = seg(p, 0.36, 0.58);
    const fly = 1 + 1.4 * Math.pow(b, 2);                 // keep falling in while the ball grows
    const z = Math.pow(Dend / d0, inOut(seg(p, 0, 0.42))) * fly;
    const m = inOut(seg(p, 0, 0.4));
    // the eye drifts to the centre, but the cut-off bottom of the image never comes into view
    const Q = { x: lerp(E.x, vw / 2, m), y: Math.max(lerp(E.y, vh / 2, m), vh - z * (B - E.y) + 2) };
    zoom.style.transform = `translate3d(${Q.x - z * E.x}px, ${Q.y - z * E.y}px, 0) scale(${z})`;
    rasterFor(Math.min(z, 6));
    const covered = b >= 1;
    zoom.style.visibility = covered ? "hidden" : "visible";
    KA.bgPaused = covered;
    setDark(b > 0.85);

    // 3. her pupil widens, then a black ball grows out of it until it fills the screen
    const pf = 0.68 + 0.17 * inOut(seg(p, 0.16, 0.4));
    irisR.style.setProperty("--pupil", `${(pf * 100).toFixed(2)}%`);
    const pupilD = z * d0 * pf * 0.62;                    // the solid core of the soft CSS pupil
    const cover = 2 * Math.hypot(Math.max(Q.x, vw - Q.x), Math.max(Q.y, vh - Q.y)) + 4;
    const eb = b * b * (3 - 2 * b);
    if (p < 0.355) {
      win.style.visibility = "hidden";
    } else if (!covered) {
      const D = lerp(pupilD, cover, eb * eb);
      win.style.visibility = "visible";
      win.style.width = win.style.height = `${D}px`;
      win.style.borderRadius = "50%";
      win.style.transform = `translate3d(${Q.x - D / 2}px, ${Q.y - D / 2}px, 0)`;
    } else {
      win.style.visibility = "visible";
      win.style.width = `${vw}px`;
      win.style.height = `${vh}px`;
      win.style.borderRadius = "0";
      win.style.transform = "translate3d(0, 0, 0)";
    }

    // 4. the reel fades in on the black, then the words around it
    const Wp = vw <= 720 ? vw * 0.92 : Math.min(vw * 0.785, ((vh * 0.62) * 16) / 9);
    const Hp = (Wp * 9) / 16;
    const P = { x: vw / 2, y: vh * 0.5 };
    const f = out(seg(p, 0.6, 0.76));
    const pr = player.style;
    pr.left = `${P.x - Wp / 2}px`;
    pr.top = `${P.y - Hp / 2}px`;
    pr.width = `${Wp}px`;
    pr.height = `${Hp}px`;
    pr.opacity = f.toFixed(4);
    pr.transform = `scale(${(0.94 + 0.06 * f).toFixed(4)})`;
    pr.filter = f < 1 ? `brightness(${(0.4 + 0.6 * f).toFixed(3)})` : "none";
    bigplay.style.opacity = (1 - seg(p, 0.7, 0.8)).toFixed(4);
    const ui = seg(p, 0.8, 0.9);
    controls.style.opacity = ui;
    sound.style.opacity = ui;
    controls.style.pointerEvents = sound.style.pointerEvents = ui > 0.5 ? "auto" : "none";

    const t = out(seg(p, 0.72, 0.88));
    head.style.setProperty("--top", `${P.y - Hp / 2 - head.offsetHeight - Math.max(18, vh * 0.03)}px`);
    proof.style.setProperty("--ptop", `${P.y + Hp / 2 + Math.max(20, vh * 0.035)}px`);
    head.style.opacity = proof.style.opacity = t.toFixed(4);
    head.style.transform = proof.style.transform = `translateY(${(1 - t) * 24}px)`;

    // the reel only plays once it's on screen
    if (p > 0.6 && video.paused && !userPaused) video.play().catch(() => {});
    if (p < 0.57 && !video.paused) video.pause();
  }

  const st = ScrollTrigger.create({
    trigger: hero,
    start: "top top",
    end: () => `+=${Math.round(innerHeight * 2.6)}`,
    pin: true,
    scrub: true,
    invalidateOnRefresh: true,
    onUpdate: (self) => render(self.progress),
    onRefresh: (self) => { if (self.progress < 0.002) measure(); render(self.progress); },
  });

  // the top bar gets a backing once the pinned dive is over and normal content scrolls under it
  const nav = document.querySelector(".nav");
  const onScroll = () => nav.classList.toggle("solid", scrollY > st.end - 4);
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // the hero's reel button rides the dive all the way to the player
  reelBtn?.addEventListener("click", () => {
    const y = st.start + (st.end - st.start) * 0.97;
    if (lenis) lenis.scrollTo(y, { duration: 2.6, easing: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2) });
    else scrollTo({ top: y, behavior: reduce ? "auto" : "smooth" });
  });

  // ---------- player controls ----------
  const playBtn = controls.querySelector(".c-play");
  const time = controls.querySelector(".c-time");
  const bar = controls.querySelector(".c-bar i");
  const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  function togglePlay() {
    if (video.paused) { userPaused = false; video.play(); } else { userPaused = true; video.pause(); }
  }
  playBtn.addEventListener("click", togglePlay);
  video.addEventListener("click", togglePlay);
  video.addEventListener("play", () => { playBtn.classList.remove("paused"); playBtn.setAttribute("aria-label", "Pause"); });
  video.addEventListener("pause", () => { playBtn.classList.add("paused"); playBtn.setAttribute("aria-label", "Play"); });
  video.addEventListener("timeupdate", () => {
    if (!video.duration) return;
    time.textContent = `${fmt(video.currentTime)} / ${fmt(video.duration)}`;
    bar.style.width = `${(video.currentTime / video.duration) * 100}%`;
  });
  controls.querySelector(".c-full").addEventListener("click", () => {
    (video.requestFullscreen || video.webkitEnterFullscreen)?.call(video);
  });
  sound.addEventListener("click", () => {
    video.muted = !video.muted;
    sound.setAttribute("aria-pressed", String(!video.muted));
    sound.querySelector(".sound-label").textContent = video.muted ? "Sound on" : "Sound off";
  });

  // re-measure once the intro has settled the avatar into place
  addEventListener("load", () => setTimeout(() => ScrollTrigger.refresh(), 2300));
})();
