import NormalisedURLDomain from "./normalisedURLDomain";
import NormalisedURLPath from "./normalisedURLPath";
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

export type InputType = {
    apiDomain: string;
    apiBasePath?: string;
    sessionScope?: {
        scope: string;
        authDomain: string;
    };
    refreshAPICustomHeaders?: any;
    signoutAPICustomHeaders?: any;
    sessionExpiredStatusCode?: number;
    autoAddCredentials?: boolean;
    isInIframe?: boolean;
    cookieDomain?: string;
};

export type NormalisedInputType = {
    apiDomain: string;
    apiBasePath: string;
    sessionScope:
        | {
              scope: string;
              authDomain: string;
          }
        | undefined;
    refreshAPICustomHeaders?: any;
    signoutAPICustomHeaders?: any;
    sessionExpiredStatusCode: number;
    autoAddCredentials: boolean;
    isInIframe: boolean;
    cookieDomain: string | undefined;
};

export function isAnIpAddress(ipaddress: string) {
    return /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(
        ipaddress
    );
}

export function normaliseURLDomainOrThrowError(input: string): string {
    let str = new NormalisedURLDomain(input).getAsStringDangerous();
    return str;
}

export function normaliseURLPathOrThrowError(input: string): string {
    return new NormalisedURLPath(input).getAsStringDangerous();
}

export function normaliseSessionScopeOrThrowError(sessionScope: string): string {
    function helper(sessionScope: string): string {
        sessionScope = sessionScope.trim().toLowerCase();

        // first we convert it to a URL so that we can use the URL class
        if (sessionScope.startsWith(".")) {
            sessionScope = sessionScope.substr(1);
        }

        if (!sessionScope.startsWith("http://") && !sessionScope.startsWith("https://")) {
            sessionScope = "http://" + sessionScope;
        }

        try {
            let urlObj = new URL(sessionScope);
            sessionScope = urlObj.hostname;

            // remove leading dot
            if (sessionScope.startsWith(".")) {
                sessionScope = sessionScope.substr(1);
            }

            return sessionScope;
        } catch (err) {
            throw new Error("Please provide a valid sessionScope");
        }
    }

    function isAnIpAddress(ipaddress: string) {
        return /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(
            ipaddress
        );
    }

    let noDotNormalised = helper(sessionScope);

    if (noDotNormalised === "localhost" || isAnIpAddress(noDotNormalised)) {
        return noDotNormalised;
    }

    if (sessionScope.startsWith(".")) {
        return "." + noDotNormalised;
    }

    return noDotNormalised;
}

export function validateAndNormaliseInputOrThrowError(options: InputType): NormalisedInputType {
    let apiDomain = normaliseURLDomainOrThrowError(options.apiDomain);

    let apiBasePath = normaliseURLPathOrThrowError("/auth");
    if (options.apiBasePath !== undefined) {
        apiBasePath = normaliseURLPathOrThrowError(options.apiBasePath);
    }

    let sessionScope = undefined;
    if (options.sessionScope !== undefined) {
        sessionScope = {
            scope: normaliseSessionScopeOrThrowError(options.sessionScope.scope),
            authDomain: normaliseURLDomainOrThrowError(options.sessionScope.authDomain)
        };
    }

    let refreshAPICustomHeaders = {};
    if (options.refreshAPICustomHeaders !== undefined) {
        refreshAPICustomHeaders = options.refreshAPICustomHeaders;
    }

    let sessionExpiredStatusCode = 401;
    if (options.sessionExpiredStatusCode !== undefined) {
        sessionExpiredStatusCode = options.sessionExpiredStatusCode;
    }

    let autoAddCredentials = true;
    if (options.autoAddCredentials !== undefined) {
        autoAddCredentials = options.autoAddCredentials;
    }

    let isInIframe = false;
    if (options.isInIframe !== undefined) {
        isInIframe = options.isInIframe;
    }

    let cookieDomain: string | undefined = undefined;
    if (options.cookieDomain !== undefined) {
        cookieDomain = normaliseSessionScopeOrThrowError(options.cookieDomain);
    }

    return {
        apiDomain,
        apiBasePath,
        sessionScope,
        refreshAPICustomHeaders,
        sessionExpiredStatusCode,
        autoAddCredentials,
        isInIframe,
        cookieDomain
    };
}

export function getWindowOrThrow(): any {
    if (typeof window === "undefined") {
        throw Error(
            "If you are using this package with server-side rendering, please make sure that you are checking if the window object is defined."
        );
    }

    return window;
}

// TODO: test
// - with port as well and cookie domain too.
export function shouldDoInterceptionBasedOnUrl(
    toCheckUrl: string,
    apiDomain: string,
    cookieDomain: string | undefined
): boolean {
    let normalisedURL = normaliseURLDomainOrThrowError(toCheckUrl);
    if (cookieDomain === undefined) {
        return normalisedURL === apiDomain;
    } else {
        let urlObj = new URL(normalisedURL);
        let domain = urlObj.hostname;
        if (cookieDomain.startsWith(".")) {
            return domain.endsWith(cookieDomain);
        } else {
            return domain === apiDomain;
        }
    }
}
