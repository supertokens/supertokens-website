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
function getWindowOrThrow(): Window {
    if (typeof window === "undefined") {
        throw Error(
            "If you are using this package with server-side rendering, please make sure that you are checking if the window object is defined."
        );
    }

    return window;
}

export const WindowUtilities = {
    get fetch() {
        return window.fetch;
    },
    history: {
        replaceState: (data: any, unused: string, url?: string | null): void => {
            getWindowOrThrow().history.replaceState(data, unused, url);
        },
        get state(): any {
            return getWindowOrThrow().history.state;
        }
    },
    location: {
        get href(): string {
            return getWindowOrThrow().location.href;
        },

        set href(newHref: string) {
            getWindowOrThrow().location.href = newHref;
        },
        get search(): string {
            return getWindowOrThrow().location.search;
        },
        get hash(): string {
            return getWindowOrThrow().location.hash;
        },
        get pathname(): string {
            return getWindowOrThrow().location.pathname;
        },
        assign: (url: string) => {
            getWindowOrThrow().location.assign(url);
        },
        get origin(): string {
            if (isRunningInElectron()) {
                return "http://localhost:3000";
            }

            return getWindowOrThrow().location.origin;
        },
        get hostname(): string {
            if (isRunningInElectron()) {
                return "localhost";
            }

            return getWindowOrThrow().location.hostname;
        }
    },
    get document(): Document {
        return getWindowOrThrow().document;
    },
    get sessionStorage(): Storage {
        return getWindowOrThrow().sessionStorage;
    },
    get localStorage(): Storage {
        return getWindowOrThrow().localStorage;
    }
};

export function isRunningInElectron() {
    const _window = getWindowOrThrow();
    const userAgent = _window.navigator.userAgent.toLowerCase();

    return userAgent.indexOf(" electron/") > -1;
}
