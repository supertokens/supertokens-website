"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultDateProviderImplementation = exports.DateProvider = void 0;
var windowHandler_1 = require("../windowHandler");
// `clockSkewInMillis` will be initialized with the stored localStorage value in `DateProviderReference.init()`.
var DateProvider = /** @class */ (function () {
    function DateProvider() {
        this.clockSkewInMillis = 0;
    }
    DateProvider.prototype.setClientClockSkewInMillis = function (clockSkewInMillis) {
        this.clockSkewInMillis = clockSkewInMillis;
        var localStorage = windowHandler_1.default.getReferenceOrThrow().windowHandler.localStorage;
        localStorage.setItemSync(DateProvider.CLOCK_SKEW_KEY, String(clockSkewInMillis));
    };
    DateProvider.prototype.getClientClockSkewInMillis = function () {
        return this.clockSkewInMillis;
    };
    DateProvider.prototype.now = function () {
        return Date.now() + this.getClientClockSkewInMillis();
    };
    DateProvider.CLOCK_SKEW_KEY = "__st_clockSkewInMillis";
    return DateProvider;
})();
exports.DateProvider = DateProvider;
exports.defaultDateProviderImplementation = new DateProvider();
