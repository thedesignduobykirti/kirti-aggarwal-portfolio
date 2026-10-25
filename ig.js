// Shared IG-style behaviour: Figma boxes draw themselves and brush strokes wipe on
// when they scroll into view. Sections can call KA.igReveal(el) for anything added later.
(() => {
  window.KA = window.KA || {};
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add("is-in");
      io.unobserve(e.target);
    });
  }, { rootMargin: "0px 0px -12% 0px", threshold: 0.2 });
  KA.igReveal = (root = document) => {
    root.querySelectorAll(".fig-box:not(.is-in), .brush:not(.is-in)").forEach((el) => {
      if (reduce || el.dataset.manual !== undefined) { if (reduce) el.classList.add("is-in"); return; }
      io.observe(el);
    });
  };
  if (document.readyState === "loading") addEventListener("DOMContentLoaded", () => KA.igReveal());
  else KA.igReveal();
})();
