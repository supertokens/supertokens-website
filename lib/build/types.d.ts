import OverrideableBuilder from "supertokens-js-override";
export declare type Event = {
    action: "SIGN_OUT" | "REFRESH_SESSION" | "SESSION_CREATED";
} | {
    action: "UNAUTHORISED";
    sessionExpiredOrRevoked: boolean;
};
export declare type EventHandler = (event: Event) => void;
export declare type InputType = {
    apiDomain: string;
    apiBasePath?: string;
    sessionScope?: string;
    sessionExpiredStatusCode?: number;
    autoAddCredentials?: boolean;
    isInIframe?: boolean;
    cookieDomain?: string;
    preAPIHook?: (context: {
        action: "SIGN_OUT" | "REFRESH_SESSION";
        requestInit: RequestInit;
        url: string;
    }) => Promise<{
        url: string;
        requestInit: RequestInit;
    }>;
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
    preAPIHook: (context: {
        action: "SIGN_OUT" | "REFRESH_SESSION";
        requestInit: RequestInit;
        url: string;
    }) => Promise<{
        url: string;
        requestInit: RequestInit;
    }>;
    onHandleEvent: EventHandler;
    override: {
        functions: (originalImplementation: RecipeInterface, builder?: OverrideableBuilder<RecipeInterface>) => RecipeInterface;
    };
};
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
        config: NormalisedInputType;
        userContext: any;
    }) => typeof fetch;
    addAxiosInterceptors: (input: {
        axiosInstance: any;
        config: NormalisedInputType;
        userContext: any;
    }) => void;
    getUserId: (input: {
        config: NormalisedInputType;
        userContext: any;
    }) => Promise<string>;
    getAccessTokenPayloadSecurely: (input: {
        config: NormalisedInputType;
        userContext: any;
    }) => Promise<any>;
    doesSessionExist: (input: {
        config: NormalisedInputType;
        userContext: any;
    }) => Promise<boolean>;
    signOut: (input: {
        config: NormalisedInputType;
        userContext: any;
    }) => Promise<void>;
};
