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
    describe(`${name}: token migration`, function () {
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

        it("should work after refresh migrating old cookie based sessions", async function () {
            if (transferMethod === "header") {
                // We skip this in header mode, they can't have legacy sessions
                this.skip();
            }

            await startST();
            await setup();

            await page.evaluate(async () => {
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
            });

            await page.setCookie({ name: "sIdRefreshToken", value: "asdf" });

            assert.strictEqual(await getNumberOfTimesRefreshCalled(), 0);
            let originalCookies = (await page._client.send("Network.getAllCookies")).cookies;
            assert.notStrictEqual(
                originalCookies.find(cookie => cookie.name === "sIdRefreshToken"),
                undefined
            );

            await page.evaluate(async () => {
                let BASE_URL = "http://localhost.org:8080";
                let resp = await toTest({ url: `${BASE_URL}/`, method: "GET" });
                assert.strictEqual(resp.statusCode, 200);
            });
            assert.strictEqual(await getNumberOfTimesRefreshCalled(), 1);
            let newCookies = (await page._client.send("Network.getAllCookies")).cookies;
            assert.strictEqual(
                newCookies.find(cookie => cookie.name === "sIdRefreshToken"),
                undefined
            );
        });

        it("should work after refresh migrating old cookie based sessions with expired access tokens", async function () {
            if (transferMethod === "header") {
                // We skip this in header mode, they can't have legacy sessions
                this.skip();
            }

            await startST();
            await setup();

            await page.evaluate(async () => {
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
            });

            // This would work even without sIdRefreshToken since we don't actually check the body of the response, just call refresh on all 401s
            await page.setCookie({ name: "sIdRefreshToken", value: "asdf" });
            await page.setCookie({ name: "sAccessToken", value: "", expiry: 0 });

            assert.strictEqual(await getNumberOfTimesRefreshCalled(), 0);
            let originalCookies = (await page._client.send("Network.getAllCookies")).cookies;
            assert.notStrictEqual(
                originalCookies.find(cookie => cookie.name === "sIdRefreshToken"),
                undefined
            );

            await page.evaluate(async () => {
                let BASE_URL = "http://localhost.org:8080";
                let resp = await toTest({ url: `${BASE_URL}/`, method: "GET" });
                assert.strictEqual(resp.statusCode, 200);
            });
            assert.strictEqual(await getNumberOfTimesRefreshCalled(), 1);
            let newCookies = (await page._client.send("Network.getAllCookies")).cookies;
            assert.notStrictEqual(
                originalCookies.find(cookie => cookie.name === "sAccessToken"),
                undefined
            );
            assert.strictEqual(
                newCookies.find(cookie => cookie.name === "sIdRefreshToken"),
                undefined
            );
        });

        /**
         * - Create a session with cookies and add sIdRefreshToken manually to simulate old cookies
         * - Change the token method to headers
         * - Get session information and make sure the API succeeds, refresh is called and sIdRefreshToken is removed
         * - Make sure getAccessToken returns undefined because the backend should have used cookies
         * - Sign out
         * - Login again and make sure access token is present because backend should now use headers
         */
        it("should still work fine work fine if header based auth is enabled after a cookie based session", async function () {
            if (transferMethod === "header") {
                // We skip this in header mode, they can't have legacy sessions
                this.skip();
            }

            await startST();
            await setup();

            await page.evaluate(async () => {
                window.userId = "testing-supertokens";
                window.BASE_URL = "http://localhost.org:8080";

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

                assert.strictEqual(loginResponse.responseText, userId);

                // make sure there is no access token
                let accessToken = await supertokens.getAccessToken();
                assert.strictEqual(accessToken, undefined);

                let getSessionResponse = await toTest({
                    url: `${BASE_URL}/`,
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    }
                });

                assert.strictEqual(getSessionResponse.statusCode, 200);
                assert.strictEqual(getSessionResponse.responseText, userId);
            });

            // This would work even without sIdRefreshToken since we don't actually check the body of the response, just call refresh on all 401s
            await page.setCookie({ name: "sIdRefreshToken", value: "asdf" });

            const originalCookies = (await page._client.send("Network.getAllCookies")).cookies;
            assert.notStrictEqual(
                originalCookies.find(cookie => cookie.name === "sIdRefreshToken"),
                undefined
            );

            await page.evaluate(async () => {
                // Switch to header based auth
                // Re-initialization doesn't work for everything (i.e., overrides), but it's fine for this
                supertokens.init({
                    apiDomain: BASE_URL,
                    tokenTransferMethod: "header"
                });

                let getResponse = await toTest({ url: `${BASE_URL}/`, method: "GET" });

                //check that the response to getSession was success
                assert.strictEqual(getResponse.responseText, userId);

                //check that the number of time the refreshAPI was called is 1
                assert.strictEqual(await getNumberOfTimesRefreshCalled(), 1);
            });

            const refreshedCookies = (await page._client.send("Network.getAllCookies")).cookies;
            assert.strictEqual(
                refreshedCookies.find(cookie => cookie.name === "sIdRefreshToken"),
                undefined
            );

            await page.evaluate(async () => {
                // Make sure this is still undefined because the backend should continue using cookies
                accessToken = await supertokens.getAccessToken();
                assert.strictEqual(accessToken, undefined);

                await supertokens.signOut();

                // send api request to login
                loginResponse = await toTest({
                    url: `${BASE_URL}/login`,
                    method: "post",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ userId })
                });

                assert.strictEqual(loginResponse.responseText, userId);

                // Make sure now access token is present because it should use header based auth
                accessToken = await supertokens.getAccessToken();
                assert.notStrictEqual(accessToken, undefined);
            });
        });
    });
});
