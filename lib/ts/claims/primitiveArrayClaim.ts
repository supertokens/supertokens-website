import { SessionClaimValidator } from "../types";

export type PrimitiveArrayClaimConfig = {
    id: string;
    refresh: (userContext?: any) => Promise<void>;
    defaultMaxAgeInSeconds?: number;
};

export class PrimitiveArrayClaim<ValueType> {
    public readonly id: string;
    public readonly refresh: SessionClaimValidator["refresh"];
    public readonly defaultMaxAgeInSeconds: number | undefined;

    constructor(config: PrimitiveArrayClaimConfig) {
        this.id = config.id;
        this.refresh = config.refresh;
        this.defaultMaxAgeInSeconds = config.defaultMaxAgeInSeconds;
    }

    getValueFromPayload(payload: any, _userContext?: any): ValueType[] {
        return payload[this.id] !== undefined ? payload[this.id].v : undefined;
    }

    getLastFetchedTime(payload: any, _userContext?: any): number | undefined {
        return payload[this.id] !== undefined ? payload[this.id].t : undefined;
    }

    validators = {
        includes: (
            val: ValueType,
            maxAgeInSeconds: number | undefined = this.defaultMaxAgeInSeconds,
            id?: string
        ): SessionClaimValidator => {
            return {
                id: id !== undefined ? id : this.id,
                refresh: ctx => this.refresh(ctx),
                shouldRefresh: (payload, ctx) =>
                    this.getValueFromPayload(payload, ctx) === undefined ||
                    // We know payload[this.id] is defined since the value is not undefined in this branch
                    (maxAgeInSeconds !== undefined && payload[this.id].t < Date.now() - maxAgeInSeconds * 1000),
                validate: async (payload, ctx) => {
                    const claimVal = this.getValueFromPayload(payload, ctx);
                    if (claimVal === undefined) {
                        return {
                            isValid: false,
                            reason: { message: "value does not exist", expectedToInclude: val, actualValue: claimVal }
                        };
                    }
                    const ageInSeconds = (Date.now() - this.getLastFetchedTime(payload, ctx)!) / 1000;
                    if (maxAgeInSeconds !== undefined && ageInSeconds > maxAgeInSeconds) {
                        return {
                            isValid: false,
                            reason: {
                                message: "expired",
                                ageInSeconds,
                                maxAgeInSeconds
                            }
                        };
                    }
                    if (!claimVal.includes(val)) {
                        return {
                            isValid: false,
                            reason: { message: "wrong value", expectedToInclude: val, actualValue: claimVal }
                        };
                    }
                    return { isValid: true };
                }
            };
        },
        excludes: (
            val: ValueType,
            maxAgeInSeconds: number | undefined = this.defaultMaxAgeInSeconds,
            id?: string
        ): SessionClaimValidator => {
            return {
                id: id !== undefined ? id : this.id,
                refresh: ctx => this.refresh(ctx),
                shouldRefresh: (payload, ctx) =>
                    this.getValueFromPayload(payload, ctx) === undefined ||
                    // We know payload[this.id] is defined since the value is not undefined in this branch
                    (maxAgeInSeconds !== undefined && payload[this.id].t < Date.now() - maxAgeInSeconds * 1000),
                validate: async (payload, ctx) => {
                    const claimVal = this.getValueFromPayload(payload, ctx);
                    if (claimVal === undefined) {
                        return {
                            isValid: false,
                            reason: {
                                message: "value does not exist",
                                expectedToNotInclude: val,
                                actualValue: claimVal
                            }
                        };
                    }
                    const ageInSeconds = (Date.now() - this.getLastFetchedTime(payload, ctx)!) / 1000;
                    if (maxAgeInSeconds !== undefined && ageInSeconds > maxAgeInSeconds) {
                        return {
                            isValid: false,
                            reason: {
                                message: "expired",
                                ageInSeconds,
                                maxAgeInSeconds
                            }
                        };
                    }
                    if (claimVal.includes(val)) {
                        return {
                            isValid: false,
                            reason: { message: "wrong value", expectedToNotInclude: val, actualValue: claimVal }
                        };
                    }
                    return { isValid: true };
                }
            };
        },
        includesAll: (
            val: ValueType[],
            maxAgeInSeconds: number | undefined = this.defaultMaxAgeInSeconds,
            id?: string
        ): SessionClaimValidator => {
            return {
                id: id !== undefined ? id : this.id,
                refresh: ctx => this.refresh(ctx),
                shouldRefresh: (payload, ctx) =>
                    this.getValueFromPayload(payload, ctx) === undefined ||
                    // We know payload[this.id] is defined since the value is not undefined in this branch
                    (maxAgeInSeconds !== undefined && payload[this.id].t < Date.now() - maxAgeInSeconds * 1000),
                validate: async (payload, ctx) => {
                    const claimVal = this.getValueFromPayload(payload, ctx);
                    if (claimVal === undefined) {
                        return {
                            isValid: false,
                            reason: { message: "value does not exist", expectedToInclude: val, actualValue: claimVal }
                        };
                    }
                    const ageInSeconds = (Date.now() - this.getLastFetchedTime(payload, ctx)!) / 1000;
                    if (maxAgeInSeconds !== undefined && ageInSeconds > maxAgeInSeconds) {
                        return {
                            isValid: false,
                            reason: {
                                message: "expired",
                                ageInSeconds,
                                maxAgeInSeconds
                            }
                        };
                    }
                    const claimSet = new Set(claimVal);
                    const isValid = val.every(v => claimSet.has(v));
                    return isValid
                        ? { isValid }
                        : {
                              isValid,
                              reason: { message: "wrong value", expectedToInclude: val, actualValue: claimVal }
                          };
                }
            };
        },
        excludesAll: (
            val: ValueType[],
            maxAgeInSeconds: number | undefined = this.defaultMaxAgeInSeconds,
            id?: string
        ): SessionClaimValidator => {
            return {
                id: id !== undefined ? id : this.id,
                refresh: ctx => this.refresh(ctx),
                shouldRefresh: (payload, ctx) =>
                    this.getValueFromPayload(payload, ctx) === undefined ||
                    // We know payload[this.id] is defined since the value is not undefined in this branch
                    (maxAgeInSeconds !== undefined && payload[this.id].t < Date.now() - maxAgeInSeconds * 1000),
                validate: async (payload, ctx) => {
                    const claimVal = this.getValueFromPayload(payload, ctx);
                    if (claimVal === undefined) {
                        return {
                            isValid: false,
                            reason: {
                                message: "value does not exist",
                                expectedToNotInclude: val,
                                actualValue: claimVal
                            }
                        };
                    }

                    const ageInSeconds = (Date.now() - this.getLastFetchedTime(payload, ctx)!) / 1000;
                    if (maxAgeInSeconds !== undefined && ageInSeconds > maxAgeInSeconds) {
                        return {
                            isValid: false,
                            reason: {
                                message: "expired",
                                ageInSeconds,
                                maxAgeInSeconds
                            }
                        };
                    }
                    const claimSet = new Set(claimVal);
                    const isValid = val.every(v => !claimSet.has(v));
                    return isValid
                        ? { isValid: isValid }
                        : {
                              isValid,
                              reason: { message: "wrong value", expectedToNotInclude: val, actualValue: claimVal }
                          };
                }
            };
        }
    };
}
