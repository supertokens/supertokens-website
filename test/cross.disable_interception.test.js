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
let puppeteer = require("puppeteer");
let decodeJWT = require("jsonwebtoken").decode;
let verifyJWT = require("jsonwebtoken").verify;
let jwksClient = require("jwks-rsa");
let assert = require("assert");
let {
    delay,
    getNumberOfTimesRefreshCalled,
    startST,
    startSTWithJWTEnabled,
    getNumberOfTimesGetSessionCalled,
    BASE_URL,
    BASE_URL_FOR_ST,
    coreTagEqualToOrAfter,
    checkIfJWTIsEnabled,
    checkIfV3AccessTokenIsSupported
} = require("./utils");
const { spawn } = require("child_process");
const { addGenericTestCases: addTestCases } = require("./interception.testgen");

/* setupFunc is called through page.evaluate at the start of each test
    It should set window.toTest to a function that receives a config object with:
        url
        method
        headers (as object)
        body
    and should return a response object with:
        url
        statusCode
        headers (as Headers)
        responseText (text)
*/

addTestCases((name, transferMethod, setupFunc, setupArgs = []) => {
    describe(`${name}: interception disabling`, function () {
        let browser;
        let page;
        let v3AccessTokenSupported;

        function setup(config = {}) {
            // page.on("console", c => console.log(c.text()));
            return page.evaluate(
                setupFunc,
                {
                    // enableDebugLogs: true,
                    ...config
                },
                ...setupArgs
            );
        }

        before(async function () {
            spawn(
                "./test/startServer",
                [process.env.INSTALL_PATH, process.env.NODE_PORT === undefined ? 8080 : process.env.NODE_PORT],
                {
                    // stdio: "inherit",
                    // env: {
                    //     ...process.env,
                    //     DEBUG: "com.supertokens",
                    // }
                }
            );
            await new Promise(r => setTimeout(r, 1000));
            v3AccessTokenSupported = await checkIfV3AccessTokenIsSupported();
        });

        after(async function () {
            let instance = axios.create();
            await instance.post(BASE_URL_FOR_ST + "/after");
            try {
                await instance.get(BASE_URL_FOR_ST + "/stop");
            } catch (err) {}
        });

        beforeEach(async function () {
            let instance = axios.create();
            await instance.post(BASE_URL_FOR_ST + "/beforeeach");
            await instance.post("http://localhost.org:8082/beforeeach"); // for cross domain
            await instance.post(BASE_URL + "/beforeeach");

            let launchRetries = 0;
            while (browser === undefined && launchRetries++ < 3) {
                try {
                    browser = await puppeteer.launch({
                        args: ["--no-sandbox", "--disable-setuid-sandbox"],
                        headless: true
                    });

                    page = await browser.newPage();

                    await page.goto(BASE_URL + "/index.html", { waitUntil: "load" });
                    await page.addScriptTag({ path: `./bundle/bundle.js`, type: "text/javascript" });
                    await page.evaluate(BASE_URL => (window.BASE_URL = BASE_URL), BASE_URL);
                    await page.waitForFunction(() => window.supertokens !== undefined);
                    await new Promise(r => setTimeout(r, 100));
                } catch {}
            }
        });

        afterEach(async function () {
            if (browser) {
                await browser.close();
                browser = undefined;
            }
        });

        it("test interception should happen if api domain and website domain are the same and relative path is used", async function () {
            await startST(5);
            await setup();

            await page.evaluate(async () => {
                let BASE_URL = "http://localhost.org:8080";
                supertokens.init({
                    apiDomain: BASE_URL
                });
                let userId = "testing-supertokens-website";

                // send api request to login
                let loginResponse = await toTest({
                    url: `/login`,
                    method: "post",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ userId })
                });

                assert.strictEqual(loginResponse.responseText, userId);

                assert.strictEqual(await supertokens.doesSessionExist(), true);
            });
        });

        it("test interception should not happen if api domain and website domain are different and relative path is used", async function () {
            await startST(5);
            await setup();

            await page.evaluate(async () => {
                let BASE_URL = "https://google.com";
                supertokens.init({
                    apiDomain: BASE_URL
                });
                let userId = "testing-supertokens-website";

                // send api request to login
                let loginResponse = await toTest({
                    url: `/login`,
                    method: "post",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ userId })
                });

                assert.strictEqual(loginResponse.responseText, userId);

                assert.strictEqual(await supertokens.doesSessionExist(), false);
            });
        });

        it("should not intercept if url contains superTokensDoNotDoInterception", async function () {
            await startST(5);
            await setup();

            await page.evaluate(async () => {
                let userId = "testing-supertokens-website";

                // send api request to login
                let loginResponse = await toTest({
                    url: `/login#superTokensDoNotDoInterception`,
                    method: "post",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ userId })
                });

                assert.strictEqual(loginResponse.responseText, userId);

                assert.strictEqual(await supertokens.doesSessionExist(), false);
            });
        });

        it("test disabled interception", async function () {
            await startST();

            await setup();
            await page.evaluate(async () => {
                supertokens.init({
                    apiDomain: BASE_URL,
                    postAPIHook: async context => {
                        assert.strictEqual(context.action === "REFRESH_SESSION" || context.action === "SIGN_OUT", true);

                        if (context.action === "REFRESH_SESSION" && context.fetchResponse.statusCode === 200) {
                            const body = await context.fetchResponse.text();
                            assert.strictEqual(body, "refresh success");

                            const frontTokenInHeader = context.fetchResponse.headers.get("front-token");
                            assertNotEqual(frontTokenInHeader, "");
                            assertNotEqual(frontTokenInHeader, null);
                        }

                        if (context.action === "SIGN_OUT" && context.fetchResponse.statusCode === 200) {
                            const body = await context.fetchResponse.json();
                            assert.strictEqual(body.statusCode, "OK");

                            const frontTokenInHeader = context.fetchResponse.headers.get("front-token");
                            assert.strictEqual(frontTokenInHeader, "remove");
                        }
                    }
                });
                let userId = "testing-supertokens-website";

                let loginResponse = await toTest({
                    url: `${BASE_URL}/login`,
                    method: "post",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ userId })
                });

                assert.strictEqual(loginResponse.responseText, userId);
                assert.strictEqual(await getNumberOfTimesRefreshCalled(), 0);

                await delay(2);
                let attemptRefresh = await supertokens.attemptRefreshingSession();
                assert.strictEqual(attemptRefresh, true);

                assert.strictEqual(await getNumberOfTimesRefreshCalled(), 1);
                await supertokens.signOut();
                assert.strictEqual(await getNumberOfTimesRefreshCalled(), 1);
                assert.strictEqual(await supertokens.doesSessionExist(), false);
            });
        });

        it("test that interception doesn't happen if the shouldDoInterceptionBasedOnUrl override returns false", async function () {
            await setup({
                override: ["shouldDoInterceptionBasedOnUrl"]
            });

            await page.evaluate(async () => {
                let getResponse = await toTest({ url: `${BASE_URL}/check-rid-no-session` });
                assert.strictEqual(getResponse.responseText, "fail");

                let getWithOverrideResponse = await toTest({ url: `${BASE_URL}/check-rid-no-session?doOverride` });
                assert.strictEqual(getWithOverrideResponse.responseText, "success");
            });
        });
    });
});
