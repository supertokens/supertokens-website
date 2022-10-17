import { SessionClaimValidator } from "../types";
export declare type PrimitiveClaimConfig = {
    id: string;
    refresh: (userContext?: any) => Promise<void>;
    defaultMaxAgeInSeconds?: number;
};
export declare class PrimitiveClaim<ValueType> {
    readonly id: string;
    readonly refresh: SessionClaimValidator["refresh"];
    readonly defaultMaxAgeInSeconds: number | undefined;
    constructor(config: PrimitiveClaimConfig);
    getValueFromPayload(payload: any, _userContext?: any): ValueType;
    getLastFetchedTime(payload: any, _userContext?: any): number | undefined;
    validators: {
        hasValue: (val: ValueType, maxAgeInSeconds?: number | undefined, id?: string) => SessionClaimValidator;
    };
}
