export declare class DateProvider {
    static readonly CLOCK_SKEW_KEY = "__st_clockSkewInMillis";
    private clockSkewInMillis;
    setClientClockSkewInMillis(clockSkewInMillis: number): void;
    getClientClockSkewInMillis(): number;
    now(): number;
}
export declare const defaultDateProviderImplementation: DateProvider;
