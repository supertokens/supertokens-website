import { RecipeInterface, NormalisedInputType } from "./types";
export declare class RecipeImplementation implements RecipeInterface {
    addFetchInterceptors: (env: any, originalFetch: any, _: NormalisedInputType) => Promise<void>;
    addAxiosInterceptors: (axiosInstance: any, _: NormalisedInputType) => Promise<void>;
    getUserId: (_: NormalisedInputType) => Promise<string>;
    getJWTPayloadSecurely: (config: NormalisedInputType) => Promise<any>;
    doesSessionExist: (_: NormalisedInputType) => Promise<boolean>;
    signOut: (config: NormalisedInputType) => Promise<void>;
}
