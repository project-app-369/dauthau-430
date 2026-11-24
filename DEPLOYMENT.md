# dauthau-430 — static distribution

Title: **430 Câu ôn luyện Đấu thầu**. App/repository name: **dauthau-430**.

Run `python build-site.py` to update `dist/`. No npm, framework, CDN library, database, server runtime or API key is required. Committed reference PDFs and icons are retained. All questions, answer keys, styles and application code are inline.

## CDN or shared hosting

Upload **the contents of `dist/`**, preserving `icons/` and all filenames, to a document root or a subdirectory such as `/dauthau-430/`. Enable HTTPS; localhost also works. Relative manifest/start/scope/asset paths support both root and subdirectory installs.

Serve `.webmanifest` as `application/manifest+json` (or JSON) and `sw.js` as JavaScript. Recommended cache headers for `sw.js`, `index.html`, `manifest.webmanifest`, `version.json`: `Cache-Control: no-cache`. Keep the worker scope limited to the app directory. No SPA rewrite is needed. Do not cache an authentication page as index.html.

## PWA

The install icon uses the native install prompt when available. On Safari/iOS or when a prompt is unavailable, it opens platform instructions. Installation requires the user's browser confirmation. The icon is hidden in standalone mode.

After the first successful online load, the worker caches the shell: all 430 questions, explanations, flashcards and quizzes work offline. PDFs and external law pages require network; PDFs are not automatically downloaded. Progress and theme are device-local; use JSON export/import between domains or devices.

Each build derives a worker cache version from content. Activation deletes only older caches of this app at the same path and claims clients; it does not reset progress or reload an active quiz. Reopen/reload to use new HTML. Theme transitions respect reduced motion.

## GitHub Pages

Pages source uses **GitHub Actions**. `.github/workflows/pages.yml` builds and publishes `dist/` on pushes to `main`. Project route: `https://project-app-369.github.io/dauthau-430/`. The same output is published on ChatGPT Sites.

## Content and privacy

Answers follow the supplied PDF, including historical notes; no independent legal consolidation is claimed. Answer keys are visible in static source, suitable for self study. No account backend or analytics. Public hosting makes the included reference PDFs accessible.
