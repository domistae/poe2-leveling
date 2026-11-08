# CLAUDE.md

A static PoE2 (Path of Exile 2) guide site. **Plain HTML, CSS, and JS — nothing more.** No build step, no framework, no backend. Deployed on **GitHub** (GitHub Pages).

## Folder & file structure

```
poe2-leveling/
├── index.html                  # Landing page (Leveling / Endgame / Crafting hub)
├── poe2_leveling_guide.html    # Leveling hub — Acts I–IV + Interludes
├── poe2_act1_guide.html        # Act I
├── poe2_act2_guide.html        # Act II
├── poe2_act3_guide.html        # Act III
├── poe2_act4_guide.html        # Act IV
├── poe2_interludes_guide.html  # Interludes (5.1–5.3)
├── poe2_endgame_guide.html     # Endgame / Atlas
├── poe2_league_guide.html      # League guide: the current league mechanic (seasonal, draft)
├── poe2_crafting_codex.html    # Crafting Codex
├── assets/
│   ├── base.css                # Shared theme tokens, resets, theme toggle, text-size control
│   ├── checklist.css           # Checklist, sidebar + atlas styles (act guides, leveling hub, endgame)
│   ├── skin.css                # Design skin layered over base + checklist
│   ├── act.css                 # Act page layout: header, act strip, zone rail, steps
│   ├── site.js                 # Theme + text size before first paint, mobile sidebar sections
│   ├── analytics.js            # Cookie consent banner; Google Analytics only after consent
│   ├── league.js               # Current league(s) for league-only notes (seasonal)
│   ├── progress.js             # Step tracking, zone rail, view filters, reset
│   └── fonts/                  # Self-hosted fonts: fonts.css, woff2 files, OFL licences
├── img/
│   ├── card-leveling.webp      # Landing hero, left half
│   ├── card-endgame.webp       # Landing hero, right half
│   ├── card-league.webp        # Landing league banner (seasonal)
│   └── card-*.jpg              # Older card art, kept but unused
├── og-image.png                # Social preview image
├── robots.txt
├── sitemap.xml
├── README.md
├── LICENSE
└── .gitignore
```

## Conventions

- **No inline scripts or handlers.** Every page has a Content-Security-Policy `<meta>` that forbids them; put behaviour in `assets/*.js` and bind with `addEventListener`.
- **No tracking without consent.** Google Analytics is loaded only by `assets/analytics.js` after the visitor clicks Allow; never add the gtag `<script>` to a page directly. Fonts are self-hosted in `assets/fonts/` (never link Google Fonts: it shares visitor IPs). Any new third-party script or cookie needs the same treatment and a line in the privacy paragraph (`index.html#privacy`).
- **Font sizes in `rem`, never `px`,** so the A−/A+ text-size control scales all text.
- Act pages configure progress on `<body data-progress-key="…" data-reset-label="…">`; step ids (`data-step`) and storage keys must not change, or saved progress is lost.

## Checks (GitHub Actions)

`.github/workflows/checks.yml` runs on every push to `main` and every pull request; a red check means something to fix. It never builds or deploys anything.

| Check | Tool | Config | What it catches |
|---|---|---|---|
| HTML | html-validate | `.htmlvalidate.json` | Broken markup, accessibility mistakes, unescaped characters |
| CSS | stylelint | `.stylelintrc.json` | Invalid CSS, duplicate selectors, empty blocks, `px` font sizes |
| Links | lychee | `lychee.toml` | Broken internal links and `#anchors` on every push; external links every Monday |
| Lighthouse | Lighthouse CI | `.github/lighthouserc.json` | Accessibility / performance / SEO report (warnings + artifact, never blocks) |

Actions are pinned to exact commits; Dependabot (`.github/dependabot.yml`) proposes updates. Run the HTML and CSS checks locally before pushing:

```bash
npx --yes html-validate@9.7.1 "*.html"
npm install --no-save --no-package-lock stylelint@16.26.1 postcss-html@1.8.1 && npx stylelint "assets/**/*.css" "*.html"
```

(`node_modules/` is gitignored.) Inline `style=""` attributes are allowed for now (`no-inline-style` is off); moving them into the stylesheets is a cleanup still to do.

## Claude Code workflow

- **UI, layout or design work** → use the `frontend-design` skill.
- **Before every commit** → run `/code-review`; also `/security-review` when scripts, the Content-Security-Policy, external resources or third-party code change.
- **After finishing a feature** → `/simplify` to clean up.
- **After changes that affect loading** (images, fonts, scripts) → the `web-perf` skill. It needs the Chrome DevTools connector, registered per machine (not in the repo):
  `claude mcp add --scope local chrome-devtools -- cmd /c npx -y chrome-devtools-mcp@1.12.0` (Windows; leave out `cmd /c` on macOS/Linux).
- Commits and pushes only after the owner says so.

## Season change (PoE2 is seasonal)

League content is kept apart so a new season is a short, predictable edit:

0. **`poe2_league_guide.html`** — the page about the current league; rewrite it for the new league. Also the **league banner** on `index.html` (text + picture `img/card-league.webp`).
1. **`assets/league.js`** — the leagues that league-only notes belong to. Add the new league `{ key: { name } }`; delete an ended one and all its notes disappear from every act page (the League notes button hides itself when a page has none left).
2. **League notes in the act pages** — `<div class="note league" data-league="<key>">text</div>` (no label in the HTML; it is generated as "<name> only"). A league-only step can carry `class="step league" data-league="<key>"`. Delete retired notes from the HTML when convenient.
3. **Colours** — the `--a-league-*` tokens at the top of `assets/act.css` (burgundy). Cue boxes use `--a-cue-*` (sage).
4. **Patch / league names in prose and SEO tags** — find them with `grep -rn "0\.5\.5\|Forbidden Rites\|Runes of Aldur" *.html`: page titles and meta/og/twitter descriptions, the landing tagline, "Last updated" line, league badge and "Which league" block (`index.html`), the hub version line and its plum league block (`poe2_leveling_guide.html`, marked by a comment), the act headers' `.act-meta`, and league sections of the endgame and crafting pages.
5. **Patch-change notes** — `<div class="note change"><span class="label">0.5.5 …</span>` in the act pages describe what changed this patch; review or remove them each patch.
