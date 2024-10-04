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
import { AxiosPromise, AxiosRequestConfig as OriginalAxiosRequestConfig, AxiosResponse } from "axios";
import { createAxiosErrorFromFetchResp } from "./axiosError";

import AuthHttpRequestFetch, {
    AntiCsrfToken,
    getLocalSessionState,
    FrontToken,
    onUnauthorisedResponse,
    onInvalidClaimResponse,
    setToken,
    fireSessionUpdateEventsIfNecessary,
    getTokenForHeaderAuth,
    updateClockSkewUsingFrontToken
} from "./fetch";
import { PROCESS_STATE, ProcessState } from "./processState";
import WindowHandlerReference from "./utils/windowHandler";
import { logDebugMessage } from "./logger";

type AxiosRequestConfig<T = any> = OriginalAxiosRequestConfig<T> & {
    __supertokensSessionRefreshAttempts?: number;
    __supertokensAddedAuthHeader?: boolean;
};

function incrementSessionRefreshAttemptCount(config: AxiosRequestConfig) {
    if (config.__supertokensSessionRefreshAttempts === undefined) {
        config.__supertokensSessionRefreshAttempts = 0;
    }
    config.__supertokensSessionRefreshAttempts++;
}

function hasExceededMaxSessionRefreshAttempts(config: AxiosRequestConfig): boolean {
    if (config.__supertokensSessionRefreshAttempts === undefined) {
        config.__supertokensSessionRefreshAttempts = 0;
    }

    return config.__supertokensSessionRefreshAttempts >= AuthHttpRequestFetch.config.maxRetryAttemptsForSessionRefresh;
}

function getUrlFromConfig(config: AxiosRequestConfig) {
    let url: string = config.url === undefined ? "" : config.url;
    let baseURL: string | undefined = config.baseURL;
    if (baseURL !== undefined) {
        if (url.charAt(0) === "/" && baseURL.charAt(baseURL.length - 1) === "/") {
            url = baseURL + url.substr(1);
        } else if (url.charAt(0) !== "/" && baseURL.charAt(baseURL.length - 1) !== "/") {
            url = baseURL + "/" + url;
        } else {
            url = baseURL + url;
        }
    }
    return url;
}

export async function interceptorFunctionRequestFulfilled(config: AxiosRequestConfig) {
    logDebugMessage("interceptorFunctionRequestFulfilled: started axios interception");
    let url = getUrlFromConfig(config);

    let doNotDoInterception = false;
    try {
        doNotDoInterception =
            typeof url === "string" &&
            !AuthHttpRequestFetch.recipeImpl.shouldDoInterceptionBasedOnUrl(
                url,
                AuthHttpRequestFetch.config.apiDomain,
                AuthHttpRequestFetch.config.sessionTokenBackendDomain
            );
    } catch (err) {
        if ((err as any).message === "Please provide a valid domain name") {
            logDebugMessage(
                "interceptorFunctionRequestFulfilled: Trying shouldDoInterceptionBasedOnUrl with location.origin"
            );
            // .origin gives the port as well..
            doNotDoInterception = !AuthHttpRequestFetch.recipeImpl.shouldDoInterceptionBasedOnUrl(
                WindowHandlerReference.getReferenceOrThrow().windowHandler.location.getOrigin(),
                AuthHttpRequestFetch.config.apiDomain,
                AuthHttpRequestFetch.config.sessionTokenBackendDomain
            );
        } else {
            throw err;
        }
    }
    logDebugMessage("interceptorFunctionRequestFulfilled: Value of doNotDoInterception: " + doNotDoInterception);
    if (doNotDoInterception) {
        logDebugMessage("interceptorFunctionRequestFulfilled: Returning config unchanged");
        // this check means that if you are using axios via inteceptor, then we only do the refresh steps if you are calling your APIs.
        return config;
    }
    logDebugMessage("interceptorFunctionRequestFulfilled: Modifying config");
    ProcessState.getInstance().addState(PROCESS_STATE.CALLING_INTERCEPTION_REQUEST);
    const preRequestLSS = await getLocalSessionState(true);
    let configWithAntiCsrf: AxiosRequestConfig = config;
    if (preRequestLSS.status === "EXISTS") {
        const antiCsrfToken = await AntiCsrfToken.getToken(preRequestLSS.lastAccessTokenUpdate);
        if (antiCsrfToken !== undefined) {
            logDebugMessage("interceptorFunctionRequestFulfilled: Adding anti-csrf token to request");
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

    if (AuthHttpRequestFetch.config.autoAddCredentials && configWithAntiCsrf.withCredentials === undefined) {
        logDebugMessage("interceptorFunctionRequestFulfilled: Adding credentials include");
        configWithAntiCsrf = {
            ...configWithAntiCsrf,
            withCredentials: true
        };
    }

    // adding rid for anti-csrf protection: Anti-csrf via custom header
    logDebugMessage(
        "interceptorFunctionRequestFulfilled: Adding rid header: anti-csrf (it may be overriden by the user's provided rid)"
    );
    configWithAntiCsrf = {
        ...configWithAntiCsrf,
        headers:
            configWithAntiCsrf === undefined
                ? {
                      rid: "anti-csrf"
                  }
                : {
                      rid: "anti-csrf",
                      ...configWithAntiCsrf.headers
                  }
    };

    const transferMethod = AuthHttpRequestFetch.config.tokenTransferMethod;
    logDebugMessage("interceptorFunctionRequestFulfilled: Adding st-auth-mode header: " + transferMethod);
    configWithAntiCsrf.headers!["st-auth-mode"] = transferMethod;

    configWithAntiCsrf = await removeAuthHeaderIfMatchesLocalToken(configWithAntiCsrf);

    await setAuthorizationHeaderIfRequired(configWithAntiCsrf);

    logDebugMessage("interceptorFunctionRequestFulfilled: returning modified config");
    return configWithAntiCsrf;
}

export function responseInterceptor(axiosInstance: any) {
    return async (response: AxiosResponse) => {
        let doNotDoInterception = false;
        if (!AuthHttpRequestFetch.initCalled) {
            throw new Error("init function not called");
        }
        logDebugMessage("responseInterceptor: started");
        logDebugMessage(
            "responseInterceptor: already intercepted: " + response.headers["x-supertokens-xhr-intercepted"]
        );
        let url = getUrlFromConfig(response.config);

        try {
            doNotDoInterception =
                (typeof url === "string" &&
                    !AuthHttpRequestFetch.recipeImpl.shouldDoInterceptionBasedOnUrl(
                        url,
                        AuthHttpRequestFetch.config.apiDomain,
                        AuthHttpRequestFetch.config.sessionTokenBackendDomain
                    )) ||
                !!response.headers["x-supertokens-xhr-intercepted"];
        } catch (err) {
            if ((err as any).message === "Please provide a valid domain name") {
                logDebugMessage("responseInterceptor: Trying shouldDoInterceptionBasedOnUrl with location.origin");
                // .origin gives the port as well..
                doNotDoInterception =
                    !AuthHttpRequestFetch.recipeImpl.shouldDoInterceptionBasedOnUrl(
                        WindowHandlerReference.getReferenceOrThrow().windowHandler.location.getOrigin(),
                        AuthHttpRequestFetch.config.apiDomain,
                        AuthHttpRequestFetch.config.sessionTokenBackendDomain
                    ) || !!response.headers["x-supertokens-xhr-intercepted"];
            } else {
                throw err;
            }
        }
        logDebugMessage("responseInterceptor: Value of doNotDoInterception: " + doNotDoInterception);
        if (doNotDoInterception) {
            logDebugMessage("responseInterceptor: Returning without interception");
            // this check means that if you are using axios via inteceptor, then we only do the refresh steps if you are calling your APIs.
            return response;
        }
        logDebugMessage("responseInterceptor: Interception started");

        ProcessState.getInstance().addState(PROCESS_STATE.CALLING_INTERCEPTION_RESPONSE);

        // This is preRequest, because we read the state before saving the updates from the response
        const preRequestLSS = await getLocalSessionState(false);
        await saveTokensFromHeaders(response);

        fireSessionUpdateEventsIfNecessary(
            preRequestLSS.status === "EXISTS",
            response.status,
            response.headers["front-token"]
        );
        if (response.status === AuthHttpRequestFetch.config.sessionExpiredStatusCode) {
            logDebugMessage("responseInterceptor: Status code is: " + response.status);
            let config = response.config;
            return AuthHttpRequest.doRequest(
                (config: AxiosRequestConfig) => {
                    // we create an instance since we don't want to intercept this.
                    // const instance = axios.create();
                    // return instance(config);
                    return axiosInstance(config);
                },
                config,
                url,
                response,
                undefined,
                true
            );
        } else {
            if (response.status === AuthHttpRequestFetch.config.invalidClaimStatusCode) {
                // only fire event if body is defined.
                await onInvalidClaimResponse(response);
            }

            return response;
        }
    };
}

export function responseErrorInterceptor(axiosInstance: any) {
    return async (error: any) => {
        logDebugMessage("responseErrorInterceptor: called");
        logDebugMessage(
            "responseErrorInterceptor: already intercepted: " +
                (error.response && error.response.headers["x-supertokens-xhr-intercepted"])
        );
        if (error.response === undefined || error.response.headers["x-supertokens-xhr-intercepted"]) {
            throw error;
        }
        if (
            error.response !== undefined &&
            error.response.status === AuthHttpRequestFetch.config.sessionExpiredStatusCode
        ) {
            logDebugMessage("responseErrorInterceptor: Status code is: " + error.response.status);
            let config = error.config;
            return AuthHttpRequest.doRequest(
                (config: AxiosRequestConfig) => {
                    // we create an instance since we don't want to intercept this.
                    // const instance = axios.create();
                    // return instance(config);
                    return axiosInstance(config);
                },
                config,
                getUrlFromConfig(config),
                undefined,
                error,
                true
            );
        } else {
            if (
                error.response !== undefined &&
                error.response.status === AuthHttpRequestFetch.config.invalidClaimStatusCode
            ) {
                await onInvalidClaimResponse(error.response);
            }
            throw error;
        }
    };
}

/**
 * @class AuthHttpRequest
 * @description wrapper for common http methods.
 */
export default class AuthHttpRequest {
    /**
     * @description sends the actual http request and returns a response if successful/
     * If not successful due to session expiry reasons, it
     * attempts to call the refresh token API and if that is successful, calls this API again.
     * @throws Error
     */
    static doRequest = async (
        httpCall: (config: AxiosRequestConfig) => AxiosPromise<any>,
        config: AxiosRequestConfig,
        url?: string,
        prevResponse?: AxiosResponse,
        prevError?: any,
        viaInterceptor: boolean = false
    ): Promise<AxiosResponse<any>> => {
        if (!AuthHttpRequestFetch.initCalled) {
            throw Error("init function not called");
        }
        logDebugMessage("doRequest: called");

        let doNotDoInterception = false;
        try {
            doNotDoInterception =
                typeof url === "string" &&
                !AuthHttpRequestFetch.recipeImpl.shouldDoInterceptionBasedOnUrl(
                    url,
                    AuthHttpRequestFetch.config.apiDomain,
                    AuthHttpRequestFetch.config.sessionTokenBackendDomain
                ) &&
                viaInterceptor;
        } catch (err) {
            if ((err as any).message === "Please provide a valid domain name") {
                logDebugMessage("doRequest: Trying shouldDoInterceptionBasedOnUrl with location.origin");
                // .origin gives the port as well..
                doNotDoInterception =
                    !AuthHttpRequestFetch.recipeImpl.shouldDoInterceptionBasedOnUrl(
                        WindowHandlerReference.getReferenceOrThrow().windowHandler.location.getOrigin(),
                        AuthHttpRequestFetch.config.apiDomain,
                        AuthHttpRequestFetch.config.sessionTokenBackendDomain
                    ) && viaInterceptor;
            } else {
                throw err;
            }
        }

        logDebugMessage("doRequest: Value of doNotDoInterception: " + doNotDoInterception);
        if (doNotDoInterception) {
            logDebugMessage("doRequest: Returning without interception");
            if (prevError !== undefined) {
                throw prevError;
            } else if (prevResponse !== undefined) {
                return prevResponse;
            }
            return await httpCall(config);
        }
        logDebugMessage("doRequest: Interception started");

        config = await removeAuthHeaderIfMatchesLocalToken(config);
        let returnObj = undefined;
        while (true) {
            // we read this here so that if there is a session expiry error, then we can compare this value (that caused the error) with the value after the request is sent.
            // to avoid race conditions
            const preRequestLSS = await getLocalSessionState(true);
            let configWithAntiCsrf: AxiosRequestConfig = config;

            if (preRequestLSS.status === "EXISTS") {
                const antiCsrfToken = await AntiCsrfToken.getToken(preRequestLSS.lastAccessTokenUpdate);
                if (antiCsrfToken !== undefined) {
                    logDebugMessage("doRequest: Adding anti-csrf token to request");
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

            if (AuthHttpRequestFetch.config.autoAddCredentials && configWithAntiCsrf.withCredentials === undefined) {
                logDebugMessage("doRequest: Adding credentials include");
                configWithAntiCsrf = {
                    ...configWithAntiCsrf,
                    withCredentials: true
                };
            }

            // adding rid for anti-csrf protection: Anti-csrf via custom header
            logDebugMessage("doRequest: Adding rid header: anti-csrf (May get overriden by user's rid)");
            configWithAntiCsrf = {
                ...configWithAntiCsrf,
                headers:
                    configWithAntiCsrf === undefined
                        ? {
                              rid: "anti-csrf"
                          }
                        : {
                              rid: "anti-csrf",
                              ...configWithAntiCsrf.headers
                          }
            };

            const transferMethod = AuthHttpRequestFetch.config.tokenTransferMethod;
            logDebugMessage("doRequest: Adding st-auth-mode header: " + transferMethod);
            configWithAntiCsrf.headers!["st-auth-mode"] = transferMethod;

            await setAuthorizationHeaderIfRequired(configWithAntiCsrf);

            try {
                // the first time it comes here and if
                // prevError or prevResponse are not undefined
                // it means that we had already made the first API call.
                // So we directly try and do the refreshing by throwing this
                // prevError, and then whey that retries, then prevError will be undefined
                // which will result in the user's API being called.
                let localPrevError = prevError;
                let localPrevResponse = prevResponse;
                prevError = undefined;
                prevResponse = undefined;
                if (localPrevError !== undefined) {
                    logDebugMessage("doRequest: Not making call because localPrevError is not undefined");
                    throw localPrevError;
                }
                if (localPrevResponse !== undefined) {
                    logDebugMessage("doRequest: Not making call because localPrevResponse is not undefined");
                } else {
                    logDebugMessage("doRequest: Making user's http call");
                }

                let response = localPrevResponse === undefined ? await httpCall(configWithAntiCsrf) : localPrevResponse;

                // NOTE: No need to check for unauthorized response status here for session refresh,
                // as we only reach this point on a successful response. Axios handles error responses
                // by throwing an error, which is handled in the catch block.

                logDebugMessage("doRequest: User's http call ended");

                await saveTokensFromHeaders(response);

                fireSessionUpdateEventsIfNecessary(
                    preRequestLSS.status === "EXISTS",
                    response.status,
                    response.headers["front-token"]
                );
                return response;
            } catch (err) {
                const response = (err as any).response;
                if (response !== undefined) {
                    await saveTokensFromHeaders(response);

                    fireSessionUpdateEventsIfNecessary(
                        preRequestLSS.status === "EXISTS",
                        response.status,
                        response.headers["front-token"]
                    );
                    if (response.status === AuthHttpRequestFetch.config.sessionExpiredStatusCode) {
                        logDebugMessage("doRequest: Status code is: " + response.status);

                        /**
                         * An API may return a 401 error response even with a valid session, causing a session refresh loop in the interceptor.
                         * To prevent this infinite loop, we break out of the loop after retrying the original request a specified number of times.
                         * The maximum number of retry attempts is defined by maxRetryAttemptsForSessionRefresh config variable.
                         */
                        if (hasExceededMaxSessionRefreshAttempts(config)) {
                            logDebugMessage(
                                `doRequest: Maximum session refresh attempts reached. sessionRefreshAttempts: ${config.__supertokensSessionRefreshAttempts}, maxRetryAttemptsForSessionRefresh: ${AuthHttpRequestFetch.config.maxRetryAttemptsForSessionRefresh}`
                            );

                            const errorMessage = `Received a 401 response from ${url}. Attempted to refresh the session and retry the request with the updated session tokens ${AuthHttpRequestFetch.config.maxRetryAttemptsForSessionRefresh} times, but each attempt resulted in a 401 error. The maximum session refresh limit has been reached. Please investigate your API. To increase the session refresh attempts, update maxRetryAttemptsForSessionRefresh in the config.`;
                            console.error(errorMessage);
                            throw new Error(errorMessage);
                        }

                        const refreshResult = await onUnauthorisedResponse(preRequestLSS);

                        incrementSessionRefreshAttemptCount(config);
                        logDebugMessage(
                            "doRequest: sessionRefreshAttempts: " + config.__supertokensSessionRefreshAttempts
                        );

                        if (refreshResult.result !== "RETRY") {
                            logDebugMessage("doRequest: Not retrying original request");
                            // Returning refreshResult.error as an Axios Error if we attempted a refresh
                            // Returning the original error if we did not attempt refreshing
                            returnObj =
                                refreshResult.error !== undefined
                                    ? await createAxiosErrorFromFetchResp(refreshResult.error)
                                    : err;
                            break;
                        }
                        logDebugMessage("doRequest: Retrying original request");
                    } else {
                        if (response.status === AuthHttpRequestFetch.config.invalidClaimStatusCode) {
                            await onInvalidClaimResponse(response);
                        }
                        throw err;
                    }
                } else {
                    throw err;
                }
            }
        }
        // if it comes here, means we called break. which happens only if we have logged out.
        // which means it's a 401, so we throw
        throw returnObj;
    };
}

async function setAuthorizationHeaderIfRequired(requestConfig: AxiosRequestConfig) {
    if (requestConfig.headers === undefined) {
        // This is makes TS happy
        requestConfig.headers = {};
    }

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
        if (
            requestConfig.headers["Authorization"] !== undefined ||
            requestConfig.headers["authorization"] !== undefined
        ) {
            logDebugMessage("setAuthorizationHeaderIfRequired: Authorization header defined by the user, not adding");
        } else {
            logDebugMessage("setAuthorizationHeaderIfRequired: added authorization header");
            requestConfig.headers = {
                ...requestConfig.headers,
                Authorization: `Bearer ${accessToken}`
            };
            (requestConfig as any).__supertokensAddedAuthHeader = true;
        }
    } else {
        logDebugMessage("setAuthorizationHeaderIfRequired: token for header based auth not found");
    }
}

async function saveTokensFromHeaders(response: AxiosResponse) {
    logDebugMessage("saveTokensFromHeaders: Saving updated tokens from the response");
    const refreshToken = response.headers["st-refresh-token"];
    if (refreshToken !== undefined) {
        logDebugMessage("saveTokensFromHeaders: saving new refresh token");
        await setToken("refresh", refreshToken);
    }

    const accessToken = response.headers["st-access-token"];
    if (accessToken !== undefined) {
        logDebugMessage("saveTokensFromHeaders: saving new access token");
        await setToken("access", accessToken);
    }

    const frontToken = response.headers["front-token"];
    if (frontToken !== undefined) {
        logDebugMessage("doRequest: Setting sFrontToken: " + frontToken);
        await FrontToken.setItem(frontToken);

        // Converting axios headers to fetch headers to pass to updateClockSkewUsingFrontToken
        const responseHeaders = new Headers();
        Object.entries(response.headers).forEach(([key, value]) => {
            Array.isArray(value)
                ? value.forEach(item => responseHeaders.append(key, item))
                : responseHeaders.append(key, value);
        });
        updateClockSkewUsingFrontToken({ frontToken, responseHeaders });
    }

    const antiCsrfToken = response.headers["anti-csrf"];
    if (antiCsrfToken !== undefined) {
        // At this point, the session has either been newly created or refreshed.
        // Thus, there's no need to call getLocalSessionState with tryRefresh: true.
        // Calling getLocalSessionState with tryRefresh: true will cause a refresh loop
        // if cookie writes are disabled.
        const tok = await getLocalSessionState(false);
        if (tok.status === "EXISTS") {
            logDebugMessage("doRequest: Setting anti-csrf token");
            await AntiCsrfToken.setItem(tok.lastAccessTokenUpdate, antiCsrfToken);
        }
    }
}

async function removeAuthHeaderIfMatchesLocalToken(config: AxiosRequestConfig<any>) {
    const accessToken = await getTokenForHeaderAuth("access");
    const refreshToken = await getTokenForHeaderAuth("refresh");
    const authHeader = config.headers!.Authorization || config.headers!.authorization;

    if (accessToken !== undefined && refreshToken !== undefined) {
        if (authHeader === `Bearer ${accessToken}` || "__supertokensAddedAuthHeader" in config) {
            // We are ignoring the Authorization header set by the user in this case, because it would cause issues
            // If we do not ignore this, then this header would be used even if the request is being retried after a refresh, even though it contains an outdated access token.
            // This causes an infinite refresh loop.
            logDebugMessage(
                "removeAuthHeaderIfMatchesLocalToken: Removing Authorization from user provided headers because it contains our access token"
            );
            const res = { ...config, headers: { ...config.headers } };
            delete res.headers.authorization;
            delete res.headers.Authorization;
            return res;
        }
    }
    return config;
}
