import { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";

/**
 * From axios package
 * Update an Error with the specified config, error code, and response.
 *
 * @param {Error} error The error to update.
 * @param {Object} config The config.
 * @param {string} [code] The error code (for example, 'ECONNABORTED').
 * @param {Object} [request] The request.
 * @param {Object} [response] The response.
 * @returns {Error} The error.
 */
function enhanceAxiosError(
    error: any,
    config: AxiosRequestConfig,
    code?: string,
    request?: any,
    response?: AxiosResponse
) {
    error.config = config;
    if (code) {
        error.code = code;
    }

    error.request = request;
    error.response = response;
    error.isAxiosError = true;

    error.toJSON = function toJSON() {
        return {
            // Standard
            message: this.message,
            name: this.name,
            // Microsoft
            description: this.description,
            number: this.number,
            // Mozilla
            fileName: this.fileName,
            lineNumber: this.lineNumber,
            columnNumber: this.columnNumber,
            stack: this.stack,
            // Axios
            config: this.config,
            code: this.code
        };
    };
    return error;
}

export async function createAxiosErrorFromFetchResp(responseOrError: Response): Promise<AxiosError> {
    const config = {
        url: responseOrError.url,
        headers: responseOrError.headers
    };

    const isResponse = "status" in responseOrError;
    let axiosResponse;
    if (isResponse) {
        const contentType = responseOrError.headers.get("content-type");

        let data;
        if (contentType === null) {
            try {
                data = await responseOrError.text();
            } catch {
                data = "";
            }
        } else if (contentType.includes("application/json")) {
            data = await responseOrError.json();
        } else if (contentType.includes("text/")) {
            data = await responseOrError.text();
        } else {
            data = await responseOrError.blob();
        }

        axiosResponse = {
            data,
            status: responseOrError.status,
            statusText: responseOrError.statusText,
            headers: responseOrError.headers,
            config: config,
            request: undefined
        };
    }
    return enhanceAxiosError(
        isResponse ? new Error("Request failed with status code " + responseOrError.status) : responseOrError,
        config as any,
        (responseOrError as any).code,
        undefined,
        axiosResponse as any
    );
}
