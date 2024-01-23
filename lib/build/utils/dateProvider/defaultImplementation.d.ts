export declare class DateProvider {
    private static instance?;
    static readonly CLOCK_SKEW_KEY = "__st_clockSkewInMillis";
    private clockSkewInMillis;
    private thresholdInSeconds;
    static init(): void;
    static getReferenceOrThrow(): DateProvider;
    getThresholdInSeconds(): number;
    setThresholdInSeconds(thresholdInSeconds: number): void;
    setClientClockSkewInMillis(clockSkewInMillis: number): void;
    getClientClockSkewInMillis(): number;
    now(): number;
}
