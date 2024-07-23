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
    describe(`${name}: cross domain calls`, function () {
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

        //cross domain login, userinfo, logout
        it("test cross domain", async () => {
            await startST(5);
            await setup();

            await page.evaluate(async () => {
                let userId = "testing-supertokens-website";

                // send api request to login
                let loginResponse = await toTest({
                    url: `${BASE_URL}/login`,
                    method: "post",
                    credentials: "include",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ userId })
                });

                //check that the userId which is returned in the response is the same as the one we sent
                assert.strictEqual(loginResponse.responseText, userId);

                // check that the session exists
                assert.strictEqual(await supertokens.doesSessionExist(), true);

                // check that the number of times session refresh is called is zero
                assert.strictEqual(await getNumberOfTimesRefreshCalled(BASE_URL), 0);

                //delay for 5 seconds so that we know accessToken expires

                await delay(5);
                // send a get session request , which should do a refresh session request
                let getSessionResponse = await toTest({ url: `${BASE_URL}/`, method: "get", credentials: "include" });

                // check that the getSession was successfull
                assert.strictEqual(getSessionResponse.responseText, userId);

                // check that the refresh session was called only once
                assert.strictEqual(await getNumberOfTimesRefreshCalled(BASE_URL), 1);

                // do logout
                let logoutResponse = await toTest({
                    url: `${BASE_URL}/logout`,
                    method: "post",
                    credentials: "include",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ userId })
                });
                assert.strictEqual(logoutResponse.responseText, "success");

                //check that session does not exist
                assert.strictEqual(await supertokens.doesSessionExist(), false);
            });
        });

        //cross domain login, userinfo, logout
        it("test cross domain, auto add credentials", async () => {
            await startST(5);
            await setup();
            await page.evaluate(async () => {
                let userId = "testing-supertokens-website";

                // send api request to login
                let loginResponse = await toTest({
                    url: `${BASE_URL}/login`,
                    method: "post",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ userId })
                });

                //check that the userId which is returned in the response is the same as the one we sent
                assert.strictEqual(loginResponse.responseText, userId);

                // check that the session exists
                assert.strictEqual(await supertokens.doesSessionExist(), true);

                // check that the number of times session refresh is called is zero
                assert.strictEqual(await getNumberOfTimesRefreshCalled(BASE_URL), 0);

                //delay for 5 seconds so that we know accessToken expires

                await delay(5);
                // send a get session request , which should do a refresh session request
                let getSessionResponse = await toTest({ url: `${BASE_URL}/`, method: "get" });

                // check that the getSession was successfull
                assert.strictEqual(getSessionResponse.responseText, userId);

                // check that the refresh session was called only once
                assert.strictEqual(await getNumberOfTimesRefreshCalled(BASE_URL), 1);

                // do logout
                let logoutResponse = await toTest({
                    url: `${BASE_URL}/logout`,
                    method: "post",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ userId })
                });
                assert.strictEqual(logoutResponse.responseText, "success");

                //check that session does not exist
                assert.strictEqual(await supertokens.doesSessionExist(), false);
            });
        });

        //cross domain login, userinfo, logout
        it("test cross domain, no auto add credentials, fail", async () => {
            await startST(5);
            await setup();
            await page.evaluate(async () => {
                let BASE_URL = "http://localhost.org:8082";
                supertokens.init({
                    apiDomain: BASE_URL,
                    autoAddCredentials: false
                });
                let userId = "testing-supertokens-website";

                // send api request to login
                let loginResponse = await toTest({
                    url: `${BASE_URL}/login`,
                    method: "post",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ userId })
                });

                //check that the userId which is returned in the response is the same as the one we sent
                assert.strictEqual(loginResponse.responseText, userId);

                // check that the session exists
                assert.strictEqual(await supertokens.doesSessionExist(), true);

                // check that the number of times session refresh is called is zero
                assert.strictEqual(await getNumberOfTimesRefreshCalled(BASE_URL), 0);

                //delay for 5 seconds so that we know accessToken expires

                await delay(5);

                let resp = await toTest({ url: `${BASE_URL}/`, method: "get" });
                assert.strictEqual(resp.statusCode, 401);

                assert.strictEqual(await supertokens.doesSessionExist(), false);

                await toTest({
                    url: `${BASE_URL}/login`,
                    method: "post",
                    credentials: "include",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ userId })
                });

                // send a get session request , which should do a refresh session request
                let getSessionResponse = await toTest({ url: `${BASE_URL}/`, method: "get", credentials: "include" });

                // check that the getSession was successfull
                assert.strictEqual(getSessionResponse.responseText, userId);

                // check that the refresh session was called only once
                assert.strictEqual(await getNumberOfTimesRefreshCalled(BASE_URL), 0);

                // do logout
                let logoutResponse = await toTest({
                    url: `${BASE_URL}/logout`,
                    method: "post",
                    credentials: "include",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ userId })
                });
                assert.strictEqual(logoutResponse.responseText, "success");

                //check that session does not exist
                assert.strictEqual(await supertokens.doesSessionExist(), false);
            });
        });
    });
});
