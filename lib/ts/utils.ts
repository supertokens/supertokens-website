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
    sessionScope?: string;
    refreshAPICustomHeaders?: any;
    sessionExpiredStatusCode?: number;
    autoAddCredentials?: boolean;
};

export type NormalisedInputType = {
    apiDomain: string;
    apiBasePath: string;
    sessionScope: string;
    refreshAPICustomHeaders?: any;
    sessionExpiredStatusCode: number;
    autoAddCredentials: boolean;
};

export function normaliseURLDomainOrThrowError(input: string): string {
    function isAnIpAddress(ipaddress: string) {
        return /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(
            ipaddress
        );
    }

    input = input.trim().toLowerCase();

    try {
        let urlObj = new URL(input);
        if (urlObj.protocol === "supertokens:") {
            if (urlObj.host.startsWith("localhost") || isAnIpAddress(urlObj.host)) {
                input = "http://" + urlObj.host;
            } else {
                input = "https://" + urlObj.host;
            }
        } else {
            input = urlObj.protocol + "//" + urlObj.host;
        }

        return input;
    } catch (err) {}
    // not a valid URL

    if (input.indexOf(".") === 0) {
        input = input.substr(1);
    }

    // If the input contains a . it means they have given a domain name.
    // So we try assuming that they have given a domain name
    if (
        (input.indexOf(".") !== -1 || input === "localhost") &&
        !input.startsWith("http://") &&
        !input.startsWith("https://")
    ) {
        // The supertokens:// signifies to the recursive call that the call was made by us.
        input = "supertokens://" + input;

        // at this point, it should be a valid URL. So we test that before doing a recursive call
        try {
            new URL(input);
            return normaliseURLDomainOrThrowError(input);
        } catch (err) {}
    }

    throw new Error("Please provide a valid domain name");
}

export function normaliseURLPathOrThrowError(input: string): string {
    input = input.trim().toLowerCase();

    try {
        let urlObj = new URL(input);
        input = urlObj.pathname;

        if (input.charAt(input.length - 1) === "/") {
            return input.substr(0, input.length - 1);
        }

        return input;
    } catch (err) {}
    // not a valid URL

    // If the input contains a . it means they have given a domain name.
    // So we try assuming that they have given a domain name + path
    if (
        (input.indexOf(".") !== -1 || input === "localhost") &&
        !input.startsWith("http://") &&
        !input.startsWith("https://")
    ) {
        input = "http://" + input;
        return normaliseURLPathOrThrowError(input);
    }

    if (input.charAt(0) !== "/") {
        input = "/" + input;
    }

    // at this point, we should be able to convert it into a fake URL and recursively call this function.
    try {
        // test that we can convert this to prevent an infinite loop
        new URL("http://example.com" + input);

        return normaliseURLPathOrThrowError("http://example.com" + input);
    } catch (err) {
        throw new Error("Please provide a valid URL path");
    }
}

export function normaliseSessionScopeOrThrowError(sessionScope: string): string {
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

        // add a leading dot
        if (!sessionScope.startsWith(".")) {
            sessionScope = "." + sessionScope;
        }

        return sessionScope;
    } catch (err) {
        throw new Error("Please provide a valid sessionScope");
    }
}

export function validateAndNormaliseInputOrThrowError(options: InputType): NormalisedInputType {
    let apiDomain = normaliseURLDomainOrThrowError(options.apiDomain);

    let apiBasePath = normaliseURLPathOrThrowError("/auth");
    if (options.apiBasePath !== undefined) {
        apiBasePath = normaliseURLPathOrThrowError(options.apiBasePath);
    }

    let sessionScope = normaliseSessionScopeOrThrowError(window.location.hostname);
    if (options.sessionScope !== undefined) {
        sessionScope = normaliseSessionScopeOrThrowError(options.sessionScope);
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

    return {
        apiDomain,
        apiBasePath,
        sessionScope,
        refreshAPICustomHeaders,
        sessionExpiredStatusCode,
        autoAddCredentials
    };
}
