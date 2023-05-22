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
import { PROCESS_STATE, ProcessState } from "./processState";
import { supported_fdi } from "./version";
import { shouldDoInterceptionBasedOnUrl } from "./utils";
import { RecipeInterface, NormalisedInputType, ResponseWithBody, TokenType } from "./types";
import CookieHandlerReference from "./utils/cookieHandler";
import WindowHandlerReference from "./utils/windowHandler";
import LockFactoryReference from "./utils/lockFactory";
import { logDebugMessage } from "./logger";

export class AntiCsrfToken {
    private static tokenInfo:
        | undefined
        | {
              antiCsrf: string;
              associatedAccessTokenUpdate: string;
          };

    private constructor() {}

    static async getToken(associatedAccessTokenUpdate: string | undefined): Promise<string | undefined> {
        logDebugMessage("AntiCsrfToken.getToken: called");
        if (associatedAccessTokenUpdate === undefined) {
            AntiCsrfToken.tokenInfo = undefined;
            logDebugMessage("AntiCsrfToken.getToken: returning undefined");
            return undefined;
        }
        if (AntiCsrfToken.tokenInfo === undefined) {
            let antiCsrf = await getAntiCSRFToken();
            if (antiCsrf === null) {
                logDebugMessage("AntiCsrfToken.getToken: returning undefined");
                return undefined;
            }
            AntiCsrfToken.tokenInfo = {
                antiCsrf,
                associatedAccessTokenUpdate
            };
        } else if (AntiCsrfToken.tokenInfo.associatedAccessTokenUpdate !== associatedAccessTokenUpdate) {
            // csrf token has changed.
            AntiCsrfToken.tokenInfo = undefined;
            return await AntiCsrfToken.getToken(associatedAccessTokenUpdate);
        }
        logDebugMessage("AntiCsrfToken.getToken: returning: " + AntiCsrfToken.tokenInfo.antiCsrf);
        return AntiCsrfToken.tokenInfo.antiCsrf;
    }

    static async removeToken() {
        logDebugMessage("AntiCsrfToken.removeToken: called");
        AntiCsrfToken.tokenInfo = undefined;
        await setAntiCSRF(undefined);
    }

    static async setItem(associatedAccessTokenUpdate: string | undefined, antiCsrf: string) {
        if (associatedAccessTokenUpdate === undefined) {
            AntiCsrfToken.tokenInfo = undefined;
            return;
        }
        logDebugMessage("AntiCsrfToken.setItem: called");
        await setAntiCSRF(antiCsrf);
        AntiCsrfToken.tokenInfo = {
            antiCsrf,
            associatedAccessTokenUpdate
        };
    }
}

// Note: We do not store this in memory because another tab may have
// modified this value, and if so, we may not know about it in this tab
export class FrontToken {
    // these are waiters for when the idRefreshToken has been set, but this token has
    // not yet been set. Once this token is set or removed, the waiters are resolved.
    private static waiters: ((value: unknown) => void)[] = [];

    private constructor() {}

    static async getTokenInfo(): Promise<
        | {
              uid: string;
              ate: number;
              up: any;
          }
        | undefined
    > {
        logDebugMessage("FrontToken.getTokenInfo: called");
        let frontToken = await getFrontToken();
        if (frontToken === null) {
            if ((await getLocalSessionState(false)).status === "EXISTS") {
                // this means that the id refresh token has been set, so we must
                // wait for this to be set or removed
                await new Promise(resolve => {
                    FrontToken.waiters.push(resolve);
                });
                return FrontToken.getTokenInfo();
            } else {
                return undefined;
            }
        }
        let response = parseFrontToken(frontToken);
        logDebugMessage("FrontToken.getTokenInfo: returning ate: " + response.ate);
        logDebugMessage("FrontToken.getTokenInfo: returning uid: " + response.uid);
        logDebugMessage("FrontToken.getTokenInfo: returning up: " + response.up);
        return response;
    }

    static async removeToken() {
        logDebugMessage("FrontToken.removeToken: called");
        await setFrontToken(undefined);
        // We are clearing all stored tokens here, because:
        // 1. removing FrontToken signals that the session is being cleared
        // 2. you can only have a single active session - this means that all tokens can be cleared from all auth-modes if one is being cleared
        // 3. some proxies remove the empty headers used to clear the other tokens (i.e.: https://github.com/supertokens/supertokens-website/issues/218)
        await setToken("access", "");
        await setToken("refresh", "");
        FrontToken.waiters.forEach(f => f(undefined));
        FrontToken.waiters = [];
    }

    static async setItem(frontToken: string) {
        // We update the refresh attempt info here as well, since this means that we've updated the session in some way
        // This could be both by a refresh call or if the access token was updated in a custom endpoint
        // By saving every time the access token has been updated, we cause an early retry if
        // another request has failed with a 401 with the previous access token and the token still exists.
        // Check the start and end of onUnauthorisedResponse
        // As a side-effect we reload the anti-csrf token to check if it was changed by another tab.
        await saveLastAccessTokenUpdate();

        if (frontToken === "remove") {
            return FrontToken.removeToken();
        }

        logDebugMessage("FrontToken.setItem: called");
        await setFrontToken(frontToken);
        FrontToken.waiters.forEach(f => f(undefined));
        FrontToken.waiters = [];
    }

    static async doesTokenExists() {
        const frontToken = await getFrontTokenFromCookie();
        return frontToken !== null;
    }
}

/**
 * @class AuthHttpRequest
 * @description wrapper for common http methods.
 */
export default class AuthHttpRequest {
    static refreshTokenUrl: string;
    static signOutUrl: string;
    static initCalled = false;
    static rid: string;
    static env: any;
    static recipeImpl: RecipeInterface;
    static config: NormalisedInputType;

    static init(config: NormalisedInputType, recipeImpl: RecipeInterface) {
        logDebugMessage("init: called");
        logDebugMessage("init: Input apiBasePath: " + config.apiBasePath);
        logDebugMessage("init: Input apiDomain: " + config.apiDomain);
        logDebugMessage("init: Input autoAddCredentials: " + config.autoAddCredentials);
        logDebugMessage("init: Input sessionTokenBackendDomain: " + config.sessionTokenBackendDomain);
        logDebugMessage("init: Input isInIframe: " + config.isInIframe);
        logDebugMessage("init: Input sessionExpiredStatusCode: " + config.sessionExpiredStatusCode);
        logDebugMessage("init: Input sessionTokenFrontendDomain: " + config.sessionTokenFrontendDomain);
        logDebugMessage("init: Input tokenTransferMethod: " + config.tokenTransferMethod);

        const fetchedWindow = WindowHandlerReference.getReferenceOrThrow().windowHandler.getWindowUnsafe();
        AuthHttpRequest.env = fetchedWindow === undefined || fetchedWindow.fetch === undefined ? global : fetchedWindow;

        AuthHttpRequest.refreshTokenUrl = config.apiDomain + config.apiBasePath + "/session/refresh";
        AuthHttpRequest.signOutUrl = config.apiDomain + config.apiBasePath + "/signout";
        AuthHttpRequest.rid = "session";
        AuthHttpRequest.config = config;

        if (AuthHttpRequest.env.__supertokensOriginalFetch === undefined) {
            logDebugMessage("init: __supertokensOriginalFetch is undefined");
            // this block contains code that is run just once per page load..
            // all items in this block are attached to the global env so that
            // even if the init function is called more than once (maybe across JS scripts),
            // things will not get created multiple times.
            AuthHttpRequest.env.__supertokensOriginalFetch = AuthHttpRequest.env.fetch.bind(AuthHttpRequest.env);
            AuthHttpRequest.env.__supertokensSessionRecipe = recipeImpl;
            AuthHttpRequest.env.fetch = (
                AuthHttpRequest.env.__supertokensSessionRecipe as RecipeInterface
            ).addFetchInterceptorsAndReturnModifiedFetch({
                originalFetch: AuthHttpRequest.env.__supertokensOriginalFetch,
                userContext: {}
            });
            (AuthHttpRequest.env.__supertokensSessionRecipe as RecipeInterface).addXMLHttpRequestInterceptor({
                userContext: {}
            });
        }
        AuthHttpRequest.recipeImpl = AuthHttpRequest.env.__supertokensSessionRecipe;
        AuthHttpRequest.initCalled = true;
    }

    static doRequest = async (
        httpCall: (config?: RequestInit) => Promise<Response>,
        config?: RequestInit,
        url?: any
    ): Promise<Response> => {
        if (!AuthHttpRequest.initCalled) {
            throw Error("init function not called");
        }

        logDebugMessage("doRequest: start of fetch interception");
        let doNotDoInterception = false;
        try {
            let finalURL;
            if (typeof url === "string") {
                finalURL = url;
            } else if (typeof url === "object") {
                if (typeof url.url === "string") {
                    finalURL = url.url;
                } else if (typeof url.href === "string") {
                    finalURL = url.href;
                }
            }
            doNotDoInterception = !shouldDoInterceptionBasedOnUrl(
                finalURL,
                AuthHttpRequest.config.apiDomain,
                AuthHttpRequest.config.sessionTokenBackendDomain
            );
        } catch (err) {
            if ((err as any).message === "Please provide a valid domain name") {
                logDebugMessage("doRequest: Trying shouldDoInterceptionBasedOnUrl with location.origin");
                // .origin gives the port as well..
                doNotDoInterception = !shouldDoInterceptionBasedOnUrl(
                    WindowHandlerReference.getReferenceOrThrow().windowHandler.location.getOrigin(),
                    AuthHttpRequest.config.apiDomain,
                    AuthHttpRequest.config.sessionTokenBackendDomain
                );
            } else {
                throw err;
            }
        }

        logDebugMessage("doRequest: Value of doNotDoInterception: " + doNotDoInterception);
        if (doNotDoInterception) {
            logDebugMessage("doRequest: Returning without interception");
            return await httpCall(config);
        }

        const origHeaders = new Headers(
            config !== undefined && config.headers !== undefined ? config.headers : url.headers
        );

        if (origHeaders.has("Authorization")) {
            const accessToken = await getTokenForHeaderAuth("access");
            if (accessToken !== undefined && origHeaders.get("Authorization") === `Bearer ${accessToken}`) {
                // We are ignoring the Authorization header set by the user in this case, because it would cause issues
                // If we do not ignore this, then this header would be used even if the request is being retried after a refresh, even though it contains an outdated access token.
                // This causes an infinite refresh loop.
                logDebugMessage(
                    "doRequest: Removing Authorization from user provided headers because it contains our access token"
                );
                origHeaders.delete("Authorization");
            }
        }

        logDebugMessage("doRequest: Interception started");

        ProcessState.getInstance().addState(PROCESS_STATE.CALLING_INTERCEPTION_REQUEST);
        try {
            let returnObj = undefined;
            while (true) {
                // we read this here so that if there is a session expiry error, then we can compare this value (that caused the error) with the value after the request is sent.
                // to avoid race conditions
                const preRequestLSS = await getLocalSessionState(true);
                const clonedHeaders = new Headers(origHeaders);

                let configWithAntiCsrf: RequestInit | undefined = {
                    ...config,
                    headers: clonedHeaders
                };
                if (preRequestLSS.status === "EXISTS") {
                    const antiCsrfToken = await AntiCsrfToken.getToken(preRequestLSS.lastAccessTokenUpdate);
                    if (antiCsrfToken !== undefined) {
                        logDebugMessage("doRequest: Adding anti-csrf token to request");
                        clonedHeaders.set("anti-csrf", antiCsrfToken);
                    }
                }

                if (AuthHttpRequest.config.autoAddCredentials) {
                    logDebugMessage("doRequest: Adding credentials include");
                    if (configWithAntiCsrf === undefined) {
                        configWithAntiCsrf = {
                            credentials: "include"
                        };
                    } else if (configWithAntiCsrf.credentials === undefined) {
                        configWithAntiCsrf = {
                            ...configWithAntiCsrf,
                            credentials: "include"
                        };
                    }
                }

                // adding rid for anti-csrf protection: Anti-csrf via custom header
                if (!clonedHeaders.has("rid")) {
                    logDebugMessage("doRequest: Adding rid header: anti-csrf");
                    clonedHeaders.set("rid", "anti-csrf");
                } else {
                    logDebugMessage("doRequest: rid header was already there in request");
                }

                const transferMethod = AuthHttpRequest.config.tokenTransferMethod;
                logDebugMessage("doRequest: Adding st-auth-mode header: " + transferMethod);
                clonedHeaders.set("st-auth-mode", transferMethod);

                await setAuthorizationHeaderIfRequired(clonedHeaders);

                logDebugMessage("doRequest: Making user's http call");
                let response = await httpCall(configWithAntiCsrf);
                logDebugMessage("doRequest: User's http call ended");

                await saveTokensFromHeaders(response);

                fireSessionUpdateEventsIfNecessary(
                    preRequestLSS.status === "EXISTS",
                    response.status,
                    response.headers.get("front-token")
                );

                if (response.status === AuthHttpRequest.config.sessionExpiredStatusCode) {
                    logDebugMessage("doRequest: Status code is: " + response.status);
                    let retry = await onUnauthorisedResponse(preRequestLSS);
                    if (retry.result !== "RETRY") {
                        logDebugMessage("doRequest: Not retrying original request");
                        returnObj = retry.error !== undefined ? retry.error : response;
                        break;
                    }
                    logDebugMessage("doRequest: Retrying original request");
                } else {
                    if (response.status === AuthHttpRequest.config.invalidClaimStatusCode) {
                        await onInvalidClaimResponse(response);
                    }
                    return response;
                }
            }

            // if it comes here, means we breaked. which happens only if we have logged out.
            return returnObj;
        } finally {
            // If we get here we already tried refreshing so we should have the already id refresh token either in EXISTS or NOT_EXISTS, so no need to call the backend
            // or the backend is down and we don't need to call it.
            const postRequestIdToken = await getLocalSessionState(false);
            if (postRequestIdToken.status === "NOT_EXISTS") {
                logDebugMessage("doRequest: local session doesn't exist, so removing anti-csrf and sFrontToken");
                await AntiCsrfToken.removeToken();
                await FrontToken.removeToken();
            }
        }
    };

    static attemptRefreshingSession = async (): Promise<boolean> => {
        if (!AuthHttpRequest.initCalled) {
            throw Error("init function not called");
        }

        const preRequestLSS = await getLocalSessionState(false);
        const refresh = await onUnauthorisedResponse(preRequestLSS);

        if (refresh.result === "API_ERROR") {
            throw refresh.error;
        }

        return refresh.result === "RETRY";
    };
}

const LAST_ACCESS_TOKEN_UPDATE = "st-last-access-token-update";
const REFRESH_TOKEN_NAME = "st-refresh-token";
const ACCESS_TOKEN_NAME = "st-access-token";
const ANTI_CSRF_NAME = "sAntiCsrf";
const FRONT_TOKEN_NAME = "sFrontToken";

/**
 * @description attempts to call the refresh token API each time we are sure the session has expired, or it throws an error or,
 * or the ID_COOKIE_NAME has changed value -> which may mean that we have a new set of tokens.
 */
export async function onUnauthorisedResponse(
    preRequestLSS: LocalSessionState
): Promise<{ result: "SESSION_EXPIRED"; error?: any } | { result: "API_ERROR"; error: any } | { result: "RETRY" }> {
    let lock = await LockFactoryReference.getReferenceOrThrow().lockFactory();
    while (true) {
        logDebugMessage("onUnauthorisedResponse: trying to acquire lock");
        if (await lock.acquireLock("REFRESH_TOKEN_USE", 1000)) {
            logDebugMessage("onUnauthorisedResponse: lock acquired");
            // to sync across tabs. the 1000 ms wait is for how much time to try and acquire the lock
            try {
                let postLockLSS = await getLocalSessionState(false);
                if (postLockLSS.status === "NOT_EXISTS") {
                    logDebugMessage("onUnauthorisedResponse: Not refreshing because local session state is NOT_EXISTS");
                    // if it comes here, it means a request was made thinking
                    // that the session exists, but it doesn't actually exist.
                    AuthHttpRequest.config.onHandleEvent({
                        action: "UNAUTHORISED",
                        sessionExpiredOrRevoked: false,
                        userContext: {}
                    });
                    return { result: "SESSION_EXPIRED" };
                }
                if (
                    postLockLSS.status !== preRequestLSS.status ||
                    (postLockLSS.status === "EXISTS" &&
                        preRequestLSS.status === "EXISTS" &&
                        postLockLSS.lastAccessTokenUpdate !== preRequestLSS.lastAccessTokenUpdate)
                ) {
                    logDebugMessage(
                        "onUnauthorisedResponse: Retrying early because pre and post id refresh tokens don't match"
                    );
                    // means that some other process has already called this API and succeeded. so we need to call it again
                    return { result: "RETRY" };
                }

                const headers = new Headers();
                if (preRequestLSS.status === "EXISTS") {
                    const antiCsrfToken = await AntiCsrfToken.getToken(preRequestLSS.lastAccessTokenUpdate);
                    if (antiCsrfToken !== undefined) {
                        logDebugMessage("onUnauthorisedResponse: Adding anti-csrf token to refresh API call");
                        headers.set("anti-csrf", antiCsrfToken);
                    }
                }
                logDebugMessage("onUnauthorisedResponse: Adding rid and fdi-versions to refresh call header");
                headers.set("rid", AuthHttpRequest.rid);
                headers.set("fdi-version", supported_fdi.join(","));

                const transferMethod = AuthHttpRequest.config.tokenTransferMethod;
                logDebugMessage("onUnauthorisedResponse: Adding st-auth-mode header: " + transferMethod);
                headers.set("st-auth-mode", transferMethod);

                await setAuthorizationHeaderIfRequired(headers, true);

                logDebugMessage("onUnauthorisedResponse: Calling refresh pre API hook");
                let preAPIResult = await AuthHttpRequest.config.preAPIHook({
                    action: "REFRESH_SESSION",
                    requestInit: {
                        method: "post",
                        credentials: "include",
                        headers
                    },
                    url: AuthHttpRequest.refreshTokenUrl,
                    userContext: {}
                });
                logDebugMessage("onUnauthorisedResponse: Making refresh call");
                const response = await AuthHttpRequest.env.__supertokensOriginalFetch(
                    preAPIResult.url,
                    preAPIResult.requestInit
                );

                logDebugMessage("onUnauthorisedResponse: Refresh call ended");

                await saveTokensFromHeaders(response);

                logDebugMessage("onUnauthorisedResponse: Refresh status code is: " + response.status);

                const isUnauthorised = response.status === AuthHttpRequest.config.sessionExpiredStatusCode;

                // There is a case where the FE thinks the session is valid, but backend doesn't get the tokens.
                // In this event, session expired error will be thrown and the frontend should remove this token
                if (isUnauthorised && response.headers.get("front-token") === null) {
                    FrontToken.setItem("remove");
                }

                fireSessionUpdateEventsIfNecessary(
                    preRequestLSS.status === "EXISTS",
                    response.status,
                    isUnauthorised && response.headers.get("front-token") === null
                        ? "remove"
                        : response.headers.get("front-token")
                );
                if (response.status >= 300) {
                    throw response;
                }

                await AuthHttpRequest.config.postAPIHook({
                    action: "REFRESH_SESSION",
                    fetchResponse: (response as Response).clone(),
                    requestInit: preAPIResult.requestInit,
                    url: preAPIResult.url,
                    userContext: {}
                });

                if ((await getLocalSessionState(false)).status === "NOT_EXISTS") {
                    logDebugMessage(
                        "onUnauthorisedResponse: local session doesn't exist, so returning session expired"
                    );
                    // The execution should never come here.. but just in case.
                    // removed by server during refresh. So we logout

                    // we do not send "UNAUTHORISED" event here because
                    // this is a result of the refresh API returning a session expiry, which
                    // means that the frontend did not know for sure that the session existed
                    // in the first place.
                    return { result: "SESSION_EXPIRED" };
                }

                AuthHttpRequest.config.onHandleEvent({
                    action: "REFRESH_SESSION",
                    userContext: {}
                });
                logDebugMessage("onUnauthorisedResponse: Sending RETRY signal");
                return { result: "RETRY" };
            } catch (error) {
                if ((await getLocalSessionState(false)).status === "NOT_EXISTS") {
                    logDebugMessage(
                        "onUnauthorisedResponse: local session doesn't exist, so returning session expired"
                    );
                    // removed by server.

                    // we do not send "UNAUTHORISED" event here because
                    // this is a result of the refresh API returning a session expiry, which
                    // means that the frontend did not know for sure that the session existed
                    // in the first place.
                    return { result: "SESSION_EXPIRED", error };
                }

                logDebugMessage("onUnauthorisedResponse: sending API_ERROR");
                return { result: "API_ERROR", error };
            } finally {
                await lock.releaseLock("REFRESH_TOKEN_USE");
                logDebugMessage("onUnauthorisedResponse: Released lock");

                // we do not call doesSessionExist here cause that
                // may cause an infinite recursive loop when using in an iframe setting
                // as tokens may not get set at all.
                if ((await getLocalSessionState(false)).status === "NOT_EXISTS") {
                    logDebugMessage(
                        "onUnauthorisedResponse: local session doesn't exist, so removing anti-csrf and sFrontToken"
                    );
                    await AntiCsrfToken.removeToken();
                    await FrontToken.removeToken();
                }
            }
        }
        let postRequestLSS = await getLocalSessionState(false);
        if (postRequestLSS.status === "NOT_EXISTS") {
            logDebugMessage(
                "onUnauthorisedResponse: lock acquired failed and local session doesn't exist, so sending SESSION_EXPIRED"
            );
            // removed by server. So we logout
            return { result: "SESSION_EXPIRED" };
        } else {
            if (
                postRequestLSS.status !== preRequestLSS.status ||
                (postRequestLSS.status === "EXISTS" &&
                    preRequestLSS.status === "EXISTS" &&
                    postRequestLSS.lastAccessTokenUpdate !== preRequestLSS.lastAccessTokenUpdate)
            ) {
                logDebugMessage(
                    "onUnauthorisedResponse: lock acquired failed and retrying early because pre and post id refresh tokens don't match"
                );
                return { result: "RETRY" };
            }
            // here we try to call the API again since we probably failed to acquire lock and nothing has changed.
        }
    }
}

export function onTokenUpdate() {
    logDebugMessage("onTokenUpdate: firing ACCESS_TOKEN_PAYLOAD_UPDATED event");
    AuthHttpRequest.config.onHandleEvent({
        action: "ACCESS_TOKEN_PAYLOAD_UPDATED",
        userContext: {}
    });
}

export async function onInvalidClaimResponse(response: ResponseWithBody) {
    try {
        const claimValidationErrors = await AuthHttpRequest.recipeImpl.getInvalidClaimsFromResponse({
            response,
            userContext: {}
        });
        // This shouldn't be undefined normally, but since we can't be certain about the shape of the response object so we check it like this.
        // It could still be something else, but chance of that happening by accident is really low.
        if (claimValidationErrors) {
            AuthHttpRequest.config.onHandleEvent({
                action: "API_INVALID_CLAIM",
                claimValidationErrors: claimValidationErrors,
                userContext: {}
            });
        }
    } catch {
        // we ignore errors here, since these should only come from the user sending a custom 403 response which we do not want to handle.
    }
}

export type LocalSessionState =
    | {
          status: "NOT_EXISTS" | "MAY_EXIST";
      }
    | {
          status: "EXISTS";
          // This is a number (timestamp) encoded as a string (we save it in cookies), but we never actually need to use it as number
          // We only use it for strict equal checks
          lastAccessTokenUpdate: string;
      };

// if tryRefresh is true & this token doesn't exist, we try and refresh the session
// else we return undefined.
export async function getLocalSessionState(tryRefresh: boolean): Promise<LocalSessionState> {
    logDebugMessage("getLocalSessionState: called");

    const lastAccessTokenUpdate = await getFromCookies(LAST_ACCESS_TOKEN_UPDATE);
    const frontTokenExists = await FrontToken.doesTokenExists();
    if (frontTokenExists && lastAccessTokenUpdate !== undefined) {
        logDebugMessage(
            "getLocalSessionState: returning EXISTS since both frontToken and lastAccessTokenUpdate exists"
        );
        return { status: "EXISTS", lastAccessTokenUpdate: lastAccessTokenUpdate };
    } else if (lastAccessTokenUpdate) {
        logDebugMessage(
            "getLocalSessionState: returning NOT_EXISTS since frontToken was cleared but lastAccessTokenUpdate exists"
        );
        return { status: "NOT_EXISTS" };
    } else {
        let response: LocalSessionState = {
            status: "MAY_EXIST"
        };
        if (tryRefresh) {
            logDebugMessage("getLocalSessionState: trying to refresh");
            // either session doesn't exist, or the frontend cookies have expired
            // privacy feature in Safari that caps lifetime of frontend cookies to 7 days
            const res = await onUnauthorisedResponse(response);
            if (res.result !== "RETRY") {
                logDebugMessage("getLocalSessionState: return NOT_EXISTS in case error from backend" + res.result);
                // in case the backend is not working, we treat it as the session not existing...
                return {
                    status: "NOT_EXISTS"
                };
            }
            logDebugMessage("getLocalSessionState: Retrying post refresh");
            return await getLocalSessionState(tryRefresh);
        } else {
            logDebugMessage("getLocalSessionState: returning: " + response.status);
            return response;
        }
    }
}

export function getStorageNameForToken(tokenType: TokenType) {
    switch (tokenType) {
        case "access":
            return ACCESS_TOKEN_NAME;
        case "refresh":
            return REFRESH_TOKEN_NAME;
    }
}

export function setToken(tokenType: TokenType, value: string) {
    const name = getStorageNameForToken(tokenType);

    if (value !== "") {
        logDebugMessage(`setToken: saved ${tokenType} token into cookies`);
        // We save the tokens with a 100-year expiration time
        return storeInCookies(name, value, Date.now() + 3153600000);
    } else {
        logDebugMessage(`setToken: cleared ${tokenType} token from cookies`);
        return storeInCookies(name, value, 0);
    }
}

function storeInCookies(name: string, value: string, expiry: number) {
    let expires = "Fri, 31 Dec 9999 23:59:59 GMT";
    if (expiry !== Number.MAX_SAFE_INTEGER) {
        // We should respect the storage expirations set by the backend, even though tokens will also be checked elsewhere.
        // We check them locally in case of front-token, and on the backend enforces the validity period for access and refresh tokens.
        expires = new Date(expiry).toUTCString();
    }
    const domain = AuthHttpRequest.config.sessionTokenFrontendDomain;
    if (
        domain === "localhost" ||
        domain === WindowHandlerReference.getReferenceOrThrow().windowHandler.location.getHostName()
    ) {
        // since some browsers ignore cookies with domain set to localhost
        // see https://github.com/supertokens/supertokens-website/issues/25
        return CookieHandlerReference.getReferenceOrThrow().cookieHandler.setCookie(
            `${name}=${value};expires=${expires};path=/;samesite=${
                AuthHttpRequest.config.isInIframe ? "none;secure" : "lax"
            }`
        );
    } else {
        return CookieHandlerReference.getReferenceOrThrow().cookieHandler.setCookie(
            `${name}=${value};expires=${expires};domain=${domain};path=/;samesite=${
                AuthHttpRequest.config.isInIframe ? "none;secure" : "lax"
            }`
        );
    }
}

export async function getTokenForHeaderAuth(tokenType: TokenType) {
    const name = getStorageNameForToken(tokenType);

    return getFromCookies(name);
}

async function getFromCookies(name: string) {
    let value = "; " + (await CookieHandlerReference.getReferenceOrThrow().cookieHandler.getCookie());
    let parts = value.split("; " + name + "=");
    if (parts.length >= 2) {
        let last = parts.pop();
        if (last !== undefined) {
            return last.split(";").shift();
        }
    }
    return undefined;
}

async function setAuthorizationHeaderIfRequired(clonedHeaders: Headers, addRefreshToken: boolean = false) {
    logDebugMessage("setTokenHeaders: adding existing tokens as header");

    // We set the Authorization header even if the tokenTransferMethod preference set in the config is cookies
    // since the active session may be using cookies. By default, we want to allow users to continue these sessions.
    // The new session preference should be applied at the start of the next session, if the backend allows it.

    const accessToken = await getTokenForHeaderAuth("access");
    const refreshToken = await getTokenForHeaderAuth("refresh");

    // We don't always need the refresh token because that's only required by the refresh call
    // Still, we only add the access token to Authorization header if both are present, because we are planning to add an option to expose the
    // access token to the frontend while using cookie based auth - so that users can get the access token without using header based auth
    // We can add the refresh token even if only that one is present, to make manual testing easier - you can then
    // force a refresh by just deleting the access token.
    if ((addRefreshToken || accessToken !== undefined) && refreshToken !== undefined) {
        // the Headers class normalizes header names so we don't have to worry about casing
        if (clonedHeaders.has("Authorization")) {
            logDebugMessage("setAuthorizationHeaderIfRequired: Authorization header defined by the user, not adding");
        } else {
            logDebugMessage("setAuthorizationHeaderIfRequired: added authorization header");
            clonedHeaders.set("Authorization", `Bearer ${addRefreshToken ? refreshToken : accessToken}`);
        }
    } else {
        logDebugMessage("setAuthorizationHeaderIfRequired: token for header based auth not found");
    }
}

async function saveTokensFromHeaders(response: Response) {
    logDebugMessage("saveTokensFromHeaders: Saving updated tokens from the response headers");

    const refreshToken = response.headers.get("st-refresh-token");
    if (refreshToken !== null) {
        logDebugMessage("saveTokensFromHeaders: saving new refresh token");
        await setToken("refresh", refreshToken);
    }

    const accessToken = response.headers.get("st-access-token");
    if (accessToken !== null) {
        logDebugMessage("saveTokensFromHeaders: saving new access token");
        await setToken("access", accessToken);
    }

    const frontToken = response.headers.get("front-token");
    if (frontToken !== null) {
        logDebugMessage("saveTokensFromHeaders: Setting sFrontToken: " + frontToken);
        await FrontToken.setItem(frontToken);
    }
    const antiCsrfToken = response.headers.get("anti-csrf");
    if (antiCsrfToken !== null) {
        const tok = await getLocalSessionState(true);
        if (tok.status === "EXISTS") {
            logDebugMessage("saveTokensFromHeaders: Setting anti-csrf token");
            await AntiCsrfToken.setItem(tok.lastAccessTokenUpdate, antiCsrfToken);
        }
    }
}

export async function saveLastAccessTokenUpdate() {
    logDebugMessage("saveLastAccessTokenUpdate: called");

    const now = Date.now().toString();
    logDebugMessage("saveLastAccessTokenUpdate: setting " + now);
    await storeInCookies(LAST_ACCESS_TOKEN_UPDATE, now, Number.MAX_SAFE_INTEGER);

    // We clear the sIRTFrontend cookie
    // We are handling this as a special case here because we want to limit the scope of legacy code
    await storeInCookies("sIRTFrontend", "", 0);
}

async function getAntiCSRFToken(): Promise<string | null> {
    logDebugMessage("getAntiCSRFToken: called");
    // we do not call doesSessionExist here cause the user might override that
    // function here and then it may break the logic of our original implementation.
    if (!((await getLocalSessionState(true)).status === "EXISTS")) {
        logDebugMessage("getAntiCSRFToken: Returning because local session state != EXISTS");
        return null;
    }

    async function getAntiCSRFromCookie(): Promise<string | null> {
        let value = "; " + (await CookieHandlerReference.getReferenceOrThrow().cookieHandler.getCookie());
        let parts = value.split("; " + ANTI_CSRF_NAME + "=");
        if (parts.length >= 2) {
            let last = parts.pop();
            if (last !== undefined) {
                let temp = last.split(";").shift();
                if (temp === undefined) {
                    return null;
                }
                return temp;
            }
        }
        return null;
    }

    let fromCookie = await getAntiCSRFromCookie();
    logDebugMessage("getAntiCSRFToken: returning: " + fromCookie);
    return fromCookie;
}

// give antiCSRFToken as undefined to remove it.
export async function setAntiCSRF(antiCSRFToken: string | undefined) {
    logDebugMessage("setAntiCSRF: called: " + antiCSRFToken);
    if (antiCSRFToken !== undefined) {
        await storeInCookies(ANTI_CSRF_NAME, antiCSRFToken, Number.MAX_SAFE_INTEGER);
    } else {
        await storeInCookies(ANTI_CSRF_NAME, "", 0);
    }
}

async function getFrontTokenFromCookie(): Promise<string | null> {
    logDebugMessage("getFrontTokenFromCookie: called");
    const val = await getFromCookies(FRONT_TOKEN_NAME);
    return val === undefined ? null : val;
}

function parseFrontToken(frontToken: string): { uid: string; ate: number; up: any } {
    return JSON.parse(decodeURIComponent(escape(atob(frontToken))));
}

export async function getFrontToken(): Promise<string | null> {
    logDebugMessage("getFrontToken: called");
    // we do not call doesSessionExist here because that directly calls this function.
    if (!((await getLocalSessionState(true)).status === "EXISTS")) {
        logDebugMessage("getFrontToken: Returning because sIRTFrontend != EXISTS");
        return null;
    }

    let fromCookie = await getFrontTokenFromCookie();
    logDebugMessage("getFrontToken: returning: " + fromCookie);
    return fromCookie;
}

export async function setFrontToken(frontToken: string | undefined) {
    logDebugMessage("setFrontToken: called");

    const oldToken = await getFrontTokenFromCookie();
    if (oldToken !== null && frontToken !== undefined) {
        const oldPayload = parseFrontToken(oldToken).up;
        const newPayload = parseFrontToken(frontToken).up;
        if (JSON.stringify(oldPayload) !== JSON.stringify(newPayload)) {
            onTokenUpdate();
        }
    }

    if (frontToken === undefined) {
        // clear the cookie
        await storeInCookies(FRONT_TOKEN_NAME, "", 0);
    } else {
        await storeInCookies(FRONT_TOKEN_NAME, frontToken, Number.MAX_SAFE_INTEGER);
    }
}

export function fireSessionUpdateEventsIfNecessary(
    wasLoggedIn: boolean,
    status: number,
    frontTokenHeaderFromResponse: string | null | undefined
) {
    // In case we've received a 401 that didn't clear the session (e.g.: we've sent no session token, or we should try refreshing)
    // then onUnauthorised will handle firing the UNAUTHORISED event if necessary
    // In some rare cases (where we receive a 401 that also clears the session) this will fire the event twice.
    // This may be considered a bug, but it is the existing behaviour before the rework
    if (frontTokenHeaderFromResponse === undefined || frontTokenHeaderFromResponse === null) {
        // The access token (and the session) hasn't been updated.
        logDebugMessage("fireSessionUpdateEventsIfNecessary returning early because the front token was not updated");
        return;
    }

    // if the current endpoint clears the session it'll set the front-token to remove
    // any other update means it's created or updated.
    const frontTokenExistsAfter = frontTokenHeaderFromResponse !== "remove";

    logDebugMessage(
        `fireSessionUpdateEventsIfNecessary wasLoggedIn: ${wasLoggedIn} frontTokenExistsAfter: ${frontTokenExistsAfter} status: ${status}`
    );
    if (wasLoggedIn) {
        // we check for wasLoggedIn cause we don't want to fire an event
        // unnecessarily on first app load or if the user tried
        // to query an API that returned 401 while the user was not logged in...
        if (!frontTokenExistsAfter) {
            if (status === AuthHttpRequest.config.sessionExpiredStatusCode) {
                logDebugMessage("onUnauthorisedResponse: firing UNAUTHORISED event");
                AuthHttpRequest.config.onHandleEvent({
                    action: "UNAUTHORISED",
                    sessionExpiredOrRevoked: true,
                    userContext: {}
                });
            } else {
                logDebugMessage("onUnauthorisedResponse: firing SIGN_OUT event");
                AuthHttpRequest.config.onHandleEvent({
                    action: "SIGN_OUT",
                    userContext: {}
                });
            }
        }
    } else if (frontTokenExistsAfter) {
        logDebugMessage("onUnauthorisedResponse: firing SESSION_CREATED event");
        AuthHttpRequest.config.onHandleEvent({
            action: "SESSION_CREATED",
            userContext: {}
        });
    }
}
