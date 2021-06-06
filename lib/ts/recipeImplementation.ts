import { RecipeInterface, NormalisedInputType } from "./types";
import AuthHttpRequest, { FrontToken, getIdRefreshToken, handleUnauthorised, AntiCsrfToken } from "./fetch";
import { interceptorFunctionRequestFulfilled, responseInterceptor, responseErrorInterceptor } from "./axios";

export class RecipeImplementation implements RecipeInterface {
    addFetchInterceptors = async (env: any, originalFetch: any, _: NormalisedInputType): Promise<void> => {
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

    addAxiosInterceptors = async (axiosInstance: any, _: NormalisedInputType): Promise<void> => {
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

    getUserId = async (_: NormalisedInputType): Promise<string> => {
        let tokenInfo = await FrontToken.getTokenInfo();
        if (tokenInfo === undefined) {
            throw new Error("No session exists");
        }
        return tokenInfo.uid;
    };

    getJWTPayloadSecurely = async (config: NormalisedInputType): Promise<any> => {
        let tokenInfo = await FrontToken.getTokenInfo();
        if (tokenInfo === undefined) {
            throw new Error("No session exists");
        }

        if (tokenInfo.ate < Date.now()) {
            let retry = await this.attemptRefreshingSession(config);
            if (retry) {
                return await this.getJWTPayloadSecurely(config);
            } else {
                throw new Error("Could not refresh session");
            }
        }
        return tokenInfo.up;
    };

    attemptRefreshingSession = async (config: NormalisedInputType): Promise<boolean> => {
        try {
            const preRequestIdToken = await getIdRefreshToken(false);
            return await handleUnauthorised(
                AuthHttpRequest.refreshTokenUrl,
                preRequestIdToken,
                config.refreshAPICustomHeaders,
                config.sessionExpiredStatusCode
            );
        } finally {
            if (!(await this.doesSessionExist(config))) {
                await AntiCsrfToken.removeToken();
                await FrontToken.removeToken();
            }
        }
    };

    doesSessionExist = async (_: NormalisedInputType): Promise<boolean> => {
        return (await getIdRefreshToken(true)).status === "EXISTS";
    };

    signOut = async (config: NormalisedInputType): Promise<void> => {
        if (!(await this.doesSessionExist(config))) {
            return;
        }

        let resp = await fetch(AuthHttpRequest.signOutUrl, {
            method: "post",
            credentials: "include",
            headers:
                config.signoutAPICustomHeaders === undefined
                    ? undefined
                    : {
                          ...config.signoutAPICustomHeaders
                      }
        });

        if (resp.status === config.sessionExpiredStatusCode) {
            return;
        }

        if (resp.status >= 300) {
            throw resp;
        }
    };

    // saveSessionFromResponse = (context: { requestInit: RequestInit; url: string; response: Response }): Promise<void> => {

    // }

    // attachSessionToRequest = (context: {
    //     requestInit: RequestInit;
    //     url: string;
    // }): Promise<{ url: string; requestInit: RequestInit }> => {

    // }
}
