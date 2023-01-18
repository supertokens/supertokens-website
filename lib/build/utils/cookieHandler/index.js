"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CookieHandlerReference = void 0;
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
var defaultImplementation_1 = require("./defaultImplementation");
var CookieHandlerReference = /** @class */ (function () {
    function CookieHandlerReference(cookieHandlerInput) {
        var cookieHandlerFunc = function (original) {
            return original;
        };
        if (cookieHandlerInput !== undefined) {
            cookieHandlerFunc = cookieHandlerInput;
        }
        this.cookieHandler = cookieHandlerFunc(defaultImplementation_1.defaultCookieHandlerImplementation);
    }
    CookieHandlerReference.init = function (cookieHandlerInput) {
        if (CookieHandlerReference.instance !== undefined) {
            return;
        }
        CookieHandlerReference.instance = new CookieHandlerReference(cookieHandlerInput);
    };
    CookieHandlerReference.getReferenceOrThrow = function () {
        if (CookieHandlerReference.instance === undefined) {
            throw new Error("SuperTokensCookieHandler must be initialized before calling this method.");
        }
        return CookieHandlerReference.instance;
    };
    return CookieHandlerReference;
})();
exports.CookieHandlerReference = CookieHandlerReference;
exports.default = CookieHandlerReference;
