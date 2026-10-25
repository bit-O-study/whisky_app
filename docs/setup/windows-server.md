# Windows server deployment

Status: in progress (2026-10-24).

GitHub Actions runs on pushes to main and manual dispatch from main. Tests and Windows builds run on GitHub-hosted runners; deployment uses the dedicated bito-whisky_app runner. Never approve external PR workflows targeting this server.

Server folder: C:/services/Bit-O/whisky_app. Port: 4103. The BitO-App-whisky_app scheduled task runs the application under bito_whisky, without administrator privileges. The Actions runner has a separate Windows service. Existing runners are preserved.

Runtime configuration belongs in config/runtime.env on the server, readable only by the project account and administrators. Do not commit or package environment files. Next public build values belong in the BUILD_PUBLIC_ENV repository variable as dotenv text; only NEXT_PUBLIC_* values may be included. Runtime-only secrets never enter the Actions artifact.

A release is checked by SHA and HTTP health before activation. Failed startup restores the previous release. current.json records the active and previous SHAs; logs/runtime.log records application output. Local databases remain under data/. A new accountBook database is initialized from CI-generated demo data only when no database exists.

SSH and application access allow LAN/Tailscale. Frontend address: http://100.97.115.109:4103. The public temporary tunnel remains the connectivity portal; canonical website URLs and the existing crawler target are unchanged.

2026-10-25 local verification: 61 tests, ESLint, TypeScript, standalone production build and repository harness passed. Server-only Supabase runtime configuration was copied with user authorization. No public build environment is required for this frontend.

Verification pending: first Actions build, deployment health, reboot recovery, external access and optional Java backend services. Existing crawler runner/workflow remain unchanged; no crawler ingestion or database migration was triggered.
