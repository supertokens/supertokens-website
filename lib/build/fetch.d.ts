import { RecipeInterface, NormalisedInputType, ResponseWithBody } from "./types";
export declare class AntiCsrfToken {
    private static tokenInfo;
    private constructor();
    static getToken(associatedIdRefreshToken: string | undefined): Promise<string | undefined>;
    static removeToken(): Promise<void>;
    static setItem(associatedIdRefreshToken: string | undefined, antiCsrf: string): Promise<void>;
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
export declare function onUnauthorisedResponse(preRequestIdToken: IdRefreshTokenType): Promise<{
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
export declare type IdRefreshTokenType = {
    status: "NOT_EXISTS" | "MAY_EXIST";
} | {
    status: "EXISTS";
    token: string;
};
export declare function getIdRefreshToken(tryRefresh: boolean): Promise<IdRefreshTokenType>;
export declare function setIdRefreshToken(idRefreshToken: string | "remove", statusCode: number): Promise<void>;
export declare function setAntiCSRF(antiCSRFToken: string | undefined): Promise<void>;
export declare function getFrontToken(): Promise<string | null>;
export declare function setFrontToken(frontToken: string | undefined): Promise<void>;
