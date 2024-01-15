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

export class DateProvider {
    private static instance?: DateProvider;
    public static readonly CLOCK_SKEW_KEY = "__st_clockSkewInMillis";
    private clockSkewInMillis: number = 0;

    // The static init method is used to create a singleton instance of DateProvider,
    // as we require access to localStorage for initializing clockSkewInMillis.
    // Access to localStorage is available only after WindowHandlerReference is initialized.
    static init() {
        if (DateProvider.instance !== undefined) {
            return;
        }

        DateProvider.instance = new DateProvider();
        const localStorage = WindowHandlerReference.getReferenceOrThrow().windowHandler.localStorage;
        const clockSkewInMillis = parseInt(localStorage.getItemSync(DateProvider.CLOCK_SKEW_KEY) || "0", 10);
        DateProvider.instance.setClientClockSkewInMillis(clockSkewInMillis);
    }

    static getReferenceOrThrow(): DateProvider {
        if (DateProvider.instance === undefined) {
            throw new Error("DateProvider must be initialized before calling this method.");
        }

        return DateProvider.instance;
    }

    setClientClockSkewInMillis(clockSkewInMillis: number): void {
        this.clockSkewInMillis = clockSkewInMillis;
        const localStorage = WindowHandlerReference.getReferenceOrThrow().windowHandler.localStorage;
        localStorage.setItemSync(DateProvider.CLOCK_SKEW_KEY, String(clockSkewInMillis));
    }

    getClientClockSkewInMillis(): number {
        return this.clockSkewInMillis;
    }

    now(): number {
        return Date.now() + this.getClientClockSkewInMillis();
    }
}
