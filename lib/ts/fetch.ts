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
import Lock from "browser-tabs-lock";
import { shouldDoInterceptionBasedOnUrl } from "./utils";
import { RecipeInterface, NormalisedInputType, ResponseWithBody } from "./types";
import CookieHandlerReference from "./utils/cookieHandler";
import WindowHandlerReference from "./utils/windowHandler";
import { logDebugMessage } from "./logger";

function getWindowOrThrow(): Window {
    if (typeof window === "undefined") {
        throw Error(
            "If you are using this package with server-side rendering, please make sure that you are checking if the window object is defined."
        );
    }

    return window;
}

export class AntiCsrfToken {
    private static tokenInfo:
        | undefined
        | {
              antiCsrf: string;
              associatedIdRefreshToken: string;
          };

    private constructor() {}

    static async getToken(associatedIdRefreshToken: string | undefined): Promise<string | undefined> {
        logDebugMessage("AntiCsrfToken.getToken: called");
        if (associatedIdRefreshToken === undefined) {
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
                associatedIdRefreshToken
            };
        } else if (AntiCsrfToken.tokenInfo.associatedIdRefreshToken !== associatedIdRefreshToken) {
            // csrf token has changed.
            AntiCsrfToken.tokenInfo = undefined;
            return await AntiCsrfToken.getToken(associatedIdRefreshToken);
        }
        logDebugMessage("AntiCsrfToken.getToken: returning: " + AntiCsrfToken.tokenInfo.antiCsrf);
        return AntiCsrfToken.tokenInfo.antiCsrf;
    }

    static async removeToken() {
        logDebugMessage("AntiCsrfToken.removeToken: called");
        AntiCsrfToken.tokenInfo = undefined;
        await setAntiCSRF(undefined);
    }

    static async setItem(associatedIdRefreshToken: string | undefined, antiCsrf: string) {
        if (associatedIdRefreshToken === undefined) {
            AntiCsrfToken.tokenInfo = undefined;
            return;
        }
        logDebugMessage("AntiCsrfToken.setItem: called");
        await setAntiCSRF(antiCsrf);
        AntiCsrfToken.tokenInfo = {
            antiCsrf,
            associatedIdRefreshToken
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
            if ((await getIdRefreshToken(false)).status === "EXISTS") {
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
        FrontToken.waiters.forEach(f => f(undefined));
        FrontToken.waiters = [];
    }

    static async setItem(frontToken: string) {
        logDebugMessage("FrontToken.setItem: called");
        await setFrontToken(frontToken);
        FrontToken.waiters.forEach(f => f(undefined));
        FrontToken.waiters = [];
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
        logDebugMessage("init: Input cookieDomain: " + config.cookieDomain);
        logDebugMessage("init: Input isInIframe: " + config.isInIframe);
        logDebugMessage("init: Input sessionExpiredStatusCode: " + config.sessionExpiredStatusCode);
        logDebugMessage("init: Input sessionScope: " + config.sessionScope);

        AuthHttpRequest.env = getWindowOrThrow().fetch === undefined ? global : getWindowOrThrow();

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
            AuthHttpRequest.env.fetch = (AuthHttpRequest.env
                .__supertokensSessionRecipe as RecipeInterface).addFetchInterceptorsAndReturnModifiedFetch({
                originalFetch: AuthHttpRequest.env.__supertokensOriginalFetch,
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
            doNotDoInterception =
                (typeof url === "string" &&
                    !shouldDoInterceptionBasedOnUrl(
                        url,
                        AuthHttpRequest.config.apiDomain,
                        AuthHttpRequest.config.cookieDomain
                    )) ||
                (url !== undefined &&
                typeof url.url === "string" && // this is because url can be an object like {method: ..., url: ...}
                    !shouldDoInterceptionBasedOnUrl(
                        url.url,
                        AuthHttpRequest.config.apiDomain,
                        AuthHttpRequest.config.cookieDomain
                    ));
        } catch (err) {
            if ((err as any).message === "Please provide a valid domain name") {
                logDebugMessage("doRequest: Trying shouldDoInterceptionBasedOnUrl with location.origin");
                // .origin gives the port as well..
                doNotDoInterception = !shouldDoInterceptionBasedOnUrl(
                    WindowHandlerReference.getReferenceOrThrow().windowHandler.location.getOrigin(),
                    AuthHttpRequest.config.apiDomain,
                    AuthHttpRequest.config.cookieDomain
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
        logDebugMessage("doRequest: Interception started");

        ProcessState.getInstance().addState(PROCESS_STATE.CALLING_INTERCEPTION_REQUEST);
        try {
            let returnObj = undefined;
            while (true) {
                // we read this here so that if there is a session expiry error, then we can compare this value (that caused the error) with the value after the request is sent.
                // to avoid race conditions
                const preRequestIdToken = await getIdRefreshToken(true);
                const clonedHeaders = new Headers(
                    config !== undefined && config.headers !== undefined ? config.headers : url.headers
                );
                let configWithAntiCsrf: RequestInit | undefined = {
                    ...config,
                    headers: clonedHeaders
                };
                if (preRequestIdToken.status === "EXISTS") {
                    const antiCsrfToken = await AntiCsrfToken.getToken(preRequestIdToken.token);
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

                logDebugMessage("doRequest: Making user's http call");
                let response = await httpCall(configWithAntiCsrf);
                logDebugMessage("doRequest: User's http call ended");

                const idRefreshToken = response.headers.get("id-refresh-token");
                if (idRefreshToken) {
                    logDebugMessage("doRequest: Setting sIRTFrontend: " + idRefreshToken);
                    await setIdRefreshToken(idRefreshToken, response.status);
                }
                if (response.status === AuthHttpRequest.config.sessionExpiredStatusCode) {
                    logDebugMessage("doRequest: Status code is: " + response.status);
                    let retry = await onUnauthorisedResponse(preRequestIdToken);
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
                    const antiCsrfToken = response.headers.get("anti-csrf");
                    if (antiCsrfToken) {
                        const tok = await getIdRefreshToken(true);
                        if (tok.status === "EXISTS") {
                            logDebugMessage("doRequest: Setting anti-csrf token");
                            await AntiCsrfToken.setItem(tok.token, antiCsrfToken);
                        }
                    }
                    const frontToken = response.headers.get("front-token");
                    if (frontToken) {
                        logDebugMessage("doRequest: Setting sFrontToken: " + frontToken);
                        await FrontToken.setItem(frontToken);
                    }
                    return response;
                }
            }

            // if it comes here, means we breaked. which happens only if we have logged out.
            return returnObj;
        } finally {
            // If we get here we already tried refreshing so we should have the already id refresh token either in EXISTS or NOT_EXISTS, so no need to call the backend
            // or the backend is down and we don't need to call it.
            const postRequestIdToken = await getIdRefreshToken(false);
            if (postRequestIdToken.status === "NOT_EXISTS") {
                logDebugMessage("doRequest: sIRTFrontend doesn't exist, so removing anti-csrf and sFrontToken");
                await AntiCsrfToken.removeToken();
                await FrontToken.removeToken();
            }
        }
    };

    static attemptRefreshingSession = async (): Promise<boolean> => {
        const preRequestIdToken = await getIdRefreshToken(false);
        const refresh = await onUnauthorisedResponse(preRequestIdToken);

        if (refresh.result === "API_ERROR") {
            throw refresh.error;
        }

        return refresh.result === "RETRY";
    };
}

const ID_REFRESH_TOKEN_NAME = "sIRTFrontend";
const ANTI_CSRF_NAME = "sAntiCsrf";
const FRONT_TOKEN_NAME = "sFrontToken";

/**
 * @description attempts to call the refresh token API each time we are sure the session has expired, or it throws an error or,
 * or the ID_COOKIE_NAME has changed value -> which may mean that we have a new set of tokens.
 */
export async function onUnauthorisedResponse(
    preRequestIdToken: IdRefreshTokenType
): Promise<{ result: "SESSION_EXPIRED"; error?: any } | { result: "API_ERROR"; error: any } | { result: "RETRY" }> {
    let lock = new Lock();
    while (true) {
        logDebugMessage("onUnauthorisedResponse: trying to acquire lock");
        if (await lock.acquireLock("REFRESH_TOKEN_USE", 1000)) {
            logDebugMessage("onUnauthorisedResponse: lock acquired");
            // to sync across tabs. the 1000 ms wait is for how much time to try and acquire the lock
            try {
                let postLockID = await getIdRefreshToken(false);
                if (postLockID.status === "NOT_EXISTS") {
                    logDebugMessage("onUnauthorisedResponse: Not refreshing because sIRTFrontend is remove");
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
                    postLockID.status !== preRequestIdToken.status ||
                    (postLockID.status === "EXISTS" &&
                        preRequestIdToken.status === "EXISTS" &&
                        postLockID.token !== preRequestIdToken.token)
                ) {
                    logDebugMessage(
                        "onUnauthorisedResponse: Retrying early because pre and post id refresh tokens don't match"
                    );
                    // means that some other process has already called this API and succeeded. so we need to call it again
                    return { result: "RETRY" };
                }
                let headers: any = {};
                if (preRequestIdToken.status === "EXISTS") {
                    const antiCsrfToken = await AntiCsrfToken.getToken(preRequestIdToken.token);
                    if (antiCsrfToken !== undefined) {
                        logDebugMessage("onUnauthorisedResponse: Adding anti-csrf token to refresh API call");
                        headers = {
                            ...headers,
                            "anti-csrf": antiCsrfToken
                        };
                    }
                }
                logDebugMessage("onUnauthorisedResponse: Adding rid and fdi-versions to refresh call header");
                headers = {
                    rid: AuthHttpRequest.rid, // adding for anti-csrf protection (via custom header)
                    ...headers,
                    "fdi-version": supported_fdi.join(",")
                };
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
                let removeIdRefreshToken = true;
                const idRefreshToken = response.headers.get("id-refresh-token");
                if (idRefreshToken) {
                    logDebugMessage(
                        "onUnauthorisedResponse: Setting sIRTFrontend from refresh API call: " + idRefreshToken
                    );
                    await setIdRefreshToken(idRefreshToken, response.status);
                    removeIdRefreshToken = false;
                }
                if (response.status === AuthHttpRequest.config.sessionExpiredStatusCode) {
                    logDebugMessage("onUnauthorisedResponse: Refresh status code is: " + response.status);
                    // there is a case where frontend still has id refresh token, but backend doesn't get it. In this event, session expired error will be thrown and the frontend should remove this token
                    if (removeIdRefreshToken) {
                        await setIdRefreshToken("remove", response.status);
                    }
                }
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

                if ((await getIdRefreshToken(false)).status === "NOT_EXISTS") {
                    logDebugMessage("onUnauthorisedResponse: sIRTFrontend is remove, so returning session expired");
                    // The execution should never come here.. but just in case.
                    // removed by server. So we logout

                    // we do not send "UNAUTHORISED" event here because
                    // this is a result of the refresh API returning a session expiry, which
                    // means that the frontend did not know for sure that the session existed
                    // in the first place.
                    return { result: "SESSION_EXPIRED" };
                }
                const antiCsrfToken = response.headers.get("anti-csrf");
                if (antiCsrfToken) {
                    const tok = await getIdRefreshToken(true);
                    if (tok.status === "EXISTS") {
                        logDebugMessage("onUnauthorisedResponse: setting anti-csrf token");
                        await AntiCsrfToken.setItem(tok.token, antiCsrfToken);
                    }
                }
                const frontToken = response.headers.get("front-token");
                if (frontToken) {
                    logDebugMessage("onUnauthorisedResponse: setting sFrontToken: " + frontToken);
                    await FrontToken.setItem(frontToken);
                }
                AuthHttpRequest.config.onHandleEvent({
                    action: "REFRESH_SESSION",
                    userContext: {}
                });
                logDebugMessage("onUnauthorisedResponse: Sending RETRY signal");
                return { result: "RETRY" };
            } catch (error) {
                if ((await getIdRefreshToken(false)).status === "NOT_EXISTS") {
                    logDebugMessage("onUnauthorisedResponse: sIRTFrontend is remove, so returning session expired");
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
                // as cookies may not get set at all.
                if ((await getIdRefreshToken(false)).status === "NOT_EXISTS") {
                    logDebugMessage(
                        "onUnauthorisedResponse: sIRTFrontend is remove, so removing anti-csrf and sFrontToken"
                    );
                    await AntiCsrfToken.removeToken();
                    await FrontToken.removeToken();
                }
            }
        }
        let idCookieValue = await getIdRefreshToken(false);
        if (idCookieValue.status === "NOT_EXISTS") {
            logDebugMessage(
                "onUnauthorisedResponse: lock acquired failed and sIRTFrontend is remove, so sending SESSION_EXPIRED"
            );
            // removed by server. So we logout
            return { result: "SESSION_EXPIRED" };
        } else {
            if (
                idCookieValue.status !== preRequestIdToken.status ||
                (idCookieValue.status === "EXISTS" &&
                    preRequestIdToken.status === "EXISTS" &&
                    idCookieValue.token !== preRequestIdToken.token)
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

type IdRefreshTokenType =
    | {
          status: "NOT_EXISTS" | "MAY_EXIST";
      }
    | {
          status: "EXISTS";
          token: string;
      };

// if tryRefresh is true & this token doesn't exist, we try and refresh the session
// else we return undefined.
export async function getIdRefreshToken(tryRefresh: boolean): Promise<IdRefreshTokenType> {
    logDebugMessage("getIdRefreshToken: called");
    async function getIdRefreshTokenFromLocal(): Promise<string | undefined> {
        async function getIDFromCookieOld(): Promise<string | undefined> {
            let value = "; " + (await CookieHandlerReference.getReferenceOrThrow().cookieHandler.getCookie());
            let parts = value.split("; " + ID_REFRESH_TOKEN_NAME + "=");
            if (parts.length >= 2) {
                let last = parts.pop();
                if (last === "remove") {
                    // it means no session exists. This is different from
                    // it being undefined since in that case a session may or may not exist.
                    return "remove";
                }
                if (last !== undefined) {
                    return last.split(";").shift();
                }
            }
            return undefined;
        }

        let fromCookie = await getIDFromCookieOld();
        return fromCookie;
    }

    let token = await getIdRefreshTokenFromLocal();

    if (token === "remove") {
        logDebugMessage("getIdRefreshToken: is removed");
        return {
            status: "NOT_EXISTS"
        };
    }

    if (token === undefined) {
        logDebugMessage("getIdRefreshToken: is undefined");
        let response: IdRefreshTokenType = {
            status: "MAY_EXIST"
        };
        if (tryRefresh) {
            logDebugMessage("getIdRefreshToken: trying to refresg");
            // either session doesn't exist, or the
            // cookies have expired (privacy feature that caps lifetime of cookies to 7 days)
            const res = await onUnauthorisedResponse(response);
            if (res.result !== "RETRY") {
                logDebugMessage("getIdRefreshToken: false NOT_EXISTS in case error from backend");
                // in case the backend is not working, we treat it as the session not existing...
                return {
                    status: "NOT_EXISTS"
                };
            }
            logDebugMessage("getIdRefreshToken: Retrying post refresh");
            return await getIdRefreshToken(tryRefresh);
        } else {
            logDebugMessage("getIdRefreshToken: returning: " + response.status);
            return response;
        }
    }

    logDebugMessage("getIdRefreshToken: returning EXISTS: " + token);
    return {
        status: "EXISTS",
        token
    };
}

export async function setIdRefreshToken(idRefreshToken: string | "remove", statusCode: number) {
    logDebugMessage("setIdRefreshToken: called");
    async function setIDToCookie(idRefreshToken: string, domain: string) {
        // if the value of the token is "remove", it means
        // the session is being removed. So we set it to "remove" in the
        // cookie. This way, when we query for this token, we will return
        // undefined (see getIdRefreshToken), and not refresh the session
        // unnecessarily.

        let expires = "Fri, 31 Dec 9999 23:59:59 GMT";
        let cookieVal = "remove";
        if (idRefreshToken !== "remove") {
            let splitted = idRefreshToken.split(";");
            cookieVal = splitted[0];

            // we must always respect this expiry and not set it to infinite
            // cause this ties into the session's lifetime. If we set this
            // to infinite, then a session may not exist, and this will exist,
            // then for example, if we check a session exists, and this says yes,
            // then if we getAccessTokenPayload, that will attempt a session refresh which will fail.
            // Another reason to respect this is that if we don't, then signOut will
            // call the API which will return 200 (no 401 cause the API thinks no session exists),
            // in which case, we will not end up firing the SIGN_OUT on handle event.
            expires = new Date(Number(splitted[1])).toUTCString();
        }
        if (
            domain === "localhost" ||
            domain === WindowHandlerReference.getReferenceOrThrow().windowHandler.location.getHostName()
        ) {
            // since some browsers ignore cookies with domain set to localhost
            // see https://github.com/supertokens/supertokens-website/issues/25
            await CookieHandlerReference.getReferenceOrThrow().cookieHandler.setCookie(
                `${ID_REFRESH_TOKEN_NAME}=${cookieVal};expires=${expires};path=/;samesite=${
                    AuthHttpRequest.config.isInIframe ? "none;secure" : "lax"
                }`
            );
        } else {
            await CookieHandlerReference.getReferenceOrThrow().cookieHandler.setCookie(
                `${ID_REFRESH_TOKEN_NAME}=${cookieVal};expires=${expires};domain=${domain};path=/;samesite=${
                    AuthHttpRequest.config.isInIframe ? "none;secure" : "lax"
                }`
            );
        }
    }

    const { status } = await getIdRefreshToken(false);

    logDebugMessage("setIdRefreshToken: setting: " + idRefreshToken);
    await setIDToCookie(idRefreshToken, AuthHttpRequest.config.sessionScope);

    if (idRefreshToken === "remove" && status === "EXISTS") {
        // we check for wasLoggedIn cause we don't want to fire an event
        // unnecessarily on first app load or if the user tried
        // to query an API that returned 401 while the user was not logged in...
        if (statusCode === AuthHttpRequest.config.sessionExpiredStatusCode) {
            logDebugMessage("setIdRefreshToken: firing UNAUTHORISED event");
            AuthHttpRequest.config.onHandleEvent({
                action: "UNAUTHORISED",
                sessionExpiredOrRevoked: true,
                userContext: {}
            });
        } else {
            logDebugMessage("setIdRefreshToken: firing SIGN_OUT event");
            AuthHttpRequest.config.onHandleEvent({
                action: "SIGN_OUT",
                userContext: {}
            });
        }
    }

    if (idRefreshToken !== "remove" && status === "NOT_EXISTS") {
        logDebugMessage("setIdRefreshToken: firing SESSION_CREATED event");
        AuthHttpRequest.config.onHandleEvent({
            action: "SESSION_CREATED",
            userContext: {}
        });
    }
}

async function getAntiCSRFToken(): Promise<string | null> {
    logDebugMessage("getAntiCSRFToken: called");
    // we do not call doesSessionExist here cause the user might override that
    // function here and then it may break the logic of our original implementation.
    if (!((await getIdRefreshToken(true)).status === "EXISTS")) {
        logDebugMessage("getAntiCSRFToken: Returning because sIRTFrontend != EXISTS");
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
    async function setAntiCSRFToCookie(antiCSRFToken: string | undefined, domain: string) {
        let expires: string | undefined = "Thu, 01 Jan 1970 00:00:01 GMT";
        let cookieVal = "";
        if (antiCSRFToken !== undefined) {
            cookieVal = antiCSRFToken;
            expires = undefined; // set cookie without expiry
        }
        if (
            domain === "localhost" ||
            domain === WindowHandlerReference.getReferenceOrThrow().windowHandler.location.getHostName()
        ) {
            // since some browsers ignore cookies with domain set to localhost
            // see https://github.com/supertokens/supertokens-website/issues/25
            if (expires !== undefined) {
                await CookieHandlerReference.getReferenceOrThrow().cookieHandler.setCookie(
                    `${ANTI_CSRF_NAME}=${cookieVal};expires=${expires};path=/;samesite=${
                        AuthHttpRequest.config.isInIframe ? "none;secure" : "lax"
                    }`
                );
            } else {
                await CookieHandlerReference.getReferenceOrThrow().cookieHandler.setCookie(
                    `${ANTI_CSRF_NAME}=${cookieVal};expires=Fri, 31 Dec 9999 23:59:59 GMT;path=/;samesite=${
                        AuthHttpRequest.config.isInIframe ? "none;secure" : "lax"
                    }`
                );
            }
        } else {
            if (expires !== undefined) {
                await CookieHandlerReference.getReferenceOrThrow().cookieHandler.setCookie(
                    `${ANTI_CSRF_NAME}=${cookieVal};expires=${expires};domain=${domain};path=/;samesite=${
                        AuthHttpRequest.config.isInIframe ? "none;secure" : "lax"
                    }`
                );
            } else {
                await CookieHandlerReference.getReferenceOrThrow().cookieHandler.setCookie(
                    `${ANTI_CSRF_NAME}=${cookieVal};domain=${domain};expires=Fri, 31 Dec 9999 23:59:59 GMT;path=/;samesite=${
                        AuthHttpRequest.config.isInIframe ? "none;secure" : "lax"
                    }`
                );
            }
        }
    }

    await setAntiCSRFToCookie(antiCSRFToken, AuthHttpRequest.config.sessionScope);
}

async function getFrontTokenFromCookie(): Promise<string | null> {
    logDebugMessage("getFrontTokenFromCookie: called");
    let value = "; " + (await CookieHandlerReference.getReferenceOrThrow().cookieHandler.getCookie());
    let parts = value.split("; " + FRONT_TOKEN_NAME + "=");
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

function parseFrontToken(frontToken: string): { uid: string; ate: number; up: any } {
    return JSON.parse(decodeURIComponent(escape(atob(frontToken))));
}

export async function getFrontToken(): Promise<string | null> {
    logDebugMessage("getFrontToken: called");
    // we do not call doesSessionExist here cause the user might override that
    // function here and then it may break the logic of our original implementation.
    if (!((await getIdRefreshToken(true)).status === "EXISTS")) {
        logDebugMessage("getFrontToken: Returning because sIRTFrontend != EXISTS");
        return null;
    }

    let fromCookie = await getFrontTokenFromCookie();
    logDebugMessage("getFrontToken: returning: " + fromCookie);
    return fromCookie;
}

export async function setFrontToken(frontToken: string | undefined) {
    logDebugMessage("setFrontToken: called");
    async function setFrontTokenToCookie(frontToken: string | undefined, domain: string) {
        let expires: string | undefined = "Thu, 01 Jan 1970 00:00:01 GMT";
        let cookieVal = "";
        if (frontToken !== undefined) {
            cookieVal = frontToken;
            expires = undefined; // set cookie without expiry
        }
        if (
            domain === "localhost" ||
            domain === WindowHandlerReference.getReferenceOrThrow().windowHandler.location.getHostName()
        ) {
            // since some browsers ignore cookies with domain set to localhost
            // see https://github.com/supertokens/supertokens-website/issues/25
            if (expires !== undefined) {
                await CookieHandlerReference.getReferenceOrThrow().cookieHandler.setCookie(
                    `${FRONT_TOKEN_NAME}=${cookieVal};expires=${expires};path=/;samesite=${
                        AuthHttpRequest.config.isInIframe ? "none;secure" : "lax"
                    }`
                );
            } else {
                await CookieHandlerReference.getReferenceOrThrow().cookieHandler.setCookie(
                    `${FRONT_TOKEN_NAME}=${cookieVal};expires=Fri, 31 Dec 9999 23:59:59 GMT;path=/;samesite=${
                        AuthHttpRequest.config.isInIframe ? "none;secure" : "lax"
                    }`
                );
            }
        } else {
            if (expires !== undefined) {
                await CookieHandlerReference.getReferenceOrThrow().cookieHandler.setCookie(
                    `${FRONT_TOKEN_NAME}=${cookieVal};expires=${expires};domain=${domain};path=/;samesite=${
                        AuthHttpRequest.config.isInIframe ? "none;secure" : "lax"
                    }`
                );
            } else {
                await CookieHandlerReference.getReferenceOrThrow().cookieHandler.setCookie(
                    `${FRONT_TOKEN_NAME}=${cookieVal};domain=${domain};expires=Fri, 31 Dec 9999 23:59:59 GMT;path=/;samesite=${
                        AuthHttpRequest.config.isInIframe ? "none;secure" : "lax"
                    }`
                );
            }
        }
    }

    const oldToken = await getFrontTokenFromCookie();
    if (oldToken !== null && frontToken !== undefined) {
        const oldPayload = parseFrontToken(oldToken).up;
        const newPayload = parseFrontToken(frontToken).up;
        if (JSON.stringify(oldPayload) !== JSON.stringify(newPayload)) {
            onTokenUpdate();
        }
    }
    await setFrontTokenToCookie(frontToken, AuthHttpRequest.config.sessionScope);
}
