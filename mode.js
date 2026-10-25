// light / dark switch: remembers the visitor's choice, else follows their device
(() => {
  const root = document.documentElement;
  const btn = document.querySelector(".mode-tg");
  const label = () => btn && btn.setAttribute("aria-label", root.dataset.theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
  label();
  const flip = () => {
    root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
    try { localStorage.setItem("ka-theme", root.dataset.theme); } catch (e) {}
    label();
  };
  btn?.addEventListener("click", () => {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    // a circle of the new theme grows out of the switch and covers the page
    if (document.startViewTransition && !reduce) {
      const r = btn.getBoundingClientRect();
      const x = r.left + r.width / 2, y = r.top + r.height / 2;
      const end = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
      document.startViewTransition(flip).ready.then(() => {
        root.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${end}px at ${x}px ${y}px)`] },
          { duration: 750, easing: "cubic-bezier(.7, 0, .2, 1)", pseudoElement: "::view-transition-new(root)" }
        );
      }).catch(() => {});
      return;
    }
    root.classList.add("mode-anim");
    flip();
    setTimeout(() => root.classList.remove("mode-anim"), 600);
  });
  // follow the device if the visitor never picked one
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
    let saved = null; try { saved = localStorage.getItem("ka-theme"); } catch (x) {}
    if (!saved) { root.dataset.theme = e.matches ? "dark" : "light"; label(); }
  });
})();
