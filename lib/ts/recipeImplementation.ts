import { RecipeInterface, EventHandler, RecipePreAPIHookFunction, RecipePostAPIHookFunction } from "./types";
import AuthHttpRequest, { FrontToken, getIdRefreshToken } from "./fetch";
import { interceptorFunctionRequestFulfilled, responseInterceptor, responseErrorInterceptor } from "./axios";
import { supported_fdi } from "./version";

export default function RecipeImplementation(recipeImplInput: {
    preAPIHook: RecipePreAPIHookFunction;
    postAPIHook: RecipePostAPIHookFunction;
    onHandleEvent: EventHandler;
    sessionExpiredStatusCode: number;
}): RecipeInterface {
    return {
        addFetchInterceptorsAndReturnModifiedFetch: function(input: {
            originalFetch: any;
            userContext: any;
        }): typeof fetch {
            return async function(url: RequestInfo, config?: RequestInit): Promise<Response> {
                return await AuthHttpRequest.doRequest(
                    (config?: RequestInit) => {
                        return input.originalFetch(url, {
                            ...config
                        });
                    },
                    config,
                    url
                );
            };
        },
        addAxiosInterceptors: function(input: { axiosInstance: any; userContext: any }): void {
            // we first check if this axiosInstance already has our interceptors.
            let requestInterceptors = input.axiosInstance.interceptors.request;
            for (let i = 0; i < requestInterceptors.handlers.length; i++) {
                if (requestInterceptors.handlers[i].fulfilled === interceptorFunctionRequestFulfilled) {
                    return;
                }
            }
            // Add a request interceptor
            input.axiosInstance.interceptors.request.use(interceptorFunctionRequestFulfilled, async function(
                error: any
            ) {
                throw error;
            });

            // Add a response interceptor
            input.axiosInstance.interceptors.response.use(
                responseInterceptor(input.axiosInstance),
                responseErrorInterceptor(input.axiosInstance)
            );
        },
        getUserId: async function(_: { userContext: any }): Promise<string> {
            let tokenInfo = await FrontToken.getTokenInfo();
            if (tokenInfo === undefined) {
                throw new Error("No session exists");
            }
            return tokenInfo.uid;
        },
        getAccessTokenPayloadSecurely: async function(input: { userContext: any }): Promise<any> {
            let tokenInfo = await FrontToken.getTokenInfo();
            if (tokenInfo === undefined) {
                throw new Error("No session exists");
            }

            if (tokenInfo.ate < Date.now()) {
                let retry = await AuthHttpRequest.attemptRefreshingSession();
                if (retry) {
                    return await this.getAccessTokenPayloadSecurely({
                        userContext: input.userContext
                    });
                } else {
                    throw new Error("Could not refresh session");
                }
            }
            return tokenInfo.up;
        },
        doesSessionExist: async function(_: { userContext: any }): Promise<boolean> {
            return (await getIdRefreshToken(true)).status === "EXISTS";
        },
        signOut: async function(input: { userContext: any }): Promise<void> {
            if (
                !(await this.doesSessionExist({
                    userContext: input.userContext
                }))
            ) {
                recipeImplInput.onHandleEvent({
                    action: "SIGN_OUT"
                });
                return;
            }

            let preAPIResult = await recipeImplInput.preAPIHook({
                action: "SIGN_OUT",
                requestInit: {
                    method: "post",
                    headers: {
                        "fdi-version": supported_fdi.join(","),
                        rid: AuthHttpRequest.rid
                    }
                },
                url: AuthHttpRequest.signOutUrl,
                userContext: input.userContext
            });

            let resp = await fetch(preAPIResult.url, preAPIResult.requestInit);

            await recipeImplInput.postAPIHook({
                action: "SIGN_OUT",
                requestInit: preAPIResult.requestInit,
                url: preAPIResult.url,
                fetchResponse: resp.clone(),
                userContext: input.userContext
            });

            if (resp.status === recipeImplInput.sessionExpiredStatusCode) {
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
