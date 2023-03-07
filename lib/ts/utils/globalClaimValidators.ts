import { getNormalisedUserContext } from ".";
import AuthHttpRequestFetch from "../fetch";
import { SessionClaimValidator } from "../types";
import SessionClaimValidatorStore from "./sessionClaimValidatorStore";

export function getGlobalClaimValidators(
    overrideGlobalClaimValidators?: (
        globalClaimValidators: SessionClaimValidator[],
        userContext: any
    ) => SessionClaimValidator[],
    userContext?: any
) {
    const normalisedUserContext = getNormalisedUserContext(userContext);
    const claimValidatorsAddedByOtherRecipes = SessionClaimValidatorStore.getClaimValidatorsAddedByOtherRecipes();
    const globalClaimValidators = AuthHttpRequestFetch.recipeImpl.getGlobalClaimValidators({
        claimValidatorsAddedByOtherRecipes,
        userContext: normalisedUserContext
    });
    const claimValidators =
        overrideGlobalClaimValidators !== undefined
            ? overrideGlobalClaimValidators(globalClaimValidators, normalisedUserContext)
            : globalClaimValidators;

    return claimValidators;
}
