import { getNormalisedUserContext } from ".";
import AuthHttpRequestFetch from "../fetch";
import SessionClaimValidatorStore from "./sessionClaimValidatorStore";

export function getGlobalClaimValidators(userContext: any) {
    const claimValidatorsAddedByOtherRecipes = SessionClaimValidatorStore.getClaimValidatorsAddedByOtherRecipes();
    return AuthHttpRequestFetch.recipeImpl.getGlobalClaimValidators({
        claimValidatorsAddedByOtherRecipes,
        userContext: getNormalisedUserContext(userContext)
    });
}
