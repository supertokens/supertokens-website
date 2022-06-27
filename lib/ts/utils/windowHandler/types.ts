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
 * Refer to this issue to know why this is required: https://github.com/supertokens/supertokens-website/issues/134
 */
export type StorageHandler = {
    key: (index: number) => Promise<string | null>;
    getItem: (key: string) => Promise<string | null>;
    clear: () => Promise<void>;
    removeItem: (key: string) => Promise<void>;
    setItem: (key: string, value: string) => Promise<void>;
    /**
     * Sync versions of the storage functions
     */
    keySync: (index: number) => string | null;
    getItemSync: (key: string) => string | null;
    clearSync: () => void;
    removeItemSync: (key: string) => void;
    setItemSync: (key: string, value: string) => void;
};

export type WindowHandlerInterface = {
    history: {
        replaceState: (data: any, unused: string, url?: string | null) => void;
        getState: () => any;
    };
    location: {
        getHref: () => string;
        setHref: (href: string) => void;
        getSearch: () => string;
        getHash: () => string;
        getPathName: () => string;
        assign: (url: string | URL) => void;
        getOrigin: () => string;
        getHostName: () => string;
    };
    getDocument: () => Document;
    localStorage: StorageHandler;
    sessionStorage: StorageHandler;
};

export type WindowHandlerInput = (original: WindowHandlerInterface) => WindowHandlerInterface;
