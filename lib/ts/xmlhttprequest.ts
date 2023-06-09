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
    FrontToken,
    onUnauthorisedResponse,
    onInvalidClaimResponse,
    setToken,
    getTokenForHeaderAuth,
    getLocalSessionState,
    LocalSessionState,
    fireSessionUpdateEventsIfNecessary
} from "./fetch";
import { logDebugMessage } from "./logger";
import WindowHandlerReference from "./utils/windowHandler";
import { PROCESS_STATE, ProcessState } from "./processState";

type XMLHttpRequestType = typeof XMLHttpRequest.prototype & { [key: string]: any };
type XHREventListener<K extends keyof XMLHttpRequestEventMap> = (
    this: XMLHttpRequestType,
    ev: XMLHttpRequestEventMap[K]
) => void;
const XHR_EVENTS = [
    "readystatechange",
    "abort",
    "error",
    "load",
    "loadend",
    "loadstart",
    "progress",
    "timeout"
] as const;

export function addInterceptorsToXMLHttpRequest() {
    if (typeof XMLHttpRequest === "undefined") {
        return;
    }

    const firstEventLoopDone = new Promise(res => setTimeout(res, 0));

    const oldXMLHttpRequest = XMLHttpRequest;
    logDebugMessage("addInterceptorsToXMLHttpRequest called");

    // create XMLHttpRequest proxy object

    // define constructor for my proxy object
    XMLHttpRequest = function (this: XMLHttpRequestType) {
        const actual: XMLHttpRequestType = new oldXMLHttpRequest();
        let delayedQueue = firstEventLoopDone;
        function delayIfNecessary(cb: () => void | Promise<void>) {
            delayedQueue = delayedQueue.finally(() => cb()?.catch(console.error));
        }

        const self = this;
        const listOfFunctionCallsInProxy: { (xhr: XMLHttpRequestType): void }[] = [];

        const requestHeaders: { name: string; value: string }[] = [];
        const customGetterValues: { [key: string]: any } = {};
        let customResponseHeaders: Headers | undefined;

        const eventHandlers: Map<keyof XMLHttpRequestEventMap, Set<XHREventListener<any>>> = new Map();

        // We define these during open
        // let method: string = "";
        let url: string | URL = "";
        let doNotDoInterception = false;
        let preRequestLSS: LocalSessionState | undefined = undefined;
        let body: Document | XMLHttpRequestBodyInit | null | undefined;

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
        self.addEventListener = <K extends keyof XMLHttpRequestEventMap>(
            type: K,
            listener: (this: XMLHttpRequestType, ev: XMLHttpRequestEventMap[K]) => void,
            _options: any
        ) => {
            let handlers = eventHandlers.get(type);
            if (handlers === undefined) {
                handlers = new Set();
                eventHandlers.set(type, handlers);
            }
            handlers.add(listener);
        };

        self.removeEventListener = <K extends keyof XMLHttpRequestEventMap>(type: K, listener: XHREventListener<K>) => {
            let handlers = eventHandlers.get(type);
            if (handlers === undefined) {
                handlers = new Set();
                eventHandlers.set(type, handlers);
            }
            handlers.delete(listener);
        };

        function redispatchEvent(name: keyof XMLHttpRequestEventMap, ev: Event) {
            const handlers = eventHandlers.get(name);

            logDebugMessage(`XHRInterceptor dispatching ${ev.type} to ${handlers ? handlers.size : 0} listeners`);
            if (handlers) {
                Array.from(handlers).forEach(handler => handler.apply(self, [ev]));
            }
        }

        async function handleRetryPostRefreshing(): Promise<boolean> {
            if (preRequestLSS === undefined) {
                throw new Error("Should never come here..");
            }
            logDebugMessage("XHRInterceptor.handleRetryPostRefreshing: preRequestLSS " + preRequestLSS.status);
            const refreshResult = await onUnauthorisedResponse(preRequestLSS);
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
                    const headers = getResponseHeadersFromXHR(xhr);

                    await saveTokensFromHeaders(headers);

                    fireSessionUpdateEventsIfNecessary(
                        preRequestLSS!.status === "EXISTS",
                        status,
                        headers.get("front-token")
                    );
                    if (status === AuthHttpRequestFetch.config.sessionExpiredStatusCode) {
                        logDebugMessage("responseInterceptor: Status code is: " + status);
                        return await handleRetryPostRefreshing();
                    } else {
                        if (status === AuthHttpRequestFetch.config.invalidClaimStatusCode) {
                            await onInvalidClaimResponse({
                                data: JSON.parse(xhr.responseText)
                            });
                        }
                    }
                    return true;
                } finally {
                    logDebugMessage("XHRInterceptor.handleResponse: doFinallyCheck running");
                    if (!((await getLocalSessionState(false)).status === "EXISTS")) {
                        logDebugMessage(
                            "XHRInterceptor.handleResponse: local session doesn't exist, so removing anti-csrf and sFrontToken"
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
                    redispatchEvent("error", new Event("error"));
                }
                return true;
            }
        }

        self.open = function (_: string, u: string | URL) {
            logDebugMessage(`XHRInterceptor.open called`);
            let args: any = arguments;
            // method = m;
            url = u;
            try {
                doNotDoInterception =
                    (typeof url === "string" &&
                        !shouldDoInterceptionBasedOnUrl(
                            url,
                            AuthHttpRequestFetch.config.apiDomain,
                            AuthHttpRequestFetch.config.sessionTokenBackendDomain
                        )) ||
                    (typeof url !== "string" &&
                        !shouldDoInterceptionBasedOnUrl(
                            url.toString(),
                            AuthHttpRequestFetch.config.apiDomain,
                            AuthHttpRequestFetch.config.sessionTokenBackendDomain
                        ));
            } catch (err) {
                if ((err as any).message === "Please provide a valid domain name") {
                    logDebugMessage("XHRInterceptor.open: Trying shouldDoInterceptionBasedOnUrl with location.origin");
                    // .origin gives the port as well..
                    doNotDoInterception = !shouldDoInterceptionBasedOnUrl(
                        WindowHandlerReference.getReferenceOrThrow().windowHandler.location.getOrigin(),
                        AuthHttpRequestFetch.config.apiDomain,
                        AuthHttpRequestFetch.config.sessionTokenBackendDomain
                    );
                } else {
                    throw err;
                }
            }
            delayIfNecessary(() => {
                listOfFunctionCallsInProxy.push((xhr: XMLHttpRequestType) => {
                    xhr.open.apply(xhr, args);
                });

                // here we use the apply syntax cause there are other optional args that
                // can be passed by the user.
                actual.open.apply(actual, args);
            });
        };

        self.send = function (inputBody) {
            body = inputBody;
            sendXHR(actual, body);
        };

        self.setRequestHeader = function (name: string, value: string) {
            logDebugMessage(`XHRInterceptor.setRequestHeader: Called with ${name}`);
            if (doNotDoInterception) {
                delayIfNecessary(() => actual.setRequestHeader(name, value));
                return;
            }
            // We need to do this, because if there is another interceptor wrapping this (e.g.: the axios interceptor)
            // then the anti-csrf token they add would be concatenated to the anti-csrf token added by this interceptor
            if (name === "anti-csrf") {
                return;
            }
            delayIfNecessary(async () => {
                if (name.toLowerCase() === "authorization") {
                    logDebugMessage(
                        "XHRInterceptor.setRequestHeader: checking if user provided auth header matches local token"
                    );
                    const accessToken = await getTokenForHeaderAuth("access");
                    if (value === `Bearer ${accessToken}`) {
                        // We are ignoring the Authorization header set by the user in this case, because it would cause issues
                        // If we do not ignore this, then this header would be used even if the request is being retried after a refresh, even though it contains an outdated access token.
                        // This causes an infinite refresh loop.
                        logDebugMessage(
                            "XHRInterceptor.setRequestHeader: skipping Authorization from user provided headers because it contains our access token"
                        );
                        return;
                    }
                }
                listOfFunctionCallsInProxy.push((xhr: XMLHttpRequestType) => {
                    xhr.setRequestHeader(name, value);
                });
                // The original version "combines" headers according to MDN.
                requestHeaders.push({ name, value });
                actual.setRequestHeader(name, value);
            });
        };

        let copiedProps: string[] | undefined = undefined;
        setUpXHR(self, actual, false);

        function setUpXHR(self: XMLHttpRequestType, xhr: XMLHttpRequestType, isRetry: boolean) {
            let responseProcessed: Promise<boolean> | undefined;
            const delayedEvents = ["load", "loadend", "readystatechange"];
            logDebugMessage(`XHRInterceptor.setUpXHR called`);

            for (const name of XHR_EVENTS) {
                logDebugMessage(`XHRInterceptor added listener for event ${name}`);
                xhr.addEventListener(name, (ev: any) => {
                    logDebugMessage(`XHRInterceptor got event ${name}`);

                    if (!delayedEvents.includes(name)) {
                        redispatchEvent(name, ev);
                    }
                });
            }

            xhr.onload = function (this: XMLHttpRequestType, ev: ProgressEvent<EventTarget>) {
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
                    redispatchEvent("load", ev);
                });
            };

            xhr.onreadystatechange = function (ev: Event) {
                // In local files, status is 0 upon success in Mozilla Firefox
                if (xhr.readyState === oldXMLHttpRequest.DONE) {
                    if (responseProcessed === undefined) {
                        responseProcessed = handleResponse(xhr);
                    }
                    responseProcessed.then(callself => {
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

            xhr.onloadend = function (ev: ProgressEvent<EventTarget>) {
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
                    redispatchEvent("loadend", ev);
                });
            };

            self.getAllResponseHeaders = function () {
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

            self.getResponseHeader = function (name: string) {
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
                        value: function () {
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
                        get: function () {
                            if (customGetterValues[prop] !== undefined) {
                                return customGetterValues[prop];
                            }
                            return xhr[prop];
                        },
                        set: function (val) {
                            if (!isRetry) {
                                listOfFunctionCallsInProxy.push((xhr: XMLHttpRequestType) => {
                                    xhr[prop] = val;
                                });
                            }
                            logDebugMessage(`XHRInterceptor.set[${prop}] = ${val}`);
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
                delayIfNecessary(() => xhr.send(body));
                return;
            }
            logDebugMessage("XHRInterceptor.send: Interception started");

            ProcessState.getInstance().addState(PROCESS_STATE.CALLING_INTERCEPTION_REQUEST);

            delayIfNecessary(async () => {
                preRequestLSS = await getLocalSessionState(true);

                if (preRequestLSS.status === "EXISTS") {
                    const antiCsrfToken = await AntiCsrfToken.getToken(preRequestLSS.lastAccessTokenUpdate);
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

                const transferMethod = AuthHttpRequestFetch.config.tokenTransferMethod;
                if (!requestHeaders.some(i => i.name === "st-auth-mode")) {
                    logDebugMessage("XHRInterceptor.send: Adding st-auth-mode header: " + transferMethod);
                    xhr.setRequestHeader("st-auth-mode", transferMethod);
                } else {
                    logDebugMessage("XHRInterceptor.send: st-auth-mode header was already there in request");
                }

                await setAuthorizationHeaderIfRequired(xhr, requestHeaders);

                logDebugMessage("XHRInterceptor.send: Making user's http call");
                return xhr.send(body);
            });
        }
    } as any;

    // This can be used by other interceptors (axios) to detect if this interceptor has been added or not
    (XMLHttpRequest as any).__interceptedBySuperTokens = true;
    (XMLHttpRequest as any).__original = oldXMLHttpRequest;
}

async function getXMLHttpStatusAndResponseTextFromFetchResponse(response: Response): Promise<{
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

async function setAuthorizationHeaderIfRequired(
    xhr: XMLHttpRequestType,
    requestHeaders: { name: string; value: string }[]
) {
    logDebugMessage("setAuthorizationHeaderIfRequired: adding existing tokens as header");

    // We set the Authorization header even if the tokenTransferMethod preference set in the config is cookies
    // since the active session may be using cookies. By default, we want to allow users to continue these sessions.
    // The new session preference should be applied at the start of the next session, if the backend allows it.

    const accessToken = await getTokenForHeaderAuth("access");
    const refreshToken = await getTokenForHeaderAuth("refresh");

    // We don't add the refresh token because that's only required by the refresh call which is done with fetch
    // Still, we only add the Authorization header if both are present, because we are planning to add an option to expose the
    // access token to the frontend while using cookie based auth - so that users can get the access token to use
    if (accessToken !== undefined && refreshToken !== undefined) {
        if (requestHeaders.some(({ name }) => name.toLowerCase() === "authorization")) {
            logDebugMessage("setAuthorizationHeaderIfRequired: Authorization header defined by the user, not adding");
        } else {
            if (accessToken !== undefined) {
                logDebugMessage("setAuthorizationHeaderIfRequired: added authorization header");
                xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);
            }
            // We don't add the refresh token because that's only required by the refresh call which is done with fetch
        }
    } else {
        logDebugMessage("setAuthorizationHeaderIfRequired: token for header based auth not found");
    }
}

async function saveTokensFromHeaders(headers: Headers) {
    logDebugMessage("saveTokensFromHeaders: Saving updated tokens from the response");

    const refreshToken = headers.get("st-refresh-token");
    if (refreshToken !== null) {
        logDebugMessage("saveTokensFromHeaders: saving new refresh token");
        await setToken("refresh", refreshToken);
    }

    const accessToken = headers.get("st-access-token");
    if (accessToken !== null) {
        logDebugMessage("saveTokensFromHeaders: saving new access token");
        await setToken("access", accessToken);
    }

    const frontToken = headers.get("front-token");
    if (frontToken !== null) {
        logDebugMessage("saveTokensFromHeaders: Setting sFrontToken: " + frontToken);
        await FrontToken.setItem(frontToken);
    }

    const antiCsrfToken = headers.get("anti-csrf");
    if (antiCsrfToken !== null) {
        const tok = await getLocalSessionState(true);
        if (tok.status === "EXISTS") {
            logDebugMessage("saveTokensFromHeaders: Setting anti-csrf token");
            await AntiCsrfToken.setItem(tok.lastAccessTokenUpdate, antiCsrfToken);
        }
    }
}

function getResponseHeadersFromXHR(xhr: XMLHttpRequestType) {
    return new Headers(
        xhr
            .getAllResponseHeaders()
            .split("\r\n")
            .map(line => {
                const sep = line.indexOf(": ");
                if (sep === -1) {
                    return ["", ""] as [string, string];
                }
                return [line.slice(0, sep), line.slice(sep + 2)] as [string, string];
            })
            .filter(e => e[0].length !== 0)
    );
}
