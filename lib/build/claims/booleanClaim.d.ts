import { SessionClaimValidator } from "../types";
import { PrimitiveClaim, PrimitiveClaimConfig } from "./primitiveClaim";
declare type BooleanValidators = {
    isTrue: (maxAge?: number) => SessionClaimValidator;
    isFalse: (maxAge?: number) => SessionClaimValidator;
};
export declare class BooleanClaim extends PrimitiveClaim<boolean> {
    constructor(config: PrimitiveClaimConfig);
    validators: PrimitiveClaim<boolean>["validators"] & BooleanValidators;
}
export {};
