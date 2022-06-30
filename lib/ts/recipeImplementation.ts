import {
    RecipeInterface,
    EventHandler,
    RecipePreAPIHookFunction,
    RecipePostAPIHookFunction,
    SessionClaimValidator,
    ClaimValidationError
} from "./types";
import AuthHttpRequest, { FrontToken, getIdRefreshToken } from "./fetch";
import { interceptorFunctionRequestFulfilled, responseInterceptor, responseErrorInterceptor } from "./axios";
import { supported_fdi } from "./version";
import { logDebugMessage } from "./logger";

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
            logDebugMessage("addFetchInterceptorsAndReturnModifiedFetch: called");
            return async function(url: RequestInfo, config?: RequestInit): Promise<Response> {
                return await AuthHttpRequest.doRequest(
                    (config?: RequestInit) => {
                        return input.originalFetch(typeof url === "string" ? url : url.clone(), {
                            ...config
                        });
                    },
                    config,
                    url
                );
            };
        },
        addAxiosInterceptors: function(input: { axiosInstance: any; userContext: any }): void {
            logDebugMessage("addAxiosInterceptors: called");
            // we first check if this axiosInstance already has our interceptors.
            let requestInterceptors = input.axiosInstance.interceptors.request;
            for (let i = 0; i < requestInterceptors.handlers.length; i++) {
                if (requestInterceptors.handlers[i].fulfilled === interceptorFunctionRequestFulfilled) {
                    logDebugMessage("addAxiosInterceptors: not adding because already added on this instance");
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
            logDebugMessage("getUserId: called");
            let tokenInfo = await FrontToken.getTokenInfo();
            if (tokenInfo === undefined) {
                throw new Error("No session exists");
            }
            logDebugMessage("getUserId: returning: " + tokenInfo.uid);
            return tokenInfo.uid;
        },
        getAccessTokenPayloadSecurely: async function(input: { userContext: any }): Promise<any> {
            logDebugMessage("getAccessTokenPayloadSecurely: called");
            let tokenInfo = await FrontToken.getTokenInfo();
            if (tokenInfo === undefined) {
                throw new Error("No session exists");
            }

            if (tokenInfo.ate < Date.now()) {
                logDebugMessage("getAccessTokenPayloadSecurely: access token expired. Refreshing session");
                let retry = await AuthHttpRequest.attemptRefreshingSession();
                if (retry) {
                    return await this.getAccessTokenPayloadSecurely({
                        userContext: input.userContext
                    });
                } else {
                    throw new Error("Could not refresh session");
                }
            }
            logDebugMessage("getAccessTokenPayloadSecurely: returning: " + JSON.stringify(tokenInfo.up));
            return tokenInfo.up;
        },
        doesSessionExist: async function(_: { userContext: any }): Promise<boolean> {
            logDebugMessage("doesSessionExist: called");
            return (await getIdRefreshToken(true)).status === "EXISTS";
        },
        signOut: async function(input: { userContext: any }): Promise<void> {
            logDebugMessage("signOut: called");
            if (!(await this.doesSessionExist(input))) {
                logDebugMessage("signOut: existing early because session does not exist");
                logDebugMessage("signOut: firing SIGN_OUT event");
                recipeImplInput.onHandleEvent({
                    action: "SIGN_OUT",
                    userContext: input.userContext
                });
                return;
            }

            logDebugMessage("signOut: Calling refresh pre API hook");
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

            logDebugMessage("signOut: Calling API");
            let resp = await fetch(preAPIResult.url, preAPIResult.requestInit);
            logDebugMessage("signOut: API ended");

            await recipeImplInput.postAPIHook({
                action: "SIGN_OUT",
                requestInit: preAPIResult.requestInit,
                url: preAPIResult.url,
                fetchResponse: resp.clone(),
                userContext: input.userContext
            });

            logDebugMessage("signOut: API ended");

            logDebugMessage("signOut: API responded with status code: " + resp.status);

            if (resp.status === recipeImplInput.sessionExpiredStatusCode) {
                // refresh must have already sent session expiry event
                return;
            }

            if (resp.status >= 300) {
                throw resp;
            }

            // we do not send an event here since it's triggered in setIdRefreshToken area.
        },

        getGlobalClaimValidators: async function(input: {
            claimValidatorsAddedByOtherRecipes: SessionClaimValidator[];
        }) {
            return input.claimValidatorsAddedByOtherRecipes;
        },

        validateClaims: async function(input: {
            claimValidators: SessionClaimValidator[];
            userContext?: any;
        }): Promise<ClaimValidationError[] | undefined> {
            let accessTokenPayload = await this.getAccessTokenPayloadSecurely({ userContext: input.userContext });
            // We first refresh all claims that may need to be refreshed, before running any validators,
            // to avoid a situation where:
            // 1. The payload passes claimValidators[0].
            // 2. claimValidators[1] requires a refresh
            // 3. The accessTokenPayload is refreshed to a state where it no longer passes claimValidators[0]
            // 4. We return no errors since both claimValidators[0] and claimValidators[1] passed (but different states of the payload)
            // Running all refreshes before validation avoids this.

            for (const validator of input.claimValidators) {
                if (await validator.shouldRefresh(accessTokenPayload, input.userContext)) {
                    await validator.refresh(input.userContext);
                    accessTokenPayload = await this.getAccessTokenPayloadSecurely({ userContext: input.userContext });
                }
            }

            const errors = [];
            for (const validator of input.claimValidators) {
                const validationRes = await validator.validate(accessTokenPayload, input.userContext);
                if (!validationRes.isValid) {
                    errors.push({
                        validatorId: validator.id,
                        reason: validationRes.reason
                    });
                }
            }

            if (errors.length > 0) {
                return errors;
            }
            return undefined;
        }
    };
}
