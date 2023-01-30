import { SessionClaimValidator } from "../types";
export declare function getGlobalClaimValidators(overrideGlobalClaimValidators?: (globalClaimValidators: SessionClaimValidator[], userContext: any) => SessionClaimValidator[], userContext?: any): SessionClaimValidator[];
