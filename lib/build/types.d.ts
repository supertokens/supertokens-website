import OverrideableBuilder from "supertokens-js-override";
import { CookieHandlerInput } from "./utils/cookieHandler/types";
import { WindowHandlerInput } from "./utils/windowHandler/types";
export declare type Event = {
    action: "SIGN_OUT" | "REFRESH_SESSION" | "SESSION_CREATED" | "ACCESS_TOKEN_PAYLOAD_UPDATED";
    userContext: any;
} | {
    action: "UNAUTHORISED";
    sessionExpiredOrRevoked: boolean;
    userContext: any;
};
export declare type EventHandler = (event: Event) => void;
export declare type InputType = {
    enableDebugLogs?: boolean;
    apiDomain: string;
    apiBasePath?: string;
    sessionScope?: string;
    sessionExpiredStatusCode?: number;
    autoAddCredentials?: boolean;
    isInIframe?: boolean;
    cookieDomain?: string;
    cookieHandler?: CookieHandlerInput;
    windowHandler?: WindowHandlerInput;
    preAPIHook?: RecipePreAPIHookFunction;
    postAPIHook?: RecipePostAPIHookFunction;
    onHandleEvent?: EventHandler;
    override?: {
        functions?: (originalImplementation: RecipeInterface, builder?: OverrideableBuilder<RecipeInterface>) => RecipeInterface;
    };
};
export declare type NormalisedInputType = {
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
        functions: (originalImplementation: RecipeInterface, builder?: OverrideableBuilder<RecipeInterface>) => RecipeInterface;
    };
};
export declare type PreAPIHookContext = {
    action: "SIGN_OUT" | "REFRESH_SESSION";
    requestInit: RequestInit;
    url: string;
    userContext: any;
};
export declare type RecipePreAPIHookFunction = (context: PreAPIHookContext) => Promise<{
    url: string;
    requestInit: RequestInit;
}>;
export declare type RecipePostAPIHookContext = {
    action: "SIGN_OUT" | "REFRESH_SESSION";
    requestInit: RequestInit;
    url: string;
    fetchResponse: Response;
    userContext: any;
};
export declare type RecipePostAPIHookFunction = (context: RecipePostAPIHookContext) => Promise<void>;
export declare type PreAPIHookFunction = (context: {
    requestInit: RequestInit;
    url: string;
}) => Promise<{
    url: string;
    requestInit: RequestInit;
}>;
export declare type RecipeInterface = {
    addFetchInterceptorsAndReturnModifiedFetch: (input: {
        originalFetch: any;
        userContext: any;
    }) => typeof fetch;
    addAxiosInterceptors: (input: {
        axiosInstance: any;
        userContext: any;
    }) => void;
    getUserId: (input: {
        userContext: any;
    }) => Promise<string>;
    getAccessTokenPayloadSecurely: (input: {
        userContext: any;
    }) => Promise<any>;
    doesSessionExist: (input: {
        userContext: any;
    }) => Promise<boolean>;
    signOut: (input: {
        userContext: any;
    }) => Promise<void>;
};
