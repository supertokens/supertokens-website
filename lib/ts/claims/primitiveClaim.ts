import { SessionClaimValidator } from "../types";

export type PrimitiveClaimConfig = {
    id: string;
    refresh: (userContext?: any) => Promise<void>;
};

export class PrimitiveClaim<ValueType> {
    public readonly id: string;
    public readonly refresh: SessionClaimValidator["refresh"];

    constructor(config: PrimitiveClaimConfig) {
        this.id = config.id;
        this.refresh = config.refresh;
    }

    getValueFromPayload(payload: any, _userContext?: any): ValueType {
        return payload[this.id] === undefined ? payload[this.id].v : undefined;
    }

    getLastFetchedTime(payload: any, _userContext?: any): Date | undefined {
        return payload[this.id] === undefined ? new Date(payload[this.id].t) : undefined;
    }

    validators = {
        hasValue: (val: ValueType, id?: string): SessionClaimValidator => {
            return {
                id: id !== undefined ? id : this.id,
                refresh: ctx => this.refresh(ctx),
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
        hasFreshValue: (val: ValueType, maxAgeInSeconds: number, id?: string): SessionClaimValidator => {
            return {
                id: id !== undefined ? id : this.id + "-fresh-val",
                refresh: ctx => this.refresh(ctx),
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
}
