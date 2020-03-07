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
var axios_1 = require("axios");
var _1 = require(".");
var handleSessionExp_1 = require("./handleSessionExp");
var processState_1 = require("./processState");
var version_1 = require("./version");
function getUrlFromConfig(config) {
    var url = config.url === undefined ? "" : config.url;
    var baseURL = config.baseURL;
    if (baseURL !== undefined) {
        if (url.charAt(0) === "/" && baseURL.charAt(baseURL.length - 1) === "/") {
            url = baseURL + url.substr(1);
        } else if (url.charAt(0) !== "/" && baseURL.charAt(baseURL.length - 1) !== "/") {
            url = baseURL + "/" + url;
        } else {
            url = baseURL + url;
        }
    }
    return url;
}
function interceptorFunctionRequestFulfilled(config) {
    return __awaiter(this, void 0, void 0, function() {
        var url, preRequestIdToken, antiCsrfToken, configWithAntiCsrf;
        return __generator(this, function(_a) {
            url = getUrlFromConfig(config);
            if (typeof url === "string" && _1.getDomainFromUrl(url) !== AuthHttpRequest.apiDomain) {
                // this check means that if you are using axios via inteceptor, then we only do the refresh steps if you are calling your APIs.
                return [2 /*return*/, config];
            }
            processState_1.ProcessState.getInstance().addState(
                processState_1.PROCESS_STATE.CALLING_INTERCEPTION_REQUEST
            );
            preRequestIdToken = handleSessionExp_1.getIDFromCookie();
            antiCsrfToken = _1.AntiCsrfToken.getToken(preRequestIdToken);
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
            return [2 /*return*/, configWithAntiCsrf];
        });
    });
}
exports.interceptorFunctionRequestFulfilled = interceptorFunctionRequestFulfilled;
function responseInterceptor(response) {
    return __awaiter(this, void 0, void 0, function() {
        var url, idRefreshToken, config, antiCsrfToken;
        return __generator(this, function(_a) {
            try {
                if (!AuthHttpRequest.initCalled) {
                    throw new Error("init function not called");
                }
                url = getUrlFromConfig(response.config);
                if (typeof url === "string" && _1.getDomainFromUrl(url) !== AuthHttpRequest.apiDomain) {
                    // this check means that if you are using axios via inteceptor, then we only do the refresh steps if you are calling your APIs.
                    return [2 /*return*/, response];
                }
                processState_1.ProcessState.getInstance().addState(
                    processState_1.PROCESS_STATE.CALLING_INTERCEPTION_RESPONSE
                );
                idRefreshToken = response.headers["id-refresh-token"];
                if (idRefreshToken !== undefined) {
                    handleSessionExp_1.setIDToCookie(idRefreshToken, AuthHttpRequest.websiteRootDomain);
                }
                if (response.status === AuthHttpRequest.sessionExpiredStatusCode) {
                    config = response.config;
                    return [
                        2 /*return*/,
                        AuthHttpRequest.doRequest(
                            function(config) {
                                // we create an instance since we don't want to intercept this.
                                var instance = axios_1.default.create();
                                return instance(config);
                            },
                            config,
                            url,
                            response,
                            true
                        )
                    ];
                } else {
                    antiCsrfToken = response.headers["anti-csrf"];
                    if (antiCsrfToken !== undefined) {
                        _1.AntiCsrfToken.setItem(handleSessionExp_1.getIDFromCookie(), antiCsrfToken);
                    }
                    return [2 /*return*/, response];
                }
            } finally {
                if (handleSessionExp_1.getIDFromCookie() === undefined) {
                    _1.AntiCsrfToken.removeToken();
                }
            }
            return [2 /*return*/];
        });
    });
}
exports.responseInterceptor = responseInterceptor;
/**
 * @class AuthHttpRequest
 * @description wrapper for common http methods.
 */
var AuthHttpRequest = /** @class */ (function() {
    function AuthHttpRequest() {}
    AuthHttpRequest.init = function(
        refreshTokenUrl,
        sessionExpiredStatusCode,
        websiteRootDomain,
        refreshAPICustomHeaders
    ) {
        _1.default.init(refreshTokenUrl, sessionExpiredStatusCode);
        AuthHttpRequest.refreshTokenUrl = refreshTokenUrl;
        AuthHttpRequest.refreshAPICustomHeaders = refreshAPICustomHeaders === undefined ? {} : refreshAPICustomHeaders;
        AuthHttpRequest.websiteRootDomain =
            websiteRootDomain === undefined ? window.location.hostname : websiteRootDomain;
        if (sessionExpiredStatusCode !== undefined) {
            AuthHttpRequest.sessionExpiredStatusCode = sessionExpiredStatusCode;
        }
        AuthHttpRequest.apiDomain = _1.getDomainFromUrl(refreshTokenUrl);
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
    AuthHttpRequest.doRequest = function(httpCall, config, url, prevResponse, prevError, viaInterceptor) {
        if (viaInterceptor === void 0) {
            viaInterceptor = false;
        }
        return __awaiter(_this, void 0, void 0, function() {
            var throwError,
                returnObj,
                preRequestIdToken,
                antiCsrfToken,
                configWithAntiCsrf,
                localPrevError,
                localPrevResponse,
                response,
                _a,
                idRefreshToken,
                retry,
                antiCsrfToken_1,
                err_1,
                retry;
            return __generator(this, function(_b) {
                switch (_b.label) {
                    case 0:
                        if (!AuthHttpRequest.initCalled) {
                            throw Error("init function not called");
                        }
                        if (
                            !(
                                typeof url === "string" &&
                                _1.getDomainFromUrl(url) !== AuthHttpRequest.apiDomain &&
                                viaInterceptor
                            )
                        )
                            return [3 /*break*/, 2];
                        if (prevError !== undefined) {
                            throw prevError;
                        } else if (prevResponse !== undefined) {
                            return [2 /*return*/, prevResponse];
                        }
                        return [4 /*yield*/, httpCall(config)];
                    case 1:
                        // this check means that if you are using fetch via inteceptor, then we only do the refresh steps if you are calling your APIs.
                        return [2 /*return*/, _b.sent()];
                    case 2:
                        _b.trys.push([2, , 17, 18]);
                        throwError = false;
                        returnObj = undefined;
                        _b.label = 3;
                    case 3:
                        if (!true) return [3 /*break*/, 16];
                        preRequestIdToken = handleSessionExp_1.getIDFromCookie();
                        antiCsrfToken = _1.AntiCsrfToken.getToken(preRequestIdToken);
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
                        _b.label = 4;
                    case 4:
                        _b.trys.push([4, 11, , 15]);
                        localPrevError = prevError;
                        localPrevResponse = prevResponse;
                        prevError = undefined;
                        prevResponse = undefined;
                        if (localPrevError !== undefined) {
                            throw localPrevError;
                        }
                        if (!(localPrevResponse === undefined)) return [3 /*break*/, 6];
                        return [4 /*yield*/, httpCall(configWithAntiCsrf)];
                    case 5:
                        _a = _b.sent();
                        return [3 /*break*/, 7];
                    case 6:
                        _a = localPrevResponse;
                        _b.label = 7;
                    case 7:
                        response = _a;
                        idRefreshToken = response.headers["id-refresh-token"];
                        if (idRefreshToken !== undefined) {
                            handleSessionExp_1.setIDToCookie(idRefreshToken, AuthHttpRequest.websiteRootDomain);
                        }
                        if (!(response.status === AuthHttpRequest.sessionExpiredStatusCode)) return [3 /*break*/, 9];
                        return [
                            4 /*yield*/,
                            _1.handleUnauthorised(
                                AuthHttpRequest.refreshTokenUrl,
                                preRequestIdToken,
                                AuthHttpRequest.websiteRootDomain,
                                AuthHttpRequest.refreshAPICustomHeaders,
                                AuthHttpRequest.sessionExpiredStatusCode
                            )
                        ];
                    case 8:
                        retry = _b.sent();
                        if (!retry) {
                            returnObj = response;
                            return [3 /*break*/, 16];
                        }
                        return [3 /*break*/, 10];
                    case 9:
                        antiCsrfToken_1 = response.headers["anti-csrf"];
                        if (antiCsrfToken_1 !== undefined) {
                            _1.AntiCsrfToken.setItem(handleSessionExp_1.getIDFromCookie(), antiCsrfToken_1);
                        }
                        return [2 /*return*/, response];
                    case 10:
                        return [3 /*break*/, 15];
                    case 11:
                        err_1 = _b.sent();
                        if (
                            !(
                                err_1.response !== undefined &&
                                err_1.response.status === AuthHttpRequest.sessionExpiredStatusCode
                            )
                        )
                            return [3 /*break*/, 13];
                        return [
                            4 /*yield*/,
                            _1.handleUnauthorised(
                                AuthHttpRequest.refreshTokenUrl,
                                preRequestIdToken,
                                AuthHttpRequest.websiteRootDomain,
                                AuthHttpRequest.refreshAPICustomHeaders,
                                AuthHttpRequest.sessionExpiredStatusCode
                            )
                        ];
                    case 12:
                        retry = _b.sent();
                        if (!retry) {
                            throwError = true;
                            returnObj = err_1;
                            return [3 /*break*/, 16];
                        }
                        return [3 /*break*/, 14];
                    case 13:
                        throw err_1;
                    case 14:
                        return [3 /*break*/, 15];
                    case 15:
                        return [3 /*break*/, 3];
                    case 16:
                        // if it comes here, means we called break. which happens only if we have logged out.
                        if (throwError) {
                            throw returnObj;
                        } else {
                            return [2 /*return*/, returnObj];
                        }
                        return [3 /*break*/, 18];
                    case 17:
                        if (handleSessionExp_1.getIDFromCookie() === undefined) {
                            _1.AntiCsrfToken.removeToken();
                        }
                        return [7 /*endfinally*/];
                    case 18:
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
                            _1.handleUnauthorised(
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
                            _1.AntiCsrfToken.removeToken();
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
                        return [4 /*yield*/, AuthHttpRequest.axios(__assign({ method: "get", url: url }, config))];
                    case 1:
                        return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    AuthHttpRequest.post = function(url, data, config) {
        return __awaiter(_this, void 0, void 0, function() {
            return __generator(this, function(_a) {
                switch (_a.label) {
                    case 0:
                        return [
                            4 /*yield*/,
                            AuthHttpRequest.axios(__assign({ method: "post", url: url, data: data }, config))
                        ];
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
                        return [4 /*yield*/, AuthHttpRequest.axios(__assign({ method: "delete", url: url }, config))];
                    case 1:
                        return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    AuthHttpRequest.put = function(url, data, config) {
        return __awaiter(_this, void 0, void 0, function() {
            return __generator(this, function(_a) {
                switch (_a.label) {
                    case 0:
                        return [
                            4 /*yield*/,
                            AuthHttpRequest.axios(__assign({ method: "put", url: url, data: data }, config))
                        ];
                    case 1:
                        return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    AuthHttpRequest.axios = function(anything, maybeConfig) {
        return __awaiter(_this, void 0, void 0, function() {
            var config;
            return __generator(this, function(_a) {
                switch (_a.label) {
                    case 0:
                        config = {};
                        if (typeof anything === "string") {
                            if (maybeConfig === undefined) {
                                config = {
                                    url: anything,
                                    method: "get"
                                };
                            } else {
                                config = __assign({ url: anything }, maybeConfig);
                            }
                        } else {
                            config = anything;
                        }
                        return [
                            4 /*yield*/,
                            AuthHttpRequest.doRequest(
                                function(config) {
                                    // we create an instance since we don't want to intercept this.
                                    var instance = axios_1.default.create();
                                    return instance(config);
                                },
                                config,
                                config.url
                            )
                        ];
                    case 1:
                        return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    AuthHttpRequest.makeSuper = function(axiosInstance) {
        // we first check if this axiosInstance already has our interceptors.
        var requestInterceptors = axiosInstance.interceptors.request;
        for (var i = 0; i < requestInterceptors.handlers.length; i++) {
            if (requestInterceptors.handlers[i].fulfilled === interceptorFunctionRequestFulfilled) {
                return;
            }
        }
        // Add a request interceptor
        axiosInstance.interceptors.request.use(interceptorFunctionRequestFulfilled, function(error) {
            return __awaiter(this, void 0, void 0, function() {
                return __generator(this, function(_a) {
                    throw error;
                });
            });
        });
        // Add a response interceptor
        axiosInstance.interceptors.response.use(responseInterceptor, function(error) {
            return __awaiter(this, void 0, void 0, function() {
                var config;
                return __generator(this, function(_a) {
                    if (!AuthHttpRequest.initCalled) {
                        throw new Error("init function not called");
                    }
                    try {
                        if (
                            error.response !== undefined &&
                            error.response.status === AuthHttpRequest.sessionExpiredStatusCode
                        ) {
                            config = error.config;
                            return [
                                2 /*return*/,
                                AuthHttpRequest.doRequest(
                                    function(config) {
                                        // we create an instance since we don't want to intercept this.
                                        var instance = axios_1.default.create();
                                        return instance(config);
                                    },
                                    config,
                                    getUrlFromConfig(config),
                                    undefined,
                                    error,
                                    true
                                )
                            ];
                        } else {
                            throw error;
                        }
                    } finally {
                        if (handleSessionExp_1.getIDFromCookie() === undefined) {
                            _1.AntiCsrfToken.removeToken();
                        }
                    }
                    return [2 /*return*/];
                });
            });
        });
    };
    AuthHttpRequest.doesSessionExist = function() {
        return handleSessionExp_1.getIDFromCookie() !== undefined;
    };
    return AuthHttpRequest;
})();
exports.default = AuthHttpRequest;
