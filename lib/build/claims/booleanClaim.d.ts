import { SessionClaimValidator } from "../types";
import { PrimitiveClaim, PrimitiveClaimValidatorConfig } from "./primitiveClaim";
declare type BooleanValidators = {
    isTrue: (maxAge?: number) => SessionClaimValidator;
    isFalse: (maxAge?: number) => SessionClaimValidator;
};
export declare class BooleanClaim<V extends Record<string, (...arsg: any[]) => SessionClaimValidator> | void = void> extends PrimitiveClaim<boolean, BooleanValidators & V> {
    constructor(config: PrimitiveClaimValidatorConfig, customValidators?: V);
}
export {};
