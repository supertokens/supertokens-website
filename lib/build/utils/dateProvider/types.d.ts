export interface DateProviderInterface {
    now(): number;
    setClientClockSkewInMillis(clockSkewInMillis: number): void;
    getClientClockSkewInMillis(): number;
}
export declare type DateProviderInput = (original: DateProviderInterface) => DateProviderInterface;
