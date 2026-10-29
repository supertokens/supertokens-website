## Why master's `Website Tests` is red

`compose.yml` pinned `supertokens/supertokens-dev-postgresql:experiment_deadlock_detector`, an image last pushed on **2025-11-13** — before core gained CDI 5.4 (core 11.3.0 / SAML, merged 2025-11-19). supertokens-node 24.x (2025-12-02) only speaks CDI 5.4, so every matrix job whose FDI resolves to a node 24 SDK (`2.0`, `3.1`, `4.2`) fails its first request with a core-version-incompatible 500 and the test server then crashes (`socket hang up` / `ECONNRESET`, "0 passing, 4 failing" in 1s). Jobs resolving to older SDKs (`1.17`, `3.0`) pass. The remaining red jobs on the last master run (`1.16`, `1.18`, `1.19`, `3.1`, `4.0`, `4.1`) were a transient 502 from the versions service in `get-versions-action`, not test failures.

The telemetry deadlock that the experiment image worked around is fixed in core since 11.3.0, so this switches to the `master` dev image (overridable with `SUPERTOKENS_CORE_VERSION`), the same as supertokens-node's `compose.yml`.

Separate, not fixed here: `website-testing-action` builds `REPORT_DIR` as `<workspace>/./test-report` when `path: .` is passed, and `upload-artifact@v4` rejects the `./` ("Relative pathing '.' and '..' is not allowed"), so no logs/junit are uploaded on failure. That's a one-line normalisation in the action repo.
