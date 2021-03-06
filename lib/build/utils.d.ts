import { InputType, NormalisedInputType } from "./types";
export declare function isAnIpAddress(ipaddress: string): boolean;
export declare function normaliseURLDomainOrThrowError(input: string): string;
export declare function normaliseURLPathOrThrowError(input: string): string;
export declare function normaliseSessionScopeOrThrowError(sessionScope: string): string;
export declare function validateAndNormaliseInputOrThrowError(options: InputType): NormalisedInputType;
export declare function getWindowOrThrow(): any;
export declare function shouldDoInterceptionBasedOnUrl(toCheckUrl: string, apiDomain: string, cookieDomain: string | undefined): boolean;
