/**
 * When using this library with frameworks where cookie management
 * requires async handling (react-native for example) we use `getCookie`
 * and `setCookie` which are async.
 *
 * When used in cases where we need to use cookies in a synchronous way
 * (supertokens-auth-react reads cookies when rendering the UI) we use the
 * sync functions instead.
 */
export declare type CookieHandlerInterface = {
    setCookie: (cookieString: string) => Promise<void>;
    getCookie: () => Promise<string>;
    /**
     * Sync versions of the functions
     */
    setCookieSync: (cookieString: string) => void;
    getCookieSync: () => string;
};
export declare type CookieHandlerInput = (original: CookieHandlerInterface) => CookieHandlerInterface;
