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
        var url, doNotDoInterception, preRequestIdToken, antiCsrfToken, configWithAntiCsrf;
        return __generator(this, function(_a) {
            switch (_a.label) {
                case 0:
                    url = getUrlFromConfig(config);
                    doNotDoInterception = false;
                    try {
                        doNotDoInterception =
                            typeof url === "string" &&
                            utils_1.normaliseURLDomainOrThrowError(url) !== fetch_1.default.apiDomain;
                    } catch (err) {
                        if (err.message === "Please provide a valid domain name") {
                            // .origin gives the port as well..
                            doNotDoInterception =
                                utils_1.normaliseURLDomainOrThrowError(window.location.origin) !==
                                fetch_1.default.apiDomain;
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
                    return [4 /*yield*/, fetch_1.getIdRefreshToken()];
                case 1:
                    preRequestIdToken = _a.sent();
                    return [4 /*yield*/, fetch_1.AntiCsrfToken.getToken(preRequestIdToken)];
                case 2:
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
                    if (fetch_1.default.autoAddCredentials && configWithAntiCsrf.withCredentials === undefined) {
                        configWithAntiCsrf = __assign({}, configWithAntiCsrf, { withCredentials: true });
                    }
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
            var url, doNotDoInterception, idRefreshToken, config, antiCsrfToken, _a, _b, frontToken;
            return __generator(this, function(_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, , 10, 15]);
                        if (!fetch_1.default.initCalled) {
                            throw new Error("init function not called");
                        }
                        url = getUrlFromConfig(response.config);
                        doNotDoInterception = false;
                        try {
                            doNotDoInterception =
                                typeof url === "string" &&
                                utils_1.normaliseURLDomainOrThrowError(url) !== fetch_1.default.apiDomain;
                        } catch (err) {
                            if (err.message === "Please provide a valid domain name") {
                                // .origin gives the port as well..
                                doNotDoInterception =
                                    utils_1.normaliseURLDomainOrThrowError(window.location.origin) !==
                                    fetch_1.default.apiDomain;
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
                        if (!(idRefreshToken !== undefined)) return [3 /*break*/, 2];
                        return [4 /*yield*/, fetch_1.setIdRefreshToken(idRefreshToken)];
                    case 1:
                        _c.sent();
                        _c.label = 2;
                    case 2:
                        if (!(response.status === fetch_1.default.sessionExpiredStatusCode)) return [3 /*break*/, 3];
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
                    case 3:
                        antiCsrfToken = response.headers["anti-csrf"];
                        if (!(antiCsrfToken !== undefined)) return [3 /*break*/, 6];
                        _b = (_a = fetch_1.AntiCsrfToken).setItem;
                        return [4 /*yield*/, fetch_1.getIdRefreshToken()];
                    case 4:
                        return [4 /*yield*/, _b.apply(_a, [_c.sent(), antiCsrfToken])];
                    case 5:
                        _c.sent();
                        _c.label = 6;
                    case 6:
                        frontToken = response.headers["front-token"];
                        if (!(frontToken !== undefined)) return [3 /*break*/, 8];
                        return [4 /*yield*/, fetch_1.FrontToken.setItem(frontToken)];
                    case 7:
                        _c.sent();
                        _c.label = 8;
                    case 8:
                        return [2 /*return*/, response];
                    case 9:
                        return [3 /*break*/, 15];
                    case 10:
                        return [4 /*yield*/, fetch_1.getIdRefreshToken()];
                    case 11:
                        if (!(_c.sent() === undefined)) return [3 /*break*/, 14];
                        return [4 /*yield*/, fetch_1.AntiCsrfToken.removeToken()];
                    case 12:
                        _c.sent();
                        return [4 /*yield*/, fetch_1.FrontToken.removeToken()];
                    case 13:
                        _c.sent();
                        _c.label = 14;
                    case 14:
                        return [7 /*endfinally*/];
                    case 15:
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
                antiCsrfToken,
                configWithAntiCsrf,
                localPrevError,
                localPrevResponse,
                response,
                _a,
                idRefreshToken,
                retry,
                antiCsrfToken_1,
                _b,
                _c,
                frontToken,
                err_1,
                retry;
            return __generator(this, function(_d) {
                switch (_d.label) {
                    case 0:
                        if (!fetch_1.default.initCalled) {
                            throw Error("init function not called");
                        }
                        doNotDoInterception = false;
                        try {
                            doNotDoInterception =
                                typeof url === "string" &&
                                utils_1.normaliseURLDomainOrThrowError(url) !== fetch_1.default.apiDomain &&
                                viaInterceptor;
                        } catch (err) {
                            if (err.message === "Please provide a valid domain name") {
                                // .origin gives the port as well..
                                doNotDoInterception =
                                    utils_1.normaliseURLDomainOrThrowError(window.location.origin) !==
                                        fetch_1.default.apiDomain && viaInterceptor;
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
                        return [2 /*return*/, _d.sent()];
                    case 2:
                        _d.trys.push([2, , 26, 31]);
                        throwError = false;
                        returnObj = undefined;
                        _d.label = 3;
                    case 3:
                        if (!true) return [3 /*break*/, 25];
                        return [4 /*yield*/, fetch_1.getIdRefreshToken()];
                    case 4:
                        preRequestIdToken = _d.sent();
                        return [4 /*yield*/, fetch_1.AntiCsrfToken.getToken(preRequestIdToken)];
                    case 5:
                        antiCsrfToken = _d.sent();
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
                        if (fetch_1.default.autoAddCredentials && configWithAntiCsrf.withCredentials === undefined) {
                            configWithAntiCsrf = __assign({}, configWithAntiCsrf, { withCredentials: true });
                        }
                        _d.label = 6;
                    case 6:
                        _d.trys.push([6, 20, , 24]);
                        localPrevError = prevError;
                        localPrevResponse = prevResponse;
                        prevError = undefined;
                        prevResponse = undefined;
                        if (localPrevError !== undefined) {
                            throw localPrevError;
                        }
                        if (!(localPrevResponse === undefined)) return [3 /*break*/, 8];
                        return [4 /*yield*/, httpCall(configWithAntiCsrf)];
                    case 7:
                        _a = _d.sent();
                        return [3 /*break*/, 9];
                    case 8:
                        _a = localPrevResponse;
                        _d.label = 9;
                    case 9:
                        response = _a;
                        idRefreshToken = response.headers["id-refresh-token"];
                        if (!(idRefreshToken !== undefined)) return [3 /*break*/, 11];
                        return [4 /*yield*/, fetch_1.setIdRefreshToken(idRefreshToken)];
                    case 10:
                        _d.sent();
                        _d.label = 11;
                    case 11:
                        if (!(response.status === fetch_1.default.sessionExpiredStatusCode)) return [3 /*break*/, 13];
                        return [
                            4 /*yield*/,
                            fetch_1.handleUnauthorised(
                                fetch_1.default.refreshTokenUrl,
                                preRequestIdToken,
                                fetch_1.default.refreshAPICustomHeaders,
                                fetch_1.default.sessionExpiredStatusCode
                            )
                        ];
                    case 12:
                        retry = _d.sent();
                        if (!retry) {
                            returnObj = response;
                            return [3 /*break*/, 25];
                        }
                        return [3 /*break*/, 19];
                    case 13:
                        antiCsrfToken_1 = response.headers["anti-csrf"];
                        if (!(antiCsrfToken_1 !== undefined)) return [3 /*break*/, 16];
                        _c = (_b = fetch_1.AntiCsrfToken).setItem;
                        return [4 /*yield*/, fetch_1.getIdRefreshToken()];
                    case 14:
                        return [4 /*yield*/, _c.apply(_b, [_d.sent(), antiCsrfToken_1])];
                    case 15:
                        _d.sent();
                        _d.label = 16;
                    case 16:
                        frontToken = response.headers["front-token"];
                        if (!(frontToken !== undefined)) return [3 /*break*/, 18];
                        return [4 /*yield*/, fetch_1.FrontToken.setItem(frontToken)];
                    case 17:
                        _d.sent();
                        _d.label = 18;
                    case 18:
                        return [2 /*return*/, response];
                    case 19:
                        return [3 /*break*/, 24];
                    case 20:
                        err_1 = _d.sent();
                        if (
                            !(
                                err_1.response !== undefined &&
                                err_1.response.status === fetch_1.default.sessionExpiredStatusCode
                            )
                        )
                            return [3 /*break*/, 22];
                        return [
                            4 /*yield*/,
                            fetch_1.handleUnauthorised(
                                fetch_1.default.refreshTokenUrl,
                                preRequestIdToken,
                                fetch_1.default.refreshAPICustomHeaders,
                                fetch_1.default.sessionExpiredStatusCode
                            )
                        ];
                    case 21:
                        retry = _d.sent();
                        if (!retry) {
                            throwError = true;
                            returnObj = err_1;
                            return [3 /*break*/, 25];
                        }
                        return [3 /*break*/, 23];
                    case 22:
                        throw err_1;
                    case 23:
                        return [3 /*break*/, 24];
                    case 24:
                        return [3 /*break*/, 3];
                    case 25:
                        // if it comes here, means we called break. which happens only if we have logged out.
                        if (throwError) {
                            throw returnObj;
                        } else {
                            return [2 /*return*/, returnObj];
                        }
                        return [3 /*break*/, 31];
                    case 26:
                        return [4 /*yield*/, fetch_1.getIdRefreshToken()];
                    case 27:
                        if (!(_d.sent() === undefined)) return [3 /*break*/, 30];
                        return [4 /*yield*/, fetch_1.AntiCsrfToken.removeToken()];
                    case 28:
                        _d.sent();
                        return [4 /*yield*/, fetch_1.FrontToken.removeToken()];
                    case 29:
                        _d.sent();
                        _d.label = 30;
                    case 30:
                        return [7 /*endfinally*/];
                    case 31:
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
                    switch (_a.label) {
                        case 0:
                            if (!fetch_1.default.initCalled) {
                                throw new Error("init function not called");
                            }
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, , 2, 7]);
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
                            return [3 /*break*/, 7];
                        case 2:
                            return [4 /*yield*/, fetch_1.getIdRefreshToken()];
                        case 3:
                            if (!(_a.sent() === undefined)) return [3 /*break*/, 6];
                            return [4 /*yield*/, fetch_1.AntiCsrfToken.removeToken()];
                        case 4:
                            _a.sent();
                            return [4 /*yield*/, fetch_1.FrontToken.removeToken()];
                        case 5:
                            _a.sent();
                            _a.label = 6;
                        case 6:
                            return [7 /*endfinally*/];
                        case 7:
                            return [2 /*return*/];
                    }
                });
            });
        });
    };
    return AuthHttpRequest;
})();
exports.default = AuthHttpRequest;
//# sourceMappingURL=axios.js.map
