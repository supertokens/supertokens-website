var __awaiter =
    (this && this.__awaiter) ||
    function(thisArg, _arguments, P, generator) {
        return new (P || (P = Promise))(function(resolve, reject) {
            function fulfilled(value) {
                try {
                    step(generator.next(value));
                } catch (e) {
                    reject(e);
                }
            }
            function rejected(value) {
                try {
                    step(generator["throw"](value));
                } catch (e) {
                    reject(e);
                }
            }
            function step(result) {
                result.done
                    ? resolve(result.value)
                    : new P(function(resolve) {
                          resolve(result.value);
                      }).then(fulfilled, rejected);
            }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };
import axios from "axios";
import FetchAuthRequest, { AntiCsrfToken, getDomainFromUrl, handleUnauthorised } from ".";
import { getIDFromCookie } from "./handleSessionExp";
function interceptorFunctionRequestFulfilled(config) {
    return __awaiter(this, void 0, void 0, function*() {
        let url = config.url;
        if (typeof url === "string" && getDomainFromUrl(url) !== AuthHttpRequest.apiDomain) {
            // this check means that if you are using fetch via inteceptor, then we only do the refresh steps if you are calling your APIs.
            return config;
        }
        const preRequestIdToken = getIDFromCookie();
        const antiCsrfToken = AntiCsrfToken.getToken(preRequestIdToken);
        config = Object.assign({}, config, { withCredentials: true });
        let configWithAntiCsrf = config;
        if (antiCsrfToken !== undefined) {
            configWithAntiCsrf = Object.assign({}, configWithAntiCsrf, {
                headers:
                    configWithAntiCsrf === undefined
                        ? {
                              "anti-csrf": antiCsrfToken
                          }
                        : Object.assign({}, configWithAntiCsrf.headers, { "anti-csrf": antiCsrfToken })
            });
        }
        return configWithAntiCsrf;
    });
}
/**
 * @class AuthHttpRequest
 * @description wrapper for common http methods.
 */
export default class AuthHttpRequest {
    static init(refreshTokenUrl, sessionExpiredStatusCode) {
        FetchAuthRequest.init(refreshTokenUrl, sessionExpiredStatusCode);
        AuthHttpRequest.refreshTokenUrl = refreshTokenUrl;
        if (sessionExpiredStatusCode !== undefined) {
            AuthHttpRequest.sessionExpiredStatusCode = sessionExpiredStatusCode;
        }
        AuthHttpRequest.apiDomain = getDomainFromUrl(refreshTokenUrl);
        AuthHttpRequest.initCalled = true;
    }
}
AuthHttpRequest.sessionExpiredStatusCode = 440;
AuthHttpRequest.initCalled = false;
AuthHttpRequest.apiDomain = "";
/**
 * @description sends the actual http request and returns a response if successful/
 * If not successful due to session expiry reasons, it
 * attempts to call the refresh token API and if that is successful, calls this API again.
 * @throws Error
 */
AuthHttpRequest.doRequest = (httpCall, config, url, prevResponse, prevError, viaInterceptor = false) =>
    __awaiter(this, void 0, void 0, function*() {
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
            return yield httpCall(config);
        }
        try {
            let throwError = false;
            let returnObj = undefined;
            while (true) {
                // we read this here so that if there is a session expiry error, then we can compare this value (that caused the error) with the value after the request is sent.
                // to avoid race conditions
                const preRequestIdToken = getIDFromCookie();
                const antiCsrfToken = AntiCsrfToken.getToken(preRequestIdToken);
                config = Object.assign({}, config, { withCredentials: true });
                let configWithAntiCsrf = config;
                if (antiCsrfToken !== undefined) {
                    configWithAntiCsrf = Object.assign({}, configWithAntiCsrf, {
                        headers:
                            configWithAntiCsrf === undefined
                                ? {
                                      "anti-csrf": antiCsrfToken
                                  }
                                : Object.assign({}, configWithAntiCsrf.headers, { "anti-csrf": antiCsrfToken })
                    });
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
                        localPrevResponse === undefined ? yield httpCall(configWithAntiCsrf) : localPrevResponse;
                    if (response.status === AuthHttpRequest.sessionExpiredStatusCode) {
                        let retry = yield handleUnauthorised(AuthHttpRequest.refreshTokenUrl, preRequestIdToken);
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
                        let retry = yield handleUnauthorised(AuthHttpRequest.refreshTokenUrl, preRequestIdToken);
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
            if (getIDFromCookie() === undefined) {
                AntiCsrfToken.removeToken();
            }
        }
    });
/**
 * @description attempts to refresh session regardless of expiry
 * @returns true if successful, else false if session has expired. Wrapped in a Promise
 * @throws error if anything goes wrong
 */
AuthHttpRequest.attemptRefreshingSession = () =>
    __awaiter(this, void 0, void 0, function*() {
        if (!AuthHttpRequest.initCalled) {
            throw Error("init function not called");
        }
        try {
            const preRequestIdToken = getIDFromCookie();
            return yield handleUnauthorised(AuthHttpRequest.refreshTokenUrl, preRequestIdToken);
        } finally {
            if (getIDFromCookie() === undefined) {
                AntiCsrfToken.removeToken();
            }
        }
    });
AuthHttpRequest.get = (url, config) =>
    __awaiter(this, void 0, void 0, function*() {
        return yield AuthHttpRequest.axios(Object.assign({ method: "get", url }, config));
    });
AuthHttpRequest.post = (url, data, config) =>
    __awaiter(this, void 0, void 0, function*() {
        return yield AuthHttpRequest.axios(Object.assign({ method: "post", url, data }, config));
    });
AuthHttpRequest.delete = (url, config) =>
    __awaiter(this, void 0, void 0, function*() {
        return yield AuthHttpRequest.axios(Object.assign({ method: "delete", url }, config));
    });
AuthHttpRequest.put = (url, data, config) =>
    __awaiter(this, void 0, void 0, function*() {
        return yield AuthHttpRequest.axios(Object.assign({ method: "put", url, data }, config));
    });
AuthHttpRequest.axios = (anything, maybeConfig) =>
    __awaiter(this, void 0, void 0, function*() {
        let config = {};
        if (typeof anything === "string") {
            if (maybeConfig === undefined) {
                config = {
                    url: anything,
                    method: "get"
                };
            } else {
                config = Object.assign({ url: anything }, maybeConfig);
            }
        } else {
            config = anything;
        }
        return yield AuthHttpRequest.doRequest(
            config => {
                // we create an instance since we don't want to intercept this.
                const instance = axios.create();
                return instance(config);
            },
            config,
            config.url
        );
    });
AuthHttpRequest.makeSuper = axiosInstance => {
    // we first check if this axiosInstance already has our interceptors.
    let requestInterceptors = axiosInstance.interceptors.request;
    for (let i = 0; i < requestInterceptors.handlers.length; i++) {
        if (requestInterceptors.handlers[i].fulfilled === interceptorFunctionRequestFulfilled) {
            return;
        }
    }
    // Add a request interceptor
    axiosInstance.interceptors.request.use(interceptorFunctionRequestFulfilled, function(error) {
        return __awaiter(this, void 0, void 0, function*() {
            return Promise.reject(error);
        });
    });
    // Add a response interceptor
    axiosInstance.interceptors.response.use(
        function(response) {
            return __awaiter(this, void 0, void 0, function*() {
                try {
                    if (!AuthHttpRequest.initCalled) {
                        Promise.reject(new Error("init function not called"));
                    }
                    if (response.status === AuthHttpRequest.sessionExpiredStatusCode) {
                        let config = response.config;
                        return AuthHttpRequest.doRequest(
                            config => {
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
                        let antiCsrfToken = response.headers["anti-csrf"];
                        if (antiCsrfToken !== undefined) {
                            AntiCsrfToken.setItem(getIDFromCookie(), antiCsrfToken);
                        }
                        return response;
                    }
                } finally {
                    if (getIDFromCookie() === undefined) {
                        AntiCsrfToken.removeToken();
                    }
                }
            });
        },
        function(error) {
            return __awaiter(this, void 0, void 0, function*() {
                if (!AuthHttpRequest.initCalled) {
                    Promise.reject(new Error("init function not called"));
                }
                try {
                    if (
                        error.response !== undefined &&
                        error.response.status === AuthHttpRequest.sessionExpiredStatusCode
                    ) {
                        let config = error.config;
                        return AuthHttpRequest.doRequest(
                            config => {
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
                } finally {
                    if (getIDFromCookie() === undefined) {
                        AntiCsrfToken.removeToken();
                    }
                }
            });
        }
    );
};
