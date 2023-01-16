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

export async function createAxiosErrorFromFetchResp(response: Response): Promise<AxiosError> {
    const config = {
        url: response.url,
        headers: response.headers
    };
    const contentType = response.headers.get("content-type");

    let data;
    if (contentType === null) {
        try {
            data = await response.text();
        } catch {
            data = "";
        }
    } else if (contentType.includes("application/json")) {
        data = await response.json();
    } else if (contentType.includes("text/")) {
        data = await response.text();
    } else {
        data = await response.blob();
    }

    const axiosResponse = {
        data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        config: config,
        request: undefined
    };
    return enhanceAxiosError(
        new Error("Request failed with status code " + response.status),
        config as any,
        undefined,
        undefined,
        axiosResponse as any
    );
}

export async function createAxiosErrorFromAxiosResp(response: AxiosResponse): Promise<AxiosError> {
    return enhanceAxiosError(
        new Error("Request failed with status code " + response.status),
        response.config,
        undefined,
        response.request,
        response
    );
}
