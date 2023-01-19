import { SessionClaimValidator } from "../types";
export declare type PrimitiveArrayClaimConfig = {
    id: string;
    refresh: (userContext?: any) => Promise<void>;
    defaultMaxAgeInSeconds?: number;
};
export declare class PrimitiveArrayClaim<ValueType> {
    readonly id: string;
    readonly refresh: SessionClaimValidator["refresh"];
    readonly defaultMaxAgeInSeconds: number | undefined;
    constructor(config: PrimitiveArrayClaimConfig);
    getValueFromPayload(payload: any, _userContext?: any): ValueType[];
    getLastFetchedTime(payload: any, _userContext?: any): number | undefined;
    validators: {
        includes: (val: ValueType, maxAgeInSeconds?: number | undefined, id?: string) => SessionClaimValidator;
        excludes: (val: ValueType, maxAgeInSeconds?: number | undefined, id?: string) => SessionClaimValidator;
        includesAll: (val: ValueType[], maxAgeInSeconds?: number | undefined, id?: string) => SessionClaimValidator;
        includesAny: (val: ValueType[], maxAgeInSeconds?: number | undefined, id?: string) => SessionClaimValidator;
        excludesAll: (val: ValueType[], maxAgeInSeconds?: number | undefined, id?: string) => SessionClaimValidator;
    };
}
