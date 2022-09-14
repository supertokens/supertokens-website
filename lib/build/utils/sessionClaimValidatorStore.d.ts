import { SessionClaimValidator } from "../types";
export declare class SessionClaimValidatorStore {
    private static claimValidatorsAddedByOtherRecipes;
    static addClaimValidatorFromOtherRecipe: (builder: SessionClaimValidator) => void;
    static getClaimValidatorsAddedByOtherRecipes: () => SessionClaimValidator[];
}
export default SessionClaimValidatorStore;
