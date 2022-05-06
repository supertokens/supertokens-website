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
    };
    getDocument: () => Document;
    getLocalStorage: () => Storage;
    getSessionStorage: () => Storage;
};
export declare type WindowHandlerInput = (original: WindowHandlerInterface) => WindowHandlerInterface;
