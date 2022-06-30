import { SessionClaimValidator } from "../types";
export declare type PrimitiveClaimValidatorConfig = {
    id: string;
    refresh: (userContext?: any) => Promise<void>;
};
declare type BasePrimitiveClaimValidators<T> = {
    hasValue: (val: T, id?: string) => SessionClaimValidator;
    hasFreshValue: (val: T, maxAgeInSeconds: number, id?: string) => SessionClaimValidator;
};
export declare class PrimitiveClaim<T, V extends Record<string, (...arsg: any[]) => SessionClaimValidator> | void = void> {
    protected readonly config: PrimitiveClaimValidatorConfig;
    readonly id: string;
    readonly refresh: (userContext?: any) => Promise<void>;
    constructor(config: PrimitiveClaimValidatorConfig, customValidators?: V);
    getValueFromPayload(payload: any, _userContext?: any): T;
    getLastFetchedTime(payload: any, _userContext?: any): Date | undefined;
    validators: BasePrimitiveClaimValidators<T> & V;
}
export {};
