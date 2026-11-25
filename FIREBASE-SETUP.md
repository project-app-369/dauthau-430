# Firebase login and automatic sync

The supplied public web config is in `firebase-client.js`. No Admin SDK key is needed or included. The active public deployment is GitHub Pages; ChatGPT Sites public access and further updates were withdrawn on 2026-11-25. Google login works after the following Firebase Console settings are enabled.

## One-time project setup

1. Open https://console.firebase.google.com/project/dauthau-430/authentication/providers. Click **Get started** if needed; enable **Google**, select a support email, and save.
2. In **Authentication → Settings → Authorized domains**, add the hostnames below (no scheme or path):
   - `project-app-369.github.io`
   - `localhost` only if testing locally.
3. Open https://console.firebase.google.com/project/dauthau-430/firestore and create the **(default)** Cloud Firestore database in **production mode**. Choose a suitable location; the app does not require a particular region.
4. In **Firestore → Rules**, paste the complete contents of [firestore.rules](firestore.rules) and click **Publish**. Alternatively, with your own Firebase CLI login, run `firebase deploy --only firestore:rules --project dauthau-430` in this repository. Do not deploy permissive test-mode rules.

Only the authenticated owner can read or append their learning events. Existing events cannot be changed or deleted; identical retries are allowed. Unmatched paths deny access. A client reset writes an explicit reset event, which clears visible progress across devices without an unsafe collection deletion. It is not an account/data-erasure operation.

## App Check

`firebase-appcheck.json` contains only a public reCAPTCHA Enterprise site key and allowed production domains. When configured, the app initializes App Check before Auth/Firestore and enables automatic token refresh. Native Firestore listeners use the SDK's App Check provider; the HTTPS fallback sends `X-Firebase-AppCheck` on both reads and commits. Failed attestation leaves progress in the local outbox and does not send an unverified request.

If Firestore App Check is Enforced, its web app must have a working provider and the deployed frontend must contain its matching public site key. A successful Google login alone cannot satisfy App Check. The production key must allow `project-app-369.github.io`; the existing key also retains the retired ChatGPT Sites hostname as a legacy registration. Additional CDN/shared-hosting domains require both Firebase Auth authorization and reCAPTCHA key domain registration. Do not put a site secret, debug token or service-account key in static source. Automated local tests use an injected provider; production deployments use the registered Enterprise provider.

## Verification after enabling Firebase

Open the GitHub Pages app directly in a browser on two devices, click the profile icon, and sign in with Google. The status should become **Đã đồng bộ**. On device A, answer a question and mark another question. On device B, sign in with the same Google account; both changes should appear automatically. Repeat in the opposite direction. Go offline on A, answer another question, reload, then reconnect; the result must remain and reach B. Sign out; the browser's separate guest progress should reappear. Verify that another Google account cannot see the first account's progress.

If Google reports `auth/unauthorized-domain`, add the exact current hostname above. If the profile shows a Firestore permissions error, publish this repository's rules. `CONFIGURATION_NOT_FOUND` means Authentication has not been initialized for this project. API-key HTTP referrer restrictions, if enabled in Google Cloud Console, must allow both public hosts, `identitytoolkit.googleapis.com`, `securetoken.googleapis.com`, and Firestore's required APIs as applicable.

## Data and offline behavior

- Learning data lives at `users/{uid}/courses/dauthau-430/events/{eventId}`. The collection needs no composite index.
- Every local edit is immediately stored in the account's local state and a durable local outbox. Event IDs are stable across retries. Online listeners receive other devices' events automatically, and reconnection sends pending events in batches.
- Events patch individual fields rather than replace a whole device's progress. Different questions and fields merge; concurrent changes to the same field follow the event's logical timestamp, with a stable tie-breaker. The clock observes received events; devices should keep normal automatic date/time settings.
- Attempt history merges by stable attempt ID. The reset/import action creates a reset event, then the replacement data; older events do not resurrect cleared progress.
- Guest progress is merged on sign-in: learned questions and attempt history are retained, while existing account choices take priority for conflicting fields. Guest data remains separate for sign-out. Authenticated account caches and queues are keyed by UID.
- Navigation and an unfinished quiz stay local to each device. Theme preference stays local. Completed quiz results, bookmarks and flashcard scheduling sync.
- The Firebase SDK is loaded from Google's pinned CDN. An unavailable CDN does not block the course; cached account progress remains available offline. Initial sign-in and initial cloud sync require the network. Do not clear browser storage while it contains unsent changes.
- The app uses Auth and Firestore only; Analytics and Storage are not enabled by the supplied measurement/bucket settings.
- Event history is append-only and read on initial sync. For a much larger course or long-running high-volume deployment, add server-side snapshots/compaction with corresponding rules before pruning events.

## Connection recovery

The realtime listener uses long-polling for proxy compatibility. If no server snapshot arrives within 8 seconds, the app switches to standard Firestore HTTPS reads and automatically polls every 15 seconds while the window is visible. Returning to the app or regaining the network triggers an immediate refresh. If the realtime listener recovers, polling stops. Writes use HTTPS commits with a 12-second deadline, stable event IDs and the same Firebase ID token; they continue to use the published owner-only Security Rules. This update needs no rule changes.

Authentication success alone does not mean progress has synced. **Đã đồng bộ** appears only after a server read and all pending writes are acknowledged. Timeouts and permission/database errors show an actionable message and allow retry; unsent events remain in the local outbox. The profile's **Chẩn đoán kết nối** section reports the transport, pending count, last response time and error code, without tokens, email or UID. A 403 from an unauthenticated connection probe cannot establish whether an authenticated user's rules are configured correctly.

Run `node --test tools/sync-model.test.cjs tools/sync-http.test.cjs` for deterministic merge/reset/convergence checks and HTTPS encoding, authentication, App Check headers/failure handling, pagination, permission errors and timeout tests. Browser QA additionally covers App Check initialization with automatic token refresh, durable outbox recovery, realtime updates, a hanging realtime listener with HTTPS fallback, two-way fallback polling, permission errors/retry/reload, and account separation using injected transports. It does not substitute for signing in to the production project after Console setup.
