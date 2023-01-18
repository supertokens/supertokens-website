import type BrowserTabsLock from "browser-tabs-lock";
export declare type Lock = Pick<BrowserTabsLock, "releaseLock" | "acquireLock">;
export declare type LockFactory = () => Promise<Lock>;
