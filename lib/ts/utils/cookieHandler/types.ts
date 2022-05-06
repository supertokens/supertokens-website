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

/**
 * When using this library with frameworks where cookie management
 * requires async handling (react-native for example) we use `getCookie`
 * and `setCookie` which are async.
 *
 * When used in cases where we need to use cookies in a synchronous way
 * (supertokens-auth-react reads cookies when rendering the UI) we use the
 * sync functions instead.
 */
export type CookieHandlerInterface = {
    setCookie: (cookieString: string) => Promise<void>;
    getCookie: () => Promise<string>;

    /**
     * Sync versions of the functions
     */
    setCookieSync: (cookieString: string) => void;
    getCookieSync: () => string;
};

export type CookieHandlerInput = (original: CookieHandlerInterface) => CookieHandlerInterface;
