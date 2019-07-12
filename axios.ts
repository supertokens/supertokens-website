import axios, { AxiosPromise, AxiosRequestConfig, AxiosResponse } from "axios";

import FetchAuthRequest, { AntiCsrfToken, getDomainFromUrl, handleUnauthorised } from ".";
import { getIDFromCookie } from "./handleSessionExp";

async function interceptorFunctionRequestFulfilled(config: AxiosRequestConfig) {
    let url = config.url;
    if (typeof url === "string" && getDomainFromUrl(url) !== AuthHttpRequest.apiDomain) {
        // this check means that if you are using fetch via inteceptor, then we only do the refresh steps if you are calling your APIs.
        return config;
    }
    const preRequestIdToken = getIDFromCookie();
    const antiCsrfToken = AntiCsrfToken.getToken(preRequestIdToken);
    let configWithAntiCsrf: AxiosRequestConfig = config;
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
    return configWithAntiCsrf;
}

export function makeSuper(axiosInstance: any) {
    // we first check if this axiosInstance already has our interceptors.
    let requestInterceptors = axiosInstance.interceptors.request;
    for (let i = 0; i < requestInterceptors.handlers.length; i++) {
        if (requestInterceptors.handlers[i].fulfilled === interceptorFunctionRequestFulfilled) {
            return;
        }
    }
    // Add a request interceptor
    axiosInstance.interceptors.request.use(interceptorFunctionRequestFulfilled, async function(error: any) {
        return Promise.reject(error);
    });

    // Add a response interceptor
    axiosInstance.interceptors.response.use(
        async function(response: AxiosResponse) {
            if (!AuthHttpRequest.initCalled) {
                Promise.reject(new Error("init function not called"));
            }
            if (response.status === AuthHttpRequest.sessionExpiredStatusCode) {
                let config = response.config;
                return AuthHttpRequest.doRequest(
                    (config: AxiosRequestConfig) => {
                        // we create an instance since we don't want to intercept this.
                        const instance = axios.create();
                        return instance(config);
                    },
                    config,
                    config.url,
                    response,
                    true
                );
            } else {
                return response;
            }
        },
        async function(error: any) {
            if (!AuthHttpRequest.initCalled) {
                Promise.reject(new Error("init function not called"));
            }
            if (error.response !== undefined && error.response.status === AuthHttpRequest.sessionExpiredStatusCode) {
                let config = error.config;
                return AuthHttpRequest.doRequest(
                    (config: AxiosRequestConfig) => {
                        // we create an instance since we don't want to intercept this.
                        const instance = axios.create();
                        return instance(config);
                    },
                    config,
                    config.url,
                    undefined,
                    error,
                    true
                );
            } else {
                return Promise.reject(error);
            }
        }
    );
}

/**
 * @class AuthHttpRequest
 * @description wrapper for common http methods.
 */
export default class AuthHttpRequest {
    private static refreshTokenUrl: string | undefined;
    static sessionExpiredStatusCode = 440;
    static initCalled = false;
    static apiDomain = "";

    static init(refreshTokenUrl: string, sessionExpiredStatusCode?: number) {
        FetchAuthRequest.init(refreshTokenUrl, sessionExpiredStatusCode);
        AuthHttpRequest.refreshTokenUrl = refreshTokenUrl;
        if (sessionExpiredStatusCode !== undefined) {
            AuthHttpRequest.sessionExpiredStatusCode = sessionExpiredStatusCode;
        }
        AuthHttpRequest.apiDomain = getDomainFromUrl(refreshTokenUrl);
        AuthHttpRequest.initCalled = true;
    }

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
        if (!AuthHttpRequest.initCalled) {
            throw Error("init function not called");
        }
        if (typeof url === "string" && getDomainFromUrl(url) !== AuthHttpRequest.apiDomain && viaInterceptor) {
            if (prevError !== undefined) {
                throw prevError;
            } else if (prevResponse !== undefined) {
                return prevResponse;
            }
            // this check means that if you are using fetch via inteceptor, then we only do the refresh steps if you are calling your APIs.
            return await httpCall(config);
        }
        try {
            let throwError = false;
            let returnObj = undefined;
            while (true) {
                // we read this here so that if there is a session expiry error, then we can compare this value (that caused the error) with the value after the request is sent.
                // to avoid race conditions
                const preRequestIdToken = getIDFromCookie();
                const antiCsrfToken = AntiCsrfToken.getToken(preRequestIdToken);
                let configWithAntiCsrf: AxiosRequestConfig = config;
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
                    if (response.status === AuthHttpRequest.sessionExpiredStatusCode) {
                        let retry = await handleUnauthorised(AuthHttpRequest.refreshTokenUrl, preRequestIdToken);
                        if (!retry) {
                            returnObj = response;
                            break;
                        }
                    } else {
                        let antiCsrfToken = response.headers["anti-csrf"];
                        if (antiCsrfToken !== undefined) {
                            AntiCsrfToken.setItem(getIDFromCookie(), antiCsrfToken);
                        }
                        return response;
                    }
                } catch (err) {
                    if (
                        err.response !== undefined &&
                        err.response.status === AuthHttpRequest.sessionExpiredStatusCode
                    ) {
                        let retry = await handleUnauthorised(AuthHttpRequest.refreshTokenUrl, preRequestIdToken);
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
            if (getIDFromCookie() === undefined) {
                AntiCsrfToken.removeToken();
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
            const preRequestIdToken = getIDFromCookie();
            return await handleUnauthorised(AuthHttpRequest.refreshTokenUrl, preRequestIdToken);
        } finally {
            if (getIDFromCookie() === undefined) {
                AntiCsrfToken.removeToken();
            }
        }
    };

    static get = async <T = any, R = AxiosResponse<T>>(url: string, config?: AxiosRequestConfig) => {
        return await AuthHttpRequest.axios({
            method: "get",
            url,
            ...config
        });
    };

    static post = async <T = any, R = AxiosResponse<T>>(url: string, data?: any, config?: AxiosRequestConfig) => {
        return await AuthHttpRequest.axios({
            method: "post",
            url,
            data,
            ...config
        });
    };

    static delete = async <T = any, R = AxiosResponse<T>>(url: string, config?: AxiosRequestConfig) => {
        return await AuthHttpRequest.axios({
            method: "delete",
            url,
            ...config
        });
    };

    static put = async <T = any, R = AxiosResponse<T>>(url: string, data?: any, config?: AxiosRequestConfig) => {
        return await AuthHttpRequest.axios({
            method: "put",
            url,
            data,
            ...config
        });
    };

    static axios = async (anything: AxiosRequestConfig | string, maybeConfig?: AxiosRequestConfig) => {
        let config: AxiosRequestConfig = {};
        if (typeof anything === "string") {
            if (maybeConfig === undefined) {
                config = {
                    url: anything,
                    method: "get"
                };
            } else {
                config = {
                    url: anything,
                    ...maybeConfig
                };
            }
        } else {
            config = anything;
        }
        return await AuthHttpRequest.doRequest(
            (config: AxiosRequestConfig) => {
                // we create an instance since we don't want to intercept this.
                const instance = axios.create();
                return instance(config);
            },
            config,
            config.url
        );
    };
}
