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

import WindowHandlerReference from "../windowHandler";

// To avoid potential issues with initializing clockSkewInMillis as a class variable in the constructor due to WindowHandlerReference not being initialized at DateProvider instance creation,
// we read from localStorage each time `getClientClockSkewInMillis` is called.
class DateProvider {
    private static readonly CLOCK_SKEW_KEY = "__st_clockSkewInMillis";

    setClientClockSkewInMillis(clockSkewInMillis: number): void {
        const localStorage = WindowHandlerReference.getReferenceOrThrow().windowHandler.localStorage;
        localStorage.setItemSync(DateProvider.CLOCK_SKEW_KEY, String(clockSkewInMillis));
    }

    getClientClockSkewInMillis(): number {
        const localStorage = WindowHandlerReference.getReferenceOrThrow().windowHandler.localStorage;
        return parseInt(localStorage.getItemSync(DateProvider.CLOCK_SKEW_KEY) || "0", 10);
    }

    now(): number {
        return Date.now() + this.getClientClockSkewInMillis();
    }
}

export const defaultDateProviderImplementation = new DateProvider();
