# Progress

- Confirmed current server SUPABASE_URL points to the internal API, but the installed ADB helper rejects it as wrong_database.
- Lotteon catalog and ingest destinations still target the retired Vercel site. The fixed token audience is a separate identity identifier; keeping it avoids weakening authentication or requiring a simultaneous verifier deployment.
- Last Emart scheduled success: 2026-10-30 19:00 UTC, 40 observations/updates. The phone currently reports unauthorized. User action was requested; no authorization bypass is attempted.
- Original Supabase media still returns HTTP 402 exceed_egress_quota. Server mirror directory has zero files; available backup metadata is not original media.
- ADB destination regression suite: 47/47 passed. Playwright crawler TypeScript build and Node/Postgres regression suite: 25/25 passed.
- Installed the exact ADB module with a protected rollback copy and verified production readback: 158 prices (EMART 31, EMART_TRADERS 9, LOTTEON 111, COSTCO 7). The module now rejects the retired Supabase project and all other project paths.
- Published and deployed commit `b1b2b25f33acfff853205812202a56918d92e8d7`. Windows deployment run 41203051847 passed build and deploy.
- Fresh Lotteon workflow 41203104750 passed verify, runner guard, and crawl. Product 864: 54,800 at 2026-10-31T12:55:16.046Z; product 865: 28,800 at 2026-10-31T12:55:24.877Z. Internal PostgreSQL readback confirmed both prices and corresponding history timestamps. Only these two existing product IDs were requested for live validation; the existing daily schedule still uses the full queue.
- Verified the internal RPC transaction with `service_role`, then rolled it back before the live workflow. Unique per-product/source price index is present.
- Emart scheduled DB module is installed and reads the internal database. Fresh device collection remains blocked by USB `unauthorized`. The running ADB bridge uses the intended pc account and its existing key dated October 26; no alternate identity or authorization bypass was attempted.
- Original media remains unrecoverable with current access: HTTP 402 exceed_egress_quota. No originals in the server mirror or backups. Three Next.js image cache files did not match known storage-object URL/cache keys. Private media was not replaced with fabricated content. User input requested for source copies or restoring source storage access.
- User authorized USB debugging. The existing scheduled task was started without changing its daily trigger. Fresh run 2026-10-31T13:04:46.737Z–13:10:33.714Z succeeded: 40 queued, 40 observed, 40 updated (EMART 31 / EMART_TRADERS 9), zero collection/review errors, zero duplicate prices.
- Readback confirmed all 40 prices and observation times in the internal DB and public catalog. Prices were unchanged; freshness timestamps were updated. Scheduled task result=0; next run 2026-11-01 04:00 KST.
- Crawler cutover verification is complete. Original media restoration remains a separate source-availability blocker (Supabase quota or user-provided originals); no original recovery is claimed.
