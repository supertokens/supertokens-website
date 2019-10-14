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
import Lock from "browser-tabs-lock";
import AuthHttpRequest, { AntiCsrfToken } from "./";
var ID_COOKIE_NAME = "sIdRefreshToken";
/**
 * @description attempts to call the refresh token API each time we are sure the session has expired, or it throws an error or,
 * or the ID_COOKIE_NAME has changed value -> which may mean that we have a new set of tokens.
 */
export function onUnauthorisedResponse(refreshTokenUrl, preRequestIdToken) {
    return __awaiter(this, void 0, void 0, function() {
        var lock, postLockID, response, error_1, idCookieValue;
        return __generator(this, function(_a) {
            switch (_a.label) {
                case 0:
                    lock = new Lock();
                    _a.label = 1;
                case 1:
                    if (!true) return [3 /*break*/, 8];
                    return [4 /*yield*/, lock.acquireLock("REFRESH_TOKEN_USE", 1000)];
                case 2:
                    if (!_a.sent()) return [3 /*break*/, 7];
                    _a.label = 3;
                case 3:
                    _a.trys.push([3, 5, 6, 7]);
                    postLockID = getIDFromCookie();
                    if (postLockID === undefined) {
                        return [2 /*return*/, { result: "SESSION_EXPIRED" }];
                    }
                    if (postLockID !== preRequestIdToken) {
                        // means that some other process has already called this API and succeeded. so we need to call it again
                        return [2 /*return*/, { result: "RETRY" }];
                    }
                    return [
                        4 /*yield*/,
                        AuthHttpRequest.originalFetch(refreshTokenUrl, {
                            method: "post",
                            credentials: "include"
                        })
                    ];
                case 4:
                    response = _a.sent();
                    if (response.status !== 200) {
                        throw response;
                    }
                    if (getIDFromCookie() === undefined) {
                        // removed by server. So we logout
                        return [2 /*return*/, { result: "SESSION_EXPIRED" }];
                    }
                    response.headers.forEach(function(value, key) {
                        if (key.toString() === "anti-csrf") {
                            AntiCsrfToken.setItem(getIDFromCookie(), value);
                        }
                    });
                    return [2 /*return*/, { result: "RETRY" }];
                case 5:
                    error_1 = _a.sent();
                    if (getIDFromCookie() === undefined) {
                        // removed by server.
                        return [2 /*return*/, { result: "SESSION_EXPIRED" }];
                    }
                    return [2 /*return*/, { result: "API_ERROR", error: error_1 }];
                case 6:
                    lock.releaseLock("REFRESH_TOKEN_USE");
                    return [7 /*endfinally*/];
                case 7:
                    idCookieValue = getIDFromCookie();
                    if (idCookieValue === undefined) {
                        // removed by server. So we logout
                        return [2 /*return*/, { result: "SESSION_EXPIRED" }];
                    } else {
                        if (idCookieValue !== preRequestIdToken) {
                            return [2 /*return*/, { result: "RETRY" }];
                        }
                        // here we try to call the API again since we probably failed to acquire lock and nothing has changed.
                    }
                    return [3 /*break*/, 1];
                case 8:
                    return [2 /*return*/];
            }
        });
    });
}
export function getIDFromCookie() {
    var value = "; " + document.cookie;
    var parts = value.split("; " + ID_COOKIE_NAME + "=");
    if (parts.length === 2) {
        var last = parts.pop();
        if (last !== undefined) {
            return last.split(";").shift();
        }
    }
    return undefined;
}
