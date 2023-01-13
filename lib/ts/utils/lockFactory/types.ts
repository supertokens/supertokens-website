import type BrowserTabsLock from 'browser-tabs-lock'

export type Lock = Pick<BrowserTabsLock, 'releaseLock' | 'acquireLock'>
export type LockFactory = () => Lock
