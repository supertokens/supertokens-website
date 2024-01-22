import { SessionClaimValidator } from "../types";
import DateProviderReference from "../utils/dateProvider";

export type PrimitiveClaimConfig = {
    id: string;
    refresh: (userContext?: any) => Promise<void>;
    defaultMaxAgeInSeconds?: number;
};

export class PrimitiveClaim<ValueType> {
    public readonly id: string;
    public readonly refresh: SessionClaimValidator["refresh"];
    public readonly defaultMaxAgeInSeconds: number | undefined;

    constructor(config: PrimitiveClaimConfig) {
        this.id = config.id;
        this.refresh = config.refresh;
        this.defaultMaxAgeInSeconds = config.defaultMaxAgeInSeconds;
    }

    getValueFromPayload(payload: any, _userContext?: any): ValueType {
        return payload[this.id] !== undefined ? payload[this.id].v : undefined;
    }

    getLastFetchedTime(payload: any, _userContext?: any): number | undefined {
        return payload[this.id] !== undefined ? payload[this.id].t : undefined;
    }

    validators = {
        hasValue: (
            val: ValueType,
            maxAgeInSeconds: number | undefined = this.defaultMaxAgeInSeconds,
            id?: string
        ): SessionClaimValidator => {
            const DateProvider = DateProviderReference.getReferenceOrThrow().dateProvider;
            if (maxAgeInSeconds !== undefined && maxAgeInSeconds < DateProvider.getThresholdInSeconds()) {
                throw new Error(
                    `maxAgeInSeconds must be greater than the DateProvider threshold value -> ${DateProvider.getThresholdInSeconds()}`
                );
            }
            return {
                id: id !== undefined ? id : this.id,
                refresh: ctx => this.refresh(ctx),
                shouldRefresh: (payload, ctx) =>
                    this.getValueFromPayload(payload, ctx) === undefined ||
                    // We know payload[this.id] is defined since the value is not undefined in this branch
                    (maxAgeInSeconds !== undefined && payload[this.id].t < DateProvider.now() - maxAgeInSeconds * 1000),
                validate: (payload, ctx) => {
                    const claimVal = this.getValueFromPayload(payload, ctx);
                    if (claimVal === undefined) {
                        return {
                            isValid: false,
                            reason: { message: "value does not exist", expectedValue: val, actualValue: claimVal }
                        };
                    }

                    const ageInSeconds = (DateProvider.now() - this.getLastFetchedTime(payload, ctx)!) / 1000;
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

                    if (claimVal !== val) {
                        return {
                            isValid: false,
                            reason: { message: "wrong value", expectedValue: val, actualValue: claimVal }
                        };
                    }
                    return { isValid: true };
                }
            };
        }
    };
}
