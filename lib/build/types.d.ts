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
