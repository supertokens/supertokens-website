## The actual cause of the red `Website Tests` jobs

#281 (the core image) was not it: the master run after it still fails `2.0` / `3.1` / `4.2` in 2s with the same "0 passing, 4 failing" + 500 + `ECONNRESET` pattern. Reproduced locally against supertokens-node 24.0.4 without a core:

- `/test/setup/st` resets `SuperTokens`, `Session`, `Multitenancy` and `UserMetadata` and calls `SuperTokens.init()` again.
- Since supertokens-node 21.0, `SuperTokens.init()` auto-initialises the **AccountLinking** recipe, and `SuperTokens.reset()` does not reset it (it resets OAuth2Provider / OpenId / JWT / Querier only). The second `init` throws `AccountLinking recipe has already been initialised`, the handler answers 500, `SuperTokens.instance` stays undefined so every later request through the middleware is a 500 too (that's the `/after` failure), and the next unhandled rejection kills the server (the `socket hang up` / `ECONNRESET`).
- Jobs whose FDI resolves to a node < 21 SDK never hit this, which is why `1.17` / `3.0` pass.

Fix: also reset the AccountLinking recipe (guarded, like the other optional recipes) in `/test/setup/st` and `/reinitialiseBackendConfig`.

#281 stays useful (the pinned image was 11 months old), but its description overstated the cause; I'll note that there.
