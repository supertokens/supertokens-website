export declare class AntiCsrfToken {
    private static tokenInfo;
    private constructor();
    static getToken(associatedIdRefreshToken: string | undefined): string | undefined;
    static removeToken(): void;
    static setItem(associatedIdRefreshToken: string | undefined, antiCsrf: string): undefined;
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
    private static refreshTokenUrl;
    private static sessionExpiredStatusCode;
    private static initCalled;
    static originalFetch: any;
    private static apiDomain;
    private static viaInterceptor;
    private static websiteRootDomain;
    private static refreshAPICustomHeaders;
    static init(refreshTokenUrl: string, sessionExpiredStatusCode?: number, viaInterceptor?: boolean, websiteRootDomain?: string, refreshAPICustomHeaders?: any): void;
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
    static get: (url: RequestInfo, config?: RequestInit | undefined) => Promise<Response>;
    static post: (url: RequestInfo, config?: RequestInit | undefined) => Promise<Response>;
    static delete: (url: RequestInfo, config?: RequestInit | undefined) => Promise<Response>;
    static put: (url: RequestInfo, config?: RequestInit | undefined) => Promise<Response>;
    static fetch: (url: RequestInfo, config?: RequestInit | undefined) => Promise<Response>;
    static doesSessionExist: () => boolean;
}
