import { RecipeInterface } from "./types";
import AuthHttpRequest from "./fetch";
import { interceptorFunctionRequestFulfilled, responseInterceptor, responseErrorInterceptor } from "./axios";

export class RecipeImplementation implements RecipeInterface {
    addFetchInterceptors = async (env: any, originalFetch: any): Promise<void> => {
        let fetchInterceptor = async (url: RequestInfo, config?: RequestInit) => {
            return await AuthHttpRequest.doRequest(
                (config?: RequestInit) => {
                    return originalFetch(url, {
                        ...config
                    });
                },
                config,
                url
            );
        };

        env.fetch = (url: RequestInfo, config?: RequestInit): Promise<Response> => {
            return fetchInterceptor(url, config);
        };
    };

    addAxiosInterceptors = async (axiosInstance: any): Promise<void> => {
        // we first check if this axiosInstance already has our interceptors.
        let requestInterceptors = axiosInstance.interceptors.request;
        for (let i = 0; i < requestInterceptors.handlers.length; i++) {
            if (requestInterceptors.handlers[i].fulfilled === interceptorFunctionRequestFulfilled) {
                return;
            }
        }
        // Add a request interceptor
        axiosInstance.interceptors.request.use(interceptorFunctionRequestFulfilled, async function(error: any) {
            throw error;
        });

        // Add a response interceptor
        axiosInstance.interceptors.response.use(
            responseInterceptor(axiosInstance),
            responseErrorInterceptor(axiosInstance)
        );
    };

    // getJWTPayloadSecurely = (): Promise<any> => {

    // }

    // doesSessionExist = (): Promise<boolean> => {

    // }

    // signOut = (): Promise<void> => {

    // }

    // saveSessionFromResponse = (context: { requestInit: RequestInit; url: string; response: Response }): Promise<void> => {

    // }

    // attachSessionToRequest = (context: {
    //     requestInit: RequestInit;
    //     url: string;
    // }): Promise<{ url: string; requestInit: RequestInit }> => {

    // }
}
