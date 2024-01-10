export interface DateProviderInterface {
    now(): number;
    setClientClockDeviationInMillis(deviation: number): void;
    getClientClockDeviationInMills(): number;
}
export declare type DateProviderInput = (original: DateProviderInterface) => DateProviderInterface;
