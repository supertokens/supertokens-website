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
    describe(`${name}: error response handling`, function () {
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

        it("test that if an api throws an error it gets propagated to the user with interception", async () => {
            await startST();
            await setup();
            await page.evaluate(async () => {
                let BASE_URL = "http://localhost.org:8080";
                supertokens.init({
                    apiDomain: BASE_URL
                });

                let val = await toTest({ url: `${BASE_URL}/testError` });
                assert.strictEqual(val.responseText, "test error message");
                assert.strictEqual(val.statusCode, 500);
            });
        });

        it("test that if an api throws a 400 error it gets propagated to the user with interception", async () => {
            await startST();
            await setup();
            await page.evaluate(async () => {
                let BASE_URL = "http://localhost.org:8080";
                supertokens.init({
                    apiDomain: BASE_URL
                });

                let val = await toTest({ url: `${BASE_URL}/testError?code=400` });
                assert.strictEqual(val.responseText, "test error message");
                assert.strictEqual(val.statusCode, 400);
            });
        });

        it("test that if an api throws a 405 error it gets propagated to the user with interception", async () => {
            await startST();
            await setup();
            await page.evaluate(async () => {
                let BASE_URL = "http://localhost.org:8080";
                supertokens.init({
                    apiDomain: BASE_URL
                });

                let val = await toTest({ url: `${BASE_URL}/testError?code=405` });
                assert.strictEqual(val.responseText, "test error message");
                assert.strictEqual(val.statusCode, 405);
            });
        });

        it("test that if an api throws an error it gets propagated to the user without interception", async () => {
            await startST();
            await setup();

            await page.evaluate(async () => {
                let BASE_URL = "http://localhost.org:8080";
                supertokens.init({
                    apiDomain: BASE_URL
                });

                let val = await toTest({ url: `${BASE_URL}/testError#superTokensDoNotDoInterception`, method: "get" });

                assert.strictEqual(val.responseText, "test error message");
                assert.strictEqual(val.statusCode, 500);
            });
        });

        it("test that if an api throws a 400 error it gets propagated to the user without interception", async () => {
            await startST();
            await setup();

            await page.evaluate(async () => {
                let BASE_URL = "http://localhost.org:8080";
                supertokens.init({
                    apiDomain: BASE_URL
                });

                let val = await toTest({
                    url: `${BASE_URL}/testError?code=400#superTokensDoNotDoInterception`,
                    method: "get"
                });

                assert.strictEqual(val.responseText, "test error message");
                assert.strictEqual(val.statusCode, 400);
            });
        });

        it("test that if an api throws a 405 error it gets propagated to the user without interception", async () => {
            await startST();
            await setup();

            await page.evaluate(async () => {
                let BASE_URL = "http://localhost.org:8080";
                supertokens.init({
                    apiDomain: BASE_URL
                });

                let val = await toTest({ url: `${BASE_URL}/testError?code=405`, method: "get" });

                assert.strictEqual(val.responseText, "test error message");
                assert.strictEqual(val.statusCode, 405);
            });
        });

        it("test that network errors are propagated to the user with interception", async () => {
            await startST();
            await setup();

            await page.setRequestInterception(true);
            page.on("request", req => {
                const url = req.url();
                if (url === BASE_URL + "/testError") {
                    req.abort();
                } else {
                    req.continue();
                }
            });

            await page.evaluate(async () => {
                let BASE_URL = "http://localhost.org:8080";
                supertokens.init({
                    apiDomain: BASE_URL
                });

                let caught;
                try {
                    await toTest({ url: `${BASE_URL}/testError`, method: "get" });
                } catch (ex) {
                    caught = ex;
                }

                assert.ok(caught);
            });
        });

        it("test that network errors are propagated to the user without interception", async () => {
            await startST();
            await setup();

            await page.setRequestInterception(true);
            page.on("request", req => {
                const url = req.url();
                if (url === BASE_URL + "/testError") {
                    req.abort();
                } else {
                    req.continue();
                }
            });

            await page.evaluate(async () => {
                let BASE_URL = "http://localhost.org:8080";
                supertokens.init({
                    apiDomain: BASE_URL
                });

                let caught;
                try {
                    await toTest({ url: `${BASE_URL}/testError#superTokensDoNotDoInterception`, method: "get" });
                } catch (ex) {
                    caught = ex;
                }

                assert.ok(caught);
            });
        });
    });
});
