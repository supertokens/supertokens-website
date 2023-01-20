"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGlobalClaimValidators = void 0;
var _1 = require(".");
var fetch_1 = require("../fetch");
var sessionClaimValidatorStore_1 = require("./sessionClaimValidatorStore");
function getGlobalClaimValidators(userContext) {
    var claimValidatorsAddedByOtherRecipes =
        sessionClaimValidatorStore_1.default.getClaimValidatorsAddedByOtherRecipes();
    return fetch_1.default.recipeImpl.getGlobalClaimValidators({
        claimValidatorsAddedByOtherRecipes: claimValidatorsAddedByOtherRecipes,
        userContext: (0, _1.getNormalisedUserContext)(userContext)
    });
}
exports.getGlobalClaimValidators = getGlobalClaimValidators;
