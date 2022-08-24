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

import { shouldDoInterceptionBasedOnUrl } from "./utils";
import AuthHttpRequestFetch, {
    AntiCsrfToken,
    getIdRefreshToken,
    setIdRefreshToken,
    FrontToken,
    onUnauthorisedResponse,
    IdRefreshTokenType
} from "./fetch";
import { logDebugMessage } from "./logger";
import WindowHandlerReference from "./utils/windowHandler";
import { PROCESS_STATE, ProcessState } from "./processState";

// Taken from http://jsfiddle.net/8nyku97o/

type XMLHttpRequestType = typeof XMLHttpRequest.prototype & { [key: string]: any };

export function addInterceptorsToXMLHttpRequest() {
    // create XMLHttpRequest proxy object
    let oldXMLHttpRequest = XMLHttpRequest;

    // define constructor for my proxy object
    XMLHttpRequest = function(this: XMLHttpRequestType) {
        let actual: XMLHttpRequestType = new oldXMLHttpRequest();

        let self = this;
        let listOfFunctionCallsInProxy: { (xhr: XMLHttpRequestType): void }[] = [];

        let requestHeaders: { name: string; value: string }[] = [];
        // let method: string = "";
        let url: string | URL = "";
        let doNotDoInterception = false;
        let preRequestIdToken: IdRefreshTokenType | undefined = undefined;

        // we do not provide onerror cause that is fired only on
        // network level failures and nothing else. If a status code is > 400,
        // then onload and onreadystatechange are called.

        self.onload = null;
        self.onreadystatechange = null;
        self.onloadend = null;
        addCallbackListenersToOldXHRInstance(actual);

        function addCallbackListenersToOldXHRInstance(xhr: XMLHttpRequestType) {
            xhr.onload = function(this: XMLHttpRequestType, ev: ProgressEvent<EventTarget>) {
                if (!self["onload"]) {
                    return;
                }

                handleResponse(xhr).then(callself => {
                    if (!self["onload"] || !callself) {
                        return;
                    }
                    self.onload(ev);
                });
            };

            xhr.onreadystatechange = function(ev: Event) {
                if (!self["onreadystatechange"]) {
                    return;
                }

                // In local files, status is 0 upon success in Mozilla Firefox
                if (xhr.readyState === XMLHttpRequest.DONE) {
                    handleResponse(xhr).then(callself => {
                        if (!self["onreadystatechange"] || !callself) {
                            return;
                        }
                        self.onreadystatechange(ev);
                    });
                } else {
                    return self.onreadystatechange(ev);
                }
            };

            xhr.onloadend = function(ev: ProgressEvent<EventTarget>) {
                if (!self["onloadend"]) {
                    return;
                }
                handleResponse(xhr).then(callself => {
                    if (!self["onloadend"] || !callself) {
                        return;
                    }
                    self.onloadend(ev);
                });
            };
        }

        async function handleRetryPostRefreshing(xhr: XMLHttpRequestType) {
            if (preRequestIdToken === undefined) {
                throw new Error("Should never come here..");
            }
            const refreshResult = await onUnauthorisedResponse(preRequestIdToken);
            if (refreshResult.result !== "RETRY") {
                logDebugMessage("handleRetryPostRefreshing: Not retrying original request");
                // Returning refreshResult.error as an Axios Error if we attempted a refresh
                // Returning the response to the original response as an error if we did not attempt refreshing
                // TODO:... this part needs to be properly thought about..
                // returnObj = refreshResult.error
                //     ? await createAxiosErrorFromFetchResp(refreshResult.error)
                //     : await createAxiosErrorFromAxiosResp(response);
                let event = new Event("error");
                xhr.dispatchEvent(event);
                return;
            }
            logDebugMessage("handleRetryPostRefreshing: Retrying original request");
            // We need to create a new XHR with the same thing as the older one
            let retryXhr = new XMLHttpRequest();
            listOfFunctionCallsInProxy.forEach(i => {
                i(retryXhr);
            });

            addCallbackListenersToOldXHRInstance(retryXhr);
            retryXhr.send();
        }

        async function handleResponse(xhr: XMLHttpRequestType): Promise<boolean> {
            if (doNotDoInterception) {
                logDebugMessage("handleResponse: Returning without interception");
                return true;
            }
            try {
                try {
                    logDebugMessage("handleResponse: Interception started");

                    ProcessState.getInstance().addState(PROCESS_STATE.CALLING_INTERCEPTION_RESPONSE);

                    const status = xhr.status;
                    const idRefreshToken = xhr.getResponseHeader("id-refresh-token");
                    if (idRefreshToken) {
                        logDebugMessage("handleResponse: Setting sIRTFrontend: " + idRefreshToken);
                        await setIdRefreshToken(idRefreshToken, status);
                    }

                    if (status === AuthHttpRequestFetch.config.sessionExpiredStatusCode) {
                        logDebugMessage("responseInterceptor: Status code is: " + status);
                        handleRetryPostRefreshing(xhr);
                        return false;
                    } else {
                        let antiCsrfToken = xhr.getResponseHeader("anti-csrf");
                        if (antiCsrfToken) {
                            let tok = await getIdRefreshToken(true);
                            if (tok.status === "EXISTS") {
                                logDebugMessage("handleResponse: Setting anti-csrf token");
                                await AntiCsrfToken.setItem(tok.token, antiCsrfToken);
                            }
                        }
                        let frontToken = xhr.getResponseHeader("front-token");
                        if (frontToken) {
                            logDebugMessage("handleResponse: Setting sFrontToken: " + frontToken);
                            await FrontToken.setItem(frontToken);
                        }
                    }
                    return true;
                } finally {
                    if (!((await getIdRefreshToken(true)).status === "EXISTS")) {
                        logDebugMessage(
                            "handleResponse: sIRTFrontend doesn't exist, so removing anti-csrf and sFrontToken"
                        );
                        await AntiCsrfToken.removeToken();
                        await FrontToken.removeToken();
                    }
                }
            } catch (err) {
                // there are couple of events here we can use:
                // - error -> called for network level issues..
                // - timeout
                // - abort
                let event = new Event("error");
                xhr.dispatchEvent(event);
                return true;
            }
        }

        self.open = function(_: string, u: string | URL) {
            let args: any = arguments;
            listOfFunctionCallsInProxy.push((xhr: XMLHttpRequestType) => {
                xhr.open.apply(xhr, args);
            });
            // method = m;
            url = u;
            // here we use the apply syntax cause there are other optional args that
            // can be passed by the user.
            actual.open.apply(actual, args);
        };

        self.send = function(body) {
            logDebugMessage("send: called");
            try {
                doNotDoInterception =
                    (typeof url === "string" &&
                        !shouldDoInterceptionBasedOnUrl(
                            url,
                            AuthHttpRequestFetch.config.apiDomain,
                            AuthHttpRequestFetch.config.cookieDomain
                        )) ||
                    (typeof url !== "string" &&
                        !shouldDoInterceptionBasedOnUrl(
                            url.toString(),
                            AuthHttpRequestFetch.config.apiDomain,
                            AuthHttpRequestFetch.config.cookieDomain
                        ));
            } catch (err) {
                if ((err as any).message === "Please provide a valid domain name") {
                    logDebugMessage("send: Trying shouldDoInterceptionBasedOnUrl with location.origin");
                    // .origin gives the port as well..
                    doNotDoInterception = !shouldDoInterceptionBasedOnUrl(
                        WindowHandlerReference.getReferenceOrThrow().windowHandler.location.getOrigin(),
                        AuthHttpRequestFetch.config.apiDomain,
                        AuthHttpRequestFetch.config.cookieDomain
                    );
                } else {
                    throw err;
                }
            }

            logDebugMessage("send: Value of doNotDoInterception: " + doNotDoInterception);
            if (doNotDoInterception) {
                logDebugMessage("send: Returning without interception");
                return actual.send(body);
            }
            logDebugMessage("send: Interception started");

            ProcessState.getInstance().addState(PROCESS_STATE.CALLING_INTERCEPTION_REQUEST);

            (async function() {
                preRequestIdToken = await getIdRefreshToken(true);

                if (preRequestIdToken.status === "EXISTS") {
                    const antiCsrfToken = await AntiCsrfToken.getToken(preRequestIdToken.token);
                    if (antiCsrfToken !== undefined) {
                        logDebugMessage("send: Adding anti-csrf token to request");
                        self.setRequestHeader("anti-csrf", antiCsrfToken);
                    }
                }

                if (AuthHttpRequestFetch.config.autoAddCredentials) {
                    logDebugMessage("send: Adding credentials include");
                    self.withCredentials = true;
                }

                if (
                    !requestHeaders.some(i => {
                        i.name === "rid";
                    })
                ) {
                    logDebugMessage("send: Adding rid header: anti-csrf");
                    self.setRequestHeader("rid", "anti-csrf");
                } else {
                    logDebugMessage("send: rid header was already there in request");
                }

                logDebugMessage("send: Making user's http call");
                return actual.send(body);
            })();
        };

        self.setRequestHeader = function(name: string, value: string) {
            listOfFunctionCallsInProxy.push((xhr: XMLHttpRequestType) => {
                xhr.setRequestHeader(name, value);
            });
            if (
                requestHeaders.some(i => {
                    i.name === name;
                })
            ) {
                requestHeaders = requestHeaders.filter(i => {
                    i.name === name;
                });
            }
            requestHeaders.push({ name, value });
            actual.setRequestHeader(name, value);
        };

        // iterate all properties in actual to proxy them according to their type
        // For functions, we call actual and return the result
        // For non-functions, we make getters/setters
        // If the property already exists on self, then don't proxy it
        for (const prop in actual) {
            // skip properties we already have - this will skip both the above defined properties
            // that we don't want to proxy and skip properties on the prototype belonging to Object
            if (!(prop in self)) {
                // create closure to capture value of prop
                (function(prop) {
                    if (typeof actual[prop] === "function") {
                        // define our own property that calls the same method on the actual
                        Object.defineProperty(self, prop, {
                            configurable: true,
                            value: function() {
                                let args = arguments;
                                listOfFunctionCallsInProxy.push((xhr: XMLHttpRequestType) => {
                                    xhr[prop].apply(xhr, args);
                                });
                                return actual[prop].apply(actual, args);
                            }
                        });
                    } else {
                        // define our own property that just gets or sets the same prop on the actual
                        Object.defineProperty(self, prop, {
                            get: function() {
                                return actual[prop];
                            },
                            set: function(val) {
                                listOfFunctionCallsInProxy.push((xhr: XMLHttpRequestType) => {
                                    xhr[prop] = val;
                                });
                                actual[prop] = val;
                            }
                        });
                    }
                })(prop);
            }
        }
    } as any;
}

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
