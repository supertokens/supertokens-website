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

    // We took the following considerations into account while designing the cache implementation:
    // 1. Cache cleared with an active session while the FE clock is wrong (e.g., Safari clears localStorage after 7 days).
    // 2. Outdated information in the cache that will make this clock point into the future.
    // 3. Other tabs (on different subdomains) refreshing the session while we have outdated info in the cache.
    // 4. Other tabs refreshing the session while we have outdated info in memory.
    static init() {
        if (DateProvider.instance !== undefined) {
            return;
        }

        DateProvider.instance = new DateProvider();
        const localStorage = WindowHandlerReference.getReferenceOrThrow().windowHandler.localStorage;
        const stored = localStorage.getItemSync(DateProvider.CLOCK_SKEW_KEY);
        const clockSkewInMillis = stored !== null ? parseInt(stored, 10) : 0;
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
