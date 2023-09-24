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
    describe(`${name}: automatic session refresh`, function () {
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

        it("refresh session with invalid tokens should clear all cookies", async function () {
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

            // we save the cookies..
            let originalCookies = (await page._client.send("Network.getAllCookies")).cookies;

            // we logout
            await page.evaluate(async () => {
                let BASE_URL = "http://localhost.org:8080";
                await toTest({ url: `${BASE_URL}/logout`, method: "POST" });
            });

            // we set the old cookies with invalid access token
            originalCookies = originalCookies.map(c =>
                c.name === "sAccessToken" || c.name === "st-access-token" ? { ...c, value: "broken" } : c
            );
            await page.setCookie(...originalCookies);

            // now we expect a 401.
            await page.evaluate(async () => {
                let BASE_URL = "http://localhost.org:8080";
                let resp = await toTest({ url: `${BASE_URL}/`, method: "GET" });
                assert.strictEqual(resp.statusCode, 401);
                // assert.strictEqual(resp.url, `${BASE_URL}/auth/session/refresh`);
            });

            // and we assert that the only cookie that exists is the st-last-access-token-update
            let newCookies = (await page._client.send("Network.getAllCookies")).cookies;

            assert.strictEqual(newCookies.length, 1);
            assert.strictEqual(newCookies[0].name, "st-last-access-token-update");
        });

        it("refresh session endpoint responding with 500 makes the original call resolve with refresh response", async function () {
            await startST(100, true, "0.002");
            await setup();

            await page.setRequestInterception(true);
            let firstGet = true;
            let firstPost = true;
            page.on("request", req => {
                const url = req.url();
                if (url === BASE_URL + "/") {
                    if (firstGet) {
                        firstGet = false;
                        req.respond({
                            status: 401,
                            body: JSON.stringify({
                                message: "try refresh token"
                            })
                        });
                    } else {
                        req.respond({
                            status: 200,
                            body: JSON.stringify({
                                success: true
                            })
                        });
                    }
                } else if (url === BASE_URL + "/auth/session/refresh") {
                    if (firstPost) {
                        req.respond({
                            status: 401,
                            body: JSON.stringify({
                                message: "try refresh token"
                            })
                        });
                        firstPost = false;
                    } else {
                        req.respond({
                            status: 500,
                            body: JSON.stringify({
                                message: "test"
                            })
                        });
                    }
                } else {
                    req.continue();
                }
            });

            // page.on("console", l => console.log(l.text()));
            await page.evaluate(async () => {
                let BASE_URL = "http://localhost.org:8080";
                supertokens.init({
                    apiDomain: BASE_URL
                });
                let userId = "testing-supertokens-website";

                await toTest({
                    url: `${BASE_URL}/login`,
                    method: "post",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ userId })
                });

                let response = await toTest({ url: `${BASE_URL}/`, method: "GET" });
                // assert.strictEqual(response.url, `${BASE_URL}/auth/session/refresh`);
                assert.strictEqual(response.statusCode, 500);
                const data = JSON.parse(response.responseText);
                assert.strictEqual(data.message, "test");
            });
        });

        it("no refresh call after 401 response that removes session", async function () {
            await startST(100, true, "0.002");
            await setup();
            await page.setRequestInterception(true);
            let refreshCalled = 0;
            page.on("request", req => {
                const url = req.url();
                if (url === BASE_URL + "/") {
                    req.respond({
                        status: 401,
                        body: JSON.stringify({ message: "test" }),
                        headers: {
                            // Cookies don't actually matter as long as we clear the front-token
                            // this is because the frontend will still have st-last-access-token-update w/ a removed front-token
                            // This is interpreted as a logged-out state
                            "front-token": "remove"
                        }
                    });
                } else if (url === BASE_URL + "/auth/session/refresh") {
                    ++refreshCalled;
                    req.respond({
                        status: 401,
                        body: JSON.stringify({ message: "nope" })
                    });
                } else {
                    req.continue();
                }
            });

            await page.evaluate(async () => {
                let userId = "testing-supertokens-website";
                await toTest({
                    url: `${BASE_URL}/login`,
                    method: "post",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ userId })
                });

                const resp = await toTest({
                    url: `${BASE_URL}/`,
                    method: "GET",
                    headers: { "Cache-Control": "no-cache, private" }
                });

                assertNotEqual(resp, undefined);
                assert.strictEqual(resp.statusCode, 401);
                const data = JSON.parse(resp.responseText);
                assertNotEqual(data, undefined);
                assert.strictEqual(data.message, "test");
            });

            // Calls it once before login, but it shouldn't after that
            assert.equal(refreshCalled, 1);
        });

        it("original endpoint responding with 500 should not call refresh without cookies", async function () {
            await startST(100, true, "0.002");
            await setup();
            await page.setRequestInterception(true);
            let refreshCalled = 0;
            page.on("request", req => {
                const url = req.url();
                if (url === BASE_URL + "/") {
                    req.respond({
                        status: 500,
                        body: JSON.stringify({
                            message: "test"
                        })
                    });
                } else if (url === BASE_URL + "/auth/session/refresh") {
                    ++refreshCalled;
                    req.respond({
                        status: 500,
                        body: JSON.stringify({
                            message: "nope"
                        })
                    });
                } else {
                    req.continue();
                }
            });

            await page.evaluate(async () => {
                let response = await toTest({ url: `${BASE_URL}/`, method: "GET" });
                assert.strictEqual(response.url, `${BASE_URL}/`);
                assert.strictEqual(response.statusCode, 500);
                const data = JSON.parse(response.responseText);
                assert.strictEqual(data.message, "test");
            });
            // It should call it once before the call - but after that doesn't work it should not try again after the API request
            assert.strictEqual(refreshCalled, 1);
        });

        //If via interception, make sure that initially, just an endpoint is just hit twice in case of access token expiry*****
        it("test that if via interception, initially an endpoint is hit just twice in case of access token expiary", async () => {
            await startST(3);
            await setup();
            await page.evaluate(async () => {
                let BASE_URL = "http://localhost.org:8080";
                supertokens.init({
                    apiDomain: BASE_URL
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

                assert.strictEqual(loginResponse.responseText, userId);

                //wait for 3 seconds such that the session expires
                await delay(5);

                let getSessionResponse = await toTest({ url: `${BASE_URL}/` });
                assert.strictEqual(getSessionResponse.responseText, userId);

                //check that the number of times getSession was called is 1
                assert.strictEqual(await getNumberOfTimesGetSessionCalled(), 1);

                //check that the number of times refesh session was called is 1
                assert.strictEqual(await getNumberOfTimesRefreshCalled(), 1);
            });
        });

        //- If you make an api call without cookies(logged out) api throws session expired , then make sure that refresh token api is not getting called , get 401 as the output****
        it("test that an api call without cookies throws session expire, refresh api is not called and 401 is the output", async function () {
            await startST(5);
            await setup();

            await page.evaluate(async () => {
                let BASE_URL = "http://localhost.org:8080";
                supertokens.init({
                    apiDomain: BASE_URL
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

                let getSessionResponse = await toTest({ url: `${BASE_URL}/` });

                //check that the response to getSession without cookies is 401
                assert.strictEqual(getSessionResponse.statusCode, 401);

                assert.strictEqual(getSessionResponse.url, `${BASE_URL}/`);
                assert.strictEqual(await getNumberOfTimesRefreshAttempted(), 1);
            });
        });

        //    - If via interception, make sure that initially, just an endpoint is just hit once in case of access token NOT expiry*****
        it("test that via interception initially an endpoint is just hit once in case of valid access token", async function () {
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
                    url: `${BASE_URL}/login`,
                    method: "post",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ userId })
                });

                assert.strictEqual(loginResponse.responseText, userId);

                let getSessionResponse = await toTest({ url: `${BASE_URL}/` });
                assert.strictEqual(getSessionResponse.responseText, userId);

                //check that the number of times getSession was called is 1
                assert.strictEqual(await getNumberOfTimesGetSessionCalled(), 1);

                //check that the number of times refresh session was called is 0
                assert.strictEqual(await getNumberOfTimesRefreshCalled(), 0);
            });
        });

        // multiple API calls in parallel when access token is expired (100 of them) and only 1 refresh should be called*****
        it("test that multiple API calls in parallel when access token is expired, only 1 refresh should be called", async function () {
            await startST(15);
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
                assert.strictEqual(loginResponse.responseText, userId);
                assert.strictEqual(await getNumberOfTimesRefreshCalled(), 0);

                // wait for 7 seconds so that the accesstoken expires
                await delay(17);

                let promises = [];
                let n = 100;

                // create an array of 100 get session promises
                for (let i = 0; i < n; i++) {
                    promises.push(
                        toTest({
                            url: `${BASE_URL}/`,
                            method: "GET",
                            headers: { "Cache-Control": "no-cache, private" }
                        })
                    );
                }

                // send 100 get session requests
                let multipleGetSessionResponse = await Promise.all(promises);

                //check that reponse of all requests are success
                let noOfResponeSuccesses = 0;
                for (let i = 0; i < multipleGetSessionResponse.length; i++) {
                    assert.strictEqual(await multipleGetSessionResponse[i].responseText, userId);
                    noOfResponeSuccesses += 1;
                }

                //check that the number of times refresh is called is 1

                assert.strictEqual(await getNumberOfTimesRefreshCalled(), 1);
                assert.strictEqual(noOfResponeSuccesses, n);
            });
        });

        // multiple API calls in parallel when access token is expired (100 of them) and only 1 refresh should be called*****
        it("test that multiple API calls in parallel when access token is expired, only 1 refresh should be called - with delayed calls", async function () {
            await startST(15);
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
                assert.strictEqual(loginResponse.responseText, userId);
                assert.strictEqual(await getNumberOfTimesRefreshCalled(), 0);

                // wait for 7 seconds so that the accesstoken expires
                await delay(17);

                let promises = [];
                let n = 100;

                // create an array of 100 get session promises
                for (let i = 0; i < n; i++) {
                    // this will make it so that there are calls to the / API during the refresh call.
                    // these calls should not cause another refresh, cause the tokens would have changed.
                    await new Promise(r => setTimeout(r, 3 * Math.random()));
                    promises.push(
                        toTest({
                            url: `${BASE_URL}/`,
                            method: "GET",
                            headers: { "Cache-Control": "no-cache, private" }
                        })
                    );
                }

                // send 100 get session requests
                let multipleGetSessionResponse = await Promise.all(promises);

                //check that reponse of all requests are success
                let noOfResponeSuccesses = 0;
                for (let i = 0; i < multipleGetSessionResponse.length; i++) {
                    assert.strictEqual(await multipleGetSessionResponse[i].responseText, userId);
                    noOfResponeSuccesses += 1;
                }

                //check that the number of times refresh is called is 1

                try {
                    assert.strictEqual(await getNumberOfTimesRefreshCalled(), 1);
                } catch (err) {
                    // this happens sometimes for python testing where the number of refreshes is
                    // 2.
                    assert.strictEqual(await getNumberOfTimesRefreshCalled(), 2);
                }
                assert.strictEqual(noOfResponeSuccesses, n);
            });
        });

        it("test refresh session", async function () {
            await startST(3);
            await setup();
            await page.evaluate(async () => {
                const userId = "testing-supertokens-website";
                const loginResponse = await toTest({
                    url: `${BASE_URL}/login`,
                    method: "post",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ userId })
                });

                assert.strictEqual(loginResponse.statusCode, 200);
                assert.strictEqual(loginResponse.responseText, userId);
                //delay for 5 seconds for access token validity expiry
                await delay(5);

                //check that the number of times the refreshAPI was called is 0
                assert.strictEqual(await getNumberOfTimesRefreshCalled(), 0);

                let getResponse = await toTest({ url: `${BASE_URL}/` });
                //check that the response to getSession was success
                assert.strictEqual(getResponse.statusCode, 200);
                assert.strictEqual(getResponse.responseText, userId);

                //check that the number of time the refreshAPI was called is 1
                assert.strictEqual(await getNumberOfTimesRefreshCalled(), 1);
            });
        });

        it("test refresh session with multiple 401s", async function () {
            await startST(3);
            await setup();
            await page.setRequestInterception(true);
            let getCount = 0;
            page.on("request", req => {
                const url = req.url();
                if (url === BASE_URL + "/") {
                    if (getCount++ < 3) {
                        req.respond({
                            status: 401,
                            body: JSON.stringify({
                                message: "try refresh token"
                            })
                        });
                    } else {
                        req.respond({
                            status: 200,
                            body: JSON.stringify({
                                success: true
                            })
                        });
                    }
                } else {
                    req.continue();
                }
            });
            await page.evaluate(async () => {
                const userId = "testing-supertokens-website";
                const loginResponse = await toTest({
                    url: `${BASE_URL}/login`,
                    method: "post",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ userId })
                });

                assert.strictEqual(loginResponse.statusCode, 200);
                assert.strictEqual(loginResponse.responseText, userId);
                //delay for 5 seconds for access token validity expiry
                await delay(5);

                //check that the number of times the refreshAPI was called is 0
                assert.strictEqual(await getNumberOfTimesRefreshCalled(), 0);

                let getResponse = await toTest({ url: `${BASE_URL}/` });
                //check that the response to getSession was success
                assert.strictEqual(getResponse.statusCode, 200);
                assert.deepStrictEqual(JSON.parse(getResponse.responseText), { success: true });

                assert.strictEqual(await getNumberOfTimesRefreshCalled(), 3);
            });
            await page.setRequestInterception(false);
        });
    });
});
