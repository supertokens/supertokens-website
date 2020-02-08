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
