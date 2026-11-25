# Public social previews

Each target build emits server-rendered metadata into the initial HTML head. Crawlers do not need JavaScript, a cookie, a sign-in, or a service worker to read it.

- Title, description, canonical URL and WebApplication structured data.
- Open Graph: first image is a 1200×630 JPEG cover, second is a 1200×1200 JPEG; each includes absolute URL, secure URL, dimensions, MIME type and alt text.
- X/Twitter: `summary_large_image`, title, description, image and image alt text.
- Public icon URLs: SVG, PNG favicons, ICO, Apple touch icon and PWA icon/maskable variants.
- Public robots rules and a target-specific sitemap.

`tools/render-social-assets.cjs` renders the thumbnails from the existing Fluent application and SVG identity. `build-static.py` gives thumbnails and icon assets content-hashed filenames. Changing the image content therefore changes its public URL and avoids reusing a stale image URL. Existing filenames are retained so old shares do not break.

GitHub Pages is the active publication target and the default canonical domain. ChatGPT Sites public access and updates were withdrawn on 2026-11-25. Portable builds omit a fixed canonical and retain relative image URLs until an explicit final site URL is configured.

Social platforms cache both page metadata and images. Publishing updates the public HTML/assets; it does not force an existing Facebook, LinkedIn, X or Zalo cached preview to refresh immediately. Their rescrape/debug tools may be needed for an already-shared URL.
