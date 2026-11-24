# Học Đấu thầu · 430 câu hỏi

Static ChatGPT Site. Rebuild index with `python build-site.py`. Editable content is in questions.json/topics.json; presentation in app.js/styles.css/template.html. dist contains the deployable HTML, original question PDF and nine lecture PDF parts. All 430 questions, answers and explanations come from the source document. Topic organization and learning guidance are authored study aids. Source ledger and original browser validation are included.

The lecture PDF has 416 pages and is split into 50-page sections without resampling. Question links preserve original page labels while pointing to the correct local page in a section. Browser-local progress can be exported/imported; no cross-device synchronization is claimed. Existing local-file progress can be imported into the hosted Site using its JSON export.

## Fluent mobile-first interface

The active stylesheet is `fluent.css`; `theme.js` provides inline SVG icons, a persisted light/dark preference, system preference on first use, and a radial View Transition from the theme button. Reduced-motion preferences and browsers without View Transitions use an immediate theme change. The five primary modes use fixed bottom navigation at all widths; icons remain visible on mobile. Filters belong only to Learn. Content, state version, answers and PDF references are unchanged.
