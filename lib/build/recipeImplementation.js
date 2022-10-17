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
var fetch_1 = require("./fetch");
var axios_1 = require("./axios");
var version_1 = require("./version");
var logger_1 = require("./logger");
var error_1 = require("./error");
var xmlhttprequest_1 = require("./xmlhttprequest");
function RecipeImplementation(recipeImplInput) {
    return {
        addXMLHttpRequestInterceptor: function(_) {
            (0, logger_1.logDebugMessage)("addXMLHttpRequestInterceptorAndReturnModified: called");
            (0, xmlhttprequest_1.addInterceptorsToXMLHttpRequest)();
        },
        addFetchInterceptorsAndReturnModifiedFetch: function(input) {
            (0, logger_1.logDebugMessage)("addFetchInterceptorsAndReturnModifiedFetch: called");
            return function(url, config) {
                return __awaiter(this, void 0, void 0, function() {
                    return __generator(this, function(_a) {
                        switch (_a.label) {
                            case 0:
                                return [
                                    4 /*yield*/,
                                    fetch_1.default.doRequest(
                                        function(config) {
                                            return input.originalFetch(
                                                typeof url === "string" ? url : url.clone(),
                                                __assign({}, config)
                                            );
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
        },
        addAxiosInterceptors: function(input) {
            (0, logger_1.logDebugMessage)("addAxiosInterceptors: called");
            // we first check if this axiosInstance already has our interceptors.
            var requestInterceptors = input.axiosInstance.interceptors.request;
            for (var i = 0; i < requestInterceptors.handlers.length; i++) {
                if (requestInterceptors.handlers[i].fulfilled === axios_1.interceptorFunctionRequestFulfilled) {
                    (0, logger_1.logDebugMessage)(
                        "addAxiosInterceptors: not adding because already added on this instance"
                    );
                    return;
                }
            }
            // Add a request interceptor
            input.axiosInstance.interceptors.request.use(axios_1.interceptorFunctionRequestFulfilled, function(error) {
                return __awaiter(this, void 0, void 0, function() {
                    return __generator(this, function(_a) {
                        throw error;
                    });
                });
            });
            // Add a response interceptor
            input.axiosInstance.interceptors.response.use(
                (0, axios_1.responseInterceptor)(input.axiosInstance),
                (0, axios_1.responseErrorInterceptor)(input.axiosInstance)
            );
        },
        getUserId: function(_) {
            return __awaiter(this, void 0, void 0, function() {
                var tokenInfo;
                return __generator(this, function(_a) {
                    switch (_a.label) {
                        case 0:
                            (0, logger_1.logDebugMessage)("getUserId: called");
                            return [4 /*yield*/, fetch_1.FrontToken.getTokenInfo()];
                        case 1:
                            tokenInfo = _a.sent();
                            if (tokenInfo === undefined) {
                                throw new Error("No session exists");
                            }
                            (0, logger_1.logDebugMessage)("getUserId: returning: " + tokenInfo.uid);
                            return [2 /*return*/, tokenInfo.uid];
                    }
                });
            });
        },
        getAccessTokenPayloadSecurely: function(input) {
            return __awaiter(this, void 0, void 0, function() {
                var tokenInfo, retry;
                return __generator(this, function(_a) {
                    switch (_a.label) {
                        case 0:
                            (0, logger_1.logDebugMessage)("getAccessTokenPayloadSecurely: called");
                            return [4 /*yield*/, fetch_1.FrontToken.getTokenInfo()];
                        case 1:
                            tokenInfo = _a.sent();
                            if (tokenInfo === undefined) {
                                throw new Error("No session exists");
                            }
                            if (!(tokenInfo.ate < Date.now())) return [3 /*break*/, 5];
                            (0,
                            logger_1.logDebugMessage)("getAccessTokenPayloadSecurely: access token expired. Refreshing session");
                            return [4 /*yield*/, fetch_1.default.attemptRefreshingSession()];
                        case 2:
                            retry = _a.sent();
                            if (!retry) return [3 /*break*/, 4];
                            return [
                                4 /*yield*/,
                                this.getAccessTokenPayloadSecurely({
                                    userContext: input.userContext
                                })
                            ];
                        case 3:
                            return [2 /*return*/, _a.sent()];
                        case 4:
                            throw new Error("Could not refresh session");
                        case 5:
                            (0,
                            logger_1.logDebugMessage)("getAccessTokenPayloadSecurely: returning: " + JSON.stringify(tokenInfo.up));
                            return [2 /*return*/, tokenInfo.up];
                    }
                });
            });
        },
        doesSessionExist: function(_) {
            return __awaiter(this, void 0, void 0, function() {
                return __generator(this, function(_a) {
                    switch (_a.label) {
                        case 0:
                            (0, logger_1.logDebugMessage)("doesSessionExist: called");
                            return [4 /*yield*/, (0, fetch_1.getIdRefreshToken)(true)];
                        case 1:
                            return [2 /*return*/, _a.sent().status === "EXISTS"];
                    }
                });
            });
        },
        signOut: function(input) {
            return __awaiter(this, void 0, void 0, function() {
                var preAPIResult, resp, responseJson, message;
                return __generator(this, function(_a) {
                    switch (_a.label) {
                        case 0:
                            (0, logger_1.logDebugMessage)("signOut: called");
                            return [4 /*yield*/, this.doesSessionExist(input)];
                        case 1:
                            if (!_a.sent()) {
                                (0, logger_1.logDebugMessage)("signOut: existing early because session does not exist");
                                (0, logger_1.logDebugMessage)("signOut: firing SIGN_OUT event");
                                recipeImplInput.onHandleEvent({
                                    action: "SIGN_OUT",
                                    userContext: input.userContext
                                });
                                return [2 /*return*/];
                            }
                            (0, logger_1.logDebugMessage)("signOut: Calling refresh pre API hook");
                            return [
                                4 /*yield*/,
                                recipeImplInput.preAPIHook({
                                    action: "SIGN_OUT",
                                    requestInit: {
                                        method: "post",
                                        headers: {
                                            "fdi-version": version_1.supported_fdi.join(","),
                                            rid: fetch_1.default.rid
                                        }
                                    },
                                    url: fetch_1.default.signOutUrl,
                                    userContext: input.userContext
                                })
                            ];
                        case 2:
                            preAPIResult = _a.sent();
                            (0, logger_1.logDebugMessage)("signOut: Calling API");
                            return [4 /*yield*/, fetch(preAPIResult.url, preAPIResult.requestInit)];
                        case 3:
                            resp = _a.sent();
                            (0, logger_1.logDebugMessage)("signOut: API ended");
                            (0, logger_1.logDebugMessage)("signOut: API responded with status code: " + resp.status);
                            if (resp.status === recipeImplInput.sessionExpiredStatusCode) {
                                // refresh must have already sent session expiry event
                                return [2 /*return*/];
                            }
                            if (resp.status >= 300) {
                                throw resp;
                            }
                            return [
                                4 /*yield*/,
                                recipeImplInput.postAPIHook({
                                    action: "SIGN_OUT",
                                    requestInit: preAPIResult.requestInit,
                                    url: preAPIResult.url,
                                    fetchResponse: resp.clone(),
                                    userContext: input.userContext
                                })
                            ];
                        case 4:
                            _a.sent();
                            return [4 /*yield*/, resp.clone().json()];
                        case 5:
                            responseJson = _a.sent();
                            if (responseJson.status === "GENERAL_ERROR") {
                                (0, logger_1.logDebugMessage)("doRequest: Throwing general error");
                                message =
                                    responseJson.message === undefined
                                        ? "No Error Message Provided"
                                        : responseJson.message;
                                throw new error_1.STGeneralError(message);
                            }
                            return [2 /*return*/];
                    }
                });
            });
        },
        getInvalidClaimsFromResponse: function(input) {
            return __awaiter(this, void 0, void 0, function() {
                var body;
                return __generator(this, function(_a) {
                    switch (_a.label) {
                        case 0:
                            if (!("body" in input.response)) return [3 /*break*/, 2];
                            return [4 /*yield*/, input.response.clone().json()];
                        case 1:
                            body = _a.sent();
                            return [3 /*break*/, 3];
                        case 2:
                            if (typeof input.response.data === "string") {
                                body = JSON.parse(input.response.data);
                            } else {
                                body = input.response.data;
                            }
                            _a.label = 3;
                        case 3:
                            return [2 /*return*/, body.claimValidationErrors];
                    }
                });
            });
        },
        getGlobalClaimValidators: function(input) {
            return input.claimValidatorsAddedByOtherRecipes;
        },
        validateClaims: function(input) {
            return __awaiter(this, void 0, void 0, function() {
                var accessTokenPayload, _i, _a, validator, err_1, errors, _b, _c, validator, validationRes;
                return __generator(this, function(_d) {
                    switch (_d.label) {
                        case 0:
                            return [
                                4 /*yield*/,
                                this.getAccessTokenPayloadSecurely({ userContext: input.userContext })
                            ];
                        case 1:
                            accessTokenPayload = _d.sent();
                            (_i = 0), (_a = input.claimValidators);
                            _d.label = 2;
                        case 2:
                            if (!(_i < _a.length)) return [3 /*break*/, 10];
                            validator = _a[_i];
                            return [4 /*yield*/, validator.shouldRefresh(accessTokenPayload, input.userContext)];
                        case 3:
                            if (!_d.sent()) return [3 /*break*/, 9];
                            _d.label = 4;
                        case 4:
                            _d.trys.push([4, 6, , 7]);
                            return [4 /*yield*/, validator.refresh(input.userContext)];
                        case 5:
                            _d.sent();
                            return [3 /*break*/, 7];
                        case 6:
                            err_1 = _d.sent();
                            console.error(
                                "Encountered an error while refreshing validator ".concat(validator.id),
                                err_1
                            );
                            return [3 /*break*/, 7];
                        case 7:
                            return [
                                4 /*yield*/,
                                this.getAccessTokenPayloadSecurely({ userContext: input.userContext })
                            ];
                        case 8:
                            accessTokenPayload = _d.sent();
                            _d.label = 9;
                        case 9:
                            _i++;
                            return [3 /*break*/, 2];
                        case 10:
                            errors = [];
                            (_b = 0), (_c = input.claimValidators);
                            _d.label = 11;
                        case 11:
                            if (!(_b < _c.length)) return [3 /*break*/, 14];
                            validator = _c[_b];
                            return [4 /*yield*/, validator.validate(accessTokenPayload, input.userContext)];
                        case 12:
                            validationRes = _d.sent();
                            if (!validationRes.isValid) {
                                errors.push({
                                    validatorId: validator.id,
                                    reason: validationRes.reason
                                });
                            }
                            _d.label = 13;
                        case 13:
                            _b++;
                            return [3 /*break*/, 11];
                        case 14:
                            return [2 /*return*/, errors];
                    }
                });
            });
        }
    };
}
exports.default = RecipeImplementation;
