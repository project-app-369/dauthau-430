# Deployment policy

User instruction recorded on 2026-11-25: withdraw ChatGPT Sites public access and stop publishing/updating that deployment.

- The active production target is GitHub Pages: `https://project-app-369.github.io/dauthau-430/`.
- Build with `python build-site.py`. Commit and push updates to the `github` remote, branch `main`; GitHub Actions handles Pages deployment.
- Do not create, save, deploy, republish, or synchronize source to ChatGPT Sites for routine app updates. Re-enable that target only if the user explicitly requests it.
- `.openai/hosting.disabled.json` preserves the retired Site identity. It is not an active hosting manifest. Do not create a replacement Site.
- Keep Firebase learning data and authentication intact when changing hosting. Hosting retirement does not require deleting accounts, resetting progress, or changing Firebase security settings.
