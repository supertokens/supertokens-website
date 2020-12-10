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
                result.done
                    ? resolve(result.value)
                    : new P(function(resolve) {
                          resolve(result.value);
                      }).then(fulfilled, rejected);
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
var _this = this;
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
        if (associatedIdRefreshToken === undefined) {
            AntiCsrfToken.tokenInfo = undefined;
            return undefined;
        }
        if (AntiCsrfToken.tokenInfo === undefined) {
            var antiCsrf = getAntiCSRFromCookie(AuthHttpRequest.sessionScope);
            if (antiCsrf === null) {
                return undefined;
            }
            AntiCsrfToken.tokenInfo = {
                antiCsrf: antiCsrf,
                associatedIdRefreshToken: associatedIdRefreshToken
            };
        } else if (AntiCsrfToken.tokenInfo.associatedIdRefreshToken !== associatedIdRefreshToken) {
            // csrf token has changed.
            AntiCsrfToken.tokenInfo = undefined;
            return AntiCsrfToken.getToken(associatedIdRefreshToken);
        }
        return AntiCsrfToken.tokenInfo.antiCsrf;
    };
    AntiCsrfToken.removeToken = function() {
        AntiCsrfToken.tokenInfo = undefined;
        setAntiCSRFToCookie(undefined, AuthHttpRequest.sessionScope);
    };
    AntiCsrfToken.setItem = function(associatedIdRefreshToken, antiCsrf) {
        if (associatedIdRefreshToken === undefined) {
            AntiCsrfToken.tokenInfo = undefined;
            return undefined;
        }
        setAntiCSRFToCookie(antiCsrf, AuthHttpRequest.sessionScope);
        AntiCsrfToken.tokenInfo = {
            antiCsrf: antiCsrf,
            associatedIdRefreshToken: associatedIdRefreshToken
        };
    };
    return AntiCsrfToken;
})();
exports.AntiCsrfToken = AntiCsrfToken;
// Note: We do not store this in memory because another tab may have
// modified this value, and if so, we may not know about it in this tab
var FrontToken = /** @class */ (function() {
    function FrontToken() {}
    FrontToken.getTokenInfo = function() {
        var frontToken = getFrontTokenFromCookie();
        if (frontToken === null) {
            return undefined;
        }
        return JSON.parse(atob(frontToken));
    };
    FrontToken.removeToken = function() {
        setFrontTokenToCookie(undefined, AuthHttpRequest.sessionScope);
    };
    FrontToken.setItem = function(frontToken) {
        setFrontTokenToCookie(frontToken, AuthHttpRequest.sessionScope);
    };
    return FrontToken;
})();
exports.FrontToken = FrontToken;
/**
 * @description returns true if retry, else false is session has expired completely.
 */
function handleUnauthorised(
    refreshAPI,
    preRequestIdToken,
    sessionScope,
    refreshAPICustomHeaders,
    sessionExpiredStatusCode
) {
    return __awaiter(this, void 0, void 0, function() {
        var result;
        return __generator(this, function(_a) {
            switch (_a.label) {
                case 0:
                    if (preRequestIdToken === undefined) {
                        return [2 /*return*/, getIDFromCookie() !== undefined];
                    }
                    return [
                        4 /*yield*/,
                        onUnauthorisedResponse(
                            refreshAPI,
                            preRequestIdToken,
                            sessionScope,
                            refreshAPICustomHeaders,
                            sessionExpiredStatusCode
                        )
                    ];
                case 1:
                    result = _a.sent();
                    if (result.result === "SESSION_EXPIRED") {
                        return [2 /*return*/, false];
                    } else if (result.result === "API_ERROR") {
                        throw result.error;
                    }
                    return [2 /*return*/, true];
            }
        });
    });
}
exports.handleUnauthorised = handleUnauthorised;
/**
 * @class AuthHttpRequest
 * @description wrapper for common http methods.
 */
var AuthHttpRequest = /** @class */ (function() {
    function AuthHttpRequest() {}
    AuthHttpRequest.setAuth0API = function(apiPath) {
        AuthHttpRequest.auth0Path = utils_1.normaliseURLPathOrThrowError(apiPath);
    };
    AuthHttpRequest.init = function(options) {
        var _a = utils_1.validateAndNormaliseInputOrThrowError(options),
            apiDomain = _a.apiDomain,
            apiBasePath = _a.apiBasePath,
            sessionScope = _a.sessionScope,
            refreshAPICustomHeaders = _a.refreshAPICustomHeaders,
            sessionExpiredStatusCode = _a.sessionExpiredStatusCode,
            autoAddCredentials = _a.autoAddCredentials;
        AuthHttpRequest.autoAddCredentials = autoAddCredentials;
        AuthHttpRequest.refreshTokenUrl = apiDomain + apiBasePath + "/session/refresh";
        AuthHttpRequest.refreshAPICustomHeaders = refreshAPICustomHeaders;
        AuthHttpRequest.sessionScope = sessionScope;
        AuthHttpRequest.sessionExpiredStatusCode = sessionExpiredStatusCode;
        AuthHttpRequest.apiDomain = apiDomain;
        var env = utils_1.getWindowOrThrow().fetch === undefined ? global : utils_1.getWindowOrThrow();
        if (AuthHttpRequest.originalFetch === undefined) {
            AuthHttpRequest.originalFetch = env.fetch.bind(env);
        }
        if (!AuthHttpRequest.addedFetchInterceptor) {
            AuthHttpRequest.addedFetchInterceptor = true;
            env.fetch = function(url, config) {
                return AuthHttpRequest.fetch(url, config);
            };
        }
        AuthHttpRequest.initCalled = true;
    };
    AuthHttpRequest.getUserId = function() {
        var tokenInfo = FrontToken.getTokenInfo();
        if (tokenInfo === undefined) {
            throw new Error("No session exists");
        }
        return tokenInfo.uid;
    };
    AuthHttpRequest.getJWTPayloadSecurely = function() {
        return __awaiter(this, void 0, void 0, function() {
            var tokenInfo, preRequestIdToken, retry;
            return __generator(this, function(_a) {
                switch (_a.label) {
                    case 0:
                        tokenInfo = FrontToken.getTokenInfo();
                        if (tokenInfo === undefined) {
                            throw new Error("No session exists");
                        }
                        if (!(tokenInfo.ate < Date.now())) return [3 /*break*/, 4];
                        preRequestIdToken = getIDFromCookie();
                        return [
                            4 /*yield*/,
                            handleUnauthorised(
                                AuthHttpRequest.refreshTokenUrl,
                                preRequestIdToken,
                                AuthHttpRequest.sessionScope,
                                AuthHttpRequest.refreshAPICustomHeaders,
                                AuthHttpRequest.sessionExpiredStatusCode
                            )
                        ];
                    case 1:
                        retry = _a.sent();
                        if (!retry) return [3 /*break*/, 3];
                        return [4 /*yield*/, AuthHttpRequest.getJWTPayloadSecurely()];
                    case 2:
                        return [2 /*return*/, _a.sent()];
                    case 3:
                        throw new Error("Could not refresh session");
                    case 4:
                        return [2 /*return*/, tokenInfo.up];
                }
            });
        });
    };
    AuthHttpRequest.initCalled = false;
    AuthHttpRequest.apiDomain = "";
    AuthHttpRequest.addedFetchInterceptor = false;
    AuthHttpRequest.getAuth0API = function() {
        return {
            apiPath: AuthHttpRequest.auth0Path
        };
    };
    AuthHttpRequest.getRefreshURLDomain = function() {
        return utils_1.normaliseURLDomainOrThrowError(AuthHttpRequest.refreshTokenUrl);
    };
    /**
     * @description sends the actual http request and returns a response if successful/
     * If not successful due to session expiry reasons, it
     * attempts to call the refresh token API and if that is successful, calls this API again.
     * @throws Error
     */
    AuthHttpRequest.doRequest = function(httpCall, config, url) {
        return __awaiter(_this, void 0, void 0, function() {
            var throwError,
                returnObj,
                preRequestIdToken,
                antiCsrfToken,
                configWithAntiCsrf,
                response,
                retry,
                err_1,
                retry;
            return __generator(this, function(_a) {
                switch (_a.label) {
                    case 0:
                        if (!AuthHttpRequest.initCalled) {
                            throw Error("init function not called");
                        }
                        if (
                            !(
                                typeof url === "string" &&
                                utils_1.normaliseURLDomainOrThrowError(url) !== AuthHttpRequest.apiDomain &&
                                AuthHttpRequest.addedFetchInterceptor
                            )
                        )
                            return [3 /*break*/, 2];
                        return [4 /*yield*/, httpCall(config)];
                    case 1:
                        // this check means that if you are using fetch via inteceptor, then we only do the refresh steps if you are calling your APIs.
                        return [2 /*return*/, _a.sent()];
                    case 2:
                        if (AuthHttpRequest.addedFetchInterceptor) {
                            processState_1.ProcessState.getInstance().addState(
                                processState_1.PROCESS_STATE.CALLING_INTERCEPTION_REQUEST
                            );
                        }
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, , 16, 17]);
                        throwError = false;
                        returnObj = undefined;
                        _a.label = 4;
                    case 4:
                        if (!true) return [3 /*break*/, 15];
                        preRequestIdToken = getIDFromCookie();
                        antiCsrfToken = AntiCsrfToken.getToken(preRequestIdToken);
                        configWithAntiCsrf = config;
                        if (antiCsrfToken !== undefined) {
                            configWithAntiCsrf = __assign({}, configWithAntiCsrf, {
                                headers:
                                    configWithAntiCsrf === undefined
                                        ? {
                                              "anti-csrf": antiCsrfToken
                                          }
                                        : __assign({}, configWithAntiCsrf.headers, { "anti-csrf": antiCsrfToken })
                            });
                        }
                        if (AuthHttpRequest.autoAddCredentials) {
                            if (configWithAntiCsrf === undefined) {
                                configWithAntiCsrf = {
                                    credentials: "include"
                                };
                            } else if (configWithAntiCsrf.credentials === undefined) {
                                configWithAntiCsrf = __assign({}, configWithAntiCsrf, { credentials: "include" });
                            }
                        }
                        _a.label = 5;
                    case 5:
                        _a.trys.push([5, 10, , 14]);
                        return [4 /*yield*/, httpCall(configWithAntiCsrf)];
                    case 6:
                        response = _a.sent();
                        response.headers.forEach(function(value, key) {
                            if (key.toString() === "id-refresh-token") {
                                setIDToCookie(value, AuthHttpRequest.sessionScope);
                            }
                        });
                        if (!(response.status === AuthHttpRequest.sessionExpiredStatusCode)) return [3 /*break*/, 8];
                        return [
                            4 /*yield*/,
                            handleUnauthorised(
                                AuthHttpRequest.refreshTokenUrl,
                                preRequestIdToken,
                                AuthHttpRequest.sessionScope,
                                AuthHttpRequest.refreshAPICustomHeaders,
                                AuthHttpRequest.sessionExpiredStatusCode
                            )
                        ];
                    case 7:
                        retry = _a.sent();
                        if (!retry) {
                            returnObj = response;
                            return [3 /*break*/, 15];
                        }
                        return [3 /*break*/, 9];
                    case 8:
                        response.headers.forEach(function(value, key) {
                            if (key.toString() === "anti-csrf") {
                                AntiCsrfToken.setItem(getIDFromCookie(), value);
                            } else if (key.toString() === "front-token") {
                                FrontToken.setItem(value);
                            }
                        });
                        return [2 /*return*/, response];
                    case 9:
                        return [3 /*break*/, 14];
                    case 10:
                        err_1 = _a.sent();
                        if (!(err_1.status === AuthHttpRequest.sessionExpiredStatusCode)) return [3 /*break*/, 12];
                        return [
                            4 /*yield*/,
                            handleUnauthorised(
                                AuthHttpRequest.refreshTokenUrl,
                                preRequestIdToken,
                                AuthHttpRequest.sessionScope,
                                AuthHttpRequest.refreshAPICustomHeaders,
                                AuthHttpRequest.sessionExpiredStatusCode
                            )
                        ];
                    case 11:
                        retry = _a.sent();
                        if (!retry) {
                            throwError = true;
                            returnObj = err_1;
                            return [3 /*break*/, 15];
                        }
                        return [3 /*break*/, 13];
                    case 12:
                        throw err_1;
                    case 13:
                        return [3 /*break*/, 14];
                    case 14:
                        return [3 /*break*/, 4];
                    case 15:
                        // if it comes here, means we breaked. which happens only if we have logged out.
                        if (throwError) {
                            throw returnObj;
                        } else {
                            return [2 /*return*/, returnObj];
                        }
                        return [3 /*break*/, 17];
                    case 16:
                        if (getIDFromCookie() === undefined) {
                            AntiCsrfToken.removeToken();
                            FrontToken.removeToken();
                        }
                        return [7 /*endfinally*/];
                    case 17:
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * @description attempts to refresh session regardless of expiry
     * @returns true if successful, else false if session has expired. Wrapped in a Promise
     * @throws error if anything goes wrong
     */
    AuthHttpRequest.attemptRefreshingSession = function() {
        return __awaiter(_this, void 0, void 0, function() {
            var preRequestIdToken;
            return __generator(this, function(_a) {
                switch (_a.label) {
                    case 0:
                        if (!AuthHttpRequest.initCalled) {
                            throw Error("init function not called");
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, , 3, 4]);
                        preRequestIdToken = getIDFromCookie();
                        return [
                            4 /*yield*/,
                            handleUnauthorised(
                                AuthHttpRequest.refreshTokenUrl,
                                preRequestIdToken,
                                AuthHttpRequest.sessionScope,
                                AuthHttpRequest.refreshAPICustomHeaders,
                                AuthHttpRequest.sessionExpiredStatusCode
                            )
                        ];
                    case 2:
                        return [2 /*return*/, _a.sent()];
                    case 3:
                        if (getIDFromCookie() === undefined) {
                            AntiCsrfToken.removeToken();
                            FrontToken.removeToken();
                        }
                        return [7 /*endfinally*/];
                    case 4:
                        return [2 /*return*/];
                }
            });
        });
    };
    AuthHttpRequest.fetch = function(url, config) {
        return __awaiter(_this, void 0, void 0, function() {
            return __generator(this, function(_a) {
                switch (_a.label) {
                    case 0:
                        return [
                            4 /*yield*/,
                            AuthHttpRequest.doRequest(
                                function(config) {
                                    return AuthHttpRequest.originalFetch(url, __assign({}, config));
                                },
                                config,
                                url
                            )
                        ];
                    case 1:
                        return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    AuthHttpRequest.doesSessionExist = function() {
        return getIDFromCookie() !== undefined;
    };
    return AuthHttpRequest;
})();
exports.default = AuthHttpRequest;
var ID_COOKIE_NAME = "sIRTFrontend";
var ANTI_CSRF_COOKIE_NAME = "sAntiCsrf";
var FRONT_TOKEN_COOKIE_NAME = "sFrontToken";
/**
 * @description attempts to call the refresh token API each time we are sure the session has expired, or it throws an error or,
 * or the ID_COOKIE_NAME has changed value -> which may mean that we have a new set of tokens.
 */
function onUnauthorisedResponse(
    refreshTokenUrl,
    preRequestIdToken,
    sessionScope,
    refreshAPICustomHeaders,
    sessionExpiredStatusCode
) {
    return __awaiter(this, void 0, void 0, function() {
        var lock, _loop_1, state_1;
        return __generator(this, function(_a) {
            switch (_a.label) {
                case 0:
                    lock = new browser_tabs_lock_1.default();
                    _loop_1 = function() {
                        var postLockID,
                            antiCsrfToken,
                            headers,
                            response,
                            removeIdRefreshToken_1,
                            error_1,
                            idCookieValue;
                        return __generator(this, function(_a) {
                            switch (_a.label) {
                                case 0:
                                    return [4 /*yield*/, lock.acquireLock("REFRESH_TOKEN_USE", 1000)];
                                case 1:
                                    if (!_a.sent()) return [3 /*break*/, 6];
                                    _a.label = 2;
                                case 2:
                                    _a.trys.push([2, 4, 5, 6]);
                                    postLockID = getIDFromCookie();
                                    if (postLockID === undefined) {
                                        return [2 /*return*/, { value: { result: "SESSION_EXPIRED" } }];
                                    }
                                    if (postLockID !== preRequestIdToken) {
                                        return [2 /*return*/, { value: { result: "RETRY" } }];
                                    }
                                    antiCsrfToken = AntiCsrfToken.getToken(preRequestIdToken);
                                    headers = __assign({}, refreshAPICustomHeaders);
                                    if (antiCsrfToken !== undefined) {
                                        headers = __assign({}, headers, { "anti-csrf": antiCsrfToken });
                                    }
                                    headers = __assign({}, headers, {
                                        "fdi-version": version_1.supported_fdi.join(",")
                                    });
                                    return [
                                        4 /*yield*/,
                                        AuthHttpRequest.originalFetch(refreshTokenUrl, {
                                            method: "post",
                                            credentials: "include",
                                            headers: headers
                                        })
                                    ];
                                case 3:
                                    response = _a.sent();
                                    removeIdRefreshToken_1 = true;
                                    response.headers.forEach(function(value, key) {
                                        if (key.toString() === "id-refresh-token") {
                                            setIDToCookie(value, sessionScope);
                                            removeIdRefreshToken_1 = false;
                                        }
                                    });
                                    if (response.status === sessionExpiredStatusCode) {
                                        // there is a case where frontend still has id refresh token, but backend doesn't get it. In this event, session expired error will be thrown and the frontend should remove this token
                                        if (removeIdRefreshToken_1) {
                                            setIDToCookie("remove", sessionScope);
                                        }
                                    }
                                    if (response.status >= 300) {
                                        throw response;
                                    }
                                    if (getIDFromCookie() === undefined) {
                                        return [2 /*return*/, { value: { result: "SESSION_EXPIRED" } }];
                                    }
                                    response.headers.forEach(function(value, key) {
                                        if (key.toString() === "anti-csrf") {
                                            AntiCsrfToken.setItem(getIDFromCookie(), value);
                                        } else if (key.toString() === "front-token") {
                                            FrontToken.setItem(value);
                                        }
                                    });
                                    return [2 /*return*/, { value: { result: "RETRY" } }];
                                case 4:
                                    error_1 = _a.sent();
                                    if (getIDFromCookie() === undefined) {
                                        return [2 /*return*/, { value: { result: "SESSION_EXPIRED" } }];
                                    }
                                    return [2 /*return*/, { value: { result: "API_ERROR", error: error_1 } }];
                                case 5:
                                    lock.releaseLock("REFRESH_TOKEN_USE");
                                    return [7 /*endfinally*/];
                                case 6:
                                    idCookieValue = getIDFromCookie();
                                    if (idCookieValue === undefined) {
                                        return [2 /*return*/, { value: { result: "SESSION_EXPIRED" } }];
                                    } else {
                                        if (idCookieValue !== preRequestIdToken) {
                                            return [2 /*return*/, { value: { result: "RETRY" } }];
                                        }
                                        // here we try to call the API again since we probably failed to acquire lock and nothing has changed.
                                    }
                                    return [2 /*return*/];
                            }
                        });
                    };
                    _a.label = 1;
                case 1:
                    if (!true) return [3 /*break*/, 3];
                    return [5 /*yield**/, _loop_1()];
                case 2:
                    state_1 = _a.sent();
                    if (typeof state_1 === "object") return [2 /*return*/, state_1.value];
                    return [3 /*break*/, 1];
                case 3:
                    return [2 /*return*/];
            }
        });
    });
}
exports.onUnauthorisedResponse = onUnauthorisedResponse;
// NOTE: we do not store this in memory and always read as to synchronize events across tabs
function getIDFromCookie() {
    var value = "; " + utils_1.getWindowOrThrow().document.cookie;
    var parts = value.split("; " + ID_COOKIE_NAME + "=");
    if (parts.length >= 2) {
        var last = parts.pop();
        if (last !== undefined) {
            return last.split(";").shift();
        }
    }
    return undefined;
}
exports.getIDFromCookie = getIDFromCookie;
function setIDToCookie(idRefreshToken, domain) {
    var expires = "Thu, 01 Jan 1970 00:00:01 GMT";
    var cookieVal = "";
    if (idRefreshToken !== "remove") {
        var splitted = idRefreshToken.split(";");
        cookieVal = splitted[0];
        expires = new Date(Number(splitted[1])).toUTCString();
    }
    if (domain === "localhost" || domain === window.location.hostname) {
        // since some browsers ignore cookies with domain set to localhost
        // see https://github.com/supertokens/supertokens-website/issues/25
        utils_1.getWindowOrThrow().document.cookie =
            ID_COOKIE_NAME + "=" + cookieVal + ";expires=" + expires + ";path=/";
    } else {
        utils_1.getWindowOrThrow().document.cookie =
            ID_COOKIE_NAME + "=" + cookieVal + ";expires=" + expires + ";domain=" + domain + ";path=/";
    }
}
exports.setIDToCookie = setIDToCookie;
function getAntiCSRFromCookie(domain) {
    var value = "; " + utils_1.getWindowOrThrow().document.cookie;
    var parts = value.split("; " + ANTI_CSRF_COOKIE_NAME + "=");
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
    // check for backwards compatibility
    var fromLocalstorage = utils_1.getWindowOrThrow().localStorage.getItem("anti-csrf-localstorage");
    if (fromLocalstorage !== null) {
        setAntiCSRFToCookie(fromLocalstorage, domain);
        utils_1.getWindowOrThrow().localStorage.removeItem("anti-csrf-localstorage");
        return fromLocalstorage;
    }
    return null;
}
exports.getAntiCSRFromCookie = getAntiCSRFromCookie;
// give antiCSRFToken as undefined to remove it.
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
                ANTI_CSRF_COOKIE_NAME + "=" + cookieVal + ";expires=" + expires + ";path=/";
        } else {
            utils_1.getWindowOrThrow().document.cookie = ANTI_CSRF_COOKIE_NAME + "=" + cookieVal + ";path=/";
        }
    } else {
        if (expires !== undefined) {
            utils_1.getWindowOrThrow().document.cookie =
                ANTI_CSRF_COOKIE_NAME + "=" + cookieVal + ";expires=" + expires + ";domain=" + domain + ";path=/";
        } else {
            utils_1.getWindowOrThrow().document.cookie =
                ANTI_CSRF_COOKIE_NAME + "=" + cookieVal + ";domain=" + domain + ";path=/";
        }
    }
    // for backwards compatibility
    if (antiCSRFToken === undefined) {
        utils_1.getWindowOrThrow().localStorage.removeItem("anti-csrf-localstorage");
    }
}
exports.setAntiCSRFToCookie = setAntiCSRFToCookie;
function getFrontTokenFromCookie() {
    var value = "; " + utils_1.getWindowOrThrow().document.cookie;
    var parts = value.split("; " + FRONT_TOKEN_COOKIE_NAME + "=");
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
exports.getFrontTokenFromCookie = getFrontTokenFromCookie;
// give frontToken as undefined to remove it.
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
                FRONT_TOKEN_COOKIE_NAME + "=" + cookieVal + ";expires=" + expires + ";path=/";
        } else {
            utils_1.getWindowOrThrow().document.cookie = FRONT_TOKEN_COOKIE_NAME + "=" + cookieVal + ";path=/";
        }
    } else {
        if (expires !== undefined) {
            utils_1.getWindowOrThrow().document.cookie =
                FRONT_TOKEN_COOKIE_NAME + "=" + cookieVal + ";expires=" + expires + ";domain=" + domain + ";path=/";
        } else {
            utils_1.getWindowOrThrow().document.cookie =
                FRONT_TOKEN_COOKIE_NAME + "=" + cookieVal + ";domain=" + domain + ";path=/";
        }
    }
}
exports.setFrontTokenToCookie = setFrontTokenToCookie;
