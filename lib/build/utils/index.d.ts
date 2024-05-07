import { InputType, NormalisedInputType } from "../types";
export declare function normaliseURLDomainOrThrowError(input: string): string;
export declare function normaliseURLPathOrThrowError(input: string): string;
export declare function normaliseSessionScopeOrThrowError(sessionScope: string): string;
export declare function validateAndNormaliseInputOrThrowError(options: InputType): NormalisedInputType;
export declare function getNormalisedUserContext(userContext?: any): any;
/**
 * Checks if a given string matches any subdomain or the main domain of a specified hostname.
 *
 * @param {string} hostname - The hostname to derive subdomains from.
 * @param {string} str - The string to compare against the subdomains.
 * @returns {boolean} True if the string matches any subdomain or the main domain, otherwise false.
 */
export declare function matchesDomainOrSubdomain(hostname: string, str: string): boolean;
