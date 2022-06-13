import { InputType, RecipeInterface } from "./types";
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
export { RecipeInterface, InputType };
