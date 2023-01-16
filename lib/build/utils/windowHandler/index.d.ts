import { WindowHandlerInterface, WindowHandlerInput } from "./types";
export default class WindowHandlerReference {
    private static instance?;
    windowHandler: WindowHandlerInterface;
    constructor(windowHandlerInput?: WindowHandlerInput);
    static init(windowHandlerInput?: WindowHandlerInput): void;
    static getReferenceOrThrow(): WindowHandlerReference;
}
export { WindowHandlerReference };
