import { RecipeInterface } from "./types";
export declare class RecipeImplementation implements RecipeInterface {
    addFetchInterceptors: (env: any, originalFetch: any) => Promise<void>;
    addAxiosInterceptors: (axiosInstance: any) => Promise<void>;
}
