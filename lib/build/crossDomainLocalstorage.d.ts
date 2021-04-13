export default class CrossDomainLocalstorage {
    sessionScope: {
        scope: string;
        authDomain: string;
    } | undefined;
    iframe: any | undefined;
    nextMessageID: number;
    toSendMessageQueueBeforeIframeLoads: any[];
    waiterFunctionsForResultFromIframe: ((data: any) => void)[];
    constructor(sessionScope: {
        scope: string;
        authDomain: string;
    } | undefined);
    sendMessageAndGetResponseToDestinationIframe: (message: any) => Promise<string | null>;
    messageFromIFrameListener: (event: any) => void;
    iFrameListener: (event: any) => void;
    isAuthDomain: () => boolean;
    isInIFrame: () => boolean;
    getItem: (key: string) => Promise<string | null>;
    removeItem: (key: string) => Promise<any>;
    setItem: (key: string, value: string) => Promise<any>;
}
