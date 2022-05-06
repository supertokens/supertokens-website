import { CookieHandlerInterface, CookieHandlerInput } from "./types";
export default class CookieHandlerReference {
    private static instance?;
    cookieHandler: CookieHandlerInterface;
    constructor(cookieHandlerInput?: CookieHandlerInput);
    static init(cookieHandlerInput?: CookieHandlerInput): void;
    static getReferenceOrThrow(): CookieHandlerReference;
}
export { CookieHandlerReference };
