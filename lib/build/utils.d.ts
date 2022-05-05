import { CookieHandler } from "./common/cookieHandling/types";
import { CookieHandlerInput, InputType, NormalisedInputType } from "./types";
export declare function normaliseURLDomainOrThrowError(input: string): string;
export declare function normaliseURLPathOrThrowError(input: string): string;
export declare function normaliseSessionScopeOrThrowError(sessionScope: string): string;
export declare function validateAndNormaliseInputOrThrowError(options: InputType): NormalisedInputType;
export declare function shouldDoInterceptionBasedOnUrl(toCheckUrl: string, apiDomain: string, cookieDomain: string | undefined): boolean;
export declare function normaliseCookieHandler(cookieHandlerInput?: CookieHandlerInput): CookieHandler;
