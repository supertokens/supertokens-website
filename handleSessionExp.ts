import axios from 'axios';
import Lock from 'browser-tabs-lock';

const ID_COOKIE_NAME = "sIdRefreshToken"

export async function onUnauthorisedResponse(REFRESH_TOKEN_URL: string, preRequestIdToken: string):
    Promise<{ result: "SESSION_EXPIRED" } |
    { result: "SESSION_REFRESHED", apiResponse: any } |
    { result: "API_ERROR", error: any } |
    { result: "RETRY" }> {
    let lock = new Lock();
    if (await lock.acquireLock("REFRESH_TOKEN_USE", 5000)) { // to sync across tabs.
        try {
            let postLockID = getIDFromCookie();
            if (postLockID === undefined) {
                return { result: "SESSION_EXPIRED" };
            }
            if (postLockID !== preRequestIdToken) {
                return { result: "RETRY" };
            }
            let response = await axios.post(REFRESH_TOKEN_URL, {});
            if (getIDFromCookie() === undefined) {  // removed by server. So we logout
                return { result: "SESSION_EXPIRED" };
            }
            return { result: "SESSION_REFRESHED", apiResponse: response };
        } catch (error) {
            return { result: "API_ERROR", error };
        } finally {
            lock.releaseLock("REFRESH_TOKEN_USE");
        }
    }
    if (getIDFromCookie() === undefined) {  // removed by server. So we logout
        return { result: "SESSION_EXPIRED" };
    } else {
        return { result: "RETRY" };
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