export declare function getWindowOrThrow(): Window;
export declare const WindowUtilities: {
    history: {
        replaceState: (data: any, unused: string, url?: string | null | undefined) => void;
        readonly state: any;
    };
    location: {
        href: string;
        readonly search: string;
        readonly hash: string;
        readonly pathname: string;
        assign: (url: string) => void;
        readonly origin: string;
        readonly hostname: string;
    };
    readonly document: Document;
    readonly sessionStorage: Storage;
    readonly localStorage: Storage;
    getCookie: () => string;
    setCookie: (newCookie: string) => void;
};
export declare function isRunningInElectron(): boolean;
