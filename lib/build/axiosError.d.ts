import { AxiosError } from "axios";
export declare function createAxiosErrorFromFetchResp(responseOrError: Response): Promise<AxiosError>;
