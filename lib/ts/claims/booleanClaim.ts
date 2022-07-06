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
                if (maxAge) {
                    return this.validators.hasFreshValue(true, maxAge);
                }
                return this.validators.hasValue(true);
            },
            isFalse: (maxAge?: number): SessionClaimValidator => {
                if (maxAge) {
                    return this.validators.hasFreshValue(false, maxAge);
                }
                return this.validators.hasValue(false);
            }
        };
    }

    validators!: PrimitiveClaim<boolean>["validators"] & BooleanValidators;
}
