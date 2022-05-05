export declare type CookieHandler = {
    setCookie: (cookieString: string) => Promise<void>;
    getCookie: () => Promise<string>;
    /**
     * Sync versions of the functions
     */
    setCookieSync: (cookieString: string) => void;
    getCookieSync: () => string;
};
