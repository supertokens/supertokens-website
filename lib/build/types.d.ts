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
        functions?: (originalImplementation: RecipeInterface) => RecipeInterface;
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
        functions: (originalImplementation: RecipeInterface) => RecipeInterface;
    };
};
export declare type PreAPIHookFunction = (context: {
    requestInit: RequestInit;
    url: string;
}) => Promise<{
    url: string;
    requestInit: RequestInit;
}>;
export interface RecipeInterface {
    addFetchInterceptorsAndReturnModifiedFetch: (originalFetch: any, config: NormalisedInputType) => typeof fetch;
    addAxiosInterceptors: (axiosInstance: any, config: NormalisedInputType) => void;
    getUserId: (config: NormalisedInputType) => Promise<string>;
    getAccessTokenPayloadSecurely: (config: NormalisedInputType) => Promise<any>;
    doesSessionExist: (config: NormalisedInputType) => Promise<boolean>;
    signOut: (config: NormalisedInputType) => Promise<void>;
}
