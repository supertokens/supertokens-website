import { InputType, RecipeInterface } from "./types";
export default class AuthHttpRequest {
    private static axiosInterceptorQueue;
    static init(options: InputType): void;
    static getUserId(): Promise<string>;
    static getJWTPayloadSecurely(): Promise<any>;
    static attemptRefreshingSession: () => Promise<boolean>;
    static doesSessionExist: () => Promise<boolean>;
    static addAxiosInterceptors: (axiosInstance: any) => void;
    static signOut: () => Promise<void>;
}
export declare let init: typeof AuthHttpRequest.init;
export declare let getUserId: typeof AuthHttpRequest.getUserId;
export declare let getJWTPayloadSecurely: typeof AuthHttpRequest.getJWTPayloadSecurely;
export declare let attemptRefreshingSession: () => Promise<boolean>;
export declare let doesSessionExist: () => Promise<boolean>;
export declare let addAxiosInterceptors: (axiosInstance: any) => void;
export declare let signOut: () => Promise<void>;
export { RecipeInterface, InputType };
