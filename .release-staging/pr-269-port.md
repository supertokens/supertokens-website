Port of #269 by @AmanAgarwal041 onto current master (the original branch was cut from v20.1.5 and conflicts on `CHANGELOG.md` / `bundle/bundle.js`). Both original commits are cherry-picked with authorship kept; the CHANGELOG entry moved under `[unreleased]` and the bundle was rebuilt.

`SessionClaimValidatorStore.addClaimValidatorFromOtherRecipe` now replaces a validator already registered with the same `id` instead of appending a duplicate, so re-initialising a recipe doesn't accumulate validators (supertokens/supertokens-auth-react#845). Includes the unit test from the original PR.

Closes #269.
