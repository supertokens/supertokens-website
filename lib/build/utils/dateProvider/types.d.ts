export interface DateProviderInterface {
    getThresholdInSeconds(): number;
    now(): number;
    setClientClockSkewInMillis(clockSkewInMillis: number): void;
    getClientClockSkewInMillis(): number;
}
export declare type DateProviderInput = () => DateProviderInterface;
