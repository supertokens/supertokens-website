Moves the npm publish from CircleCI to GitHub Actions and prepares it for [trusted publishing](https://docs.npmjs.com/trusted-publishers).

- New `.github/workflows/publish.yml`: runs when a release tag `vX.Y.Z` is pushed (as `./addReleaseTag` does), checks that the tag matches `package.json`, asks api.supertokens.io whether the version is the latest (as `publish.sh` did) and publishes under `latest` or `version-X.Y.Z`. The job has `id-token: write` and uses npm 11.5.1+ on Node 24.
- CircleCI's `publish` job and `.circleci/publish.sh` are removed, so a tag is published once. The CircleCI `test` and `update-docs` jobs stay.

npm tries the OIDC exchange first and falls back to `NODE_AUTH_TOKEN` when no trusted publisher is configured. With OIDC, npm also attaches a provenance attestation.

Note: `v20.1.7` was tagged but never reached npm (npm's latest is still 20.1.6), so the CircleCI publish wasn't working.

Needs to be on master before the 20.1.8 release tag is pushed: a tag runs the workflow file as it is in the tagged commit.
