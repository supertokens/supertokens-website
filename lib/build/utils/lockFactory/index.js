"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LockFactoryReference = void 0;
var browser_tabs_lock_1 = require("browser-tabs-lock");
var defaultFactory = function () {
    return Promise.resolve(new browser_tabs_lock_1.default());
};
var LockFactoryReference = /** @class */ (function () {
    function LockFactoryReference(lockFactory) {
        this.lockFactory = lockFactory;
    }
    LockFactoryReference.init = function (lockFactory) {
        // This is copied from the other XXXReference clasess
        if (this.instance !== undefined) {
            return;
        }
        this.instance = new LockFactoryReference(
            lockFactory !== null && lockFactory !== void 0 ? lockFactory : defaultFactory
        );
    };
    LockFactoryReference.getReferenceOrThrow = function () {
        if (LockFactoryReference.instance === undefined) {
            throw new Error("SuperTokensLockReference must be initialized before calling this method.");
        }
        return LockFactoryReference.instance;
    };
    return LockFactoryReference;
})();
exports.LockFactoryReference = LockFactoryReference;
exports.default = LockFactoryReference;
