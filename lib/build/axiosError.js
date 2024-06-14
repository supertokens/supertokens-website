"use strict";
var __awaiter =
    (this && this.__awaiter) ||
    function (thisArg, _arguments, P, generator) {
        function adopt(value) {
            return value instanceof P
                ? value
                : new P(function (resolve) {
                      resolve(value);
                  });
        }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) {
                try {
                    step(generator.next(value));
                } catch (e) {
                    reject(e);
                }
            }
            function rejected(value) {
                try {
                    step(generator["throw"](value));
                } catch (e) {
                    reject(e);
                }
            }
            function step(result) {
                result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
            }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };
var __generator =
    (this && this.__generator) ||
    function (thisArg, body) {
        var _ = {
                label: 0,
                sent: function () {
                    if (t[0] & 1) throw t[1];
                    return t[1];
                },
                trys: [],
                ops: []
            },
            f,
            y,
            t,
            g;
        return (
            (g = { next: verb(0), throw: verb(1), return: verb(2) }),
            typeof Symbol === "function" &&
                (g[Symbol.iterator] = function () {
                    return this;
                }),
            g
        );
        function verb(n) {
            return function (v) {
                return step([n, v]);
            };
        }
        function step(op) {
            if (f) throw new TypeError("Generator is already executing.");
            while (_)
                try {
                    if (
                        ((f = 1),
                        y &&
                            (t =
                                op[0] & 2
                                    ? y["return"]
                                    : op[0]
                                    ? y["throw"] || ((t = y["return"]) && t.call(y), 0)
                                    : y.next) &&
                            !(t = t.call(y, op[1])).done)
                    )
                        return t;
                    if (((y = 0), t)) op = [op[0] & 2, t.value];
                    switch (op[0]) {
                        case 0:
                        case 1:
                            t = op;
                            break;
                        case 4:
                            _.label++;
                            return { value: op[1], done: false };
                        case 5:
                            _.label++;
                            y = op[1];
                            op = [0];
                            continue;
                        case 7:
                            op = _.ops.pop();
                            _.trys.pop();
                            continue;
                        default:
                            if (
                                !((t = _.trys), (t = t.length > 0 && t[t.length - 1])) &&
                                (op[0] === 6 || op[0] === 2)
                            ) {
                                _ = 0;
                                continue;
                            }
                            if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                                _.label = op[1];
                                break;
                            }
                            if (op[0] === 6 && _.label < t[1]) {
                                _.label = t[1];
                                t = op;
                                break;
                            }
                            if (t && _.label < t[2]) {
                                _.label = t[2];
                                _.ops.push(op);
                                break;
                            }
                            if (t[2]) _.ops.pop();
                            _.trys.pop();
                            continue;
                    }
                    op = body.call(thisArg, _);
                } catch (e) {
                    op = [6, e];
                    y = 0;
                } finally {
                    f = t = 0;
                }
            if (op[0] & 5) throw op[1];
            return { value: op[0] ? op[1] : void 0, done: true };
        }
    };
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAxiosErrorFromFetchResp = void 0;
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
function enhanceAxiosError(error, config, code, request, response) {
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
function createAxiosErrorFromFetchResp(responseOrError) {
    return __awaiter(this, void 0, void 0, function () {
        var config, isResponse, axiosResponse, contentType, data, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    config = {
                        url: responseOrError.url,
                        headers: responseOrError.headers
                    };
                    isResponse = "status" in responseOrError;
                    if (!isResponse) return [3 /*break*/, 12];
                    contentType = responseOrError.headers.get("content-type");
                    data = void 0;
                    if (!(contentType === null)) return [3 /*break*/, 5];
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, responseOrError.text()];
                case 2:
                    data = _b.sent();
                    return [3 /*break*/, 4];
                case 3:
                    _a = _b.sent();
                    data = "";
                    return [3 /*break*/, 4];
                case 4:
                    return [3 /*break*/, 11];
                case 5:
                    if (!contentType.includes("application/json")) return [3 /*break*/, 7];
                    return [4 /*yield*/, responseOrError.json()];
                case 6:
                    data = _b.sent();
                    return [3 /*break*/, 11];
                case 7:
                    if (!contentType.includes("text/")) return [3 /*break*/, 9];
                    return [4 /*yield*/, responseOrError.text()];
                case 8:
                    data = _b.sent();
                    return [3 /*break*/, 11];
                case 9:
                    return [4 /*yield*/, responseOrError.blob()];
                case 10:
                    data = _b.sent();
                    _b.label = 11;
                case 11:
                    axiosResponse = {
                        data: data,
                        status: responseOrError.status,
                        statusText: responseOrError.statusText,
                        headers: responseOrError.headers,
                        config: config,
                        request: undefined
                    };
                    _b.label = 12;
                case 12:
                    return [
                        2 /*return*/,
                        enhanceAxiosError(
                            isResponse
                                ? new Error("Request failed with status code " + responseOrError.status)
                                : responseOrError,
                            config,
                            responseOrError.code,
                            undefined,
                            axiosResponse
                        )
                    ];
            }
        });
    });
}
exports.createAxiosErrorFromFetchResp = createAxiosErrorFromFetchResp;
