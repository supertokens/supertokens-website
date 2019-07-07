import Lock from 'browser-tabs-lock';

import { AntiCsrfToken } from './';

const ID_COOKIE_NAME = "sIdRefreshToken"

/**
 * @description attempts to call the refresh token API each time we are sure the session has expired, or it throws an error or,
 * or the ID_COOKIE_NAME has changed value -> which may mean that we have a new set of tokens.
 */
export async function onUnauthorisedResponse(REFRESH_TOKEN_URL: string, preRequestIdToken: string):
    Promise<{ result: "SESSION_EXPIRED" } |
    { result: "SESSION_REFRESHED", apiResponse: any } |
    { result: "API_ERROR", error: any } |
    { result: "RETRY" }> {
    let lock = new Lock();
    while (true) {
        if (await lock.acquireLock("REFRESH_TOKEN_USE", 1000)) { // to sync across tabs. the 1000 ms wait is for how much time to try and azquire the lock.
            try {
                let postLockID = getIDFromCookie();
                if (postLockID === undefined) {
                    return { result: "SESSION_EXPIRED" };
                }
                if (postLockID !== preRequestIdToken) {
                    // means that some other process has already called this API and succeeded. so we need to call it again
                    return { result: "RETRY" };
                }
                let response = await fetch(REFRESH_TOKEN_URL, {
                    method: "post"
                });
                if (response.status !== 200) {
                    throw response;
                }
                if (getIDFromCookie() === undefined) {  // removed by server. So we logout
                    return { result: "SESSION_EXPIRED" };
                }
                response.headers.forEach((value, key) => {
                    if (key.toString() === "anti-csrf") {
                        AntiCsrfToken.setItem(getIDFromCookie(), value);
                    }
                });
                return { result: "SESSION_REFRESHED", apiResponse: response };
            } catch (error) {
                if (getIDFromCookie() === undefined) {  // removed by server.
                    return { result: "SESSION_EXPIRED" };
                }
                return { result: "API_ERROR", error };
            } finally {
                lock.releaseLock("REFRESH_TOKEN_USE");
            }
        }
        let idCookieValie = getIDFromCookie();
        if (idCookieValie === undefined) {  // removed by server. So we logout
            return { result: "SESSION_EXPIRED" };
        } else {
            if (idCookieValie !== preRequestIdToken) {
                return { result: "RETRY" };
            }
            // here we try to call the API again since we probably failed to acquire lock and nothing has changed.
        }
    }
}

export function getIDFromCookie(): string | undefined {
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