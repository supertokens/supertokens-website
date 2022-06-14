import { SessionClaimValidator } from "../types";

export type PrimitiveClaimValidatorConfig = {
    id: string;
    refresh: (userContext?: any) => Promise<void>;
};

type BasePrimitiveClaimValidators<T> = {
    hasValue: (val: T, id?: string) => SessionClaimValidator;
    hasFreshValue: (val: T, maxAgeInSeconds: number, id?: string) => SessionClaimValidator;
};

export class PrimitiveClaim<T, V = void> {
    public readonly id: string;

    constructor(private readonly config: PrimitiveClaimValidatorConfig, customValidators?: V) {
        this.id = config.id;
        const primitiveValidators = {
            hasValue: (val: T, id?: string): SessionClaimValidator => {
                return {
                    id: id !== undefined ? id : this.id,
                    refresh: ctx => this.config.refresh(ctx),
                    shouldRefresh: (payload, ctx) => this.getValueFromPayload(payload, ctx) === undefined,
                    validate: (payload, ctx) => {
                        const claimVal = this.getValueFromPayload(payload, ctx);
                        const isValid = claimVal === val;
                        return isValid
                            ? { isValid: isValid }
                            : {
                                  isValid,
                                  reason: { message: "wrong value", expectedValue: val, actualValue: claimVal }
                              };
                    }
                };
            },
            hasFreshValue: (val: T, maxAgeInSeconds: number, id?: string): SessionClaimValidator => {
                return {
                    id: id !== undefined ? id : this.id + "-fresh-val",
                    refresh: ctx => this.config.refresh(ctx),
                    shouldRefresh: (payload, ctx) =>
                        this.getValueFromPayload(payload, ctx) === undefined ||
                        // We know payload[this.id] is defined since the value is not undefined in this branch
                        payload[this.id].t < Date.now() - maxAgeInSeconds * 1000,
                    validate: (payload, ctx) => {
                        const claimVal = this.getValueFromPayload(payload, ctx);
                        if (claimVal !== val) {
                            return {
                                isValid: false,
                                reason: { message: "wrong value", expectedValue: val, actualValue: claimVal }
                            };
                        }
                        const ageInSeconds = (Date.now() - payload[this.id].t) / 1000;
                        if (ageInSeconds > maxAgeInSeconds) {
                            return {
                                isValid: false,
                                reason: {
                                    message: "expired",
                                    ageInSeconds,
                                    maxAgeInSeconds
                                }
                            };
                        }
                        return { isValid: true };
                    }
                };
            }
        };
        if (customValidators !== undefined) {
            this.validators = {
                ...primitiveValidators,
                ...customValidators
            };
        } else {
            this.validators = primitiveValidators as (BasePrimitiveClaimValidators<T> & V);
        }
    }

    getValueFromPayload(payload?: any, _userContext?: any): T {
        return payload[this.config.id] === undefined ? payload[this.config.id].v : undefined;
    }

    validators: BasePrimitiveClaimValidators<T> & V;
}
