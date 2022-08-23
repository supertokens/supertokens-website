/* Copyright (c) 2020, VRAI Labs and/or its affiliates. All rights reserved.
 *
 * This software is licensed under the Apache License, Version 2.0 (the
 * "License") as published by the Apache Software Foundation.
 *
 * You may not use this file except in compliance with the License. You may
 * obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 */
// import { AxiosPromise, AxiosRequestConfig, AxiosResponse } from "axios";
// import { createAxiosErrorFromAxiosResp, createAxiosErrorFromFetchResp } from "./axiosError";

// import AuthHttpRequestFetch, {
//     AntiCsrfToken,
//     getIdRefreshToken,
//     setIdRefreshToken,
//     FrontToken,
//     onUnauthorisedResponse
// } from "./fetch";
// import { PROCESS_STATE, ProcessState } from "./processState";
// import { shouldDoInterceptionBasedOnUrl } from "./utils";
// import WindowHandlerReference from "./utils/windowHandler";
// import { logDebugMessage } from "./logger";

// Taken from http://jsfiddle.net/8nyku97o/

export function addInterceptorsToXMLHttpRequest() {
    // create XMLHttpRequest proxy object
    let oldXMLHttpRequest = XMLHttpRequest;

    // define constructor for my proxy object
    XMLHttpRequest = function(this: typeof XMLHttpRequest.prototype) {
        let actual: any = new oldXMLHttpRequest();
        let self: any = this;

        // generic function for modifying the response that can be used by
        // multiple event handlers
        function handleResponse(prop: string) {
            return function(this: typeof XMLHttpRequest.prototype) {
                if (self[prop]) {
                    return self[prop].apply(self, arguments);
                }
            };
        }

        // properties we don't proxy because we override their behavior
        self.onloadend = null;
        if (actual.addEventListener) {
            self.addEventListener = function(event: any, fn: any, capture: any) {
                return actual.addEventListener(
                    event,
                    function(this: typeof XMLHttpRequest.prototype, _: any) {
                        return fn.apply(self, arguments);
                    },
                    capture
                );
            };
        }

        // // this is the actual handler on the real XMLHttpRequest object
        // actual.onreadystatechange = handleResponse("onreadystatechange");
        // actual.onload = handleResponse("onload");
        actual.onloadend = handleResponse("onloadend");

        // iterate all properties in actual to proxy them according to their type
        // For functions, we call actual and return the result
        // For non-functions, we make getters/setters
        // If the property already exists on self, then don't proxy it
        for (const prop in actual) {
            // skip properties we already have - this will skip both the above defined properties
            // that we don't want to proxy and skip properties on the prototype belonging to Object
            if (!(prop in self)) {
                // create closure to capture value of prop
                (function(prop) {
                    if (typeof actual[prop] === "function") {
                        // define our own property that calls the same method on the actual
                        Object.defineProperty(self, prop, {
                            configurable: true,
                            value: function() {
                                return actual[prop].apply(actual, arguments);
                            }
                        });
                    } else {
                        // define our own property that just gets or sets the same prop on the actual
                        Object.defineProperty(self, prop, {
                            get: function() {
                                return actual[prop];
                            },
                            set: function(val) {
                                actual[prop] = val;
                            }
                        });
                    }
                })(prop);
            }
        }
    } as any;
}

/**
 *
 * var request = new XMLHttpRequest();

    // HTTP basic authentication
    if (config.auth) {
      var username = config.auth.username || '';
      var password = config.auth.password ? unescape(encodeURIComponent(config.auth.password)) : '';
      requestHeaders.Authorization = 'Basic ' + btoa(username + ':' + password);
    }

    var fullPath = buildFullPath(config.baseURL, config.url);
    request.open(config.method.toUpperCase(), buildURL(fullPath, config.params, config.paramsSerializer), true);

    // Set the request timeout in MS
    request.timeout = config.timeout;

    function onloadend() {
      if (!request) {
        return;
      }
      // Prepare the response
      var responseHeaders = 'getAllResponseHeaders' in request ? parseHeaders(request.getAllResponseHeaders()) : null;
      var responseData = !responseType || responseType === 'text' ||  responseType === 'json' ?
        request.responseText : request.response;
      var response = {
        data: responseData,
        status: request.status,
        statusText: request.statusText,
        headers: responseHeaders,
        config: config,
        request: request
      };

      settle(resolve, reject, response);

      // Clean up request
      request = null;
    }

    if ('onloadend' in request) {
      // Use onloadend if available
      request.onloadend = onloadend;
    } else {
      // Listen for ready state to emulate onloadend
      request.onreadystatechange = function handleLoad() {
        if (!request || request.readyState !== 4) {
          return;
        }

        // The request errored out and we didn't get a response, this will be
        // handled by onerror instead
        // With one exception: request that using file: protocol, most browsers
        // will return status as 0 even though it's a successful request
        if (request.status === 0 && !(request.responseURL && request.responseURL.indexOf('file:') === 0)) {
          return;
        }
        // readystate handler is calling before onerror or ontimeout handlers,
        // so we should call onloadend on the next 'tick'
        setTimeout(onloadend);
      };
    }

    // Handle browser request cancellation (as opposed to a manual cancellation)
    request.onabort = function handleAbort() {
      if (!request) {
        return;
      }

      reject(createError('Request aborted', config, 'ECONNABORTED', request));

      // Clean up request
      request = null;
    };

    // Handle low level network errors
    request.onerror = function handleError() {
      // Real errors are hidden from us by the browser
      // onerror should only fire if it's a network error
      reject(createError('Network Error', config, null, request));

      // Clean up request
      request = null;
    };

    // Handle timeout
    request.ontimeout = function handleTimeout() {
      var timeoutErrorMessage = 'timeout of ' + config.timeout + 'ms exceeded';
      if (config.timeoutErrorMessage) {
        timeoutErrorMessage = config.timeoutErrorMessage;
      }
      reject(createError(
        timeoutErrorMessage,
        config,
        config.transitional && config.transitional.clarifyTimeoutError ? 'ETIMEDOUT' : 'ECONNABORTED',
        request));

      // Clean up request
      request = null;
    };

    // Add xsrf header
    // This is only done if running in a standard browser environment.
    // Specifically not if we're in a web worker, or react-native.
    if (utils.isStandardBrowserEnv()) {
      // Add xsrf header
      var xsrfValue = (config.withCredentials || isURLSameOrigin(fullPath)) && config.xsrfCookieName ?
        cookies.read(config.xsrfCookieName) :
        undefined;

      if (xsrfValue) {
        requestHeaders[config.xsrfHeaderName] = xsrfValue;
      }
    }

    // Add headers to the request
    if ('setRequestHeader' in request) {
      utils.forEach(requestHeaders, function setRequestHeader(val, key) {
        if (typeof requestData === 'undefined' && key.toLowerCase() === 'content-type') {
          // Remove Content-Type if data is undefined
          delete requestHeaders[key];
        } else {
          // Otherwise add header to the request
          request.setRequestHeader(key, val);
        }
      });
    }

    // Add withCredentials to request if needed
    if (!utils.isUndefined(config.withCredentials)) {
      request.withCredentials = !!config.withCredentials;
    }

    // Add responseType to request if needed
    if (responseType && responseType !== 'json') {
      request.responseType = config.responseType;
    }

    // Handle progress if needed
    if (typeof config.onDownloadProgress === 'function') {
      request.addEventListener('progress', config.onDownloadProgress);
    }

    // Not all browsers support upload events
    if (typeof config.onUploadProgress === 'function' && request.upload) {
      request.upload.addEventListener('progress', config.onUploadProgress);
    }

    if (config.cancelToken) {
      // Handle cancellation
      config.cancelToken.promise.then(function onCanceled(cancel) {
        if (!request) {
          return;
        }

        request.abort();
        reject(cancel);
        // Clean up request
        request = null;
      });
    }

    if (!requestData) {
      requestData = null;
    }

    // Send the request
    request.send(requestData);
 *
 *
 *
 *
 *
 */

// function getUrlFromConfig(config: AxiosRequestConfig) {
//     let url: string = config.url === undefined ? "" : config.url;
//     let baseURL: string | undefined = config.baseURL;
//     if (baseURL !== undefined) {
//         if (url.charAt(0) === "/" && baseURL.charAt(baseURL.length - 1) === "/") {
//             url = baseURL + url.substr(1);
//         } else if (url.charAt(0) !== "/" && baseURL.charAt(baseURL.length - 1) !== "/") {
//             url = baseURL + "/" + url;
//         } else {
//             url = baseURL + url;
//         }
//     }
//     return url;
// }

// export async function interceptorFunctionRequestFulfilled(config: AxiosRequestConfig) {
//     logDebugMessage("interceptorFunctionRequestFulfilled: started axios interception");
//     let url = getUrlFromConfig(config);

//     let doNotDoInterception = false;
//     try {
//         doNotDoInterception =
//             typeof url === "string" &&
//             !shouldDoInterceptionBasedOnUrl(
//                 url,
//                 AuthHttpRequestFetch.config.apiDomain,
//                 AuthHttpRequestFetch.config.cookieDomain
//             );
//     } catch (err) {
//         if ((err as any).message === "Please provide a valid domain name") {
//             logDebugMessage(
//                 "interceptorFunctionRequestFulfilled: Trying shouldDoInterceptionBasedOnUrl with location.origin"
//             );
//             // .origin gives the port as well..
//             doNotDoInterception = !shouldDoInterceptionBasedOnUrl(
//                 WindowHandlerReference.getReferenceOrThrow().windowHandler.location.getOrigin(),
//                 AuthHttpRequestFetch.config.apiDomain,
//                 AuthHttpRequestFetch.config.cookieDomain
//             );
//         } else {
//             throw err;
//         }
//     }
//     logDebugMessage("interceptorFunctionRequestFulfilled: Value of doNotDoInterception: " + doNotDoInterception);
//     if (doNotDoInterception) {
//         logDebugMessage("interceptorFunctionRequestFulfilled: Returning config unchanged");
//         // this check means that if you are using axios via inteceptor, then we only do the refresh steps if you are calling your APIs.
//         return config;
//     }
//     logDebugMessage("interceptorFunctionRequestFulfilled: Modifying config");
//     ProcessState.getInstance().addState(PROCESS_STATE.CALLING_INTERCEPTION_REQUEST);
//     const preRequestIdToken = await getIdRefreshToken(true);
//     let configWithAntiCsrf: AxiosRequestConfig = config;
//     if (preRequestIdToken.status === "EXISTS") {
//         const antiCsrfToken = await AntiCsrfToken.getToken(preRequestIdToken.token);
//         if (antiCsrfToken !== undefined) {
//             logDebugMessage("interceptorFunctionRequestFulfilled: Adding anti-csrf token to request");
//             configWithAntiCsrf = {
//                 ...configWithAntiCsrf,
//                 headers:
//                     configWithAntiCsrf === undefined
//                         ? {
//                               "anti-csrf": antiCsrfToken
//                           }
//                         : {
//                               ...configWithAntiCsrf.headers,
//                               "anti-csrf": antiCsrfToken
//                           }
//             };
//         }
//     }

//     if (AuthHttpRequestFetch.config.autoAddCredentials && configWithAntiCsrf.withCredentials === undefined) {
//         logDebugMessage("interceptorFunctionRequestFulfilled: Adding credentials include");
//         configWithAntiCsrf = {
//             ...configWithAntiCsrf,
//             withCredentials: true
//         };
//     }

//     // adding rid for anti-csrf protection: Anti-csrf via custom header
//     logDebugMessage(
//         "interceptorFunctionRequestFulfilled: Adding rid header: anti-csrf (it may be overriden by the user's provided rid)"
//     );
//     configWithAntiCsrf = {
//         ...configWithAntiCsrf,
//         headers:
//             configWithAntiCsrf === undefined
//                 ? {
//                       rid: "anti-csrf"
//                   }
//                 : {
//                       rid: "anti-csrf",
//                       ...configWithAntiCsrf.headers
//                   }
//     };

//     logDebugMessage("interceptorFunctionRequestFulfilled: returning modified config");
//     return configWithAntiCsrf;
// }

// export function responseInterceptor(axiosInstance: any) {
//     return async (response: AxiosResponse) => {
//         let doNotDoInterception = false;
//         try {
//             if (!AuthHttpRequestFetch.initCalled) {
//                 throw new Error("init function not called");
//             }
//             logDebugMessage("responseInterceptor: started");
//             let url = getUrlFromConfig(response.config);

//             try {
//                 doNotDoInterception =
//                     typeof url === "string" &&
//                     !shouldDoInterceptionBasedOnUrl(
//                         url,
//                         AuthHttpRequestFetch.config.apiDomain,
//                         AuthHttpRequestFetch.config.cookieDomain
//                     );
//             } catch (err) {
//                 if ((err as any).message === "Please provide a valid domain name") {
//                     logDebugMessage("responseInterceptor: Trying shouldDoInterceptionBasedOnUrl with location.origin");
//                     // .origin gives the port as well..
//                     doNotDoInterception = !shouldDoInterceptionBasedOnUrl(
//                         WindowHandlerReference.getReferenceOrThrow().windowHandler.location.getOrigin(),
//                         AuthHttpRequestFetch.config.apiDomain,
//                         AuthHttpRequestFetch.config.cookieDomain
//                     );
//                 } else {
//                     throw err;
//                 }
//             }
//             logDebugMessage("responseInterceptor: Value of doNotDoInterception: " + doNotDoInterception);
//             if (doNotDoInterception) {
//                 logDebugMessage("responseInterceptor: Returning without interception");
//                 // this check means that if you are using axios via inteceptor, then we only do the refresh steps if you are calling your APIs.
//                 return response;
//             }
//             logDebugMessage("responseInterceptor: Interception started");

//             ProcessState.getInstance().addState(PROCESS_STATE.CALLING_INTERCEPTION_RESPONSE);

//             let idRefreshToken = response.headers["id-refresh-token"];
//             if (idRefreshToken !== undefined) {
//                 logDebugMessage("responseInterceptor: Setting sIRTFrontend: " + idRefreshToken);
//                 await setIdRefreshToken(idRefreshToken, response.status);
//             }
//             if (response.status === AuthHttpRequestFetch.config.sessionExpiredStatusCode) {
//                 logDebugMessage("responseInterceptor: Status code is: " + response.status);
//                 let config = response.config;
//                 return AuthHttpRequest.doRequest(
//                     (config: AxiosRequestConfig) => {
//                         // we create an instance since we don't want to intercept this.
//                         // const instance = axios.create();
//                         // return instance(config);
//                         return axiosInstance(config);
//                     },
//                     config,
//                     url,
//                     response,
//                     true
//                 );
//             } else {
//                 let antiCsrfToken = response.headers["anti-csrf"];
//                 if (antiCsrfToken !== undefined) {
//                     let tok = await getIdRefreshToken(true);
//                     if (tok.status === "EXISTS") {
//                         logDebugMessage("responseInterceptor: Setting anti-csrf token");
//                         await AntiCsrfToken.setItem(tok.token, antiCsrfToken);
//                     }
//                 }
//                 let frontToken = response.headers["front-token"];
//                 if (frontToken !== undefined) {
//                     logDebugMessage("responseInterceptor: Setting sFrontToken: " + frontToken);
//                     await FrontToken.setItem(frontToken);
//                 }
//                 return response;
//             }
//         } finally {
//             if (
//                 !doNotDoInterception &&
//                 // we do not call doesSessionExist here cause the user might override that
//                 // function here and then it may break the logic of our original implementation.
//                 !((await getIdRefreshToken(true)).status === "EXISTS")
//             ) {
//                 logDebugMessage(
//                     "responseInterceptor: sIRTFrontend doesn't exist, so removing anti-csrf and sFrontToken"
//                 );
//                 await AntiCsrfToken.removeToken();
//                 await FrontToken.removeToken();
//             }
//         }
//     };
// }

// export function responseErrorInterceptor(axiosInstance: any) {
//     return (error: any) => {
//         logDebugMessage("responseErrorInterceptor: called");
//         if (
//             error.response !== undefined &&
//             error.response.status === AuthHttpRequestFetch.config.sessionExpiredStatusCode
//         ) {
//             logDebugMessage("responseErrorInterceptor: Status code is: " + error.response.status);
//             let config = error.config;
//             return AuthHttpRequest.doRequest(
//                 (config: AxiosRequestConfig) => {
//                     // we create an instance since we don't want to intercept this.
//                     // const instance = axios.create();
//                     // return instance(config);
//                     return axiosInstance(config);
//                 },
//                 config,
//                 getUrlFromConfig(config),
//                 undefined,
//                 error,
//                 true
//             );
//         } else {
//             throw error;
//         }
//     };
// }

// /**
//  * @class AuthHttpRequest
//  * @description wrapper for common http methods.
//  */
// export default class AuthHttpRequest {
//     /**
//      * @description sends the actual http request and returns a response if successful/
//      * If not successful due to session expiry reasons, it
//      * attempts to call the refresh token API and if that is successful, calls this API again.
//      * @throws Error
//      */
//     static doRequest = async (
//         httpCall: (config: AxiosRequestConfig) => AxiosPromise<any>,
//         config: AxiosRequestConfig,
//         url?: string,
//         prevResponse?: AxiosResponse,
//         prevError?: any,
//         viaInterceptor: boolean = false
//     ): Promise<AxiosResponse<any>> => {
//         if (!AuthHttpRequestFetch.initCalled) {
//             throw Error("init function not called");
//         }
//         logDebugMessage("doRequest: called");

//         let doNotDoInterception = false;
//         try {
//             doNotDoInterception =
//                 typeof url === "string" &&
//                 !shouldDoInterceptionBasedOnUrl(
//                     url,
//                     AuthHttpRequestFetch.config.apiDomain,
//                     AuthHttpRequestFetch.config.cookieDomain
//                 ) &&
//                 viaInterceptor;
//         } catch (err) {
//             if ((err as any).message === "Please provide a valid domain name") {
//                 logDebugMessage("doRequest: Trying shouldDoInterceptionBasedOnUrl with location.origin");
//                 // .origin gives the port as well..
//                 doNotDoInterception =
//                     !shouldDoInterceptionBasedOnUrl(
//                         WindowHandlerReference.getReferenceOrThrow().windowHandler.location.getOrigin(),
//                         AuthHttpRequestFetch.config.apiDomain,
//                         AuthHttpRequestFetch.config.cookieDomain
//                     ) && viaInterceptor;
//             } else {
//                 throw err;
//             }
//         }

//         logDebugMessage("doRequest: Value of doNotDoInterception: " + doNotDoInterception);
//         if (doNotDoInterception) {
//             logDebugMessage("doRequest: Returning without interception");
//             if (prevError !== undefined) {
//                 throw prevError;
//             } else if (prevResponse !== undefined) {
//                 return prevResponse;
//             }
//             return await httpCall(config);
//         }
//         logDebugMessage("doRequest: Interception started");

//         try {
//             let returnObj = undefined;
//             while (true) {
//                 // we read this here so that if there is a session expiry error, then we can compare this value (that caused the error) with the value after the request is sent.
//                 // to avoid race conditions
//                 const preRequestIdToken = await getIdRefreshToken(true);
//                 let configWithAntiCsrf: AxiosRequestConfig = config;

//                 if (preRequestIdToken.status === "EXISTS") {
//                     const antiCsrfToken = await AntiCsrfToken.getToken(preRequestIdToken.token);
//                     if (antiCsrfToken !== undefined) {
//                         logDebugMessage("doRequest: Adding anti-csrf token to request");
//                         configWithAntiCsrf = {
//                             ...configWithAntiCsrf,
//                             headers:
//                                 configWithAntiCsrf === undefined
//                                     ? {
//                                           "anti-csrf": antiCsrfToken
//                                       }
//                                     : {
//                                           ...configWithAntiCsrf.headers,
//                                           "anti-csrf": antiCsrfToken
//                                       }
//                         };
//                     }
//                 }

//                 if (
//                     AuthHttpRequestFetch.config.autoAddCredentials &&
//                     configWithAntiCsrf.withCredentials === undefined
//                 ) {
//                     logDebugMessage("doRequest: Adding credentials include");
//                     configWithAntiCsrf = {
//                         ...configWithAntiCsrf,
//                         withCredentials: true
//                     };
//                 }

//                 // adding rid for anti-csrf protection: Anti-csrf via custom header
//                 logDebugMessage("doRequest: Adding rid header: anti-csrf (May get overriden by user's rid)");
//                 configWithAntiCsrf = {
//                     ...configWithAntiCsrf,
//                     headers:
//                         configWithAntiCsrf === undefined
//                             ? {
//                                   rid: "anti-csrf"
//                               }
//                             : {
//                                   rid: "anti-csrf",
//                                   ...configWithAntiCsrf.headers
//                               }
//                 };
//                 try {
//                     let localPrevError = prevError;
//                     let localPrevResponse = prevResponse;
//                     prevError = undefined;
//                     prevResponse = undefined;
//                     if (localPrevError !== undefined) {
//                         logDebugMessage("doRequest: Not making call because localPrevError is not undefined");
//                         throw localPrevError;
//                     }
//                     if (localPrevResponse !== undefined) {
//                         logDebugMessage("doRequest: Not making call because localPrevResponse is not undefined");
//                     } else {
//                         logDebugMessage("doRequest: Making user's http call");
//                     }
//                     let response =
//                         localPrevResponse === undefined ? await httpCall(configWithAntiCsrf) : localPrevResponse;
//                     logDebugMessage("doRequest: User's http call ended");
//                     let idRefreshToken = response.headers["id-refresh-token"];
//                     if (idRefreshToken !== undefined) {
//                         logDebugMessage("doRequest: Setting sIRTFrontend: " + idRefreshToken);
//                         await setIdRefreshToken(idRefreshToken, response.status);
//                     }
//                     if (response.status === AuthHttpRequestFetch.config.sessionExpiredStatusCode) {
//                         logDebugMessage("doRequest: Status code is: " + response.status);
//                         const refreshResult = await onUnauthorisedResponse(preRequestIdToken);
//                         if (refreshResult.result !== "RETRY") {
//                             logDebugMessage("doRequest: Not retrying original request");
//                             // Returning refreshResult.error as an Axios Error if we attempted a refresh
//                             // Returning the response to the original response as an error if we did not attempt refreshing
//                             returnObj = refreshResult.error
//                                 ? await createAxiosErrorFromFetchResp(refreshResult.error)
//                                 : await createAxiosErrorFromAxiosResp(response);
//                             break;
//                         }
//                         logDebugMessage("doRequest: Retrying original request");
//                     } else {
//                         let antiCsrfToken = response.headers["anti-csrf"];
//                         if (antiCsrfToken !== undefined) {
//                             let tok = await getIdRefreshToken(true);
//                             if (tok.status === "EXISTS") {
//                                 logDebugMessage("doRequest: Setting anti-csrf token");
//                                 await AntiCsrfToken.setItem(tok.token, antiCsrfToken);
//                             }
//                         }
//                         let frontToken = response.headers["front-token"];
//                         if (frontToken !== undefined) {
//                             logDebugMessage("doRequest: Setting sFrontToken: " + frontToken);
//                             await FrontToken.setItem(frontToken);
//                         }
//                         return response;
//                     }
//                 } catch (err) {
//                     if ((err as any).response !== undefined) {
//                         let idRefreshToken = (err as any).response.headers["id-refresh-token"];
//                         if (idRefreshToken !== undefined) {
//                             logDebugMessage("doRequest: Setting sIRTFrontend: " + idRefreshToken);
//                             await setIdRefreshToken(idRefreshToken, (err as any).response.status);
//                         }
//                         if ((err as any).response.status === AuthHttpRequestFetch.config.sessionExpiredStatusCode) {
//                             logDebugMessage("doRequest: Status code is: " + (err as any).response.status);
//                             const refreshResult = await onUnauthorisedResponse(preRequestIdToken);
//                             if (refreshResult.result !== "RETRY") {
//                                 logDebugMessage("doRequest: Not retrying original request");
//                                 // Returning refreshResult.error as an Axios Error if we attempted a refresh
//                                 // Returning the original error if we did not attempt refreshing
//                                 returnObj =
//                                     refreshResult.error !== undefined
//                                         ? await createAxiosErrorFromFetchResp(refreshResult.error)
//                                         : err;
//                                 break;
//                             }
//                             logDebugMessage("doRequest: Retrying original request");
//                         } else {
//                             throw err;
//                         }
//                     } else {
//                         throw err;
//                     }
//                 }
//             }
//             // if it comes here, means we called break. which happens only if we have logged out.
//             // which means it's a 401, so we throw
//             throw returnObj;
//         } finally {
//             // If we get here we already tried refreshing so we should have the already id refresh token either in EXISTS or NOT_EXISTS, so no need to call the backend
//             // The backend should not be down if we get here, but even if it were we shouldn't need to call refresh
//             const postRequestIdToken = await getIdRefreshToken(false);
//             if (postRequestIdToken.status === "NOT_EXISTS") {
//                 logDebugMessage("doRequest: sIRTFrontend doesn't exist, so removing anti-csrf and sFrontToken");
//                 await AntiCsrfToken.removeToken();
//                 await FrontToken.removeToken();
//             }
//         }
//     };
// }
