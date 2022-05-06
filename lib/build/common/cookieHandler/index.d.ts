import { CookieHandlerInterface, CookieHandlerInput } from "./types";
export default class CookieHandlerInterfaceReference {
    private static instance?;
    cookieHandler: CookieHandlerInterface;
    constructor(cookieHandlerInput?: CookieHandlerInput);
    static init(cookieHandlerInput?: CookieHandlerInput): void;
    static getReferenceOrThrow(): CookieHandlerInterfaceReference;
}
export { CookieHandlerInterfaceReference };
