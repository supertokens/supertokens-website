import { ClaimValidationError, InputType, RecipeInterface, SessionClaim, SessionClaimValidator } from "./types";
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
    }) => Promise<boolean>;
    /**
     * @deprecated
     */
    static addAxiosInterceptors: (axiosInstance: any, userContext?: any) => void;
    static signOut: (input?: {
        userContext?: any;
    }) => Promise<void>;
    static getInvalidClaimsFromResponse: (input: {
        response: {
            data: any;
        } | Response;
        userContext?: any;
    }) => Promise<ClaimValidationError[]>;
    static getClaimValue: <T>(input: {
        claim: SessionClaim<T>;
        userContext?: any;
    }) => Promise<T | undefined>;
    static validateClaims: (overrideGlobalClaimValidators?: ((globalClaimValidators: SessionClaimValidator[], userContext: any) => SessionClaimValidator[]) | undefined, userContext?: any) => Promise<ClaimValidationError[]> | ClaimValidationError[];
    static getAccessToken: (input?: {
        userContext?: any;
    }) => Promise<string | undefined>;
}
export declare let init: typeof AuthHttpRequest.init;
export declare let getUserId: typeof AuthHttpRequest.getUserId;
export declare let getAccessTokenPayloadSecurely: typeof AuthHttpRequest.getAccessTokenPayloadSecurely;
export declare let getAccessToken: (input?: {
    userContext?: any;
}) => Promise<string | undefined>;
export declare let attemptRefreshingSession: () => Promise<boolean>;
export declare let doesSessionExist: (input?: {
    userContext?: any;
}) => Promise<boolean>;
/**
 * @deprecated
 */
export declare let addAxiosInterceptors: (axiosInstance: any, userContext?: any) => void;
export declare let signOut: (input?: {
    userContext?: any;
}) => Promise<void>;
export declare const validateClaims: (overrideGlobalClaimValidators?: ((globalClaimValidators: SessionClaimValidator[], userContext: any) => SessionClaimValidator[]) | undefined, userContext?: any) => Promise<ClaimValidationError[]> | ClaimValidationError[];
export declare const getClaimValue: <T>(input: {
    claim: SessionClaim<T>;
    userContext?: any;
}) => Promise<T | undefined>;
export declare const getInvalidClaimsFromResponse: (input: {
    response: {
        data: any;
    } | Response;
    userContext?: any;
}) => Promise<ClaimValidationError[]>;
export { RecipeInterface, InputType };
export { ClaimValidationError, ClaimValidationResult, SessionClaimValidator, SessionClaim } from "./types";
export { PrimitiveClaim } from "./claims/primitiveClaim";
export { PrimitiveArrayClaim } from "./claims/primitiveArrayClaim";
export { BooleanClaim } from "./claims/booleanClaim";
