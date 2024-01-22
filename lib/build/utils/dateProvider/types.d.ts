export interface DateProviderInterface {
    getThresholdInSeconds(): number;
    setThresholdInSeconds(thresholdInSeconds: number): void;
    now(): number;
    setClientClockSkewInMillis(clockSkewInMillis: number): void;
    getClientClockSkewInMillis(): number;
}
export declare type DateProviderInput = () => DateProviderInterface;
