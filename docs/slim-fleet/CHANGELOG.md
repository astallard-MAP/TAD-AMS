# SLIM Fleet Changelog

## 2026-10-05
- **Files Changed:** `social.js`, `main.js`, `dashboard.js`, `admin.js`, `functions/index.js`
- **Reason:** Emergency Exception 005.Q-4 applied. Updated hardcoded `vjikc6hdhq-uc.a.run.app` (us-central1) URLs to `europe-west4-c4h-wesbite.cloudfunctions.net` following the region unification in Phase 001. Fixed HTTP 404 errors for `chatbotAndy`, `getGoogleReviews`, etc.
- **Rollback Steps:** Revert the URL constants in the specified files to use `vjikc6hdhq-uc.a.run.app` strings, then run `npm run build`.
