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

import NormalisedURLDomain, { isAnIpAddress } from "../normalisedURLDomain";
import NormalisedURLPath from "../normalisedURLPath";
import {
    EventHandler,
    InputType,
    NormalisedInputType,
    RecipeInterface,
    RecipePostAPIHookFunction,
    RecipePreAPIHookFunction
} from "../types";
import WindowHandlerReference from "../utils/windowHandler";
import { enableLogging, logDebugMessage } from "../logger";

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

    let defaultSessionScope = WindowHandlerReference.getReferenceOrThrow().windowHandler.location.getHostName();

    // See https://github.com/supertokens/supertokens-website/issues/98
    let sessionScope = normaliseSessionScopeOrThrowError(
        options !== undefined && options.sessionScope !== undefined ? options.sessionScope : defaultSessionScope
    );

    let sessionExpiredStatusCode = 401;
    if (options.sessionExpiredStatusCode !== undefined) {
        sessionExpiredStatusCode = options.sessionExpiredStatusCode;
    }

    let invalidClaimStatusCode = 403;
    if (options.invalidClaimStatusCode !== undefined) {
        invalidClaimStatusCode = options.invalidClaimStatusCode;
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

    let preAPIHook: RecipePreAPIHookFunction = async context => {
        return { url: context.url, requestInit: context.requestInit };
    };

    if (options.preAPIHook !== undefined) {
        preAPIHook = options.preAPIHook;
    }

    let postAPIHook: RecipePostAPIHookFunction = async () => {};

    if (options.postAPIHook !== undefined) {
        postAPIHook = options.postAPIHook;
    }

    let onHandleEvent: EventHandler = () => {};
    if (options.onHandleEvent !== undefined) {
        onHandleEvent = options.onHandleEvent;
    }

    let override: {
        functions: (originalImplementation: RecipeInterface) => RecipeInterface;
    } = {
        functions: oI => oI,
        ...options.override
    };

    if (options.enableDebugLogs !== undefined && options.enableDebugLogs) {
        enableLogging();
    }

    return {
        apiDomain,
        apiBasePath,
        sessionScope,
        sessionExpiredStatusCode,
        invalidClaimStatusCode,
        autoAddCredentials,
        isInIframe,
        cookieDomain,
        preAPIHook,
        postAPIHook,
        onHandleEvent,
        override
    };
}

export function shouldDoInterceptionBasedOnUrl(
    toCheckUrl: string,
    apiDomain: string,
    cookieDomain: string | undefined
): boolean {
    logDebugMessage(
        "shouldDoInterceptionBasedOnUrl: toCheckUrl: " +
            toCheckUrl +
            " apiDomain: " +
            apiDomain +
            " cookiDomain: " +
            cookieDomain
    );
    function isNumeric(str: any) {
        if (typeof str != "string") return false; // we only process strings!
        return (
            !isNaN(str as any) && !isNaN(parseFloat(str)) // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
        ); // ...and ensure strings of whitespace fail
    }
    toCheckUrl = normaliseURLDomainOrThrowError(toCheckUrl);
    let urlObj = new URL(toCheckUrl);
    let domain = urlObj.hostname;
    if (cookieDomain === undefined) {
        domain = urlObj.port === "" ? domain : domain + ":" + urlObj.port;
        apiDomain = normaliseURLDomainOrThrowError(apiDomain);
        let apiUrlObj = new URL(apiDomain);
        return domain === (apiUrlObj.port === "" ? apiUrlObj.hostname : apiUrlObj.hostname + ":" + apiUrlObj.port);
    } else {
        let normalisedCookieDomain = normaliseSessionScopeOrThrowError(cookieDomain);
        if (cookieDomain.split(":").length > 1) {
            // means port may provided
            let portStr = cookieDomain.split(":")[cookieDomain.split(":").length - 1];
            if (isNumeric(portStr)) {
                normalisedCookieDomain += ":" + portStr;
                domain = urlObj.port === "" ? domain : domain + ":" + urlObj.port;
            }
        }
        if (cookieDomain.startsWith(".")) {
            return ("." + domain).endsWith(normalisedCookieDomain);
        } else {
            return domain === normalisedCookieDomain;
        }
    }
}

export function getNormalisedUserContext(userContext?: any): any {
    if (userContext === undefined) {
        return {};
    }

    return userContext;
}
