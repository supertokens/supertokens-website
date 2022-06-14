import { SessionClaimValidator } from "../types";
export declare type PrimitiveClaimValidatorConfig = {
    id: string;
    refresh: (userContext?: any) => Promise<void>;
};
declare type BasePrimitiveClaimValidators<T> = {
    hasValue: (val: T, id?: string) => SessionClaimValidator;
    hasFreshValue: (val: T, maxAgeInSeconds: number, id?: string) => SessionClaimValidator;
};
export declare class PrimitiveClaim<T, V = void> {
    private readonly config;
    readonly id: string;
    constructor(config: PrimitiveClaimValidatorConfig, customValidators?: V);
    getValueFromPayload(payload?: any, _userContext?: any): T;
    validators: BasePrimitiveClaimValidators<T> & V;
}
export {};
