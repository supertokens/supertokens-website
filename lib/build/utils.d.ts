export declare type InputType = {
    apiDomain: string;
    apiBasePath?: string;
    sessionScope?: {
        scope: string;
        authDomain: string;
    };
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
    sessionScope: {
        scope: string;
        authDomain: string;
    } | undefined;
    refreshAPICustomHeaders?: any;
    signoutAPICustomHeaders?: any;
    sessionExpiredStatusCode: number;
    autoAddCredentials: boolean;
    isInIframe: boolean;
    cookieDomain: string | undefined;
};
export declare function isAnIpAddress(ipaddress: string): boolean;
export declare function normaliseURLDomainOrThrowError(input: string): string;
export declare function normaliseURLPathOrThrowError(input: string): string;
export declare function normaliseSessionScopeOrThrowError(sessionScope: string): string;
export declare function validateAndNormaliseInputOrThrowError(options: InputType): NormalisedInputType;
export declare function getWindowOrThrow(): any;
export declare function shouldDoInterceptionBasedOnUrl(toCheckUrl: string, apiDomain: string, cookieDomain: string | undefined): boolean;
