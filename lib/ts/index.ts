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

import AuthHttpRequestFetch from "./fetch";
import AuthHttpRequestAxios from "./axios";
import { InputType } from "./types";

export default class AuthHttpRequest {
    static init(options: InputType) {
        AuthHttpRequestFetch.init(options);
    }

    static setAuth0API(apiPath: string) {
        return AuthHttpRequestFetch.setAuth0API(apiPath);
    }

    static getAuth0API = () => {
        return AuthHttpRequestFetch.getAuth0API();
    };

    static getRefreshURLDomain = (): string | undefined => {
        return AuthHttpRequestFetch.getRefreshURLDomain();
    };

    static getUserId(): Promise<string> {
        return AuthHttpRequestFetch.getUserId();
    }

    static async getJWTPayloadSecurely(): Promise<any> {
        return AuthHttpRequestFetch.getJWTPayloadSecurely();
    }

    /**
     * @description attempts to refresh session regardless of expiry
     * @returns true if successful, else false if session has expired. Wrapped in a Promise
     * @throws error if anything goes wrong
     */
    static attemptRefreshingSession = async (): Promise<boolean> => {
        return AuthHttpRequestFetch.attemptRefreshingSession();
    };

    static doesSessionExist = () => {
        return AuthHttpRequestFetch.doesSessionExist();
    };

    static addAxiosInterceptors = (axiosInstance: any) => {
        return AuthHttpRequestAxios.addAxiosInterceptors(axiosInstance);
    };

    static signOut = () => {
        return AuthHttpRequestFetch.signOut();
    };
}

export let init = AuthHttpRequest.init;
export let setAuth0API = AuthHttpRequest.setAuth0API;
export let getAuth0API = AuthHttpRequest.getAuth0API;
export let getRefreshURLDomain = AuthHttpRequest.getRefreshURLDomain;
export let getUserId = AuthHttpRequest.getUserId;
export let getJWTPayloadSecurely = AuthHttpRequest.getJWTPayloadSecurely;
export let attemptRefreshingSession = AuthHttpRequest.attemptRefreshingSession;
export let doesSessionExist = AuthHttpRequest.doesSessionExist;
export let addAxiosInterceptors = AuthHttpRequest.addAxiosInterceptors;
export let signOut = AuthHttpRequest.signOut;
