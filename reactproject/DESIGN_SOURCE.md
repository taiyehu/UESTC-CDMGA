# Visual / motion source reference

Source: https://www.cho-kaguyahime.com/ (HTML/CSS/JS pulled locally under `ref/kaguyahime/`, not committed).

Inspected source files:

- `index.html`
- `assets/css/common.css`
- `assets/css/top.css?1202`
- `assets/js/incparts.js`
- `assets/js/jquery.common.js?1105`
- `assets/js/jquery.top.js?0108`

Extracted design language:

- Pastel accent set: `#f5babf` pink, `#cbc4f8` lavender, `#6ccfee` blue, `#ffe48f` gold
- Slow floating card motion (`floating-x` / `floating-y`, 2.6–8s)
- Spotlight/fog layers and soft radial highlights
- Thin edge lines, large quiet surfaces, centered stage-like hero

Applied in `src/styles/kaguyahime-motion.css`:

- pastel tokens
- floating side cards
- page fade-in (opacity only; no layout transform)
- gradient page headings
- pastel border/button accents
- `prefers-reduced-motion` fallback

Bingo 5×5 grid and its content surfaces are intentionally excluded from floating/transform effects.
