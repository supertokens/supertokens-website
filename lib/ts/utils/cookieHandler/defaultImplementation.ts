/* Copyright (c) 2022, VRAI Labs and/or its affiliates. All rights reserved.
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
import { CookieHandlerInterface } from "./types";

function getWindowOrThrow(): Window {
    if (typeof window === "undefined") {
        throw Error(
            "If you are using this package with server-side rendering, please make sure that you are checking if the window object is defined."
        );
    }

    return window;
}

export const defaultCookieHandlerImplementation: CookieHandlerInterface = {
    getCookie: async function() {
        return getWindowOrThrow().document.cookie;
    },
    getCookieSync: function() {
        return getWindowOrThrow().document.cookie;
    },
    setCookie: async function(cookieString: string) {
        getWindowOrThrow().document.cookie = cookieString;
    },
    setCookieSync: async function(cookieString: string) {
        getWindowOrThrow().document.cookie = cookieString;
    }
};
