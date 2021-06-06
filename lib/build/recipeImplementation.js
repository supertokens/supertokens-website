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
Object.defineProperty(exports, "__esModule", { value: true });
var fetch_1 = require("./fetch");
var axios_1 = require("./axios");
var RecipeImplementation = /** @class */ (function() {
    function RecipeImplementation() {
        var _this = this;
        this.addFetchInterceptors = function(env, originalFetch, _) {
            return __awaiter(_this, void 0, void 0, function() {
                var fetchInterceptor;
                var _this = this;
                return __generator(this, function(_a) {
                    fetchInterceptor = function(url, config) {
                        return __awaiter(_this, void 0, void 0, function() {
                            return __generator(this, function(_a) {
                                switch (_a.label) {
                                    case 0:
                                        return [
                                            4 /*yield*/,
                                            fetch_1.default.doRequest(
                                                function(config) {
                                                    return originalFetch(url, __assign({}, config));
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
                    env.fetch = function(url, config) {
                        return fetchInterceptor(url, config);
                    };
                    return [2 /*return*/];
                });
            });
        };
        this.addAxiosInterceptors = function(axiosInstance, _) {
            return __awaiter(_this, void 0, void 0, function() {
                var requestInterceptors, i;
                return __generator(this, function(_a) {
                    requestInterceptors = axiosInstance.interceptors.request;
                    for (i = 0; i < requestInterceptors.handlers.length; i++) {
                        if (requestInterceptors.handlers[i].fulfilled === axios_1.interceptorFunctionRequestFulfilled) {
                            return [2 /*return*/];
                        }
                    }
                    // Add a request interceptor
                    axiosInstance.interceptors.request.use(axios_1.interceptorFunctionRequestFulfilled, function(
                        error
                    ) {
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
                    return [2 /*return*/];
                });
            });
        };
        this.getUserId = function(_) {
            return __awaiter(_this, void 0, void 0, function() {
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
        };
        this.getJWTPayloadSecurely = function(config) {
            return __awaiter(_this, void 0, void 0, function() {
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
                            return [4 /*yield*/, this.attemptRefreshingSession(config)];
                        case 2:
                            retry = _a.sent();
                            if (!retry) return [3 /*break*/, 4];
                            return [4 /*yield*/, this.getJWTPayloadSecurely(config)];
                        case 3:
                            return [2 /*return*/, _a.sent()];
                        case 4:
                            throw new Error("Could not refresh session");
                        case 5:
                            return [2 /*return*/, tokenInfo.up];
                    }
                });
            });
        };
        this.attemptRefreshingSession = function(config) {
            return __awaiter(_this, void 0, void 0, function() {
                var preRequestIdToken;
                return __generator(this, function(_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, , 3, 8]);
                            return [4 /*yield*/, fetch_1.getIdRefreshToken(false)];
                        case 1:
                            preRequestIdToken = _a.sent();
                            return [
                                4 /*yield*/,
                                fetch_1.handleUnauthorised(
                                    fetch_1.default.refreshTokenUrl,
                                    preRequestIdToken,
                                    config.refreshAPICustomHeaders,
                                    config.sessionExpiredStatusCode
                                )
                            ];
                        case 2:
                            return [2 /*return*/, _a.sent()];
                        case 3:
                            return [4 /*yield*/, this.doesSessionExist(config)];
                        case 4:
                            if (!!_a.sent()) return [3 /*break*/, 7];
                            return [4 /*yield*/, fetch_1.AntiCsrfToken.removeToken()];
                        case 5:
                            _a.sent();
                            return [4 /*yield*/, fetch_1.FrontToken.removeToken()];
                        case 6:
                            _a.sent();
                            _a.label = 7;
                        case 7:
                            return [7 /*endfinally*/];
                        case 8:
                            return [2 /*return*/];
                    }
                });
            });
        };
        this.doesSessionExist = function(_) {
            return __awaiter(_this, void 0, void 0, function() {
                return __generator(this, function(_a) {
                    switch (_a.label) {
                        case 0:
                            return [4 /*yield*/, fetch_1.getIdRefreshToken(true)];
                        case 1:
                            return [2 /*return*/, _a.sent().status === "EXISTS"];
                    }
                });
            });
        };
        this.signOut = function(config) {
            return __awaiter(_this, void 0, void 0, function() {
                var resp;
                return __generator(this, function(_a) {
                    switch (_a.label) {
                        case 0:
                            return [4 /*yield*/, this.doesSessionExist(config)];
                        case 1:
                            if (!_a.sent()) {
                                return [2 /*return*/];
                            }
                            return [
                                4 /*yield*/,
                                fetch(fetch_1.default.signOutUrl, {
                                    method: "post",
                                    credentials: "include",
                                    headers:
                                        config.signoutAPICustomHeaders === undefined
                                            ? undefined
                                            : __assign({}, config.signoutAPICustomHeaders)
                                })
                            ];
                        case 2:
                            resp = _a.sent();
                            if (resp.status === config.sessionExpiredStatusCode) {
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
        // saveSessionFromResponse = (context: { requestInit: RequestInit; url: string; response: Response }): Promise<void> => {
        // }
        // attachSessionToRequest = (context: {
        //     requestInit: RequestInit;
        //     url: string;
        // }): Promise<{ url: string; requestInit: RequestInit }> => {
        // }
    }
    return RecipeImplementation;
})();
exports.RecipeImplementation = RecipeImplementation;
//# sourceMappingURL=recipeImplementation.js.map
