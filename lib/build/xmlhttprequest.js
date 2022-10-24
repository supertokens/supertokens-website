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
exports.addInterceptorsToXMLHttpRequest = void 0;
var utils_1 = require("./utils");
var fetch_1 = require("./fetch");
var logger_1 = require("./logger");
var windowHandler_1 = require("./utils/windowHandler");
var processState_1 = require("./processState");
var XHR_EVENTS = ["readystatechange", "abort", "error", "load", "loadend", "loadstart", "progress", "timeout"];
function addInterceptorsToXMLHttpRequest() {
    var firstEventLoopDone = false;
    setTimeout(function() {
        return (firstEventLoopDone = true);
    }, 0);
    var oldXMLHttpRequest = XMLHttpRequest;
    (0, logger_1.logDebugMessage)("addInterceptorsToXMLHttpRequest called");
    // create XMLHttpRequest proxy object
    // define constructor for my proxy object
    XMLHttpRequest = function() {
        var actual = new oldXMLHttpRequest();
        var delayActualCalls = !firstEventLoopDone;
        function delayIfNecessary(cb) {
            if (delayActualCalls) {
                setTimeout(function() {
                    cb();
                }, 0);
            } else {
                cb();
            }
        }
        var self = this;
        var listOfFunctionCallsInProxy = [];
        var requestHeaders = [];
        var customGetterValues = {};
        var customResponseHeaders;
        var eventHandlers = new Map();
        // We define these during open
        // let method: string = "";
        var url = "";
        var doNotDoInterception = false;
        var preRequestIdToken = undefined;
        var body;
        // we do not provide onerror cause that is fired only on
        // network level failures and nothing else. If a status code is > 400,
        // then onload and onreadystatechange are called.
        // Setting up props (event handlers) that we use in event handlers
        // These require processing the response (and possibly retrying) before they are forwarded to the user
        self.onload = null;
        self.onreadystatechange = null;
        self.onloadend = null;
        // TODO: add support for other event listener options
        // https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#parameters
        self.addEventListener = function(type, listener, _options) {
            var handlers = eventHandlers.get(type);
            if (handlers === undefined) {
                handlers = new Set();
                eventHandlers.set(type, handlers);
            }
            handlers.add(listener);
        };
        self.removeEventListener = function(type, listener) {
            var handlers = eventHandlers.get(type);
            if (handlers === undefined) {
                handlers = new Set();
                eventHandlers.set(type, handlers);
            }
            handlers.delete(listener);
        };
        function redispatchEvent(name, ev) {
            var handlers = eventHandlers.get(name);
            (0, logger_1.logDebugMessage)(
                "XHRInterceptor dispatching ".concat(ev.type, " to ").concat(handlers ? handlers.size : 0, " listeners")
            );
            if (handlers) {
                Array.from(handlers).forEach(function(handler) {
                    return handler.apply(self, [ev]);
                });
            }
        }
        function handleRetryPostRefreshing() {
            return __awaiter(this, void 0, void 0, function() {
                var refreshResult, retryXhr;
                return __generator(this, function(_a) {
                    switch (_a.label) {
                        case 0:
                            if (preRequestIdToken === undefined) {
                                throw new Error("Should never come here..");
                            }
                            (0,
                            logger_1.logDebugMessage)("XHRInterceptor.handleRetryPostRefreshing: preRequestIdToken " + preRequestIdToken.status);
                            return [4 /*yield*/, (0, fetch_1.onUnauthorisedResponse)(preRequestIdToken)];
                        case 1:
                            refreshResult = _a.sent();
                            if (refreshResult.result !== "RETRY") {
                                (0, logger_1.logDebugMessage)(
                                    "XHRInterceptor.handleRetryPostRefreshing: Not retrying original request " +
                                        !!refreshResult.error
                                );
                                if (refreshResult.error !== undefined) {
                                    // this will cause the responseText of the self to be updated
                                    // to the error message and make the status code the same as
                                    // what the error's status code is.
                                    throw refreshResult.error;
                                }
                                // it can come here if refreshResult.result is SESSION_EXPIRED.
                                // in that case, the status of self is already 401. So we let it
                                // pass through.
                                return [2 /*return*/, true];
                            }
                            (0,
                            logger_1.logDebugMessage)("XHRInterceptor.handleRetryPostRefreshing: Retrying original request");
                            retryXhr = new oldXMLHttpRequest();
                            setUpXHR(self, retryXhr, true);
                            // this also calls the send function with the appropriate body
                            listOfFunctionCallsInProxy.forEach(function(i) {
                                i(retryXhr);
                            });
                            sendXHR(retryXhr, body);
                            return [2 /*return*/, false];
                    }
                });
            });
        }
        function handleResponse(xhr) {
            return __awaiter(this, void 0, void 0, function() {
                var status_1, headers, idRefreshToken, antiCsrfToken, tok, frontToken, err_1, resp;
                return __generator(this, function(_a) {
                    switch (_a.label) {
                        case 0:
                            if (doNotDoInterception) {
                                (0, logger_1.logDebugMessage)(
                                    "XHRInterceptor.handleResponse: Returning without interception"
                                );
                                return [2 /*return*/, true];
                            }
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 20, , 24]);
                            _a.label = 2;
                        case 2:
                            _a.trys.push([2, , 14, 19]);
                            (0, logger_1.logDebugMessage)("XHRInterceptor.handleResponse: Interception started");
                            processState_1.ProcessState.getInstance().addState(
                                processState_1.PROCESS_STATE.CALLING_INTERCEPTION_RESPONSE
                            );
                            status_1 = xhr.status;
                            headers = new Headers(
                                xhr
                                    .getAllResponseHeaders()
                                    .trim()
                                    .split("\r\n")
                                    .map(function(line) {
                                        return line.split(": ");
                                    })
                            );
                            idRefreshToken = headers.get("id-refresh-token");
                            if (!idRefreshToken) return [3 /*break*/, 4];
                            (0,
                            logger_1.logDebugMessage)("XHRInterceptor.handleResponse: Setting sIRTFrontend: " + idRefreshToken);
                            return [4 /*yield*/, (0, fetch_1.setIdRefreshToken)(idRefreshToken, status_1)];
                        case 3:
                            _a.sent();
                            _a.label = 4;
                        case 4:
                            if (!(status_1 === fetch_1.default.config.sessionExpiredStatusCode))
                                return [3 /*break*/, 6];
                            (0, logger_1.logDebugMessage)("responseInterceptor: Status code is: " + status_1);
                            return [4 /*yield*/, handleRetryPostRefreshing()];
                        case 5:
                            return [2 /*return*/, _a.sent()];
                        case 6:
                            if (!(status_1 === fetch_1.default.config.invalidClaimStatusCode)) return [3 /*break*/, 8];
                            return [
                                4 /*yield*/,
                                (0, fetch_1.onInvalidClaimResponse)({
                                    data: JSON.parse(xhr.responseText)
                                })
                            ];
                        case 7:
                            _a.sent();
                            _a.label = 8;
                        case 8:
                            antiCsrfToken = headers.get("anti-csrf");
                            if (!antiCsrfToken) return [3 /*break*/, 11];
                            return [4 /*yield*/, (0, fetch_1.getIdRefreshToken)(true)];
                        case 9:
                            tok = _a.sent();
                            if (!(tok.status === "EXISTS")) return [3 /*break*/, 11];
                            (0, logger_1.logDebugMessage)("XHRInterceptor.handleResponse: Setting anti-csrf token");
                            return [4 /*yield*/, fetch_1.AntiCsrfToken.setItem(tok.token, antiCsrfToken)];
                        case 10:
                            _a.sent();
                            _a.label = 11;
                        case 11:
                            frontToken = headers.get("front-token");
                            if (!frontToken) return [3 /*break*/, 13];
                            (0,
                            logger_1.logDebugMessage)("XHRInterceptor.handleResponse: Setting sFrontToken: " + frontToken);
                            return [4 /*yield*/, fetch_1.FrontToken.setItem(frontToken)];
                        case 12:
                            _a.sent();
                            _a.label = 13;
                        case 13:
                            return [2 /*return*/, true];
                        case 14:
                            (0, logger_1.logDebugMessage)("XHRInterceptor.handleResponse: doFinallyCheck running");
                            return [4 /*yield*/, (0, fetch_1.getIdRefreshToken)(false)];
                        case 15:
                            if (!!(_a.sent().status === "EXISTS")) return [3 /*break*/, 18];
                            (0,
                            logger_1.logDebugMessage)("XHRInterceptor.handleResponse: sIRTFrontend doesn't exist, so removing anti-csrf and sFrontToken");
                            return [4 /*yield*/, fetch_1.AntiCsrfToken.removeToken()];
                        case 16:
                            _a.sent();
                            return [4 /*yield*/, fetch_1.FrontToken.removeToken()];
                        case 17:
                            _a.sent();
                            _a.label = 18;
                        case 18:
                            return [7 /*endfinally*/];
                        case 19:
                            return [3 /*break*/, 24];
                        case 20:
                            err_1 = _a.sent();
                            (0, logger_1.logDebugMessage)("XHRInterceptor.handleResponse: caught error");
                            if (!(err_1.status !== undefined)) return [3 /*break*/, 22];
                            return [4 /*yield*/, getXMLHttpStatusAndResponseTextFromFetchResponse(err_1)];
                        case 21:
                            resp = _a.sent();
                            customGetterValues["status"] = resp.status;
                            customGetterValues["statusText"] = resp.statusText;
                            customGetterValues["responseType"] = resp.responseType;
                            customResponseHeaders = resp.headers;
                            if (resp.responseType === "json") {
                                try {
                                    customGetterValues["response"] = JSON.parse(resp.responseText);
                                } catch (_b) {
                                    customGetterValues["response"] = resp.responseText;
                                }
                            } else {
                                customGetterValues["response"] = resp.responseText;
                            }
                            customGetterValues["responseText"] = resp.responseText;
                            return [3 /*break*/, 23];
                        case 22:
                            // Here we only need to handle fetch related errors, from the refresh endpoint called by the retry
                            // So we should only get network level errors here
                            redispatchEvent("error", new Event("error"));
                            _a.label = 23;
                        case 23:
                            return [2 /*return*/, true];
                        case 24:
                            return [2 /*return*/];
                    }
                });
            });
        }
        self.open = function(_, u) {
            (0, logger_1.logDebugMessage)("XHRInterceptor.open called");
            var args = arguments;
            listOfFunctionCallsInProxy.push(function(xhr) {
                xhr.open.apply(xhr, args);
            });
            // method = m;
            url = u;
            try {
                doNotDoInterception =
                    (typeof url === "string" &&
                        !(0, utils_1.shouldDoInterceptionBasedOnUrl)(
                            url,
                            fetch_1.default.config.apiDomain,
                            fetch_1.default.config.cookieDomain
                        )) ||
                    (typeof url !== "string" &&
                        !(0, utils_1.shouldDoInterceptionBasedOnUrl)(
                            url.toString(),
                            fetch_1.default.config.apiDomain,
                            fetch_1.default.config.cookieDomain
                        ));
            } catch (err) {
                if (err.message === "Please provide a valid domain name") {
                    (0, logger_1.logDebugMessage)(
                        "XHRInterceptor.open: Trying shouldDoInterceptionBasedOnUrl with location.origin"
                    );
                    // .origin gives the port as well..
                    doNotDoInterception = !(0, utils_1.shouldDoInterceptionBasedOnUrl)(
                        windowHandler_1.default.getReferenceOrThrow().windowHandler.location.getOrigin(),
                        fetch_1.default.config.apiDomain,
                        fetch_1.default.config.cookieDomain
                    );
                } else {
                    throw err;
                }
            }
            // here we use the apply syntax cause there are other optional args that
            // can be passed by the user.
            delayIfNecessary(function() {
                return actual.open.apply(actual, args);
            });
        };
        self.send = function(inputBody) {
            body = inputBody;
            sendXHR(actual, body);
        };
        self.setRequestHeader = function(name, value) {
            if (doNotDoInterception) {
                delayIfNecessary(function() {
                    return actual.setRequestHeader(name, value);
                });
                return;
            }
            // We need to do this, because if there is another interceptor wrapping this (e.g.: the axios interceptor)
            // then the anti-csrf token they add would be concatenated to the anti-csrf token added by this interceptor
            if (name === "anti-csrf") {
                return;
            }
            listOfFunctionCallsInProxy.push(function(xhr) {
                xhr.setRequestHeader(name, value);
            });
            // The original version "combines" headers according to MDN.
            requestHeaders.push({ name: name, value: value });
            delayIfNecessary(function() {
                return actual.setRequestHeader(name, value);
            });
        };
        var copiedProps = undefined;
        setUpXHR(self, actual, false);
        function setUpXHR(self, xhr, isRetry) {
            var responseProcessed;
            var delayedEvents = ["load", "loadend", "readystatechange"];
            (0, logger_1.logDebugMessage)("XHRInterceptor.setUpXHR called");
            var _loop_1 = function(name_1) {
                (0, logger_1.logDebugMessage)("XHRInterceptor added listener for event ".concat(name_1));
                xhr.addEventListener(name_1, function(ev) {
                    (0, logger_1.logDebugMessage)("XHRInterceptor got event ".concat(name_1));
                    if (!delayedEvents.includes(name_1)) {
                        redispatchEvent(name_1, ev);
                    }
                });
            };
            for (var _i = 0, XHR_EVENTS_1 = XHR_EVENTS; _i < XHR_EVENTS_1.length; _i++) {
                var name_1 = XHR_EVENTS_1[_i];
                _loop_1(name_1);
            }
            xhr.onload = function(ev) {
                if (responseProcessed === undefined) {
                    responseProcessed = handleResponse(xhr);
                }
                responseProcessed.then(function(callself) {
                    if (!callself) {
                        return;
                    }
                    if (self.onload) {
                        self.onload(ev);
                    }
                    redispatchEvent("load", ev);
                });
            };
            xhr.onreadystatechange = function(ev) {
                // In local files, status is 0 upon success in Mozilla Firefox
                if (xhr.readyState === oldXMLHttpRequest.DONE) {
                    if (responseProcessed === undefined) {
                        responseProcessed = handleResponse(xhr);
                    }
                    responseProcessed.then(function(callself) {
                        if (!callself) {
                            return;
                        }
                        if (self.onreadystatechange) self.onreadystatechange(ev);
                        redispatchEvent("readystatechange", ev);
                    });
                } else {
                    if (self.onreadystatechange) {
                        self.onreadystatechange(ev);
                    }
                    redispatchEvent("readystatechange", ev);
                }
            };
            xhr.onloadend = function(ev) {
                if (responseProcessed === undefined) {
                    responseProcessed = handleResponse(xhr);
                }
                responseProcessed.then(function(callself) {
                    if (!callself) {
                        return;
                    }
                    if (self.onloadend) {
                        self.onloadend(ev);
                    }
                    redispatchEvent("loadend", ev);
                });
            };
            self.getAllResponseHeaders = function() {
                var headersString;
                if (customResponseHeaders) {
                    headersString = "";
                    customResponseHeaders.forEach(function(v, k) {
                        return (headersString += "".concat(k, ": ").concat(v, "\r\n"));
                    });
                } else {
                    headersString = xhr.getAllResponseHeaders();
                }
                // We use this "fake-header" to signal other interceptors (axios) that this is done
                // in case both is applied
                return headersString + "x-supertokens-xhr-intercepted: true\r\n";
            };
            self.getResponseHeader = function(name) {
                if (name === "x-supertokens-xhr-intercepted") {
                    return "true";
                }
                if (customResponseHeaders) {
                    return customResponseHeaders.get(name);
                }
                return xhr.getResponseHeader(name);
            };
            if (copiedProps === undefined) {
                copiedProps = [];
                // iterate all properties in actual to proxy them according to their type
                // For functions, we call actual and return the result
                // For non-functions, we make getters/setters
                // If the property already exists on self, then don't proxy it
                for (var prop in xhr) {
                    // skip properties we already have - this will skip both the above defined properties
                    // that we don't want to proxy and skip properties on the prototype belonging to Object
                    if (!(prop in self)) {
                        // We save these props into an array - in case we need to set up a retry XHR
                        copiedProps.push(prop);
                    }
                }
            }
            var _loop_2 = function(prop) {
                if (typeof xhr[prop] === "function") {
                    // define our own property that calls the same method on the actual
                    Object.defineProperty(self, prop, {
                        configurable: true,
                        value: function() {
                            var args = arguments;
                            if (!isRetry) {
                                listOfFunctionCallsInProxy.push(function(xhr) {
                                    xhr[prop].apply(xhr, args);
                                });
                            }
                            return xhr[prop].apply(xhr, args);
                        }
                    });
                } else {
                    // define our own property that just gets or sets the same prop on the actual
                    Object.defineProperty(self, prop, {
                        configurable: true,
                        get: function() {
                            if (customGetterValues[prop] !== undefined) {
                                return customGetterValues[prop];
                            }
                            return xhr[prop];
                        },
                        set: function(val) {
                            if (!isRetry) {
                                listOfFunctionCallsInProxy.push(function(xhr) {
                                    xhr[prop] = val;
                                });
                            }
                            (0, logger_1.logDebugMessage)("XHRInterceptor.set[".concat(prop, "] = ").concat(val));
                            xhr[prop] = val;
                        }
                    });
                }
            };
            for (var _a = 0, copiedProps_1 = copiedProps; _a < copiedProps_1.length; _a++) {
                var prop = copiedProps_1[_a];
                _loop_2(prop);
            }
        }
        function sendXHR(xhr, body) {
            var _this = this;
            (0, logger_1.logDebugMessage)("XHRInterceptor.send: called");
            (0, logger_1.logDebugMessage)("XHRInterceptor.send: Value of doNotDoInterception: " + doNotDoInterception);
            if (doNotDoInterception) {
                (0, logger_1.logDebugMessage)("XHRInterceptor.send: Returning without interception");
                delayIfNecessary(function() {
                    return xhr.send(body);
                });
                return;
            }
            (0, logger_1.logDebugMessage)("XHRInterceptor.send: Interception started");
            processState_1.ProcessState.getInstance().addState(
                processState_1.PROCESS_STATE.CALLING_INTERCEPTION_REQUEST
            );
            delayIfNecessary(function() {
                return __awaiter(_this, void 0, void 0, function() {
                    var antiCsrfToken;
                    return __generator(this, function(_a) {
                        switch (_a.label) {
                            case 0:
                                return [4 /*yield*/, (0, fetch_1.getIdRefreshToken)(true)];
                            case 1:
                                preRequestIdToken = _a.sent();
                                if (!(preRequestIdToken.status === "EXISTS")) return [3 /*break*/, 3];
                                return [4 /*yield*/, fetch_1.AntiCsrfToken.getToken(preRequestIdToken.token)];
                            case 2:
                                antiCsrfToken = _a.sent();
                                if (antiCsrfToken !== undefined) {
                                    (0, logger_1.logDebugMessage)(
                                        "XHRInterceptor.send: Adding anti-csrf token to request"
                                    );
                                    xhr.setRequestHeader("anti-csrf", antiCsrfToken);
                                }
                                _a.label = 3;
                            case 3:
                                if (fetch_1.default.config.autoAddCredentials) {
                                    (0, logger_1.logDebugMessage)("XHRInterceptor.send: Adding credentials include");
                                    self.withCredentials = true;
                                }
                                if (
                                    !requestHeaders.some(function(i) {
                                        return i.name === "rid";
                                    })
                                ) {
                                    (0, logger_1.logDebugMessage)("XHRInterceptor.send: Adding rid header: anti-csrf");
                                    xhr.setRequestHeader("rid", "anti-csrf");
                                } else {
                                    (0, logger_1.logDebugMessage)(
                                        "XHRInterceptor.send: rid header was already there in request"
                                    );
                                }
                                (0, logger_1.logDebugMessage)("XHRInterceptor.send: Making user's http call");
                                return [2 /*return*/, xhr.send(body)];
                        }
                    });
                });
            });
        }
    };
    XMLHttpRequest.__original = oldXMLHttpRequest;
}
exports.addInterceptorsToXMLHttpRequest = addInterceptorsToXMLHttpRequest;
function getXMLHttpStatusAndResponseTextFromFetchResponse(response) {
    return __awaiter(this, void 0, void 0, function() {
        var contentType, data, responseType, _a, _b, _c;
        return __generator(this, function(_d) {
            switch (_d.label) {
                case 0:
                    contentType = response.headers.get("content-type");
                    data = "";
                    responseType = "text";
                    if (!(contentType === null)) return [3 /*break*/, 5];
                    _d.label = 1;
                case 1:
                    _d.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, response.text()];
                case 2:
                    data = _d.sent();
                    return [3 /*break*/, 4];
                case 3:
                    _a = _d.sent();
                    data = "";
                    return [3 /*break*/, 4];
                case 4:
                    return [3 /*break*/, 9];
                case 5:
                    if (!contentType.includes("application/json")) return [3 /*break*/, 7];
                    responseType = "json";
                    _c = (_b = JSON).stringify;
                    return [4 /*yield*/, response.json()];
                case 6:
                    data = _c.apply(_b, [_d.sent()]);
                    return [3 /*break*/, 9];
                case 7:
                    if (!contentType.includes("text/")) return [3 /*break*/, 9];
                    return [4 /*yield*/, response.text()];
                case 8:
                    data = _d.sent();
                    _d.label = 9;
                case 9:
                    return [
                        2 /*return*/,
                        {
                            status: response.status,
                            responseText: data,
                            statusText: response.statusText,
                            responseType: responseType,
                            headers: response.headers
                        }
                    ];
            }
        });
    });
}
