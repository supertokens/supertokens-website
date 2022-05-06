import { WindowHandlerInterface, WindowHandlerInput } from "./types";
export default class WindowHandlerInterfaceReference {
    private static instance?;
    windowHandler: WindowHandlerInterface;
    constructor(windowHandlerInput?: WindowHandlerInput);
    static init(windowHandlerInput?: WindowHandlerInput): void;
    static getReferenceOrThrow(): WindowHandlerInterfaceReference;
}
export { WindowHandlerInterfaceReference };
