# Kirti Aggarwal, portfolio

Portfolio site for Kirti Aggarwal, a freelance graphic and motion designer in New Delhi.

Live: https://kirti-aggarwal.vercel.app

Plain HTML, CSS and JavaScript. GSAP and ScrollTrigger handle the animation, Lenis handles smooth scrolling. There is no build step.

## Run it locally

```bash
npx http-server -p 5288 -c-1
```

Then open http://localhost:5288.

## Light and dark mode

The theme follows the visitor's device until they click the switch in the nav. Their choice is saved in localStorage under `ka-theme`.

## Deploy

```bash
vercel deploy --prod
```

All artwork, photos and the character illustrations belong to Kirti Aggarwal. Please don't reuse them.
