# Plan

1. Inspect the scheduled installation, current runtime, and workflow destinations.
2. Constrain ADB writes to the internal whisky API. Move Lotteon catalog/ingest HTTP calls to the current site, keeping the deployed OIDC audience contract.
3. Test destination rejection, crawler regression tests, and server DB reads. Deploy the scheduled ADB module and publish the workflow code.
4. Run a fresh Lotteon observation through workflow identity and read back the internal price/history. Run Emart when the phone is authorized.
5. Record original-media access limitations and restore only verified originals if available.
