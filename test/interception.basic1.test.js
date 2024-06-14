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

/* TODO: 
    - User passed config should be sent as well
    - session should not exist when user's session fully expires - use doesSessionExist & check localstorage is empty
    - while logged in, test that APIs that there is proper change in id refresh cookie
    - tests APIs that don't require authentication work after logout - with-credentials don't get sent.
    - if not logged in, test that API that requires auth throws session expired
    - Test everything without and without interception
    - If user provides withCredentials as false or whatever, then app should not add it
    - Cross origin API requests to API that requires Auth
    - Cross origin API request to APi that doesn't require auth
    - Proper change in anti-csrf token once access token resets
    - Refresh API custom headers are working
    - allow-credentials should not be sent by our SDK by default.
    - User passed config should be sent as well
*/

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
    describe(`${name}: interception basic tests 1`, function () {
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

        it("testing api methods without config", async function () {
            await setup();

            await page.evaluate(async () => {
                for (const method of ["GET", "POST", "DELETE", "PUT"]) {
                    const response = await toTest({ url: `${BASE_URL}/testing`, method });
                    assert.strictEqual(response.statusCode, 200);
                    assert.strictEqual(response.responseText, "success");
                }
            });
        });

        it("testing api methods with config", async function () {
            await setup();
            await page.evaluate(async () => {
                const testing = "testing";
                for (const method of ["GET", "POST", "DELETE", "PUT"]) {
                    const response = await toTest({ url: `${BASE_URL}/testing`, method, headers: { testing } });
                    assert.strictEqual(response.statusCode, 200);
                    assert.strictEqual(response.responseText, "success");
                    assert.strictEqual(response.headers.get("testing"), testing);
                }
            });
        });

        it("testing api methods that doesn't exists", async function () {
            await setup();
            await page.evaluate(async () => {
                const testing = "testing";
                for (const method of ["GET", "POST", "DELETE", "PUT"]) {
                    const response = await toTest({ url: `${BASE_URL}/fail`, method, headers: { testing } });
                    assert.strictEqual(response.statusCode, 404);
                }
            });
        });

        it("test session after signing key change", async function () {
            // We can have access tokens valid for longer than the signing key update interval
            await startST(100, true, "0.002");
            await setup();

            await page.evaluate(async coreSupportsMultipleSignigKeys => {
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

                assert.strictEqual(await loginResponse.responseText, userId);

                //delay for 11 seconds for access token signing key to change
                assert.strictEqual(await getNumberOfTimesRefreshCalled(), 0);
                await delay(11);

                //check that the number of times the refreshAPI was called is 0
                assert.strictEqual(await getNumberOfTimesRefreshCalled(), 0);

                const promises = [];
                for (let i = 0; i < 250; i++) {
                    promises.push(await toTest({ url: `${BASE_URL}/` }).catch(() => {}));
                }
                await Promise.all(promises);

                assert.strictEqual(await getNumberOfTimesRefreshCalled(), coreSupportsMultipleSignigKeys ? 0 : 1);
            }, coreTagEqualToOrAfter("3.6.0"));
        });

        it("test sameSite is none if using iframe", async function () {
            await startST(3);
            await setup({
                isInIframe: true
            });
            await page.evaluate(async () => {
                const userId = "testing-supertokens-website";

                await toTest({
                    url: `${BASE_URL}/login`,
                    method: "post",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ userId })
                });
            });

            const cookies = await page.cookies();
            assert.strictEqual(cookies.length, 0);
        });

        it("test warnings when cookie writes are not successful", async function () {
            await startST(3);
            await setup({
                // enableDebugLogs: true,
                disableCookies: true
            });
            const logs = [];
            page.on("console", c => logs.push(c.text()));
            await page.evaluate(async () => {
                await new Promise(res => setTimeout(res, 5000));
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

                assert.strictEqual(loginResponse.responseText, userId);
            });
            assert(logs.filter(str => str.includes("the server responded with a status of 401")).length, 1);
            assert(
                logs.some(str =>
                    str.includes(
                        "Saving to cookies was not successful, this indicates a configuration error or the browser preventing us from writing the cookies (e.g.: incognito mode)."
                    )
                )
            );

            const cookies = await page.cookies();
            assert.strictEqual(cookies.length, 0);
        });

        it("test rid is there", async function () {
            await startST(3);
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
                assert.strictEqual(loginResponse.responseText, userId);

                let getResponse = await toTest({ url: `${BASE_URL}/check-rid` });
                assert.strictEqual(getResponse.responseText, "success");
            });
        });

        it("signout with expired access token", async function () {
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

                assert.strictEqual(loginResponse.responseText, userId);
                await delay(5);
                assert.strictEqual(await getNumberOfTimesRefreshCalled(), 0);
                await supertokens.signOut();
                assert.strictEqual(await getNumberOfTimesRefreshCalled(), 1);
                assert.strictEqual(await supertokens.doesSessionExist(), false);
            });
        });

        it("signout with not expired access token", async function () {
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

                assert.strictEqual(loginResponse.responseText, userId);
                assert.strictEqual(await getNumberOfTimesRefreshCalled(), 0);
                await supertokens.signOut();
                assert.strictEqual(await getNumberOfTimesRefreshCalled(), 0);
                assert.strictEqual(await supertokens.doesSessionExist(), false);

                const getSessionResponse = await toTest({ url: `${BASE_URL}/` });

                //check that the response to getSession after signout is 401
                assert.strictEqual(getSessionResponse.statusCode, 401);
                assert.strictEqual(getSessionResponse.url, `${BASE_URL}/`);
                assert.strictEqual(await getNumberOfTimesRefreshAttempted(), 1);
            });
        });

        it("signout without empty headers in response", async function () {
            if (transferMethod !== "header") {
                return;
            }

            await startST();
            await setup();

            await page.setRequestInterception(true);

            page.on("request", async req => {
                const url = req.url();
                if (url.endsWith("signout")) {
                    req.respond({
                        status: 200,
                        headers: {
                            "front-token": "remove"
                        },
                        body: "{}"
                    });
                } else {
                    req.continue();
                }
            });

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

                assert.strictEqual(loginResponse.responseText, userId);
                assert.strictEqual(await getNumberOfTimesRefreshCalled(), 0);
                await supertokens.signOut();
                assert.strictEqual(await getNumberOfTimesRefreshCalled(), 0);

                assert.strictEqual(await supertokens.getAccessToken(), undefined);
                assert.strictEqual(await supertokens.doesSessionExist(), false);

                const getSessionResponse = await toTest({ url: `${BASE_URL}/` });

                //check that the response to getSession after signout is 401
                assert.strictEqual(getSessionResponse.statusCode, 401);
                assert.strictEqual(getSessionResponse.url, `${BASE_URL}/`);
                assert.strictEqual(await getNumberOfTimesRefreshAttempted(), 1);
            });
        });

        it("test update jwt data ", async function () {
            await startST(3);
            await setup();

            await page.evaluate(async v3AccessTokenSupported => {
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
                let data = await supertokens.getAccessTokenPayloadSecurely();

                assert.strictEqual(
                    Object.keys(data).length,
                    v3AccessTokenSupported ? (data["rsub"] !== undefined ? 10 : data["tId"] !== undefined ? 9 : 8) : 0
                );

                // update jwt data
                let testResponse1 = await toTest({
                    url: `${BASE_URL}/update-jwt`,
                    method: "post",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ key: "łukasz 馬 / 马" })
                });
                let data1 = JSON.parse(testResponse1.responseText);
                assert.strictEqual(data1.key, "łukasz 馬 / 马");

                data = await supertokens.getAccessTokenPayloadSecurely();
                assert.strictEqual(data.key, "łukasz 馬 / 马");

                //delay for 5 seconds for access token validity expiry
                await delay(5);

                //check that the number of times the refreshAPI was called is 0
                assert.strictEqual(await getNumberOfTimesRefreshCalled(), 0);

                // get jwt data
                let testResponse2 = await toTest({ url: `${BASE_URL}/update-jwt`, method: "get" });
                let data2 = JSON.parse(testResponse2.responseText);
                assert.strictEqual(data2.key, "łukasz 馬 / 马");
                assert.strictEqual(await getNumberOfTimesRefreshCalled(), 1);

                // update jwt data
                let testResponse3 = await toTest({
                    url: `${BASE_URL}/update-jwt`,
                    method: "post",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ key1: " łukasz data1" })
                });
                let data3 = JSON.parse(testResponse3.responseText);
                assert.strictEqual(data3.key1, " łukasz data1");
                assert.strictEqual(data3.key, undefined);

                data = await supertokens.getAccessTokenPayloadSecurely();
                assert.strictEqual(data.key1, " łukasz data1");
                assert.strictEqual(data.key, undefined);

                // get jwt data
                let testResponse4 = await toTest({ url: `${BASE_URL}/update-jwt`, method: "get" });
                let data4 = JSON.parse(testResponse4.responseText);
                assert.strictEqual(data4.key1, " łukasz data1");
                assert.strictEqual(data4.key, undefined);
            }, v3AccessTokenSupported);
        });

        //test custom headers are being sent when logged in and when not*****
        it("test that custom headers are being sent", async function () {
            await startST();
            await setup();

            await page.evaluate(async () => {
                let userId = "testing-supertokens-website";

                //send loing request
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

                //send api request with custom headers and check that they are set
                let testResponse = await toTest({
                    url: `${BASE_URL}/testing`,
                    method: "post",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                        testing: "testValue"
                    }
                });

                // check that output is success
                assert.strictEqual(testResponse.responseText, "success");
                //check that the custom headers are present
                assert.strictEqual(await testResponse.headers.get("testing"), "testValue");

                //send logout request
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

                let testResponse2 = await toTest({
                    url: `${BASE_URL}/testing`,
                    method: "post",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                        testing: "testValue"
                    }
                });

                // check that output is success
                assert.strictEqual(testResponse2.responseText, "success");
                //check that the custom headers are present
                assert.strictEqual(await testResponse2.headers.get("testing"), "testValue");
            });
        });

        //testing doesSessionExist works fine when user is logged in******
        it("test that doesSessionExist works fine when the user is logged in", async function () {
            await startST();
            await setup();

            await page.evaluate(async () => {
                let userId = "testing-supertokens-website";

                //send loing request
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

                assert.strictEqual(await supertokens.doesSessionExist(), true);
            });
        });

        //session should not exist when user calls log out - use doesSessionExist & check localstorage is empty
        it("test session should not exist when user calls log out", async function () {
            await startST();
            await setup();
            await page.evaluate(async () => {
                function getAntiCSRFromCookie() {
                    let value = "; " + document.cookie;
                    let parts = value.split("; sAntiCsrf=");
                    if (parts.length >= 2) {
                        let last = parts.pop();
                        if (last !== undefined) {
                            return last;
                        }
                    }
                    return null;
                }
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

                assert.strictEqual(await supertokens.doesSessionExist(), true);
                assert.notEqual(getAntiCSRFromCookie(), null);

                let userIdFromToken = await supertokens.getUserId();
                assert.strictEqual(userIdFromToken, userId);

                // send api request to logout
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
                assert.strictEqual(await supertokens.doesSessionExist(), false);
                assert.strictEqual(getAntiCSRFromCookie(), null);

                try {
                    await supertokens.getUserId();
                    throw new Error("test failed");
                } catch (err) {
                    assert.strictEqual(err.message, "No session exists");
                }

                try {
                    await supertokens.getAccessTokenPayloadSecurely();
                    throw new Error("test failed");
                } catch (err) {
                    assert.strictEqual(err.message, "No session exists");
                }
            });
        });

        // testing attemptRefreshingSession works fine******
        it("test that attemptRefreshingSession is working correctly", async function () {
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
                assert.strictEqual(loginResponse.responseText, userId);

                await delay(5);
                let attemptRefresh = await supertokens.attemptRefreshingSession();
                assert.strictEqual(attemptRefresh, true);

                //check that the number of times the refresh API was called is 1
                assert.strictEqual(await getNumberOfTimesRefreshCalled(), 1);

                let getSessionResponse = await toTest({ url: `${BASE_URL}/` });
                assert.strictEqual(getSessionResponse.responseText, userId);

                //check that the number of times the refresh API was called is still 1
                assert.strictEqual(await getNumberOfTimesRefreshCalled(), 1);
            });
        });

        // - Things should work if anti-csrf is disabled.******
        it("test that things should work correctly if anti-csrf is disabled", async function () {
            await startST(3, false);
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
                assert.strictEqual(await supertokens.doesSessionExist(), true);
                assert.strictEqual(await getNumberOfTimesRefreshCalled(), 0);

                await delay(5);

                let getSessionResponse = await toTest({ url: `${BASE_URL}/` });

                assert.strictEqual(getSessionResponse.responseText, userId);
                assert.strictEqual(await getNumberOfTimesRefreshCalled(), 1);

                let logoutResponse = await toTest({
                    url: `${BASE_URL}/logout`,
                    method: "post",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ userId })
                });

                assert.strictEqual(await supertokens.doesSessionExist(), false);
                assert.strictEqual(logoutResponse.responseText, "success");
            });
        });

        //    - Calling SuperTokens.init more than once works!*******
        it("test that calling SuperTokens.init more than once works", async () => {
            await startST();
            await setup();
            await page.evaluate(async () => {
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
                supertokens.init({
                    apiDomain: BASE_URL
                });

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

                //check that login still works correctly
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
            });
        });

        it("check sessionDoes exist calls refresh API just once", async function () {
            await startST();
            await setup();

            await page.evaluate(async () => {
                let userId = "testing-supertokens-website";

                // check document cookie = ""
                assert.strictEqual(document.cookie, "");

                // call sessionDoesExist
                assert.strictEqual(await supertokens.doesSessionExist(), false);

                // check refresh API was called once + document.cookie has removed
                assert.strictEqual(await getNumberOfTimesRefreshAttempted(), 1);
                assert.strictEqual(await getNumberOfTimesRefreshCalled(), 0);
                // assert.strictEqual(document.cookie, "sIRTFrontend=remove");

                // call sessionDoesExist
                assert.strictEqual(await supertokens.doesSessionExist(), false);
                // check refresh API not called
                assert.strictEqual(await getNumberOfTimesRefreshAttempted(), 1);
                assert.strictEqual(await getNumberOfTimesRefreshCalled(), 0);
                // assert.strictEqual(document.cookie, "sIRTFrontend=remove");

                await toTest({
                    url: `/login`,
                    method: "post",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ userId })
                });

                // call sessionDoesExist
                assert.strictEqual(await supertokens.doesSessionExist(), true);
                // check refresh API not called
                assert.strictEqual(await getNumberOfTimesRefreshAttempted(), 1);
                assert.strictEqual(await getNumberOfTimesRefreshCalled(), 0);
                // assert.notEqual(document.cookie, "sIRTFrontend=remove");
            });
        });

        it("check clearing all frontend set cookies still works (without anti-csrf)", async function () {
            await startST(3, false);

            await setup();
            await page.evaluate(async () => {
                function deleteAllCookies() {
                    var cookies = document.cookie.split(";");

                    for (var i = 0; i < cookies.length; i++) {
                        var cookie = cookies[i];
                        var eqPos = cookie.indexOf("=");
                        var name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
                        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
                    }
                }

                let BASE_URL = "http://localhost.org:8080";
                supertokens.init({
                    apiDomain: BASE_URL
                });
                let userId = "testing-supertokens-website";

                // check document cookie = ""
                assert.strictEqual(document.cookie, "");

                await toTest({
                    url: `/login`,
                    method: "post",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ userId })
                });

                // call sessionDoesExist
                assert.strictEqual(await supertokens.doesSessionExist(), true);
                // check refresh API not called
                assert.strictEqual(await getNumberOfTimesRefreshAttempted(), 1); // it's one here since it gets called during login..
                assert.strictEqual(await getNumberOfTimesRefreshCalled(), 0);
                // assert.notEqual(document.cookie, "sIRTFrontend=remove");

                // clear all cookies
                deleteAllCookies();
                // call sessionDoesExist (returns true) + call to refresh
                assert.strictEqual(await supertokens.doesSessionExist(), true);
                assert.strictEqual(await getNumberOfTimesRefreshAttempted(), 2);
                assert.strictEqual(await getNumberOfTimesRefreshCalled(), 1);

                // call sessionDoesExist (returns true) + no call to refresh
                assert.strictEqual(await supertokens.doesSessionExist(), true);
                assert.strictEqual(await getNumberOfTimesRefreshAttempted(), 2);
                assert.strictEqual(await getNumberOfTimesRefreshCalled(), 1);
            });
        });

        it("check clearing all frontend set cookies logs our user (with anti-csrf)", async function () {
            await startST();

            await setup();
            await page.evaluate(async () => {
                function deleteAllCookies() {
                    var cookies = document.cookie.split(";");

                    for (var i = 0; i < cookies.length; i++) {
                        var cookie = cookies[i];
                        var eqPos = cookie.indexOf("=");
                        var name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
                        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
                    }
                }

                let BASE_URL = "http://localhost.org:8080";
                supertokens.init({
                    apiDomain: BASE_URL
                });
                let userId = "testing-supertokens-website";

                // check document cookie = ""
                assert.strictEqual(document.cookie, "");

                await toTest({
                    url: `/login`,
                    method: "post",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ userId })
                });

                // call sessionDoesExist
                assert.strictEqual(await supertokens.doesSessionExist(), true);
                // check refresh API not called
                assert.strictEqual(await getNumberOfTimesRefreshAttempted(), 1); // it's one here since it gets called during login..
                assert.strictEqual(await getNumberOfTimesRefreshCalled(), 0);
                // assert.notEqual(document.cookie, "sIRTFrontend=remove");

                // clear all cookies
                deleteAllCookies();
                // call sessionDoesExist (returns false) + call to refresh
                assert.strictEqual(await supertokens.doesSessionExist(), false);
                assert.strictEqual(await getNumberOfTimesRefreshAttempted(), 2);
                assert.strictEqual(await getNumberOfTimesRefreshCalled(), 0);

                // call sessionDoesExist (returns false) + no call to refresh
                assert.strictEqual(await supertokens.doesSessionExist(), false);
                assert.strictEqual(await getNumberOfTimesRefreshAttempted(), 2);
                assert.strictEqual(await getNumberOfTimesRefreshCalled(), 0);
            });
        });

        it("test that setting headers works", async function () {
            await setup();
            const [_, req2, req3] = await Promise.all([
                page.evaluate(async () => {
                    let BASE_URL = "http://localhost.org:8080";
                    supertokens.init({
                        apiDomain: BASE_URL
                    });
                    await toTest({ url: `${BASE_URL}/test2`, headers: { asdf2: "123" } });
                    await toTest({ url: `${BASE_URL}/test3` });
                }),
                page.waitForRequest(`${BASE_URL}/test2`),
                page.waitForRequest(`${BASE_URL}/test3`)
            ]);

            assert.equal(req2.headers()["rid"], "anti-csrf");
            assert.equal(req2.headers()["asdf2"], "123");

            assert.equal(req3.headers()["rid"], "anti-csrf");
            assert.equal(req3.headers()["asdf"], undefined);
        });

        it("test when ACCESS_TOKEN_PAYLOAD_UPDATED is fired", async function () {
            await startST(3);

            await setup();
            const logs = [];
            page.on("console", ev => {
                const logText = ev.text();
                if (logText.startsWith("TEST_EV$")) {
                    logs.push(logText.split("$")[1]);
                }
            });
            await page.evaluate(async () => {
                supertokens.init({
                    apiDomain: BASE_URL,
                    onHandleEvent: ev => console.log(`TEST_EV$${ev.action}`)
                });

                let userId = "testing-supertokens-website";

                await toTest({
                    url: `${BASE_URL}/login`,
                    method: "POST",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ userId })
                });
                console.log("TEST_EV$LOGIN_FINISH");
                await toTest({
                    url: `${BASE_URL}/update-jwt`,
                    method: "POST",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ test: 1 })
                });
                console.log("TEST_EV$UPDATE1_FINISH");
                await delay(5);
                await toTest({
                    url: `${BASE_URL}/`,
                    method: "GET",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    }
                });
                console.log("TEST_EV$REFRESH_FINISH");

                await toTest({
                    url: `${BASE_URL}/update-jwt`,
                    method: "POST",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ test: 2 })
                });
                console.log("TEST_EV$UPDATE2_FINISH");
                assertEqual((await supertokens.getAccessTokenPayloadSecurely()).test, 2);
                await delay(5);

                await toTest({
                    url: `${BASE_URL}/update-jwt`,
                    method: "POST",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ test: 3 })
                });
                assertEqual((await supertokens.getAccessTokenPayloadSecurely()).test, 3);
                console.log("TEST_EV$UPDATE3_FINISH");

                await toTest({
                    url: `${BASE_URL}/logout`,
                    method: "post",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ userId })
                });
            });
            if (v3AccessTokenSupported) {
                assert.deepEqual(logs, [
                    "SESSION_CREATED",
                    "LOGIN_FINISH",
                    "ACCESS_TOKEN_PAYLOAD_UPDATED", // Normal update triggered by the endpoint changing the payload
                    "UPDATE1_FINISH",
                    "ACCESS_TOKEN_PAYLOAD_UPDATED", // The refresh endpoint updates the access token
                    "REFRESH_SESSION",
                    "ACCESS_TOKEN_PAYLOAD_UPDATED", // The first request after the refresh (i.e.: during retry) also updates it
                    "REFRESH_FINISH",
                    "ACCESS_TOKEN_PAYLOAD_UPDATED", // Normal update triggered by the endpoint changing the payload
                    "UPDATE2_FINISH",
                    "ACCESS_TOKEN_PAYLOAD_UPDATED", // This is from refresh updating the token
                    "REFRESH_SESSION",
                    "ACCESS_TOKEN_PAYLOAD_UPDATED", // Normal update triggered by the (retried) endpoint changing the payload
                    "UPDATE3_FINISH",
                    "SIGN_OUT"
                ]);
            } else {
                assert.deepEqual(logs, [
                    "SESSION_CREATED",
                    "LOGIN_FINISH",
                    "ACCESS_TOKEN_PAYLOAD_UPDATED", // Normal update triggered by the endpoint changing the payload
                    "UPDATE1_FINISH",
                    "REFRESH_SESSION",
                    "REFRESH_FINISH",
                    "ACCESS_TOKEN_PAYLOAD_UPDATED", // Normal update triggered by the endpoint changing the payload
                    "UPDATE2_FINISH",
                    "REFRESH_SESSION",
                    "ACCESS_TOKEN_PAYLOAD_UPDATED", // Normal update triggered by the (retried) endpoint changing the payload
                    "UPDATE3_FINISH",
                    "SIGN_OUT"
                ]);
            }
        });

        it("test ACCESS_TOKEN_PAYLOAD_UPDATED when updated with handle", async function () {
            await startST(3);

            await setup();
            const logs = [];
            page.on("console", ev => {
                const logText = ev.text();
                if (logText.startsWith("TEST_EV$")) {
                    logs.push(logText.split("$")[1]);
                }
            });
            await page.evaluate(async () => {
                let userId = "testing-supertokens-website";
                supertokens.init({
                    apiDomain: BASE_URL,
                    onHandleEvent: ev => console.log(`TEST_EV$${ev.action}`)
                });

                await toTest({
                    url: `${BASE_URL}/login`,
                    method: "POST",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ userId })
                });
                console.log("TEST_EV$LOGIN_FINISH");

                await toTest({
                    url: `${BASE_URL}/update-jwt-with-handle`,
                    method: "POST",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ test: 2 })
                });
                console.log("TEST_EV$PAYLOAD_DB_UPDATED");
                await toTest({
                    url: `${BASE_URL}/`,
                    method: "GET",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    }
                });
                console.log("TEST_EV$QUERY_NO_REFRESH");
                await delay(5);

                await toTest({
                    url: `${BASE_URL}/`,
                    method: "GET",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    }
                });
                console.log("TEST_EV$REFRESH_FINISH");

                await toTest({
                    url: `${BASE_URL}/logout`,
                    method: "post",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ userId })
                });
            });
            if (v3AccessTokenSupported) {
                assert.deepEqual(logs, [
                    "SESSION_CREATED",
                    "LOGIN_FINISH",
                    "PAYLOAD_DB_UPDATED",
                    "QUERY_NO_REFRESH",
                    "ACCESS_TOKEN_PAYLOAD_UPDATED",
                    "REFRESH_SESSION",
                    "ACCESS_TOKEN_PAYLOAD_UPDATED", // The first request after the refresh also triggers the update
                    "REFRESH_FINISH",
                    "SIGN_OUT"
                ]);
            } else {
                assert.deepEqual(logs, [
                    "SESSION_CREATED",
                    "LOGIN_FINISH",
                    "PAYLOAD_DB_UPDATED",
                    "QUERY_NO_REFRESH",
                    "ACCESS_TOKEN_PAYLOAD_UPDATED",
                    "REFRESH_SESSION",
                    "REFRESH_FINISH",
                    "SIGN_OUT"
                ]);
            }
        });

        it("Test that everything works if the user reads the body and headers in the post API hook", async function () {
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

        it("should work fine if the last header is empty", async () => {
            await startST();
            await setup();
            await page.setRequestInterception(true);

            page.on("request", req => {
                const url = req.url();
                if (url === BASE_URL + "/login") {
                    req.respond({
                        statusCode: 200,
                        headers: {
                            "front-token":
                                "eyJ1aWQiOiIwMGUwOTE1MS0xZDZiLTQwY2MtODYzMS1jZTc4YTE1MDg4YWEiLCJhdGUiOjE2NzUzNTE2MzIwNzUsInVwIjp7InN0LWV2Ijp7InYiOnRydWUsInQiOjE2NzUzNDgwMzIwNjZ9fX0=",
                            "test-header": ""
                        },
                        body: "testing-supertokens-website"
                    });
                } else {
                    req.continue();
                }
            });
            await page.evaluate(async () => {
                const userId = "testing-supertokens-website";
                assert.strictEqual(document.cookie, "");
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

                assert.notStrictEqual(document.cookie, "");
            });
            await page.setRequestInterception(false);
        });

        it("should log out fine if the last header is an empty access-token", async () => {
            await startST();
            await setup();
            await page.setRequestInterception(true);

            page.on("request", req => {
                const url = req.url();
                if (url === BASE_URL + "/auth/signout") {
                    req.respond({
                        statusCode: 200,
                        headers: {
                            "front-token": "remove",
                            "access-token": ""
                        },
                        body: JSON.stringify({ status: "OK" })
                    });
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

                assert.strictEqual(await supertokens.doesSessionExist(), true);

                await supertokens.signOut();
                assert.strictEqual(await supertokens.doesSessionExist(), false);
            });
            await page.setRequestInterception(false);
        });
    });
});
