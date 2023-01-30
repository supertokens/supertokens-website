"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGlobalClaimValidators = void 0;
var _1 = require(".");
var fetch_1 = require("../fetch");
var sessionClaimValidatorStore_1 = require("./sessionClaimValidatorStore");
function getGlobalClaimValidators(overrideGlobalClaimValidators, userContext) {
    var normalisedUserContext = (0, _1.getNormalisedUserContext)(userContext);
    var claimValidatorsAddedByOtherRecipes =
        sessionClaimValidatorStore_1.default.getClaimValidatorsAddedByOtherRecipes();
    var globalClaimValidators = fetch_1.default.recipeImpl.getGlobalClaimValidators({
        claimValidatorsAddedByOtherRecipes: claimValidatorsAddedByOtherRecipes,
        userContext: normalisedUserContext
    });
    var claimValidators =
        overrideGlobalClaimValidators !== undefined
            ? overrideGlobalClaimValidators(globalClaimValidators, normalisedUserContext)
            : globalClaimValidators;
    return claimValidators;
}
exports.getGlobalClaimValidators = getGlobalClaimValidators;
