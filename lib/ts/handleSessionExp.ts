/* Copyright (c) 2020, VRAI Labs and/or its affiliates. All rights reserved.
 *
 * This software is licensed under the Apache License, Version 2.0 (the
 * "License") as published by the Apache Software Foundation.
 *
 * You may not use this file except in compliance with the License. You may
 * obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 */
import Lock from "browser-tabs-lock";

import AuthHttpRequest, { AntiCsrfToken } from "./";
import { package_version } from "./version";

const ID_COOKIE_NAME = "sIRTFrontend";

/**
 * @description attempts to call the refresh token API each time we are sure the session has expired, or it throws an error or,
 * or the ID_COOKIE_NAME has changed value -> which may mean that we have a new set of tokens.
 */
export async function onUnauthorisedResponse(
    refreshTokenUrl: string,
    preRequestIdToken: string,
    websiteRootDomain: string,
    refreshAPICustomHeaders: any,
    sessionExpiredStatusCode: number
): Promise<{ result: "SESSION_EXPIRED" } | { result: "API_ERROR"; error: any } | { result: "RETRY" }> {
    let lock = new Lock();
    while (true) {
        if (await lock.acquireLock("REFRESH_TOKEN_USE", 1000)) {
            // to sync across tabs. the 1000 ms wait is for how much time to try and azquire the lock.
            try {
                let postLockID = getIDFromCookie();
                if (postLockID === undefined) {
                    return { result: "SESSION_EXPIRED" };
                }
                if (postLockID !== preRequestIdToken) {
                    // means that some other process has already called this API and succeeded. so we need to call it again
                    return { result: "RETRY" };
                }
                let response = await AuthHttpRequest.originalFetch(refreshTokenUrl, {
                    method: "post",
                    credentials: "include",
                    headers: {
                        ...refreshAPICustomHeaders,
                        "supertokens-sdk-name": "website",
                        "supertokens-sdk-version": package_version
                    }
                });
                let removeIdRefreshToken = true;
                response.headers.forEach((value: any, key: any) => {
                    if (key.toString() === "id-refresh-token") {
                        setIDToCookie(value, websiteRootDomain);
                        removeIdRefreshToken = false;
                    }
                });
                if (response.status === sessionExpiredStatusCode) {
                    // there is a case where frontend still has id refresh token, but backend doesn't get it. In this event, session expired error will be thrown and the frontend should remove this token
                    if (removeIdRefreshToken) {
                        setIDToCookie("remove", websiteRootDomain);
                    }
                }
                if (response.status !== 200) {
                    throw response;
                }
                if (getIDFromCookie() === undefined) {
                    // removed by server. So we logout
                    return { result: "SESSION_EXPIRED" };
                }
                response.headers.forEach((value: any, key: any) => {
                    if (key.toString() === "anti-csrf") {
                        AntiCsrfToken.setItem(getIDFromCookie(), value);
                    }
                });
                return { result: "RETRY" };
            } catch (error) {
                if (getIDFromCookie() === undefined) {
                    // removed by server.
                    return { result: "SESSION_EXPIRED" };
                }
                return { result: "API_ERROR", error };
            } finally {
                lock.releaseLock("REFRESH_TOKEN_USE");
            }
        }
        let idCookieValue = getIDFromCookie();
        if (idCookieValue === undefined) {
            // removed by server. So we logout
            return { result: "SESSION_EXPIRED" };
        } else {
            if (idCookieValue !== preRequestIdToken) {
                return { result: "RETRY" };
            }
            // here we try to call the API again since we probably failed to acquire lock and nothing has changed.
        }
    }
}

// NOTE: we do not store this in memory and always read as to synchronize events across tabs
export function getIDFromCookie(): string | undefined {
    let value = "; " + document.cookie;
    let parts = value.split("; " + ID_COOKIE_NAME + "=");
    if (parts.length >= 2) {
        let last = parts.pop();
        if (last !== undefined) {
            return last.split(";").shift();
        }
    }
    return undefined;
}

export function setIDToCookie(idRefreshToken: string, domain: string) {
    let expires = "Thu, 01 Jan 1970 00:00:01 GMT";
    let cookieVal = "";
    if (idRefreshToken !== "remove") {
        let splitted = idRefreshToken.split(";");
        cookieVal = splitted[0];
        expires = new Date(Number(splitted[1])).toUTCString();
    }
    document.cookie = `${ID_COOKIE_NAME}=${cookieVal};expires=${expires};domain=${domain};path=/`;
}
