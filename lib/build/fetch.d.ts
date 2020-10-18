export declare class AntiCsrfToken {
    private static tokenInfo;
    private constructor();
    static getToken(associatedIdRefreshToken: string | undefined): string | undefined;
    static removeToken(): void;
    static setItem(associatedIdRefreshToken: string | undefined, antiCsrf: string): undefined;
}
export declare class FrontToken {
    private constructor();
    static getTokenInfo(): {
        uid: string;
        ate: number;
        up: any;
    } | undefined;
    static removeToken(): void;
    static setItem(frontToken: string): void;
}
/**
 * @description returns true if retry, else false is session has expired completely.
 */
export declare function handleUnauthorised(refreshAPI: string | undefined, preRequestIdToken: string | undefined, websiteRootDomain: string, refreshAPICustomHeaders: any, sessionExpiredStatusCode: number): Promise<boolean>;
export declare function getDomainFromUrl(url: string): string;
/**
 * @class AuthHttpRequest
 * @description wrapper for common http methods.
 */
export default class AuthHttpRequest {
    static refreshTokenUrl: string | undefined;
    static sessionExpiredStatusCode: number;
    static initCalled: boolean;
    static originalFetch: any;
    static apiDomain: string;
    static addedFetchInterceptor: boolean;
    static websiteRootDomain: string;
    static refreshAPICustomHeaders: any;
    static auth0Path: string | undefined;
    static autoAddCredentials: boolean;
    static setAuth0API(apiPath: string): void;
    static getAuth0API: () => {
        apiPath: string | undefined;
    };
    static init(options: {
        refreshTokenUrl: string;
        websiteRootDomain?: string;
        refreshAPICustomHeaders?: any;
        sessionExpiredStatusCode?: number;
        autoAddCredentials?: boolean;
    }): void;
    static getRefreshURLDomain: () => string | undefined;
    static getUserId(): string;
    static getJWTPayloadSecurely(): Promise<any>;
    /**
     * @description sends the actual http request and returns a response if successful/
     * If not successful due to session expiry reasons, it
     * attempts to call the refresh token API and if that is successful, calls this API again.
     * @throws Error
     */
    private static doRequest;
    /**
     * @description attempts to refresh session regardless of expiry
     * @returns true if successful, else false if session has expired. Wrapped in a Promise
     * @throws error if anything goes wrong
     */
    static attemptRefreshingSession: () => Promise<boolean>;
    private static fetch;
    static doesSessionExist: () => boolean;
}
/**
 * @description attempts to call the refresh token API each time we are sure the session has expired, or it throws an error or,
 * or the ID_COOKIE_NAME has changed value -> which may mean that we have a new set of tokens.
 */
export declare function onUnauthorisedResponse(refreshTokenUrl: string, preRequestIdToken: string, websiteRootDomain: string, refreshAPICustomHeaders: any, sessionExpiredStatusCode: number): Promise<{
    result: "SESSION_EXPIRED";
} | {
    result: "API_ERROR";
    error: any;
} | {
    result: "RETRY";
}>;
export declare function getIDFromCookie(): string | undefined;
export declare function setIDToCookie(idRefreshToken: string, domain: string): void;
export declare function getAntiCSRFromCookie(domain: string): string | null;
export declare function setAntiCSRFToCookie(antiCSRFToken: string | undefined, domain: string): void;
export declare function getFrontTokenFromCookie(): string | null;
export declare function setFrontTokenToCookie(frontToken: string | undefined, domain: string): void;
