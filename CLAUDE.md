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
├── poe2_crafting_codex.html    # Crafting Codex
├── assets/
│   ├── base.css                # Shared theme tokens, resets, theme toggle, top nav
│   ├── checklist.css           # Sidebar + step/zone/progress styles
│   ├── theme.js                # Theme toggle + persistence
│   └── progress.js             # Step tracking, zone marking, export/import
├── img/
│   ├── card-leveling.jpg
│   ├── card-endgame.jpg
│   └── card-crafting.jpg
├── og-image.png                # Social preview image
├── robots.txt
├── sitemap.xml
├── README.md
├── LICENSE
└── .gitignore
```
