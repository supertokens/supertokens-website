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
var handleSessionExp_1 = require("./handleSessionExp");
var processState_1 = require("./processState");
var version_1 = require("./version");
var AntiCsrfToken = /** @class */ (function() {
    function AntiCsrfToken() {}
    AntiCsrfToken.getToken = function(associatedIdRefreshToken) {
        if (associatedIdRefreshToken === undefined) {
            AntiCsrfToken.tokenInfo = undefined;
            return undefined;
        }
        if (AntiCsrfToken.tokenInfo === undefined) {
            var antiCsrf = window.localStorage.getItem("anti-csrf-localstorage");
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
        window.localStorage.removeItem("anti-csrf-localstorage");
    };
    AntiCsrfToken.setItem = function(associatedIdRefreshToken, antiCsrf) {
        if (associatedIdRefreshToken === undefined) {
            AntiCsrfToken.tokenInfo = undefined;
            return undefined;
        }
        window.localStorage.setItem("anti-csrf-localstorage", antiCsrf);
        AntiCsrfToken.tokenInfo = {
            antiCsrf: antiCsrf,
            associatedIdRefreshToken: associatedIdRefreshToken
        };
    };
    return AntiCsrfToken;
})();
exports.AntiCsrfToken = AntiCsrfToken;
/**
 * @description returns true if retry, else false is session has expired completely.
 */
function handleUnauthorised(
    refreshAPI,
    preRequestIdToken,
    websiteRootDomain,
    refreshAPICustomHeaders,
    sessionExpiredStatusCode
) {
    return __awaiter(this, void 0, void 0, function() {
        var result;
        return __generator(this, function(_a) {
            switch (_a.label) {
                case 0:
                    if (refreshAPI === undefined) {
                        throw Error("Please define refresh token API in the init function");
                    }
                    if (preRequestIdToken === undefined) {
                        return [2 /*return*/, handleSessionExp_1.getIDFromCookie() !== undefined];
                    }
                    return [
                        4 /*yield*/,
                        handleSessionExp_1.onUnauthorisedResponse(
                            refreshAPI,
                            preRequestIdToken,
                            websiteRootDomain,
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
function getDomainFromUrl(url) {
    // if (window.fetch === undefined) {
    //     // we are testing
    //     return "http://localhost:8888";
    // }
    if (url.startsWith("https://") || url.startsWith("http://")) {
        return url
            .split("/")
            .filter(function(_, i) {
                return i <= 2;
            })
            .join("/");
    } else {
        return window.location.origin;
    }
}
exports.getDomainFromUrl = getDomainFromUrl;
/**
 * @class AuthHttpRequest
 * @description wrapper for common http methods.
 */
var AuthHttpRequest = /** @class */ (function() {
    function AuthHttpRequest() {}
    AuthHttpRequest.init = function(
        refreshTokenUrl,
        sessionExpiredStatusCode,
        viaInterceptor,
        websiteRootDomain,
        refreshAPICustomHeaders
    ) {
        if (viaInterceptor === undefined) {
            if (AuthHttpRequest.viaInterceptor === undefined) {
                viaInterceptor = false;
            } else {
                viaInterceptor = AuthHttpRequest.viaInterceptor;
            }
        }
        AuthHttpRequest.refreshTokenUrl = refreshTokenUrl;
        AuthHttpRequest.refreshAPICustomHeaders = refreshAPICustomHeaders === undefined ? {} : refreshAPICustomHeaders;
        AuthHttpRequest.websiteRootDomain =
            websiteRootDomain === undefined ? window.location.hostname : websiteRootDomain;
        if (sessionExpiredStatusCode !== undefined) {
            AuthHttpRequest.sessionExpiredStatusCode = sessionExpiredStatusCode;
        }
        var env = window.fetch === undefined ? global : window;
        if (AuthHttpRequest.originalFetch === undefined) {
            AuthHttpRequest.originalFetch = env.fetch.bind(env);
        }
        if (viaInterceptor) {
            env.fetch = function(url, config) {
                return AuthHttpRequest.fetch(url, config);
            };
        }
        AuthHttpRequest.viaInterceptor = viaInterceptor;
        AuthHttpRequest.apiDomain = getDomainFromUrl(refreshTokenUrl);
        AuthHttpRequest.initCalled = true;
    };
    AuthHttpRequest.sessionExpiredStatusCode = 440;
    AuthHttpRequest.initCalled = false;
    AuthHttpRequest.apiDomain = "";
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
                                getDomainFromUrl(url) !== AuthHttpRequest.apiDomain &&
                                AuthHttpRequest.viaInterceptor
                            )
                        )
                            return [3 /*break*/, 2];
                        return [4 /*yield*/, httpCall(config)];
                    case 1:
                        // this check means that if you are using fetch via inteceptor, then we only do the refresh steps if you are calling your APIs.
                        return [2 /*return*/, _a.sent()];
                    case 2:
                        if (AuthHttpRequest.viaInterceptor) {
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
                        preRequestIdToken = handleSessionExp_1.getIDFromCookie();
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
                        // Add package info to headers
                        configWithAntiCsrf = __assign({}, configWithAntiCsrf, {
                            headers:
                                configWithAntiCsrf === undefined
                                    ? {
                                          "supertokens-sdk-name": "website",
                                          "supertokens-sdk-version": version_1.package_version
                                      }
                                    : __assign({}, configWithAntiCsrf.headers, {
                                          "supertokens-sdk-name": "website",
                                          "supertokens-sdk-version": version_1.package_version
                                      })
                        });
                        _a.label = 5;
                    case 5:
                        _a.trys.push([5, 10, , 14]);
                        return [4 /*yield*/, httpCall(configWithAntiCsrf)];
                    case 6:
                        response = _a.sent();
                        response.headers.forEach(function(value, key) {
                            if (key.toString() === "id-refresh-token") {
                                handleSessionExp_1.setIDToCookie(value, AuthHttpRequest.websiteRootDomain);
                            }
                        });
                        if (!(response.status === AuthHttpRequest.sessionExpiredStatusCode)) return [3 /*break*/, 8];
                        return [
                            4 /*yield*/,
                            handleUnauthorised(
                                AuthHttpRequest.refreshTokenUrl,
                                preRequestIdToken,
                                AuthHttpRequest.websiteRootDomain,
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
                                AntiCsrfToken.setItem(handleSessionExp_1.getIDFromCookie(), value);
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
                                AuthHttpRequest.websiteRootDomain,
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
                        if (handleSessionExp_1.getIDFromCookie() === undefined) {
                            AntiCsrfToken.removeToken();
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
                        preRequestIdToken = handleSessionExp_1.getIDFromCookie();
                        return [
                            4 /*yield*/,
                            handleUnauthorised(
                                AuthHttpRequest.refreshTokenUrl,
                                preRequestIdToken,
                                AuthHttpRequest.websiteRootDomain,
                                AuthHttpRequest.refreshAPICustomHeaders,
                                AuthHttpRequest.sessionExpiredStatusCode
                            )
                        ];
                    case 2:
                        return [2 /*return*/, _a.sent()];
                    case 3:
                        if (handleSessionExp_1.getIDFromCookie() === undefined) {
                            AntiCsrfToken.removeToken();
                        }
                        return [7 /*endfinally*/];
                    case 4:
                        return [2 /*return*/];
                }
            });
        });
    };
    AuthHttpRequest.get = function(url, config) {
        return __awaiter(_this, void 0, void 0, function() {
            return __generator(this, function(_a) {
                switch (_a.label) {
                    case 0:
                        return [4 /*yield*/, AuthHttpRequest.fetch(url, __assign({ method: "GET" }, config))];
                    case 1:
                        return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    AuthHttpRequest.post = function(url, config) {
        return __awaiter(_this, void 0, void 0, function() {
            return __generator(this, function(_a) {
                switch (_a.label) {
                    case 0:
                        return [4 /*yield*/, AuthHttpRequest.fetch(url, __assign({ method: "POST" }, config))];
                    case 1:
                        return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    AuthHttpRequest.delete = function(url, config) {
        return __awaiter(_this, void 0, void 0, function() {
            return __generator(this, function(_a) {
                switch (_a.label) {
                    case 0:
                        return [4 /*yield*/, AuthHttpRequest.fetch(url, __assign({ method: "DELETE" }, config))];
                    case 1:
                        return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    AuthHttpRequest.put = function(url, config) {
        return __awaiter(_this, void 0, void 0, function() {
            return __generator(this, function(_a) {
                switch (_a.label) {
                    case 0:
                        return [4 /*yield*/, AuthHttpRequest.fetch(url, __assign({ method: "PUT" }, config))];
                    case 1:
                        return [2 /*return*/, _a.sent()];
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
        return handleSessionExp_1.getIDFromCookie() !== undefined;
    };
    return AuthHttpRequest;
})();
exports.default = AuthHttpRequest;
