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
import { WindowHandlerInterface } from "./types";

function getWindowOrThrow(): Window {
    if (typeof window === "undefined") {
        throw Error(
            "If you are using this package with server-side rendering, please make sure that you are checking if the window object is defined."
        );
    }

    return window;
}

export const defaultWindowHandlerImplementation: WindowHandlerInterface = {
    history: {
        replaceState: function(data, unused, url) {
            return getWindowOrThrow().history.replaceState(data, unused, url);
        },
        getState: function() {
            return getWindowOrThrow().history.state;
        }
    },
    location: {
        getHref: function() {
            return getWindowOrThrow().location.href;
        },
        setHref: function(href) {
            getWindowOrThrow().location.href = href;
        },
        getSearch: function() {
            return getWindowOrThrow().location.search;
        },
        getHash: function() {
            return getWindowOrThrow().location.hash;
        },
        getPathName: function() {
            return getWindowOrThrow().location.pathname;
        },
        assign: function(url) {
            /**
             * The type for assign accepts URL | string but when building
             * it complains about only accepting a string. To prevent this
             * we use any
             */
            getWindowOrThrow().location.assign(url as any);
        },
        getHostName: function() {
            return getWindowOrThrow().location.hostname;
        },
        getOrigin: function() {
            return getWindowOrThrow().location.origin;
        }
    },
    getDocument: function() {
        return getWindowOrThrow().document;
    },
    getLocalStorage: function() {
        return getWindowOrThrow().localStorage;
    },
    getSessionStorage: function() {
        return getWindowOrThrow().sessionStorage;
    }
};
