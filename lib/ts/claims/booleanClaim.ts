import { SessionClaimValidator } from "../types";
import { PrimitiveClaim, PrimitiveClaimValidatorConfig } from "./primitiveClaim";

type BooleanValidators = {
    isTrue: (maxAge?: number) => SessionClaimValidator;
    isFalse: (maxAge?: number) => SessionClaimValidator;
};

export class BooleanClaim<V = void> extends PrimitiveClaim<boolean, BooleanValidators & V> {
    constructor(config: PrimitiveClaimValidatorConfig, customValidators?: V) {
        const booleanValidators: BooleanValidators = {
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
        if (customValidators) {
            super(config, {
                ...booleanValidators,
                ...customValidators
            });
        } else {
            super(config, booleanValidators as BooleanValidators & V);
        }
    }
}
