/* Copyright (c) 2024, VRAI Labs and/or its affiliates. All rights reserved.
 *
 * This software is licensed under the Apache License, Version 2.0 (the
 * "License") as published by the Apache Software Foundation.
 *
 * You may not use this file except in compliance with the License. You may
 * obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 */

const assert = require("assert");
const { BooleanClaim } = require("../lib/build");
const { SessionClaimValidatorStore } = require("../lib/build/utils/sessionClaimValidatorStore");

describe("SessionClaimValidatorStore:addClaimValidatorFromOtherRecipe", () => {
    it("SessionClaimValidatorStore addClaimValidatorFromOtherRecipe should update the existing validator rather than adding new one", function () {
        const claimFirst = new BooleanClaim({
            id: "st-test",
            refresh: () => {},
            defaultMaxAgeInSeconds: 10
        });

        const claimSecond = new BooleanClaim({
            id: "st-test",
            refresh: () => {},
            defaultMaxAgeInSeconds: 10
        });

        SessionClaimValidatorStore.addClaimValidatorFromOtherRecipe(claimFirst);
        SessionClaimValidatorStore.addClaimValidatorFromOtherRecipe(claimSecond);

        const claimValidators = SessionClaimValidatorStore.getClaimValidatorsAddedByOtherRecipes();

        assert.strictEqual(claimValidators.length, 1);
    });
});
