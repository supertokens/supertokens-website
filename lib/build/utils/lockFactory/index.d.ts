import { LockFactory } from "./types";
import { StorageHandler } from "../windowHandler/types";
export default class LockFactoryReference {
    lockFactory: LockFactory;
    private static instance?;
    constructor(lockFactory: LockFactory);
    static init(lockFactory?: LockFactory, storageHandler?: StorageHandler): void;
    static getReferenceOrThrow(): LockFactoryReference;
}
export { LockFactoryReference };
