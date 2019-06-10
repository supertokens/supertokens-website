import { getIDFromCookie, onUnauthorisedResponse } from './handleSessionExp';


/**
 * @description returns true if retry, else false is session has expired completely.
 */
async function handleUnauthorised(refreshAPI: string | undefined, preRequestIdToken: string | undefined): Promise<boolean> {
    if (refreshAPI === undefined) {
        throw Error("Please define refresh token API: AuthHttpRequest.init(<PATH HERE>, unauthorised status code)");
    }
    if (preRequestIdToken === undefined) {
        return getIDFromCookie() !== undefined;
    }
    let result = await onUnauthorisedResponse(refreshAPI, preRequestIdToken);
    if (result.result === "SESSION_EXPIRED") {
        return false;
    } else if (result.result === "API_ERROR") {
        throw result.error;
    }
    return true;
}

/**
 * @class AuthHttpRequest
 * @description wrapper for common http methods.
 */
export default class AuthHttpRequest {

    private static REFRESH_TOKEN_URL: string | undefined;
    private static UNAUTHORISED_STATUS_CODE = 440;

    static init(REFRESH_TOKEN_URL: string, UNAUTHORISED_STATUS_CODE: number) {
        AuthHttpRequest.REFRESH_TOKEN_URL = REFRESH_TOKEN_URL;
        AuthHttpRequest.UNAUTHORISED_STATUS_CODE = UNAUTHORISED_STATUS_CODE;
    }

    /**
     * @description sends the actual http request and returns a response if successful/
     * If not successful due to session expiry reasons, it 
     * attempts to call the refresh token API and if that is successful, calls this API again.
     * @throws Error
     */
    static doRequest = async (httpCall: () => Promise<Response>): Promise<Response> => {
        let throwError = false;
        let returnObj = undefined;
        while (true) {
            // we read this here so that if there is a session expiry error, then we can compare this value (that caused the error) with the value after the request is sent.
            // to avoid race conditions
            const preRequestIdToken = getIDFromCookie();
            try {
                let response = await httpCall();
                if (response.status === AuthHttpRequest.UNAUTHORISED_STATUS_CODE) {
                    let retry = await handleUnauthorised(AuthHttpRequest.REFRESH_TOKEN_URL, preRequestIdToken);
                    if (!retry) {
                        returnObj = response;
                        break;
                    }
                } else {
                    return response;
                }
            } catch (err) {
                if (err.status === AuthHttpRequest.UNAUTHORISED_STATUS_CODE) {
                    let retry = await handleUnauthorised(AuthHttpRequest.REFRESH_TOKEN_URL, preRequestIdToken);
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
    }

    /**
     * @description attempts to refresh session regardless of expiry
     * @returns true if successful, else false if session has expired. Wrapped in a Promise
     * @throws error if anything goes wrong
     */
    static attemptRefreshingSession = async (): Promise<boolean> => {
        const preRequestIdToken = getIDFromCookie();
        return await handleUnauthorised(AuthHttpRequest.REFRESH_TOKEN_URL, preRequestIdToken);
    }

    static get = async (url: RequestInfo, config?: RequestInit) => {
        return await AuthHttpRequest.doRequest(() => {
            return fetch(url, {
                method: "GET",
                ...config
            });
        });
    }

    static post = async (url: RequestInfo, config?: RequestInit) => {
        return await AuthHttpRequest.doRequest(() => {
            return fetch(url, {
                method: "POST",
                ...config
            });
        });
    }

    static delete = async (url: RequestInfo, config?: RequestInit) => {
        return await AuthHttpRequest.doRequest(() => {
            return fetch(url, {
                method: "DELETE",
                ...config
            });
        });
    }

    static put = async (url: RequestInfo, config?: RequestInit) => {
        return await AuthHttpRequest.doRequest(() => {
            return fetch(url, {
                method: "PUT",
                ...config
            });
        });
    }
}
