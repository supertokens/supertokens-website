/* Copyright (c) 2024, VRAI Labs and/or its affiliates. All rights reserved.
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

import { DateProvider } from "./defaultImplementation";
import { DateProviderInterface, DateProviderInput } from "./types";

/**
 * A utility class for managing a reference to a DateProviderInterface, allowing customization of time-related operations.
 * This class is designed to address clock skew issues between the server and client by providing a consistent mechanism
 * for obtaining current time adjusted for clock skew.
 *
 * @class DateProviderReference
 */
export default class DateProviderReference {
    private static instance?: DateProviderReference;

    dateProvider: DateProviderInterface;

    constructor(dateProviderInput?: DateProviderInput) {
        if (dateProviderInput !== undefined) {
            this.dateProvider = dateProviderInput();
        } else {
            // Initialize the DateProvider implementation by calling the init method.
            // This is done to ensure that the WindowHandler is initialized before we instantiate the DateProvider.
            DateProvider.init();
            this.dateProvider = DateProvider.getReferenceOrThrow();
        }
    }

    static init(dateProviderInput?: DateProviderInput): void {
        if (DateProviderReference.instance !== undefined) {
            return;
        }

        DateProviderReference.instance = new DateProviderReference(dateProviderInput);
    }

    static getReferenceOrThrow(): DateProviderReference {
        if (DateProviderReference.instance === undefined) {
            throw new Error("SuperTokensDateProvider must be initialized before calling this method.");
        }

        return DateProviderReference.instance;
    }
}

export { DateProviderReference };
