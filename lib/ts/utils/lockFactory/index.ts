import { LockFactory } from "./types";
import Lock from "browser-tabs-lock";
import { StorageHandler } from "../windowHandler/types";

const defaultFactory = (storageHandler?: StorageHandler) => () => Promise.resolve(new Lock(storageHandler));

export default class LockFactoryReference {
    private static instance?: LockFactoryReference;

    constructor(public lockFactory: LockFactory) {}

    static init(lockFactory?: LockFactory, storageHandler?: StorageHandler) {
        // This is copied from the other XXXReference clasess
        if (this.instance !== undefined) {
            return;
        }
        this.instance = new LockFactoryReference(lockFactory ?? defaultFactory(storageHandler));
    }

    static getReferenceOrThrow() {
        if (LockFactoryReference.instance === undefined) {
            throw new Error("SuperTokensLockReference must be initialized before calling this method.");
        }

        return LockFactoryReference.instance;
    }
}

export { LockFactoryReference };
