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
var browser_tabs_lock_1 = require("browser-tabs-lock");
var _1 = require("./");
var version_1 = require("./version");
var ID_COOKIE_NAME = "sIRTFrontend";
/**
 * @description attempts to call the refresh token API each time we are sure the session has expired, or it throws an error or,
 * or the ID_COOKIE_NAME has changed value -> which may mean that we have a new set of tokens.
 */
function onUnauthorisedResponse(
    refreshTokenUrl,
    preRequestIdToken,
    websiteRootDomain,
    refreshAPICustomHeaders,
    sessionExpiredStatusCode
) {
    return __awaiter(this, void 0, void 0, function() {
        var lock, _loop_1, state_1;
        return __generator(this, function(_a) {
            switch (_a.label) {
                case 0:
                    lock = new browser_tabs_lock_1.default();
                    _loop_1 = function() {
                        var postLockID, response, removeIdRefreshToken_1, error_1, idCookieValue;
                        return __generator(this, function(_a) {
                            switch (_a.label) {
                                case 0:
                                    return [4 /*yield*/, lock.acquireLock("REFRESH_TOKEN_USE", 1000)];
                                case 1:
                                    if (!_a.sent()) return [3 /*break*/, 6];
                                    _a.label = 2;
                                case 2:
                                    _a.trys.push([2, 4, 5, 6]);
                                    postLockID = getIDFromCookie();
                                    if (postLockID === undefined) {
                                        return [2 /*return*/, { value: { result: "SESSION_EXPIRED" } }];
                                    }
                                    if (postLockID !== preRequestIdToken) {
                                        return [2 /*return*/, { value: { result: "RETRY" } }];
                                    }
                                    return [
                                        4 /*yield*/,
                                        _1.default.originalFetch(refreshTokenUrl, {
                                            method: "post",
                                            credentials: "include",
                                            headers: __assign({}, refreshAPICustomHeaders, {
                                                "supertokens-sdk-name": "website",
                                                "supertokens-sdk-version": version_1.package_version
                                            })
                                        })
                                    ];
                                case 3:
                                    response = _a.sent();
                                    removeIdRefreshToken_1 = true;
                                    response.headers.forEach(function(value, key) {
                                        if (key.toString() === "id-refresh-token") {
                                            setIDToCookie(value, websiteRootDomain);
                                            removeIdRefreshToken_1 = false;
                                        }
                                    });
                                    if (response.status === sessionExpiredStatusCode) {
                                        // there is a case where frontend still has id refresh token, but backend doesn't get it. In this event, session expired error will be thrown and the frontend should remove this token
                                        if (removeIdRefreshToken_1) {
                                            setIDToCookie("remove", websiteRootDomain);
                                        }
                                    }
                                    if (response.status !== 200) {
                                        throw response;
                                    }
                                    if (getIDFromCookie() === undefined) {
                                        return [2 /*return*/, { value: { result: "SESSION_EXPIRED" } }];
                                    }
                                    response.headers.forEach(function(value, key) {
                                        if (key.toString() === "anti-csrf") {
                                            _1.AntiCsrfToken.setItem(getIDFromCookie(), value);
                                        }
                                    });
                                    return [2 /*return*/, { value: { result: "RETRY" } }];
                                case 4:
                                    error_1 = _a.sent();
                                    if (getIDFromCookie() === undefined) {
                                        return [2 /*return*/, { value: { result: "SESSION_EXPIRED" } }];
                                    }
                                    return [2 /*return*/, { value: { result: "API_ERROR", error: error_1 } }];
                                case 5:
                                    lock.releaseLock("REFRESH_TOKEN_USE");
                                    return [7 /*endfinally*/];
                                case 6:
                                    idCookieValue = getIDFromCookie();
                                    if (idCookieValue === undefined) {
                                        return [2 /*return*/, { value: { result: "SESSION_EXPIRED" } }];
                                    } else {
                                        if (idCookieValue !== preRequestIdToken) {
                                            return [2 /*return*/, { value: { result: "RETRY" } }];
                                        }
                                        // here we try to call the API again since we probably failed to acquire lock and nothing has changed.
                                    }
                                    return [2 /*return*/];
                            }
                        });
                    };
                    _a.label = 1;
                case 1:
                    if (!true) return [3 /*break*/, 3];
                    return [5 /*yield**/, _loop_1()];
                case 2:
                    state_1 = _a.sent();
                    if (typeof state_1 === "object") return [2 /*return*/, state_1.value];
                    return [3 /*break*/, 1];
                case 3:
                    return [2 /*return*/];
            }
        });
    });
}
exports.onUnauthorisedResponse = onUnauthorisedResponse;
// NOTE: we do not store this in memory and always read as to synchronize events across tabs
function getIDFromCookie() {
    var value = "; " + document.cookie;
    var parts = value.split("; " + ID_COOKIE_NAME + "=");
    if (parts.length >= 2) {
        var last = parts.pop();
        if (last !== undefined) {
            return last.split(";").shift();
        }
    }
    return undefined;
}
exports.getIDFromCookie = getIDFromCookie;
function setIDToCookie(idRefreshToken, domain) {
    var expires = "Thu, 01 Jan 1970 00:00:01 GMT";
    var cookieVal = "";
    if (idRefreshToken !== "remove") {
        var splitted = idRefreshToken.split(";");
        cookieVal = splitted[0];
        expires = new Date(Number(splitted[1])).toUTCString();
    }
    document.cookie = ID_COOKIE_NAME + "=" + cookieVal + ";expires=" + expires + ";domain=" + domain + ";path=/";
}
exports.setIDToCookie = setIDToCookie;
