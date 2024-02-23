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

export function normaliseURLDomainOrThrowError(input: string): string {
    let str = new NormalisedURLDomain(input).getAsStringDangerous();
    return str;
}

export function normaliseURLPathOrThrowError(input: string): string {
    return new NormalisedURLPath(input).getAsStringDangerous();
}

export function normaliseSessionScopeOrThrowError(sessionTokenFrontendDomain: string): string {
    function helper(sessionTokenFrontendDomain: string): string {
        sessionTokenFrontendDomain = sessionTokenFrontendDomain.trim().toLowerCase();

        // first we convert it to a URL so that we can use the URL class
        if (sessionTokenFrontendDomain.startsWith(".")) {
            sessionTokenFrontendDomain = sessionTokenFrontendDomain.substr(1);
        }

        if (!sessionTokenFrontendDomain.startsWith("http://") && !sessionTokenFrontendDomain.startsWith("https://")) {
            sessionTokenFrontendDomain = "http://" + sessionTokenFrontendDomain;
        }

        try {
            let urlObj = new URL(sessionTokenFrontendDomain);
            sessionTokenFrontendDomain = urlObj.hostname;

            // remove leading dot
            if (sessionTokenFrontendDomain.startsWith(".")) {
                sessionTokenFrontendDomain = sessionTokenFrontendDomain.substr(1);
            }

            return sessionTokenFrontendDomain;
        } catch (err) {
            throw new Error("Please provide a valid sessionTokenFrontendDomain");
        }
    }

    let noDotNormalised = helper(sessionTokenFrontendDomain);

    if (noDotNormalised === "localhost" || isAnIpAddress(noDotNormalised)) {
        return noDotNormalised;
    }

    if (sessionTokenFrontendDomain.startsWith(".")) {
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
    let sessionTokenFrontendDomain = normaliseSessionScopeOrThrowError(
        options !== undefined && options.sessionTokenFrontendDomain !== undefined
            ? options.sessionTokenFrontendDomain
            : defaultSessionScope
    );

    let sessionExpiredStatusCode = 401;
    if (options.sessionExpiredStatusCode !== undefined) {
        sessionExpiredStatusCode = options.sessionExpiredStatusCode;
    }

    let invalidClaimStatusCode = 403;
    if (options.invalidClaimStatusCode !== undefined) {
        invalidClaimStatusCode = options.invalidClaimStatusCode;
    }

    if (sessionExpiredStatusCode === invalidClaimStatusCode) {
        throw new Error("sessionExpiredStatusCode and invalidClaimStatusCode cannot be the same.");
    }

    let autoAddCredentials = true;
    if (options.autoAddCredentials !== undefined) {
        autoAddCredentials = options.autoAddCredentials;
    }

    let isInIframe = false;
    if (options.isInIframe !== undefined) {
        isInIframe = options.isInIframe;
    }

    let sessionTokenBackendDomain: string | undefined = undefined;
    if (options.sessionTokenBackendDomain !== undefined) {
        sessionTokenBackendDomain = normaliseSessionScopeOrThrowError(options.sessionTokenBackendDomain);
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

    let override = {
        functions: (oI: RecipeInterface) => oI,
        ...options.override
    };

    return {
        apiDomain,
        apiBasePath,
        sessionTokenFrontendDomain,
        sessionExpiredStatusCode,
        invalidClaimStatusCode,
        autoAddCredentials,
        isInIframe,
        tokenTransferMethod: options.tokenTransferMethod !== undefined ? options.tokenTransferMethod : "cookie",
        sessionTokenBackendDomain: sessionTokenBackendDomain,
        preAPIHook,
        postAPIHook,
        onHandleEvent,
        override
    };
}

export function getNormalisedUserContext(userContext?: any): any {
    if (userContext === undefined) {
        return {};
    }

    return userContext;
}
