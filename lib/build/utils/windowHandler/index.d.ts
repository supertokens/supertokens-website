import { WindowHandlerInterface, WindowHandlerInput } from './types';
export default class WindowHandlerReference {
    private static instance?;
    windowHandler: {
        location: Pick<WindowHandlerInterface['location'], 'getHostName' | 'getOrigin'>;
    };
    constructor(windowHandlerInput?: WindowHandlerInput);
    static init(windowHandlerInput?: WindowHandlerInput): void;
    static getReferenceOrThrow(): WindowHandlerReference;
}
export { WindowHandlerReference };
