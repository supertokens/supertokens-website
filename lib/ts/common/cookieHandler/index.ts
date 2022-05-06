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
import { defaultCookieHandlerImplementation } from "./defaultImplementation";
import { CookieHandlerInterface, CookieHandlerInput } from "./types";

export default class CookieHandlerInterfaceReference {
    private static instance?: CookieHandlerInterfaceReference;

    cookieHandler: CookieHandlerInterface;

    constructor(cookieHandlerInput?: CookieHandlerInput) {
        let cookieHandlerFunc: CookieHandlerInput = original => original;
        if (cookieHandlerInput !== undefined) {
            cookieHandlerFunc = cookieHandlerInput;
        }

        this.cookieHandler = cookieHandlerFunc(defaultCookieHandlerImplementation);
    }

    static init(cookieHandlerInput?: CookieHandlerInput): void {
        if (CookieHandlerInterfaceReference.instance !== undefined) {
            return;
        }

        CookieHandlerInterfaceReference.instance = new CookieHandlerInterfaceReference(cookieHandlerInput);
    }

    static getReferenceOrThrow(): CookieHandlerInterfaceReference {
        if (CookieHandlerInterfaceReference.instance === undefined) {
            throw new Error("SuperTokensCookieHandler must be initialized before calling this method.");
        }

        return CookieHandlerInterfaceReference.instance;
    }
}

export { CookieHandlerInterfaceReference };
