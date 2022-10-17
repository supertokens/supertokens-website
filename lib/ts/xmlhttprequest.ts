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
    IdRefreshTokenType,
    onInvalidClaimResponse
} from "./fetch";
import { logDebugMessage } from "./logger";
import WindowHandlerReference from "./utils/windowHandler";
import { PROCESS_STATE, ProcessState } from "./processState";

type XMLHttpRequestType = typeof XMLHttpRequest.prototype & { [key: string]: any };

export function addInterceptorsToXMLHttpRequest() {
    const oldXMLHttpRequest = XMLHttpRequest;
    logDebugMessage("addInterceptorsToXMLHttpRequest called");

    // create XMLHttpRequest proxy object

    // define constructor for my proxy object
    XMLHttpRequest = function(this: XMLHttpRequestType) {
        const actual: XMLHttpRequestType = new oldXMLHttpRequest();

        const self = this;
        const listOfFunctionCallsInProxy: { (xhr: XMLHttpRequestType): void }[] = [];

        const requestHeaders: { name: string; value: string }[] = [];
        const customGetterValues: { [key: string]: any } = {};
        let customResponseHeaders: Headers | undefined;

        // We define these during open
        // let method: string = "";
        let url: string | URL = "";
        let doNotDoInterception = false;
        let preRequestIdToken: IdRefreshTokenType | undefined = undefined;
        let body: Document | XMLHttpRequestBodyInit | null | undefined;

        // we do not provide onerror cause that is fired only on
        // network level failures and nothing else. If a status code is > 400,
        // then onload and onreadystatechange are called.

        // Setting up props (event handlers) that we use in event handlers
        // These require processing the response (and possibly retrying) before they are forwarded to the user
        self.onload = null;
        self.onreadystatechange = null;
        self.onloadend = null;

        const eventTarget = new EventTarget();
        self.addEventListener = eventTarget.addEventListener.bind(eventTarget);
        self.removeEventListener = eventTarget.removeEventListener.bind(eventTarget);

        function redispatchEvent(ev: Event) {
            logDebugMessage(`XHRInterceptor redispatching ${ev.type}`);

            eventTarget.dispatchEvent(new (ev as any).constructor(ev.type, ev));
        }

        async function handleRetryPostRefreshing(): Promise<boolean> {
            if (preRequestIdToken === undefined) {
                throw new Error("Should never come here..");
            }
            logDebugMessage("XHRInterceptor.handleRetryPostRefreshing: preRequestIdToken " + preRequestIdToken.status);
            const refreshResult = await onUnauthorisedResponse(preRequestIdToken);
            if (refreshResult.result !== "RETRY") {
                logDebugMessage(
                    "XHRInterceptor.handleRetryPostRefreshing: Not retrying original request " + !!refreshResult.error
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
                return true;
            }
            logDebugMessage("XHRInterceptor.handleRetryPostRefreshing: Retrying original request");
            // We need to create a new XHR with the same thing as the older one
            let retryXhr = new oldXMLHttpRequest();

            setUpXHR(self, retryXhr, true);
            // this also calls the send function with the appropriate body
            listOfFunctionCallsInProxy.forEach(i => {
                i(retryXhr);
            });
            sendXHR(retryXhr, body);

            return false;
        }

        async function handleResponse(xhr: XMLHttpRequestType): Promise<boolean> {
            if (doNotDoInterception) {
                logDebugMessage("XHRInterceptor.handleResponse: Returning without interception");
                return true;
            }
            try {
                try {
                    logDebugMessage("XHRInterceptor.handleResponse: Interception started");

                    ProcessState.getInstance().addState(PROCESS_STATE.CALLING_INTERCEPTION_RESPONSE);

                    const status = xhr.status;
                    const idRefreshToken = xhr.getResponseHeader("id-refresh-token");
                    if (idRefreshToken) {
                        logDebugMessage("XHRInterceptor.handleResponse: Setting sIRTFrontend: " + idRefreshToken);
                        await setIdRefreshToken(idRefreshToken, status);
                    }
                    if (status === AuthHttpRequestFetch.config.sessionExpiredStatusCode) {
                        logDebugMessage("responseInterceptor: Status code is: " + status);
                        return await handleRetryPostRefreshing();
                    } else {
                        if (status === AuthHttpRequestFetch.config.invalidClaimStatusCode) {
                            await onInvalidClaimResponse({
                                data: JSON.parse(xhr.responseText)
                            });
                        }
                        let antiCsrfToken = xhr.getResponseHeader("anti-csrf");
                        if (antiCsrfToken) {
                            let tok = await getIdRefreshToken(true);
                            if (tok.status === "EXISTS") {
                                logDebugMessage("XHRInterceptor.handleResponse: Setting anti-csrf token");
                                await AntiCsrfToken.setItem(tok.token, antiCsrfToken);
                            }
                        }
                        let frontToken = xhr.getResponseHeader("front-token");
                        if (frontToken) {
                            logDebugMessage("XHRInterceptor.handleResponse: Setting sFrontToken: " + frontToken);
                            await FrontToken.setItem(frontToken);
                        }
                    }
                    return true;
                } finally {
                    logDebugMessage("XHRInterceptor.handleResponse: doFinallyCheck running");
                    if (!((await getIdRefreshToken(false)).status === "EXISTS")) {
                        logDebugMessage(
                            "XHRInterceptor.handleResponse: sIRTFrontend doesn't exist, so removing anti-csrf and sFrontToken"
                        );
                        await AntiCsrfToken.removeToken();
                        await FrontToken.removeToken();
                    }
                }
            } catch (err) {
                logDebugMessage("XHRInterceptor.handleResponse: caught error");
                if ((err as any).status !== undefined) {
                    // this is a fetch error from refresh token API failing...
                    let resp = await getXMLHttpStatusAndResponseTextFromFetchResponse(err as Response);
                    customGetterValues["status"] = resp.status;
                    customGetterValues["statusText"] = resp.statusText;
                    customGetterValues["responseType"] = resp.responseType;
                    customResponseHeaders = resp.headers;

                    if (resp.responseType === "json") {
                        try {
                            customGetterValues["response"] = JSON.parse(resp.responseText);
                        } catch {
                            customGetterValues["response"] = resp.responseText;
                        }
                    } else {
                        customGetterValues["response"] = resp.responseText;
                    }
                    customGetterValues["responseText"] = resp.responseText;
                } else {
                    // Here we only need to handle fetch related errors, from the refresh endpoint called by the retry
                    // So we should only get network level errors here
                    let event = new Event("error");
                    eventTarget.dispatchEvent(event);
                }
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
                    logDebugMessage("XHRInterceptor.open: Trying shouldDoInterceptionBasedOnUrl with location.origin");
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

            // here we use the apply syntax cause there are other optional args that
            // can be passed by the user.
            actual.open.apply(actual, args);
        };

        self.send = function(body) {
            sendXHR(actual, body);
        };

        self.setRequestHeader = function(name: string, value: string) {
            if (doNotDoInterception) {
                actual.setRequestHeader(name, value);
                return;
            }
            // We need to do this, because if there is another interceptor wrapping this (e.g.: the axios interceptor)
            // then the anti-csrf token they add would be concatenated to the anti-csrf token added by this interceptor
            if (name === "anti-csrf") {
                return;
            }
            listOfFunctionCallsInProxy.push((xhr: XMLHttpRequestType) => {
                xhr.setRequestHeader(name, value);
            });
            // The original version "combines" headers according to MDN.
            requestHeaders.push({ name, value });
            actual.setRequestHeader(name, value);
        };

        let copiedProps: string[] | undefined = undefined;
        setUpXHR(self, actual, false);

        function setUpXHR(self: XMLHttpRequestType, xhr: XMLHttpRequestType, isRetry: boolean) {
            let responseProcessed: Promise<boolean> | undefined;
            const delayedEvents = ["load", "loadend", "readystatechange"];
            const xhrEvents = [
                "readystatechange",
                "abort",
                "error",
                "load",
                "loadend",
                "loadstart",
                "progress",
                "timeout"
            ];
            for (const name of xhrEvents) {
                xhr.addEventListener(name, (ev: any) => {
                    if (!delayedEvents.includes(name)) {
                        redispatchEvent(ev);
                    }
                });
            }

            xhr.onload = function(this: XMLHttpRequestType, ev: ProgressEvent<EventTarget>) {
                if (responseProcessed === undefined) {
                    responseProcessed = handleResponse(xhr);
                }
                responseProcessed.then(callself => {
                    if (!callself) {
                        return;
                    }
                    if (self.onload) {
                        self.onload(ev);
                    }
                    redispatchEvent(ev);
                });
            };

            xhr.onreadystatechange = function(ev: Event) {
                // In local files, status is 0 upon success in Mozilla Firefox
                if (xhr.readyState === XMLHttpRequest.DONE) {
                    if (responseProcessed === undefined) {
                        responseProcessed = handleResponse(xhr);
                    }
                    responseProcessed.then(callself => {
                        if (!callself) {
                            return;
                        }
                        if (self.onreadystatechange) self.onreadystatechange(ev);
                        redispatchEvent(ev);
                    });
                } else {
                    if (self.onreadystatechange) {
                        self.onreadystatechange(ev);
                    }
                    redispatchEvent(ev);
                }
            };

            xhr.onloadend = function(ev: ProgressEvent<EventTarget>) {
                if (responseProcessed === undefined) {
                    responseProcessed = handleResponse(xhr);
                }
                responseProcessed.then(callself => {
                    if (!callself) {
                        return;
                    }
                    if (self.onloadend) {
                        self.onloadend(ev);
                    }
                    redispatchEvent(ev);
                });
            };

            self.getAllResponseHeaders = function() {
                let headersString: string;
                if (customResponseHeaders) {
                    headersString = "";
                    customResponseHeaders.forEach((v, k) => (headersString += `${k}: ${v}\r\n`));
                } else {
                    headersString = xhr.getAllResponseHeaders();
                }
                // We use this "fake-header" to signal other interceptors (axios) that this is done
                // in case both is applied
                return headersString + "x-supertokens-xhr-intercepted: true\r\n";
            };

            self.getResponseHeader = function(name: string) {
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
                for (const prop in xhr) {
                    // skip properties we already have - this will skip both the above defined properties
                    // that we don't want to proxy and skip properties on the prototype belonging to Object
                    if (!(prop in self)) {
                        // We save these props into an array - in case we need to set up a retry XHR
                        copiedProps.push(prop);
                    }
                }
            }

            for (const prop of copiedProps) {
                if (typeof xhr[prop] === "function") {
                    // define our own property that calls the same method on the actual
                    Object.defineProperty(self, prop, {
                        configurable: true,
                        value: function() {
                            let args = arguments;
                            if (!isRetry) {
                                listOfFunctionCallsInProxy.push((xhr: XMLHttpRequestType) => {
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
                                listOfFunctionCallsInProxy.push((xhr: XMLHttpRequestType) => {
                                    xhr[prop] = val;
                                });
                            }
                            xhr[prop] = val;
                        }
                    });
                }
            }
        }

        function sendXHR(xhr: XMLHttpRequestType, body: Document | XMLHttpRequestBodyInit | null | undefined) {
            logDebugMessage("XHRInterceptor.send: called");

            logDebugMessage("XHRInterceptor.send: Value of doNotDoInterception: " + doNotDoInterception);
            if (doNotDoInterception) {
                logDebugMessage("XHRInterceptor.send: Returning without interception");
                return xhr.send(body);
            }
            logDebugMessage("XHRInterceptor.send: Interception started");

            ProcessState.getInstance().addState(PROCESS_STATE.CALLING_INTERCEPTION_REQUEST);

            (async function() {
                preRequestIdToken = await getIdRefreshToken(true);

                if (preRequestIdToken.status === "EXISTS") {
                    const antiCsrfToken = await AntiCsrfToken.getToken(preRequestIdToken.token);
                    if (antiCsrfToken !== undefined) {
                        logDebugMessage("XHRInterceptor.send: Adding anti-csrf token to request");
                        xhr.setRequestHeader("anti-csrf", antiCsrfToken);
                    }
                }

                if (AuthHttpRequestFetch.config.autoAddCredentials) {
                    logDebugMessage("XHRInterceptor.send: Adding credentials include");
                    self.withCredentials = true;
                }

                if (!requestHeaders.some(i => i.name === "rid")) {
                    logDebugMessage("XHRInterceptor.send: Adding rid header: anti-csrf");
                    xhr.setRequestHeader("rid", "anti-csrf");
                } else {
                    logDebugMessage("XHRInterceptor.send: rid header was already there in request");
                }

                logDebugMessage("XHRInterceptor.send: Making user's http call");
                return xhr.send(body);
            })();
        }
    } as any;

    (XMLHttpRequest as any).__original = oldXMLHttpRequest;
}

async function getXMLHttpStatusAndResponseTextFromFetchResponse(
    response: Response
): Promise<{
    status: number;
    responseText: string;
    statusText: string;
    responseType: XMLHttpRequestResponseType;
    headers: Headers;
}> {
    const contentType = response.headers.get("content-type");

    let data = "";
    let responseType: XMLHttpRequestResponseType = "text";
    if (contentType === null) {
        try {
            data = await response.text();
        } catch {
            data = "";
        }
    } else if (contentType.includes("application/json")) {
        responseType = "json";
        data = JSON.stringify(await response.json());
    } else if (contentType.includes("text/")) {
        data = await response.text();
    }

    return {
        status: response.status,
        responseText: data,
        statusText: response.statusText,
        responseType,
        headers: response.headers
    };
}
