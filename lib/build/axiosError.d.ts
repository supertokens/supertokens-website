import { AxiosError, AxiosResponse } from "axios";
export declare function createAxiosErrorFromFetchResp(response: Response): Promise<AxiosError>;
export declare function createAxiosErrorFromAxiosResp(response: AxiosResponse): Promise<AxiosError>;
