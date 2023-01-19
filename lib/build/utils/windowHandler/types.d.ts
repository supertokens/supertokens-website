/**
 * Refer to this issue to know why this is required: https://github.com/supertokens/supertokens-website/issues/134
 */
export declare type StorageHandler = {
    key: (index: number) => Promise<string | null>;
    getItem: (key: string) => Promise<string | null>;
    clear: () => Promise<void>;
    removeItem: (key: string) => Promise<void>;
    setItem: (key: string, value: string) => Promise<void>;
    /**
     * Sync versions of the storage functions
     */
    keySync: (index: number) => string | null;
    getItemSync: (key: string) => string | null;
    clearSync: () => void;
    removeItemSync: (key: string) => void;
    setItemSync: (key: string, value: string) => void;
};
export declare type WindowHandlerInterface = {
    history: {
        replaceState: (data: any, unused: string, url?: string | null) => void;
        getState: () => any;
    };
    location: {
        getHref: () => string;
        setHref: (href: string) => void;
        getSearch: () => string;
        getHash: () => string;
        getPathName: () => string;
        assign: (url: string | URL) => void;
        getOrigin: () => string;
        getHostName: () => string;
        getHost: () => string;
    };
    getDocument: () => Document;
    localStorage: StorageHandler;
    sessionStorage: StorageHandler;
    getWindowUnsafe: () => typeof window;
};
export declare type WindowHandlerInput = (original: WindowHandlerInterface) => WindowHandlerInterface;
