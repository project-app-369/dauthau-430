# Đấu Thầu 430 câu · dauthau-430

Static GitHub Pages PWA. Rebuild index with `python build-site.py`. Editable content is in questions.json/topics.json; presentation in app.js/fluent.css/template.html. dist contains the deployable HTML, original question PDF and nine lecture PDF parts. All 430 questions, answers and explanations come from the source document. Topic organization and learning guidance are authored study aids. Source ledger and original browser validation are included.

Production: https://project-app-369.github.io/dauthau-430/. ChatGPT Sites public access was withdrawn on 2026-11-25 and further updates there are disabled. Follow `AGENTS.md` for the GitHub-only deployment policy.

The lecture PDF has 416 pages and is split into 50-page sections without resampling. Question links preserve original page labels while pointing to the correct local page in a section. Google login automatically syncs completed learning progress, bookmarks, flashcards and history through Firebase; guest progress can still be exported/imported. See [FIREBASE-SETUP.md](FIREBASE-SETUP.md) for the one-time Console configuration and owner-only rules.

## Fluent mobile-first interface

The active stylesheet is `fluent.css`; `theme.js` provides inline SVG icons, a persisted light/dark preference, system preference on first use, and a radial View Transition from the theme button. Reduced-motion preferences and browsers without View Transitions use an immediate theme change. The five primary modes use fixed bottom tabs on mobile and a left navbar on desktop. Filters belong only to Learn. The header includes the account profile and sync status.

The latest version uses bottom tabs on mobile and a left vertical navbar on desktop. Theme and install controls are icon-only with accessible names. `pwa.js`, `pwa-static/`, and `sw-template.js` add the install affordance and offline application shell. `app-metadata.json` supplies platform-specific canonical/social metadata, and `tools/render-brand-assets.cjs` exports the SVG app identity to PNG and social-card formats. See [DEPLOYMENT.md](DEPLOYMENT.md) for hosting, PWA and Pages instructions. Build with `python build-site.py`; publish `dist/`.
