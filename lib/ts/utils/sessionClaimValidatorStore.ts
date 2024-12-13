/* Copyright (c) 2020, VRAI Labs and/or its affiliates. All rights reserved.
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

import { SessionClaimValidator } from "../types";

export class SessionClaimValidatorStore {
    private static claimValidatorsAddedByOtherRecipes: SessionClaimValidator[] = [];

    static addClaimValidatorFromOtherRecipe = (builder: SessionClaimValidator) => {
        let existingBuilderIdIndex: number = -1;
        SessionClaimValidatorStore.claimValidatorsAddedByOtherRecipes.forEach((claimValidator, index) => {
            if (claimValidator.id === builder.id) {
                existingBuilderIdIndex = index;
            }
        });

        /*
         * Updating the claim validator in the claimValidatorsAddedByOtherRecipes list if the
         * validator already exists with the same builder id else we push the new builder in
         * the claimValidatorsAddedByOtherRecipes.
         * Hence, always the last added claim validator for the recipe will exist in the
         * claimValidatorsAddedByOtherRecipes list.
         */
        if (existingBuilderIdIndex > -1) {
            SessionClaimValidatorStore.claimValidatorsAddedByOtherRecipes[existingBuilderIdIndex] = builder;
        } else {
            SessionClaimValidatorStore.claimValidatorsAddedByOtherRecipes.push(builder);
        }
    };

    static getClaimValidatorsAddedByOtherRecipes = (): SessionClaimValidator[] => {
        return SessionClaimValidatorStore.claimValidatorsAddedByOtherRecipes;
    };
}

export default SessionClaimValidatorStore;
