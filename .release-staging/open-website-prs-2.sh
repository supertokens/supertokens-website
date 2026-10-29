#!/usr/bin/env bash
# Round 2 for the website release: push the test-server fix + updated release branch, open the PR, correct #281.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
git push origin fix/test-server-reset-account-linking
git push origin chore/release-20.1.8
if ! gh pr list --head fix/test-server-reset-account-linking --state open --json number -q '.[0].number' | grep -q .; then
  gh pr create --base master --head fix/test-server-reset-account-linking --title "test: reset the AccountLinking recipe when the test server re-initialises the SDK" --body-file "$HERE/pr-test-server.md"
fi
FIX_URL=$(gh pr list --head fix/test-server-reset-account-linking --json url -q '.[0].url')
gh pr comment 281 --body "Correction: this was not the cause of the red jobs — the master run after merging still fails 2.0 / 3.1 / 4.2 the same way. The real cause is the test server not resetting the auto-initialised AccountLinking recipe before re-init (node >= 21): $FIX_URL. The image bump stays useful (it was 11 months old)."
gh pr comment 280 --body "Follow-up to my earlier note: the remaining red shards are the test server's missing AccountLinking reset, fixed in $FIX_URL. Rebase on master once that merges and this should go green."
echo "done. Merge order now: $FIX_URL -> #280 (rebase) -> #282 -> #283."
