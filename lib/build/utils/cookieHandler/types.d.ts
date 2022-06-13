/**
 * Refer to this issue to know why this is required: https://github.com/supertokens/supertokens-website/issues/134
 */
export declare type CookieHandlerInterface = {
    setCookie: (cookieString: string) => Promise<void>;
    getCookie: () => Promise<string>;
};
export declare type CookieHandlerInput = (original: CookieHandlerInterface) => CookieHandlerInterface;
