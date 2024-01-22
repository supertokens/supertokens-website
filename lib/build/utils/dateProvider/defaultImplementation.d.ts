export declare class DateProvider {
    private static instance?;
    static readonly CLOCK_SKEW_KEY = "__st_clockSkewInMillis";
    private clockSkewInMillis;
    static init(): void;
    static getReferenceOrThrow(): DateProvider;
    setClientClockSkewInMillis(clockSkewInMillis: number): void;
    getClientClockSkewInMillis(): number;
    now(): number;
}
