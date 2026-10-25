# Progress

2026-10-24: inspected server and existing runner; deployment implementation in progress. Environment reuse pending user response. No application runtime verified yet.

2026-10-25: user approved continuation after the environment-transfer request. Server-only Supabase settings were transferred over SSH stdin into a restricted runtime file. No service key is passed to GitHub or the browser. Removed the blanket public-build-variable requirement because this frontend uses server-only configuration.

Validation: Node 24, 12 test files / 61 tests, ESLint, Next standalone production build including TypeScript, and repository harness all passed. standalone/server.js exists. Existing crawler workflow/runner and database schema are unchanged. Java backend runtime and new Windows frontend deployment verification are still pending.

Windows deployment and restart succeeded, but LAN browser inspection reproduced React hydration error 418: server/client rendered the same naive timestamp as different dates and relative ages. Confirmed write paths store UTC. Fixing the read boundary to emit explicit UTC ISO timestamps; add mapper regression before implementation. No DB rewrite or crawler change.
UTC normalization regression failed before the fix and now passes. Final validation: 61 unit tests, ESLint, production build and TypeScript pass; all 10 Chromium E2E pass. Pagination tests now await the first search response before scrolling, avoiding a race with the pre-search catalog. Repository harness passed. Ready for follow-up Windows deployment and external Tailscale browser verification.
