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

export type Event =
    | {
          action: "SIGN_OUT" | "REFRESH_SESSION" | "SESSION_CREATED";
          userContext: any;
      }
    | {
          action: "UNAUTHORISED";
          sessionExpiredOrRevoked: boolean;
          userContext: any;
      };

export type EventHandler = (event: Event) => void;

export type InputType = {
    apiDomain: string;
    apiBasePath?: string;
    sessionScope?: string;
    sessionExpiredStatusCode?: number;
    autoAddCredentials?: boolean;
    isInIframe?: boolean;
    cookieDomain?: string;
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
    sessionScope: string;
    sessionExpiredStatusCode: number;
    autoAddCredentials: boolean;
    isInIframe: boolean;
    cookieDomain: string | undefined;
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
};
