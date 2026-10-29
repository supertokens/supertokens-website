#!/usr/bin/env bash
# Pushes the three website branches and opens the PRs. Run from the supertokens-website checkout; needs `gh`.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
git push origin ci/use-master-core-image fix/claim-validator-store-same-id chore/release-20.1.8
open_pr() { # head title bodyfile [--draft]
  if gh pr list --head "$1" --state open --json number -q '.[0].number' | grep -q .; then echo "PR for $1 exists"; return; fi
  gh pr create --base master --head "$1" --title "$2" --body-file "$HERE/$3" ${4:-}
}
open_pr ci/use-master-core-image "ci: run the website tests against the current core dev image" pr-ci.md
open_pr fix/claim-validator-store-same-id "fix: replace same-id claim validators instead of adding duplicates (port of #269)" pr-269-port.md
open_pr chore/release-20.1.8 "chore: release 20.1.8" pr-release.md --draft
CI_URL=$(gh pr list --head ci/use-master-core-image --json url -q '.[0].url')
gh pr comment 280 --body "The three red shards here match master's own run: the compose file pins a core image from before CDI 5.4, so every job that resolves to supertokens-node 24.x fails before the first test. Fix in $CI_URL; rebasing on it (or re-running after it merges) should make this green. Review-wise this looks good to merge for 20.1.8."
echo "done. Merge order: CI fix -> #280 (re-run CI) -> #269 port -> release PR."
