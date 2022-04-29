export declare function getWindowOrThrow(): Window;
export declare const WindowUtilities: {
    readonly fetch: ((input: RequestInfo, init?: RequestInit | undefined) => Promise<Response>) & typeof fetch;
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
};
export declare function isRunningInElectron(): boolean;
