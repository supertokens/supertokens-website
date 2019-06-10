var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { getIDFromCookie, onUnauthorisedResponse } from './handleSessionExp';
/**
 * @description returns true if retry, else false is session has expired completely.
 */
function handleUnauthorised(refreshAPI, preRequestIdToken) {
    return __awaiter(this, void 0, void 0, function* () {
        if (refreshAPI === undefined) {
            throw Error("Please define refresh token API: AuthHttpRequest.init(<PATH HERE>, unauthorised status code)");
        }
        if (preRequestIdToken === undefined) {
            return getIDFromCookie() !== undefined;
        }
        let result = yield onUnauthorisedResponse(refreshAPI, preRequestIdToken);
        if (result.result === "SESSION_EXPIRED") {
            return false;
        }
        else if (result.result === "API_ERROR") {
            throw result.error;
        }
        return true;
    });
}
/**
 * @class AuthHttpRequest
 * @description wrapper for common http methods.
 */
export default class AuthHttpRequest {
    static init(REFRESH_TOKEN_URL, UNAUTHORISED_STATUS_CODE) {
        AuthHttpRequest.REFRESH_TOKEN_URL = REFRESH_TOKEN_URL;
        AuthHttpRequest.UNAUTHORISED_STATUS_CODE = UNAUTHORISED_STATUS_CODE;
    }
}
AuthHttpRequest.UNAUTHORISED_STATUS_CODE = 440;
/**
 * @description sends the actual http request and returns a response if successful/
 * If not successful due to session expiry reasons, it
 * attempts to call the refresh token API and if that is successful, calls this API again.
 * @throws Error
 */
AuthHttpRequest.doRequest = (httpCall) => __awaiter(this, void 0, void 0, function* () {
    let throwError = false;
    let returnObj = undefined;
    while (true) {
        // we read this here so that if there is a session expiry error, then we can compare this value (that caused the error) with the value after the request is sent.
        // to avoid race conditions
        const preRequestIdToken = getIDFromCookie();
        try {
            let response = yield httpCall();
            if (response.status === AuthHttpRequest.UNAUTHORISED_STATUS_CODE) {
                let retry = yield handleUnauthorised(AuthHttpRequest.REFRESH_TOKEN_URL, preRequestIdToken);
                if (!retry) {
                    returnObj = response;
                    break;
                }
            }
            else {
                return response;
            }
        }
        catch (err) {
            if (err.status === AuthHttpRequest.UNAUTHORISED_STATUS_CODE) {
                let retry = yield handleUnauthorised(AuthHttpRequest.REFRESH_TOKEN_URL, preRequestIdToken);
                if (!retry) {
                    throwError = true;
                    returnObj = err;
                    break;
                }
            }
            else {
                throw err;
            }
        }
    }
    // if it comes here, means we breaked. which happens only if we have logged out.
    if (throwError) {
        throw returnObj;
    }
    else {
        return returnObj;
    }
});
/**
 * @description attempts to refresh session regardless of expiry
 * @returns true if successful, else false if session has expired. Wrapped in a Promise
 * @throws error if anything goes wrong
 */
AuthHttpRequest.attemptRefreshingSession = () => __awaiter(this, void 0, void 0, function* () {
    const preRequestIdToken = getIDFromCookie();
    return yield handleUnauthorised(AuthHttpRequest.REFRESH_TOKEN_URL, preRequestIdToken);
});
AuthHttpRequest.get = (url, config) => __awaiter(this, void 0, void 0, function* () {
    return yield AuthHttpRequest.doRequest(() => {
        return fetch(url, Object.assign({ method: "GET" }, config));
    });
});
AuthHttpRequest.post = (url, config) => __awaiter(this, void 0, void 0, function* () {
    return yield AuthHttpRequest.doRequest(() => {
        return fetch(url, Object.assign({ method: "POST" }, config));
    });
});
AuthHttpRequest.delete = (url, config) => __awaiter(this, void 0, void 0, function* () {
    return yield AuthHttpRequest.doRequest(() => {
        return fetch(url, Object.assign({ method: "DELETE" }, config));
    });
});
AuthHttpRequest.put = (url, config) => __awaiter(this, void 0, void 0, function* () {
    return yield AuthHttpRequest.doRequest(() => {
        return fetch(url, Object.assign({ method: "PUT" }, config));
    });
});
