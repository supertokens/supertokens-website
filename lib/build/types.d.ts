export declare type InputType = {
    apiDomain: string;
    apiBasePath?: string;
    sessionScope?: string;
    refreshAPICustomHeaders?: any;
    signoutAPICustomHeaders?: any;
    sessionExpiredStatusCode?: number;
    autoAddCredentials?: boolean;
    isInIframe?: boolean;
    cookieDomain?: string;
};
export declare type NormalisedInputType = {
    apiDomain: string;
    apiBasePath: string;
    sessionScope: string;
    refreshAPICustomHeaders?: any;
    signoutAPICustomHeaders?: any;
    sessionExpiredStatusCode: number;
    autoAddCredentials: boolean;
    isInIframe: boolean;
    cookieDomain: string | undefined;
};
export declare type PreAPIHookFunction = (context: {
    requestInit: RequestInit;
    url: string;
}) => Promise<{
    url: string;
    requestInit: RequestInit;
}>;
export interface RecipeInterface {
    addFetchInterceptors: (env: any, originalFetch: any, config: NormalisedInputType) => Promise<void>;
    addAxiosInterceptors: (axiosInstance: any, config: NormalisedInputType) => Promise<void>;
    getUserId: (config: NormalisedInputType) => Promise<string>;
    getJWTPayloadSecurely: (config: NormalisedInputType) => Promise<any>;
    attemptRefreshingSession: (config: NormalisedInputType) => Promise<boolean>;
    doesSessionExist: (config: NormalisedInputType) => Promise<boolean>;
    signOut: (config: NormalisedInputType) => Promise<void>;
}
