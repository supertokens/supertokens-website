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
        let customGetterValues: { [key: string]: any } = {};

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

        async function handleRetryPostRefreshing(): Promise<boolean> {
            if (preRequestIdToken === undefined) {
                throw new Error("Should never come here..");
            }
            const refreshResult = await onUnauthorisedResponse(preRequestIdToken);
            if (refreshResult.result !== "RETRY") {
                logDebugMessage("handleRetryPostRefreshing: Not retrying original request");
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
            logDebugMessage("handleRetryPostRefreshing: Retrying original request");
            // We need to create a new XHR with the same thing as the older one
            let retryXhr = new XMLHttpRequest();

            // TODO: copy over all things just like it's done for actual
            Object.defineProperty(self, "status", {
                get: function() {
                    return retryXhr["status"];
                }
            });

            Object.defineProperty(self, "responseText", {
                get: function() {
                    return retryXhr["responseText"];
                }
            });

            if (self["onload"]) {
                retryXhr.onload = function(this: XMLHttpRequestType, ev: ProgressEvent<EventTarget>) {
                    if (!self["onload"]) {
                        return;
                    }
                    self.onload(ev);
                };
            }
            if (self["onreadystatechange"]) {
                retryXhr.onreadystatechange = function(ev: Event) {
                    if (!self["onreadystatechange"]) {
                        return;
                    }
                    self.onreadystatechange(ev);
                };
            }
            if (self["onloadend"]) {
                retryXhr.onloadend = function(ev: ProgressEvent<EventTarget>) {
                    if (!self["onloadend"]) {
                        return;
                    }
                    self.onloadend(ev);
                };
            }

            // this also calls the send function with the appropriate body
            listOfFunctionCallsInProxy.forEach(i => {
                i(retryXhr);
            });

            return false;
        }

        async function handleResponse(xhr: XMLHttpRequestType): Promise<boolean> {
            if (doNotDoInterception) {
                logDebugMessage("handleResponse: Returning without interception");
                return true;
            }
            try {
                let doFinallyCheck = true;
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
                        return await handleRetryPostRefreshing();
                    } else if (status < 400) {
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
                    } else {
                        // we set this to false so that the finally
                        // block below doesn't bother with checking for session related
                        // things - cause the original API has returned a > 400 status code that is
                        // not session expired, and nor is invalid claim.
                        doFinallyCheck = false;
                    }
                    return true;
                } finally {
                    if (doFinallyCheck) {
                        if (!((await getIdRefreshToken(true)).status === "EXISTS")) {
                            logDebugMessage(
                                "handleResponse: sIRTFrontend doesn't exist, so removing anti-csrf and sFrontToken"
                            );
                            await AntiCsrfToken.removeToken();
                            await FrontToken.removeToken();
                        }
                    }
                }
            } catch (err) {
                if ((err as any).status !== undefined) {
                    // this is a fetch error from refresh token API failing...
                    let resp = await getXMLHttpStatusAndResponseTextFromFetchResponse(err as Response);
                    customGetterValues["status"] = resp.status;
                    customGetterValues["responseText"] = resp.responseText;
                    customGetterValues["statusText"] = resp.statusText;
                    customGetterValues["responseType"] = resp.responseType;
                } else {
                    // TODO:... this part needs to be properly thought about..
                    // there are couple of events here we can use:
                    // - error -> called for network level issues..
                    // - timeout
                    // - abort
                    let event = new Event("error");
                    xhr.dispatchEvent(event);
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
            // here we use the apply syntax cause there are other optional args that
            // can be passed by the user.
            actual.open.apply(actual, args);
        };

        self.send = function(body) {
            listOfFunctionCallsInProxy.push((xhr: XMLHttpRequestType) => {
                xhr.send(body);
            });
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
                        actual.setRequestHeader("anti-csrf", antiCsrfToken);
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
                    actual.setRequestHeader("rid", "anti-csrf");
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
            // TODO: If this is called twice on the same key, is the older version
            // removed or is the newer value just appended..
            if (
                requestHeaders.some(i => {
                    return i.name === name;
                })
            ) {
                requestHeaders = requestHeaders.filter(i => {
                    return i.name !== name;
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
                            configurable: true,
                            get: function() {
                                if (customGetterValues[prop] !== undefined) {
                                    console.log("customGetterValues", prop);
                                    return customGetterValues[prop];
                                }
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

async function getXMLHttpStatusAndResponseTextFromFetchResponse(
    response: Response
): Promise<{
    status: number;
    responseText: string;
    statusText: string;
    responseType: XMLHttpRequestResponseType;
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
    // TODO: in this function for axios, we had also handled blog type - should
    // we handle that here as well?

    // TODO: We also need to set the right response headers.
    return {
        status: response.status,
        responseText: data,
        statusText: response.statusText,
        responseType
    };
}
