import OverrideableBuilder from "supertokens-js-override";
import { CookieHandlerInput } from "./utils/cookieHandler/types";
import { WindowHandlerInput } from "./utils/windowHandler/types";
export declare type Event = {
    action: "SIGN_OUT" | "REFRESH_SESSION" | "SESSION_CREATED" | "ACCESS_TOKEN_PAYLOAD_UPDATED";
    userContext: any;
} | {
    action: "API_INVALID_CLAIM";
    claimValidationErrors: ClaimValidationError[];
    userContext: any;
} | {
    action: "UNAUTHORISED";
    sessionExpiredOrRevoked: boolean;
    userContext: any;
};
export declare type EventHandler = (event: Event) => void;
export declare type InputType = {
    enableDebugLogs?: boolean;
    apiDomain: string;
    apiBasePath?: string;
    sessionScope?: string;
    sessionExpiredStatusCode?: number;
    invalidClaimStatusCode?: number;
    autoAddCredentials?: boolean;
    isInIframe?: boolean;
    cookieDomain?: string;
    cookieHandler?: CookieHandlerInput;
    windowHandler?: WindowHandlerInput;
    preAPIHook?: RecipePreAPIHookFunction;
    postAPIHook?: RecipePostAPIHookFunction;
    onHandleEvent?: EventHandler;
    override?: {
        functions?: (originalImplementation: RecipeInterface, builder?: OverrideableBuilder<RecipeInterface>) => RecipeInterface;
    };
};
export declare type NormalisedInputType = {
    apiDomain: string;
    apiBasePath: string;
    sessionScope: string;
    sessionExpiredStatusCode: number;
    invalidClaimStatusCode: number;
    autoAddCredentials: boolean;
    isInIframe: boolean;
    cookieDomain: string | undefined;
    preAPIHook: RecipePreAPIHookFunction;
    postAPIHook: RecipePostAPIHookFunction;
    onHandleEvent: EventHandler;
    override: {
        functions: (originalImplementation: RecipeInterface, builder?: OverrideableBuilder<RecipeInterface>) => RecipeInterface;
    };
};
export declare type PreAPIHookContext = {
    action: "SIGN_OUT" | "REFRESH_SESSION";
    requestInit: RequestInit;
    url: string;
    userContext: any;
};
export declare type RecipePreAPIHookFunction = (context: PreAPIHookContext) => Promise<{
    url: string;
    requestInit: RequestInit;
}>;
export declare type RecipePostAPIHookContext = {
    action: "SIGN_OUT" | "REFRESH_SESSION";
    requestInit: RequestInit;
    url: string;
    fetchResponse: Response;
    userContext: any;
};
export declare type RecipePostAPIHookFunction = (context: RecipePostAPIHookContext) => Promise<void>;
export declare type PreAPIHookFunction = (context: {
    requestInit: RequestInit;
    url: string;
}) => Promise<{
    url: string;
    requestInit: RequestInit;
}>;
export declare type RecipeInterface = {
    addFetchInterceptorsAndReturnModifiedFetch: (input: {
        originalFetch: any;
        userContext: any;
    }) => typeof fetch;
    addXMLHttpRequestInterceptor: (input: {
        userContext: any;
    }) => void;
    addAxiosInterceptors: (input: {
        axiosInstance: any;
        userContext: any;
    }) => void;
    getUserId: (input: {
        userContext: any;
    }) => Promise<string>;
    getAccessTokenPayloadSecurely: (input: {
        userContext: any;
    }) => Promise<any>;
    doesSessionExist: (input: {
        userContext: any;
    }) => Promise<boolean>;
    signOut: (input: {
        userContext: any;
    }) => Promise<void>;
    getInvalidClaimsFromResponse(input: {
        response: {
            data: any;
        } | Response;
        userContext: any;
    }): Promise<ClaimValidationError[]>;
    validateClaims: (input: {
        claimValidators: SessionClaimValidator[];
        userContext: any;
    }) => Promise<ClaimValidationError[]>;
    getGlobalClaimValidators(input: {
        claimValidatorsAddedByOtherRecipes: SessionClaimValidator[];
        userContext: any;
    }): SessionClaimValidator[];
};
export declare type ClaimValidationResult = {
    isValid: true;
} | {
    isValid: false;
    reason?: any;
};
export declare type ClaimValidationError = {
    validatorId: string;
    reason?: any;
};
export declare abstract class SessionClaimValidator {
    readonly id: string;
    constructor(id: string);
    /**
     * Makes an API call that will refresh the claim in the token.
     */
    abstract refresh(userContext: any): Promise<void>;
    /**
     * Decides if we need to refresh the claim value before checking the payload with `validate`.
     * E.g.: if the information in the payload is expired, or is not sufficient for this validator.
     */
    abstract shouldRefresh(accessTokenPayload: any, userContext: any): Promise<boolean> | boolean;
    /**
     * Decides if the claim is valid based on the accessTokenPayload object (and not checking DB or anything else)
     */
    abstract validate(accessTokenPayload: any, userContext: any): Promise<ClaimValidationResult> | ClaimValidationResult;
}
export declare type SessionClaim<ValueType> = {
    refresh(userContext: any): Promise<void>;
    getValueFromPayload(payload: any, _userContext?: any): ValueType | undefined;
    getLastFetchedTime(payload: any, _userContext?: any): number | undefined;
};
export declare type ResponseWithBody = {
    data: any;
} | Response;
