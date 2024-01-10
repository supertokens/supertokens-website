declare class DateProvider {
    private clientClockDeviationInMillis;
    setClientClockDeviationInMillis(deviation: number): void;
    getClientClockDeviationInMills(): number;
    now(): number;
}
export declare const defaultDateProviderImplementation: DateProvider;
export {};
