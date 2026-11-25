# dauthau-430 — static distribution

Title: **430 Câu ôn luyện Đấu thầu**. App/repository name: **dauthau-430**.

Run `python build-site.py` to update `dist/`. No npm, framework, CDN library, database, server runtime or API key is required. Committed reference PDFs and icons are retained. All questions, answer keys, styles and application code are inline.

## CDN or shared hosting

Upload **the contents of `dist/`**, preserving `icons/` and all filenames, to a document root or a subdirectory such as `/dauthau-430/`. Enable HTTPS; localhost also works. Relative manifest/start/scope/asset paths support both root and subdirectory installs.

Build metadata for a specific domain with `python build-site.py --site-url https://example.com/dauthau-430/`. This sets canonical, Open Graph, social-image URLs and WebApplication structured data. The default target is ChatGPT Sites. GitHub Actions sets `PUBLIC_SITE_URL` to the GitHub Pages URL. For a portable package without a fixed canonical domain, run `python build-site.py --portable --out-dir path/to/output`; configure a final URL before publishing when social previews/SEO matter. `app-metadata.json` is the shared title/description source.

Serve `.webmanifest` as `application/manifest+json` (or JSON) and `sw.js` as JavaScript. Recommended cache headers for `sw.js`, `index.html`, `manifest.webmanifest`, `version.json`: `Cache-Control: no-cache`. Keep the worker scope limited to the app directory. No SPA rewrite is needed. Do not cache an authentication page as index.html.

The public builds use App Check with a reCAPTCHA Enterprise key restricted to the GitHub Pages and ChatGPT Sites domains. Before deploying to another CDN/shared-hosting domain, register that hostname in both Firebase Auth Authorized domains and the reCAPTCHA key's allowed domains. `firebase-appcheck.json` holds the public site key; it is embedded in the built HTML. See [FIREBASE-SETUP.md](FIREBASE-SETUP.md). Firestore App Check remains Enforced; billing is not enabled by this setup.

## PWA

The install icon uses the native install prompt when available. On Safari/iOS or when a prompt is unavailable, it opens platform instructions. Installation requires the user's browser confirmation. The icon is hidden in standalone mode.

After the first successful online load, the worker caches the shell: all 430 questions, explanations, flashcards and quizzes work offline. PDFs and external law pages require network; PDFs are not automatically downloaded. Google sign-in enables automatic progress sync through Firebase. Guest progress, theme and unfinished quizzes stay local. See [FIREBASE-SETUP.md](FIREBASE-SETUP.md) for required providers, authorized domains and Firestore rules. Add any new shared-hosting/CDN hostname to Firebase Authorized domains before using login there.

Each build derives a worker cache version from content. Activation deletes only older caches of this app at the same path and claims clients; it does not reset progress or reload an active quiz. Reopen/reload to use new HTML. Theme transitions respect reduced motion.

The cache version includes icon/static-asset content. The app includes regular 192/512 PNG icons, a maskable 512 icon, Apple touch icon, SVG and 16/32 favicons, and a 1200×630 social card. Native launcher shortcuts open Learn, Practice or Flashcards. The desktop interface uses a left vertical navbar; mobile uses bottom tabs.

## GitHub Pages

Pages source uses **GitHub Actions**. `.github/workflows/pages.yml` builds and publishes `dist/` on pushes to `main`. Project route: `https://project-app-369.github.io/dauthau-430/`. The same output is published on ChatGPT Sites.

## Content and privacy

Answers follow the supplied PDF, including historical notes; no independent legal consolidation is claimed. Answer keys are visible in static source, suitable for self study. Optional Google login uses Firebase Authentication and owner-only Firestore learning events; no Analytics is initialized. Public hosting makes the included reference PDFs accessible.
