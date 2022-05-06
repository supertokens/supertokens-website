import { WindowHandler, WindowHandlerInput } from "./common/windowHandling/types";
export default class SuperTokensWindowHandler {
    private static instance?;
    windowHandler: WindowHandler;
    constructor(windowHandlerInput?: WindowHandlerInput);
    static init(windowHandlerInput?: WindowHandlerInput): void;
    static getInstanceOrThrow(): SuperTokensWindowHandler;
}
export { SuperTokensWindowHandler };
