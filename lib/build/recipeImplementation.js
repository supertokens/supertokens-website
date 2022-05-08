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
function RecipeImplementation() {
    return {
        addFetchInterceptorsAndReturnModifiedFetch: function(originalFetch, _) {
            return function(url, config) {
                return __awaiter(this, void 0, void 0, function() {
                    return __generator(this, function(_a) {
                        switch (_a.label) {
                            case 0:
                                return [
                                    4 /*yield*/,
                                    fetch_1.default.doRequest(
                                        function(config) {
                                            return originalFetch(
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
        addAxiosInterceptors: function(axiosInstance, _) {
            // we first check if this axiosInstance already has our interceptors.
            var requestInterceptors = axiosInstance.interceptors.request;
            for (var i = 0; i < requestInterceptors.handlers.length; i++) {
                if (requestInterceptors.handlers[i].fulfilled === axios_1.interceptorFunctionRequestFulfilled) {
                    return;
                }
            }
            // Add a request interceptor
            axiosInstance.interceptors.request.use(axios_1.interceptorFunctionRequestFulfilled, function(error) {
                return __awaiter(this, void 0, void 0, function() {
                    return __generator(this, function(_a) {
                        throw error;
                    });
                });
            });
            // Add a response interceptor
            axiosInstance.interceptors.response.use(
                axios_1.responseInterceptor(axiosInstance),
                axios_1.responseErrorInterceptor(axiosInstance)
            );
        },
        getUserId: function(_) {
            return __awaiter(this, void 0, void 0, function() {
                var tokenInfo;
                return __generator(this, function(_a) {
                    switch (_a.label) {
                        case 0:
                            return [4 /*yield*/, fetch_1.FrontToken.getTokenInfo()];
                        case 1:
                            tokenInfo = _a.sent();
                            if (tokenInfo === undefined) {
                                throw new Error("No session exists");
                            }
                            return [2 /*return*/, tokenInfo.uid];
                    }
                });
            });
        },
        getAccessTokenPayloadSecurely: function(config) {
            return __awaiter(this, void 0, void 0, function() {
                var tokenInfo, retry;
                return __generator(this, function(_a) {
                    switch (_a.label) {
                        case 0:
                            return [4 /*yield*/, fetch_1.FrontToken.getTokenInfo()];
                        case 1:
                            tokenInfo = _a.sent();
                            if (tokenInfo === undefined) {
                                throw new Error("No session exists");
                            }
                            if (!(tokenInfo.ate < Date.now())) return [3 /*break*/, 5];
                            return [4 /*yield*/, fetch_1.default.attemptRefreshingSession()];
                        case 2:
                            retry = _a.sent();
                            if (!retry) return [3 /*break*/, 4];
                            return [4 /*yield*/, this.getAccessTokenPayloadSecurely(config)];
                        case 3:
                            return [2 /*return*/, _a.sent()];
                        case 4:
                            throw new Error("Could not refresh session");
                        case 5:
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
                            return [4 /*yield*/, fetch_1.getIdRefreshToken(true)];
                        case 1:
                            return [2 /*return*/, _a.sent().status === "EXISTS"];
                    }
                });
            });
        },
        signOut: function(config) {
            return __awaiter(this, void 0, void 0, function() {
                var preAPIResult, resp;
                return __generator(this, function(_a) {
                    switch (_a.label) {
                        case 0:
                            return [4 /*yield*/, this.doesSessionExist(config)];
                        case 1:
                            if (!_a.sent()) {
                                config.onHandleEvent({
                                    action: "SIGN_OUT"
                                });
                                return [2 /*return*/];
                            }
                            return [
                                4 /*yield*/,
                                config.preAPIHook({
                                    action: "SIGN_OUT",
                                    requestInit: {
                                        method: "post",
                                        headers: {
                                            "fdi-version": version_1.supported_fdi.join(","),
                                            rid: fetch_1.default.rid
                                        }
                                    },
                                    url: fetch_1.default.signOutUrl
                                })
                            ];
                        case 2:
                            preAPIResult = _a.sent();
                            return [4 /*yield*/, fetch(preAPIResult.url, preAPIResult.requestInit)];
                        case 3:
                            resp = _a.sent();
                            if (resp.status === config.sessionExpiredStatusCode) {
                                // refresh must have already sent session expiry event
                                return [2 /*return*/];
                            }
                            if (resp.status >= 300) {
                                throw resp;
                            }
                            return [2 /*return*/];
                    }
                });
            });
        }
    };
}
exports.default = RecipeImplementation;
