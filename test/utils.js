/* Copyright (c) 2020, VRAI Labs and/or its affiliates. All rights reserved.
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
let axios = require("axios");

module.exports.delay = function(sec) {
    return new Promise(res => setTimeout(res, sec * 1000));
};

module.exports.checkIfIdRefreshIsCleared = function() {
    const ID_COOKIE_NAME = "sIdRefreshToken";
    let value = "; " + document.cookie;
    let parts = value.split("; " + ID_COOKIE_NAME + "=");
    if (parts.length === 2) {
        let last = parts.pop();
        if (last !== undefined) {
            let properties = last.split(";");
            for (let i = 0; i < properties.length; i++) {
                let current = properties[i].replace("'", "");
                if (current.indexOf("Expires=") != -1) {
                    let expiryDateString = current.split("Expires=")[1];
                    let expiryDate = new Date(expiryDateString);
                    let currentDate = new Date();
                    return expiryDate < currentDate;
                }
            }
        }
    }
};

module.exports.getNumberOfTimesRefreshCalled = async function() {
    let instance = axios.create();
    let response = await instance.get("http://localhost:8080/refreshCalledTime");
    return response.data;
};

module.exports.startST = async function(accessTokenValidity = 1, enableAntiCsrf = true) {
    let instance = axios.create();
    let response = await instance.post("http://localhost:8080/startST", {
        accessTokenValidity,
        enableAntiCsrf
    });
    return response.data;
};
