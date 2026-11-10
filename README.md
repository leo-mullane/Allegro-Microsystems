# Allegro MicroSystems: product discovery prototype

Greyscale, interactive prototype of a product discovery model for allegromicro.com, plus a ClerksWell-branded "Our thinking" page explaining the research and recommendations.

- Build: `node build-includes.js && node validate.js` (outputs to `docs/`)
- Publish: GitHub Pages from `main` / `/docs` (a `.nojekyll` file is written on build)
- Entry point: `docs/index.html`; thinking page: `docs/thinking.html`

Source pages are in `src/`; shared header, footer and prototype navigator in `src/includes/`. Behaviour lives in `src/js/app.js` (vanilla JS) and sample data in `src/js/data.js`. `src/css/theme.css` is intentionally empty (design layer).
