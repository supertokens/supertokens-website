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
    addFetchInterceptors: (env: any, originalFetch: any) => Promise<void>;
    addAxiosInterceptors: (axiosInstance: any) => Promise<void>;
    getUserId: () => Promise<string>;
    getJWTPayloadSecurely: () => Promise<any>;
    attemptRefreshingSession: () => Promise<boolean>;
    doesSessionExist: () => Promise<boolean>;
    signOut: () => Promise<void>;
}
