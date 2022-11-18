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
exports.responseErrorInterceptor = exports.responseInterceptor = exports.interceptorFunctionRequestFulfilled = void 0;
var axiosError_1 = require("./axiosError");
var fetch_1 = require("./fetch");
var processState_1 = require("./processState");
var utils_1 = require("./utils");
var windowHandler_1 = require("./utils/windowHandler");
var logger_1 = require("./logger");
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
                    (0, logger_1.logDebugMessage)("interceptorFunctionRequestFulfilled: started axios interception");
                    url = getUrlFromConfig(config);
                    doNotDoInterception = false;
                    try {
                        doNotDoInterception =
                            typeof url === "string" &&
                            !(0, utils_1.shouldDoInterceptionBasedOnUrl)(
                                url,
                                fetch_1.default.config.apiDomain,
                                fetch_1.default.config.sessionTokenBackendDomain
                            );
                    } catch (err) {
                        if (err.message === "Please provide a valid domain name") {
                            (0, logger_1.logDebugMessage)(
                                "interceptorFunctionRequestFulfilled: Trying shouldDoInterceptionBasedOnUrl with location.origin"
                            );
                            // .origin gives the port as well..
                            doNotDoInterception = !(0, utils_1.shouldDoInterceptionBasedOnUrl)(
                                windowHandler_1.default.getReferenceOrThrow().windowHandler.location.getOrigin(),
                                fetch_1.default.config.apiDomain,
                                fetch_1.default.config.sessionTokenBackendDomain
                            );
                        } else {
                            throw err;
                        }
                    }
                    (0,
                    logger_1.logDebugMessage)("interceptorFunctionRequestFulfilled: Value of doNotDoInterception: " + doNotDoInterception);
                    if (doNotDoInterception) {
                        (0, logger_1.logDebugMessage)(
                            "interceptorFunctionRequestFulfilled: Returning config unchanged"
                        );
                        // this check means that if you are using axios via inteceptor, then we only do the refresh steps if you are calling your APIs.
                        return [2 /*return*/, config];
                    }
                    (0, logger_1.logDebugMessage)("interceptorFunctionRequestFulfilled: Modifying config");
                    processState_1.ProcessState.getInstance().addState(
                        processState_1.PROCESS_STATE.CALLING_INTERCEPTION_REQUEST
                    );
                    return [4 /*yield*/, (0, fetch_1.getIdRefreshToken)(true)];
                case 1:
                    preRequestIdToken = _a.sent();
                    configWithAntiCsrf = config;
                    if (!(preRequestIdToken.status === "EXISTS")) return [3 /*break*/, 3];
                    return [4 /*yield*/, fetch_1.AntiCsrfToken.getToken(preRequestIdToken.token)];
                case 2:
                    antiCsrfToken = _a.sent();
                    if (antiCsrfToken !== undefined) {
                        (0, logger_1.logDebugMessage)(
                            "interceptorFunctionRequestFulfilled: Adding anti-csrf token to request"
                        );
                        configWithAntiCsrf = __assign(__assign({}, configWithAntiCsrf), {
                            headers:
                                configWithAntiCsrf === undefined
                                    ? {
                                          "anti-csrf": antiCsrfToken
                                      }
                                    : __assign(__assign({}, configWithAntiCsrf.headers), { "anti-csrf": antiCsrfToken })
                        });
                    }
                    _a.label = 3;
                case 3:
                    if (fetch_1.default.config.autoAddCredentials && configWithAntiCsrf.withCredentials === undefined) {
                        (0, logger_1.logDebugMessage)(
                            "interceptorFunctionRequestFulfilled: Adding credentials include"
                        );
                        configWithAntiCsrf = __assign(__assign({}, configWithAntiCsrf), { withCredentials: true });
                    }
                    // adding rid for anti-csrf protection: Anti-csrf via custom header
                    (0,
                    logger_1.logDebugMessage)("interceptorFunctionRequestFulfilled: Adding rid header: anti-csrf (it may be overriden by the user's provided rid)");
                    configWithAntiCsrf = __assign(__assign({}, configWithAntiCsrf), {
                        headers:
                            configWithAntiCsrf === undefined
                                ? {
                                      rid: "anti-csrf",
                                      "st-auth-mode": fetch_1.default.config.tokenTransferMethod
                                  }
                                : __assign(
                                      { rid: "anti-csrf", "st-auth-mode": fetch_1.default.config.tokenTransferMethod },
                                      configWithAntiCsrf.headers
                                  )
                    });
                    return [4 /*yield*/, setTokenHeadersIfRequired(configWithAntiCsrf)];
                case 4:
                    _a.sent();
                    (0, logger_1.logDebugMessage)("interceptorFunctionRequestFulfilled: returning modified config");
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
                        _b.trys.push([1, , 14, 20]);
                        if (!fetch_1.default.initCalled) {
                            throw new Error("init function not called");
                        }
                        (0, logger_1.logDebugMessage)("responseInterceptor: started");
                        (0,
                        logger_1.logDebugMessage)("responseInterceptor: already intercepted: " + response.headers["x-supertokens-xhr-intercepted"]);
                        url = getUrlFromConfig(response.config);
                        try {
                            doNotDoInterception =
                                (typeof url === "string" &&
                                    !(0, utils_1.shouldDoInterceptionBasedOnUrl)(
                                        url,
                                        fetch_1.default.config.apiDomain,
                                        fetch_1.default.config.sessionTokenBackendDomain
                                    )) ||
                                !!response.headers["x-supertokens-xhr-intercepted"];
                        } catch (err) {
                            if (err.message === "Please provide a valid domain name") {
                                (0, logger_1.logDebugMessage)(
                                    "responseInterceptor: Trying shouldDoInterceptionBasedOnUrl with location.origin"
                                );
                                // .origin gives the port as well..
                                doNotDoInterception =
                                    !(0, utils_1.shouldDoInterceptionBasedOnUrl)(
                                        windowHandler_1.default
                                            .getReferenceOrThrow()
                                            .windowHandler.location.getOrigin(),
                                        fetch_1.default.config.apiDomain,
                                        fetch_1.default.config.sessionTokenBackendDomain
                                    ) || !!response.headers["x-supertokens-xhr-intercepted"];
                            } else {
                                throw err;
                            }
                        }
                        (0,
                        logger_1.logDebugMessage)("responseInterceptor: Value of doNotDoInterception: " + doNotDoInterception);
                        if (doNotDoInterception) {
                            (0, logger_1.logDebugMessage)("responseInterceptor: Returning without interception");
                            // this check means that if you are using axios via inteceptor, then we only do the refresh steps if you are calling your APIs.
                            return [2 /*return*/, response];
                        }
                        (0, logger_1.logDebugMessage)("responseInterceptor: Interception started");
                        processState_1.ProcessState.getInstance().addState(
                            processState_1.PROCESS_STATE.CALLING_INTERCEPTION_RESPONSE
                        );
                        return [4 /*yield*/, saveTokensFromHeaders(response)];
                    case 2:
                        _b.sent();
                        idRefreshToken = response.headers["st-id-refresh-token"];
                        if (!(idRefreshToken !== undefined)) return [3 /*break*/, 4];
                        (0, logger_1.logDebugMessage)("responseInterceptor: Setting sIRTFrontend: " + idRefreshToken);
                        return [4 /*yield*/, (0, fetch_1.setIdRefreshToken)(idRefreshToken, response.status)];
                    case 3:
                        _b.sent();
                        _b.label = 4;
                    case 4:
                        if (!(response.status === fetch_1.default.config.sessionExpiredStatusCode))
                            return [3 /*break*/, 5];
                        (0, logger_1.logDebugMessage)("responseInterceptor: Status code is: " + response.status);
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
                                undefined,
                                true
                            )
                        ];
                    case 5:
                        if (!(response.status === fetch_1.default.config.invalidClaimStatusCode))
                            return [3 /*break*/, 7];
                        // only fire event if body is defined.
                        return [4 /*yield*/, (0, fetch_1.onInvalidClaimResponse)(response)];
                    case 6:
                        // only fire event if body is defined.
                        _b.sent();
                        _b.label = 7;
                    case 7:
                        antiCsrfToken = response.headers["anti-csrf"];
                        if (!(antiCsrfToken !== undefined)) return [3 /*break*/, 10];
                        return [4 /*yield*/, (0, fetch_1.getIdRefreshToken)(true)];
                    case 8:
                        tok = _b.sent();
                        if (!(tok.status === "EXISTS")) return [3 /*break*/, 10];
                        (0, logger_1.logDebugMessage)("responseInterceptor: Setting anti-csrf token");
                        return [4 /*yield*/, fetch_1.AntiCsrfToken.setItem(tok.token, antiCsrfToken)];
                    case 9:
                        _b.sent();
                        _b.label = 10;
                    case 10:
                        frontToken = response.headers["front-token"];
                        if (!(frontToken !== undefined)) return [3 /*break*/, 12];
                        (0, logger_1.logDebugMessage)("responseInterceptor: Setting sFrontToken: " + frontToken);
                        return [4 /*yield*/, fetch_1.FrontToken.setItem(frontToken)];
                    case 11:
                        _b.sent();
                        _b.label = 12;
                    case 12:
                        return [2 /*return*/, response];
                    case 13:
                        return [3 /*break*/, 20];
                    case 14:
                        _a = !doNotDoInterception;
                        if (!_a) return [3 /*break*/, 16];
                        return [4 /*yield*/, (0, fetch_1.getIdRefreshToken)(true)];
                    case 15:
                        // we do not call doesSessionExist here cause the user might override that
                        // function here and then it may break the logic of our original implementation.
                        _a = !(_b.sent().status === "EXISTS");
                        _b.label = 16;
                    case 16:
                        if (!_a) return [3 /*break*/, 19];
                        (0,
                        logger_1.logDebugMessage)("responseInterceptor: sIRTFrontend doesn't exist, so removing anti-csrf and sFrontToken");
                        return [4 /*yield*/, fetch_1.AntiCsrfToken.removeToken()];
                    case 17:
                        _b.sent();
                        return [4 /*yield*/, fetch_1.FrontToken.removeToken()];
                    case 18:
                        _b.sent();
                        _b.label = 19;
                    case 19:
                        return [7 /*endfinally*/];
                    case 20:
                        return [2 /*return*/];
                }
            });
        });
    };
}
exports.responseInterceptor = responseInterceptor;
function responseErrorInterceptor(axiosInstance) {
    var _this = this;
    return function(error) {
        return __awaiter(_this, void 0, void 0, function() {
            var config;
            return __generator(this, function(_a) {
                switch (_a.label) {
                    case 0:
                        (0, logger_1.logDebugMessage)("responseErrorInterceptor: called");
                        (0,
                        logger_1.logDebugMessage)("responseErrorInterceptor: already intercepted: " + (error.response && error.response.headers["x-supertokens-xhr-intercepted"]));
                        if (error.response.headers["x-supertokens-xhr-intercepted"]) {
                            throw error;
                        }
                        if (
                            !(
                                error.response !== undefined &&
                                error.response.status === fetch_1.default.config.sessionExpiredStatusCode
                            )
                        )
                            return [3 /*break*/, 1];
                        (0,
                        logger_1.logDebugMessage)("responseErrorInterceptor: Status code is: " + error.response.status);
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
                    case 1:
                        if (
                            !(
                                error.response !== undefined &&
                                error.response.status === fetch_1.default.config.invalidClaimStatusCode
                            )
                        )
                            return [3 /*break*/, 3];
                        return [4 /*yield*/, (0, fetch_1.onInvalidClaimResponse)(error.response)];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3:
                        throw error;
                }
            });
        });
    };
}
exports.responseErrorInterceptor = responseErrorInterceptor;
/**
 * @class AuthHttpRequest
 * @description wrapper for common http methods.
 */
var AuthHttpRequest = /** @class */ (function() {
    function AuthHttpRequest() {}
    var _a;
    _a = AuthHttpRequest;
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
        return __awaiter(void 0, void 0, void 0, function() {
            var doNotDoInterception,
                returnObj,
                preRequestIdToken,
                configWithAntiCsrf,
                antiCsrfToken,
                localPrevError,
                localPrevResponse,
                response,
                _b,
                idRefreshToken,
                refreshResult,
                _c,
                antiCsrfToken,
                tok,
                frontToken,
                err_1,
                response,
                idRefreshToken,
                refreshResult,
                _d,
                postRequestIdToken;
            return __generator(_a, function(_e) {
                switch (_e.label) {
                    case 0:
                        if (!fetch_1.default.initCalled) {
                            throw Error("init function not called");
                        }
                        (0, logger_1.logDebugMessage)("doRequest: called");
                        doNotDoInterception = false;
                        try {
                            doNotDoInterception =
                                typeof url === "string" &&
                                !(0, utils_1.shouldDoInterceptionBasedOnUrl)(
                                    url,
                                    fetch_1.default.config.apiDomain,
                                    fetch_1.default.config.sessionTokenBackendDomain
                                ) &&
                                viaInterceptor;
                        } catch (err) {
                            if (err.message === "Please provide a valid domain name") {
                                (0, logger_1.logDebugMessage)(
                                    "doRequest: Trying shouldDoInterceptionBasedOnUrl with location.origin"
                                );
                                // .origin gives the port as well..
                                doNotDoInterception =
                                    !(0, utils_1.shouldDoInterceptionBasedOnUrl)(
                                        windowHandler_1.default
                                            .getReferenceOrThrow()
                                            .windowHandler.location.getOrigin(),
                                        fetch_1.default.config.apiDomain,
                                        fetch_1.default.config.sessionTokenBackendDomain
                                    ) && viaInterceptor;
                            } else {
                                throw err;
                            }
                        }
                        (0,
                        logger_1.logDebugMessage)("doRequest: Value of doNotDoInterception: " + doNotDoInterception);
                        if (!doNotDoInterception) return [3 /*break*/, 2];
                        (0, logger_1.logDebugMessage)("doRequest: Returning without interception");
                        if (prevError !== undefined) {
                            throw prevError;
                        } else if (prevResponse !== undefined) {
                            return [2 /*return*/, prevResponse];
                        }
                        return [4 /*yield*/, httpCall(config)];
                    case 1:
                        return [2 /*return*/, _e.sent()];
                    case 2:
                        (0, logger_1.logDebugMessage)("doRequest: Interception started");
                        _e.label = 3;
                    case 3:
                        _e.trys.push([3, , 48, 53]);
                        returnObj = undefined;
                        _e.label = 4;
                    case 4:
                        if (!true) return [3 /*break*/, 47];
                        return [4 /*yield*/, (0, fetch_1.getIdRefreshToken)(true)];
                    case 5:
                        preRequestIdToken = _e.sent();
                        configWithAntiCsrf = config;
                        if (!(preRequestIdToken.status === "EXISTS")) return [3 /*break*/, 7];
                        return [4 /*yield*/, fetch_1.AntiCsrfToken.getToken(preRequestIdToken.token)];
                    case 6:
                        antiCsrfToken = _e.sent();
                        if (antiCsrfToken !== undefined) {
                            (0, logger_1.logDebugMessage)("doRequest: Adding anti-csrf token to request");
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
                        _e.label = 7;
                    case 7:
                        if (
                            fetch_1.default.config.autoAddCredentials &&
                            configWithAntiCsrf.withCredentials === undefined
                        ) {
                            (0, logger_1.logDebugMessage)("doRequest: Adding credentials include");
                            configWithAntiCsrf = __assign(__assign({}, configWithAntiCsrf), { withCredentials: true });
                        }
                        // adding rid for anti-csrf protection: Anti-csrf via custom header
                        (0,
                        logger_1.logDebugMessage)("doRequest: Adding rid header: anti-csrf (May get overriden by user's rid)");
                        configWithAntiCsrf = __assign(__assign({}, configWithAntiCsrf), {
                            headers:
                                configWithAntiCsrf === undefined
                                    ? {
                                          rid: "anti-csrf"
                                      }
                                    : __assign({ rid: "anti-csrf" }, configWithAntiCsrf.headers)
                        });
                        return [4 /*yield*/, setTokenHeadersIfRequired(configWithAntiCsrf)];
                    case 8:
                        _e.sent();
                        _e.label = 9;
                    case 9:
                        _e.trys.push([9, 31, , 46]);
                        localPrevError = prevError;
                        localPrevResponse = prevResponse;
                        prevError = undefined;
                        prevResponse = undefined;
                        if (localPrevError !== undefined) {
                            (0, logger_1.logDebugMessage)(
                                "doRequest: Not making call because localPrevError is not undefined"
                            );
                            throw localPrevError;
                        }
                        if (localPrevResponse !== undefined) {
                            (0, logger_1.logDebugMessage)(
                                "doRequest: Not making call because localPrevResponse is not undefined"
                            );
                        } else {
                            (0, logger_1.logDebugMessage)("doRequest: Making user's http call");
                        }
                        if (!(localPrevResponse === undefined)) return [3 /*break*/, 11];
                        return [4 /*yield*/, httpCall(configWithAntiCsrf)];
                    case 10:
                        _b = _e.sent();
                        return [3 /*break*/, 12];
                    case 11:
                        _b = localPrevResponse;
                        _e.label = 12;
                    case 12:
                        response = _b;
                        (0, logger_1.logDebugMessage)("doRequest: User's http call ended");
                        return [4 /*yield*/, saveTokensFromHeaders(response)];
                    case 13:
                        _e.sent();
                        idRefreshToken = response.headers["st-id-refresh-token"];
                        if (!(idRefreshToken !== undefined)) return [3 /*break*/, 15];
                        (0, logger_1.logDebugMessage)("doRequest: Setting sIRTFrontend: " + idRefreshToken);
                        return [4 /*yield*/, (0, fetch_1.setIdRefreshToken)(idRefreshToken, response.status)];
                    case 14:
                        _e.sent();
                        _e.label = 15;
                    case 15:
                        if (!(response.status === fetch_1.default.config.sessionExpiredStatusCode))
                            return [3 /*break*/, 22];
                        (0, logger_1.logDebugMessage)("doRequest: Status code is: " + response.status);
                        return [4 /*yield*/, (0, fetch_1.onUnauthorisedResponse)(preRequestIdToken)];
                    case 16:
                        refreshResult = _e.sent();
                        if (!(refreshResult.result !== "RETRY")) return [3 /*break*/, 21];
                        (0, logger_1.logDebugMessage)("doRequest: Not retrying original request");
                        if (!refreshResult.error) return [3 /*break*/, 18];
                        return [4 /*yield*/, (0, axiosError_1.createAxiosErrorFromFetchResp)(refreshResult.error)];
                    case 17:
                        _c = _e.sent();
                        return [3 /*break*/, 20];
                    case 18:
                        return [4 /*yield*/, (0, axiosError_1.createAxiosErrorFromAxiosResp)(response)];
                    case 19:
                        _c = _e.sent();
                        _e.label = 20;
                    case 20:
                        // Returning refreshResult.error as an Axios Error if we attempted a refresh
                        // Returning the response to the original response as an error if we did not attempt refreshing
                        returnObj = _c;
                        return [3 /*break*/, 47];
                    case 21:
                        (0, logger_1.logDebugMessage)("doRequest: Retrying original request");
                        return [3 /*break*/, 30];
                    case 22:
                        if (!(response.status === fetch_1.default.config.invalidClaimStatusCode))
                            return [3 /*break*/, 24];
                        return [4 /*yield*/, (0, fetch_1.onInvalidClaimResponse)(response)];
                    case 23:
                        _e.sent();
                        _e.label = 24;
                    case 24:
                        antiCsrfToken = response.headers["anti-csrf"];
                        if (!(antiCsrfToken !== undefined)) return [3 /*break*/, 27];
                        return [4 /*yield*/, (0, fetch_1.getIdRefreshToken)(true)];
                    case 25:
                        tok = _e.sent();
                        if (!(tok.status === "EXISTS")) return [3 /*break*/, 27];
                        (0, logger_1.logDebugMessage)("doRequest: Setting anti-csrf token");
                        return [4 /*yield*/, fetch_1.AntiCsrfToken.setItem(tok.token, antiCsrfToken)];
                    case 26:
                        _e.sent();
                        _e.label = 27;
                    case 27:
                        frontToken = response.headers["front-token"];
                        if (!(frontToken !== undefined)) return [3 /*break*/, 29];
                        (0, logger_1.logDebugMessage)("doRequest: Setting sFrontToken: " + frontToken);
                        return [4 /*yield*/, fetch_1.FrontToken.setItem(frontToken)];
                    case 28:
                        _e.sent();
                        _e.label = 29;
                    case 29:
                        return [2 /*return*/, response];
                    case 30:
                        return [3 /*break*/, 46];
                    case 31:
                        err_1 = _e.sent();
                        response = err_1.response;
                        if (!(response !== undefined)) return [3 /*break*/, 44];
                        return [4 /*yield*/, saveTokensFromHeaders(response)];
                    case 32:
                        _e.sent();
                        idRefreshToken = response.headers["st-id-refresh-token"];
                        if (!(idRefreshToken !== undefined)) return [3 /*break*/, 34];
                        (0, logger_1.logDebugMessage)("doRequest: Setting sIRTFrontend: " + idRefreshToken);
                        return [4 /*yield*/, (0, fetch_1.setIdRefreshToken)(idRefreshToken, response.status)];
                    case 33:
                        _e.sent();
                        _e.label = 34;
                    case 34:
                        if (!(response.status === fetch_1.default.config.sessionExpiredStatusCode))
                            return [3 /*break*/, 40];
                        (0, logger_1.logDebugMessage)("doRequest: Status code is: " + response.status);
                        return [4 /*yield*/, (0, fetch_1.onUnauthorisedResponse)(preRequestIdToken)];
                    case 35:
                        refreshResult = _e.sent();
                        if (!(refreshResult.result !== "RETRY")) return [3 /*break*/, 39];
                        (0, logger_1.logDebugMessage)("doRequest: Not retrying original request");
                        if (!(refreshResult.error !== undefined)) return [3 /*break*/, 37];
                        return [4 /*yield*/, (0, axiosError_1.createAxiosErrorFromFetchResp)(refreshResult.error)];
                    case 36:
                        _d = _e.sent();
                        return [3 /*break*/, 38];
                    case 37:
                        _d = err_1;
                        _e.label = 38;
                    case 38:
                        // Returning refreshResult.error as an Axios Error if we attempted a refresh
                        // Returning the original error if we did not attempt refreshing
                        returnObj = _d;
                        return [3 /*break*/, 47];
                    case 39:
                        (0, logger_1.logDebugMessage)("doRequest: Retrying original request");
                        return [3 /*break*/, 43];
                    case 40:
                        if (!(response.status === fetch_1.default.config.invalidClaimStatusCode))
                            return [3 /*break*/, 42];
                        return [4 /*yield*/, (0, fetch_1.onInvalidClaimResponse)(response)];
                    case 41:
                        _e.sent();
                        _e.label = 42;
                    case 42:
                        throw err_1;
                    case 43:
                        return [3 /*break*/, 45];
                    case 44:
                        throw err_1;
                    case 45:
                        return [3 /*break*/, 46];
                    case 46:
                        return [3 /*break*/, 4];
                    case 47:
                        // if it comes here, means we called break. which happens only if we have logged out.
                        // which means it's a 401, so we throw
                        throw returnObj;
                    case 48:
                        return [4 /*yield*/, (0, fetch_1.getIdRefreshToken)(false)];
                    case 49:
                        postRequestIdToken = _e.sent();
                        if (!(postRequestIdToken.status === "NOT_EXISTS")) return [3 /*break*/, 52];
                        (0,
                        logger_1.logDebugMessage)("doRequest: sIRTFrontend doesn't exist, so removing anti-csrf and sFrontToken");
                        return [4 /*yield*/, fetch_1.AntiCsrfToken.removeToken()];
                    case 50:
                        _e.sent();
                        return [4 /*yield*/, fetch_1.FrontToken.removeToken()];
                    case 51:
                        _e.sent();
                        _e.label = 52;
                    case 52:
                        return [7 /*endfinally*/];
                    case 53:
                        return [2 /*return*/];
                }
            });
        });
    };
    return AuthHttpRequest;
})();
exports.default = AuthHttpRequest;
function setTokenHeadersIfRequired(requestConfig) {
    return __awaiter(this, void 0, void 0, function() {
        var idRefreshToken, accessToken;
        return __generator(this, function(_b) {
            switch (_b.label) {
                case 0:
                    if (!(fetch_1.default.config.tokenTransferMethod === "header")) return [3 /*break*/, 3];
                    (0, logger_1.logDebugMessage)("setTokenHeadersIfRequired: adding existing tokens as header");
                    (0, logger_1.logDebugMessage)("setTokenHeadersIfRequired: adding header preference to rid header");
                    if (requestConfig.headers === undefined) {
                        requestConfig.headers = {};
                    }
                    return [4 /*yield*/, (0, fetch_1.getToken)("idRefresh")];
                case 1:
                    idRefreshToken = _b.sent();
                    (0, logger_1.logDebugMessage)("setTokenHeadersIfRequired: added st-id-refresh-token header");
                    if (idRefreshToken !== undefined) {
                        requestConfig.headers = __assign(__assign({}, requestConfig.headers), {
                            "st-id-refresh-token": idRefreshToken
                        });
                    }
                    return [4 /*yield*/, (0, fetch_1.getToken)("access")];
                case 2:
                    accessToken = _b.sent();
                    if (
                        accessToken !== undefined &&
                        requestConfig.headers["Authorization"] === undefined &&
                        requestConfig.headers["authorization"] === undefined
                    ) {
                        (0, logger_1.logDebugMessage)("setTokenHeadersIfRequired: added authorization header");
                        requestConfig.headers = __assign(__assign({}, requestConfig.headers), {
                            Authorization: "Bearer ".concat(accessToken)
                        });
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
        var refreshToken, _b, value, expiry, accessToken, _c, value, expiry;
        return __generator(this, function(_d) {
            switch (_d.label) {
                case 0:
                    if (!(fetch_1.default.config.tokenTransferMethod === "header")) return [3 /*break*/, 4];
                    (0, logger_1.logDebugMessage)("doRequest: Saving updated tokens from the response");
                    refreshToken = response.headers["st-refresh-token"];
                    if (!refreshToken) return [3 /*break*/, 2];
                    (_b = refreshToken.split(";")), (value = _b[0]), (expiry = _b[1]);
                    return [4 /*yield*/, (0, fetch_1.setToken)("refresh", value, Number.parseInt(expiry))];
                case 1:
                    _d.sent();
                    _d.label = 2;
                case 2:
                    accessToken = response.headers["st-access-token"];
                    if (!accessToken) return [3 /*break*/, 4];
                    (_c = accessToken.split(";")), (value = _c[0]), (expiry = _c[1]);
                    return [4 /*yield*/, (0, fetch_1.setToken)("access", value, Number.parseInt(expiry))];
                case 3:
                    _d.sent();
                    _d.label = 4;
                case 4:
                    return [2 /*return*/];
            }
        });
    });
}
