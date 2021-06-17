import { RecipeInterface, NormalisedInputType } from "./types";
export default class RecipeImplementation implements RecipeInterface {
    addFetchInterceptorsAndReturnModifiedFetch: (originalFetch: any, _: NormalisedInputType) => typeof fetch;
    addAxiosInterceptors: (axiosInstance: any, _: NormalisedInputType) => void;
    getUserId: (_: NormalisedInputType) => Promise<string>;
    getJWTPayloadSecurely: (config: NormalisedInputType) => Promise<any>;
    doesSessionExist: (_: NormalisedInputType) => Promise<boolean>;
    signOut: (config: NormalisedInputType) => Promise<void>;
}
