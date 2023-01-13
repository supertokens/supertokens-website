import { LockFactory } from "./types";
import Lock from 'browser-tabs-lock'

const defaultFactory = () => new Lock()

export class LockFactoryReference {
    private static instance?: LockFactoryReference;

    constructor(public lockFactory: LockFactory) {}

    static init(lockFactory?: LockFactory) {
        // This is copied from the other XXXReference clasess
        if (this.instance !== undefined) {
            return
        }
        this.instance = new LockFactoryReference(lockFactory ?? defaultFactory)
    }

    static getReferenceOrThrow() {
        if (LockFactoryReference.instance === undefined) {
            throw new Error("SuperTokensLockReference must be initialized before calling this method.");
        }

        return LockFactoryReference.instance;
    }
}
