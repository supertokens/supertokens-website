"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
function getWindowOrThrow() {
    if (typeof window === "undefined") {
        throw Error(
            "If you are using this package with server-side rendering, please make sure that you are checking if the window object is defined."
        );
    }
    return window;
}
exports.getWindowOrThrow = getWindowOrThrow;
exports.WindowUtilities = {
    history: {
        replaceState: function(data, unused, url) {
            getWindowOrThrow().history.replaceState(data, unused, url);
        },
        get state() {
            return getWindowOrThrow().history.state;
        }
    },
    location: {
        get href() {
            return getWindowOrThrow().location.href;
        },
        set href(newHref) {
            getWindowOrThrow().location.href = newHref;
        },
        get search() {
            if (isRunningInElectron()) {
                /**
                 * In electron most users end up using HashRouter, in this case
                 * the URL is formed in this pattern "https://origin#/path?query"
                 *
                 * Because the path + query is prefixed with a "#" character, using
                 * window.location.search will return nothing because the query is now
                 * part of the location hash.
                 *
                 * To avoid this problem we manually extract the query string from the URL
                 * for electron apps
                 */
                var currentURL = getWindowOrThrow().location.href;
                var firstQuestionMarkIndex = currentURL.indexOf("?");
                if (firstQuestionMarkIndex !== -1) {
                    // Return the query string from the url
                    var queryString = currentURL.substring(firstQuestionMarkIndex);
                    return queryString;
                }
                return "";
            }
            return getWindowOrThrow().location.search;
        },
        get hash() {
            if (isRunningInElectron()) {
                var locationHash = getWindowOrThrow().location.hash;
                if (locationHash === "") {
                    return "";
                }
                if (locationHash.startsWith("#")) {
                    // Remove the starting pound symbol
                    locationHash = locationHash.substring(1);
                }
                if (!locationHash.includes("#")) {
                    // The remaining string did not have any "#" character
                    return "";
                }
                var locationSplit = locationHash.split("#");
                if (locationSplit.length < 2) {
                    // The string contains a "#" but is followed by nothing
                    return "";
                }
                return locationSplit[1];
            }
            return getWindowOrThrow().location.hash;
        },
        get pathname() {
            if (isRunningInElectron()) {
                var locationHash = getWindowOrThrow().location.hash;
                if (locationHash === "") {
                    return "";
                }
                if (locationHash.startsWith("#")) {
                    // Remove the starting pound symbol
                    locationHash = locationHash.substring(1);
                }
                if (locationHash.includes("?")) {
                    // Remove query
                    locationHash = locationHash.split("?")[0];
                }
                if (locationHash.includes("#")) {
                    // Remove location hash
                    locationHash = locationHash.split("#")[0];
                }
                return locationHash;
            }
            return getWindowOrThrow().location.pathname;
        },
        assign: function(url) {
            getWindowOrThrow().location.assign(url);
        },
        get origin() {
            if (isRunningInElectron()) {
                return "http://localhost:3000";
            }
            return getWindowOrThrow().location.origin;
        },
        get hostname() {
            if (isRunningInElectron()) {
                return "localhost";
            }
            return getWindowOrThrow().location.hostname;
        }
    },
    get document() {
        return getWindowOrThrow().document;
    },
    get sessionStorage() {
        return getWindowOrThrow().sessionStorage;
    },
    get localStorage() {
        return getWindowOrThrow().localStorage;
    }
};
function isRunningInElectron() {
    var _window = getWindowOrThrow();
    var userAgent = _window.navigator.userAgent.toLowerCase();
    return userAgent.indexOf(" electron/") > -1;
}
exports.isRunningInElectron = isRunningInElectron;
