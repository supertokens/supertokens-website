import { InputType } from "./utils";
import CrossDomainLocalstorage from "./crossDomainLocalstorage";
export declare class AntiCsrfToken {
    private static tokenInfo;
    private constructor();
    static getToken(associatedIdRefreshToken: string | undefined): Promise<string | undefined>;
    static removeToken(): Promise<void>;
    static setItem(associatedIdRefreshToken: string | undefined, antiCsrf: string): Promise<void>;
}
export declare class FrontToken {
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
 * @description returns true if retry, else false is session has expired completely.
 */
export declare function handleUnauthorised(refreshAPI: string, preRequestIdToken: string | undefined, refreshAPICustomHeaders: any, sessionExpiredStatusCode: number): Promise<boolean>;
/**
 * @class AuthHttpRequest
 * @description wrapper for common http methods.
 */
export default class AuthHttpRequest {
    static refreshTokenUrl: string;
    static signOutUrl: string;
    static sessionExpiredStatusCode: number;
    static initCalled: boolean;
    static originalFetch: any;
    static apiDomain: string;
    static addedFetchInterceptor: boolean;
    static sessionScope: {
        scope: string;
        authDomain: string;
    } | undefined;
    static refreshAPICustomHeaders: any;
    static signoutAPICustomHeaders: any;
    static auth0Path: string | undefined;
    static autoAddCredentials: boolean;
    static crossDomainLocalstorage: CrossDomainLocalstorage;
    static setAuth0API(apiPath: string): void;
    static getAuth0API: () => {
        apiPath: string | undefined;
    };
    static init(options: InputType): void;
    static getRefreshURLDomain: () => string;
    static getUserId(): Promise<string>;
    static getJWTPayloadSecurely(): Promise<any>;
    static signOut(): Promise<void>;
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
    static doesSessionExist: () => Promise<boolean>;
}
/**
 * @description attempts to call the refresh token API each time we are sure the session has expired, or it throws an error or,
 * or the ID_COOKIE_NAME has changed value -> which may mean that we have a new set of tokens.
 */
export declare function onUnauthorisedResponse(refreshTokenUrl: string, preRequestIdToken: string, refreshAPICustomHeaders: any, sessionExpiredStatusCode: number): Promise<{
    result: "SESSION_EXPIRED";
} | {
    result: "API_ERROR";
    error: any;
} | {
    result: "RETRY";
}>;
export declare function getIdRefreshToken(): Promise<string | undefined>;
export declare function setIdRefreshToken(idRefreshToken: string): Promise<void>;
export declare function setAntiCSRF(antiCSRFToken: string | undefined): Promise<void>;
export declare function getFrontToken(): Promise<string | null>;
export declare function setFrontToken(frontToken: string | undefined): Promise<void>;
