import { AxiosPromise, AxiosRequestConfig, AxiosResponse } from "axios";
export declare function interceptorFunctionRequestFulfilled(config: AxiosRequestConfig): Promise<AxiosRequestConfig>;
export declare function responseInterceptor(axiosInstance: any): (response: AxiosResponse<any>) => Promise<AxiosResponse<any>>;
/**
 * @class AuthHttpRequest
 * @description wrapper for common http methods.
 */
export default class AuthHttpRequest {
    private static refreshTokenUrl;
    static websiteRootDomain: string;
    static sessionExpiredStatusCode: number;
    static initCalled: boolean;
    static apiDomain: string;
    private static refreshAPICustomHeaders;
    static setAuth0API(apiPath: string): void;
    static init(refreshTokenUrl: string, websiteRootDomain?: string, refreshAPICustomHeaders?: any, sessionExpiredStatusCode?: number): void;
    /**
     * @description sends the actual http request and returns a response if successful/
     * If not successful due to session expiry reasons, it
     * attempts to call the refresh token API and if that is successful, calls this API again.
     * @throws Error
     */
    static doRequest: (httpCall: (config: AxiosRequestConfig) => AxiosPromise<any>, config: AxiosRequestConfig, url?: string | undefined, prevResponse?: AxiosResponse<any> | undefined, prevError?: any, viaInterceptor?: boolean) => Promise<AxiosResponse<any>>;
    /**
     * @description attempts to refresh session regardless of expiry
     * @returns true if successful, else false if session has expired. Wrapped in a Promise
     * @throws error if anything goes wrong
     */
    static attemptRefreshingSession: () => Promise<boolean>;
    static get: <T = any, R = AxiosResponse<T>>(url: string, config?: AxiosRequestConfig | undefined) => Promise<AxiosResponse<any>>;
    static post: <T = any, R = AxiosResponse<T>>(url: string, data?: any, config?: AxiosRequestConfig | undefined) => Promise<AxiosResponse<any>>;
    static delete: <T = any, R = AxiosResponse<T>>(url: string, config?: AxiosRequestConfig | undefined) => Promise<AxiosResponse<any>>;
    static put: <T = any, R = AxiosResponse<T>>(url: string, data?: any, config?: AxiosRequestConfig | undefined) => Promise<AxiosResponse<any>>;
    static axios: (anything: string | AxiosRequestConfig, maybeConfig?: AxiosRequestConfig | undefined) => Promise<AxiosResponse<any>>;
    static makeSuper: (axiosInstance: any) => void;
    static doesSessionExist: () => boolean;
}
