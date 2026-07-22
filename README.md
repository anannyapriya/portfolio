# Anannya P. Neog — Portfolio

🔗 **Live site:** [anannyapriya.github.io/portfolio](https://anannyapriya.github.io/portfolio/)

A dual-themed personal portfolio — a bright, sky-driven "light" side and a
starry "void" side — built from scratch with plain HTML, CSS, and
JavaScript (no frameworks, no build step).

## What's on the site

- **About** — background, research focus, and interests
- **Education** — UC Santa Cruz (M.S. Computer Science & Engineering) and
  SRM Institute of Science and Technology (B.Tech Computer Science &
  Engineering), with relevant coursework
- **Experience** — Graduate Researcher (AI Explainability & Accountability
  Lab, UCSC), Graduate Teaching Assistant, and prior internships in big
  data analytics and web development
- **Projects** — including a hybrid RAG system over California legal
  documents, audio style-transfer and historic audio restoration research,
  and a bidirectional Indian Sign Language translation system
- **Skills** — languages, ML/AI tooling, frontend & backend frameworks,
  big data, and cloud tools
- **Hobbies** — digital art, travel, and music, each with its own page
- **Contact** — a working contact form plus social and email links

## How it's built

- **No frameworks** — hand-written semantic HTML, CSS, and vanilla
  JavaScript throughout
- **Two themes, one codebase** — a light "sky" page and a dark "void" page
  live in the same `index.html`, toggled with an animated pixel-dissolve
  transition
- **Live sky** — the light page's hero renders a real-time canvas sky:
  a day/night gradient driven by the actual clock, a 3D starfield with
  parallax, the moon at its true current phase, drifting clouds, and
  occasional meteors
- **Void particle field** — the dark page renders an animated starfield
  and constellation web on canvas
- **Contact form** — powered by [Formspree](https://formspree.io/)
- **Hosting** — deployed for free on [GitHub Pages](https://pages.github.com/)

## Structure

```
index.html          Main page (light + void sections)
projects-light.html projects.html   Full project listings (light / void)
art-light.html art.html             Digital art (light / void)
travel-light.html travel.html       Travel (light / void)
music-light.html music.html         Music (light / void)
style.css            All styling
script.js            Shared interactivity (transitions, particles, nav)
assets/              Images, resume, and icons
```
