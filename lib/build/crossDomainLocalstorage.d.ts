export default class CrossDomainLocalstorage {
    sessionScope: {
        scope: string;
        authDomain: string;
    } | undefined;
    constructor(sessionScope: {
        scope: string;
        authDomain: string;
    } | undefined);
    isInIFrame: () => boolean;
    getItem: (key: string) => string | null;
    removeItem: (key: string) => any;
    setItem: (key: string, value: string) => any;
}
