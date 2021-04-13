export default class CrossDomainLocalstorage {
    sessionScope: {
        scope: string;
        authDomain: string;
    } | undefined;
    iframe: any | undefined;
    constructor(sessionScope: {
        scope: string;
        authDomain: string;
    } | undefined);
    sendMessageAndGetResponseToDestinationIframe: (message: any) => Promise<string | null>;
    iFrameListener: (event: any) => void;
    isAuthDomain: () => boolean;
    isInIFrame: () => boolean;
    getItem: (key: string) => Promise<string | null>;
    removeItem: (key: string) => Promise<any>;
    setItem: (key: string, value: string) => Promise<any>;
}
