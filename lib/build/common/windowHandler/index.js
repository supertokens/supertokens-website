"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
var WindowHandlerInterfaceReference = /** @class */ (function() {
    function WindowHandlerInterfaceReference(windowHandlerInput) {
        var windowHandlerFunc = function(original) {
            return original;
        };
        if (windowHandlerInput !== undefined) {
            windowHandlerFunc = windowHandlerInput;
        }
        this.windowHandler = windowHandlerFunc(defaultImplementation_1.defaultWindowHandlerImplementation);
    }
    WindowHandlerInterfaceReference.init = function(windowHandlerInput) {
        if (WindowHandlerInterfaceReference.instance !== undefined) {
            return;
        }
        WindowHandlerInterfaceReference.instance = new WindowHandlerInterfaceReference(windowHandlerInput);
    };
    WindowHandlerInterfaceReference.getReferenceOrThrow = function() {
        if (WindowHandlerInterfaceReference.instance === undefined) {
            throw new Error("SuperTokensWindowHandler must be initialized before calling this method.");
        }
        return WindowHandlerInterfaceReference.instance;
    };
    return WindowHandlerInterfaceReference;
})();
exports.WindowHandlerInterfaceReference = WindowHandlerInterfaceReference;
exports.default = WindowHandlerInterfaceReference;
