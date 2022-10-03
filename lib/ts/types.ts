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

import OverrideableBuilder from "supertokens-js-override";
import { CookieHandlerInput } from "./utils/cookieHandler/types";
import { WindowHandlerInput } from "./utils/windowHandler/types";

export type Event =
    | {
          action: "SIGN_OUT" | "REFRESH_SESSION" | "SESSION_CREATED" | "ACCESS_TOKEN_PAYLOAD_UPDATED";
          userContext: any;
      }
    | {
          action: "API_INVALID_CLAIM";
          claimValidationErrors: ClaimValidationError[];
          userContext: any;
      }
    | {
          action: "UNAUTHORISED";
          sessionExpiredOrRevoked: boolean;
          userContext: any;
      };

export type EventHandler = (event: Event) => void;
export type TokenType = "access" | "refresh" | "idRefresh";

export type InputType = {
    enableDebugLogs?: boolean;
    apiDomain: string;
    apiBasePath?: string;
    sessionTokenFrontendDomain?: string;
    sessionExpiredStatusCode?: number;
    invalidClaimStatusCode?: number;
    autoAddCredentials?: boolean;
    isInIframe?: boolean;
    // TODO: get rid of st-id-refresh-token, instead access token set to remove

    tokenTransferMethod?: "cookie" | "header";
    sessionTokenBackendDomain?: string;
    cookieHandler?: CookieHandlerInput;
    windowHandler?: WindowHandlerInput;
    preAPIHook?: RecipePreAPIHookFunction;
    postAPIHook?: RecipePostAPIHookFunction;
    onHandleEvent?: EventHandler;
    override?: {
        functions?: (
            originalImplementation: RecipeInterface,
            builder?: OverrideableBuilder<RecipeInterface>
        ) => RecipeInterface;
    };
};

export type NormalisedInputType = {
    apiDomain: string;
    apiBasePath: string;
    sessionTokenFrontendDomain: string;
    sessionExpiredStatusCode: number;
    invalidClaimStatusCode: number;
    autoAddCredentials: boolean;
    isInIframe: boolean;
    tokenTransferMethod: "cookie" | "header";
    sessionTokenBackendDomain: string | undefined;
    preAPIHook: RecipePreAPIHookFunction;
    postAPIHook: RecipePostAPIHookFunction;
    onHandleEvent: EventHandler;
    override: {
        functions: (
            originalImplementation: RecipeInterface,
            builder?: OverrideableBuilder<RecipeInterface>
        ) => RecipeInterface;
    };
};

export type PreAPIHookContext = {
    action: "SIGN_OUT" | "REFRESH_SESSION";
    requestInit: RequestInit;
    url: string;
    userContext: any;
};

export type RecipePreAPIHookFunction = (
    context: PreAPIHookContext
) => Promise<{ url: string; requestInit: RequestInit }>;

export type RecipePostAPIHookContext = {
    action: "SIGN_OUT" | "REFRESH_SESSION";
    requestInit: RequestInit;
    url: string;
    fetchResponse: Response;
    userContext: any;
};

export type RecipePostAPIHookFunction = (context: RecipePostAPIHookContext) => Promise<void>;

export type PreAPIHookFunction = (context: {
    requestInit: RequestInit;
    url: string;
}) => Promise<{ url: string; requestInit: RequestInit }>;

export type RecipeInterface = {
    addFetchInterceptorsAndReturnModifiedFetch: (input: { originalFetch: any; userContext: any }) => typeof fetch;

    addAxiosInterceptors: (input: { axiosInstance: any; userContext: any }) => void;

    getUserId: (input: { userContext: any }) => Promise<string>;

    getAccessTokenPayloadSecurely: (input: { userContext: any }) => Promise<any>;

    doesSessionExist: (input: { userContext: any }) => Promise<boolean>;

    signOut: (input: { userContext: any }) => Promise<void>;

    getInvalidClaimsFromResponse(input: {
        response: { data: any } | Response;
        userContext: any;
    }): Promise<ClaimValidationError[]>;

    validateClaims: (input: {
        claimValidators: SessionClaimValidator[];
        userContext: any;
    }) => Promise<ClaimValidationError[]>;

    getGlobalClaimValidators(input: {
        claimValidatorsAddedByOtherRecipes: SessionClaimValidator[];
        userContext: any;
    }): SessionClaimValidator[];
};

export type ClaimValidationResult = { isValid: true } | { isValid: false; reason?: any };
export type ClaimValidationError = {
    validatorId: string;
    reason?: any;
};

export abstract class SessionClaimValidator {
    constructor(public readonly id: string) {}

    /**
     * Makes an API call that will refresh the claim in the token.
     */
    abstract refresh(userContext: any): Promise<void>;

    /**
     * Decides if we need to refresh the claim value before checking the payload with `validate`.
     * E.g.: if the information in the payload is expired, or is not sufficient for this validator.
     */
    abstract shouldRefresh(accessTokenPayload: any, userContext: any): Promise<boolean> | boolean;

    /**
     * Decides if the claim is valid based on the accessTokenPayload object (and not checking DB or anything else)
     */
    abstract validate(
        accessTokenPayload: any,
        userContext: any
    ): Promise<ClaimValidationResult> | ClaimValidationResult;
}

export type SessionClaim<ValueType> = {
    refresh(userContext: any): Promise<void>;
    getValueFromPayload(payload: any, _userContext?: any): ValueType | undefined;
    getLastFetchedTime(payload: any, _userContext?: any): number | undefined;
};

export type ResponseWithBody =
    | {
          data: any;
      }
    | Response;
