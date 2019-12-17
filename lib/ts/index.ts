import { getIDFromCookie, onUnauthorisedResponse, setIDToCookie } from "./handleSessionExp";
import { package_version } from "./version";

export class AntiCsrfToken {
    private static tokenInfo:
        | undefined
        | {
              antiCsrf: string;
              associatedIdRefreshToken: string;
          };

    private constructor() {}

    static getToken(associatedIdRefreshToken: string | undefined): string | undefined {
        if (associatedIdRefreshToken === undefined) {
            AntiCsrfToken.tokenInfo = undefined;
            return undefined;
        }
        if (AntiCsrfToken.tokenInfo === undefined) {
            let antiCsrf = window.localStorage.getItem("anti-csrf-localstorage");
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
            return AntiCsrfToken.getToken(associatedIdRefreshToken);
        }
        return AntiCsrfToken.tokenInfo.antiCsrf;
    }

    static removeToken() {
        AntiCsrfToken.tokenInfo = undefined;
        window.localStorage.removeItem("anti-csrf-localstorage");
    }

    static setItem(associatedIdRefreshToken: string | undefined, antiCsrf: string) {
        if (associatedIdRefreshToken === undefined) {
            AntiCsrfToken.tokenInfo = undefined;
            return undefined;
        }
        window.localStorage.setItem("anti-csrf-localstorage", antiCsrf);
        AntiCsrfToken.tokenInfo = {
            antiCsrf,
            associatedIdRefreshToken
        };
    }
}

/**
 * @description returns true if retry, else false is session has expired completely.
 */
export async function handleUnauthorised(
    refreshAPI: string | undefined,
    preRequestIdToken: string | undefined,
    websiteRootDomain: string
): Promise<boolean> {
    if (refreshAPI === undefined) {
        throw Error("Please define refresh token API in the init function");
    }
    if (preRequestIdToken === undefined) {
        return getIDFromCookie() !== undefined;
    }
    let result = await onUnauthorisedResponse(refreshAPI, preRequestIdToken, websiteRootDomain);
    if (result.result === "SESSION_EXPIRED") {
        return false;
    } else if (result.result === "API_ERROR") {
        throw result.error;
    }
    return true;
}

export function getDomainFromUrl(url: string): string {
    if (window.fetch === undefined) {
        // we are testing
        return "http://localhost:8888";
    }
    if (url.startsWith("https://") || url.startsWith("http://")) {
        return url
            .split("/")
            .filter((_, i) => i <= 2)
            .join("/");
    } else {
        return window.location.origin;
    }
}

/**
 * @class AuthHttpRequest
 * @description wrapper for common http methods.
 */
export default class AuthHttpRequest {
    private static refreshTokenUrl: string | undefined;
    private static sessionExpiredStatusCode = 440;
    private static initCalled = false;
    static originalFetch: any;
    private static apiDomain = "";
    private static viaInterceptor: boolean | undefined;
    private static websiteRootDomain: string;

    static init(
        refreshTokenUrl: string,
        sessionExpiredStatusCode?: number,
        viaInterceptor?: boolean,
        websiteRootDomain?: string
    ) {
        if (viaInterceptor === undefined) {
            if (AuthHttpRequest.viaInterceptor === undefined) {
                viaInterceptor = false;
            } else {
                viaInterceptor = AuthHttpRequest.viaInterceptor;
            }
        }
        AuthHttpRequest.refreshTokenUrl = refreshTokenUrl;
        AuthHttpRequest.websiteRootDomain =
            websiteRootDomain === undefined ? window.location.hostname : websiteRootDomain;
        if (sessionExpiredStatusCode !== undefined) {
            AuthHttpRequest.sessionExpiredStatusCode = sessionExpiredStatusCode;
        }
        let env: any = window.fetch === undefined ? global : window;
        if (AuthHttpRequest.originalFetch === undefined) {
            AuthHttpRequest.originalFetch = env.fetch.bind(env);
        }
        if (viaInterceptor) {
            env.fetch = (url: RequestInfo, config?: RequestInit): Promise<Response> => {
                return AuthHttpRequest.fetch(url, config);
            };
        }
        AuthHttpRequest.viaInterceptor = viaInterceptor;
        AuthHttpRequest.apiDomain = getDomainFromUrl(refreshTokenUrl);
        AuthHttpRequest.initCalled = true;
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
        if (
            typeof url === "string" &&
            getDomainFromUrl(url) !== AuthHttpRequest.apiDomain &&
            AuthHttpRequest.viaInterceptor
        ) {
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
                if (preRequestIdToken !== undefined && (config === undefined || config.credentials === undefined)) {
                    config = {
                        ...config,
                        credentials: "include"
                    };
                }
                let configWithAntiCsrf: RequestInit | undefined = config;
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

                // Add package info to headers
                configWithAntiCsrf = {
                    ...configWithAntiCsrf,
                    headers:
                        configWithAntiCsrf === undefined
                            ? {
                                  "supertokens-sdk-name": "website",
                                  "supertokens-sdk-version": package_version
                              }
                            : {
                                  ...configWithAntiCsrf.headers,
                                  "supertokens-sdk-name": "website",
                                  "supertokens-sdk-version": package_version
                              }
                };
                try {
                    let response = await httpCall(configWithAntiCsrf);
                    response.headers.forEach((value: any, key: any) => {
                        if (key.toString() === "id-refresh-token") {
                            setIDToCookie(value, AuthHttpRequest.websiteRootDomain);
                        }
                    });
                    if (response.status === AuthHttpRequest.sessionExpiredStatusCode) {
                        let retry = await handleUnauthorised(
                            AuthHttpRequest.refreshTokenUrl,
                            preRequestIdToken,
                            AuthHttpRequest.websiteRootDomain
                        );
                        if (!retry) {
                            returnObj = response;
                            break;
                        }
                    } else {
                        response.headers.forEach((value, key) => {
                            if (key.toString() === "anti-csrf") {
                                AntiCsrfToken.setItem(getIDFromCookie(), value);
                            }
                        });
                        return response;
                    }
                } catch (err) {
                    if (err.status === AuthHttpRequest.sessionExpiredStatusCode) {
                        let retry = await handleUnauthorised(
                            AuthHttpRequest.refreshTokenUrl,
                            preRequestIdToken,
                            AuthHttpRequest.websiteRootDomain
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
            return await handleUnauthorised(
                AuthHttpRequest.refreshTokenUrl,
                preRequestIdToken,
                AuthHttpRequest.websiteRootDomain
            );
        } finally {
            if (getIDFromCookie() === undefined) {
                AntiCsrfToken.removeToken();
            }
        }
    };

    static get = async (url: RequestInfo, config?: RequestInit) => {
        return await AuthHttpRequest.fetch(url, {
            method: "GET",
            ...config
        });
    };

    static post = async (url: RequestInfo, config?: RequestInit) => {
        return await AuthHttpRequest.fetch(url, {
            method: "POST",
            ...config
        });
    };

    static delete = async (url: RequestInfo, config?: RequestInit) => {
        return await AuthHttpRequest.fetch(url, {
            method: "DELETE",
            ...config
        });
    };

    static put = async (url: RequestInfo, config?: RequestInit) => {
        return await AuthHttpRequest.fetch(url, {
            method: "PUT",
            ...config
        });
    };

    static fetch = async (url: RequestInfo, config?: RequestInit) => {
        return await AuthHttpRequest.doRequest(
            (config?: RequestInit) => {
                return AuthHttpRequest.originalFetch(url, {
                    ...config
                });
            },
            config,
            url
        );
    };

    static sessionPossiblyExists = () => {
        return getIDFromCookie() !== undefined;
    };
}
