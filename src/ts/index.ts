import axios from 'axios';
import Lock from 'browser-tabs-lock';

const ID_COOKIE_NAME = "id-cookie-for-refresh-token"

// You can modify the API call below as you like.
// But be sure to use await
async function apiCall(REFRESH_TOKEN_URL: string): Promise<any> {
    let response = await axios.post(REFRESH_TOKEN_URL, {});
    return response;
}

export async function onUnauthorisedResponse(REFRESH_TOKEN_URL: string):
    Promise<{ result: "SESSION_EXPIRED" } |
    { result: "SESSION_REFRESHED", response: any } |
    { result: "RETRY" }> {
    let preLockID = getIDFromCookie();
    if (preLockID === undefined) {
        return { result: "SESSION_EXPIRED" };
    }
    let lock = new Lock();
    if (await lock.acquireLock("REFRESH_TOKEN_USE", 5000)) { // to sync across tabs.
        try {
            let postLockID = getIDFromCookie();
            if (postLockID === undefined) {
                return { result: "SESSION_EXPIRED" };
            }
            if (postLockID !== preLockID) {
                return { result: "RETRY" };
            }
            let response = await apiCall(REFRESH_TOKEN_URL);
            if (getIDFromCookie() === undefined) {  // removed by server. So we logout
                return { result: "SESSION_EXPIRED" };
            }
            return { result: "SESSION_REFRESHED", response };
        } catch (err) {
            // we consume error for clean interface. 
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

function getIDFromCookie(): string | undefined {
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