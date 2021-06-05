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
var fetch_1 = require("./fetch");
var processState_1 = require("./processState");
var utils_1 = require("./utils");
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
        var url, doNotDoInterception, preRequestIdToken, configWithAntiCsrf, antiCsrfToken;
        return __generator(this, function(_a) {
            switch (_a.label) {
                case 0:
                    url = getUrlFromConfig(config);
                    doNotDoInterception = false;
                    try {
                        doNotDoInterception =
                            typeof url === "string" &&
                            !utils_1.shouldDoInterceptionBasedOnUrl(
                                url,
                                fetch_1.default.apiDomain,
                                fetch_1.default.cookieDomain
                            );
                    } catch (err) {
                        if (err.message === "Please provide a valid domain name") {
                            // .origin gives the port as well..
                            doNotDoInterception = !utils_1.shouldDoInterceptionBasedOnUrl(
                                window.location.origin,
                                fetch_1.default.apiDomain,
                                fetch_1.default.cookieDomain
                            );
                        } else {
                            throw err;
                        }
                    }
                    if (doNotDoInterception) {
                        // this check means that if you are using axios via inteceptor, then we only do the refresh steps if you are calling your APIs.
                        return [2 /*return*/, config];
                    }
                    processState_1.ProcessState.getInstance().addState(
                        processState_1.PROCESS_STATE.CALLING_INTERCEPTION_REQUEST
                    );
                    return [4 /*yield*/, fetch_1.getIdRefreshToken(true)];
                case 1:
                    preRequestIdToken = _a.sent();
                    configWithAntiCsrf = config;
                    if (!(preRequestIdToken.status === "EXISTS")) return [3 /*break*/, 3];
                    return [4 /*yield*/, fetch_1.AntiCsrfToken.getToken(preRequestIdToken.token)];
                case 2:
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
                    _a.label = 3;
                case 3:
                    if (fetch_1.default.autoAddCredentials && configWithAntiCsrf.withCredentials === undefined) {
                        configWithAntiCsrf = __assign({}, configWithAntiCsrf, { withCredentials: true });
                    }
                    // adding rid for anti-csrf protection: Anti-csrf via custom header
                    configWithAntiCsrf = __assign({}, configWithAntiCsrf, {
                        headers:
                            configWithAntiCsrf === undefined
                                ? {
                                      rid: fetch_1.default.rid
                                  }
                                : __assign({ rid: fetch_1.default.rid }, configWithAntiCsrf.headers)
                    });
                    return [2 /*return*/, configWithAntiCsrf];
            }
        });
    });
}
exports.interceptorFunctionRequestFulfilled = interceptorFunctionRequestFulfilled;
function responseInterceptor(axiosInstance) {
    var _this = this;
    return function(response) {
        return __awaiter(_this, void 0, void 0, function() {
            var doNotDoInterception, url, idRefreshToken, config, antiCsrfToken, tok, frontToken, _a;
            return __generator(this, function(_b) {
                switch (_b.label) {
                    case 0:
                        doNotDoInterception = false;
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, , 11, 17]);
                        if (!fetch_1.default.initCalled) {
                            throw new Error("init function not called");
                        }
                        url = getUrlFromConfig(response.config);
                        try {
                            doNotDoInterception =
                                typeof url === "string" &&
                                !utils_1.shouldDoInterceptionBasedOnUrl(
                                    url,
                                    fetch_1.default.apiDomain,
                                    fetch_1.default.cookieDomain
                                );
                        } catch (err) {
                            if (err.message === "Please provide a valid domain name") {
                                // .origin gives the port as well..
                                doNotDoInterception = !utils_1.shouldDoInterceptionBasedOnUrl(
                                    window.location.origin,
                                    fetch_1.default.apiDomain,
                                    fetch_1.default.cookieDomain
                                );
                            } else {
                                throw err;
                            }
                        }
                        if (doNotDoInterception) {
                            // this check means that if you are using axios via inteceptor, then we only do the refresh steps if you are calling your APIs.
                            return [2 /*return*/, response];
                        }
                        processState_1.ProcessState.getInstance().addState(
                            processState_1.PROCESS_STATE.CALLING_INTERCEPTION_RESPONSE
                        );
                        idRefreshToken = response.headers["id-refresh-token"];
                        if (!(idRefreshToken !== undefined)) return [3 /*break*/, 3];
                        return [4 /*yield*/, fetch_1.setIdRefreshToken(idRefreshToken)];
                    case 2:
                        _b.sent();
                        _b.label = 3;
                    case 3:
                        if (!(response.status === fetch_1.default.sessionExpiredStatusCode)) return [3 /*break*/, 4];
                        config = response.config;
                        return [
                            2 /*return*/,
                            AuthHttpRequest.doRequest(
                                function(config) {
                                    // we create an instance since we don't want to intercept this.
                                    // const instance = axios.create();
                                    // return instance(config);
                                    return axiosInstance(config);
                                },
                                config,
                                url,
                                response,
                                true
                            )
                        ];
                    case 4:
                        antiCsrfToken = response.headers["anti-csrf"];
                        if (!(antiCsrfToken !== undefined)) return [3 /*break*/, 7];
                        return [4 /*yield*/, fetch_1.getIdRefreshToken(true)];
                    case 5:
                        tok = _b.sent();
                        if (!(tok.status === "EXISTS")) return [3 /*break*/, 7];
                        return [4 /*yield*/, fetch_1.AntiCsrfToken.setItem(tok.token, antiCsrfToken)];
                    case 6:
                        _b.sent();
                        _b.label = 7;
                    case 7:
                        frontToken = response.headers["front-token"];
                        if (!(frontToken !== undefined)) return [3 /*break*/, 9];
                        return [4 /*yield*/, fetch_1.FrontToken.setItem(frontToken)];
                    case 8:
                        _b.sent();
                        _b.label = 9;
                    case 9:
                        return [2 /*return*/, response];
                    case 10:
                        return [3 /*break*/, 17];
                    case 11:
                        _a = !doNotDoInterception;
                        if (!_a) return [3 /*break*/, 13];
                        return [4 /*yield*/, fetch_1.default.doesSessionExist()];
                    case 12:
                        _a = !_b.sent();
                        _b.label = 13;
                    case 13:
                        if (!_a) return [3 /*break*/, 16];
                        return [4 /*yield*/, fetch_1.AntiCsrfToken.removeToken()];
                    case 14:
                        _b.sent();
                        return [4 /*yield*/, fetch_1.FrontToken.removeToken()];
                    case 15:
                        _b.sent();
                        _b.label = 16;
                    case 16:
                        return [7 /*endfinally*/];
                    case 17:
                        return [2 /*return*/];
                }
            });
        });
    };
}
exports.responseInterceptor = responseInterceptor;
/**
 * @class AuthHttpRequest
 * @description wrapper for common http methods.
 */
var AuthHttpRequest = /** @class */ (function() {
    function AuthHttpRequest() {}
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
            var doNotDoInterception,
                throwError,
                returnObj,
                preRequestIdToken,
                configWithAntiCsrf,
                antiCsrfToken,
                localPrevError,
                localPrevResponse,
                response,
                _a,
                idRefreshToken,
                retry,
                antiCsrfToken,
                tok,
                frontToken,
                err_1,
                retry;
            return __generator(this, function(_b) {
                switch (_b.label) {
                    case 0:
                        if (!fetch_1.default.initCalled) {
                            throw Error("init function not called");
                        }
                        doNotDoInterception = false;
                        try {
                            doNotDoInterception =
                                typeof url === "string" &&
                                !utils_1.shouldDoInterceptionBasedOnUrl(
                                    url,
                                    fetch_1.default.apiDomain,
                                    fetch_1.default.cookieDomain
                                ) &&
                                viaInterceptor;
                        } catch (err) {
                            if (err.message === "Please provide a valid domain name") {
                                // .origin gives the port as well..
                                doNotDoInterception =
                                    !utils_1.shouldDoInterceptionBasedOnUrl(
                                        window.location.origin,
                                        fetch_1.default.apiDomain,
                                        fetch_1.default.cookieDomain
                                    ) && viaInterceptor;
                            } else {
                                throw err;
                            }
                        }
                        if (!doNotDoInterception) return [3 /*break*/, 2];
                        if (prevError !== undefined) {
                            throw prevError;
                        } else if (prevResponse !== undefined) {
                            return [2 /*return*/, prevResponse];
                        }
                        return [4 /*yield*/, httpCall(config)];
                    case 1:
                        return [2 /*return*/, _b.sent()];
                    case 2:
                        _b.trys.push([2, , 27, 32]);
                        throwError = false;
                        returnObj = undefined;
                        _b.label = 3;
                    case 3:
                        if (!true) return [3 /*break*/, 26];
                        return [4 /*yield*/, fetch_1.getIdRefreshToken(true)];
                    case 4:
                        preRequestIdToken = _b.sent();
                        configWithAntiCsrf = config;
                        if (!(preRequestIdToken.status === "EXISTS")) return [3 /*break*/, 6];
                        return [4 /*yield*/, fetch_1.AntiCsrfToken.getToken(preRequestIdToken.token)];
                    case 5:
                        antiCsrfToken = _b.sent();
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
                        _b.label = 6;
                    case 6:
                        if (fetch_1.default.autoAddCredentials && configWithAntiCsrf.withCredentials === undefined) {
                            configWithAntiCsrf = __assign({}, configWithAntiCsrf, { withCredentials: true });
                        }
                        // adding rid for anti-csrf protection: Anti-csrf via custom header
                        configWithAntiCsrf = __assign({}, configWithAntiCsrf, {
                            headers:
                                configWithAntiCsrf === undefined
                                    ? {
                                          rid: fetch_1.default.rid
                                      }
                                    : __assign({ rid: fetch_1.default.rid }, configWithAntiCsrf.headers)
                        });
                        _b.label = 7;
                    case 7:
                        _b.trys.push([7, 21, , 25]);
                        localPrevError = prevError;
                        localPrevResponse = prevResponse;
                        prevError = undefined;
                        prevResponse = undefined;
                        if (localPrevError !== undefined) {
                            throw localPrevError;
                        }
                        if (!(localPrevResponse === undefined)) return [3 /*break*/, 9];
                        return [4 /*yield*/, httpCall(configWithAntiCsrf)];
                    case 8:
                        _a = _b.sent();
                        return [3 /*break*/, 10];
                    case 9:
                        _a = localPrevResponse;
                        _b.label = 10;
                    case 10:
                        response = _a;
                        idRefreshToken = response.headers["id-refresh-token"];
                        if (!(idRefreshToken !== undefined)) return [3 /*break*/, 12];
                        return [4 /*yield*/, fetch_1.setIdRefreshToken(idRefreshToken)];
                    case 11:
                        _b.sent();
                        _b.label = 12;
                    case 12:
                        if (!(response.status === fetch_1.default.sessionExpiredStatusCode)) return [3 /*break*/, 14];
                        return [
                            4 /*yield*/,
                            fetch_1.handleUnauthorised(
                                fetch_1.default.refreshTokenUrl,
                                preRequestIdToken,
                                fetch_1.default.refreshAPICustomHeaders,
                                fetch_1.default.sessionExpiredStatusCode
                            )
                        ];
                    case 13:
                        retry = _b.sent();
                        if (!retry) {
                            returnObj = response;
                            return [3 /*break*/, 26];
                        }
                        return [3 /*break*/, 20];
                    case 14:
                        antiCsrfToken = response.headers["anti-csrf"];
                        if (!(antiCsrfToken !== undefined)) return [3 /*break*/, 17];
                        return [4 /*yield*/, fetch_1.getIdRefreshToken(true)];
                    case 15:
                        tok = _b.sent();
                        if (!(tok.status === "EXISTS")) return [3 /*break*/, 17];
                        return [4 /*yield*/, fetch_1.AntiCsrfToken.setItem(tok.token, antiCsrfToken)];
                    case 16:
                        _b.sent();
                        _b.label = 17;
                    case 17:
                        frontToken = response.headers["front-token"];
                        if (!(frontToken !== undefined)) return [3 /*break*/, 19];
                        return [4 /*yield*/, fetch_1.FrontToken.setItem(frontToken)];
                    case 18:
                        _b.sent();
                        _b.label = 19;
                    case 19:
                        return [2 /*return*/, response];
                    case 20:
                        return [3 /*break*/, 25];
                    case 21:
                        err_1 = _b.sent();
                        if (
                            !(
                                err_1.response !== undefined &&
                                err_1.response.status === fetch_1.default.sessionExpiredStatusCode
                            )
                        )
                            return [3 /*break*/, 23];
                        return [
                            4 /*yield*/,
                            fetch_1.handleUnauthorised(
                                fetch_1.default.refreshTokenUrl,
                                preRequestIdToken,
                                fetch_1.default.refreshAPICustomHeaders,
                                fetch_1.default.sessionExpiredStatusCode
                            )
                        ];
                    case 22:
                        retry = _b.sent();
                        if (!retry) {
                            throwError = true;
                            returnObj = err_1;
                            return [3 /*break*/, 26];
                        }
                        return [3 /*break*/, 24];
                    case 23:
                        throw err_1;
                    case 24:
                        return [3 /*break*/, 25];
                    case 25:
                        return [3 /*break*/, 3];
                    case 26:
                        // if it comes here, means we called break. which happens only if we have logged out.
                        if (throwError) {
                            throw returnObj;
                        } else {
                            return [2 /*return*/, returnObj];
                        }
                        return [3 /*break*/, 32];
                    case 27:
                        return [4 /*yield*/, fetch_1.default.doesSessionExist()];
                    case 28:
                        if (!!_b.sent()) return [3 /*break*/, 31];
                        return [4 /*yield*/, fetch_1.AntiCsrfToken.removeToken()];
                    case 29:
                        _b.sent();
                        return [4 /*yield*/, fetch_1.FrontToken.removeToken()];
                    case 30:
                        _b.sent();
                        _b.label = 31;
                    case 31:
                        return [7 /*endfinally*/];
                    case 32:
                        return [2 /*return*/];
                }
            });
        });
    };
    AuthHttpRequest.addAxiosInterceptors = function(axiosInstance) {
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
        axiosInstance.interceptors.response.use(responseInterceptor(axiosInstance), function(error) {
            return __awaiter(this, void 0, void 0, function() {
                var config;
                return __generator(this, function(_a) {
                    if (!fetch_1.default.initCalled) {
                        throw new Error("init function not called");
                    }
                    if (
                        error.response !== undefined &&
                        error.response.status === fetch_1.default.sessionExpiredStatusCode
                    ) {
                        config = error.config;
                        return [
                            2 /*return*/,
                            AuthHttpRequest.doRequest(
                                function(config) {
                                    // we create an instance since we don't want to intercept this.
                                    // const instance = axios.create();
                                    // return instance(config);
                                    return axiosInstance(config);
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
                    return [2 /*return*/];
                });
            });
        });
    };
    return AuthHttpRequest;
})();
exports.default = AuthHttpRequest;
//# sourceMappingURL=axios.js.map
