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
function addInterceptorsToXMLHttpRequest() {
    // create XMLHttpRequest proxy object
    var oldXMLHttpRequest = XMLHttpRequest;
    // define constructor for my proxy object
    XMLHttpRequest = function() {
        var actual = new oldXMLHttpRequest();
        var self = this;
        var requestHeaders = [];
        // let method: string = "";
        var url = "";
        actual.onerror = function(ev) {
            if (self["onerror"]) {
                return self.onerror(ev);
            }
        };
        actual.onload = function(ev) {
            if (self["onload"]) {
                return self.onload(ev);
            }
        };
        self.open = function(_, u) {
            // method = m;
            url = u;
            // here we use the apply syntax cause there are other optional args that
            // can be passed by the user.
            actual.open.apply(actual, arguments);
        };
        self.send = function(body) {
            var doNotDoInterception = false;
            (0, logger_1.logDebugMessage)("send: called");
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
                    (0, logger_1.logDebugMessage)("send: Trying shouldDoInterceptionBasedOnUrl with location.origin");
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
            (0, logger_1.logDebugMessage)("send: Value of doNotDoInterception: " + doNotDoInterception);
            if (doNotDoInterception) {
                (0, logger_1.logDebugMessage)("send: Returning without interception");
                return actual.send(body);
            }
            (0, logger_1.logDebugMessage)("send: Interception started");
            processState_1.ProcessState.getInstance().addState(
                processState_1.PROCESS_STATE.CALLING_INTERCEPTION_REQUEST
            );
            (function() {
                return __awaiter(this, void 0, void 0, function() {
                    var preRequestIdToken, antiCsrfToken;
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
                                    (0, logger_1.logDebugMessage)("send: Adding anti-csrf token to request");
                                    self.setRequestHeader("anti-csrf", antiCsrfToken);
                                }
                                _a.label = 3;
                            case 3:
                                if (fetch_1.default.config.autoAddCredentials) {
                                    (0, logger_1.logDebugMessage)("send: Adding credentials include");
                                    // TODO: need to check if the default is false or not.
                                    self.withCredentials = true;
                                }
                                if (
                                    !requestHeaders.some(function(i) {
                                        i.name === "rid";
                                    })
                                ) {
                                    (0, logger_1.logDebugMessage)("send: Adding rid header: anti-csrf");
                                    self.setRequestHeader("rid", "anti-csrf");
                                } else {
                                    (0, logger_1.logDebugMessage)("send: rid header was already there in request");
                                }
                                (0, logger_1.logDebugMessage)("doRequest: Making user's http call");
                                return [2 /*return*/, actual.send(body)];
                        }
                    });
                });
            })();
        };
        self.setRequestHeader = function(name, value) {
            if (
                requestHeaders.some(function(i) {
                    i.name === name;
                })
            ) {
                requestHeaders = requestHeaders.filter(function(i) {
                    i.name === name;
                });
            }
            requestHeaders.push({ name: name, value: value });
            actual.setRequestHeader(name, value);
        };
        var doNotProxy = ["onload", "onerror", "send", "setRequestHeader", "open"];
        // iterate all properties in actual to proxy them according to their type
        // For functions, we call actual and return the result
        // For non-functions, we make getters/setters
        // If the property already exists on self, then don't proxy it
        for (var prop in actual) {
            // skip properties we already have - this will skip both the above defined properties
            // that we don't want to proxy and skip properties on the prototype belonging to Object
            if (!(prop in self) && !doNotProxy.includes(prop)) {
                // create closure to capture value of prop
                (function(prop) {
                    if (typeof actual[prop] === "function") {
                        // define our own property that calls the same method on the actual
                        Object.defineProperty(self, prop, {
                            configurable: true,
                            value: function() {
                                return actual[prop].apply(actual, arguments);
                            }
                        });
                    } else {
                        // define our own property that just gets or sets the same prop on the actual
                        Object.defineProperty(self, prop, {
                            get: function() {
                                return actual[prop];
                            },
                            set: function(val) {
                                actual[prop] = val;
                            }
                        });
                    }
                })(prop);
            }
        }
    };
}
exports.addInterceptorsToXMLHttpRequest = addInterceptorsToXMLHttpRequest;
/**
 *
 * var request = new XMLHttpRequest();

    // HTTP basic authentication
    if (config.auth) {
      var username = config.auth.username || '';
      var password = config.auth.password ? unescape(encodeURIComponent(config.auth.password)) : '';
      requestHeaders.Authorization = 'Basic ' + btoa(username + ':' + password);
    }

    var fullPath = buildFullPath(config.baseURL, config.url);
    request.open(config.method.toUpperCase(), buildURL(fullPath, config.params, config.paramsSerializer), true);

    // Set the request timeout in MS
    request.timeout = config.timeout;

    function onloadend() {
      if (!request) {
        return;
      }
      // Prepare the response
      var responseHeaders = 'getAllResponseHeaders' in request ? parseHeaders(request.getAllResponseHeaders()) : null;
      var responseData = !responseType || responseType === 'text' ||  responseType === 'json' ?
        request.responseText : request.response;
      var response = {
        data: responseData,
        status: request.status,
        statusText: request.statusText,
        headers: responseHeaders,
        config: config,
        request: request
      };

      settle(resolve, reject, response);

      // Clean up request
      request = null;
    }

    if ('onloadend' in request) {
      // Use onloadend if available
      request.onloadend = onloadend;
    } else {
      // Listen for ready state to emulate onloadend
      request.onreadystatechange = function handleLoad() {
        if (!request || request.readyState !== 4) {
          return;
        }

        // The request errored out and we didn't get a response, this will be
        // handled by onerror instead
        // With one exception: request that using file: protocol, most browsers
        // will return status as 0 even though it's a successful request
        if (request.status === 0 && !(request.responseURL && request.responseURL.indexOf('file:') === 0)) {
          return;
        }
        // readystate handler is calling before onerror or ontimeout handlers,
        // so we should call onloadend on the next 'tick'
        setTimeout(onloadend);
      };
    }

    // Handle browser request cancellation (as opposed to a manual cancellation)
    request.onabort = function handleAbort() {
      if (!request) {
        return;
      }

      reject(createError('Request aborted', config, 'ECONNABORTED', request));

      // Clean up request
      request = null;
    };

    // Handle low level network errors
    request.onerror = function handleError() {
      // Real errors are hidden from us by the browser
      // onerror should only fire if it's a network error
      reject(createError('Network Error', config, null, request));

      // Clean up request
      request = null;
    };

    // Handle timeout
    request.ontimeout = function handleTimeout() {
      var timeoutErrorMessage = 'timeout of ' + config.timeout + 'ms exceeded';
      if (config.timeoutErrorMessage) {
        timeoutErrorMessage = config.timeoutErrorMessage;
      }
      reject(createError(
        timeoutErrorMessage,
        config,
        config.transitional && config.transitional.clarifyTimeoutError ? 'ETIMEDOUT' : 'ECONNABORTED',
        request));

      // Clean up request
      request = null;
    };

    // Add xsrf header
    // This is only done if running in a standard browser environment.
    // Specifically not if we're in a web worker, or react-native.
    if (utils.isStandardBrowserEnv()) {
      // Add xsrf header
      var xsrfValue = (config.withCredentials || isURLSameOrigin(fullPath)) && config.xsrfCookieName ?
        cookies.read(config.xsrfCookieName) :
        undefined;

      if (xsrfValue) {
        requestHeaders[config.xsrfHeaderName] = xsrfValue;
      }
    }

    // Add headers to the request
    if ('setRequestHeader' in request) {
      utils.forEach(requestHeaders, function setRequestHeader(val, key) {
        if (typeof requestData === 'undefined' && key.toLowerCase() === 'content-type') {
          // Remove Content-Type if data is undefined
          delete requestHeaders[key];
        } else {
          // Otherwise add header to the request
          request.setRequestHeader(key, val);
        }
      });
    }

    // Add withCredentials to request if needed
    if (!utils.isUndefined(config.withCredentials)) {
      request.withCredentials = !!config.withCredentials;
    }

    // Add responseType to request if needed
    if (responseType && responseType !== 'json') {
      request.responseType = config.responseType;
    }

    // Handle progress if needed
    if (typeof config.onDownloadProgress === 'function') {
      request.addEventListener('progress', config.onDownloadProgress);
    }

    // Not all browsers support upload events
    if (typeof config.onUploadProgress === 'function' && request.upload) {
      request.upload.addEventListener('progress', config.onUploadProgress);
    }

    if (config.cancelToken) {
      // Handle cancellation
      config.cancelToken.promise.then(function onCanceled(cancel) {
        if (!request) {
          return;
        }

        request.abort();
        reject(cancel);
        // Clean up request
        request = null;
      });
    }

    if (!requestData) {
      requestData = null;
    }

    // Send the request
    request.send(requestData);
 *
 *
 *
 *
 *
 */
