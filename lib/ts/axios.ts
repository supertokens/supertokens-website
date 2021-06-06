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
import { AxiosPromise, AxiosRequestConfig, AxiosResponse } from "axios";

import AuthHttpRequestFetch, {
    AntiCsrfToken,
    handleUnauthorised,
    getIdRefreshToken,
    setIdRefreshToken,
    FrontToken
} from "./fetch";
import { PROCESS_STATE, ProcessState } from "./processState";
import { shouldDoInterceptionBasedOnUrl } from "./utils";

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
    let url = getUrlFromConfig(config);

    let doNotDoInterception = false;
    try {
        doNotDoInterception =
            typeof url === "string" &&
            !shouldDoInterceptionBasedOnUrl(url, AuthHttpRequestFetch.apiDomain, AuthHttpRequestFetch.cookieDomain);
    } catch (err) {
        if (err.message === "Please provide a valid domain name") {
            // .origin gives the port as well..
            doNotDoInterception = !shouldDoInterceptionBasedOnUrl(
                window.location.origin,
                AuthHttpRequestFetch.apiDomain,
                AuthHttpRequestFetch.cookieDomain
            );
        } else {
            throw err;
        }
    }
    if (doNotDoInterception) {
        // this check means that if you are using axios via inteceptor, then we only do the refresh steps if you are calling your APIs.
        return config;
    }

    ProcessState.getInstance().addState(PROCESS_STATE.CALLING_INTERCEPTION_REQUEST);
    const preRequestIdToken = await getIdRefreshToken(true);
    let configWithAntiCsrf: AxiosRequestConfig = config;
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

    if (AuthHttpRequestFetch.autoAddCredentials && configWithAntiCsrf.withCredentials === undefined) {
        configWithAntiCsrf = {
            ...configWithAntiCsrf,
            withCredentials: true
        };
    }

    // adding rid for anti-csrf protection: Anti-csrf via custom header
    configWithAntiCsrf = {
        ...configWithAntiCsrf,
        headers:
            configWithAntiCsrf === undefined
                ? {
                      rid: AuthHttpRequestFetch.rid
                  }
                : {
                      rid: AuthHttpRequestFetch.rid,
                      ...configWithAntiCsrf.headers
                  }
    };

    return configWithAntiCsrf;
}

export function responseInterceptor(axiosInstance: any) {
    return async (response: AxiosResponse) => {
        let doNotDoInterception = false;
        try {
            if (!AuthHttpRequestFetch.initCalled) {
                throw new Error("init function not called");
            }
            let url = getUrlFromConfig(response.config);

            try {
                doNotDoInterception =
                    typeof url === "string" &&
                    !shouldDoInterceptionBasedOnUrl(
                        url,
                        AuthHttpRequestFetch.apiDomain,
                        AuthHttpRequestFetch.cookieDomain
                    );
            } catch (err) {
                if (err.message === "Please provide a valid domain name") {
                    // .origin gives the port as well..
                    doNotDoInterception = !shouldDoInterceptionBasedOnUrl(
                        window.location.origin,
                        AuthHttpRequestFetch.apiDomain,
                        AuthHttpRequestFetch.cookieDomain
                    );
                } else {
                    throw err;
                }
            }
            if (doNotDoInterception) {
                // this check means that if you are using axios via inteceptor, then we only do the refresh steps if you are calling your APIs.
                return response;
            }

            ProcessState.getInstance().addState(PROCESS_STATE.CALLING_INTERCEPTION_RESPONSE);

            let idRefreshToken = response.headers["id-refresh-token"];
            if (idRefreshToken !== undefined) {
                await setIdRefreshToken(idRefreshToken);
            }
            if (response.status === AuthHttpRequestFetch.sessionExpiredStatusCode) {
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
                    true
                );
            } else {
                let antiCsrfToken = response.headers["anti-csrf"];
                if (antiCsrfToken !== undefined) {
                    let tok = await getIdRefreshToken(true);
                    if (tok.status === "EXISTS") {
                        await AntiCsrfToken.setItem(tok.token, antiCsrfToken);
                    }
                }
                let frontToken = response.headers["front-token"];
                if (frontToken !== undefined) {
                    await FrontToken.setItem(frontToken);
                }
                return response;
            }
        } finally {
            if (!doNotDoInterception && !(await AuthHttpRequestFetch.recipeImpl.doesSessionExist())) {
                await AntiCsrfToken.removeToken();
                await FrontToken.removeToken();
            }
        }
    };
}

export function responseErrorInterceptor(axiosInstance: any) {
    return (error: any) => {
        if (error.response !== undefined && error.response.status === AuthHttpRequestFetch.sessionExpiredStatusCode) {
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

        let doNotDoInterception = false;
        try {
            doNotDoInterception =
                typeof url === "string" &&
                !shouldDoInterceptionBasedOnUrl(
                    url,
                    AuthHttpRequestFetch.apiDomain,
                    AuthHttpRequestFetch.cookieDomain
                ) &&
                viaInterceptor;
        } catch (err) {
            if (err.message === "Please provide a valid domain name") {
                // .origin gives the port as well..
                doNotDoInterception =
                    !shouldDoInterceptionBasedOnUrl(
                        window.location.origin,
                        AuthHttpRequestFetch.apiDomain,
                        AuthHttpRequestFetch.cookieDomain
                    ) && viaInterceptor;
            } else {
                throw err;
            }
        }

        if (doNotDoInterception) {
            if (prevError !== undefined) {
                throw prevError;
            } else if (prevResponse !== undefined) {
                return prevResponse;
            }
            return await httpCall(config);
        }

        try {
            let throwError = false;
            let returnObj = undefined;
            while (true) {
                // we read this here so that if there is a session expiry error, then we can compare this value (that caused the error) with the value after the request is sent.
                // to avoid race conditions
                const preRequestIdToken = await getIdRefreshToken(true);
                let configWithAntiCsrf: AxiosRequestConfig = config;

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

                if (AuthHttpRequestFetch.autoAddCredentials && configWithAntiCsrf.withCredentials === undefined) {
                    configWithAntiCsrf = {
                        ...configWithAntiCsrf,
                        withCredentials: true
                    };
                }

                // adding rid for anti-csrf protection: Anti-csrf via custom header
                configWithAntiCsrf = {
                    ...configWithAntiCsrf,
                    headers:
                        configWithAntiCsrf === undefined
                            ? {
                                  rid: AuthHttpRequestFetch.rid
                              }
                            : {
                                  rid: AuthHttpRequestFetch.rid,
                                  ...configWithAntiCsrf.headers
                              }
                };
                try {
                    let localPrevError = prevError;
                    let localPrevResponse = prevResponse;
                    prevError = undefined;
                    prevResponse = undefined;
                    if (localPrevError !== undefined) {
                        throw localPrevError;
                    }
                    let response =
                        localPrevResponse === undefined ? await httpCall(configWithAntiCsrf) : localPrevResponse;
                    let idRefreshToken = response.headers["id-refresh-token"];
                    if (idRefreshToken !== undefined) {
                        await setIdRefreshToken(idRefreshToken);
                    }
                    if (response.status === AuthHttpRequestFetch.sessionExpiredStatusCode) {
                        let retry = await handleUnauthorised(
                            AuthHttpRequestFetch.refreshTokenUrl,
                            preRequestIdToken,
                            AuthHttpRequestFetch.refreshAPICustomHeaders,
                            AuthHttpRequestFetch.sessionExpiredStatusCode
                        );
                        if (!retry) {
                            returnObj = response;
                            break;
                        }
                    } else {
                        let antiCsrfToken = response.headers["anti-csrf"];
                        if (antiCsrfToken !== undefined) {
                            let tok = await getIdRefreshToken(true);
                            if (tok.status === "EXISTS") {
                                await AntiCsrfToken.setItem(tok.token, antiCsrfToken);
                            }
                        }
                        let frontToken = response.headers["front-token"];
                        if (frontToken !== undefined) {
                            await FrontToken.setItem(frontToken);
                        }
                        return response;
                    }
                } catch (err) {
                    if (
                        err.response !== undefined &&
                        err.response.status === AuthHttpRequestFetch.sessionExpiredStatusCode
                    ) {
                        let retry = await handleUnauthorised(
                            AuthHttpRequestFetch.refreshTokenUrl,
                            preRequestIdToken,
                            AuthHttpRequestFetch.refreshAPICustomHeaders,
                            AuthHttpRequestFetch.sessionExpiredStatusCode
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
            // if it comes here, means we called break. which happens only if we have logged out.
            if (throwError) {
                throw returnObj;
            } else {
                return returnObj;
            }
        } finally {
            if (!(await AuthHttpRequestFetch.recipeImpl.doesSessionExist())) {
                await AntiCsrfToken.removeToken();
                await FrontToken.removeToken();
            }
        }
    };
}
