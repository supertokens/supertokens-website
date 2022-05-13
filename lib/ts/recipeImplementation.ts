import { RecipeInterface, NormalisedInputType } from "./types";
import AuthHttpRequest, { FrontToken, getIdRefreshToken } from "./fetch";
import { interceptorFunctionRequestFulfilled, responseInterceptor, responseErrorInterceptor } from "./axios";
import { supported_fdi } from "./version";
import { logDebugMessage } from "./logger";

export default function RecipeImplementation(): RecipeInterface {
    return {
        addFetchInterceptorsAndReturnModifiedFetch: function(originalFetch: any, _: NormalisedInputType): typeof fetch {
            logDebugMessage("addFetchInterceptorsAndReturnModifiedFetch: called");
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
            logDebugMessage("addAxiosInterceptors: called");
            // we first check if this axiosInstance already has our interceptors.
            let requestInterceptors = axiosInstance.interceptors.request;
            for (let i = 0; i < requestInterceptors.handlers.length; i++) {
                if (requestInterceptors.handlers[i].fulfilled === interceptorFunctionRequestFulfilled) {
                    logDebugMessage("addAxiosInterceptors: not adding because already added on this instance");
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
            logDebugMessage("getUserId: called");
            let tokenInfo = await FrontToken.getTokenInfo();
            if (tokenInfo === undefined) {
                throw new Error("No session exists");
            }
            logDebugMessage("getUserId: returning: " + tokenInfo.uid);
            return tokenInfo.uid;
        },
        getAccessTokenPayloadSecurely: async function(config: NormalisedInputType): Promise<any> {
            logDebugMessage("getAccessTokenPayloadSecurely: called");
            let tokenInfo = await FrontToken.getTokenInfo();
            if (tokenInfo === undefined) {
                throw new Error("No session exists");
            }

            if (tokenInfo.ate < Date.now()) {
                logDebugMessage("getAccessTokenPayloadSecurely: access token expired. Refreshing session");
                let retry = await AuthHttpRequest.attemptRefreshingSession();
                if (retry) {
                    return await this.getAccessTokenPayloadSecurely(config);
                } else {
                    throw new Error("Could not refresh session");
                }
            }
            logDebugMessage("getAccessTokenPayloadSecurely: returning: " + JSON.stringify(tokenInfo.up));
            return tokenInfo.up;
        },
        doesSessionExist: async function(_: NormalisedInputType): Promise<boolean> {
            logDebugMessage("doesSessionExist: called");
            return (await getIdRefreshToken(true)).status === "EXISTS";
        },
        signOut: async function(config: NormalisedInputType): Promise<void> {
            logDebugMessage("signOut: called");
            if (!(await this.doesSessionExist(config))) {
                logDebugMessage("signOut: existing early because session does not exist");
                logDebugMessage("signOut: firing SIGN_OUT event");
                config.onHandleEvent({
                    action: "SIGN_OUT"
                });
                return;
            }

            logDebugMessage("signOut: Calling refresh pre API hook");
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

            logDebugMessage("signOut: Calling API");
            let resp = await fetch(preAPIResult.url, preAPIResult.requestInit);
            logDebugMessage("signOut: API ended");

            logDebugMessage("signOut: API responded with status code: " + resp.status);
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
