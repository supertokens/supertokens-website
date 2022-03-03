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
var AntiCsrfToken = /** @class */ (function() {
    function AntiCsrfToken() {}
    AntiCsrfToken.getToken = function(associatedIdRefreshToken) {
        return __awaiter(this, void 0, void 0, function() {
            var antiCsrf;
            return __generator(this, function(_a) {
                switch (_a.label) {
                    case 0:
                        if (associatedIdRefreshToken === undefined) {
                            AntiCsrfToken.tokenInfo = undefined;
                            return [2 /*return*/, undefined];
                        }
                        if (!(AntiCsrfToken.tokenInfo === undefined)) return [3 /*break*/, 2];
                        return [4 /*yield*/, getAntiCSRFToken()];
                    case 1:
                        antiCsrf = _a.sent();
                        if (antiCsrf === null) {
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
            var frontToken;
            return __generator(this, function(_a) {
                switch (_a.label) {
                    case 0:
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
                        return [2 /*return*/, JSON.parse(decodeURIComponent(escape(atob(frontToken))))];
                }
            });
        });
    };
    FrontToken.removeToken = function() {
        return __awaiter(this, void 0, void 0, function() {
            return __generator(this, function(_a) {
                switch (_a.label) {
                    case 0:
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
        AuthHttpRequest.env = utils_1.getWindowOrThrow().fetch === undefined ? global : utils_1.getWindowOrThrow();
        AuthHttpRequest.refreshTokenUrl = config.apiDomain + config.apiBasePath + "/session/refresh";
        AuthHttpRequest.signOutUrl = config.apiDomain + config.apiBasePath + "/signout";
        AuthHttpRequest.rid = "session";
        AuthHttpRequest.config = config;
        if (AuthHttpRequest.env.__supertokensOriginalFetch === undefined) {
            // this block contains code that is run just once per page load..
            // all items in this block are attached to the global env so that
            // even if the init function is called more than once (maybe across JS scripts),
            // things will not get created multiple times.
            AuthHttpRequest.env.__supertokensOriginalFetch = AuthHttpRequest.env.fetch.bind(AuthHttpRequest.env);
            AuthHttpRequest.env.__supertokensSessionRecipe = recipeImpl;
            AuthHttpRequest.env.fetch = AuthHttpRequest.env.__supertokensSessionRecipe.addFetchInterceptorsAndReturnModifiedFetch(
                {
                    originalFetch: AuthHttpRequest.env.__supertokensOriginalFetch,
                    config: config,
                    userContext: {}
                }
            );
        }
        AuthHttpRequest.recipeImpl = AuthHttpRequest.env.__supertokensSessionRecipe;
        AuthHttpRequest.initCalled = true;
    };
    AuthHttpRequest.initCalled = false;
    AuthHttpRequest.doRequest = function(httpCall, config, url) {
        return __awaiter(void 0, void 0, void 0, function() {
            var doNotDoInterception,
                returnObj,
                preRequestIdToken,
                configWithAntiCsrf,
                antiCsrfToken,
                response,
                idRefreshToken,
                retry,
                antiCsrfToken,
                tok,
                frontToken,
                postRequestIdToken;
            return __generator(this, function(_a) {
                switch (_a.label) {
                    case 0:
                        if (!AuthHttpRequest.initCalled) {
                            throw Error("init function not called");
                        }
                        doNotDoInterception = false;
                        try {
                            doNotDoInterception =
                                (typeof url === "string" &&
                                    !utils_1.shouldDoInterceptionBasedOnUrl(
                                        url,
                                        AuthHttpRequest.config.apiDomain,
                                        AuthHttpRequest.config.cookieDomain
                                    )) ||
                                (url !== undefined &&
                                typeof url.url === "string" && // this is because url can be an object like {method: ..., url: ...}
                                    !utils_1.shouldDoInterceptionBasedOnUrl(
                                        url.url,
                                        AuthHttpRequest.config.apiDomain,
                                        AuthHttpRequest.config.cookieDomain
                                    ));
                        } catch (err) {
                            if (err.message === "Please provide a valid domain name") {
                                // .origin gives the port as well..
                                doNotDoInterception = !utils_1.shouldDoInterceptionBasedOnUrl(
                                    window.location.origin,
                                    AuthHttpRequest.config.apiDomain,
                                    AuthHttpRequest.config.cookieDomain
                                );
                            } else {
                                throw err;
                            }
                        }
                        if (!doNotDoInterception) return [3 /*break*/, 2];
                        return [4 /*yield*/, httpCall(config)];
                    case 1:
                        return [2 /*return*/, _a.sent()];
                    case 2:
                        processState_1.ProcessState.getInstance().addState(
                            processState_1.PROCESS_STATE.CALLING_INTERCEPTION_REQUEST
                        );
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, , 20, 25]);
                        returnObj = undefined;
                        _a.label = 4;
                    case 4:
                        if (!true) return [3 /*break*/, 19];
                        return [4 /*yield*/, getIdRefreshToken(true)];
                    case 5:
                        preRequestIdToken = _a.sent();
                        configWithAntiCsrf = config;
                        if (!(preRequestIdToken.status === "EXISTS")) return [3 /*break*/, 7];
                        return [4 /*yield*/, AntiCsrfToken.getToken(preRequestIdToken.token)];
                    case 6:
                        antiCsrfToken = _a.sent();
                        if (antiCsrfToken !== undefined) {
                            configWithAntiCsrf = __assign(__assign({}, configWithAntiCsrf), {
                                headers:
                                    configWithAntiCsrf === undefined
                                        ? {
                                              "anti-csrf": antiCsrfToken
                                          }
                                        : __assign(__assign({}, configWithAntiCsrf.headers), {
                                              "anti-csrf": antiCsrfToken
                                          })
                            });
                        }
                        _a.label = 7;
                    case 7:
                        if (AuthHttpRequest.config.autoAddCredentials) {
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
                        configWithAntiCsrf = __assign(__assign({}, configWithAntiCsrf), {
                            headers:
                                configWithAntiCsrf === undefined
                                    ? {
                                          rid: "anti-csrf"
                                      }
                                    : __assign({ rid: "anti-csrf" }, configWithAntiCsrf.headers)
                        });
                        return [4 /*yield*/, httpCall(configWithAntiCsrf)];
                    case 8:
                        response = _a.sent();
                        idRefreshToken = response.headers.get("id-refresh-token");
                        if (!idRefreshToken) return [3 /*break*/, 10];
                        return [4 /*yield*/, setIdRefreshToken(idRefreshToken, response.status)];
                    case 9:
                        _a.sent();
                        _a.label = 10;
                    case 10:
                        if (!(response.status === AuthHttpRequest.config.sessionExpiredStatusCode))
                            return [3 /*break*/, 12];
                        return [4 /*yield*/, onUnauthorisedResponse(preRequestIdToken)];
                    case 11:
                        retry = _a.sent();
                        if (retry.result !== "RETRY") {
                            returnObj = retry.error !== undefined ? retry.error : response;
                            return [3 /*break*/, 19];
                        }
                        return [3 /*break*/, 18];
                    case 12:
                        antiCsrfToken = response.headers.get("anti-csrf");
                        if (!antiCsrfToken) return [3 /*break*/, 15];
                        return [4 /*yield*/, getIdRefreshToken(true)];
                    case 13:
                        tok = _a.sent();
                        if (!(tok.status === "EXISTS")) return [3 /*break*/, 15];
                        return [4 /*yield*/, AntiCsrfToken.setItem(tok.token, antiCsrfToken)];
                    case 14:
                        _a.sent();
                        _a.label = 15;
                    case 15:
                        frontToken = response.headers.get("front-token");
                        if (!frontToken) return [3 /*break*/, 17];
                        return [4 /*yield*/, FrontToken.setItem(frontToken)];
                    case 16:
                        _a.sent();
                        _a.label = 17;
                    case 17:
                        return [2 /*return*/, response];
                    case 18:
                        return [3 /*break*/, 4];
                    case 19:
                        // if it comes here, means we breaked. which happens only if we have logged out.
                        return [2 /*return*/, returnObj];
                    case 20:
                        return [4 /*yield*/, getIdRefreshToken(false)];
                    case 21:
                        postRequestIdToken = _a.sent();
                        if (!(postRequestIdToken.status === "NOT_EXISTS")) return [3 /*break*/, 24];
                        return [4 /*yield*/, AntiCsrfToken.removeToken()];
                    case 22:
                        _a.sent();
                        return [4 /*yield*/, FrontToken.removeToken()];
                    case 23:
                        _a.sent();
                        _a.label = 24;
                    case 24:
                        return [7 /*endfinally*/];
                    case 25:
                        return [2 /*return*/];
                }
            });
        });
    };
    AuthHttpRequest.attemptRefreshingSession = function() {
        return __awaiter(void 0, void 0, void 0, function() {
            var preRequestIdToken, refresh;
            return __generator(this, function(_a) {
                switch (_a.label) {
                    case 0:
                        return [4 /*yield*/, getIdRefreshToken(false)];
                    case 1:
                        preRequestIdToken = _a.sent();
                        return [4 /*yield*/, onUnauthorisedResponse(preRequestIdToken)];
                    case 2:
                        refresh = _a.sent();
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
        return __generator(this, function(_a) {
            switch (_a.label) {
                case 0:
                    lock = new browser_tabs_lock_1.default();
                    _a.label = 1;
                case 1:
                    if (!true) return [3 /*break*/, 29];
                    return [4 /*yield*/, lock.acquireLock("REFRESH_TOKEN_USE", 1000)];
                case 2:
                    if (!_a.sent()) return [3 /*break*/, 27];
                    _a.label = 3;
                case 3:
                    _a.trys.push([3, 19, 21, 27]);
                    return [4 /*yield*/, getIdRefreshToken(false)];
                case 4:
                    postLockID = _a.sent();
                    if (postLockID.status === "NOT_EXISTS") {
                        // if it comes here, it means a request was made thinking
                        // that the session exists, but it doesn't actually exist.
                        AuthHttpRequest.config.onHandleEvent({
                            action: "UNAUTHORISED",
                            sessionExpiredOrRevoked: false
                        });
                        return [2 /*return*/, { result: "SESSION_EXPIRED" }];
                    }
                    if (
                        postLockID.status !== preRequestIdToken.status ||
                        (postLockID.status === "EXISTS" &&
                            preRequestIdToken.status === "EXISTS" &&
                            postLockID.token !== preRequestIdToken.token)
                    ) {
                        // means that some other process has already called this API and succeeded. so we need to call it again
                        return [2 /*return*/, { result: "RETRY" }];
                    }
                    headers = {};
                    if (!(preRequestIdToken.status === "EXISTS")) return [3 /*break*/, 6];
                    return [4 /*yield*/, AntiCsrfToken.getToken(preRequestIdToken.token)];
                case 5:
                    antiCsrfToken_1 = _a.sent();
                    if (antiCsrfToken_1 !== undefined) {
                        headers = __assign(__assign({}, headers), { "anti-csrf": antiCsrfToken_1 });
                    }
                    _a.label = 6;
                case 6:
                    headers = __assign(__assign({ rid: AuthHttpRequest.rid }, headers), {
                        "fdi-version": version_1.supported_fdi.join(",")
                    });
                    return [
                        4 /*yield*/,
                        AuthHttpRequest.config.preAPIHook({
                            action: "REFRESH_SESSION",
                            requestInit: {
                                method: "post",
                                credentials: "include",
                                headers: headers
                            },
                            url: AuthHttpRequest.refreshTokenUrl
                        })
                    ];
                case 7:
                    preAPIResult = _a.sent();
                    return [
                        4 /*yield*/,
                        AuthHttpRequest.env.__supertokensOriginalFetch(preAPIResult.url, preAPIResult.requestInit)
                    ];
                case 8:
                    response = _a.sent();
                    removeIdRefreshToken = true;
                    idRefreshToken = response.headers.get("id-refresh-token");
                    if (!idRefreshToken) return [3 /*break*/, 10];
                    return [4 /*yield*/, setIdRefreshToken(idRefreshToken, response.status)];
                case 9:
                    _a.sent();
                    removeIdRefreshToken = false;
                    _a.label = 10;
                case 10:
                    if (!(response.status === AuthHttpRequest.config.sessionExpiredStatusCode))
                        return [3 /*break*/, 12];
                    if (!removeIdRefreshToken) return [3 /*break*/, 12];
                    return [4 /*yield*/, setIdRefreshToken("remove", response.status)];
                case 11:
                    _a.sent();
                    _a.label = 12;
                case 12:
                    if (response.status >= 300) {
                        throw response;
                    }
                    return [4 /*yield*/, getIdRefreshToken(false)];
                case 13:
                    if (_a.sent().status === "NOT_EXISTS") {
                        // The execution should never come here.. but just in case.
                        // removed by server. So we logout
                        // we do not send "UNAUTHORISED" event here because
                        // this is a result of the refresh API returning a session expiry, which
                        // means that the frontend did not know for sure that the session existed
                        // in the first place.
                        return [2 /*return*/, { result: "SESSION_EXPIRED" }];
                    }
                    antiCsrfToken = response.headers.get("anti-csrf");
                    if (!antiCsrfToken) return [3 /*break*/, 16];
                    return [4 /*yield*/, getIdRefreshToken(true)];
                case 14:
                    tok = _a.sent();
                    if (!(tok.status === "EXISTS")) return [3 /*break*/, 16];
                    return [4 /*yield*/, AntiCsrfToken.setItem(tok.token, antiCsrfToken)];
                case 15:
                    _a.sent();
                    _a.label = 16;
                case 16:
                    frontToken = response.headers.get("front-token");
                    if (!frontToken) return [3 /*break*/, 18];
                    return [4 /*yield*/, FrontToken.setItem(frontToken)];
                case 17:
                    _a.sent();
                    _a.label = 18;
                case 18:
                    AuthHttpRequest.config.onHandleEvent({
                        action: "REFRESH_SESSION"
                    });
                    return [2 /*return*/, { result: "RETRY" }];
                case 19:
                    error_1 = _a.sent();
                    return [4 /*yield*/, getIdRefreshToken(false)];
                case 20:
                    if (_a.sent().status === "NOT_EXISTS") {
                        // removed by server.
                        // we do not send "UNAUTHORISED" event here because
                        // this is a result of the refresh API returning a session expiry, which
                        // means that the frontend did not know for sure that the session existed
                        // in the first place.
                        return [2 /*return*/, { result: "SESSION_EXPIRED", error: error_1 }];
                    }
                    return [2 /*return*/, { result: "API_ERROR", error: error_1 }];
                case 21:
                    return [4 /*yield*/, lock.releaseLock("REFRESH_TOKEN_USE")];
                case 22:
                    _a.sent();
                    return [4 /*yield*/, getIdRefreshToken(false)];
                case 23:
                    if (!(_a.sent().status === "NOT_EXISTS")) return [3 /*break*/, 26];
                    return [4 /*yield*/, AntiCsrfToken.removeToken()];
                case 24:
                    _a.sent();
                    return [4 /*yield*/, FrontToken.removeToken()];
                case 25:
                    _a.sent();
                    _a.label = 26;
                case 26:
                    return [7 /*endfinally*/];
                case 27:
                    return [4 /*yield*/, getIdRefreshToken(false)];
                case 28:
                    idCookieValue = _a.sent();
                    if (idCookieValue.status === "NOT_EXISTS") {
                        // removed by server. So we logout
                        return [2 /*return*/, { result: "SESSION_EXPIRED" }];
                    } else {
                        if (
                            idCookieValue.status !== preRequestIdToken.status ||
                            (idCookieValue.status === "EXISTS" &&
                                preRequestIdToken.status === "EXISTS" &&
                                idCookieValue.token !== preRequestIdToken.token)
                        ) {
                            return [2 /*return*/, { result: "RETRY" }];
                        }
                        // here we try to call the API again since we probably failed to acquire lock and nothing has changed.
                    }
                    return [3 /*break*/, 1];
                case 29:
                    return [2 /*return*/];
            }
        });
    });
}
exports.onUnauthorisedResponse = onUnauthorisedResponse;
// if tryRefresh is true & this token doesn't exist, we try and refresh the session
// else we return undefined.
function getIdRefreshToken(tryRefresh) {
    return __awaiter(this, void 0, void 0, function() {
        function getIdRefreshTokenFromLocal() {
            return __awaiter(this, void 0, void 0, function() {
                function getIDFromCookieOld() {
                    var value = "; " + utils_1.getWindowOrThrow().document.cookie;
                    var parts = value.split("; " + ID_REFRESH_TOKEN_NAME + "=");
                    if (parts.length >= 2) {
                        var last = parts.pop();
                        if (last === "remove") {
                            // it means no session exists. This is different from
                            // it being undefined since in that case a session may or may not exist.
                            return "remove";
                        }
                        if (last !== undefined) {
                            return last.split(";").shift();
                        }
                    }
                    return undefined;
                }
                var fromCookie;
                return __generator(this, function(_a) {
                    fromCookie = getIDFromCookieOld();
                    return [2 /*return*/, fromCookie];
                });
            });
        }
        var token, response, res;
        return __generator(this, function(_a) {
            switch (_a.label) {
                case 0:
                    return [4 /*yield*/, getIdRefreshTokenFromLocal()];
                case 1:
                    token = _a.sent();
                    if (token === "remove") {
                        return [
                            2 /*return*/,
                            {
                                status: "NOT_EXISTS"
                            }
                        ];
                    }
                    if (!(token === undefined)) return [3 /*break*/, 5];
                    response = {
                        status: "MAY_EXIST"
                    };
                    if (!tryRefresh) return [3 /*break*/, 4];
                    return [4 /*yield*/, onUnauthorisedResponse(response)];
                case 2:
                    res = _a.sent();
                    if (res.result !== "RETRY") {
                        // in case the backend is not working, we treat it as the session not existing...
                        return [
                            2 /*return*/,
                            {
                                status: "NOT_EXISTS"
                            }
                        ];
                    }
                    return [4 /*yield*/, getIdRefreshToken(tryRefresh)];
                case 3:
                    return [2 /*return*/, _a.sent()];
                case 4:
                    return [2 /*return*/, response];
                case 5:
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
            // if the value of the token is "remove", it means
            // the session is being removed. So we set it to "remove" in the
            // cookie. This way, when we query for this token, we will return
            // undefined (see getIdRefreshToken), and not refresh the session
            // unnecessarily.
            var expires = "Fri, 31 Dec 9999 23:59:59 GMT";
            var cookieVal = "remove";
            if (idRefreshToken !== "remove") {
                var splitted = idRefreshToken.split(";");
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
            if (domain === "localhost" || domain === window.location.hostname) {
                // since some browsers ignore cookies with domain set to localhost
                // see https://github.com/supertokens/supertokens-website/issues/25
                utils_1.getWindowOrThrow().document.cookie =
                    ID_REFRESH_TOKEN_NAME +
                    "=" +
                    cookieVal +
                    ";expires=" +
                    expires +
                    ";path=/;samesite=" +
                    (AuthHttpRequest.config.isInIframe ? "none;secure" : "lax");
            } else {
                utils_1.getWindowOrThrow().document.cookie =
                    ID_REFRESH_TOKEN_NAME +
                    "=" +
                    cookieVal +
                    ";expires=" +
                    expires +
                    ";domain=" +
                    domain +
                    ";path=/;samesite=" +
                    (AuthHttpRequest.config.isInIframe ? "none;secure" : "lax");
            }
        }
        var status;
        return __generator(this, function(_a) {
            switch (_a.label) {
                case 0:
                    return [4 /*yield*/, getIdRefreshToken(false)];
                case 1:
                    status = _a.sent().status;
                    setIDToCookie(idRefreshToken, AuthHttpRequest.config.sessionScope);
                    if (idRefreshToken === "remove" && status === "EXISTS") {
                        // we check for wasLoggedIn cause we don't want to fire an event
                        // unnecessarily on first app load or if the user tried
                        // to query an API that returned 401 while the user was not logged in...
                        if (statusCode === AuthHttpRequest.config.sessionExpiredStatusCode) {
                            AuthHttpRequest.config.onHandleEvent({
                                action: "UNAUTHORISED",
                                sessionExpiredOrRevoked: true
                            });
                        } else {
                            AuthHttpRequest.config.onHandleEvent({
                                action: "SIGN_OUT"
                            });
                        }
                    }
                    if (idRefreshToken !== "remove" && status === "NOT_EXISTS") {
                        AuthHttpRequest.config.onHandleEvent({
                            action: "SESSION_CREATED"
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
            var value = "; " + utils_1.getWindowOrThrow().document.cookie;
            var parts = value.split("; " + ANTI_CSRF_NAME + "=");
            if (parts.length >= 2) {
                var last = parts.pop();
                if (last !== undefined) {
                    var temp = last.split(";").shift();
                    if (temp === undefined) {
                        return null;
                    }
                    return temp;
                }
            }
            return null;
        }
        var fromCookie;
        return __generator(this, function(_a) {
            switch (_a.label) {
                case 0:
                    return [4 /*yield*/, getIdRefreshToken(true)];
                case 1:
                    // we do not call doesSessionExist here cause the user might override that
                    // function here and then it may break the logic of our original implementation.
                    if (!(_a.sent().status === "EXISTS")) {
                        return [2 /*return*/, null];
                    }
                    fromCookie = getAntiCSRFromCookie();
                    return [2 /*return*/, fromCookie];
            }
        });
    });
}
// give antiCSRFToken as undefined to remove it.
function setAntiCSRF(antiCSRFToken) {
    return __awaiter(this, void 0, void 0, function() {
        function setAntiCSRFToCookie(antiCSRFToken, domain) {
            var expires = "Thu, 01 Jan 1970 00:00:01 GMT";
            var cookieVal = "";
            if (antiCSRFToken !== undefined) {
                cookieVal = antiCSRFToken;
                expires = undefined; // set cookie without expiry
            }
            if (domain === "localhost" || domain === window.location.hostname) {
                // since some browsers ignore cookies with domain set to localhost
                // see https://github.com/supertokens/supertokens-website/issues/25
                if (expires !== undefined) {
                    utils_1.getWindowOrThrow().document.cookie =
                        ANTI_CSRF_NAME +
                        "=" +
                        cookieVal +
                        ";expires=" +
                        expires +
                        ";path=/;samesite=" +
                        (AuthHttpRequest.config.isInIframe ? "none;secure" : "lax");
                } else {
                    utils_1.getWindowOrThrow().document.cookie =
                        ANTI_CSRF_NAME +
                        "=" +
                        cookieVal +
                        ";expires=Fri, 31 Dec 9999 23:59:59 GMT;path=/;samesite=" +
                        (AuthHttpRequest.config.isInIframe ? "none;secure" : "lax");
                }
            } else {
                if (expires !== undefined) {
                    utils_1.getWindowOrThrow().document.cookie =
                        ANTI_CSRF_NAME +
                        "=" +
                        cookieVal +
                        ";expires=" +
                        expires +
                        ";domain=" +
                        domain +
                        ";path=/;samesite=" +
                        (AuthHttpRequest.config.isInIframe ? "none;secure" : "lax");
                } else {
                    utils_1.getWindowOrThrow().document.cookie =
                        ANTI_CSRF_NAME +
                        "=" +
                        cookieVal +
                        ";domain=" +
                        domain +
                        ";expires=Fri, 31 Dec 9999 23:59:59 GMT;path=/;samesite=" +
                        (AuthHttpRequest.config.isInIframe ? "none;secure" : "lax");
                }
            }
        }
        return __generator(this, function(_a) {
            setAntiCSRFToCookie(antiCSRFToken, AuthHttpRequest.config.sessionScope);
            return [2 /*return*/];
        });
    });
}
exports.setAntiCSRF = setAntiCSRF;
function getFrontToken() {
    return __awaiter(this, void 0, void 0, function() {
        function getFrontTokenFromCookie() {
            var value = "; " + utils_1.getWindowOrThrow().document.cookie;
            var parts = value.split("; " + FRONT_TOKEN_NAME + "=");
            if (parts.length >= 2) {
                var last = parts.pop();
                if (last !== undefined) {
                    var temp = last.split(";").shift();
                    if (temp === undefined) {
                        return null;
                    }
                    return temp;
                }
            }
            return null;
        }
        var fromCookie;
        return __generator(this, function(_a) {
            switch (_a.label) {
                case 0:
                    return [4 /*yield*/, getIdRefreshToken(true)];
                case 1:
                    // we do not call doesSessionExist here cause the user might override that
                    // function here and then it may break the logic of our original implementation.
                    if (!(_a.sent().status === "EXISTS")) {
                        return [2 /*return*/, null];
                    }
                    fromCookie = getFrontTokenFromCookie();
                    return [2 /*return*/, fromCookie];
            }
        });
    });
}
exports.getFrontToken = getFrontToken;
function setFrontToken(frontToken) {
    return __awaiter(this, void 0, void 0, function() {
        function setFrontTokenToCookie(frontToken, domain) {
            var expires = "Thu, 01 Jan 1970 00:00:01 GMT";
            var cookieVal = "";
            if (frontToken !== undefined) {
                cookieVal = frontToken;
                expires = undefined; // set cookie without expiry
            }
            if (domain === "localhost" || domain === window.location.hostname) {
                // since some browsers ignore cookies with domain set to localhost
                // see https://github.com/supertokens/supertokens-website/issues/25
                if (expires !== undefined) {
                    utils_1.getWindowOrThrow().document.cookie =
                        FRONT_TOKEN_NAME +
                        "=" +
                        cookieVal +
                        ";expires=" +
                        expires +
                        ";path=/;samesite=" +
                        (AuthHttpRequest.config.isInIframe ? "none;secure" : "lax");
                } else {
                    utils_1.getWindowOrThrow().document.cookie =
                        FRONT_TOKEN_NAME +
                        "=" +
                        cookieVal +
                        ";expires=Fri, 31 Dec 9999 23:59:59 GMT;path=/;samesite=" +
                        (AuthHttpRequest.config.isInIframe ? "none;secure" : "lax");
                }
            } else {
                if (expires !== undefined) {
                    utils_1.getWindowOrThrow().document.cookie =
                        FRONT_TOKEN_NAME +
                        "=" +
                        cookieVal +
                        ";expires=" +
                        expires +
                        ";domain=" +
                        domain +
                        ";path=/;samesite=" +
                        (AuthHttpRequest.config.isInIframe ? "none;secure" : "lax");
                } else {
                    utils_1.getWindowOrThrow().document.cookie =
                        FRONT_TOKEN_NAME +
                        "=" +
                        cookieVal +
                        ";domain=" +
                        domain +
                        ";expires=Fri, 31 Dec 9999 23:59:59 GMT;path=/;samesite=" +
                        (AuthHttpRequest.config.isInIframe ? "none;secure" : "lax");
                }
            }
        }
        return __generator(this, function(_a) {
            setFrontTokenToCookie(frontToken, AuthHttpRequest.config.sessionScope);
            return [2 /*return*/];
        });
    });
}
exports.setFrontToken = setFrontToken;
