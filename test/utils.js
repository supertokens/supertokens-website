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
const { default: AuthHttpRequestFetch } = require("../lib/build/fetch");

module.exports.BASE_URL = "http://localhost.org:8080";
module.exports.BASE_URL_FOR_ST =
    process.env.NODE_PORT === undefined ? "http://localhost.org:8080" : "http://localhost.org:" + process.env.NODE_PORT;

module.exports.delay = function (sec) {
    return new Promise(res => setTimeout(res, sec * 1000));
};

module.exports.checkIfIdRefreshIsCleared = function () {
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

module.exports.getNumberOfTimesRefreshCalled = async function (BASE = module.exports.BASE_URL) {
    let instance = axios.create();
    let response = await instance.get(BASE + "/refreshCalledTime");
    return response.data;
};

module.exports.getNumberOfTimesRefreshAttempted = async function (BASE = module.exports.BASE_URL) {
    let instance = axios.create();
    let response = await instance.get(BASE + "/refreshAttemptedTime");
    return response.data;
};

module.exports.startST = async function (
    accessTokenValidity = 3,
    enableAntiCsrf = true,
    accessTokenSigningKeyUpdateInterval = undefined,
    enableJWT = undefined
) {
    {
        if (module.exports.BASE_URL !== module.exports.BASE_URL_FOR_ST) {
            let instance = axios.create();
            await instance.post(module.exports.BASE_URL + "/setAntiCsrf", {
                enableAntiCsrf
            });

            await instance.post(module.exports.BASE_URL + "/setEnableJWT", {
                enableJWT
            });
        }
    }
    {
        let instance = axios.create();
        let response = await instance.post(module.exports.BASE_URL_FOR_ST + "/startST", {
            accessTokenValidity,
            enableAntiCsrf,
            accessTokenSigningKeyUpdateInterval,
            enableJWT
        });
        return response.data;
    }
};

module.exports.startSTWithJWTEnabled = async function (accessTokenValidity = 1) {
    return await module.exports.startST(accessTokenValidity, true, undefined, true);
};

module.exports.addBrowserConsole = function (page) {
    page.on("console", message => console.log(`${message.type().substr(0, 3).toUpperCase()} ${message.text()}`))
        .on("pageerror", ({ message }) => console.log(message))
        .on("response", response => console.log(`${response.status()} ${response.url()}`))
        .on("requestfailed", request => console.log(`${request.failure().errorText} ${request.url()}`));
};

module.exports.coreTagEqualToOrAfter = function (targetTag) {
    const currTag = process.env.SUPERTOKENS_CORE_TAG;
    if (
        currTag === undefined ||
        currTag === targetTag ||
        (!currTag.startsWith("dev-v") && !targetTag.startsWith("v"))
    ) {
        return true;
    }

    const lparts = currTag.replace(/^(dev-)?v/, "").split(".");
    while (lparts.length < 3) lparts.push("0");
    const rparts = targetTag.split(".");
    while (rparts.length < 3) rparts.push("0");

    for (let i = 0; i < 3; i++) {
        const l = parseInt(lparts[i], 10);
        const r = parseInt(rparts[i], 10);
        if (l !== r) {
            return l > r;
        }
    }
    return true;
};

module.exports.getFeatureFlags = async function () {
    try {
        let instance = axios.create();
        return await (
            await instance.get(module.exports.BASE_URL + "/featureFlags")
        ).data;
    } catch (e) {
        return undefined;
    }
};

module.exports.checkIfJWTIsEnabled = async function () {
    let featureFlags = await module.exports.getFeatureFlags();

    return featureFlags !== undefined && featureFlags !== null && featureFlags.sessionJwt === true;
};

module.exports.checkIfDuplicateCookieHandlingIsEnabled = async function () {
    let featureFlags = await module.exports.getFeatureFlags();

    return featureFlags !== undefined && featureFlags !== null && featureFlags.duplicateCookieHandling === true;
};

module.exports.checkIfV3AccessTokenIsSupported = async function () {
    let featureFlags = await module.exports.getFeatureFlags();

    return featureFlags !== undefined && featureFlags !== null && featureFlags.v3AccessToken === true;
};

module.exports.checkSessionClaimsSupport = async function () {
    let featureFlags = await module.exports.getFeatureFlags();

    return featureFlags !== undefined && featureFlags !== null && featureFlags.sessionClaims === true;
};

module.exports.resetSessionClaimValidatorStore = function () {
    require("../lib/build/utils/sessionClaimValidatorStore").SessionClaimValidatorStore.claimValidatorsAddedByOtherRecipes =
        [];
};

module.exports.resetAuthHttpRequestFetch = function () {
    AuthHttpRequestFetch.initCalled = false;
    if (AuthHttpRequestFetch.env !== undefined && AuthHttpRequestFetch.env.__supertokensOriginalFetch !== undefined) {
        AuthHttpRequestFetch.env.fetch = AuthHttpRequestFetch.env.__supertokensOriginalFetch;
        AuthHttpRequestFetch.env.__supertokensSessionRecipe = undefined;
        AuthHttpRequestFetch.env.__supertokensOriginalFetch = undefined;
    }
};
