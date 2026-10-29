#!/usr/bin/env bash
# npm trusted publishing for supertokens-website: pushes ci/npm-trusted-publishing from the bundle and
# opens its PR into master, labelled Skip-Changelog (the label is created if the repo doesn't have it).
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO=supertokens/supertokens-website
b=ci/npm-trusted-publishing
git fetch -q origin
git fetch -q "$HERE/website-trusted-publishing.bundle" "+refs/heads/$b:refs/staging/$b"
[ "$(git rev-parse "refs/staging/$b^")" = "$(git rev-parse origin/master)" ] ||
  echo "note: origin/master moved since the bundle was made; the PR still applies unless .circleci/config.yml changed"
git push origin "refs/staging/$b:refs/heads/$b"
gh label list --repo "$REPO" --json name -q '.[].name' | grep -qx Skip-Changelog ||
  gh label create Skip-Changelog --repo "$REPO" --description "The changelog check doesn't apply" --color ededed
if [ -z "$(gh pr list --repo "$REPO" --head "$b" --state all --json number -q '.[].number')" ]; then
  gh pr create --repo "$REPO" --base master --head "$b" --label Skip-Changelog \
    --title "ci: publish to npm from GitHub Actions with trusted publishing" --body-file "$HERE/pr-trusted-publishing.md"
fi
git update-ref -d "refs/staging/$b"
