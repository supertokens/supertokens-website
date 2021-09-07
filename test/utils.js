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

module.exports.BASE_URL = "http://localhost.org:8080";
module.exports.BASE_URL_FOR_ST =
    process.env.NODE_PORT === undefined ? "http://localhost.org:8080" : "http://localhost.org:" + process.env.NODE_PORT;

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

module.exports.getNumberOfTimesRefreshCalled = async function(BASE = module.exports.BASE_URL) {
    let instance = axios.create();
    let response = await instance.get(BASE + "/refreshCalledTime");
    return response.data;
};

module.exports.getNumberOfTimesRefreshAttempted = async function(BASE = module.exports.BASE_URL) {
    let instance = axios.create();
    let response = await instance.get(BASE + "/refreshAttemptedTime");
    return response.data;
};

module.exports.startST = async function(
    accessTokenValidity = 1,
    enableAntiCsrf = true,
    accessTokenSigningKeyUpdateInterval = undefined
) {
    {
        if (module.exports.BASE_URL !== module.exports.BASE_URL_FOR_ST) {
            let instance = axios.create();
            await instance.post(module.exports.BASE_URL + "/setAntiCsrf", {
                enableAntiCsrf
            });
        }
    }
    {
        let instance = axios.create();
        let response = await instance.post(module.exports.BASE_URL_FOR_ST + "/startST", {
            accessTokenValidity,
            enableAntiCsrf,
            accessTokenSigningKeyUpdateInterval
        });
        return response.data;
    }
};

module.exports.addBrowserConsole = function(page) {
    page.on("console", message =>
        console.log(
            `${message
                .type()
                .substr(0, 3)
                .toUpperCase()} ${message.text()}`
        )
    )
        .on("pageerror", ({ message }) => console.log(message))
        .on("response", response => console.log(`${response.status()} ${response.url()}`))
        .on("requestfailed", request => console.log(`${request.failure().errorText} ${request.url()}`));
};
