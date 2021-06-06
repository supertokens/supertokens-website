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
import { InputType } from "./types";

export default class AuthHttpRequest {
    private static axiosInterceptorQueue: (() => void)[] = [];

    static init(options: InputType) {
        AuthHttpRequestFetch.init(options);
        AuthHttpRequest.axiosInterceptorQueue.forEach(f => {
            f();
        });
        AuthHttpRequest.axiosInterceptorQueue = [];
    }

    static getUserId(): Promise<string> {
        return AuthHttpRequestFetch.recipeImpl.getUserId();
    }

    static async getJWTPayloadSecurely(): Promise<any> {
        return AuthHttpRequestFetch.recipeImpl.getJWTPayloadSecurely();
    }

    static attemptRefreshingSession = async (): Promise<boolean> => {
        return AuthHttpRequestFetch.recipeImpl.attemptRefreshingSession();
    };

    static doesSessionExist = () => {
        return AuthHttpRequestFetch.recipeImpl.doesSessionExist();
    };

    static addAxiosInterceptors = (axiosInstance: any) => {
        if (!AuthHttpRequestFetch.initCalled) {
            // the recipe implementation has not been initialised yet, so add
            // this to the queue and wait for it to be initialised, and then on
            // init call, we add all the interceptors.
            AuthHttpRequest.axiosInterceptorQueue.push(() => {
                AuthHttpRequestFetch.recipeImpl.addAxiosInterceptors(axiosInstance);
            });
        } else {
            AuthHttpRequestFetch.recipeImpl.addAxiosInterceptors(axiosInstance);
        }
    };

    static signOut = () => {
        return AuthHttpRequestFetch.recipeImpl.signOut();
    };
}

export let init = AuthHttpRequest.init;
export let getUserId = AuthHttpRequest.getUserId;
export let getJWTPayloadSecurely = AuthHttpRequest.getJWTPayloadSecurely;
export let attemptRefreshingSession = AuthHttpRequest.attemptRefreshingSession;
export let doesSessionExist = AuthHttpRequest.doesSessionExist;
export let addAxiosInterceptors = AuthHttpRequest.addAxiosInterceptors;
export let signOut = AuthHttpRequest.signOut;
