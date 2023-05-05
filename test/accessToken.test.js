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

const axios = require("axios");
const { spawn } = require("child_process");
const { BASE_URL_FOR_ST, BASE_URL, startST, checkIfV3AccessTokenIsSupported } = require("./utils");
const puppeteer = require("puppeteer");
const { assert } = require("console");

describe("access token update", function () {
    let browser;
    let v3AccessTokenSupported;
    before(async function () {
        spawn("./test/startServer", [
            process.env.INSTALL_PATH,
            process.env.NODE_PORT === undefined ? 8080 : process.env.NODE_PORT
        ]);
        await new Promise(r => setTimeout(r, 1000));
        v3AccessTokenSupported = await checkIfV3AccessTokenIsSupported();
    });

    after(async function () {
        const instance = axios.create();
        await instance.post(BASE_URL_FOR_ST + "/after");
        try {
            await instance.get(BASE_URL_FOR_ST + "/stop");
        } catch (err) {}
    });

    beforeEach(async function () {
        const instance = axios.create();
        await instance.post(BASE_URL_FOR_ST + "/beforeeach");
        await instance.post("http://localhost.org:8082/beforeeach"); // for cross domain
        await instance.post(BASE_URL + "/beforeeach");

        browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });
    });

    afterEach(async function () {
        try {
            if (browser) {
                await browser.close();
            }
        } catch {}
    });

    it("should return the appropriate access token payload", async function () {
        await startST();
        const page = await browser.newPage();

        await page.goto(BASE_URL + "/index.html", { waitUntil: "load" });
        await page.addScriptTag({ path: `./bundle/bundle.js`, type: "text/javascript" });

        await page.evaluate(async v3AccessTokenSupported => {
            let BASE_URL = "http://localhost.org:8080";
            supertokens.init({
                tokenTransferMethod: "header",
                apiDomain: BASE_URL
            });

            let userId = "testing-supertokens-website";

            // Create a session
            let loginResponse = await fetch(`${BASE_URL}/login`, {
                method: "post",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ userId })
            });

            assert.strictEqual(await loginResponse.text(), userId);

            const payload = await supertokens.getAccessTokenPayloadSecurely();

            assert.notStrictEqual(payload, undefined);
            if (v3AccessTokenSupported) {
                assert.notStrictEqual(payload, undefined);
                const expectedKeys = [
                    "sub",
                    "exp",
                    "iat",
                    "sessionHandle",
                    "refreshTokenHash1",
                    "parentRefreshTokenHash1",
                    "antiCsrfToken",
                    "iss"
                ];
                assert.strictEqual(Object.keys(payload).length, expectedKeys.length);
                for (const key of Object.keys(payload)) {
                    assert(expectedKeys.includes(key));
                }
            } else {
                assert.deepStrictEqual(payload, {});
            }
        }, v3AccessTokenSupported);
    });

    it("should be able to refresh a session started w/ CDI 2.18", async function () {
        await startST();
        const page = await browser.newPage();

        await page.goto(BASE_URL + "/index.html", { waitUntil: "load" });
        await page.addScriptTag({ path: `./bundle/bundle.js`, type: "text/javascript" });

        if (v3AccessTokenSupported) {
            return;
        }

        await page.evaluate(async v3AccessTokenSupported => {
            let BASE_URL = "http://localhost.org:8080";
            supertokens.init({
                tokenTransferMethod: "header",
                apiDomain: BASE_URL
            });

            let userId = "testing-supertokens-website";

            // Create a session
            await fetch(`${BASE_URL}/login-2.18`, {
                method: "post",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ userId, payload: { asdf: 1 } })
            });

            assert.notStrictEqual(await supertokens.getAccessToken(), undefined);

            const payload218 = await supertokens.getAccessTokenPayloadSecurely();

            assert.deepStrictEqual(payload218, { asdf: 1 });

            await supertokens.attemptRefreshingSession();

            if (v3AccessTokenSupported) {
                const v3Payload = await supertokens.getAccessTokenPayloadSecurely();

                assert.notStrictEqual(v3Payload, undefined);
                // The `iss` is not added in migrated sessions
                const expectedKeys = [
                    "sub",
                    "exp",
                    "iat",
                    "sessionHandle",
                    "refreshTokenHash1",
                    "parentRefreshTokenHash1",
                    "antiCsrfToken",
                    "asdf"
                ];
                assert.strictEqual(Object.keys(v3Payload).length, expectedKeys.length);
                for (const key of Object.keys(v3Payload)) {
                    assert(expectedKeys.includes(key));
                }
                assert.strictEqual(v3Payload.asdf, 1);
            } else {
                const v2Payload = await supertokens.getAccessTokenPayloadSecurely();

                assert.deepStrictEqual(v2Payload, { asdf: 1 });
            }
        }, v3AccessTokenSupported);
    });
});
