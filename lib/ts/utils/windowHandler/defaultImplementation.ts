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
import { StorageHandler, WindowHandlerInterface } from "./types";

function getWindowOrThrow(): Window {
    if (typeof window === "undefined") {
        throw Error(
            "If you are using this package with server-side rendering, please make sure that you are checking if the window object is defined."
        );
    }

    return window;
}

const defaultLocalStorageHandler: StorageHandler = {
    key: async function(index: number) {
        return getWindowOrThrow().localStorage.key(index);
    },
    clear: async function() {
        return getWindowOrThrow().localStorage.clear();
    },
    getItem: async function(key: string) {
        return getWindowOrThrow().localStorage.getItem(key);
    },
    removeItem: async function(key: string) {
        return getWindowOrThrow().localStorage.removeItem(key);
    },
    setItem: async function(key: string, value: string) {
        return getWindowOrThrow().localStorage.setItem(key, value);
    },
    keySync: function(index: number) {
        return getWindowOrThrow().localStorage.key(index);
    },
    clearSync: function() {
        return getWindowOrThrow().localStorage.clear();
    },
    getItemSync: function(key: string) {
        return getWindowOrThrow().localStorage.getItem(key);
    },
    removeItemSync: function(key: string) {
        return getWindowOrThrow().localStorage.removeItem(key);
    },
    setItemSync: function(key: string, value: string) {
        return getWindowOrThrow().localStorage.setItem(key, value);
    }
};

const defaultSessionStorageHandler: StorageHandler = {
    key: async function(index: number) {
        return getWindowOrThrow().sessionStorage.key(index);
    },
    clear: async function() {
        return getWindowOrThrow().sessionStorage.clear();
    },
    getItem: async function(key: string) {
        return getWindowOrThrow().sessionStorage.getItem(key);
    },
    removeItem: async function(key: string) {
        return getWindowOrThrow().sessionStorage.removeItem(key);
    },
    setItem: async function(key: string, value: string) {
        return getWindowOrThrow().sessionStorage.setItem(key, value);
    },

    keySync: function(index: number) {
        return getWindowOrThrow().sessionStorage.key(index);
    },
    clearSync: function() {
        return getWindowOrThrow().sessionStorage.clear();
    },
    getItemSync: function(key: string) {
        return getWindowOrThrow().sessionStorage.getItem(key);
    },
    removeItemSync: function(key: string) {
        return getWindowOrThrow().sessionStorage.removeItem(key);
    },
    setItemSync: function(key: string, value: string) {
        return getWindowOrThrow().sessionStorage.setItem(key, value);
    }
};

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
    getWindowUnsafe: function() {
        return getWindowOrThrow().window;
    },
    localStorage: defaultLocalStorageHandler,
    sessionStorage: defaultSessionStorageHandler
};
