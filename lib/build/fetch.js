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
exports.setFrontToken = exports.getFrontToken = exports.setAntiCSRF = exports.setIdRefreshToken = exports.getIdRefreshToken = exports.onInvalidClaimResponse = exports.onTokenUpdate = exports.onUnauthorisedResponse = exports.FrontToken = exports.AntiCsrfToken = void 0;
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
                        return [4 /*yield*/, getIdRefreshToken(false)];
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
                        (0, logger_1.logDebugMessage)("FrontToken.setItem: called");
                        return [4 /*yield*/, setFrontToken(frontToken)];
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
        (0, logger_1.logDebugMessage)("init: Input cookieDomain: " + config.cookieDomain);
        (0, logger_1.logDebugMessage)("init: Input isInIframe: " + config.isInIframe);
        (0, logger_1.logDebugMessage)("init: Input sessionExpiredStatusCode: " + config.sessionExpiredStatusCode);
        (0, logger_1.logDebugMessage)("init: Input sessionScope: " + config.sessionScope);
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
                preRequestIdToken,
                clonedHeaders,
                configWithAntiCsrf,
                antiCsrfToken,
                response,
                idRefreshToken,
                retry,
                antiCsrfToken,
                tok,
                frontToken,
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
                                        AuthHttpRequest.config.cookieDomain
                                    )) ||
                                (url !== undefined &&
                                typeof url.url === "string" && // this is because url can be an object like {method: ..., url: ...}
                                    !(0, utils_1.shouldDoInterceptionBasedOnUrl)(
                                        url.url,
                                        AuthHttpRequest.config.apiDomain,
                                        AuthHttpRequest.config.cookieDomain
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
                                    AuthHttpRequest.config.cookieDomain
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
                        _b.trys.push([3, , 22, 27]);
                        returnObj = undefined;
                        _b.label = 4;
                    case 4:
                        if (!true) return [3 /*break*/, 21];
                        return [4 /*yield*/, getIdRefreshToken(true)];
                    case 5:
                        preRequestIdToken = _b.sent();
                        clonedHeaders = new Headers(
                            config !== undefined && config.headers !== undefined ? config.headers : url.headers
                        );
                        configWithAntiCsrf = __assign(__assign({}, config), { headers: clonedHeaders });
                        if (!(preRequestIdToken.status === "EXISTS")) return [3 /*break*/, 7];
                        return [4 /*yield*/, AntiCsrfToken.getToken(preRequestIdToken.token)];
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
                        (0, logger_1.logDebugMessage)("doRequest: Making user's http call");
                        return [4 /*yield*/, httpCall(configWithAntiCsrf)];
                    case 8:
                        response = _b.sent();
                        (0, logger_1.logDebugMessage)("doRequest: User's http call ended");
                        idRefreshToken = response.headers.get("id-refresh-token");
                        if (!idRefreshToken) return [3 /*break*/, 10];
                        (0, logger_1.logDebugMessage)("doRequest: Setting sIRTFrontend: " + idRefreshToken);
                        return [4 /*yield*/, setIdRefreshToken(idRefreshToken, response.status)];
                    case 9:
                        _b.sent();
                        _b.label = 10;
                    case 10:
                        if (!(response.status === AuthHttpRequest.config.sessionExpiredStatusCode))
                            return [3 /*break*/, 12];
                        (0, logger_1.logDebugMessage)("doRequest: Status code is: " + response.status);
                        return [4 /*yield*/, onUnauthorisedResponse(preRequestIdToken)];
                    case 11:
                        retry = _b.sent();
                        if (retry.result !== "RETRY") {
                            (0, logger_1.logDebugMessage)("doRequest: Not retrying original request");
                            returnObj = retry.error !== undefined ? retry.error : response;
                            return [3 /*break*/, 21];
                        }
                        (0, logger_1.logDebugMessage)("doRequest: Retrying original request");
                        return [3 /*break*/, 20];
                    case 12:
                        if (!(response.status === AuthHttpRequest.config.invalidClaimStatusCode))
                            return [3 /*break*/, 14];
                        return [4 /*yield*/, onInvalidClaimResponse(response)];
                    case 13:
                        _b.sent();
                        _b.label = 14;
                    case 14:
                        antiCsrfToken = response.headers.get("anti-csrf");
                        if (!antiCsrfToken) return [3 /*break*/, 17];
                        return [4 /*yield*/, getIdRefreshToken(true)];
                    case 15:
                        tok = _b.sent();
                        if (!(tok.status === "EXISTS")) return [3 /*break*/, 17];
                        (0, logger_1.logDebugMessage)("doRequest: Setting anti-csrf token");
                        return [4 /*yield*/, AntiCsrfToken.setItem(tok.token, antiCsrfToken)];
                    case 16:
                        _b.sent();
                        _b.label = 17;
                    case 17:
                        frontToken = response.headers.get("front-token");
                        if (!frontToken) return [3 /*break*/, 19];
                        (0, logger_1.logDebugMessage)("doRequest: Setting sFrontToken: " + frontToken);
                        return [4 /*yield*/, FrontToken.setItem(frontToken)];
                    case 18:
                        _b.sent();
                        _b.label = 19;
                    case 19:
                        return [2 /*return*/, response];
                    case 20:
                        return [3 /*break*/, 4];
                    case 21:
                        // if it comes here, means we breaked. which happens only if we have logged out.
                        return [2 /*return*/, returnObj];
                    case 22:
                        return [4 /*yield*/, getIdRefreshToken(false)];
                    case 23:
                        postRequestIdToken = _b.sent();
                        if (!(postRequestIdToken.status === "NOT_EXISTS")) return [3 /*break*/, 26];
                        (0,
                        logger_1.logDebugMessage)("doRequest: sIRTFrontend doesn't exist, so removing anti-csrf and sFrontToken");
                        return [4 /*yield*/, AntiCsrfToken.removeToken()];
                    case 24:
                        _b.sent();
                        return [4 /*yield*/, FrontToken.removeToken()];
                    case 25:
                        _b.sent();
                        _b.label = 26;
                    case 26:
                        return [7 /*endfinally*/];
                    case 27:
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
                        return [4 /*yield*/, getIdRefreshToken(false)];
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
var ID_REFRESH_TOKEN_NAME = "sIRTFrontend";
var ANTI_CSRF_NAME = "sAntiCsrf";
var FRONT_TOKEN_NAME = "sFrontToken";
/**
 * @description attempts to call the refresh token API each time we are sure the session has expired, or it throws an error or,
 * or the ID_COOKIE_NAME has changed value -> which may mean that we have a new set of tokens.
 */
function onUnauthorisedResponse(preRequestIdToken) {
    return __awaiter(this, void 0, void 0, function() {
        var lock,
            postLockID,
            headers,
            antiCsrfToken_1,
            preAPIResult,
            response,
            removeIdRefreshToken,
            idRefreshToken,
            antiCsrfToken,
            tok,
            frontToken,
            error_1,
            idCookieValue;
        return __generator(this, function(_b) {
            switch (_b.label) {
                case 0:
                    lock = new browser_tabs_lock_1.default();
                    _b.label = 1;
                case 1:
                    if (!true) return [3 /*break*/, 30];
                    (0, logger_1.logDebugMessage)("onUnauthorisedResponse: trying to acquire lock");
                    return [4 /*yield*/, lock.acquireLock("REFRESH_TOKEN_USE", 1000)];
                case 2:
                    if (!_b.sent()) return [3 /*break*/, 28];
                    (0, logger_1.logDebugMessage)("onUnauthorisedResponse: lock acquired");
                    _b.label = 3;
                case 3:
                    _b.trys.push([3, 20, 22, 28]);
                    return [4 /*yield*/, getIdRefreshToken(false)];
                case 4:
                    postLockID = _b.sent();
                    if (postLockID.status === "NOT_EXISTS") {
                        (0, logger_1.logDebugMessage)(
                            "onUnauthorisedResponse: Not refreshing because sIRTFrontend is remove"
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
                        postLockID.status !== preRequestIdToken.status ||
                        (postLockID.status === "EXISTS" &&
                            preRequestIdToken.status === "EXISTS" &&
                            postLockID.token !== preRequestIdToken.token)
                    ) {
                        (0, logger_1.logDebugMessage)(
                            "onUnauthorisedResponse: Retrying early because pre and post id refresh tokens don't match"
                        );
                        // means that some other process has already called this API and succeeded. so we need to call it again
                        return [2 /*return*/, { result: "RETRY" }];
                    }
                    headers = {};
                    if (!(preRequestIdToken.status === "EXISTS")) return [3 /*break*/, 6];
                    return [4 /*yield*/, AntiCsrfToken.getToken(preRequestIdToken.token)];
                case 5:
                    antiCsrfToken_1 = _b.sent();
                    if (antiCsrfToken_1 !== undefined) {
                        (0, logger_1.logDebugMessage)(
                            "onUnauthorisedResponse: Adding anti-csrf token to refresh API call"
                        );
                        headers = __assign(__assign({}, headers), { "anti-csrf": antiCsrfToken_1 });
                    }
                    _b.label = 6;
                case 6:
                    (0,
                    logger_1.logDebugMessage)("onUnauthorisedResponse: Adding rid and fdi-versions to refresh call header");
                    headers = __assign(__assign({ rid: AuthHttpRequest.rid }, headers), {
                        "fdi-version": version_1.supported_fdi.join(",")
                    });
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
                case 7:
                    preAPIResult = _b.sent();
                    (0, logger_1.logDebugMessage)("onUnauthorisedResponse: Making refresh call");
                    return [
                        4 /*yield*/,
                        AuthHttpRequest.env.__supertokensOriginalFetch(preAPIResult.url, preAPIResult.requestInit)
                    ];
                case 8:
                    response = _b.sent();
                    (0, logger_1.logDebugMessage)("onUnauthorisedResponse: Refresh call ended");
                    removeIdRefreshToken = true;
                    idRefreshToken = response.headers.get("id-refresh-token");
                    if (!idRefreshToken) return [3 /*break*/, 10];
                    (0,
                    logger_1.logDebugMessage)("onUnauthorisedResponse: Setting sIRTFrontend from refresh API call: " + idRefreshToken);
                    return [4 /*yield*/, setIdRefreshToken(idRefreshToken, response.status)];
                case 9:
                    _b.sent();
                    removeIdRefreshToken = false;
                    _b.label = 10;
                case 10:
                    if (!(response.status === AuthHttpRequest.config.sessionExpiredStatusCode))
                        return [3 /*break*/, 12];
                    (0, logger_1.logDebugMessage)("onUnauthorisedResponse: Refresh status code is: " + response.status);
                    if (!removeIdRefreshToken) return [3 /*break*/, 12];
                    return [4 /*yield*/, setIdRefreshToken("remove", response.status)];
                case 11:
                    _b.sent();
                    _b.label = 12;
                case 12:
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
                case 13:
                    _b.sent();
                    return [4 /*yield*/, getIdRefreshToken(false)];
                case 14:
                    if (_b.sent().status === "NOT_EXISTS") {
                        (0, logger_1.logDebugMessage)(
                            "onUnauthorisedResponse: sIRTFrontend is remove, so returning session expired"
                        );
                        // The execution should never come here.. but just in case.
                        // removed by server. So we logout
                        // we do not send "UNAUTHORISED" event here because
                        // this is a result of the refresh API returning a session expiry, which
                        // means that the frontend did not know for sure that the session existed
                        // in the first place.
                        return [2 /*return*/, { result: "SESSION_EXPIRED" }];
                    }
                    antiCsrfToken = response.headers.get("anti-csrf");
                    if (!antiCsrfToken) return [3 /*break*/, 17];
                    return [4 /*yield*/, getIdRefreshToken(true)];
                case 15:
                    tok = _b.sent();
                    if (!(tok.status === "EXISTS")) return [3 /*break*/, 17];
                    (0, logger_1.logDebugMessage)("onUnauthorisedResponse: setting anti-csrf token");
                    return [4 /*yield*/, AntiCsrfToken.setItem(tok.token, antiCsrfToken)];
                case 16:
                    _b.sent();
                    _b.label = 17;
                case 17:
                    frontToken = response.headers.get("front-token");
                    if (!frontToken) return [3 /*break*/, 19];
                    (0, logger_1.logDebugMessage)("onUnauthorisedResponse: setting sFrontToken: " + frontToken);
                    return [4 /*yield*/, FrontToken.setItem(frontToken)];
                case 18:
                    _b.sent();
                    _b.label = 19;
                case 19:
                    AuthHttpRequest.config.onHandleEvent({
                        action: "REFRESH_SESSION",
                        userContext: {}
                    });
                    (0, logger_1.logDebugMessage)("onUnauthorisedResponse: Sending RETRY signal");
                    return [2 /*return*/, { result: "RETRY" }];
                case 20:
                    error_1 = _b.sent();
                    return [4 /*yield*/, getIdRefreshToken(false)];
                case 21:
                    if (_b.sent().status === "NOT_EXISTS") {
                        (0, logger_1.logDebugMessage)(
                            "onUnauthorisedResponse: sIRTFrontend is remove, so returning session expired"
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
                case 22:
                    return [4 /*yield*/, lock.releaseLock("REFRESH_TOKEN_USE")];
                case 23:
                    _b.sent();
                    (0, logger_1.logDebugMessage)("onUnauthorisedResponse: Released lock");
                    return [4 /*yield*/, getIdRefreshToken(false)];
                case 24:
                    if (!(_b.sent().status === "NOT_EXISTS")) return [3 /*break*/, 27];
                    (0,
                    logger_1.logDebugMessage)("onUnauthorisedResponse: sIRTFrontend is remove, so removing anti-csrf and sFrontToken");
                    return [4 /*yield*/, AntiCsrfToken.removeToken()];
                case 25:
                    _b.sent();
                    return [4 /*yield*/, FrontToken.removeToken()];
                case 26:
                    _b.sent();
                    _b.label = 27;
                case 27:
                    return [7 /*endfinally*/];
                case 28:
                    return [4 /*yield*/, getIdRefreshToken(false)];
                case 29:
                    idCookieValue = _b.sent();
                    if (idCookieValue.status === "NOT_EXISTS") {
                        (0, logger_1.logDebugMessage)(
                            "onUnauthorisedResponse: lock acquired failed and sIRTFrontend is remove, so sending SESSION_EXPIRED"
                        );
                        // removed by server. So we logout
                        return [2 /*return*/, { result: "SESSION_EXPIRED" }];
                    } else {
                        if (
                            idCookieValue.status !== preRequestIdToken.status ||
                            (idCookieValue.status === "EXISTS" &&
                                preRequestIdToken.status === "EXISTS" &&
                                idCookieValue.token !== preRequestIdToken.token)
                        ) {
                            (0, logger_1.logDebugMessage)(
                                "onUnauthorisedResponse: lock acquired failed and retrying early because pre and post id refresh tokens don't match"
                            );
                            return [2 /*return*/, { result: "RETRY" }];
                        }
                        // here we try to call the API again since we probably failed to acquire lock and nothing has changed.
                    }
                    return [3 /*break*/, 1];
                case 30:
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
function getIdRefreshToken(tryRefresh) {
    return __awaiter(this, void 0, void 0, function() {
        function getIdRefreshTokenFromLocal() {
            return __awaiter(this, void 0, void 0, function() {
                function getIDFromCookieOld() {
                    return __awaiter(this, void 0, void 0, function() {
                        var value, _b, parts, last;
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
                                    parts = value.split("; " + ID_REFRESH_TOKEN_NAME + "=");
                                    if (parts.length >= 2) {
                                        last = parts.pop();
                                        if (last === "remove") {
                                            // it means no session exists. This is different from
                                            // it being undefined since in that case a session may or may not exist.
                                            return [2 /*return*/, "remove"];
                                        }
                                        if (last !== undefined) {
                                            return [2 /*return*/, last.split(";").shift()];
                                        }
                                    }
                                    return [2 /*return*/, undefined];
                            }
                        });
                    });
                }
                var fromCookie;
                return __generator(this, function(_b) {
                    switch (_b.label) {
                        case 0:
                            return [4 /*yield*/, getIDFromCookieOld()];
                        case 1:
                            fromCookie = _b.sent();
                            return [2 /*return*/, fromCookie];
                    }
                });
            });
        }
        var token, response, res;
        return __generator(this, function(_b) {
            switch (_b.label) {
                case 0:
                    (0, logger_1.logDebugMessage)("getIdRefreshToken: called");
                    return [4 /*yield*/, getIdRefreshTokenFromLocal()];
                case 1:
                    token = _b.sent();
                    if (token === "remove") {
                        (0, logger_1.logDebugMessage)("getIdRefreshToken: is removed");
                        return [
                            2 /*return*/,
                            {
                                status: "NOT_EXISTS"
                            }
                        ];
                    }
                    if (!(token === undefined)) return [3 /*break*/, 5];
                    (0, logger_1.logDebugMessage)("getIdRefreshToken: is undefined");
                    response = {
                        status: "MAY_EXIST"
                    };
                    if (!tryRefresh) return [3 /*break*/, 4];
                    (0, logger_1.logDebugMessage)("getIdRefreshToken: trying to refresg");
                    return [4 /*yield*/, onUnauthorisedResponse(response)];
                case 2:
                    res = _b.sent();
                    if (res.result !== "RETRY") {
                        (0, logger_1.logDebugMessage)("getIdRefreshToken: false NOT_EXISTS in case error from backend");
                        // in case the backend is not working, we treat it as the session not existing...
                        return [
                            2 /*return*/,
                            {
                                status: "NOT_EXISTS"
                            }
                        ];
                    }
                    (0, logger_1.logDebugMessage)("getIdRefreshToken: Retrying post refresh");
                    return [4 /*yield*/, getIdRefreshToken(tryRefresh)];
                case 3:
                    return [2 /*return*/, _b.sent()];
                case 4:
                    (0, logger_1.logDebugMessage)("getIdRefreshToken: returning: " + response.status);
                    return [2 /*return*/, response];
                case 5:
                    (0, logger_1.logDebugMessage)("getIdRefreshToken: returning EXISTS: " + token);
                    return [
                        2 /*return*/,
                        {
                            status: "EXISTS",
                            token: token
                        }
                    ];
            }
        });
    });
}
exports.getIdRefreshToken = getIdRefreshToken;
function setIdRefreshToken(idRefreshToken, statusCode) {
    return __awaiter(this, void 0, void 0, function() {
        function setIDToCookie(idRefreshToken, domain) {
            return __awaiter(this, void 0, void 0, function() {
                var expires, cookieVal, splitted;
                return __generator(this, function(_b) {
                    switch (_b.label) {
                        case 0:
                            expires = "Fri, 31 Dec 9999 23:59:59 GMT";
                            cookieVal = "remove";
                            if (idRefreshToken !== "remove") {
                                splitted = idRefreshToken.split(";");
                                cookieVal = splitted[0];
                                // we must always respect this expiry and not set it to infinite
                                // cause this ties into the session's lifetime. If we set this
                                // to infinite, then a session may not exist, and this will exist,
                                // then for example, if we check a session exists, and this says yes,
                                // then if we getAccessTokenPayload, that will attempt a session refresh which will fail.
                                // Another reason to respect this is that if we don't, then signOut will
                                // call the API which will return 200 (no 401 cause the API thinks no session exists),
                                // in which case, we will not end up firing the SIGN_OUT on handle event.
                                expires = new Date(Number(splitted[1])).toUTCString();
                            }
                            if (
                                !(
                                    domain === "localhost" ||
                                    domain ===
                                        windowHandler_1.default
                                            .getReferenceOrThrow()
                                            .windowHandler.location.getHostName()
                                )
                            )
                                return [3 /*break*/, 2];
                            // since some browsers ignore cookies with domain set to localhost
                            // see https://github.com/supertokens/supertokens-website/issues/25
                            return [
                                4 /*yield*/,
                                cookieHandler_1.default.getReferenceOrThrow().cookieHandler.setCookie(
                                    ""
                                        .concat(ID_REFRESH_TOKEN_NAME, "=")
                                        .concat(cookieVal, ";expires=")
                                        .concat(expires, ";path=/;samesite=")
                                        .concat(AuthHttpRequest.config.isInIframe ? "none;secure" : "lax")
                                )
                            ];
                        case 1:
                            // since some browsers ignore cookies with domain set to localhost
                            // see https://github.com/supertokens/supertokens-website/issues/25
                            _b.sent();
                            return [3 /*break*/, 4];
                        case 2:
                            return [
                                4 /*yield*/,
                                cookieHandler_1.default.getReferenceOrThrow().cookieHandler.setCookie(
                                    ""
                                        .concat(ID_REFRESH_TOKEN_NAME, "=")
                                        .concat(cookieVal, ";expires=")
                                        .concat(expires, ";domain=")
                                        .concat(domain, ";path=/;samesite=")
                                        .concat(AuthHttpRequest.config.isInIframe ? "none;secure" : "lax")
                                )
                            ];
                        case 3:
                            _b.sent();
                            _b.label = 4;
                        case 4:
                            return [2 /*return*/];
                    }
                });
            });
        }
        var status;
        return __generator(this, function(_b) {
            switch (_b.label) {
                case 0:
                    (0, logger_1.logDebugMessage)("setIdRefreshToken: called");
                    return [4 /*yield*/, getIdRefreshToken(false)];
                case 1:
                    status = _b.sent().status;
                    (0, logger_1.logDebugMessage)("setIdRefreshToken: setting: " + idRefreshToken);
                    return [4 /*yield*/, setIDToCookie(idRefreshToken, AuthHttpRequest.config.sessionScope)];
                case 2:
                    _b.sent();
                    if (idRefreshToken === "remove" && status === "EXISTS") {
                        // we check for wasLoggedIn cause we don't want to fire an event
                        // unnecessarily on first app load or if the user tried
                        // to query an API that returned 401 while the user was not logged in...
                        if (statusCode === AuthHttpRequest.config.sessionExpiredStatusCode) {
                            (0, logger_1.logDebugMessage)("setIdRefreshToken: firing UNAUTHORISED event");
                            AuthHttpRequest.config.onHandleEvent({
                                action: "UNAUTHORISED",
                                sessionExpiredOrRevoked: true,
                                userContext: {}
                            });
                        } else {
                            (0, logger_1.logDebugMessage)("setIdRefreshToken: firing SIGN_OUT event");
                            AuthHttpRequest.config.onHandleEvent({
                                action: "SIGN_OUT",
                                userContext: {}
                            });
                        }
                    }
                    if (idRefreshToken !== "remove" && status === "NOT_EXISTS") {
                        (0, logger_1.logDebugMessage)("setIdRefreshToken: firing SESSION_CREATED event");
                        AuthHttpRequest.config.onHandleEvent({
                            action: "SESSION_CREATED",
                            userContext: {}
                        });
                    }
                    return [2 /*return*/];
            }
        });
    });
}
exports.setIdRefreshToken = setIdRefreshToken;
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
                    return [4 /*yield*/, getIdRefreshToken(true)];
                case 1:
                    // we do not call doesSessionExist here cause the user might override that
                    // function here and then it may break the logic of our original implementation.
                    if (!(_b.sent().status === "EXISTS")) {
                        (0, logger_1.logDebugMessage)("getAntiCSRFToken: Returning because sIRTFrontend != EXISTS");
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
        function setAntiCSRFToCookie(antiCSRFToken, domain) {
            return __awaiter(this, void 0, void 0, function() {
                var expires, cookieVal;
                return __generator(this, function(_b) {
                    switch (_b.label) {
                        case 0:
                            expires = "Thu, 01 Jan 1970 00:00:01 GMT";
                            cookieVal = "";
                            if (antiCSRFToken !== undefined) {
                                cookieVal = antiCSRFToken;
                                expires = undefined; // set cookie without expiry
                            }
                            if (
                                !(
                                    domain === "localhost" ||
                                    domain ===
                                        windowHandler_1.default
                                            .getReferenceOrThrow()
                                            .windowHandler.location.getHostName()
                                )
                            )
                                return [3 /*break*/, 5];
                            if (!(expires !== undefined)) return [3 /*break*/, 2];
                            return [
                                4 /*yield*/,
                                cookieHandler_1.default.getReferenceOrThrow().cookieHandler.setCookie(
                                    ""
                                        .concat(ANTI_CSRF_NAME, "=")
                                        .concat(cookieVal, ";expires=")
                                        .concat(expires, ";path=/;samesite=")
                                        .concat(AuthHttpRequest.config.isInIframe ? "none;secure" : "lax")
                                )
                            ];
                        case 1:
                            _b.sent();
                            return [3 /*break*/, 4];
                        case 2:
                            return [
                                4 /*yield*/,
                                cookieHandler_1.default.getReferenceOrThrow().cookieHandler.setCookie(
                                    ""
                                        .concat(ANTI_CSRF_NAME, "=")
                                        .concat(cookieVal, ";expires=Fri, 31 Dec 9999 23:59:59 GMT;path=/;samesite=")
                                        .concat(AuthHttpRequest.config.isInIframe ? "none;secure" : "lax")
                                )
                            ];
                        case 3:
                            _b.sent();
                            _b.label = 4;
                        case 4:
                            return [3 /*break*/, 9];
                        case 5:
                            if (!(expires !== undefined)) return [3 /*break*/, 7];
                            return [
                                4 /*yield*/,
                                cookieHandler_1.default.getReferenceOrThrow().cookieHandler.setCookie(
                                    ""
                                        .concat(ANTI_CSRF_NAME, "=")
                                        .concat(cookieVal, ";expires=")
                                        .concat(expires, ";domain=")
                                        .concat(domain, ";path=/;samesite=")
                                        .concat(AuthHttpRequest.config.isInIframe ? "none;secure" : "lax")
                                )
                            ];
                        case 6:
                            _b.sent();
                            return [3 /*break*/, 9];
                        case 7:
                            return [
                                4 /*yield*/,
                                cookieHandler_1.default.getReferenceOrThrow().cookieHandler.setCookie(
                                    ""
                                        .concat(ANTI_CSRF_NAME, "=")
                                        .concat(cookieVal, ";domain=")
                                        .concat(domain, ";expires=Fri, 31 Dec 9999 23:59:59 GMT;path=/;samesite=")
                                        .concat(AuthHttpRequest.config.isInIframe ? "none;secure" : "lax")
                                )
                            ];
                        case 8:
                            _b.sent();
                            _b.label = 9;
                        case 9:
                            return [2 /*return*/];
                    }
                });
            });
        }
        return __generator(this, function(_b) {
            switch (_b.label) {
                case 0:
                    (0, logger_1.logDebugMessage)("setAntiCSRF: called: " + antiCSRFToken);
                    return [4 /*yield*/, setAntiCSRFToCookie(antiCSRFToken, AuthHttpRequest.config.sessionScope)];
                case 1:
                    _b.sent();
                    return [2 /*return*/];
            }
        });
    });
}
exports.setAntiCSRF = setAntiCSRF;
function getFrontTokenFromCookie() {
    return __awaiter(this, void 0, void 0, function() {
        var value, _b, parts, last, temp;
        return __generator(this, function(_c) {
            switch (_c.label) {
                case 0:
                    (0, logger_1.logDebugMessage)("getFrontTokenFromCookie: called");
                    _b = "; ";
                    return [4 /*yield*/, cookieHandler_1.default.getReferenceOrThrow().cookieHandler.getCookie()];
                case 1:
                    value = _b + _c.sent();
                    parts = value.split("; " + FRONT_TOKEN_NAME + "=");
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
                    return [4 /*yield*/, getIdRefreshToken(true)];
                case 1:
                    // we do not call doesSessionExist here cause the user might override that
                    // function here and then it may break the logic of our original implementation.
                    if (!(_b.sent().status === "EXISTS")) {
                        (0, logger_1.logDebugMessage)("getFrontToken: Returning because sIRTFrontend != EXISTS");
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
        function setFrontTokenToCookie(frontToken, domain) {
            return __awaiter(this, void 0, void 0, function() {
                var expires, cookieVal;
                return __generator(this, function(_b) {
                    switch (_b.label) {
                        case 0:
                            expires = "Thu, 01 Jan 1970 00:00:01 GMT";
                            cookieVal = "";
                            if (frontToken !== undefined) {
                                cookieVal = frontToken;
                                expires = undefined; // set cookie without expiry
                            }
                            if (
                                !(
                                    domain === "localhost" ||
                                    domain ===
                                        windowHandler_1.default
                                            .getReferenceOrThrow()
                                            .windowHandler.location.getHostName()
                                )
                            )
                                return [3 /*break*/, 5];
                            if (!(expires !== undefined)) return [3 /*break*/, 2];
                            return [
                                4 /*yield*/,
                                cookieHandler_1.default.getReferenceOrThrow().cookieHandler.setCookie(
                                    ""
                                        .concat(FRONT_TOKEN_NAME, "=")
                                        .concat(cookieVal, ";expires=")
                                        .concat(expires, ";path=/;samesite=")
                                        .concat(AuthHttpRequest.config.isInIframe ? "none;secure" : "lax")
                                )
                            ];
                        case 1:
                            _b.sent();
                            return [3 /*break*/, 4];
                        case 2:
                            return [
                                4 /*yield*/,
                                cookieHandler_1.default.getReferenceOrThrow().cookieHandler.setCookie(
                                    ""
                                        .concat(FRONT_TOKEN_NAME, "=")
                                        .concat(cookieVal, ";expires=Fri, 31 Dec 9999 23:59:59 GMT;path=/;samesite=")
                                        .concat(AuthHttpRequest.config.isInIframe ? "none;secure" : "lax")
                                )
                            ];
                        case 3:
                            _b.sent();
                            _b.label = 4;
                        case 4:
                            return [3 /*break*/, 9];
                        case 5:
                            if (!(expires !== undefined)) return [3 /*break*/, 7];
                            return [
                                4 /*yield*/,
                                cookieHandler_1.default.getReferenceOrThrow().cookieHandler.setCookie(
                                    ""
                                        .concat(FRONT_TOKEN_NAME, "=")
                                        .concat(cookieVal, ";expires=")
                                        .concat(expires, ";domain=")
                                        .concat(domain, ";path=/;samesite=")
                                        .concat(AuthHttpRequest.config.isInIframe ? "none;secure" : "lax")
                                )
                            ];
                        case 6:
                            _b.sent();
                            return [3 /*break*/, 9];
                        case 7:
                            return [
                                4 /*yield*/,
                                cookieHandler_1.default.getReferenceOrThrow().cookieHandler.setCookie(
                                    ""
                                        .concat(FRONT_TOKEN_NAME, "=")
                                        .concat(cookieVal, ";domain=")
                                        .concat(domain, ";expires=Fri, 31 Dec 9999 23:59:59 GMT;path=/;samesite=")
                                        .concat(AuthHttpRequest.config.isInIframe ? "none;secure" : "lax")
                                )
                            ];
                        case 8:
                            _b.sent();
                            _b.label = 9;
                        case 9:
                            return [2 /*return*/];
                    }
                });
            });
        }
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
                    return [4 /*yield*/, setFrontTokenToCookie(frontToken, AuthHttpRequest.config.sessionScope)];
                case 2:
                    _b.sent();
                    return [2 /*return*/];
            }
        });
    });
}
exports.setFrontToken = setFrontToken;
