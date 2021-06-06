import { RecipeInterface } from "./types";
export declare class RecipeImplementation implements RecipeInterface {
    addFetchInterceptors: (env: any, originalFetch: any) => Promise<void>;
    addAxiosInterceptors: (axiosInstance: any) => Promise<void>;
    getUserId: () => Promise<string>;
    getJWTPayloadSecurely: () => Promise<any>;
    attemptRefreshingSession: () => Promise<boolean>;
    doesSessionExist: () => Promise<boolean>;
    signOut: () => Promise<void>;
}
