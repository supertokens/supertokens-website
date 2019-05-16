import axios from 'axios';
import * as axiosType from 'axios';

import { getIDFromCookie, onUnauthorisedResponse } from './handleSessionExp';

// returns true if retry, else false is session has expired completely.
async function handleUnauthorised(refreshAPI: string | undefined, preRequestIdToken: string | undefined): Promise<boolean> {
    if (refreshAPI === undefined) {
        throw Error("Please define refresh token API: AuthHttpRequest.init(<PATH HERE>, unauthorised status code)");
    }
    if (preRequestIdToken === undefined) {
        if (getIDFromCookie() === undefined) {
            throw Error("no auth cookies set");
        } else {
            return true;
        }
    }
    let result = await onUnauthorisedResponse(refreshAPI, preRequestIdToken);
    if (result.result === "SESSION_EXPIRED") {
        return false;
    } else if (result.result === "API_ERROR") {
        throw result.error;
    }
    return true;
}
export class AuthHttpRequest {

    private static REFRESH_TOKEN_URL: string | undefined;
    private static UNAUTHORISED_STATUS_CODE = 440;
    static SESSION_EXPIRED = "Session expired";

    static init(REFRESH_TOKEN_URL: string, UNAUTHORISED_STATUS_CODE: number) {
        AuthHttpRequest.REFRESH_TOKEN_URL = REFRESH_TOKEN_URL;
        AuthHttpRequest.UNAUTHORISED_STATUS_CODE = UNAUTHORISED_STATUS_CODE;
    }

    static doRequest = async (axiosCall: () => axiosType.AxiosPromise<any>) => {
        while (true) {
            const preRequestIdToken = getIDFromCookie();
            try {
                let response = await axiosCall();
                if (response.status === AuthHttpRequest.UNAUTHORISED_STATUS_CODE) {
                    let retry = await handleUnauthorised(AuthHttpRequest.REFRESH_TOKEN_URL, preRequestIdToken);
                    if (!retry) {
                        break;
                    }
                } else {
                    return response;
                }
            } catch (err) {
                if (err.response !== undefined && err.response.status === AuthHttpRequest.UNAUTHORISED_STATUS_CODE) {
                    let retry = await handleUnauthorised(AuthHttpRequest.REFRESH_TOKEN_URL, preRequestIdToken);
                    if (!retry) {
                        break;
                    }
                } else {
                    throw err;
                }
            }
        }
        // if it comes here, means we breaked. which happens only if we have logged out.
        throw {
            response: {
                status: AuthHttpRequest.UNAUTHORISED_STATUS_CODE,
                data: AuthHttpRequest.SESSION_EXPIRED
            },
            message: AuthHttpRequest.SESSION_EXPIRED
        };
    }

    static get = async (url: string, config?: axiosType.AxiosRequestConfig) => {
        return await AuthHttpRequest.doRequest(() => axios.get(url, config));
    }

    static post = async (url: string, data?: any, config?: axiosType.AxiosRequestConfig) => {
        return await AuthHttpRequest.doRequest(() => axios.post(url, data, config));
    }

    static delete = async (url: string, config?: axiosType.AxiosRequestConfig) => {
        return await AuthHttpRequest.doRequest(() => axios.delete(url, config));
    }

    static put = async (url: string, data?: any, config?: axiosType.AxiosRequestConfig) => {
        return await AuthHttpRequest.doRequest(() => axios.put(url, data, config));
    }
}
