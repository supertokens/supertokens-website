var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import axios from 'axios';
import Lock from 'browser-tabs-lock';
const ID_COOKIE_NAME = "sIdRefreshToken";
export function onUnauthorisedResponse(REFRESH_TOKEN_URL, preRequestIdToken) {
    return __awaiter(this, void 0, void 0, function* () {
        let lock = new Lock();
        while (true) {
            if (yield lock.acquireLock("REFRESH_TOKEN_USE", 1000)) {
                try {
                    let postLockID = getIDFromCookie();
                    if (postLockID === undefined) {
                        return { result: "SESSION_EXPIRED" };
                    }
                    if (postLockID !== preRequestIdToken) {
                        return { result: "RETRY" };
                    }
                    let response = yield axios.post(REFRESH_TOKEN_URL, {});
                    if (getIDFromCookie() === undefined) {
                        return { result: "SESSION_EXPIRED" };
                    }
                    return { result: "SESSION_REFRESHED", apiResponse: response };
                }
                catch (error) {
                    if (getIDFromCookie() === undefined) {
                        return { result: "SESSION_EXPIRED" };
                    }
                    return { result: "API_ERROR", error };
                }
                finally {
                    lock.releaseLock("REFRESH_TOKEN_USE");
                }
            }
            let idCookieValie = getIDFromCookie();
            if (idCookieValie === undefined) {
                return { result: "SESSION_EXPIRED" };
            }
            else {
                if (idCookieValie !== preRequestIdToken) {
                    return { result: "RETRY" };
                }
            }
        }
    });
}
export function getIDFromCookie() {
    let value = "; " + document.cookie;
    let parts = value.split("; " + ID_COOKIE_NAME + "=");
    if (parts.length === 2) {
        let last = parts.pop();
        if (last !== undefined) {
            return last.split(";").shift();
        }
    }
    return undefined;
}
