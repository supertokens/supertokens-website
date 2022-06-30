import { ClaimValidationError, InputType, RecipeInterface, SessionClaimValidator } from "./types";
export default class AuthHttpRequest {
    private static axiosInterceptorQueue;
    static init(options: InputType): void;
    static getUserId(input?: {
        userContext?: any;
    }): Promise<string>;
    static getAccessTokenPayloadSecurely(input?: {
        userContext?: any;
    }): Promise<any>;
    static attemptRefreshingSession: () => Promise<boolean>;
    static doesSessionExist: (input?: {
        userContext?: any;
    } | undefined) => Promise<boolean>;
    static addAxiosInterceptors: (axiosInstance: any, userContext?: any) => void;
    static signOut: (input?: {
        userContext?: any;
    } | undefined) => Promise<void>;
    static validateClaims: (claimValidators: SessionClaimValidator[], userContext?: any) => Promise<ClaimValidationError[] | undefined>;
}
export declare let init: typeof AuthHttpRequest.init;
export declare let getUserId: typeof AuthHttpRequest.getUserId;
export declare let getAccessTokenPayloadSecurely: typeof AuthHttpRequest.getAccessTokenPayloadSecurely;
export declare let attemptRefreshingSession: () => Promise<boolean>;
export declare let doesSessionExist: (input?: {
    userContext?: any;
} | undefined) => Promise<boolean>;
export declare let addAxiosInterceptors: (axiosInstance: any, userContext?: any) => void;
export declare let signOut: (input?: {
    userContext?: any;
} | undefined) => Promise<void>;
export declare const validateClaims: (claimValidators: SessionClaimValidator[], userContext?: any) => Promise<ClaimValidationError[] | undefined>;
export { RecipeInterface, InputType };
export { ClaimValidationError, ClaimValidationResult, SessionClaimValidator } from "./types";
export { PrimitiveClaim } from "./claims/primitiveClaim";
export { BooleanClaim } from "./claims/booleanClaim";
