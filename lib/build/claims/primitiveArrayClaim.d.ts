import { SessionClaimValidator } from "../types";
export declare type PrimitiveArrayClaimConfig = {
    id: string;
    refresh: (userContext?: any) => Promise<void>;
};
export declare class PrimitiveArrayClaim<ValueType> {
    readonly id: string;
    readonly refresh: SessionClaimValidator["refresh"];
    constructor(config: PrimitiveArrayClaimConfig);
    getValueFromPayload(payload: any, _userContext?: any): ValueType[];
    getLastFetchedTime(payload: any, _userContext?: any): number | undefined;
    validators: {
        includes: (val: ValueType, maxAgeInSeconds?: number | undefined, id?: string | undefined) => SessionClaimValidator;
        excludes: (val: ValueType, maxAgeInSeconds?: number | undefined, id?: string | undefined) => SessionClaimValidator;
        includesAll: (val: ValueType[], maxAgeInSeconds: number, id?: string | undefined) => SessionClaimValidator;
        excludesAll: (val: ValueType[], maxAgeInSeconds: number, id?: string | undefined) => SessionClaimValidator;
    };
}
