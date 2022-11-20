"use strict";
var __assign =
    (this && this.__assign) ||
    function() {
        __assign =
            Object.assign ||
            function(t) {
                for (var s, i = 1, n = arguments.length; i < n; i++) {
                    s = arguments[i];
                    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
                }
                return t;
            };
        return __assign.apply(this, arguments);
    };
var __awaiter =
    (this && this.__awaiter) ||
    function(thisArg, _arguments, P, generator) {
        function adopt(value) {
            return value instanceof P
                ? value
                : new P(function(resolve) {
                      resolve(value);
                  });
        }
        return new (P || (P = Promise))(function(resolve, reject) {
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
    function(thisArg, body) {
        var _ = {
                label: 0,
                sent: function() {
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
                (g[Symbol.iterator] = function() {
                    return this;
                }),
            g
        );
        function verb(n) {
            return function(v) {
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
exports.fireSessionUpdateEventsIfNecessary = exports.setFrontToken = exports.getFrontToken = exports.setAntiCSRF = exports.saveRefreshAttempt = exports.getToken = exports.setToken = exports.getStorageNameForToken = exports.getLocalSessionState = exports.onInvalidClaimResponse = exports.onTokenUpdate = exports.onUnauthorisedResponse = exports.FrontToken = exports.AntiCsrfToken = void 0;
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
var processState_1 = require("./processState");
var version_1 = require("./version");
var browser_tabs_lock_1 = require("browser-tabs-lock");
var utils_1 = require("./utils");
var cookieHandler_1 = require("./utils/cookieHandler");
var windowHandler_1 = require("./utils/windowHandler");
var logger_1 = require("./logger");
function getWindowOrThrow() {
    if (typeof window === "undefined") {
        throw Error(
            "If you are using this package with server-side rendering, please make sure that you are checking if the window object is defined."
        );
    }
    return window;
}
var AntiCsrfToken = /** @class */ (function() {
    function AntiCsrfToken() {}
    AntiCsrfToken.getToken = function(associatedIdRefreshToken) {
        return __awaiter(this, void 0, void 0, function() {
            var antiCsrf;
            return __generator(this, function(_a) {
                switch (_a.label) {
                    case 0:
                        (0, logger_1.logDebugMessage)("AntiCsrfToken.getToken: called");
                        if (associatedIdRefreshToken === undefined) {
                            AntiCsrfToken.tokenInfo = undefined;
                            (0, logger_1.logDebugMessage)("AntiCsrfToken.getToken: returning undefined");
                            return [2 /*return*/, undefined];
                        }
                        if (!(AntiCsrfToken.tokenInfo === undefined)) return [3 /*break*/, 2];
                        return [4 /*yield*/, getAntiCSRFToken()];
                    case 1:
                        antiCsrf = _a.sent();
                        if (antiCsrf === null) {
                            (0, logger_1.logDebugMessage)("AntiCsrfToken.getToken: returning undefined");
                            return [2 /*return*/, undefined];
                        }
                        AntiCsrfToken.tokenInfo = {
                            antiCsrf: antiCsrf,
                            associatedIdRefreshToken: associatedIdRefreshToken
                        };
                        return [3 /*break*/, 4];
                    case 2:
                        if (!(AntiCsrfToken.tokenInfo.associatedIdRefreshToken !== associatedIdRefreshToken))
                            return [3 /*break*/, 4];
                        // csrf token has changed.
                        AntiCsrfToken.tokenInfo = undefined;
                        return [4 /*yield*/, AntiCsrfToken.getToken(associatedIdRefreshToken)];
                    case 3:
                        return [2 /*return*/, _a.sent()];
                    case 4:
                        (0,
                        logger_1.logDebugMessage)("AntiCsrfToken.getToken: returning: " + AntiCsrfToken.tokenInfo.antiCsrf);
                        return [2 /*return*/, AntiCsrfToken.tokenInfo.antiCsrf];
                }
            });
        });
    };
    AntiCsrfToken.removeToken = function() {
        return __awaiter(this, void 0, void 0, function() {
            return __generator(this, function(_a) {
                switch (_a.label) {
                    case 0:
                        (0, logger_1.logDebugMessage)("AntiCsrfToken.removeToken: called");
                        AntiCsrfToken.tokenInfo = undefined;
                        return [4 /*yield*/, setAntiCSRF(undefined)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    AntiCsrfToken.setItem = function(associatedIdRefreshToken, antiCsrf) {
        return __awaiter(this, void 0, void 0, function() {
            return __generator(this, function(_a) {
                switch (_a.label) {
                    case 0:
                        if (associatedIdRefreshToken === undefined) {
                            AntiCsrfToken.tokenInfo = undefined;
                            return [2 /*return*/];
                        }
                        (0, logger_1.logDebugMessage)("AntiCsrfToken.setItem: called");
                        return [4 /*yield*/, setAntiCSRF(antiCsrf)];
                    case 1:
                        _a.sent();
                        AntiCsrfToken.tokenInfo = {
                            antiCsrf: antiCsrf,
                            associatedIdRefreshToken: associatedIdRefreshToken
                        };
                        return [2 /*return*/];
                }
            });
        });
    };
    return AntiCsrfToken;
})();
exports.AntiCsrfToken = AntiCsrfToken;
// Note: We do not store this in memory because another tab may have
// modified this value, and if so, we may not know about it in this tab
var FrontToken = /** @class */ (function() {
    function FrontToken() {}
    FrontToken.getTokenInfo = function() {
        return __awaiter(this, void 0, void 0, function() {
            var frontToken, response;
            return __generator(this, function(_a) {
                switch (_a.label) {
                    case 0:
                        (0, logger_1.logDebugMessage)("FrontToken.getTokenInfo: called");
                        return [4 /*yield*/, getFrontToken()];
                    case 1:
                        frontToken = _a.sent();
                        if (!(frontToken === null)) return [3 /*break*/, 5];
                        return [4 /*yield*/, getLocalSessionState(false)];
                    case 2:
                        if (!(_a.sent().status === "EXISTS")) return [3 /*break*/, 4];
                        // this means that the id refresh token has been set, so we must
                        // wait for this to be set or removed
                        return [
                            4 /*yield*/,
                            new Promise(function(resolve) {
                                FrontToken.waiters.push(resolve);
                            })
                        ];
                    case 3:
                        // this means that the id refresh token has been set, so we must
                        // wait for this to be set or removed
                        _a.sent();
                        return [2 /*return*/, FrontToken.getTokenInfo()];
                    case 4:
                        return [2 /*return*/, undefined];
                    case 5:
                        response = parseFrontToken(frontToken);
                        (0, logger_1.logDebugMessage)("FrontToken.getTokenInfo: returning ate: " + response.ate);
                        (0, logger_1.logDebugMessage)("FrontToken.getTokenInfo: returning uid: " + response.uid);
                        (0, logger_1.logDebugMessage)("FrontToken.getTokenInfo: returning up: " + response.up);
                        return [2 /*return*/, response];
                }
            });
        });
    };
    FrontToken.removeToken = function() {
        return __awaiter(this, void 0, void 0, function() {
            return __generator(this, function(_a) {
                switch (_a.label) {
                    case 0:
                        (0, logger_1.logDebugMessage)("FrontToken.removeToken: called");
                        return [4 /*yield*/, setFrontToken(undefined)];
                    case 1:
                        _a.sent();
                        FrontToken.waiters.forEach(function(f) {
                            return f(undefined);
                        });
                        FrontToken.waiters = [];
                        return [2 /*return*/];
                }
            });
        });
    };
    FrontToken.setItem = function(frontToken) {
        return __awaiter(this, void 0, void 0, function() {
            return __generator(this, function(_a) {
                switch (_a.label) {
                    case 0:
                        // We update the refresh attempt info here as well, since this means that we've updated the session in some way
                        // maybe through a custom endpoint...
                        return [4 /*yield*/, saveRefreshAttempt()];
                    case 1:
                        // We update the refresh attempt info here as well, since this means that we've updated the session in some way
                        // maybe through a custom endpoint...
                        _a.sent();
                        if (frontToken === "remove") {
                            return [2 /*return*/, FrontToken.removeToken()];
                        }
                        (0, logger_1.logDebugMessage)("FrontToken.setItem: called");
                        return [4 /*yield*/, setFrontToken(frontToken)];
                    case 2:
                        _a.sent();
                        FrontToken.waiters.forEach(function(f) {
                            return f(undefined);
                        });
                        FrontToken.waiters = [];
                        return [2 /*return*/];
                }
            });
        });
    };
    FrontToken.doesTokenExists = function() {
        return __awaiter(this, void 0, void 0, function() {
            var frontToken;
            return __generator(this, function(_a) {
                switch (_a.label) {
                    case 0:
                        return [4 /*yield*/, getFrontTokenFromCookie()];
                    case 1:
                        frontToken = _a.sent();
                        return [2 /*return*/, frontToken !== null];
                }
            });
        });
    };
    // these are waiters for when the idRefreshToken has been set, but this token has
    // not yet been set. Once this token is set or removed, the waiters are resolved.
    FrontToken.waiters = [];
    return FrontToken;
})();
exports.FrontToken = FrontToken;
/**
 * @class AuthHttpRequest
 * @description wrapper for common http methods.
 */
var AuthHttpRequest = /** @class */ (function() {
    function AuthHttpRequest() {}
    AuthHttpRequest.init = function(config, recipeImpl) {
        (0, logger_1.logDebugMessage)("init: called");
        (0, logger_1.logDebugMessage)("init: Input apiBasePath: " + config.apiBasePath);
        (0, logger_1.logDebugMessage)("init: Input apiDomain: " + config.apiDomain);
        (0, logger_1.logDebugMessage)("init: Input autoAddCredentials: " + config.autoAddCredentials);
        (0, logger_1.logDebugMessage)("init: Input sessionTokenBackendDomain: " + config.sessionTokenBackendDomain);
        (0, logger_1.logDebugMessage)("init: Input isInIframe: " + config.isInIframe);
        (0, logger_1.logDebugMessage)("init: Input sessionExpiredStatusCode: " + config.sessionExpiredStatusCode);
        (0, logger_1.logDebugMessage)("init: Input sessionTokenFrontendDomain: " + config.sessionTokenFrontendDomain);
        AuthHttpRequest.env = getWindowOrThrow().fetch === undefined ? global : getWindowOrThrow();
        AuthHttpRequest.refreshTokenUrl = config.apiDomain + config.apiBasePath + "/session/refresh";
        AuthHttpRequest.signOutUrl = config.apiDomain + config.apiBasePath + "/signout";
        AuthHttpRequest.rid = "session";
        AuthHttpRequest.config = config;
        if (AuthHttpRequest.env.__supertokensOriginalFetch === undefined) {
            (0, logger_1.logDebugMessage)("init: __supertokensOriginalFetch is undefined");
            // this block contains code that is run just once per page load..
            // all items in this block are attached to the global env so that
            // even if the init function is called more than once (maybe across JS scripts),
            // things will not get created multiple times.
            AuthHttpRequest.env.__supertokensOriginalFetch = AuthHttpRequest.env.fetch.bind(AuthHttpRequest.env);
            AuthHttpRequest.env.__supertokensSessionRecipe = recipeImpl;
            AuthHttpRequest.env.fetch = AuthHttpRequest.env.__supertokensSessionRecipe.addFetchInterceptorsAndReturnModifiedFetch(
                {
                    originalFetch: AuthHttpRequest.env.__supertokensOriginalFetch,
                    userContext: {}
                }
            );
            AuthHttpRequest.env.__supertokensSessionRecipe.addXMLHttpRequestInterceptor({
                userContext: {}
            });
        }
        AuthHttpRequest.recipeImpl = AuthHttpRequest.env.__supertokensSessionRecipe;
        AuthHttpRequest.initCalled = true;
    };
    var _a;
    _a = AuthHttpRequest;
    AuthHttpRequest.initCalled = false;
    AuthHttpRequest.doRequest = function(httpCall, config, url) {
        return __awaiter(void 0, void 0, void 0, function() {
            var doNotDoInterception,
                returnObj,
                preRequestLSS,
                clonedHeaders,
                configWithAntiCsrf,
                antiCsrfToken,
                response,
                retry,
                postRequestIdToken;
            return __generator(_a, function(_b) {
                switch (_b.label) {
                    case 0:
                        if (!AuthHttpRequest.initCalled) {
                            throw Error("init function not called");
                        }
                        (0, logger_1.logDebugMessage)("doRequest: start of fetch interception");
                        doNotDoInterception = false;
                        try {
                            doNotDoInterception =
                                (typeof url === "string" &&
                                    !(0, utils_1.shouldDoInterceptionBasedOnUrl)(
                                        url,
                                        AuthHttpRequest.config.apiDomain,
                                        AuthHttpRequest.config.sessionTokenBackendDomain
                                    )) ||
                                (url !== undefined &&
                                typeof url.url === "string" && // this is because url can be an object like {method: ..., url: ...}
                                    !(0, utils_1.shouldDoInterceptionBasedOnUrl)(
                                        url.url,
                                        AuthHttpRequest.config.apiDomain,
                                        AuthHttpRequest.config.sessionTokenBackendDomain
                                    ));
                        } catch (err) {
                            if (err.message === "Please provide a valid domain name") {
                                (0, logger_1.logDebugMessage)(
                                    "doRequest: Trying shouldDoInterceptionBasedOnUrl with location.origin"
                                );
                                // .origin gives the port as well..
                                doNotDoInterception = !(0, utils_1.shouldDoInterceptionBasedOnUrl)(
                                    windowHandler_1.default.getReferenceOrThrow().windowHandler.location.getOrigin(),
                                    AuthHttpRequest.config.apiDomain,
                                    AuthHttpRequest.config.sessionTokenBackendDomain
                                );
                            } else {
                                throw err;
                            }
                        }
                        (0,
                        logger_1.logDebugMessage)("doRequest: Value of doNotDoInterception: " + doNotDoInterception);
                        if (!doNotDoInterception) return [3 /*break*/, 2];
                        (0, logger_1.logDebugMessage)("doRequest: Returning without interception");
                        return [4 /*yield*/, httpCall(config)];
                    case 1:
                        return [2 /*return*/, _b.sent()];
                    case 2:
                        (0, logger_1.logDebugMessage)("doRequest: Interception started");
                        processState_1.ProcessState.getInstance().addState(
                            processState_1.PROCESS_STATE.CALLING_INTERCEPTION_REQUEST
                        );
                        _b.label = 3;
                    case 3:
                        _b.trys.push([3, , 17, 22]);
                        returnObj = undefined;
                        _b.label = 4;
                    case 4:
                        if (!true) return [3 /*break*/, 16];
                        return [4 /*yield*/, getLocalSessionState(true)];
                    case 5:
                        preRequestLSS = _b.sent();
                        clonedHeaders = new Headers(
                            config !== undefined && config.headers !== undefined ? config.headers : url.headers
                        );
                        configWithAntiCsrf = __assign(__assign({}, config), { headers: clonedHeaders });
                        if (!(preRequestLSS.status === "EXISTS")) return [3 /*break*/, 7];
                        return [4 /*yield*/, AntiCsrfToken.getToken(preRequestLSS.lastRefreshAttempt)];
                    case 6:
                        antiCsrfToken = _b.sent();
                        if (antiCsrfToken !== undefined) {
                            (0, logger_1.logDebugMessage)("doRequest: Adding anti-csrf token to request");
                            clonedHeaders.set("anti-csrf", antiCsrfToken);
                        }
                        _b.label = 7;
                    case 7:
                        if (AuthHttpRequest.config.autoAddCredentials) {
                            (0, logger_1.logDebugMessage)("doRequest: Adding credentials include");
                            if (configWithAntiCsrf === undefined) {
                                configWithAntiCsrf = {
                                    credentials: "include"
                                };
                            } else if (configWithAntiCsrf.credentials === undefined) {
                                configWithAntiCsrf = __assign(__assign({}, configWithAntiCsrf), {
                                    credentials: "include"
                                });
                            }
                        }
                        // adding rid for anti-csrf protection: Anti-csrf via custom header
                        if (!clonedHeaders.has("rid")) {
                            (0, logger_1.logDebugMessage)("doRequest: Adding rid header: anti-csrf");
                            clonedHeaders.set("rid", "anti-csrf");
                        } else {
                            (0, logger_1.logDebugMessage)("doRequest: rid header was already there in request");
                        }
                        (0,
                        logger_1.logDebugMessage)("doRequest: Adding st-auth-mode header: " + AuthHttpRequest.config.tokenTransferMethod);
                        clonedHeaders.set("st-auth-mode", AuthHttpRequest.config.tokenTransferMethod);
                        return [4 /*yield*/, setTokenHeadersIfRequired(clonedHeaders)];
                    case 8:
                        _b.sent();
                        (0, logger_1.logDebugMessage)("doRequest: Making user's http call");
                        return [4 /*yield*/, httpCall(configWithAntiCsrf)];
                    case 9:
                        response = _b.sent();
                        (0, logger_1.logDebugMessage)("doRequest: User's http call ended");
                        return [4 /*yield*/, saveTokensFromHeaders(response)];
                    case 10:
                        _b.sent();
                        if (!(response.status === AuthHttpRequest.config.sessionExpiredStatusCode))
                            return [3 /*break*/, 12];
                        (0, logger_1.logDebugMessage)("doRequest: Status code is: " + response.status);
                        return [4 /*yield*/, onUnauthorisedResponse(preRequestLSS)];
                    case 11:
                        retry = _b.sent();
                        if (retry.result !== "RETRY") {
                            (0, logger_1.logDebugMessage)("doRequest: Not retrying original request");
                            returnObj = retry.error !== undefined ? retry.error : response;
                            return [3 /*break*/, 16];
                        }
                        (0, logger_1.logDebugMessage)("doRequest: Retrying original request");
                        return [3 /*break*/, 15];
                    case 12:
                        if (!(response.status === AuthHttpRequest.config.invalidClaimStatusCode))
                            return [3 /*break*/, 14];
                        return [4 /*yield*/, onInvalidClaimResponse(response)];
                    case 13:
                        _b.sent();
                        _b.label = 14;
                    case 14:
                        fireSessionUpdateEventsIfNecessary(
                            preRequestLSS.status === "EXISTS",
                            response.status,
                            response.headers.get("front-token")
                        );
                        return [2 /*return*/, response];
                    case 15:
                        return [3 /*break*/, 4];
                    case 16:
                        // if it comes here, means we breaked. which happens only if we have logged out.
                        return [2 /*return*/, returnObj];
                    case 17:
                        return [4 /*yield*/, getLocalSessionState(false)];
                    case 18:
                        postRequestIdToken = _b.sent();
                        if (!(postRequestIdToken.status === "NOT_EXISTS")) return [3 /*break*/, 21];
                        (0,
                        logger_1.logDebugMessage)("doRequest: local session doesn't exist, so removing anti-csrf and sFrontToken");
                        return [4 /*yield*/, AntiCsrfToken.removeToken()];
                    case 19:
                        _b.sent();
                        return [4 /*yield*/, FrontToken.removeToken()];
                    case 20:
                        _b.sent();
                        _b.label = 21;
                    case 21:
                        return [7 /*endfinally*/];
                    case 22:
                        return [2 /*return*/];
                }
            });
        });
    };
    AuthHttpRequest.attemptRefreshingSession = function() {
        return __awaiter(void 0, void 0, void 0, function() {
            var preRequestIdToken, refresh;
            return __generator(_a, function(_b) {
                switch (_b.label) {
                    case 0:
                        if (!AuthHttpRequest.initCalled) {
                            throw Error("init function not called");
                        }
                        return [4 /*yield*/, getLocalSessionState(false)];
                    case 1:
                        preRequestIdToken = _b.sent();
                        return [4 /*yield*/, onUnauthorisedResponse(preRequestIdToken)];
                    case 2:
                        refresh = _b.sent();
                        if (refresh.result === "API_ERROR") {
                            throw refresh.error;
                        }
                        return [2 /*return*/, refresh.result === "RETRY"];
                }
            });
        });
    };
    return AuthHttpRequest;
})();
exports.default = AuthHttpRequest;
var LAST_REFRESH_ATTEMPT_NAME = "st-last-refresh-attempt";
var REFRESH_TOKEN_NAME = "st-refresh-token";
var ACCESS_TOKEN_NAME = "st-access-token";
var ANTI_CSRF_NAME = "sAntiCsrf";
var FRONT_TOKEN_NAME = "sFrontToken";
/**
 * @description attempts to call the refresh token API each time we are sure the session has expired, or it throws an error or,
 * or the ID_COOKIE_NAME has changed value -> which may mean that we have a new set of tokens.
 */
function onUnauthorisedResponse(preRequestLSS) {
    return __awaiter(this, void 0, void 0, function() {
        var lock, postLockLSS, headers, antiCsrfToken, preAPIResult, response, error_1, idCookieValue;
        return __generator(this, function(_b) {
            switch (_b.label) {
                case 0:
                    lock = new browser_tabs_lock_1.default();
                    _b.label = 1;
                case 1:
                    if (!true) return [3 /*break*/, 24];
                    (0, logger_1.logDebugMessage)("onUnauthorisedResponse: trying to acquire lock");
                    return [4 /*yield*/, lock.acquireLock("REFRESH_TOKEN_USE", 1000)];
                case 2:
                    if (!_b.sent()) return [3 /*break*/, 22];
                    (0, logger_1.logDebugMessage)("onUnauthorisedResponse: lock acquired");
                    _b.label = 3;
                case 3:
                    _b.trys.push([3, 14, 16, 22]);
                    return [4 /*yield*/, getLocalSessionState(false)];
                case 4:
                    postLockLSS = _b.sent();
                    if (postLockLSS.status === "NOT_EXISTS") {
                        (0, logger_1.logDebugMessage)(
                            "onUnauthorisedResponse: Not refreshing because local session state is NOT_EXISTS"
                        );
                        // if it comes here, it means a request was made thinking
                        // that the session exists, but it doesn't actually exist.
                        AuthHttpRequest.config.onHandleEvent({
                            action: "UNAUTHORISED",
                            sessionExpiredOrRevoked: false,
                            userContext: {}
                        });
                        return [2 /*return*/, { result: "SESSION_EXPIRED" }];
                    }
                    if (
                        postLockLSS.status !== preRequestLSS.status ||
                        (postLockLSS.status === "EXISTS" &&
                            preRequestLSS.status === "EXISTS" &&
                            postLockLSS.lastRefreshAttempt !== preRequestLSS.lastRefreshAttempt)
                    ) {
                        (0, logger_1.logDebugMessage)(
                            "onUnauthorisedResponse: Retrying early because pre and post id refresh tokens don't match"
                        );
                        // means that some other process has already called this API and succeeded. so we need to call it again
                        return [2 /*return*/, { result: "RETRY" }];
                    }
                    return [4 /*yield*/, saveRefreshAttempt()];
                case 5:
                    _b.sent();
                    headers = new Headers();
                    if (!(preRequestLSS.status === "EXISTS")) return [3 /*break*/, 7];
                    return [4 /*yield*/, AntiCsrfToken.getToken(preRequestLSS.lastRefreshAttempt)];
                case 6:
                    antiCsrfToken = _b.sent();
                    if (antiCsrfToken !== undefined) {
                        (0, logger_1.logDebugMessage)(
                            "onUnauthorisedResponse: Adding anti-csrf token to refresh API call"
                        );
                        headers.set("anti-csrf", antiCsrfToken);
                    }
                    _b.label = 7;
                case 7:
                    (0,
                    logger_1.logDebugMessage)("onUnauthorisedResponse: Adding rid and fdi-versions to refresh call header");
                    headers.set("rid", AuthHttpRequest.rid);
                    headers.set("fdi-version", version_1.supported_fdi.join(","));
                    (0,
                    logger_1.logDebugMessage)("onUnauthorisedResponse: Adding st-auth-mode header: " + AuthHttpRequest.config.tokenTransferMethod);
                    headers.set("st-auth-mode", AuthHttpRequest.config.tokenTransferMethod);
                    return [4 /*yield*/, setTokenHeadersIfRequired(headers, true)];
                case 8:
                    _b.sent();
                    (0, logger_1.logDebugMessage)("onUnauthorisedResponse: Calling refresh pre API hook");
                    return [
                        4 /*yield*/,
                        AuthHttpRequest.config.preAPIHook({
                            action: "REFRESH_SESSION",
                            requestInit: {
                                method: "post",
                                credentials: "include",
                                headers: headers
                            },
                            url: AuthHttpRequest.refreshTokenUrl,
                            userContext: {}
                        })
                    ];
                case 9:
                    preAPIResult = _b.sent();
                    (0, logger_1.logDebugMessage)("onUnauthorisedResponse: Making refresh call");
                    return [
                        4 /*yield*/,
                        AuthHttpRequest.env.__supertokensOriginalFetch(preAPIResult.url, preAPIResult.requestInit)
                    ];
                case 10:
                    response = _b.sent();
                    (0, logger_1.logDebugMessage)("onUnauthorisedResponse: Refresh call ended");
                    return [4 /*yield*/, saveTokensFromHeaders(response)];
                case 11:
                    _b.sent();
                    (0, logger_1.logDebugMessage)("onUnauthorisedResponse: Refresh status code is: " + response.status);
                    // there is a case where frontend still has id refresh token, but backend doesn't get it. In this event, session expired error will be thrown and the frontend should remove this token
                    fireSessionUpdateEventsIfNecessary(
                        preRequestLSS.status === "EXISTS",
                        response.status,
                        response.headers.get("front-token")
                    );
                    if (response.status >= 300) {
                        throw response;
                    }
                    return [
                        4 /*yield*/,
                        AuthHttpRequest.config.postAPIHook({
                            action: "REFRESH_SESSION",
                            fetchResponse: response.clone(),
                            requestInit: preAPIResult.requestInit,
                            url: preAPIResult.url,
                            userContext: {}
                        })
                    ];
                case 12:
                    _b.sent();
                    return [4 /*yield*/, getLocalSessionState(false)];
                case 13:
                    if (_b.sent().status === "NOT_EXISTS") {
                        (0, logger_1.logDebugMessage)(
                            "onUnauthorisedResponse: local session doesn't exist, so returning session expired"
                        );
                        // The execution should never come here.. but just in case.
                        // removed by server during refresh. So we logout
                        // we do not send "UNAUTHORISED" event here because
                        // this is a result of the refresh API returning a session expiry, which
                        // means that the frontend did not know for sure that the session existed
                        // in the first place.
                        return [2 /*return*/, { result: "SESSION_EXPIRED" }];
                    }
                    AuthHttpRequest.config.onHandleEvent({
                        action: "REFRESH_SESSION",
                        userContext: {}
                    });
                    (0, logger_1.logDebugMessage)("onUnauthorisedResponse: Sending RETRY signal");
                    return [2 /*return*/, { result: "RETRY" }];
                case 14:
                    error_1 = _b.sent();
                    return [4 /*yield*/, getLocalSessionState(false)];
                case 15:
                    if (_b.sent().status === "NOT_EXISTS") {
                        (0, logger_1.logDebugMessage)(
                            "onUnauthorisedResponse: local session doesn't exist, so returning session expired"
                        );
                        // removed by server.
                        // we do not send "UNAUTHORISED" event here because
                        // this is a result of the refresh API returning a session expiry, which
                        // means that the frontend did not know for sure that the session existed
                        // in the first place.
                        return [2 /*return*/, { result: "SESSION_EXPIRED", error: error_1 }];
                    }
                    (0, logger_1.logDebugMessage)("onUnauthorisedResponse: sending API_ERROR");
                    return [2 /*return*/, { result: "API_ERROR", error: error_1 }];
                case 16:
                    return [4 /*yield*/, lock.releaseLock("REFRESH_TOKEN_USE")];
                case 17:
                    _b.sent();
                    (0, logger_1.logDebugMessage)("onUnauthorisedResponse: Released lock");
                    return [4 /*yield*/, getLocalSessionState(false)];
                case 18:
                    if (!(_b.sent().status === "NOT_EXISTS")) return [3 /*break*/, 21];
                    (0,
                    logger_1.logDebugMessage)("onUnauthorisedResponse: local session doesn't exist, so removing anti-csrf and sFrontToken");
                    return [4 /*yield*/, AntiCsrfToken.removeToken()];
                case 19:
                    _b.sent();
                    return [4 /*yield*/, FrontToken.removeToken()];
                case 20:
                    _b.sent();
                    _b.label = 21;
                case 21:
                    return [7 /*endfinally*/];
                case 22:
                    return [4 /*yield*/, getLocalSessionState(false)];
                case 23:
                    idCookieValue = _b.sent();
                    if (idCookieValue.status === "NOT_EXISTS") {
                        (0, logger_1.logDebugMessage)(
                            "onUnauthorisedResponse: lock acquired failed and local session doesn't exist, so sending SESSION_EXPIRED"
                        );
                        // removed by server. So we logout
                        return [2 /*return*/, { result: "SESSION_EXPIRED" }];
                    } else {
                        if (
                            idCookieValue.status !== preRequestLSS.status ||
                            (idCookieValue.status === "EXISTS" &&
                                preRequestLSS.status === "EXISTS" &&
                                idCookieValue.lastRefreshAttempt !== preRequestLSS.lastRefreshAttempt)
                        ) {
                            (0, logger_1.logDebugMessage)(
                                "onUnauthorisedResponse: lock acquired failed and retrying early because pre and post id refresh tokens don't match"
                            );
                            return [2 /*return*/, { result: "RETRY" }];
                        }
                        // here we try to call the API again since we probably failed to acquire lock and nothing has changed.
                    }
                    return [3 /*break*/, 1];
                case 24:
                    return [2 /*return*/];
            }
        });
    });
}
exports.onUnauthorisedResponse = onUnauthorisedResponse;
function onTokenUpdate() {
    (0, logger_1.logDebugMessage)("onTokenUpdate: firing ACCESS_TOKEN_PAYLOAD_UPDATED event");
    AuthHttpRequest.config.onHandleEvent({
        action: "ACCESS_TOKEN_PAYLOAD_UPDATED",
        userContext: {}
    });
}
exports.onTokenUpdate = onTokenUpdate;
function onInvalidClaimResponse(response) {
    return __awaiter(this, void 0, void 0, function() {
        var claimValidationErrors, _b;
        return __generator(this, function(_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 2, , 3]);
                    return [
                        4 /*yield*/,
                        AuthHttpRequest.recipeImpl.getInvalidClaimsFromResponse({
                            response: response,
                            userContext: {}
                        })
                    ];
                case 1:
                    claimValidationErrors = _c.sent();
                    // This shouldn't be undefined normally, but since we can't be certain about the shape of the response object so we check it like this.
                    // It could still be something else, but chance of that happening by accident is really low.
                    if (claimValidationErrors) {
                        AuthHttpRequest.config.onHandleEvent({
                            action: "API_INVALID_CLAIM",
                            claimValidationErrors: claimValidationErrors,
                            userContext: {}
                        });
                    }
                    return [3 /*break*/, 3];
                case 2:
                    _b = _c.sent();
                    return [3 /*break*/, 3];
                case 3:
                    return [2 /*return*/];
            }
        });
    });
}
exports.onInvalidClaimResponse = onInvalidClaimResponse;
// if tryRefresh is true & this token doesn't exist, we try and refresh the session
// else we return undefined.
function getLocalSessionState(tryRefresh) {
    return __awaiter(this, void 0, void 0, function() {
        var lastRefreshAttempt, frontTokenExists, response, res;
        return __generator(this, function(_b) {
            switch (_b.label) {
                case 0:
                    (0, logger_1.logDebugMessage)("getLocalSessionState: called");
                    return [4 /*yield*/, getFromCookies(LAST_REFRESH_ATTEMPT_NAME)];
                case 1:
                    lastRefreshAttempt = _b.sent();
                    return [4 /*yield*/, FrontToken.doesTokenExists()];
                case 2:
                    frontTokenExists = _b.sent();
                    if (!(frontTokenExists && lastRefreshAttempt !== undefined)) return [3 /*break*/, 3];
                    (0,
                    logger_1.logDebugMessage)("getLocalSessionState: returning EXISTS since both frontToken and lastRefreshAttempt exists");
                    return [2 /*return*/, { status: "EXISTS", lastRefreshAttempt: lastRefreshAttempt }];
                case 3:
                    if (!lastRefreshAttempt) return [3 /*break*/, 4];
                    (0,
                    logger_1.logDebugMessage)("getLocalSessionState: returning NOT_EXISTS since frontToken was cleared but lastRefreshAttempt exists");
                    return [2 /*return*/, { status: "NOT_EXISTS" }];
                case 4:
                    response = {
                        status: "MAY_EXIST"
                    };
                    if (!tryRefresh) return [3 /*break*/, 7];
                    (0, logger_1.logDebugMessage)("getLocalSessionState: trying to refresh");
                    return [4 /*yield*/, onUnauthorisedResponse(response)];
                case 5:
                    res = _b.sent();
                    if (res.result !== "RETRY") {
                        (0, logger_1.logDebugMessage)(
                            "getLocalSessionState: return NOT_EXISTS in case error from backend" + res.result
                        );
                        // in case the backend is not working, we treat it as the session not existing...
                        return [
                            2 /*return*/,
                            {
                                status: "NOT_EXISTS"
                            }
                        ];
                    }
                    (0, logger_1.logDebugMessage)("getLocalSessionState: Retrying post refresh");
                    return [4 /*yield*/, getLocalSessionState(tryRefresh)];
                case 6:
                    return [2 /*return*/, _b.sent()];
                case 7:
                    (0, logger_1.logDebugMessage)("getLocalSessionState: returning: " + response.status);
                    return [2 /*return*/, response];
            }
        });
    });
}
exports.getLocalSessionState = getLocalSessionState;
function getStorageNameForToken(tokenType) {
    switch (tokenType) {
        case "access":
            return ACCESS_TOKEN_NAME;
        case "refresh":
            return REFRESH_TOKEN_NAME;
    }
}
exports.getStorageNameForToken = getStorageNameForToken;
function setToken(tokenType, value, expiry) {
    var name = getStorageNameForToken(tokenType);
    // if the value of the token is "remove", it means
    // the session is being removed. So we set it to "remove" in the
    // cookie. This way, when we query for this token, we will return
    // undefined (see getLocalSessionState), and not refresh the session
    // unnecessarily.
    (0, logger_1.logDebugMessage)("setToken: saved ".concat(tokenType, " token into cookies"));
    return storeInCookies(name, value, expiry);
}
exports.setToken = setToken;
function storeInCookies(name, value, expiry) {
    var expires = "Fri, 31 Dec 9999 23:59:59 GMT";
    if (value !== "remove" && expiry !== Number.MAX_SAFE_INTEGER) {
        // we must always respect this expiry and not set it to infinite
        // cause this ties into the session's lifetime. If we set this
        // to infinite, then a session may not exist, and this will exist,
        // then for example, if we check a session exists, and this says yes,
        // then if we getAccessTokenPayload, that will attempt a session refresh which will fail.
        // Another reason to respect this is that if we don't, then signOut will
        // call the API which will return 200 (no 401 cause the API thinks no session exists),
        // in which case, we will not end up firing the SIGN_OUT on handle event.
        expires = new Date(expiry).toUTCString();
    }
    var domain = AuthHttpRequest.config.sessionTokenFrontendDomain;
    if (
        domain === "localhost" ||
        domain === windowHandler_1.default.getReferenceOrThrow().windowHandler.location.getHostName()
    ) {
        // since some browsers ignore cookies with domain set to localhost
        // see https://github.com/supertokens/supertokens-website/issues/25
        return cookieHandler_1.default.getReferenceOrThrow().cookieHandler.setCookie(
            ""
                .concat(name, "=")
                .concat(value, ";expires=")
                .concat(expires, ";path=/;samesite=")
                .concat(AuthHttpRequest.config.isInIframe ? "none;secure" : "lax")
        );
    } else {
        return cookieHandler_1.default.getReferenceOrThrow().cookieHandler.setCookie(
            ""
                .concat(name, "=")
                .concat(value, ";expires=")
                .concat(expires, ";domain=")
                .concat(domain, ";path=/;samesite=")
                .concat(AuthHttpRequest.config.isInIframe ? "none;secure" : "lax")
        );
    }
}
function getToken(tokenType) {
    return __awaiter(this, void 0, void 0, function() {
        var name;
        return __generator(this, function(_b) {
            name = getStorageNameForToken(tokenType);
            return [2 /*return*/, getFromCookies(name)];
        });
    });
}
exports.getToken = getToken;
function getFromCookies(name) {
    return __awaiter(this, void 0, void 0, function() {
        var value, _b, parts, last;
        return __generator(this, function(_c) {
            switch (_c.label) {
                case 0:
                    _b = "; ";
                    return [4 /*yield*/, cookieHandler_1.default.getReferenceOrThrow().cookieHandler.getCookie()];
                case 1:
                    value = _b + _c.sent();
                    parts = value.split("; " + name + "=");
                    if (parts.length >= 2) {
                        last = parts.pop();
                        if (last !== undefined) {
                            return [2 /*return*/, last.split(";").shift()];
                        }
                    }
                    return [2 /*return*/, undefined];
            }
        });
    });
}
function setTokenHeadersIfRequired(clonedHeaders, addRefreshToken) {
    if (addRefreshToken === void 0) {
        addRefreshToken = false;
    }
    return __awaiter(this, void 0, void 0, function() {
        var accessToken, refreshToken;
        return __generator(this, function(_b) {
            switch (_b.label) {
                case 0:
                    if (!(AuthHttpRequest.config.tokenTransferMethod === "header")) return [3 /*break*/, 3];
                    (0, logger_1.logDebugMessage)("setTokenHeaders: adding existing tokens as header");
                    return [4 /*yield*/, getToken("access")];
                case 1:
                    accessToken = _b.sent();
                    // the Headers class normalizes header names so we don't have to worry about casing
                    if (accessToken !== undefined && !clonedHeaders.has("Authorization")) {
                        (0, logger_1.logDebugMessage)("setTokenHeadersIfRequired: added authorization header");
                        clonedHeaders.set("Authorization", "Bearer ".concat(accessToken));
                    }
                    return [4 /*yield*/, getToken("refresh")];
                case 2:
                    refreshToken = _b.sent();
                    if (refreshToken && addRefreshToken) {
                        (0, logger_1.logDebugMessage)("setTokenHeadersIfRequired: added st-refresh-token header");
                        clonedHeaders.set("st-refresh-token", refreshToken);
                    }
                    _b.label = 3;
                case 3:
                    return [2 /*return*/];
            }
        });
    });
}
function saveTokensFromHeaders(response) {
    return __awaiter(this, void 0, void 0, function() {
        var refreshToken, _b, value, expiry, accessToken, _c, value, expiry, frontToken, antiCsrfToken, tok;
        return __generator(this, function(_d) {
            switch (_d.label) {
                case 0:
                    if (!(AuthHttpRequest.config.tokenTransferMethod === "header")) return [3 /*break*/, 6];
                    (0,
                    logger_1.logDebugMessage)("saveTokensFromHeaders: Saving updated tokens from the response headers");
                    refreshToken = response.headers.get("st-refresh-token");
                    if (!refreshToken) return [3 /*break*/, 2];
                    (_b = refreshToken.split(";")), (value = _b[0]), (expiry = _b[1]);
                    return [4 /*yield*/, setToken("refresh", value, Number.parseInt(expiry))];
                case 1:
                    _d.sent();
                    _d.label = 2;
                case 2:
                    accessToken = response.headers.get("st-access-token");
                    if (!accessToken) return [3 /*break*/, 4];
                    (_c = accessToken.split(";")), (value = _c[0]), (expiry = _c[1]);
                    return [4 /*yield*/, setToken("access", value, Number.parseInt(expiry))];
                case 3:
                    _d.sent();
                    _d.label = 4;
                case 4:
                    (0,
                    logger_1.logDebugMessage)("saveTokensFromHeaders: Removing AntiCsrfToken if exists since we are in header mode");
                    return [4 /*yield*/, AntiCsrfToken.removeToken()];
                case 5:
                    _d.sent();
                    _d.label = 6;
                case 6:
                    frontToken = response.headers.get("front-token");
                    if (!frontToken) return [3 /*break*/, 8];
                    (0, logger_1.logDebugMessage)("doRequest: Setting sFrontToken: " + frontToken);
                    return [4 /*yield*/, FrontToken.setItem(frontToken)];
                case 7:
                    _d.sent();
                    _d.label = 8;
                case 8:
                    antiCsrfToken = response.headers.get("anti-csrf");
                    if (!antiCsrfToken) return [3 /*break*/, 11];
                    return [4 /*yield*/, getLocalSessionState(true)];
                case 9:
                    tok = _d.sent();
                    if (!(tok.status === "EXISTS")) return [3 /*break*/, 11];
                    (0, logger_1.logDebugMessage)("doRequest: Setting anti-csrf token");
                    return [4 /*yield*/, AntiCsrfToken.setItem(tok.lastRefreshAttempt, antiCsrfToken)];
                case 10:
                    _d.sent();
                    _d.label = 11;
                case 11:
                    return [2 /*return*/];
            }
        });
    });
}
function saveRefreshAttempt() {
    return __awaiter(this, void 0, void 0, function() {
        var now;
        return __generator(this, function(_b) {
            switch (_b.label) {
                case 0:
                    (0, logger_1.logDebugMessage)("saveRefreshAttempt: called");
                    now = Date.now().toString();
                    (0, logger_1.logDebugMessage)("saveRefreshAttempt: setting " + now);
                    return [4 /*yield*/, storeInCookies(LAST_REFRESH_ATTEMPT_NAME, now, Number.MAX_SAFE_INTEGER)];
                case 1:
                    _b.sent();
                    return [2 /*return*/];
            }
        });
    });
}
exports.saveRefreshAttempt = saveRefreshAttempt;
function getAntiCSRFToken() {
    return __awaiter(this, void 0, void 0, function() {
        function getAntiCSRFromCookie() {
            return __awaiter(this, void 0, void 0, function() {
                var value, _b, parts, last, temp;
                return __generator(this, function(_c) {
                    switch (_c.label) {
                        case 0:
                            _b = "; ";
                            return [
                                4 /*yield*/,
                                cookieHandler_1.default.getReferenceOrThrow().cookieHandler.getCookie()
                            ];
                        case 1:
                            value = _b + _c.sent();
                            parts = value.split("; " + ANTI_CSRF_NAME + "=");
                            if (parts.length >= 2) {
                                last = parts.pop();
                                if (last !== undefined) {
                                    temp = last.split(";").shift();
                                    if (temp === undefined) {
                                        return [2 /*return*/, null];
                                    }
                                    return [2 /*return*/, temp];
                                }
                            }
                            return [2 /*return*/, null];
                    }
                });
            });
        }
        var fromCookie;
        return __generator(this, function(_b) {
            switch (_b.label) {
                case 0:
                    (0, logger_1.logDebugMessage)("getAntiCSRFToken: called");
                    return [4 /*yield*/, getLocalSessionState(true)];
                case 1:
                    // we do not call doesSessionExist here cause the user might override that
                    // function here and then it may break the logic of our original implementation.
                    if (!(_b.sent().status === "EXISTS")) {
                        (0, logger_1.logDebugMessage)(
                            "getAntiCSRFToken: Returning because local session state != EXISTS"
                        );
                        return [2 /*return*/, null];
                    }
                    return [4 /*yield*/, getAntiCSRFromCookie()];
                case 2:
                    fromCookie = _b.sent();
                    (0, logger_1.logDebugMessage)("getAntiCSRFToken: returning: " + fromCookie);
                    return [2 /*return*/, fromCookie];
            }
        });
    });
}
// give antiCSRFToken as undefined to remove it.
function setAntiCSRF(antiCSRFToken) {
    return __awaiter(this, void 0, void 0, function() {
        return __generator(this, function(_b) {
            switch (_b.label) {
                case 0:
                    (0, logger_1.logDebugMessage)("setAntiCSRF: called: " + antiCSRFToken);
                    if (!(antiCSRFToken !== undefined)) return [3 /*break*/, 2];
                    return [4 /*yield*/, storeInCookies(ANTI_CSRF_NAME, antiCSRFToken, Number.MAX_SAFE_INTEGER)];
                case 1:
                    _b.sent();
                    return [3 /*break*/, 4];
                case 2:
                    return [4 /*yield*/, storeInCookies(ANTI_CSRF_NAME, "", 0)];
                case 3:
                    _b.sent();
                    _b.label = 4;
                case 4:
                    return [2 /*return*/];
            }
        });
    });
}
exports.setAntiCSRF = setAntiCSRF;
function getFrontTokenFromCookie() {
    return __awaiter(this, void 0, void 0, function() {
        var val;
        return __generator(this, function(_b) {
            switch (_b.label) {
                case 0:
                    (0, logger_1.logDebugMessage)("getFrontTokenFromCookie: called");
                    return [4 /*yield*/, getFromCookies(FRONT_TOKEN_NAME)];
                case 1:
                    val = _b.sent();
                    return [2 /*return*/, val === undefined ? null : val];
            }
        });
    });
}
function parseFrontToken(frontToken) {
    return JSON.parse(decodeURIComponent(escape(atob(frontToken))));
}
function getFrontToken() {
    return __awaiter(this, void 0, void 0, function() {
        var fromCookie;
        return __generator(this, function(_b) {
            switch (_b.label) {
                case 0:
                    (0, logger_1.logDebugMessage)("getFrontToken: called");
                    return [4 /*yield*/, getLocalSessionState(true)];
                case 1:
                    // we do not call doesSessionExist here cause the user might override that
                    // function here and then it may break the logic of our original implementation.
                    if (!(_b.sent().status === "EXISTS")) {
                        (0, logger_1.logDebugMessage)("getFrontToken: Returning because local session doesn't exist");
                        return [2 /*return*/, null];
                    }
                    return [4 /*yield*/, getFrontTokenFromCookie()];
                case 2:
                    fromCookie = _b.sent();
                    (0, logger_1.logDebugMessage)("getFrontToken: returning: " + fromCookie);
                    return [2 /*return*/, fromCookie];
            }
        });
    });
}
exports.getFrontToken = getFrontToken;
function setFrontToken(frontToken) {
    return __awaiter(this, void 0, void 0, function() {
        var oldToken, oldPayload, newPayload;
        return __generator(this, function(_b) {
            switch (_b.label) {
                case 0:
                    (0, logger_1.logDebugMessage)("setFrontToken: called");
                    return [4 /*yield*/, getFrontTokenFromCookie()];
                case 1:
                    oldToken = _b.sent();
                    if (oldToken !== null && frontToken !== undefined) {
                        oldPayload = parseFrontToken(oldToken).up;
                        newPayload = parseFrontToken(frontToken).up;
                        if (JSON.stringify(oldPayload) !== JSON.stringify(newPayload)) {
                            onTokenUpdate();
                        }
                    }
                    if (!(frontToken === undefined)) return [3 /*break*/, 3];
                    // clear the cookie
                    return [4 /*yield*/, storeInCookies(FRONT_TOKEN_NAME, "", 0)];
                case 2:
                    // clear the cookie
                    _b.sent();
                    return [3 /*break*/, 5];
                case 3:
                    return [4 /*yield*/, storeInCookies(FRONT_TOKEN_NAME, frontToken, Number.MAX_SAFE_INTEGER)];
                case 4:
                    _b.sent();
                    _b.label = 5;
                case 5:
                    return [2 /*return*/];
            }
        });
    });
}
exports.setFrontToken = setFrontToken;
function fireSessionUpdateEventsIfNecessary(wasLoggedIn, status, frontTokenHeader) {
    if (frontTokenHeader === undefined || frontTokenHeader === null) {
        // The access token (and the session) hasn't been updated.
        (0, logger_1.logDebugMessage)(
            "fireSessionUpdateEventsIfNecessary returning early because the front token was not updated"
        );
        return;
    }
    // if the current endpoint clears the session it'll set the front-token to remove
    // any other update means it's created or updated.
    var frontTokenExistsAfter = frontTokenHeader !== "remove";
    (0, logger_1.logDebugMessage)(
        "fireSessionUpdateEventsIfNecessary wasLoggedIn: "
            .concat(wasLoggedIn, " frontTokenExistsAfter: ")
            .concat(frontTokenExistsAfter, " status: ")
            .concat(status)
    );
    // we check for wasLoggedIn cause we don't want to fire an event unnecessarily on first app load
    if (wasLoggedIn) {
        if (!frontTokenExistsAfter) {
            // to query an API that returned 401 while the user was not logged in...
            if (status === AuthHttpRequest.config.sessionExpiredStatusCode) {
                (0, logger_1.logDebugMessage)("onUnauthorisedResponse: firing UNAUTHORISED event");
                AuthHttpRequest.config.onHandleEvent({
                    action: "UNAUTHORISED",
                    sessionExpiredOrRevoked: true,
                    userContext: {}
                });
            } else {
                (0, logger_1.logDebugMessage)("onUnauthorisedResponse: firing SIGN_OUT event");
                AuthHttpRequest.config.onHandleEvent({
                    action: "SIGN_OUT",
                    userContext: {}
                });
            }
        }
    } else if (frontTokenExistsAfter) {
        (0, logger_1.logDebugMessage)("onUnauthorisedResponse: firing SESSION_CREATED event");
        AuthHttpRequest.config.onHandleEvent({
            action: "SESSION_CREATED",
            userContext: {}
        });
    }
}
exports.fireSessionUpdateEventsIfNecessary = fireSessionUpdateEventsIfNecessary;
