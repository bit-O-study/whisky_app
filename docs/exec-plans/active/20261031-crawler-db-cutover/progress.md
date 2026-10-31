# Progress

- Confirmed current server SUPABASE_URL points to the internal API, but the installed ADB helper rejects it as wrong_database.
- Lotteon catalog and ingest destinations still target the retired Vercel site. The fixed token audience is a separate identity identifier; keeping it avoids weakening authentication or requiring a simultaneous verifier deployment.
- Last Emart scheduled success: 2026-10-30 19:00 UTC, 40 observations/updates. The phone currently reports unauthorized. User action was requested; no authorization bypass is attempted.
- Original Supabase media still returns HTTP 402 exceed_egress_quota. Server mirror directory has zero files; available backup metadata is not original media.
- ADB destination regression suite: 47/47 passed. Playwright crawler TypeScript build and Node/Postgres regression suite: 25/25 passed.
- Installed the exact ADB module with a protected rollback copy and verified production readback: 158 prices (EMART 31, EMART_TRADERS 9, LOTTEON 111, COSTCO 7). The module now rejects the retired Supabase project and all other project paths.
- Lotteon runner is online. Publishing fixed destinations and live workflow verification are in progress; no fresh collection success is claimed yet.
