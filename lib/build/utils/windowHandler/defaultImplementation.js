"use strict";
var __awaiter =
    (this && this.__awaiter) ||
    function (thisArg, _arguments, P, generator) {
        function adopt(value) {
            return value instanceof P
                ? value
                : new P(function (resolve) {
                      resolve(value);
                  });
        }
        return new (P || (P = Promise))(function (resolve, reject) {
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
    function (thisArg, body) {
        var _ = {
                label: 0,
                sent: function () {
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
                (g[Symbol.iterator] = function () {
                    return this;
                }),
            g
        );
        function verb(n) {
            return function (v) {
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
exports.defaultWindowHandlerImplementation = void 0;
function getWindowOrThrow() {
    if (typeof window === "undefined") {
        throw Error(
            "If you are using this package with server-side rendering, please make sure that you are checking if the window object is defined."
        );
    }
    return window;
}
var defaultLocalStorageHandler = {
    key: function (index) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, getWindowOrThrow().localStorage.key(index)];
            });
        });
    },
    clear: function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, getWindowOrThrow().localStorage.clear()];
            });
        });
    },
    getItem: function (key) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, getWindowOrThrow().localStorage.getItem(key)];
            });
        });
    },
    removeItem: function (key) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, getWindowOrThrow().localStorage.removeItem(key)];
            });
        });
    },
    setItem: function (key, value) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, getWindowOrThrow().localStorage.setItem(key, value)];
            });
        });
    },
    keySync: function (index) {
        return getWindowOrThrow().localStorage.key(index);
    },
    clearSync: function () {
        return getWindowOrThrow().localStorage.clear();
    },
    getItemSync: function (key) {
        return getWindowOrThrow().localStorage.getItem(key);
    },
    removeItemSync: function (key) {
        return getWindowOrThrow().localStorage.removeItem(key);
    },
    setItemSync: function (key, value) {
        return getWindowOrThrow().localStorage.setItem(key, value);
    }
};
var defaultSessionStorageHandler = {
    key: function (index) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, getWindowOrThrow().sessionStorage.key(index)];
            });
        });
    },
    clear: function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, getWindowOrThrow().sessionStorage.clear()];
            });
        });
    },
    getItem: function (key) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, getWindowOrThrow().sessionStorage.getItem(key)];
            });
        });
    },
    removeItem: function (key) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, getWindowOrThrow().sessionStorage.removeItem(key)];
            });
        });
    },
    setItem: function (key, value) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, getWindowOrThrow().sessionStorage.setItem(key, value)];
            });
        });
    },
    keySync: function (index) {
        return getWindowOrThrow().sessionStorage.key(index);
    },
    clearSync: function () {
        return getWindowOrThrow().sessionStorage.clear();
    },
    getItemSync: function (key) {
        return getWindowOrThrow().sessionStorage.getItem(key);
    },
    removeItemSync: function (key) {
        return getWindowOrThrow().sessionStorage.removeItem(key);
    },
    setItemSync: function (key, value) {
        return getWindowOrThrow().sessionStorage.setItem(key, value);
    }
};
exports.defaultWindowHandlerImplementation = {
    history: {
        replaceState: function (data, unused, url) {
            return getWindowOrThrow().history.replaceState(data, unused, url);
        },
        getState: function () {
            return getWindowOrThrow().history.state;
        }
    },
    location: {
        getHref: function () {
            return getWindowOrThrow().location.href;
        },
        setHref: function (href) {
            getWindowOrThrow().location.href = href;
        },
        getSearch: function () {
            return getWindowOrThrow().location.search;
        },
        getHash: function () {
            return getWindowOrThrow().location.hash;
        },
        getPathName: function () {
            return getWindowOrThrow().location.pathname;
        },
        assign: function (url) {
            /**
             * The type for assign accepts URL | string but when building
             * it complains about only accepting a string. To prevent this
             * we use any
             */
            getWindowOrThrow().location.assign(url);
        },
        getHostName: function () {
            return getWindowOrThrow().location.hostname;
        },
        getHost: function () {
            return getWindowOrThrow().location.host;
        },
        getOrigin: function () {
            return getWindowOrThrow().location.origin;
        }
    },
    getDocument: function () {
        return getWindowOrThrow().document;
    },
    getWindowUnsafe: function () {
        return getWindowOrThrow().window;
    },
    localStorage: defaultLocalStorageHandler,
    sessionStorage: defaultSessionStorageHandler
};
