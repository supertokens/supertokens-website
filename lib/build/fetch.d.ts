import { RecipeInterface, NormalisedInputType, ResponseWithBody, TokenType } from "./types";
export declare class AntiCsrfToken {
    private static tokenInfo;
    private constructor();
    static getToken(associatedAccessTokenUpdate: string | undefined): Promise<string | undefined>;
    static removeToken(): Promise<void>;
    static setItem(associatedAccessTokenUpdate: string | undefined, antiCsrf: string): Promise<void>;
}
export declare class FrontToken {
    private static waiters;
    private constructor();
    static getTokenInfo(): Promise<{
        uid: string;
        ate: number;
        up: any;
    } | undefined>;
    static removeToken(): Promise<void>;
    static setItem(frontToken: string): Promise<void>;
    static doesTokenExists(): Promise<boolean>;
}
/**
 * @class AuthHttpRequest
 * @description wrapper for common http methods.
 */
export default class AuthHttpRequest {
    static refreshTokenUrl: string;
    static signOutUrl: string;
    static initCalled: boolean;
    static rid: string;
    static env: any;
    static recipeImpl: RecipeInterface;
    static config: NormalisedInputType;
    static init(config: NormalisedInputType, recipeImpl: RecipeInterface): void;
    static doRequest: (httpCall: (config?: RequestInit) => Promise<Response>, config?: RequestInit, url?: any) => Promise<Response>;
    static attemptRefreshingSession: () => Promise<boolean>;
}
/**
 * @description attempts to call the refresh token API each time we are sure the session has expired, or it throws an error or,
 * or the ID_COOKIE_NAME has changed value -> which may mean that we have a new set of tokens.
 */
export declare function onUnauthorisedResponse(preRequestLSS: LocalSessionState): Promise<{
    result: "SESSION_EXPIRED";
    error?: any;
} | {
    result: "API_ERROR";
    error: any;
} | {
    result: "RETRY";
}>;
export declare function onTokenUpdate(): void;
export declare function onInvalidClaimResponse(response: ResponseWithBody): Promise<void>;
export declare type LocalSessionState = {
    status: "NOT_EXISTS" | "MAY_EXIST";
} | {
    status: "EXISTS";
    lastAccessTokenUpdate: string;
};
export declare function getLocalSessionState(tryRefresh: boolean): Promise<LocalSessionState>;
export declare function getStorageNameForToken(tokenType: TokenType): "st-access-token" | "st-refresh-token";
export declare function setToken(tokenType: TokenType, value: string): Promise<void>;
export declare function getTokenForHeaderAuth(tokenType: TokenType): Promise<string | undefined>;
export declare function saveLastAccessTokenUpdate(): Promise<void>;
export declare function setAntiCSRF(antiCSRFToken: string | undefined): Promise<void>;
export declare function getFrontToken(): Promise<string | null>;
export declare function setFrontToken(frontToken: string | undefined): Promise<void>;
export declare function fireSessionUpdateEventsIfNecessary(wasLoggedIn: boolean, status: number, frontTokenHeaderFromResponse: string | null | undefined): void;
/**
 * Updates the clock skew based on the provided frontToken and responseHeaders.
 */
export declare const updateClockSkewUsingFrontToken: ({ frontToken, responseHeaders }: {
    frontToken: string | undefined | null;
    responseHeaders: Headers;
}) => void;
