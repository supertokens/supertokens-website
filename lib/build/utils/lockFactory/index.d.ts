import { LockFactory } from "./types";
export default class LockFactoryReference {
    lockFactory: LockFactory;
    private static instance?;
    constructor(lockFactory: LockFactory);
    static init(lockFactory?: LockFactory): void;
    static getReferenceOrThrow(): LockFactoryReference;
}
export { LockFactoryReference };
