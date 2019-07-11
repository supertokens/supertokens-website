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
import { getIDFromCookie, onUnauthorisedResponse } from "./handleSessionExp";
export class AntiCsrfToken {
    constructor() {}
    static getToken(associatedIdRefreshToken) {
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
    static setItem(associatedIdRefreshToken, antiCsrf) {
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
function handleUnauthorised(refreshAPI, preRequestIdToken) {
    return __awaiter(this, void 0, void 0, function*() {
        if (refreshAPI === undefined) {
            throw Error("Please define refresh token API: AuthHttpRequest.init(<PATH HERE>, unauthorised status code)");
        }
        if (preRequestIdToken === undefined) {
            return getIDFromCookie() !== undefined;
        }
        let result = yield onUnauthorisedResponse(refreshAPI, preRequestIdToken);
        if (result.result === "SESSION_EXPIRED") {
            return false;
        } else if (result.result === "API_ERROR") {
            throw result.error;
        }
        return true;
    });
}
function getDomainFromUrl(url) {
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
    static init(refreshTokenUrl, sessionExpiredStatusCode, viaInterceptor = false) {
        AuthHttpRequest.refreshTokenUrl = refreshTokenUrl;
        if (sessionExpiredStatusCode !== undefined) {
            AuthHttpRequest.sessionExpiredStatusCode = sessionExpiredStatusCode;
        }
        let env = window.fetch === undefined ? global : window;
        if (AuthHttpRequest.originalFetch === undefined) {
            AuthHttpRequest.originalFetch = env.fetch.bind(env);
        }
        if (viaInterceptor) {
            env.fetch = (url, config) => {
                return AuthHttpRequest.fetch(url, config);
            };
        }
        AuthHttpRequest.viaInterceptor = viaInterceptor;
        AuthHttpRequest.apiDomain = getDomainFromUrl(refreshTokenUrl);
        AuthHttpRequest.initCalled = true;
    }
}
AuthHttpRequest.sessionExpiredStatusCode = 440;
AuthHttpRequest.initCalled = false;
AuthHttpRequest.apiDomain = "";
AuthHttpRequest.viaInterceptor = false;
/**
 * @description sends the actual http request and returns a response if successful/
 * If not successful due to session expiry reasons, it
 * attempts to call the refresh token API and if that is successful, calls this API again.
 * @throws Error
 */
AuthHttpRequest.doRequest = (httpCall, config, url) =>
    __awaiter(this, void 0, void 0, function*() {
        if (!AuthHttpRequest.initCalled) {
            throw Error("init function not called");
        }
        if (
            typeof url === "string" &&
            getDomainFromUrl(url) !== AuthHttpRequest.apiDomain &&
            AuthHttpRequest.viaInterceptor
        ) {
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
                    let response = yield httpCall(configWithAntiCsrf);
                    if (response.status === AuthHttpRequest.sessionExpiredStatusCode) {
                        let retry = yield handleUnauthorised(AuthHttpRequest.refreshTokenUrl, preRequestIdToken);
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
        return yield AuthHttpRequest.fetch(url, Object.assign({ method: "GET" }, config));
    });
AuthHttpRequest.post = (url, config) =>
    __awaiter(this, void 0, void 0, function*() {
        return yield AuthHttpRequest.fetch(url, Object.assign({ method: "POST" }, config));
    });
AuthHttpRequest.delete = (url, config) =>
    __awaiter(this, void 0, void 0, function*() {
        return yield AuthHttpRequest.fetch(url, Object.assign({ method: "DELETE" }, config));
    });
AuthHttpRequest.put = (url, config) =>
    __awaiter(this, void 0, void 0, function*() {
        return yield AuthHttpRequest.fetch(url, Object.assign({ method: "PUT" }, config));
    });
AuthHttpRequest.fetch = (url, config) =>
    __awaiter(this, void 0, void 0, function*() {
        return yield AuthHttpRequest.doRequest(
            config => {
                return AuthHttpRequest.originalFetch(url, Object.assign({}, config));
            },
            config,
            url
        );
    });
