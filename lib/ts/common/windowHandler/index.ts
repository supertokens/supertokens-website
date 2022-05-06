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
import { defaultWindowHandlerImplementation } from "./defaultImplementation";
import { WindowHandlerInterface, WindowHandlerInput } from "./types";

export default class WindowHandlerInterfaceReference {
    private static instance?: WindowHandlerInterfaceReference;

    windowHandler: WindowHandlerInterface;

    constructor(windowHandlerInput?: WindowHandlerInput) {
        let windowHandlerFunc: WindowHandlerInput = original => original;
        if (windowHandlerInput !== undefined) {
            windowHandlerFunc = windowHandlerInput;
        }

        this.windowHandler = windowHandlerFunc(defaultWindowHandlerImplementation);
    }

    static init(windowHandlerInput?: WindowHandlerInput): void {
        if (WindowHandlerInterfaceReference.instance !== undefined) {
            return;
        }

        WindowHandlerInterfaceReference.instance = new WindowHandlerInterfaceReference(windowHandlerInput);
    }

    static getReferenceOrThrow(): WindowHandlerInterfaceReference {
        if (WindowHandlerInterfaceReference.instance === undefined) {
            throw new Error("SuperTokensWindowHandler must be initialized before calling this method.");
        }

        return WindowHandlerInterfaceReference.instance;
    }
}

export { WindowHandlerInterfaceReference };
