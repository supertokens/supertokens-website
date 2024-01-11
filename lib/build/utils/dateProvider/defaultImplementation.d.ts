declare class DateProvider {
    private static readonly CLOCK_SKEW_KEY;
    setClientClockSkewInMillis(clockSkewInMillis: number): void;
    getClientClockSkewInMillis(): number;
    now(): number;
}
export declare const defaultDateProviderImplementation: DateProvider;
export {};
