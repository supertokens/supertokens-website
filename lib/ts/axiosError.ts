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
    if (!contentType || contentType.includes("application/json")) {
        try {
            data = response.json();
        } catch {
            data = response.text();
        }
    } else if (contentType.includes("text/")) {
        data = response.text();
    } else {
        data = response.blob();
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
        config,
        undefined,
        undefined,
        axiosResponse
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
