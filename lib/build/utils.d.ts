export declare type InputType = {
    apiDomain: string;
    apiBasePath?: string;
    sessionScope?: string;
    refreshAPICustomHeaders?: any;
    sessionExpiredStatusCode?: number;
    autoAddCredentials?: boolean;
};
export declare type NormalisedInputType = {
    apiDomain: string;
    apiBasePath: string;
    sessionScope: string;
    refreshAPICustomHeaders?: any;
    sessionExpiredStatusCode: number;
    autoAddCredentials: boolean;
};
export declare function normaliseURLDomainOrThrowError(input: string, ignoreProtocol?: boolean): string;
export declare function normaliseURLPathOrThrowError(input: string): string;
export declare function normaliseSessionScopeOrThrowError(sessionScope: string): string;
export declare function validateAndNormaliseInputOrThrowError(options: InputType): NormalisedInputType;
