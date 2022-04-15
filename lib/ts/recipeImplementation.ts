import { RecipeInterface, NormalisedInputType } from "./types";
import AuthHttpRequest, { FrontToken, getIdRefreshToken } from "./fetch";
import { interceptorFunctionRequestFulfilled, responseInterceptor, responseErrorInterceptor } from "./axios";
import { supported_fdi } from "./version";

export default function RecipeImplementation(): RecipeInterface {
    return {
        addFetchInterceptorsAndReturnModifiedFetch: function(originalFetch: any, _: NormalisedInputType): typeof fetch {
            return async function(url: RequestInfo, config?: RequestInit): Promise<Response> {
                return await AuthHttpRequest.doRequest(
                    (config?: RequestInit) => {
                        return originalFetch(typeof url === "string" ? url : url.clone(), {
                            ...config
                        });
                    },
                    config,
                    url
                );
            };
        },
        addAxiosInterceptors: function(axiosInstance: any, _: NormalisedInputType): void {
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
        },
        getUserId: async function(_: NormalisedInputType): Promise<string> {
            let tokenInfo = await FrontToken.getTokenInfo();
            if (tokenInfo === undefined) {
                throw new Error("No session exists");
            }
            return tokenInfo.uid;
        },
        getAccessTokenPayloadSecurely: async function(config: NormalisedInputType): Promise<any> {
            let tokenInfo = await FrontToken.getTokenInfo();
            if (tokenInfo === undefined) {
                throw new Error("No session exists");
            }

            if (tokenInfo.ate < Date.now()) {
                let retry = await AuthHttpRequest.attemptRefreshingSession();
                if (retry) {
                    return await this.getAccessTokenPayloadSecurely(config);
                } else {
                    throw new Error("Could not refresh session");
                }
            }
            return tokenInfo.up;
        },
        doesSessionExist: async function(_: NormalisedInputType): Promise<boolean> {
            return (await getIdRefreshToken(true)).status === "EXISTS";
        },
        signOut: async function(config: NormalisedInputType): Promise<void> {
            if (!(await this.doesSessionExist(config))) {
                config.onHandleEvent({
                    action: "SIGN_OUT"
                });
                return;
            }

            let preAPIResult = await config.preAPIHook({
                action: "SIGN_OUT",
                requestInit: {
                    method: "post",
                    headers: {
                        "fdi-version": supported_fdi.join(","),
                        rid: AuthHttpRequest.rid
                    }
                },
                url: AuthHttpRequest.signOutUrl
            });

            let resp = await fetch(preAPIResult.url, preAPIResult.requestInit);

            if (resp.status === config.sessionExpiredStatusCode) {
                // refresh must have already sent session expiry event
                return;
            }

            if (resp.status >= 300) {
                throw resp;
            }

            // we do not send an event here since it's triggered in setIdRefreshToken area.
        }
    };
}
