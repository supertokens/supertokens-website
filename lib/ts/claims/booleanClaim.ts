import { SessionClaimValidator } from "../types";
import { PrimitiveClaim, PrimitiveClaimConfig } from "./primitiveClaim";

type BooleanValidators = {
    isTrue: (maxAge?: number) => SessionClaimValidator;
    isFalse: (maxAge?: number) => SessionClaimValidator;
};

export class BooleanClaim extends PrimitiveClaim<boolean> {
    constructor(config: PrimitiveClaimConfig) {
        super(config);
        this.validators = {
            ...this.validators,
            isTrue: (maxAge?: number): SessionClaimValidator => {
                return this.validators.hasValue(true, maxAge);
            },
            isFalse: (maxAge?: number): SessionClaimValidator => {
                return this.validators.hasValue(false, maxAge);
            },
        };
    }

    validators!: PrimitiveClaim<boolean>["validators"] & BooleanValidators;
}
