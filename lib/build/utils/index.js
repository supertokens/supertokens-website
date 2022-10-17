"use strict";
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
exports.getNormalisedUserContext = exports.shouldDoInterceptionBasedOnUrl = exports.validateAndNormaliseInputOrThrowError = exports.normaliseSessionScopeOrThrowError = exports.normaliseURLPathOrThrowError = exports.normaliseURLDomainOrThrowError = void 0;
var normalisedURLDomain_1 = require("../normalisedURLDomain");
var normalisedURLPath_1 = require("../normalisedURLPath");
var windowHandler_1 = require("../utils/windowHandler");
var logger_1 = require("../logger");
function normaliseURLDomainOrThrowError(input) {
    var str = new normalisedURLDomain_1.default(input).getAsStringDangerous();
    return str;
}
exports.normaliseURLDomainOrThrowError = normaliseURLDomainOrThrowError;
function normaliseURLPathOrThrowError(input) {
    return new normalisedURLPath_1.default(input).getAsStringDangerous();
}
exports.normaliseURLPathOrThrowError = normaliseURLPathOrThrowError;
function normaliseSessionScopeOrThrowError(sessionScope) {
    function helper(sessionScope) {
        sessionScope = sessionScope.trim().toLowerCase();
        // first we convert it to a URL so that we can use the URL class
        if (sessionScope.startsWith(".")) {
            sessionScope = sessionScope.substr(1);
        }
        if (!sessionScope.startsWith("http://") && !sessionScope.startsWith("https://")) {
            sessionScope = "http://" + sessionScope;
        }
        try {
            var urlObj = new URL(sessionScope);
            sessionScope = urlObj.hostname;
            // remove leading dot
            if (sessionScope.startsWith(".")) {
                sessionScope = sessionScope.substr(1);
            }
            return sessionScope;
        } catch (err) {
            throw new Error("Please provide a valid sessionScope");
        }
    }
    var noDotNormalised = helper(sessionScope);
    if (noDotNormalised === "localhost" || (0, normalisedURLDomain_1.isAnIpAddress)(noDotNormalised)) {
        return noDotNormalised;
    }
    if (sessionScope.startsWith(".")) {
        return "." + noDotNormalised;
    }
    return noDotNormalised;
}
exports.normaliseSessionScopeOrThrowError = normaliseSessionScopeOrThrowError;
function validateAndNormaliseInputOrThrowError(options) {
    var _this = this;
    var apiDomain = normaliseURLDomainOrThrowError(options.apiDomain);
    var apiBasePath = normaliseURLPathOrThrowError("/auth");
    if (options.apiBasePath !== undefined) {
        apiBasePath = normaliseURLPathOrThrowError(options.apiBasePath);
    }
    var defaultSessionScope = windowHandler_1.default.getReferenceOrThrow().windowHandler.location.getHostName();
    // See https://github.com/supertokens/supertokens-website/issues/98
    var sessionScope = normaliseSessionScopeOrThrowError(
        options !== undefined && options.sessionScope !== undefined ? options.sessionScope : defaultSessionScope
    );
    var sessionExpiredStatusCode = 401;
    if (options.sessionExpiredStatusCode !== undefined) {
        sessionExpiredStatusCode = options.sessionExpiredStatusCode;
    }
    var invalidClaimStatusCode = 403;
    if (options.invalidClaimStatusCode !== undefined) {
        invalidClaimStatusCode = options.invalidClaimStatusCode;
    }
    if (sessionExpiredStatusCode === invalidClaimStatusCode) {
        throw new Error("sessionExpiredStatusCode and invalidClaimStatusCode cannot be the same.");
    }
    var autoAddCredentials = true;
    if (options.autoAddCredentials !== undefined) {
        autoAddCredentials = options.autoAddCredentials;
    }
    var isInIframe = false;
    if (options.isInIframe !== undefined) {
        isInIframe = options.isInIframe;
    }
    var cookieDomain = undefined;
    if (options.cookieDomain !== undefined) {
        cookieDomain = normaliseSessionScopeOrThrowError(options.cookieDomain);
    }
    var preAPIHook = function(context) {
        return __awaiter(_this, void 0, void 0, function() {
            return __generator(this, function(_a) {
                return [2 /*return*/, { url: context.url, requestInit: context.requestInit }];
            });
        });
    };
    if (options.preAPIHook !== undefined) {
        preAPIHook = options.preAPIHook;
    }
    var postAPIHook = function() {
        return __awaiter(_this, void 0, void 0, function() {
            return __generator(this, function(_a) {
                return [2 /*return*/];
            });
        });
    };
    if (options.postAPIHook !== undefined) {
        postAPIHook = options.postAPIHook;
    }
    var onHandleEvent = function() {};
    if (options.onHandleEvent !== undefined) {
        onHandleEvent = options.onHandleEvent;
    }
    var override = __assign(
        {
            functions: function(oI) {
                return oI;
            }
        },
        options.override
    );
    if (options.enableDebugLogs !== undefined && options.enableDebugLogs) {
        (0, logger_1.enableLogging)();
    }
    return {
        apiDomain: apiDomain,
        apiBasePath: apiBasePath,
        sessionScope: sessionScope,
        sessionExpiredStatusCode: sessionExpiredStatusCode,
        invalidClaimStatusCode: invalidClaimStatusCode,
        autoAddCredentials: autoAddCredentials,
        isInIframe: isInIframe,
        cookieDomain: cookieDomain,
        preAPIHook: preAPIHook,
        postAPIHook: postAPIHook,
        onHandleEvent: onHandleEvent,
        override: override
    };
}
exports.validateAndNormaliseInputOrThrowError = validateAndNormaliseInputOrThrowError;
function shouldDoInterceptionBasedOnUrl(toCheckUrl, apiDomain, cookieDomain) {
    (0, logger_1.logDebugMessage)(
        "shouldDoInterceptionBasedOnUrl: toCheckUrl: " +
            toCheckUrl +
            " apiDomain: " +
            apiDomain +
            " cookiDomain: " +
            cookieDomain
    );
    function isNumeric(str) {
        if (typeof str != "string") return false; // we only process strings!
        return (
            !isNaN(str) && !isNaN(parseFloat(str)) // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
        ); // ...and ensure strings of whitespace fail
    }
    // The safest/best way to add this is the hash as the browser strips it before sending
    // but we don't have a reason to limit checking to that part.
    if (toCheckUrl.includes("superTokensDoNotDoInterception")) {
        return false;
    }
    toCheckUrl = normaliseURLDomainOrThrowError(toCheckUrl);
    var urlObj = new URL(toCheckUrl);
    var domain = urlObj.hostname;
    if (cookieDomain === undefined) {
        domain = urlObj.port === "" ? domain : domain + ":" + urlObj.port;
        apiDomain = normaliseURLDomainOrThrowError(apiDomain);
        var apiUrlObj = new URL(apiDomain);
        return domain === (apiUrlObj.port === "" ? apiUrlObj.hostname : apiUrlObj.hostname + ":" + apiUrlObj.port);
    } else {
        var normalisedCookieDomain = normaliseSessionScopeOrThrowError(cookieDomain);
        if (cookieDomain.split(":").length > 1) {
            // means port may provided
            var portStr = cookieDomain.split(":")[cookieDomain.split(":").length - 1];
            if (isNumeric(portStr)) {
                normalisedCookieDomain += ":" + portStr;
                domain = urlObj.port === "" ? domain : domain + ":" + urlObj.port;
            }
        }
        if (cookieDomain.startsWith(".")) {
            return ("." + domain).endsWith(normalisedCookieDomain);
        } else {
            return domain === normalisedCookieDomain;
        }
    }
}
exports.shouldDoInterceptionBasedOnUrl = shouldDoInterceptionBasedOnUrl;
function getNormalisedUserContext(userContext) {
    if (userContext === undefined) {
        return {};
    }
    return userContext;
}
exports.getNormalisedUserContext = getNormalisedUserContext;
