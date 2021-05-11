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
import {
    InputType,
    validateAndNormaliseInputOrThrowError,
    normaliseURLPathOrThrowError,
    normaliseURLDomainOrThrowError,
    getWindowOrThrow,
    normaliseSessionScopeOrThrowError
} from "./utils";
import CrossDomainLocalstorage from "./crossDomainLocalstorage";
import { doesSessionExist } from "./index";

export class AntiCsrfToken {
    private static tokenInfo:
        | undefined
        | {
              antiCsrf: string;
              associatedIdRefreshToken: string;
          };

    private constructor() {}

    static async getToken(associatedIdRefreshToken: string | undefined): Promise<string | undefined> {
        if (associatedIdRefreshToken === undefined) {
            AntiCsrfToken.tokenInfo = undefined;
            return undefined;
        }
        if (AntiCsrfToken.tokenInfo === undefined) {
            let antiCsrf = await getAntiCSRFToken();
            if (antiCsrf === null) {
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
        return AntiCsrfToken.tokenInfo.antiCsrf;
    }

    static async removeToken() {
        AntiCsrfToken.tokenInfo = undefined;
        await setAntiCSRF(undefined);
    }

    static async setItem(associatedIdRefreshToken: string | undefined, antiCsrf: string) {
        if (associatedIdRefreshToken === undefined) {
            AntiCsrfToken.tokenInfo = undefined;
            return;
        }
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
    private constructor() {}

    static async getTokenInfo(): Promise<
        | {
              uid: string;
              ate: number;
              up: any;
          }
        | undefined
    > {
        let frontToken = await getFrontToken();
        if (frontToken === null) {
            return undefined;
        }
        return JSON.parse(atob(frontToken));
    }

    static async removeToken() {
        await setFrontToken(undefined);
    }

    static async setItem(frontToken: string) {
        await setFrontToken(frontToken);
    }
}

/**
 * @description returns true if retry, else false is session has expired completely.
 */
export async function handleUnauthorised(
    refreshAPI: string,
    preRequestIdToken: IdRefreshTokenType,
    refreshAPICustomHeaders: any,
    sessionExpiredStatusCode: number
): Promise<boolean> {
    let result = await onUnauthorisedResponse(
        refreshAPI,
        preRequestIdToken,
        refreshAPICustomHeaders,
        sessionExpiredStatusCode
    );
    if (result.result === "SESSION_EXPIRED") {
        return false;
    } else if (result.result === "API_ERROR") {
        throw result.error;
    }
    return true;
}

/**
 * @class AuthHttpRequest
 * @description wrapper for common http methods.
 */
export default class AuthHttpRequest {
    static refreshTokenUrl: string;
    static signOutUrl: string;
    static sessionExpiredStatusCode: number;
    static initCalled = false;
    static apiDomain = "";
    static addedFetchInterceptor: boolean = false;
    static sessionScope:
        | {
              scope: string;
              authDomain: string;
          }
        | undefined;
    static refreshAPICustomHeaders: any;
    static signoutAPICustomHeaders: any;
    static auth0Path: string | undefined;
    static autoAddCredentials: boolean;
    static crossDomainLocalstorage: CrossDomainLocalstorage;
    static rid: string;
    static env: any;
    static isInIframe: boolean;

    static setAuth0API(apiPath: string) {
        AuthHttpRequest.auth0Path = normaliseURLPathOrThrowError(apiPath);
    }

    static getAuth0API = () => {
        return {
            apiPath: AuthHttpRequest.auth0Path
        };
    };

    static init(options: InputType) {
        let {
            apiDomain,
            apiBasePath,
            sessionScope,
            refreshAPICustomHeaders,
            signoutAPICustomHeaders,
            sessionExpiredStatusCode,
            autoAddCredentials,
            isInIframe
        } = validateAndNormaliseInputOrThrowError(options);
        AuthHttpRequest.env = getWindowOrThrow().fetch === undefined ? global : getWindowOrThrow();

        AuthHttpRequest.autoAddCredentials = autoAddCredentials;
        AuthHttpRequest.refreshTokenUrl = apiDomain + apiBasePath + "/session/refresh";
        AuthHttpRequest.signOutUrl = apiDomain + apiBasePath + "/signout";
        AuthHttpRequest.refreshAPICustomHeaders = refreshAPICustomHeaders;
        AuthHttpRequest.signoutAPICustomHeaders = signoutAPICustomHeaders;
        AuthHttpRequest.sessionScope = sessionScope;
        AuthHttpRequest.sessionExpiredStatusCode = sessionExpiredStatusCode;
        AuthHttpRequest.apiDomain = apiDomain;
        AuthHttpRequest.crossDomainLocalstorage = new CrossDomainLocalstorage(sessionScope);
        AuthHttpRequest.rid = refreshAPICustomHeaders["rid"] === undefined ? "session" : refreshAPICustomHeaders["rid"];
        AuthHttpRequest.isInIframe = isInIframe;

        if (AuthHttpRequest.env.__supertokensOriginalFetch === undefined) {
            AuthHttpRequest.env.__supertokensOriginalFetch = AuthHttpRequest.env.fetch.bind(AuthHttpRequest.env);
        }
        if (!AuthHttpRequest.addedFetchInterceptor) {
            AuthHttpRequest.addedFetchInterceptor = true;
            AuthHttpRequest.env.fetch = (url: RequestInfo, config?: RequestInit): Promise<Response> => {
                return AuthHttpRequest.fetch(url, config);
            };
        }

        AuthHttpRequest.initCalled = true;
    }

    static getRefreshURLDomain = (): string => {
        return normaliseURLDomainOrThrowError(AuthHttpRequest.refreshTokenUrl);
    };

    static async getUserId(): Promise<string> {
        let tokenInfo = await FrontToken.getTokenInfo();
        if (tokenInfo === undefined) {
            throw new Error("No session exists");
        }
        return tokenInfo.uid;
    }

    static async getJWTPayloadSecurely(): Promise<any> {
        let tokenInfo = await FrontToken.getTokenInfo();
        if (tokenInfo === undefined) {
            throw new Error("No session exists");
        }

        if (tokenInfo.ate < Date.now()) {
            const preRequestIdToken = await getIdRefreshToken(false);
            let retry = await handleUnauthorised(
                AuthHttpRequest.refreshTokenUrl,
                preRequestIdToken,
                AuthHttpRequest.refreshAPICustomHeaders,
                AuthHttpRequest.sessionExpiredStatusCode
            );
            if (retry) {
                return await AuthHttpRequest.getJWTPayloadSecurely();
            } else {
                throw new Error("Could not refresh session");
            }
        }
        return tokenInfo.up;
    }

    static async signOut() {
        if (!(await AuthHttpRequest.doesSessionExist())) {
            return;
        }

        let resp = await fetch(AuthHttpRequest.signOutUrl, {
            method: "post",
            credentials: "include",
            headers:
                AuthHttpRequest.signoutAPICustomHeaders === undefined
                    ? undefined
                    : {
                          ...AuthHttpRequest.signoutAPICustomHeaders
                      }
        });

        if (resp.status === AuthHttpRequest.sessionExpiredStatusCode) {
            return;
        }

        if (resp.status >= 300) {
            throw resp;
        }
    }

    /**
     * @description sends the actual http request and returns a response if successful/
     * If not successful due to session expiry reasons, it
     * attempts to call the refresh token API and if that is successful, calls this API again.
     * @throws Error
     */
    private static doRequest = async (
        httpCall: (config?: RequestInit) => Promise<Response>,
        config?: RequestInit,
        url?: any
    ): Promise<Response> => {
        if (!AuthHttpRequest.initCalled) {
            throw Error("init function not called");
        }

        let doNotDoInterception = false;
        try {
            doNotDoInterception =
                (typeof url === "string" &&
                    normaliseURLDomainOrThrowError(url) !== AuthHttpRequest.apiDomain &&
                    AuthHttpRequest.addedFetchInterceptor) ||
                (url !== undefined &&
                typeof url.url === "string" && // this is because url can be an object like {method: ..., url: ...}
                    normaliseURLDomainOrThrowError(url.url) !== AuthHttpRequest.apiDomain &&
                    AuthHttpRequest.addedFetchInterceptor);
        } catch (err) {
            if (err.message === "Please provide a valid domain name") {
                // .origin gives the port as well..
                doNotDoInterception =
                    normaliseURLDomainOrThrowError(window.location.origin) !== AuthHttpRequest.apiDomain &&
                    AuthHttpRequest.addedFetchInterceptor;
            } else {
                throw err;
            }
        }

        if (doNotDoInterception) {
            return await httpCall(config);
        }

        if (AuthHttpRequest.addedFetchInterceptor) {
            ProcessState.getInstance().addState(PROCESS_STATE.CALLING_INTERCEPTION_REQUEST);
        }
        try {
            let throwError = false;
            let returnObj = undefined;
            while (true) {
                // we read this here so that if there is a session expiry error, then we can compare this value (that caused the error) with the value after the request is sent.
                // to avoid race conditions
                const preRequestIdToken = await getIdRefreshToken(true);
                let configWithAntiCsrf: RequestInit | undefined = config;
                if (preRequestIdToken.status === "EXISTS") {
                    const antiCsrfToken = await AntiCsrfToken.getToken(preRequestIdToken.token);
                    if (antiCsrfToken !== undefined) {
                        configWithAntiCsrf = {
                            ...configWithAntiCsrf,
                            headers:
                                configWithAntiCsrf === undefined
                                    ? {
                                          "anti-csrf": antiCsrfToken
                                      }
                                    : {
                                          ...configWithAntiCsrf.headers,
                                          "anti-csrf": antiCsrfToken
                                      }
                        };
                    }
                }

                if (AuthHttpRequest.autoAddCredentials) {
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
                configWithAntiCsrf = {
                    ...configWithAntiCsrf,
                    headers:
                        configWithAntiCsrf === undefined
                            ? {
                                  rid: AuthHttpRequest.rid
                              }
                            : {
                                  rid: AuthHttpRequest.rid,
                                  ...configWithAntiCsrf.headers
                              }
                };
                try {
                    let response = await httpCall(configWithAntiCsrf);
                    await loopThroughResponseHeadersAndApplyFunction(response, async (value: any, key: any) => {
                        if (key.toString() === "id-refresh-token") {
                            await setIdRefreshToken(value);
                        }
                    });
                    if (response.status === AuthHttpRequest.sessionExpiredStatusCode) {
                        let retry = await handleUnauthorised(
                            AuthHttpRequest.refreshTokenUrl,
                            preRequestIdToken,
                            AuthHttpRequest.refreshAPICustomHeaders,
                            AuthHttpRequest.sessionExpiredStatusCode
                        );
                        if (!retry) {
                            returnObj = response;
                            break;
                        }
                    } else {
                        await loopThroughResponseHeadersAndApplyFunction(response, async (value, key) => {
                            if (key.toString() === "anti-csrf") {
                                let tok = await getIdRefreshToken(true);
                                if (tok.status === "EXISTS") {
                                    await AntiCsrfToken.setItem(tok.token, value);
                                }
                            } else if (key.toString() === "front-token") {
                                await FrontToken.setItem(value);
                            }
                        });
                        return response;
                    }
                } catch (err) {
                    if (err.status === AuthHttpRequest.sessionExpiredStatusCode) {
                        let retry = await handleUnauthorised(
                            AuthHttpRequest.refreshTokenUrl,
                            preRequestIdToken,
                            AuthHttpRequest.refreshAPICustomHeaders,
                            AuthHttpRequest.sessionExpiredStatusCode
                        );
                        if (!retry) {
                            throwError = true;
                            returnObj = err;
                            break;
                        }
                    } else {
                        throw err;
                    }
                }
            }
            // if it comes here, means we breaked. which happens only if we have logged out.
            if (throwError) {
                throw returnObj;
            } else {
                return returnObj;
            }
        } finally {
            if (!(await doesSessionExist())) {
                await AntiCsrfToken.removeToken();
                await FrontToken.removeToken();
            }
        }
    };

    /**
     * @description attempts to refresh session regardless of expiry
     * @returns true if successful, else false if session has expired. Wrapped in a Promise
     * @throws error if anything goes wrong
     */
    static attemptRefreshingSession = async (): Promise<boolean> => {
        if (!AuthHttpRequest.initCalled) {
            throw Error("init function not called");
        }
        try {
            const preRequestIdToken = await getIdRefreshToken(false);
            return await handleUnauthorised(
                AuthHttpRequest.refreshTokenUrl,
                preRequestIdToken,
                AuthHttpRequest.refreshAPICustomHeaders,
                AuthHttpRequest.sessionExpiredStatusCode
            );
        } finally {
            if (!(await doesSessionExist())) {
                await AntiCsrfToken.removeToken();
                await FrontToken.removeToken();
            }
        }
    };

    private static fetch = async (url: RequestInfo, config?: RequestInit) => {
        return await AuthHttpRequest.doRequest(
            (config?: RequestInit) => {
                return AuthHttpRequest.env.__supertokensOriginalFetch(url, {
                    ...config
                });
            },
            config,
            url
        );
    };

    static doesSessionExist = async () => {
        return (await getIdRefreshToken(true)).status === "EXISTS";
    };
}

async function loopThroughResponseHeadersAndApplyFunction(
    response: any,
    func: (value: any, key: any) => Promise<void>
) {
    let keys: any[] = [];
    response.headers.forEach((_: any, key: any) => {
        keys.push(key);
    });
    for (let i = 0; i < keys.length; i++) {
        await func(response.headers.get(keys[i].toString()), keys[i]);
    }
}

const ID_REFRESH_TOKEN_NAME = "sIRTFrontend";
const ANTI_CSRF_NAME = "sAntiCsrf";
const FRONT_TOKEN_NAME = "sFrontToken";

/**
 * @description attempts to call the refresh token API each time we are sure the session has expired, or it throws an error or,
 * or the ID_COOKIE_NAME has changed value -> which may mean that we have a new set of tokens.
 */
export async function onUnauthorisedResponse(
    refreshTokenUrl: string,
    preRequestIdToken: IdRefreshTokenType,
    refreshAPICustomHeaders: any,
    sessionExpiredStatusCode: number
): Promise<{ result: "SESSION_EXPIRED" } | { result: "API_ERROR"; error: any } | { result: "RETRY" }> {
    let lock = new Lock();
    while (true) {
        if (await lock.acquireLock("REFRESH_TOKEN_USE", 1000)) {
            // to sync across tabs. the 1000 ms wait is for how much time to try and acquire the lock
            try {
                let postLockID = await getIdRefreshToken(false);
                if (postLockID.status === "NOT_EXISTS") {
                    return { result: "SESSION_EXPIRED" };
                }
                if (
                    postLockID.status !== preRequestIdToken.status ||
                    (postLockID.status === "EXISTS" &&
                        preRequestIdToken.status === "EXISTS" &&
                        postLockID.token !== preRequestIdToken.token)
                ) {
                    // means that some other process has already called this API and succeeded. so we need to call it again
                    return { result: "RETRY" };
                }
                let headers: any = {
                    ...refreshAPICustomHeaders
                };
                if (preRequestIdToken.status === "EXISTS") {
                    const antiCsrfToken = await AntiCsrfToken.getToken(preRequestIdToken.token);
                    if (antiCsrfToken !== undefined) {
                        headers = {
                            ...headers,
                            "anti-csrf": antiCsrfToken
                        };
                    }
                }
                headers = {
                    rid: AuthHttpRequest.rid, // adding for anti-csrf protection (via custom header)
                    ...headers,
                    "fdi-version": supported_fdi.join(",")
                };
                let response = await AuthHttpRequest.env.__supertokensOriginalFetch(refreshTokenUrl, {
                    method: "post",
                    credentials: "include",
                    headers
                });
                let removeIdRefreshToken = true;
                await loopThroughResponseHeadersAndApplyFunction(response, async (value: any, key: any) => {
                    if (key.toString() === "id-refresh-token") {
                        await setIdRefreshToken(value);
                        removeIdRefreshToken = false;
                    }
                });
                if (response.status === sessionExpiredStatusCode) {
                    // there is a case where frontend still has id refresh token, but backend doesn't get it. In this event, session expired error will be thrown and the frontend should remove this token
                    if (removeIdRefreshToken) {
                        await setIdRefreshToken("remove");
                    }
                }
                if (response.status >= 300) {
                    throw response;
                }

                if ((await getIdRefreshToken(false)).status === "NOT_EXISTS") {
                    // removed by server. So we logout
                    return { result: "SESSION_EXPIRED" };
                }
                await loopThroughResponseHeadersAndApplyFunction(response, async (value: any, key: any) => {
                    if (key.toString() === "anti-csrf") {
                        let tok = await getIdRefreshToken(false);
                        if (tok.status === "EXISTS") {
                            await AntiCsrfToken.setItem(tok.token, value);
                        }
                    } else if (key.toString() === "front-token") {
                        await FrontToken.setItem(value);
                    }
                });
                return { result: "RETRY" };
            } catch (error) {
                if ((await getIdRefreshToken(false)).status === "NOT_EXISTS") {
                    // removed by server.
                    return { result: "SESSION_EXPIRED" };
                }
                return { result: "API_ERROR", error };
            } finally {
                lock.releaseLock("REFRESH_TOKEN_USE");
            }
        }
        let idCookieValue = await getIdRefreshToken(false);
        if (idCookieValue.status === "NOT_EXISTS") {
            // removed by server. So we logout
            return { result: "SESSION_EXPIRED" };
        } else {
            if (
                idCookieValue.status !== preRequestIdToken.status ||
                (idCookieValue.status === "EXISTS" &&
                    preRequestIdToken.status === "EXISTS" &&
                    idCookieValue.token !== preRequestIdToken.token)
            ) {
                return { result: "RETRY" };
            }
            // here we try to call the API again since we probably failed to acquire lock and nothing has changed.
        }
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
    async function getIdRefreshTokenFromLocal(): Promise<string | undefined> {
        function getIDFromCookieOld(): string | undefined {
            let value = "; " + getWindowOrThrow().document.cookie;
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

        let fromCookie = getIDFromCookieOld();
        if (fromCookie !== undefined) {
            return fromCookie;
        }

        let fromLocalstorage = await AuthHttpRequest.crossDomainLocalstorage.getItem(ID_REFRESH_TOKEN_NAME);
        if (fromLocalstorage !== null) {
            await setIdRefreshToken(fromLocalstorage);
        }

        return fromLocalstorage === null ? undefined : fromLocalstorage;
    }

    let token = await getIdRefreshTokenFromLocal();

    if (token === "remove") {
        return {
            status: "NOT_EXISTS"
        };
    }

    if (token === undefined) {
        let response: IdRefreshTokenType = {
            status: "MAY_EXIST"
        };
        if (tryRefresh) {
            // either session doesn't exist, or the
            // cookies have expired (privacy feature that caps lifetime of cookies to 7 days)
            try {
                await handleUnauthorised(
                    AuthHttpRequest.refreshTokenUrl,
                    response,
                    AuthHttpRequest.refreshAPICustomHeaders,
                    AuthHttpRequest.sessionExpiredStatusCode
                );
            } catch (err) {
                // in case the backend is not working, we treat it as the session not existing...
                return {
                    status: "NOT_EXISTS"
                };
            }
            return await getIdRefreshToken(tryRefresh);
        } else {
            return response;
        }
    }

    return {
        status: "EXISTS",
        token
    };
}

export async function setIdRefreshToken(idRefreshToken: string) {
    function setIDToCookie(idRefreshToken: string, domain: string) {
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
            expires = new Date(Number(splitted[1])).toUTCString();
        }
        if (domain === "localhost" || domain === window.location.hostname) {
            // since some browsers ignore cookies with domain set to localhost
            // see https://github.com/supertokens/supertokens-website/issues/25
            getWindowOrThrow().document.cookie = `${ID_REFRESH_TOKEN_NAME}=${cookieVal};expires=${expires};path=/;samesite=${
                AuthHttpRequest.isInIframe ? "none" : "lax"
            }`;
        } else {
            getWindowOrThrow().document.cookie = `${ID_REFRESH_TOKEN_NAME}=${cookieVal};expires=${expires};domain=${domain};path=/;samesite=${
                AuthHttpRequest.isInIframe ? "none" : "lax"
            }`;
        }
    }

    setIDToCookie(
        idRefreshToken,
        AuthHttpRequest.sessionScope === undefined
            ? normaliseSessionScopeOrThrowError(getWindowOrThrow().location.hostname)
            : AuthHttpRequest.sessionScope.scope
    );

    await AuthHttpRequest.crossDomainLocalstorage.removeItem(ID_REFRESH_TOKEN_NAME);
}

async function getAntiCSRFToken(): Promise<string | null> {
    if (!(await AuthHttpRequest.doesSessionExist())) {
        return null;
    }

    function getAntiCSRFromCookie(): string | null {
        let value = "; " + getWindowOrThrow().document.cookie;
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

    let fromCookie = getAntiCSRFromCookie();
    if (fromCookie !== null) {
        return fromCookie;
    }

    let fromLocalstorage = await AuthHttpRequest.crossDomainLocalstorage.getItem(ANTI_CSRF_NAME);
    if (fromLocalstorage !== null) {
        await setAntiCSRF(fromLocalstorage);
    }

    return fromLocalstorage;
}

// give antiCSRFToken as undefined to remove it.
export async function setAntiCSRF(antiCSRFToken: string | undefined) {
    function setAntiCSRFToCookie(antiCSRFToken: string | undefined, domain: string) {
        let expires: string | undefined = "Thu, 01 Jan 1970 00:00:01 GMT";
        let cookieVal = "";
        if (antiCSRFToken !== undefined) {
            cookieVal = antiCSRFToken;
            expires = undefined; // set cookie without expiry
        }
        if (domain === "localhost" || domain === window.location.hostname) {
            // since some browsers ignore cookies with domain set to localhost
            // see https://github.com/supertokens/supertokens-website/issues/25
            if (expires !== undefined) {
                getWindowOrThrow().document.cookie = `${ANTI_CSRF_NAME}=${cookieVal};expires=${expires};path=/;samesite=${
                    AuthHttpRequest.isInIframe ? "none" : "lax"
                }`;
            } else {
                getWindowOrThrow().document.cookie = `${ANTI_CSRF_NAME}=${cookieVal};expires=Fri, 31 Dec 9999 23:59:59 GMT;path=/;samesite=${
                    AuthHttpRequest.isInIframe ? "none" : "lax"
                }`;
            }
        } else {
            if (expires !== undefined) {
                getWindowOrThrow().document.cookie = `${ANTI_CSRF_NAME}=${cookieVal};expires=${expires};domain=${domain};path=/;samesite=${
                    AuthHttpRequest.isInIframe ? "none" : "lax"
                }`;
            } else {
                getWindowOrThrow().document.cookie = `${ANTI_CSRF_NAME}=${cookieVal};domain=${domain};expires=Fri, 31 Dec 9999 23:59:59 GMT;path=/;samesite=${
                    AuthHttpRequest.isInIframe ? "none" : "lax"
                }`;
            }
        }
    }

    setAntiCSRFToCookie(
        antiCSRFToken,
        AuthHttpRequest.sessionScope === undefined
            ? normaliseSessionScopeOrThrowError(getWindowOrThrow().location.hostname)
            : AuthHttpRequest.sessionScope.scope
    );

    await AuthHttpRequest.crossDomainLocalstorage.removeItem(ANTI_CSRF_NAME);
}

export async function getFrontToken(): Promise<string | null> {
    if (!(await AuthHttpRequest.doesSessionExist())) {
        return null;
    }

    function getFrontTokenFromCookie(): string | null {
        let value = "; " + getWindowOrThrow().document.cookie;
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

    let fromCookie = getFrontTokenFromCookie();
    if (fromCookie !== null) {
        return fromCookie;
    }

    let fromLocalstorage = await AuthHttpRequest.crossDomainLocalstorage.getItem(FRONT_TOKEN_NAME);
    if (fromLocalstorage !== null) {
        await setFrontToken(fromLocalstorage);
    }

    return fromLocalstorage;
}

export async function setFrontToken(frontToken: string | undefined) {
    function setFrontTokenToCookie(frontToken: string | undefined, domain: string) {
        let expires: string | undefined = "Thu, 01 Jan 1970 00:00:01 GMT";
        let cookieVal = "";
        if (frontToken !== undefined) {
            cookieVal = frontToken;
            expires = undefined; // set cookie without expiry
        }
        if (domain === "localhost" || domain === window.location.hostname) {
            // since some browsers ignore cookies with domain set to localhost
            // see https://github.com/supertokens/supertokens-website/issues/25
            if (expires !== undefined) {
                getWindowOrThrow().document.cookie = `${FRONT_TOKEN_NAME}=${cookieVal};expires=${expires};path=/;samesite=${
                    AuthHttpRequest.isInIframe ? "none" : "lax"
                }`;
            } else {
                getWindowOrThrow().document.cookie = `${FRONT_TOKEN_NAME}=${cookieVal};expires=Fri, 31 Dec 9999 23:59:59 GMT;path=/;samesite=${
                    AuthHttpRequest.isInIframe ? "none" : "lax"
                }`;
            }
        } else {
            if (expires !== undefined) {
                getWindowOrThrow().document.cookie = `${FRONT_TOKEN_NAME}=${cookieVal};expires=${expires};domain=${domain};path=/;samesite=${
                    AuthHttpRequest.isInIframe ? "none" : "lax"
                }`;
            } else {
                getWindowOrThrow().document.cookie = `${FRONT_TOKEN_NAME}=${cookieVal};domain=${domain};expires=Fri, 31 Dec 9999 23:59:59 GMT;path=/;samesite=${
                    AuthHttpRequest.isInIframe ? "none" : "lax"
                }`;
            }
        }
    }

    setFrontTokenToCookie(
        frontToken,
        AuthHttpRequest.sessionScope === undefined
            ? normaliseSessionScopeOrThrowError(getWindowOrThrow().location.hostname)
            : AuthHttpRequest.sessionScope.scope
    );

    await AuthHttpRequest.crossDomainLocalstorage.removeItem(FRONT_TOKEN_NAME);
}
