import { SessionClaimValidator } from "../types";
export declare type PrimitiveClaimConfig = {
    id: string;
    refresh: (userContext?: any) => Promise<void>;
};
export declare class PrimitiveClaim<ValueType> {
    readonly id: string;
    readonly refresh: SessionClaimValidator["refresh"];
    constructor(config: PrimitiveClaimConfig);
    getValueFromPayload(payload: any, _userContext?: any): ValueType;
    getLastFetchedTime(payload: any, _userContext?: any): number | undefined;
    validators: {
        hasValue: (val: ValueType, id?: string | undefined) => SessionClaimValidator;
        hasFreshValue: (val: ValueType, maxAgeInSeconds: number, id?: string | undefined) => SessionClaimValidator;
    };
}
