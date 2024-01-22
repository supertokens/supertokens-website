"use strict";
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
var __awaiter =
    (this && this.__awaiter) ||
    function (thisArg, _arguments, P, generator) {
        function adopt(value) {
            return value instanceof P
                ? value
                : new P(function (resolve) {
                      resolve(value);
                  });
        }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) {
                try {
                    step(generator.next(value));
                } catch (e) {
                    reject(e);
                }
            }
            function rejected(value) {
                try {
                    step(generator["throw"](value));
                } catch (e) {
                    reject(e);
                }
            }
            function step(result) {
                result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
            }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };
var __generator =
    (this && this.__generator) ||
    function (thisArg, body) {
        var _ = {
                label: 0,
                sent: function () {
                    if (t[0] & 1) throw t[1];
                    return t[1];
                },
                trys: [],
                ops: []
            },
            f,
            y,
            t,
            g;
        return (
            (g = { next: verb(0), throw: verb(1), return: verb(2) }),
            typeof Symbol === "function" &&
                (g[Symbol.iterator] = function () {
                    return this;
                }),
            g
        );
        function verb(n) {
            return function (v) {
                return step([n, v]);
            };
        }
        function step(op) {
            if (f) throw new TypeError("Generator is already executing.");
            while (_)
                try {
                    if (
                        ((f = 1),
                        y &&
                            (t =
                                op[0] & 2
                                    ? y["return"]
                                    : op[0]
                                    ? y["throw"] || ((t = y["return"]) && t.call(y), 0)
                                    : y.next) &&
                            !(t = t.call(y, op[1])).done)
                    )
                        return t;
                    if (((y = 0), t)) op = [op[0] & 2, t.value];
                    switch (op[0]) {
                        case 0:
                        case 1:
                            t = op;
                            break;
                        case 4:
                            _.label++;
                            return { value: op[1], done: false };
                        case 5:
                            _.label++;
                            y = op[1];
                            op = [0];
                            continue;
                        case 7:
                            op = _.ops.pop();
                            _.trys.pop();
                            continue;
                        default:
                            if (
                                !((t = _.trys), (t = t.length > 0 && t[t.length - 1])) &&
                                (op[0] === 6 || op[0] === 2)
                            ) {
                                _ = 0;
                                continue;
                            }
                            if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                                _.label = op[1];
                                break;
                            }
                            if (op[0] === 6 && _.label < t[1]) {
                                _.label = t[1];
                                t = op;
                                break;
                            }
                            if (t && _.label < t[2]) {
                                _.label = t[2];
                                _.ops.push(op);
                                break;
                            }
                            if (t[2]) _.ops.pop();
                            _.trys.pop();
                            continue;
                    }
                    op = body.call(thisArg, _);
                } catch (e) {
                    op = [6, e];
                    y = 0;
                } finally {
                    f = t = 0;
                }
            if (op[0] & 5) throw op[1];
            return { value: op[0] ? op[1] : void 0, done: true };
        }
    };
Object.defineProperty(exports, "__esModule", { value: true });
exports.BooleanClaim =
    exports.PrimitiveArrayClaim =
    exports.PrimitiveClaim =
    exports.getInvalidClaimsFromResponse =
    exports.getClaimValue =
    exports.validateClaims =
    exports.signOut =
    exports.addAxiosInterceptors =
    exports.doesSessionExist =
    exports.attemptRefreshingSession =
    exports.getAccessToken =
    exports.getAccessTokenPayloadSecurely =
    exports.getUserId =
    exports.init =
        void 0;
var fetch_1 = require("./fetch");
var recipeImplementation_1 = require("./recipeImplementation");
var supertokens_js_override_1 = require("supertokens-js-override");
var utils_1 = require("./utils");
var cookieHandler_1 = require("./utils/cookieHandler");
var windowHandler_1 = require("./utils/windowHandler");
var lockFactory_1 = require("./utils/lockFactory");
var sessionClaimValidatorStore_1 = require("./utils/sessionClaimValidatorStore");
var logger_1 = require("./logger");
var dateProvider_1 = require("./utils/dateProvider");
var AuthHttpRequest = /** @class */ (function () {
    function AuthHttpRequest() {}
    AuthHttpRequest.init = function (options) {
        cookieHandler_1.default.init(options.cookieHandler);
        windowHandler_1.default.init(options.windowHandler);
        dateProvider_1.default.init(options.dateProvider);
        lockFactory_1.default.init(
            options.lockFactory,
            windowHandler_1.default.getReferenceOrThrow().windowHandler.localStorage
        );
        var config = (0, utils_1.validateAndNormaliseInputOrThrowError)(options);
        if (options.enableDebugLogs !== undefined && options.enableDebugLogs) {
            (0, logger_1.enableLogging)();
        }
        var recipeImpl = new supertokens_js_override_1.default(
            (0, recipeImplementation_1.default)({
                onHandleEvent: config.onHandleEvent,
                preAPIHook: config.preAPIHook,
                postAPIHook: config.postAPIHook,
                sessionExpiredStatusCode: config.sessionExpiredStatusCode
            })
        )
            .override(config.override.functions)
            .build();
        fetch_1.default.init(config, recipeImpl);
        AuthHttpRequest.axiosInterceptorQueue.forEach(function (f) {
            f();
        });
        AuthHttpRequest.axiosInterceptorQueue = [];
    };
    AuthHttpRequest.getUserId = function (input) {
        return fetch_1.default.recipeImpl.getUserId({
            userContext: (0, utils_1.getNormalisedUserContext)(input === undefined ? undefined : input.userContext)
        });
    };
    AuthHttpRequest.getAccessTokenPayloadSecurely = function (input) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_b) {
                return [
                    2 /*return*/,
                    fetch_1.default.recipeImpl.getAccessTokenPayloadSecurely({
                        userContext: (0, utils_1.getNormalisedUserContext)(
                            input === undefined ? undefined : input.userContext
                        )
                    })
                ];
            });
        });
    };
    var _a;
    _a = AuthHttpRequest;
    AuthHttpRequest.axiosInterceptorQueue = [];
    AuthHttpRequest.attemptRefreshingSession = function () {
        return __awaiter(void 0, void 0, void 0, function () {
            return __generator(_a, function (_b) {
                return [2 /*return*/, fetch_1.default.attemptRefreshingSession()];
            });
        });
    };
    AuthHttpRequest.doesSessionExist = function (input) {
        return fetch_1.default.recipeImpl.doesSessionExist({
            userContext: (0, utils_1.getNormalisedUserContext)(input === undefined ? undefined : input.userContext)
        });
    };
    /**
     * @deprecated
     */
    AuthHttpRequest.addAxiosInterceptors = function (axiosInstance, userContext) {
        if (!fetch_1.default.initCalled) {
            // the recipe implementation has not been initialised yet, so add
            // this to the queue and wait for it to be initialised, and then on
            // init call, we add all the interceptors.
            AuthHttpRequest.axiosInterceptorQueue.push(function () {
                fetch_1.default.recipeImpl.addAxiosInterceptors({
                    axiosInstance: axiosInstance,
                    userContext: (0, utils_1.getNormalisedUserContext)(userContext)
                });
            });
        } else {
            fetch_1.default.recipeImpl.addAxiosInterceptors({
                axiosInstance: axiosInstance,
                userContext: (0, utils_1.getNormalisedUserContext)(userContext)
            });
        }
    };
    AuthHttpRequest.signOut = function (input) {
        return fetch_1.default.recipeImpl.signOut({
            userContext: (0, utils_1.getNormalisedUserContext)(input === undefined ? undefined : input.userContext)
        });
    };
    AuthHttpRequest.getInvalidClaimsFromResponse = function (input) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_b) {
                return [
                    2 /*return*/,
                    fetch_1.default.recipeImpl.getInvalidClaimsFromResponse({
                        response: input.response,
                        userContext: (0, utils_1.getNormalisedUserContext)(input.userContext)
                    })
                ];
            });
        });
    };
    AuthHttpRequest.getClaimValue = function (input) {
        return __awaiter(this, void 0, void 0, function () {
            var userContext, accessTokenPayload;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        userContext = (0, utils_1.getNormalisedUserContext)(
                            input === undefined ? undefined : input.userContext
                        );
                        return [
                            4 /*yield*/,
                            AuthHttpRequest.getAccessTokenPayloadSecurely({ userContext: userContext })
                        ];
                    case 1:
                        accessTokenPayload = _b.sent();
                        return [2 /*return*/, input.claim.getValueFromPayload(accessTokenPayload, userContext)];
                }
            });
        });
    };
    AuthHttpRequest.validateClaims = function (overrideGlobalClaimValidators, userContext) {
        var normalisedUserContext = (0, utils_1.getNormalisedUserContext)(userContext);
        var claimValidatorsAddedByOtherRecipes =
            sessionClaimValidatorStore_1.SessionClaimValidatorStore.getClaimValidatorsAddedByOtherRecipes();
        var globalClaimValidators = fetch_1.default.recipeImpl.getGlobalClaimValidators({
            claimValidatorsAddedByOtherRecipes: claimValidatorsAddedByOtherRecipes,
            userContext: normalisedUserContext
        });
        var claimValidators =
            overrideGlobalClaimValidators !== undefined
                ? overrideGlobalClaimValidators(globalClaimValidators, normalisedUserContext)
                : globalClaimValidators;
        if (claimValidators.length === 0) {
            return [];
        }
        return fetch_1.default.recipeImpl.validateClaims({
            claimValidators: claimValidators,
            userContext: (0, utils_1.getNormalisedUserContext)(userContext)
        });
    };
    AuthHttpRequest.getAccessToken = function (input) {
        return __awaiter(void 0, void 0, void 0, function () {
            return __generator(_a, function (_b) {
                switch (_b.label) {
                    case 0:
                        return [
                            4 /*yield*/,
                            fetch_1.default.recipeImpl.doesSessionExist({
                                userContext: (0, utils_1.getNormalisedUserContext)(
                                    input === undefined ? undefined : input.userContext
                                )
                            })
                        ];
                    case 1:
                        // This takes care of refreshing the access token if necessary.
                        if (_b.sent()) {
                            return [2 /*return*/, (0, fetch_1.getTokenForHeaderAuth)("access")];
                        }
                        return [2 /*return*/, undefined];
                }
            });
        });
    };
    return AuthHttpRequest;
})();
exports.default = AuthHttpRequest;
exports.init = AuthHttpRequest.init;
exports.getUserId = AuthHttpRequest.getUserId;
exports.getAccessTokenPayloadSecurely = AuthHttpRequest.getAccessTokenPayloadSecurely;
exports.getAccessToken = AuthHttpRequest.getAccessToken;
exports.attemptRefreshingSession = AuthHttpRequest.attemptRefreshingSession;
exports.doesSessionExist = AuthHttpRequest.doesSessionExist;
/**
 * @deprecated
 */
exports.addAxiosInterceptors = AuthHttpRequest.addAxiosInterceptors;
exports.signOut = AuthHttpRequest.signOut;
exports.validateClaims = AuthHttpRequest.validateClaims;
exports.getClaimValue = AuthHttpRequest.getClaimValue;
exports.getInvalidClaimsFromResponse = AuthHttpRequest.getInvalidClaimsFromResponse;
var primitiveClaim_1 = require("./claims/primitiveClaim");
Object.defineProperty(exports, "PrimitiveClaim", {
    enumerable: true,
    get: function () {
        return primitiveClaim_1.PrimitiveClaim;
    }
});
var primitiveArrayClaim_1 = require("./claims/primitiveArrayClaim");
Object.defineProperty(exports, "PrimitiveArrayClaim", {
    enumerable: true,
    get: function () {
        return primitiveArrayClaim_1.PrimitiveArrayClaim;
    }
});
var booleanClaim_1 = require("./claims/booleanClaim");
Object.defineProperty(exports, "BooleanClaim", {
    enumerable: true,
    get: function () {
        return booleanClaim_1.BooleanClaim;
    }
});
