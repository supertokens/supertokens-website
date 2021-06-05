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
var crossDomainLocalstorage_1 = require("./crossDomainLocalstorage");
var index_1 = require("./index");
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
                        if (frontToken === null) {
                            return [2 /*return*/, undefined];
                        }
                        return [2 /*return*/, JSON.parse(atob(frontToken))];
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
                        return [2 /*return*/];
                }
            });
        });
    };
    return FrontToken;
})();
exports.FrontToken = FrontToken;
/**
 * @description returns true if retry, else false is session has expired completely.
 */
function handleUnauthorised(refreshAPI, preRequestIdToken, refreshAPICustomHeaders, sessionExpiredStatusCode) {
    return __awaiter(this, void 0, void 0, function() {
        var result;
        return __generator(this, function(_a) {
            switch (_a.label) {
                case 0:
                    return [
                        4 /*yield*/,
                        onUnauthorisedResponse(
                            refreshAPI,
                            preRequestIdToken,
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
            signoutAPICustomHeaders = _a.signoutAPICustomHeaders,
            sessionExpiredStatusCode = _a.sessionExpiredStatusCode,
            autoAddCredentials = _a.autoAddCredentials,
            isInIframe = _a.isInIframe,
            cookieDomain = _a.cookieDomain;
        AuthHttpRequest.env = utils_1.getWindowOrThrow().fetch === undefined ? global : utils_1.getWindowOrThrow();
        AuthHttpRequest.autoAddCredentials = autoAddCredentials;
        AuthHttpRequest.refreshTokenUrl = apiDomain + apiBasePath + "/session/refresh";
        AuthHttpRequest.signOutUrl = apiDomain + apiBasePath + "/signout";
        AuthHttpRequest.refreshAPICustomHeaders = refreshAPICustomHeaders;
        AuthHttpRequest.signoutAPICustomHeaders = signoutAPICustomHeaders;
        AuthHttpRequest.sessionScope = sessionScope;
        AuthHttpRequest.sessionExpiredStatusCode = sessionExpiredStatusCode;
        AuthHttpRequest.apiDomain = apiDomain;
        AuthHttpRequest.crossDomainLocalstorage = new crossDomainLocalstorage_1.default(sessionScope);
        AuthHttpRequest.rid = refreshAPICustomHeaders["rid"] === undefined ? "session" : refreshAPICustomHeaders["rid"];
        AuthHttpRequest.isInIframe = isInIframe;
        AuthHttpRequest.cookieDomain = cookieDomain;
        if (AuthHttpRequest.env.__supertokensOriginalFetch === undefined) {
            AuthHttpRequest.env.__supertokensOriginalFetch = AuthHttpRequest.env.fetch.bind(AuthHttpRequest.env);
        }
        if (!AuthHttpRequest.addedFetchInterceptor) {
            AuthHttpRequest.addedFetchInterceptor = true;
            AuthHttpRequest.env.fetch = function(url, config) {
                return AuthHttpRequest.fetch(url, config);
            };
        }
        AuthHttpRequest.initCalled = true;
    };
    AuthHttpRequest.getUserId = function() {
        return __awaiter(this, void 0, void 0, function() {
            var tokenInfo;
            return __generator(this, function(_a) {
                switch (_a.label) {
                    case 0:
                        return [4 /*yield*/, FrontToken.getTokenInfo()];
                    case 1:
                        tokenInfo = _a.sent();
                        if (tokenInfo === undefined) {
                            throw new Error("No session exists");
                        }
                        return [2 /*return*/, tokenInfo.uid];
                }
            });
        });
    };
    AuthHttpRequest.getJWTPayloadSecurely = function() {
        return __awaiter(this, void 0, void 0, function() {
            var tokenInfo, preRequestIdToken, retry;
            return __generator(this, function(_a) {
                switch (_a.label) {
                    case 0:
                        return [4 /*yield*/, FrontToken.getTokenInfo()];
                    case 1:
                        tokenInfo = _a.sent();
                        if (tokenInfo === undefined) {
                            throw new Error("No session exists");
                        }
                        if (!(tokenInfo.ate < Date.now())) return [3 /*break*/, 6];
                        return [4 /*yield*/, getIdRefreshToken(false)];
                    case 2:
                        preRequestIdToken = _a.sent();
                        return [
                            4 /*yield*/,
                            handleUnauthorised(
                                AuthHttpRequest.refreshTokenUrl,
                                preRequestIdToken,
                                AuthHttpRequest.refreshAPICustomHeaders,
                                AuthHttpRequest.sessionExpiredStatusCode
                            )
                        ];
                    case 3:
                        retry = _a.sent();
                        if (!retry) return [3 /*break*/, 5];
                        return [4 /*yield*/, AuthHttpRequest.getJWTPayloadSecurely()];
                    case 4:
                        return [2 /*return*/, _a.sent()];
                    case 5:
                        throw new Error("Could not refresh session");
                    case 6:
                        return [2 /*return*/, tokenInfo.up];
                }
            });
        });
    };
    AuthHttpRequest.signOut = function() {
        return __awaiter(this, void 0, void 0, function() {
            var resp;
            return __generator(this, function(_a) {
                switch (_a.label) {
                    case 0:
                        return [4 /*yield*/, AuthHttpRequest.doesSessionExist()];
                    case 1:
                        if (!_a.sent()) {
                            return [2 /*return*/];
                        }
                        return [
                            4 /*yield*/,
                            fetch(AuthHttpRequest.signOutUrl, {
                                method: "post",
                                credentials: "include",
                                headers:
                                    AuthHttpRequest.signoutAPICustomHeaders === undefined
                                        ? undefined
                                        : __assign({}, AuthHttpRequest.signoutAPICustomHeaders)
                            })
                        ];
                    case 2:
                        resp = _a.sent();
                        if (resp.status === AuthHttpRequest.sessionExpiredStatusCode) {
                            return [2 /*return*/];
                        }
                        if (resp.status >= 300) {
                            throw resp;
                        }
                        return [2 /*return*/];
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
            var doNotDoInterception,
                throwError,
                returnObj,
                preRequestIdToken,
                configWithAntiCsrf,
                antiCsrfToken,
                response,
                retry,
                err_1,
                retry;
            var _this = this;
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
                                        AuthHttpRequest.apiDomain,
                                        AuthHttpRequest.cookieDomain
                                    ) &&
                                    AuthHttpRequest.addedFetchInterceptor) ||
                                (url !== undefined &&
                                typeof url.url === "string" && // this is because url can be an object like {method: ..., url: ...}
                                    !utils_1.shouldDoInterceptionBasedOnUrl(
                                        url.url,
                                        AuthHttpRequest.apiDomain,
                                        AuthHttpRequest.cookieDomain
                                    ) &&
                                    AuthHttpRequest.addedFetchInterceptor);
                        } catch (err) {
                            if (err.message === "Please provide a valid domain name") {
                                // .origin gives the port as well..
                                doNotDoInterception =
                                    !utils_1.shouldDoInterceptionBasedOnUrl(
                                        window.location.origin,
                                        AuthHttpRequest.apiDomain,
                                        AuthHttpRequest.cookieDomain
                                    ) && AuthHttpRequest.addedFetchInterceptor;
                            } else {
                                throw err;
                            }
                        }
                        if (!doNotDoInterception) return [3 /*break*/, 2];
                        return [4 /*yield*/, httpCall(config)];
                    case 1:
                        return [2 /*return*/, _a.sent()];
                    case 2:
                        if (AuthHttpRequest.addedFetchInterceptor) {
                            processState_1.ProcessState.getInstance().addState(
                                processState_1.PROCESS_STATE.CALLING_INTERCEPTION_REQUEST
                            );
                        }
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, , 21, 26]);
                        throwError = false;
                        returnObj = undefined;
                        _a.label = 4;
                    case 4:
                        if (!true) return [3 /*break*/, 20];
                        return [4 /*yield*/, getIdRefreshToken(true)];
                    case 5:
                        preRequestIdToken = _a.sent();
                        configWithAntiCsrf = config;
                        if (!(preRequestIdToken.status === "EXISTS")) return [3 /*break*/, 7];
                        return [4 /*yield*/, AntiCsrfToken.getToken(preRequestIdToken.token)];
                    case 6:
                        antiCsrfToken = _a.sent();
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
                        _a.label = 7;
                    case 7:
                        if (AuthHttpRequest.autoAddCredentials) {
                            if (configWithAntiCsrf === undefined) {
                                configWithAntiCsrf = {
                                    credentials: "include"
                                };
                            } else if (configWithAntiCsrf.credentials === undefined) {
                                configWithAntiCsrf = __assign({}, configWithAntiCsrf, { credentials: "include" });
                            }
                        }
                        // adding rid for anti-csrf protection: Anti-csrf via custom header
                        configWithAntiCsrf = __assign({}, configWithAntiCsrf, {
                            headers:
                                configWithAntiCsrf === undefined
                                    ? {
                                          rid: AuthHttpRequest.rid
                                      }
                                    : __assign({ rid: AuthHttpRequest.rid }, configWithAntiCsrf.headers)
                        });
                        _a.label = 8;
                    case 8:
                        _a.trys.push([8, 15, , 19]);
                        return [4 /*yield*/, httpCall(configWithAntiCsrf)];
                    case 9:
                        response = _a.sent();
                        return [
                            4 /*yield*/,
                            loopThroughResponseHeadersAndApplyFunction(response, function(value, key) {
                                return __awaiter(_this, void 0, void 0, function() {
                                    return __generator(this, function(_a) {
                                        switch (_a.label) {
                                            case 0:
                                                if (!(key.toString() === "id-refresh-token")) return [3 /*break*/, 2];
                                                return [4 /*yield*/, setIdRefreshToken(value)];
                                            case 1:
                                                _a.sent();
                                                _a.label = 2;
                                            case 2:
                                                return [2 /*return*/];
                                        }
                                    });
                                });
                            })
                        ];
                    case 10:
                        _a.sent();
                        if (!(response.status === AuthHttpRequest.sessionExpiredStatusCode)) return [3 /*break*/, 12];
                        return [
                            4 /*yield*/,
                            handleUnauthorised(
                                AuthHttpRequest.refreshTokenUrl,
                                preRequestIdToken,
                                AuthHttpRequest.refreshAPICustomHeaders,
                                AuthHttpRequest.sessionExpiredStatusCode
                            )
                        ];
                    case 11:
                        retry = _a.sent();
                        if (!retry) {
                            returnObj = response;
                            return [3 /*break*/, 20];
                        }
                        return [3 /*break*/, 14];
                    case 12:
                        return [
                            4 /*yield*/,
                            loopThroughResponseHeadersAndApplyFunction(response, function(value, key) {
                                return __awaiter(_this, void 0, void 0, function() {
                                    var tok;
                                    return __generator(this, function(_a) {
                                        switch (_a.label) {
                                            case 0:
                                                if (!(key.toString() === "anti-csrf")) return [3 /*break*/, 4];
                                                return [4 /*yield*/, getIdRefreshToken(true)];
                                            case 1:
                                                tok = _a.sent();
                                                if (!(tok.status === "EXISTS")) return [3 /*break*/, 3];
                                                return [4 /*yield*/, AntiCsrfToken.setItem(tok.token, value)];
                                            case 2:
                                                _a.sent();
                                                _a.label = 3;
                                            case 3:
                                                return [3 /*break*/, 6];
                                            case 4:
                                                if (!(key.toString() === "front-token")) return [3 /*break*/, 6];
                                                return [4 /*yield*/, FrontToken.setItem(value)];
                                            case 5:
                                                _a.sent();
                                                _a.label = 6;
                                            case 6:
                                                return [2 /*return*/];
                                        }
                                    });
                                });
                            })
                        ];
                    case 13:
                        _a.sent();
                        return [2 /*return*/, response];
                    case 14:
                        return [3 /*break*/, 19];
                    case 15:
                        err_1 = _a.sent();
                        if (!(err_1.status === AuthHttpRequest.sessionExpiredStatusCode)) return [3 /*break*/, 17];
                        return [
                            4 /*yield*/,
                            handleUnauthorised(
                                AuthHttpRequest.refreshTokenUrl,
                                preRequestIdToken,
                                AuthHttpRequest.refreshAPICustomHeaders,
                                AuthHttpRequest.sessionExpiredStatusCode
                            )
                        ];
                    case 16:
                        retry = _a.sent();
                        if (!retry) {
                            throwError = true;
                            returnObj = err_1;
                            return [3 /*break*/, 20];
                        }
                        return [3 /*break*/, 18];
                    case 17:
                        throw err_1;
                    case 18:
                        return [3 /*break*/, 19];
                    case 19:
                        return [3 /*break*/, 4];
                    case 20:
                        // if it comes here, means we breaked. which happens only if we have logged out.
                        if (throwError) {
                            throw returnObj;
                        } else {
                            return [2 /*return*/, returnObj];
                        }
                        return [3 /*break*/, 26];
                    case 21:
                        return [4 /*yield*/, index_1.doesSessionExist()];
                    case 22:
                        if (!!_a.sent()) return [3 /*break*/, 25];
                        return [4 /*yield*/, AntiCsrfToken.removeToken()];
                    case 23:
                        _a.sent();
                        return [4 /*yield*/, FrontToken.removeToken()];
                    case 24:
                        _a.sent();
                        _a.label = 25;
                    case 25:
                        return [7 /*endfinally*/];
                    case 26:
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
                        _a.trys.push([1, , 4, 9]);
                        return [4 /*yield*/, getIdRefreshToken(false)];
                    case 2:
                        preRequestIdToken = _a.sent();
                        return [
                            4 /*yield*/,
                            handleUnauthorised(
                                AuthHttpRequest.refreshTokenUrl,
                                preRequestIdToken,
                                AuthHttpRequest.refreshAPICustomHeaders,
                                AuthHttpRequest.sessionExpiredStatusCode
                            )
                        ];
                    case 3:
                        return [2 /*return*/, _a.sent()];
                    case 4:
                        return [4 /*yield*/, index_1.doesSessionExist()];
                    case 5:
                        if (!!_a.sent()) return [3 /*break*/, 8];
                        return [4 /*yield*/, AntiCsrfToken.removeToken()];
                    case 6:
                        _a.sent();
                        return [4 /*yield*/, FrontToken.removeToken()];
                    case 7:
                        _a.sent();
                        _a.label = 8;
                    case 8:
                        return [7 /*endfinally*/];
                    case 9:
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
                                    return AuthHttpRequest.env.__supertokensOriginalFetch(url, __assign({}, config));
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
        return __awaiter(_this, void 0, void 0, function() {
            return __generator(this, function(_a) {
                switch (_a.label) {
                    case 0:
                        return [4 /*yield*/, getIdRefreshToken(true)];
                    case 1:
                        return [2 /*return*/, _a.sent().status === "EXISTS"];
                }
            });
        });
    };
    return AuthHttpRequest;
})();
exports.default = AuthHttpRequest;
function loopThroughResponseHeadersAndApplyFunction(response, func) {
    return __awaiter(this, void 0, void 0, function() {
        var keys, i;
        return __generator(this, function(_a) {
            switch (_a.label) {
                case 0:
                    keys = [];
                    response.headers.forEach(function(_, key) {
                        keys.push(key);
                    });
                    i = 0;
                    _a.label = 1;
                case 1:
                    if (!(i < keys.length)) return [3 /*break*/, 4];
                    return [4 /*yield*/, func(response.headers.get(keys[i].toString()), keys[i])];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    i++;
                    return [3 /*break*/, 1];
                case 4:
                    return [2 /*return*/];
            }
        });
    });
}
var ID_REFRESH_TOKEN_NAME = "sIRTFrontend";
var ANTI_CSRF_NAME = "sAntiCsrf";
var FRONT_TOKEN_NAME = "sFrontToken";
/**
 * @description attempts to call the refresh token API each time we are sure the session has expired, or it throws an error or,
 * or the ID_COOKIE_NAME has changed value -> which may mean that we have a new set of tokens.
 */
function onUnauthorisedResponse(refreshTokenUrl, preRequestIdToken, refreshAPICustomHeaders, sessionExpiredStatusCode) {
    return __awaiter(this, void 0, void 0, function() {
        var lock, _loop_1, state_1;
        var _this = this;
        return __generator(this, function(_a) {
            switch (_a.label) {
                case 0:
                    lock = new browser_tabs_lock_1.default();
                    _loop_1 = function() {
                        var postLockID,
                            headers,
                            antiCsrfToken,
                            response,
                            removeIdRefreshToken_1,
                            error_1,
                            idCookieValue;
                        return __generator(this, function(_a) {
                            switch (_a.label) {
                                case 0:
                                    return [4 /*yield*/, lock.acquireLock("REFRESH_TOKEN_USE", 1000)];
                                case 1:
                                    if (!_a.sent()) return [3 /*break*/, 15];
                                    _a.label = 2;
                                case 2:
                                    _a.trys.push([2, 12, 14, 15]);
                                    return [4 /*yield*/, getIdRefreshToken(false)];
                                case 3:
                                    postLockID = _a.sent();
                                    if (postLockID.status === "NOT_EXISTS") {
                                        return [2 /*return*/, { value: { result: "SESSION_EXPIRED" } }];
                                    }
                                    if (
                                        postLockID.status !== preRequestIdToken.status ||
                                        (postLockID.status === "EXISTS" &&
                                            preRequestIdToken.status === "EXISTS" &&
                                            postLockID.token !== preRequestIdToken.token)
                                    ) {
                                        return [2 /*return*/, { value: { result: "RETRY" } }];
                                    }
                                    headers = __assign({}, refreshAPICustomHeaders);
                                    if (!(preRequestIdToken.status === "EXISTS")) return [3 /*break*/, 5];
                                    return [4 /*yield*/, AntiCsrfToken.getToken(preRequestIdToken.token)];
                                case 4:
                                    antiCsrfToken = _a.sent();
                                    if (antiCsrfToken !== undefined) {
                                        headers = __assign({}, headers, { "anti-csrf": antiCsrfToken });
                                    }
                                    _a.label = 5;
                                case 5:
                                    headers = __assign({ rid: AuthHttpRequest.rid }, headers, {
                                        "fdi-version": version_1.supported_fdi.join(",")
                                    });
                                    return [
                                        4 /*yield*/,
                                        AuthHttpRequest.env.__supertokensOriginalFetch(refreshTokenUrl, {
                                            method: "post",
                                            credentials: "include",
                                            headers: headers
                                        })
                                    ];
                                case 6:
                                    response = _a.sent();
                                    removeIdRefreshToken_1 = true;
                                    return [
                                        4 /*yield*/,
                                        loopThroughResponseHeadersAndApplyFunction(response, function(value, key) {
                                            return __awaiter(_this, void 0, void 0, function() {
                                                return __generator(this, function(_a) {
                                                    switch (_a.label) {
                                                        case 0:
                                                            if (!(key.toString() === "id-refresh-token"))
                                                                return [3 /*break*/, 2];
                                                            return [4 /*yield*/, setIdRefreshToken(value)];
                                                        case 1:
                                                            _a.sent();
                                                            removeIdRefreshToken_1 = false;
                                                            _a.label = 2;
                                                        case 2:
                                                            return [2 /*return*/];
                                                    }
                                                });
                                            });
                                        })
                                    ];
                                case 7:
                                    _a.sent();
                                    if (!(response.status === sessionExpiredStatusCode)) return [3 /*break*/, 9];
                                    if (!removeIdRefreshToken_1) return [3 /*break*/, 9];
                                    return [4 /*yield*/, setIdRefreshToken("remove")];
                                case 8:
                                    _a.sent();
                                    _a.label = 9;
                                case 9:
                                    if (response.status >= 300) {
                                        throw response;
                                    }
                                    return [4 /*yield*/, getIdRefreshToken(false)];
                                case 10:
                                    if (_a.sent().status === "NOT_EXISTS") {
                                        return [2 /*return*/, { value: { result: "SESSION_EXPIRED" } }];
                                    }
                                    return [
                                        4 /*yield*/,
                                        loopThroughResponseHeadersAndApplyFunction(response, function(value, key) {
                                            return __awaiter(_this, void 0, void 0, function() {
                                                var tok;
                                                return __generator(this, function(_a) {
                                                    switch (_a.label) {
                                                        case 0:
                                                            if (!(key.toString() === "anti-csrf"))
                                                                return [3 /*break*/, 4];
                                                            return [4 /*yield*/, getIdRefreshToken(false)];
                                                        case 1:
                                                            tok = _a.sent();
                                                            if (!(tok.status === "EXISTS")) return [3 /*break*/, 3];
                                                            return [
                                                                4 /*yield*/,
                                                                AntiCsrfToken.setItem(tok.token, value)
                                                            ];
                                                        case 2:
                                                            _a.sent();
                                                            _a.label = 3;
                                                        case 3:
                                                            return [3 /*break*/, 6];
                                                        case 4:
                                                            if (!(key.toString() === "front-token"))
                                                                return [3 /*break*/, 6];
                                                            return [4 /*yield*/, FrontToken.setItem(value)];
                                                        case 5:
                                                            _a.sent();
                                                            _a.label = 6;
                                                        case 6:
                                                            return [2 /*return*/];
                                                    }
                                                });
                                            });
                                        })
                                    ];
                                case 11:
                                    _a.sent();
                                    return [2 /*return*/, { value: { result: "RETRY" } }];
                                case 12:
                                    error_1 = _a.sent();
                                    return [4 /*yield*/, getIdRefreshToken(false)];
                                case 13:
                                    if (_a.sent().status === "NOT_EXISTS") {
                                        return [2 /*return*/, { value: { result: "SESSION_EXPIRED" } }];
                                    }
                                    return [2 /*return*/, { value: { result: "API_ERROR", error: error_1 } }];
                                case 14:
                                    lock.releaseLock("REFRESH_TOKEN_USE");
                                    return [7 /*endfinally*/];
                                case 15:
                                    return [4 /*yield*/, getIdRefreshToken(false)];
                                case 16:
                                    idCookieValue = _a.sent();
                                    if (idCookieValue.status === "NOT_EXISTS") {
                                        return [2 /*return*/, { value: { result: "SESSION_EXPIRED" } }];
                                    } else {
                                        if (
                                            idCookieValue.status !== preRequestIdToken.status ||
                                            (idCookieValue.status === "EXISTS" &&
                                                preRequestIdToken.status === "EXISTS" &&
                                                idCookieValue.token !== preRequestIdToken.token)
                                        ) {
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
                var fromCookie, fromLocalstorage;
                return __generator(this, function(_a) {
                    switch (_a.label) {
                        case 0:
                            fromCookie = getIDFromCookieOld();
                            if (fromCookie !== undefined) {
                                return [2 /*return*/, fromCookie];
                            }
                            return [
                                4 /*yield*/,
                                AuthHttpRequest.crossDomainLocalstorage.getItem(ID_REFRESH_TOKEN_NAME)
                            ];
                        case 1:
                            fromLocalstorage = _a.sent();
                            if (!(fromLocalstorage !== null)) return [3 /*break*/, 3];
                            return [4 /*yield*/, setIdRefreshToken(fromLocalstorage)];
                        case 2:
                            _a.sent();
                            _a.label = 3;
                        case 3:
                            return [2 /*return*/, fromLocalstorage === null ? undefined : fromLocalstorage];
                    }
                });
            });
        }
        var token, response, err_2;
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
                    if (!(token === undefined)) return [3 /*break*/, 8];
                    response = {
                        status: "MAY_EXIST"
                    };
                    if (!tryRefresh) return [3 /*break*/, 7];
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    return [
                        4 /*yield*/,
                        handleUnauthorised(
                            AuthHttpRequest.refreshTokenUrl,
                            response,
                            AuthHttpRequest.refreshAPICustomHeaders,
                            AuthHttpRequest.sessionExpiredStatusCode
                        )
                    ];
                case 3:
                    _a.sent();
                    return [3 /*break*/, 5];
                case 4:
                    err_2 = _a.sent();
                    // in case the backend is not working, we treat it as the session not existing...
                    return [
                        2 /*return*/,
                        {
                            status: "NOT_EXISTS"
                        }
                    ];
                case 5:
                    return [4 /*yield*/, getIdRefreshToken(tryRefresh)];
                case 6:
                    return [2 /*return*/, _a.sent()];
                case 7:
                    return [2 /*return*/, response];
                case 8:
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
function setIdRefreshToken(idRefreshToken) {
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
                    (AuthHttpRequest.isInIframe ? "none;secure" : "lax");
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
                    (AuthHttpRequest.isInIframe ? "none;secure" : "lax");
            }
        }
        return __generator(this, function(_a) {
            switch (_a.label) {
                case 0:
                    setIDToCookie(
                        idRefreshToken,
                        AuthHttpRequest.sessionScope === undefined
                            ? utils_1.normaliseSessionScopeOrThrowError(utils_1.getWindowOrThrow().location.hostname)
                            : AuthHttpRequest.sessionScope.scope
                    );
                    return [4 /*yield*/, AuthHttpRequest.crossDomainLocalstorage.removeItem(ID_REFRESH_TOKEN_NAME)];
                case 1:
                    _a.sent();
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
        var fromCookie, fromLocalstorage;
        return __generator(this, function(_a) {
            switch (_a.label) {
                case 0:
                    return [4 /*yield*/, AuthHttpRequest.doesSessionExist()];
                case 1:
                    if (!_a.sent()) {
                        return [2 /*return*/, null];
                    }
                    fromCookie = getAntiCSRFromCookie();
                    if (fromCookie !== null) {
                        return [2 /*return*/, fromCookie];
                    }
                    return [4 /*yield*/, AuthHttpRequest.crossDomainLocalstorage.getItem(ANTI_CSRF_NAME)];
                case 2:
                    fromLocalstorage = _a.sent();
                    if (!(fromLocalstorage !== null)) return [3 /*break*/, 4];
                    return [4 /*yield*/, setAntiCSRF(fromLocalstorage)];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4:
                    return [2 /*return*/, fromLocalstorage];
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
                        (AuthHttpRequest.isInIframe ? "none;secure" : "lax");
                } else {
                    utils_1.getWindowOrThrow().document.cookie =
                        ANTI_CSRF_NAME +
                        "=" +
                        cookieVal +
                        ";expires=Fri, 31 Dec 9999 23:59:59 GMT;path=/;samesite=" +
                        (AuthHttpRequest.isInIframe ? "none;secure" : "lax");
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
                        (AuthHttpRequest.isInIframe ? "none;secure" : "lax");
                } else {
                    utils_1.getWindowOrThrow().document.cookie =
                        ANTI_CSRF_NAME +
                        "=" +
                        cookieVal +
                        ";domain=" +
                        domain +
                        ";expires=Fri, 31 Dec 9999 23:59:59 GMT;path=/;samesite=" +
                        (AuthHttpRequest.isInIframe ? "none;secure" : "lax");
                }
            }
        }
        return __generator(this, function(_a) {
            switch (_a.label) {
                case 0:
                    setAntiCSRFToCookie(
                        antiCSRFToken,
                        AuthHttpRequest.sessionScope === undefined
                            ? utils_1.normaliseSessionScopeOrThrowError(utils_1.getWindowOrThrow().location.hostname)
                            : AuthHttpRequest.sessionScope.scope
                    );
                    return [4 /*yield*/, AuthHttpRequest.crossDomainLocalstorage.removeItem(ANTI_CSRF_NAME)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
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
        var fromCookie, fromLocalstorage;
        return __generator(this, function(_a) {
            switch (_a.label) {
                case 0:
                    return [4 /*yield*/, AuthHttpRequest.doesSessionExist()];
                case 1:
                    if (!_a.sent()) {
                        return [2 /*return*/, null];
                    }
                    fromCookie = getFrontTokenFromCookie();
                    if (fromCookie !== null) {
                        return [2 /*return*/, fromCookie];
                    }
                    return [4 /*yield*/, AuthHttpRequest.crossDomainLocalstorage.getItem(FRONT_TOKEN_NAME)];
                case 2:
                    fromLocalstorage = _a.sent();
                    if (!(fromLocalstorage !== null)) return [3 /*break*/, 4];
                    return [4 /*yield*/, setFrontToken(fromLocalstorage)];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4:
                    return [2 /*return*/, fromLocalstorage];
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
                        (AuthHttpRequest.isInIframe ? "none;secure" : "lax");
                } else {
                    utils_1.getWindowOrThrow().document.cookie =
                        FRONT_TOKEN_NAME +
                        "=" +
                        cookieVal +
                        ";expires=Fri, 31 Dec 9999 23:59:59 GMT;path=/;samesite=" +
                        (AuthHttpRequest.isInIframe ? "none;secure" : "lax");
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
                        (AuthHttpRequest.isInIframe ? "none;secure" : "lax");
                } else {
                    utils_1.getWindowOrThrow().document.cookie =
                        FRONT_TOKEN_NAME +
                        "=" +
                        cookieVal +
                        ";domain=" +
                        domain +
                        ";expires=Fri, 31 Dec 9999 23:59:59 GMT;path=/;samesite=" +
                        (AuthHttpRequest.isInIframe ? "none;secure" : "lax");
                }
            }
        }
        return __generator(this, function(_a) {
            switch (_a.label) {
                case 0:
                    setFrontTokenToCookie(
                        frontToken,
                        AuthHttpRequest.sessionScope === undefined
                            ? utils_1.normaliseSessionScopeOrThrowError(utils_1.getWindowOrThrow().location.hostname)
                            : AuthHttpRequest.sessionScope.scope
                    );
                    return [4 /*yield*/, AuthHttpRequest.crossDomainLocalstorage.removeItem(FRONT_TOKEN_NAME)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
exports.setFrontToken = setFrontToken;
//# sourceMappingURL=fetch.js.map
