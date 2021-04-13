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
                    if (!(preRequestIdToken === undefined)) return [3 /*break*/, 2];
                    return [4 /*yield*/, getIdRefreshToken()];
                case 1:
                    return [2 /*return*/, _a.sent() !== undefined];
                case 2:
                    return [
                        4 /*yield*/,
                        onUnauthorisedResponse(
                            refreshAPI,
                            preRequestIdToken,
                            refreshAPICustomHeaders,
                            sessionExpiredStatusCode
                        )
                    ];
                case 3:
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
            autoAddCredentials = _a.autoAddCredentials;
        AuthHttpRequest.autoAddCredentials = autoAddCredentials;
        AuthHttpRequest.refreshTokenUrl = apiDomain + apiBasePath + "/session/refresh";
        AuthHttpRequest.signOutUrl = apiDomain + apiBasePath + "/signout";
        AuthHttpRequest.refreshAPICustomHeaders = refreshAPICustomHeaders;
        AuthHttpRequest.signoutAPICustomHeaders = signoutAPICustomHeaders;
        AuthHttpRequest.sessionScope = sessionScope;
        AuthHttpRequest.sessionExpiredStatusCode = sessionExpiredStatusCode;
        AuthHttpRequest.apiDomain = apiDomain;
        AuthHttpRequest.crossDomainLocalstorage = new crossDomainLocalstorage_1.default(sessionScope);
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
                        return [4 /*yield*/, getIdRefreshToken()];
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
                antiCsrfToken,
                configWithAntiCsrf,
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
                                    utils_1.normaliseURLDomainOrThrowError(url) !== AuthHttpRequest.apiDomain &&
                                    AuthHttpRequest.addedFetchInterceptor) ||
                                (url !== undefined &&
                                typeof url.url === "string" && // this is because url can be an object like {method: ..., url: ...}
                                    utils_1.normaliseURLDomainOrThrowError(url.url) !== AuthHttpRequest.apiDomain &&
                                    AuthHttpRequest.addedFetchInterceptor);
                        } catch (err) {
                            if (err.message === "Please provide a valid domain name") {
                                // .origin gives the port as well..
                                doNotDoInterception =
                                    utils_1.normaliseURLDomainOrThrowError(window.location.origin) !==
                                        AuthHttpRequest.apiDomain && AuthHttpRequest.addedFetchInterceptor;
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
                        _a.trys.push([3, , 20, 25]);
                        throwError = false;
                        returnObj = undefined;
                        _a.label = 4;
                    case 4:
                        if (!true) return [3 /*break*/, 19];
                        return [4 /*yield*/, getIdRefreshToken()];
                    case 5:
                        preRequestIdToken = _a.sent();
                        return [4 /*yield*/, AntiCsrfToken.getToken(preRequestIdToken)];
                    case 6:
                        antiCsrfToken = _a.sent();
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
                        _a.label = 7;
                    case 7:
                        _a.trys.push([7, 14, , 18]);
                        return [4 /*yield*/, httpCall(configWithAntiCsrf)];
                    case 8:
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
                    case 9:
                        _a.sent();
                        if (!(response.status === AuthHttpRequest.sessionExpiredStatusCode)) return [3 /*break*/, 11];
                        return [
                            4 /*yield*/,
                            handleUnauthorised(
                                AuthHttpRequest.refreshTokenUrl,
                                preRequestIdToken,
                                AuthHttpRequest.refreshAPICustomHeaders,
                                AuthHttpRequest.sessionExpiredStatusCode
                            )
                        ];
                    case 10:
                        retry = _a.sent();
                        if (!retry) {
                            returnObj = response;
                            return [3 /*break*/, 19];
                        }
                        return [3 /*break*/, 13];
                    case 11:
                        return [
                            4 /*yield*/,
                            loopThroughResponseHeadersAndApplyFunction(response, function(value, key) {
                                return __awaiter(_this, void 0, void 0, function() {
                                    var _a, _b;
                                    return __generator(this, function(_c) {
                                        switch (_c.label) {
                                            case 0:
                                                if (!(key.toString() === "anti-csrf")) return [3 /*break*/, 3];
                                                _b = (_a = AntiCsrfToken).setItem;
                                                return [4 /*yield*/, getIdRefreshToken()];
                                            case 1:
                                                return [4 /*yield*/, _b.apply(_a, [_c.sent(), value])];
                                            case 2:
                                                _c.sent();
                                                return [3 /*break*/, 5];
                                            case 3:
                                                if (!(key.toString() === "front-token")) return [3 /*break*/, 5];
                                                return [4 /*yield*/, FrontToken.setItem(value)];
                                            case 4:
                                                _c.sent();
                                                _c.label = 5;
                                            case 5:
                                                return [2 /*return*/];
                                        }
                                    });
                                });
                            })
                        ];
                    case 12:
                        _a.sent();
                        return [2 /*return*/, response];
                    case 13:
                        return [3 /*break*/, 18];
                    case 14:
                        err_1 = _a.sent();
                        if (!(err_1.status === AuthHttpRequest.sessionExpiredStatusCode)) return [3 /*break*/, 16];
                        return [
                            4 /*yield*/,
                            handleUnauthorised(
                                AuthHttpRequest.refreshTokenUrl,
                                preRequestIdToken,
                                AuthHttpRequest.refreshAPICustomHeaders,
                                AuthHttpRequest.sessionExpiredStatusCode
                            )
                        ];
                    case 15:
                        retry = _a.sent();
                        if (!retry) {
                            throwError = true;
                            returnObj = err_1;
                            return [3 /*break*/, 19];
                        }
                        return [3 /*break*/, 17];
                    case 16:
                        throw err_1;
                    case 17:
                        return [3 /*break*/, 18];
                    case 18:
                        return [3 /*break*/, 4];
                    case 19:
                        // if it comes here, means we breaked. which happens only if we have logged out.
                        if (throwError) {
                            throw returnObj;
                        } else {
                            return [2 /*return*/, returnObj];
                        }
                        return [3 /*break*/, 25];
                    case 20:
                        return [4 /*yield*/, getIdRefreshToken()];
                    case 21:
                        if (!(_a.sent() === undefined)) return [3 /*break*/, 24];
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
                        return [4 /*yield*/, getIdRefreshToken()];
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
                        return [4 /*yield*/, getIdRefreshToken()];
                    case 5:
                        if (!(_a.sent() === undefined)) return [3 /*break*/, 8];
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
        return __awaiter(_this, void 0, void 0, function() {
            return __generator(this, function(_a) {
                switch (_a.label) {
                    case 0:
                        return [4 /*yield*/, getIdRefreshToken()];
                    case 1:
                        return [2 /*return*/, _a.sent() !== undefined];
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
                                    if (!_a.sent()) return [3 /*break*/, 14];
                                    _a.label = 2;
                                case 2:
                                    _a.trys.push([2, 11, 13, 14]);
                                    return [4 /*yield*/, getIdRefreshToken()];
                                case 3:
                                    postLockID = _a.sent();
                                    if (postLockID === undefined) {
                                        return [2 /*return*/, { value: { result: "SESSION_EXPIRED" } }];
                                    }
                                    if (postLockID !== preRequestIdToken) {
                                        return [2 /*return*/, { value: { result: "RETRY" } }];
                                    }
                                    return [4 /*yield*/, AntiCsrfToken.getToken(preRequestIdToken)];
                                case 4:
                                    antiCsrfToken = _a.sent();
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
                                case 5:
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
                                case 6:
                                    _a.sent();
                                    if (!(response.status === sessionExpiredStatusCode)) return [3 /*break*/, 8];
                                    if (!removeIdRefreshToken_1) return [3 /*break*/, 8];
                                    return [4 /*yield*/, setIdRefreshToken("remove")];
                                case 7:
                                    _a.sent();
                                    _a.label = 8;
                                case 8:
                                    if (response.status >= 300) {
                                        throw response;
                                    }
                                    return [4 /*yield*/, getIdRefreshToken()];
                                case 9:
                                    if (_a.sent() === undefined) {
                                        return [2 /*return*/, { value: { result: "SESSION_EXPIRED" } }];
                                    }
                                    return [
                                        4 /*yield*/,
                                        loopThroughResponseHeadersAndApplyFunction(response, function(value, key) {
                                            return __awaiter(_this, void 0, void 0, function() {
                                                var _a, _b;
                                                return __generator(this, function(_c) {
                                                    switch (_c.label) {
                                                        case 0:
                                                            if (!(key.toString() === "anti-csrf"))
                                                                return [3 /*break*/, 3];
                                                            _b = (_a = AntiCsrfToken).setItem;
                                                            return [4 /*yield*/, getIdRefreshToken()];
                                                        case 1:
                                                            return [4 /*yield*/, _b.apply(_a, [_c.sent(), value])];
                                                        case 2:
                                                            _c.sent();
                                                            return [3 /*break*/, 5];
                                                        case 3:
                                                            if (!(key.toString() === "front-token"))
                                                                return [3 /*break*/, 5];
                                                            return [4 /*yield*/, FrontToken.setItem(value)];
                                                        case 4:
                                                            _c.sent();
                                                            _c.label = 5;
                                                        case 5:
                                                            return [2 /*return*/];
                                                    }
                                                });
                                            });
                                        })
                                    ];
                                case 10:
                                    _a.sent();
                                    return [2 /*return*/, { value: { result: "RETRY" } }];
                                case 11:
                                    error_1 = _a.sent();
                                    return [4 /*yield*/, getIdRefreshToken()];
                                case 12:
                                    if (_a.sent() === undefined) {
                                        return [2 /*return*/, { value: { result: "SESSION_EXPIRED" } }];
                                    }
                                    return [2 /*return*/, { value: { result: "API_ERROR", error: error_1 } }];
                                case 13:
                                    lock.releaseLock("REFRESH_TOKEN_USE");
                                    return [7 /*endfinally*/];
                                case 14:
                                    return [4 /*yield*/, getIdRefreshToken()];
                                case 15:
                                    idCookieValue = _a.sent();
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
function getIdRefreshToken() {
    return __awaiter(this, void 0, void 0, function() {
        // for backwards compatibility
        function getIDFromCookieOld() {
            var value = "; " + utils_1.getWindowOrThrow().document.cookie;
            var parts = value.split("; " + ID_REFRESH_TOKEN_NAME + "=");
            if (parts.length >= 2) {
                var last = parts.pop();
                if (last !== undefined) {
                    return last.split(";").shift();
                }
            }
            return undefined;
        }
        var fromLocalstorage, splitted, value, expires, fromCookie;
        return __generator(this, function(_a) {
            switch (_a.label) {
                case 0:
                    return [4 /*yield*/, AuthHttpRequest.crossDomainLocalstorage.getItem(ID_REFRESH_TOKEN_NAME)];
                case 1:
                    fromLocalstorage = _a.sent();
                    if (!(fromLocalstorage !== null)) return [3 /*break*/, 4];
                    splitted = fromLocalstorage.split(";");
                    value = splitted[0];
                    expires = Number(splitted[1]);
                    if (!(expires < Date.now())) return [3 /*break*/, 3];
                    return [4 /*yield*/, setIdRefreshToken("remove")];
                case 2:
                    _a.sent();
                    value = undefined;
                    _a.label = 3;
                case 3:
                    return [2 /*return*/, value];
                case 4:
                    fromCookie = getIDFromCookieOld();
                    if (!(fromCookie !== undefined)) return [3 /*break*/, 6];
                    return [4 /*yield*/, setIdRefreshToken(fromCookie + ";9999999999999")];
                case 5:
                    _a.sent();
                    _a.label = 6;
                case 6:
                    return [2 /*return*/, fromCookie];
            }
        });
    });
}
exports.getIdRefreshToken = getIdRefreshToken;
function setIdRefreshToken(idRefreshToken) {
    return __awaiter(this, void 0, void 0, function() {
        // for backwards compatibility
        function setIDToCookieOld(idRefreshToken, domain) {
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
                    ID_REFRESH_TOKEN_NAME + "=" + cookieVal + ";expires=" + expires + ";path=/";
            } else {
                utils_1.getWindowOrThrow().document.cookie =
                    ID_REFRESH_TOKEN_NAME + "=" + cookieVal + ";expires=" + expires + ";domain=" + domain + ";path=/";
            }
        }
        return __generator(this, function(_a) {
            switch (_a.label) {
                case 0:
                    if (!(idRefreshToken === "remove")) return [3 /*break*/, 2];
                    return [4 /*yield*/, AuthHttpRequest.crossDomainLocalstorage.removeItem(ID_REFRESH_TOKEN_NAME)];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 2:
                    return [
                        4 /*yield*/,
                        AuthHttpRequest.crossDomainLocalstorage.setItem(ID_REFRESH_TOKEN_NAME, idRefreshToken)
                    ];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4:
                    setIDToCookieOld(
                        "remove",
                        AuthHttpRequest.sessionScope === undefined
                            ? utils_1.normaliseSessionScopeOrThrowError(utils_1.getWindowOrThrow().location.hostname)
                            : AuthHttpRequest.sessionScope.scope
                    );
                    return [2 /*return*/];
            }
        });
    });
}
exports.setIdRefreshToken = setIdRefreshToken;
function getAntiCSRFToken() {
    return __awaiter(this, void 0, void 0, function() {
        // for backwards compatibility
        function getAntiCSRFromCookieOld() {
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
        var fromLocalstorage, fromCookie;
        return __generator(this, function(_a) {
            switch (_a.label) {
                case 0:
                    return [4 /*yield*/, AuthHttpRequest.crossDomainLocalstorage.getItem(ANTI_CSRF_NAME)];
                case 1:
                    fromLocalstorage = _a.sent();
                    if (fromLocalstorage !== null) {
                        return [2 /*return*/, fromLocalstorage];
                    }
                    fromCookie = getAntiCSRFromCookieOld();
                    if (!(fromCookie !== null)) return [3 /*break*/, 3];
                    return [4 /*yield*/, setAntiCSRF(fromCookie)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    return [2 /*return*/, fromCookie];
            }
        });
    });
}
// give antiCSRFToken as undefined to remove it.
function setAntiCSRF(antiCSRFToken) {
    return __awaiter(this, void 0, void 0, function() {
        // for backwards compatibility
        function setAntiCSRFToCookieOld(antiCSRFToken, domain) {
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
                        ANTI_CSRF_NAME + "=" + cookieVal + ";expires=" + expires + ";path=/";
                } else {
                    utils_1.getWindowOrThrow().document.cookie =
                        ANTI_CSRF_NAME + "=" + cookieVal + ";expires=Fri, 31 Dec 9999 23:59:59 GMT;path=/";
                }
            } else {
                if (expires !== undefined) {
                    utils_1.getWindowOrThrow().document.cookie =
                        ANTI_CSRF_NAME + "=" + cookieVal + ";expires=" + expires + ";domain=" + domain + ";path=/";
                } else {
                    utils_1.getWindowOrThrow().document.cookie =
                        ANTI_CSRF_NAME +
                        "=" +
                        cookieVal +
                        ";domain=" +
                        domain +
                        ";expires=Fri, 31 Dec 9999 23:59:59 GMT;path=/";
                }
            }
        }
        return __generator(this, function(_a) {
            switch (_a.label) {
                case 0:
                    if (!(antiCSRFToken === undefined)) return [3 /*break*/, 2];
                    return [4 /*yield*/, AuthHttpRequest.crossDomainLocalstorage.removeItem(ANTI_CSRF_NAME)];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 2:
                    return [
                        4 /*yield*/,
                        AuthHttpRequest.crossDomainLocalstorage.setItem(ANTI_CSRF_NAME, antiCSRFToken)
                    ];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4:
                    setAntiCSRFToCookieOld(
                        undefined,
                        AuthHttpRequest.sessionScope === undefined
                            ? utils_1.normaliseSessionScopeOrThrowError(utils_1.getWindowOrThrow().location.hostname)
                            : AuthHttpRequest.sessionScope.scope
                    );
                    return [2 /*return*/];
            }
        });
    });
}
exports.setAntiCSRF = setAntiCSRF;
function getFrontToken() {
    return __awaiter(this, void 0, void 0, function() {
        // for backwards compatibility
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
        var fromLocalstorage, fromCookie;
        return __generator(this, function(_a) {
            switch (_a.label) {
                case 0:
                    return [4 /*yield*/, AuthHttpRequest.crossDomainLocalstorage.getItem(FRONT_TOKEN_NAME)];
                case 1:
                    fromLocalstorage = _a.sent();
                    if (fromLocalstorage !== null) {
                        return [2 /*return*/, fromLocalstorage];
                    }
                    fromCookie = getFrontTokenFromCookie();
                    if (!(fromCookie !== null)) return [3 /*break*/, 3];
                    return [4 /*yield*/, setFrontToken(fromCookie)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    return [2 /*return*/, fromCookie];
            }
        });
    });
}
exports.getFrontToken = getFrontToken;
function setFrontToken(frontToken) {
    return __awaiter(this, void 0, void 0, function() {
        // backwards compatibility
        function setFrontTokenToCookieOld(frontToken, domain) {
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
                        FRONT_TOKEN_NAME + "=" + cookieVal + ";expires=" + expires + ";path=/";
                } else {
                    utils_1.getWindowOrThrow().document.cookie =
                        FRONT_TOKEN_NAME + "=" + cookieVal + ";expires=Fri, 31 Dec 9999 23:59:59 GMT;path=/";
                }
            } else {
                if (expires !== undefined) {
                    utils_1.getWindowOrThrow().document.cookie =
                        FRONT_TOKEN_NAME + "=" + cookieVal + ";expires=" + expires + ";domain=" + domain + ";path=/";
                } else {
                    utils_1.getWindowOrThrow().document.cookie =
                        FRONT_TOKEN_NAME +
                        "=" +
                        cookieVal +
                        ";domain=" +
                        domain +
                        ";expires=Fri, 31 Dec 9999 23:59:59 GMT;path=/";
                }
            }
        }
        return __generator(this, function(_a) {
            switch (_a.label) {
                case 0:
                    if (!(frontToken === undefined)) return [3 /*break*/, 2];
                    return [4 /*yield*/, AuthHttpRequest.crossDomainLocalstorage.removeItem(FRONT_TOKEN_NAME)];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 2:
                    return [4 /*yield*/, AuthHttpRequest.crossDomainLocalstorage.setItem(FRONT_TOKEN_NAME, frontToken)];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4:
                    setFrontTokenToCookieOld(
                        undefined,
                        AuthHttpRequest.sessionScope === undefined
                            ? utils_1.normaliseSessionScopeOrThrowError(utils_1.getWindowOrThrow().location.hostname)
                            : AuthHttpRequest.sessionScope.scope
                    );
                    return [2 /*return*/];
            }
        });
    });
}
exports.setFrontToken = setFrontToken;
//# sourceMappingURL=fetch.js.map
