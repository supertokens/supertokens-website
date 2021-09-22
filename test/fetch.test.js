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
let jsdom = require("mocha-jsdom");
let { default: AuthHttpRequestFetch } = require("../lib/build/fetch");
let AuthHttpRequest = require("../index.js").default;
let assert = require("assert");
let {
    delay,
    checkIfIdRefreshIsCleared,
    getNumberOfTimesRefreshCalled,
    startST,
    getNumberOfTimesGetSessionCalled,
    BASE_URL,
    BASE_URL_FOR_ST,
    coreTagEqualToOrAfter
} = require("./utils");
const { spawn } = require("child_process");
let { ProcessState, PROCESS_STATE } = require("../lib/build/processState");

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
describe("Fetch AuthHttpRequest class tests", function() {
    jsdom({
        url: "http://localhost"
    });

    before(async function() {
        spawn("./test/startServer", [
            process.env.INSTALL_PATH,
            process.env.NODE_PORT === undefined ? 8080 : process.env.NODE_PORT
        ]);
        await new Promise(r => setTimeout(r, 1000));
    });

    after(async function() {
        let instance = axios.create();
        await instance.post(BASE_URL_FOR_ST + "/after");
        try {
            await instance.get(BASE_URL_FOR_ST + "/stop");
        } catch (err) {}
    });

    beforeEach(async function() {
        AuthHttpRequestFetch.initCalled = false;
        global.document = {};
        ProcessState.getInstance().reset();
        let instance = axios.create();
        await instance.post(BASE_URL_FOR_ST + "/beforeeach");
        await instance.post("http://localhost.org:8082/beforeeach"); // for cross domain
        await instance.post(BASE_URL + "/beforeeach");
    });

    it("testing with fetch for init check in doRequest", async function() {
        let failed = false;
        try {
            await AuthHttpRequestFetch.doRequest(async () => {});
            failed = true;
        } catch (err) {
            if (err.message !== "init function not called") {
                failed = true;
            }
        }

        if (failed) {
            throw Error("test failed");
        }
    });

    it("testing with fetch for init check in attemptRefreshingSession", async function() {
        let failed = false;
        try {
            await AuthHttpRequest.attemptRefreshingSession();
            failed = true;
        } catch (err) {}

        if (failed) {
            throw Error("test failed");
        }
    });

    it("testing with fetch api methods without config", async function() {
        AuthHttpRequest.init({
            apiDomain: BASE_URL
        });

        let getResponse = await fetch(`${BASE_URL}/testing`, {
            method: "GET"
        });
        let postResponse = await fetch(`${BASE_URL}/testing`, {
            method: "POST"
        });
        let deleteResponse = await fetch(`${BASE_URL}/testing`, {
            method: "DELETE"
        });
        let putResponse = await fetch(`${BASE_URL}/testing`, {
            method: "PUT"
        });
        let doRequestResponse = await fetch(`${BASE_URL}/testing`, { method: "GET" });
        getResponse = await getResponse.text();
        putResponse = await putResponse.text();
        postResponse = await postResponse.text();
        deleteResponse = await deleteResponse.text();
        doRequestResponse = await doRequestResponse.text();
        let expectedResponse = "success";

        assert.strictEqual(getResponse, expectedResponse);
        assert.strictEqual(putResponse, expectedResponse);
        assert.strictEqual(postResponse, expectedResponse);
        assert.strictEqual(deleteResponse, expectedResponse);
        assert.strictEqual(doRequestResponse, expectedResponse);
    });

    it("testing with fetch api methods with config", async function() {
        AuthHttpRequest.init({
            apiDomain: BASE_URL
        });

        let testing = "testing";
        let getResponse = await fetch(`${BASE_URL}/${testing}`, { method: "GET", headers: { testing } });
        let postResponse = await fetch(`${BASE_URL}/${testing}`, { method: "post", headers: { testing } });
        let deleteResponse = await fetch(`${BASE_URL}/${testing}`, { method: "delete", headers: { testing } });
        let putResponse = await fetch(`${BASE_URL}/${testing}`, { method: "put", headers: { testing } });
        let doRequestResponse1 = await fetch(`${BASE_URL}/${testing}`, {
            method: "GET",
            headers: { testing }
        });
        let doRequestResponse2 = await fetch(`${BASE_URL}/${testing}`, {
            method: "GET",
            headers: { testing }
        });
        let getResponseHeader = getResponse.headers.get(testing);
        getResponse = await getResponse.text();
        let putResponseHeader = putResponse.headers.get(testing);
        putResponse = await putResponse.text();
        let postResponseHeader = postResponse.headers.get(testing);
        postResponse = await postResponse.text();
        let deleteResponseHeader = deleteResponse.headers.get(testing);
        deleteResponse = await deleteResponse.text();
        let doRequestResponseHeader1 = doRequestResponse1.headers.get(testing);
        doRequestResponse1 = await doRequestResponse1.text();
        let doRequestResponseHeader2 = doRequestResponse2.headers.get(testing);
        doRequestResponse2 = await doRequestResponse2.text();
        let expectedResponse = "success";

        assert.strictEqual(getResponse, expectedResponse);
        assert.strictEqual(getResponseHeader, testing);
        assert.strictEqual(putResponse, expectedResponse);
        assert.strictEqual(putResponseHeader, testing);
        assert.strictEqual(postResponse, expectedResponse);
        assert.strictEqual(postResponseHeader, testing);
        assert.strictEqual(deleteResponse, expectedResponse);
        assert.strictEqual(deleteResponseHeader, testing);
        assert.strictEqual(doRequestResponse1, expectedResponse);
        assert.strictEqual(doRequestResponseHeader1, testing);
        assert.strictEqual(doRequestResponse2, expectedResponse);
        assert.strictEqual(doRequestResponseHeader2, testing);
    });

    it("testing with fetch api methods that doesn't exists", async function() {
        AuthHttpRequest.init({
            apiDomain: BASE_URL
        });

        let getResponse = await fetch(`${BASE_URL}/fail`, {
            method: "GET"
        });
        let postResponse = await fetch(`${BASE_URL}/fail`, {
            method: "POST"
        });
        let deleteResponse = await fetch(`${BASE_URL}/fail`, {
            method: "DELETE"
        });
        let putResponse = await fetch(`${BASE_URL}/fail`, {
            method: "PUT"
        });
        let doRequestResponse1 = await fetch(`${BASE_URL}/fail`, { method: "GET" });
        let doRequestResponse2 = await fetch(`${BASE_URL}/fail`, { method: "GET" });
        let getResponseCode = getResponse.status;
        let putResponseCode = putResponse.status;
        let postResponseCode = postResponse.status;
        let deleteResponseCode = deleteResponse.status;
        let doRequestResponseCode1 = doRequestResponse1.status;
        let doRequestResponseCode2 = doRequestResponse2.status;
        let expectedStatusCode = 404;

        assert.strictEqual(getResponseCode, expectedStatusCode);
        assert.strictEqual(putResponseCode, expectedStatusCode);
        assert.strictEqual(postResponseCode, expectedStatusCode);
        assert.strictEqual(deleteResponseCode, expectedStatusCode);
        assert.strictEqual(doRequestResponseCode1, expectedStatusCode);
        assert.strictEqual(doRequestResponseCode2, expectedStatusCode);
    });

    it("test refresh session with fetch", async function() {
        await startST(3);
        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });
        try {
            const page = await browser.newPage();
            await page.goto(BASE_URL + "/index.html", { waitUntil: "load" });
            await page.addScriptTag({ path: `./bundle/bundle.js`, type: "text/javascript" });
            await page.evaluate(async () => {
                let BASE_URL = "http://localhost.org:8080";
                supertokens.init({
                    apiDomain: BASE_URL
                });
                let userId = "testing-supertokens-website";

                let loginResponse = await fetch(`${BASE_URL}/login`, {
                    method: "post",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ userId })
                });

                assertEqual(await loginResponse.text(), userId);

                //delay for 5 seconds for access token validity expiry
                await delay(5);

                //check that the number of times the refreshAPI was called is 0
                assertEqual(await getNumberOfTimesRefreshCalled(), 0);

                let getResponse = await fetch(`${BASE_URL}/`);

                //check that the response to getSession was success
                assertEqual(await getResponse.text(), userId);

                //check that the number of time the refreshAPI was called is 1
                assertEqual(await getNumberOfTimesRefreshCalled(), 1);
            });
        } finally {
            await browser.close();
        }
    });

    it("test session after signing key change", async function() {
        // We can have access tokens valid for longer than the signing key update interval
        await startST(100, true, "0.002");

        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });
        try {
            const page = await browser.newPage();
            await page.goto(BASE_URL + "/index.html", { waitUntil: "load" });
            // page.on('console', console.log);
            await page.addScriptTag({ path: `./bundle/bundle.js`, type: "text/javascript" });
            await page.evaluate(async coreSupportsMultipleSignigKeys => {
                let BASE_URL = "http://localhost.org:8080";
                supertokens.init({
                    apiDomain: BASE_URL
                });
                let userId = "testing-supertokens-website";

                let loginResponse = await fetch(`${BASE_URL}/login`, {
                    method: "post",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ userId })
                });

                assertEqual(await loginResponse.text(), userId);

                //delay for 11 seconds for access token signing key to change
                assertEqual(await getNumberOfTimesRefreshCalled(), 0);
                await delay(11);

                //check that the number of times the refreshAPI was called is 0
                assertEqual(await getNumberOfTimesRefreshCalled(), 0);

                const promises = [];
                for (let i = 0; i < 250; i++) {
                    promises.push(
                        axios({ url: `${BASE_URL}/`, method: "GET", headers: { "Cache-Control": "no-cache, private" } })
                    );
                }
                await Promise.all(promises);

                assertEqual(await getNumberOfTimesRefreshCalled(), coreSupportsMultipleSignigKeys ? 0 : 1);
            }, coreTagEqualToOrAfter("3.6.0"));
        } finally {
            await browser.close();
        }
    });

    it("test sameSite is none if using iframe", async function() {
        await startST(3);
        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });
        try {
            const page = await browser.newPage();
            await page.goto(BASE_URL + "/index.html", { waitUntil: "load" });
            await page.addScriptTag({ path: `./bundle/bundle.js`, type: "text/javascript" });
            await page.evaluate(async () => {
                let BASE_URL = "http://localhost.org:8080";
                supertokens.init({
                    apiDomain: BASE_URL,
                    isInIframe: true
                });
                let userId = "testing-supertokens-website";

                await fetch(`${BASE_URL}/login`, {
                    method: "post",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ userId })
                });
            });

            let cookies = await page.cookies();
            assert(cookies.length === 0);
        } finally {
            await browser.close();
        }
    });

    it("test rid is there", async function() {
        await startST(3);
        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });
        try {
            const page = await browser.newPage();
            await page.goto(BASE_URL + "/index.html", { waitUntil: "load" });
            await page.addScriptTag({ path: `./bundle/bundle.js`, type: "text/javascript" });
            await page.evaluate(async () => {
                let BASE_URL = "http://localhost.org:8080";
                supertokens.init({
                    apiDomain: BASE_URL
                });
                let userId = "testing-supertokens-website";

                let loginResponse = await fetch(`${BASE_URL}/login`, {
                    method: "post",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ userId })
                });

                assertEqual(await loginResponse.text(), userId);

                let getResponse = await fetch(`${BASE_URL}/check-rid`);

                assertEqual(await getResponse.text(), "success");
            });
        } finally {
            await browser.close();
        }
    });

    it("signout with expired access token", async function() {
        await startST();
        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });
        try {
            const page = await browser.newPage();
            await page.goto(BASE_URL + "/index.html", { waitUntil: "load" });
            await page.addScriptTag({ path: `./bundle/bundle.js`, type: "text/javascript" });
            await page.evaluate(async () => {
                let BASE_URL = "http://localhost.org:8080";
                supertokens.init({
                    apiDomain: BASE_URL
                });
                let userId = "testing-supertokens-website";

                let loginResponse = await fetch(`${BASE_URL}/login`, {
                    method: "post",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ userId })
                });

                assertEqual(await loginResponse.text(), userId);
                await delay(5);
                assertEqual(await getNumberOfTimesRefreshCalled(), 0);
                await supertokens.signOut();
                assertEqual(await getNumberOfTimesRefreshCalled(), 1);
                assertEqual(await supertokens.doesSessionExist(), false);
            });
        } finally {
            await browser.close();
        }
    });

    it("signout with not expired access token", async function() {
        await startST();
        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });
        try {
            const page = await browser.newPage();
            await page.goto(BASE_URL + "/index.html", { waitUntil: "load" });
            await page.addScriptTag({ path: `./bundle/bundle.js`, type: "text/javascript" });
            await page.evaluate(async () => {
                let BASE_URL = "http://localhost.org:8080";
                supertokens.init({
                    apiDomain: BASE_URL
                });
                let userId = "testing-supertokens-website";

                let loginResponse = await fetch(`${BASE_URL}/login`, {
                    method: "post",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ userId })
                });

                assertEqual(await loginResponse.text(), userId);
                assertEqual(await getNumberOfTimesRefreshCalled(), 0);
                await supertokens.signOut();
                assertEqual(await getNumberOfTimesRefreshCalled(), 0);
                assertEqual(await supertokens.doesSessionExist(), false);
            });
        } finally {
            await browser.close();
        }
    });

    // it("refresh session via reading of frontend info using fetch", async function () {
    //     await startST();
    //     const browser = await puppeteer.launch({
    //         args: ["--no-sandbox", "--disable-setuid-sandbox"]
    //     });
    //     try {
    //         const page = await browser.newPage();
    //         await page.goto(BASE_URL + "/index.html", { waitUntil: "load" });
    //         await page.addScriptTag({ path: `./bundle/bundle.js`, type: "text/javascript" });
    //         await page.evaluate(async () => {
    //             let BASE_URL = "http://localhost.org:8080";
    //             supertokens.init({
    //                 apiDomain: BASE_URL
    //             });
    //             let userId = "testing-supertokens-website";
    //             let loginResponse = await fetch(`${BASE_URL}/login`, {
    //                 method: "post",
    //                 headers: {
    //                     Accept: "application/json",
    //                     "Content-Type": "application/json"
    //                 },
    //                 body: JSON.stringify({ userId })
    //             });
    //             assertEqual(await loginResponse.text(), userId);

    //             let testResponse1 = await fetch(`${BASE_URL}/update-jwt`, {
    //                 method: "post",
    //                 headers: {
    //                     Accept: "application/json",
    //                     "Content-Type": "application/json"
    //                 },
    //                 body: JSON.stringify({ key: "data" })
    //             });

    //             await delay(3);

    //             assertEqual(await getNumberOfTimesRefreshCalled(), 0);
    //             let data = await supertokens.getJWTPayloadSecurely();
    //             assertEqual(await getNumberOfTimesRefreshCalled(), 1);
    //             assertEqual(data.key === "data", true);

    //             let data2 = await supertokens.getJWTPayloadSecurely();
    //             assertEqual(data2.key === "data", true);
    //             assertEqual(await getNumberOfTimesRefreshCalled(), 1);
    //         });
    //     } finally {
    //         await browser.close();
    //     }
    // });

    it("test update jwt data  with fetch", async function() {
        await startST(3);
        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });
        try {
            const page = await browser.newPage();
            await page.goto(BASE_URL + "/index.html", { waitUntil: "load" });
            await page.addScriptTag({ path: `./bundle/bundle.js`, type: "text/javascript" });
            await page.evaluate(async () => {
                let BASE_URL = "http://localhost.org:8080";
                supertokens.init({
                    apiDomain: BASE_URL
                });
                let userId = "testing-supertokens-website";

                // send api request to login
                let loginResponse = await fetch(`${BASE_URL}/login`, {
                    method: "post",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ userId })
                });

                assertEqual(await loginResponse.text(), userId);

                let data = await supertokens.getJWTPayloadSecurely();
                assertEqual(Object.keys(data).length, 0);

                // update jwt data
                let testResponse1 = await fetch(`${BASE_URL}/update-jwt`, {
                    method: "post",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ key: "łukasz 馬 / 马" })
                });
                let data1 = await testResponse1.json();
                assertEqual(data1.key, "łukasz 馬 / 马");

                data = await supertokens.getJWTPayloadSecurely();
                assertEqual(data.key, "łukasz 馬 / 马");

                //delay for 5 seconds for access token validity expiry
                await delay(5);

                //check that the number of times the refreshAPI was called is 0
                assertEqual(await getNumberOfTimesRefreshCalled(), 0);

                // get jwt data
                let testResponse2 = await fetch(`${BASE_URL}/update-jwt`, { method: "get" });
                let data2 = await testResponse2.json();
                assertEqual(data2.key, "łukasz 馬 / 马");
                assertEqual(await getNumberOfTimesRefreshCalled(), 1);

                // update jwt data
                let testResponse3 = await fetch(`${BASE_URL}/update-jwt`, {
                    method: "post",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ key1: " łukasz data1" })
                });
                let data3 = await testResponse3.json();
                assertEqual(data3.key1, " łukasz data1");
                assertEqual(data3.key, undefined);

                data = await supertokens.getJWTPayloadSecurely();
                assertEqual(data.key1, " łukasz data1");
                assertEqual(data.key, undefined);

                // get jwt data
                let testResponse4 = await fetch(`${BASE_URL}/update-jwt`, { method: "get" });
                let data4 = await testResponse4.json();
                assertEqual(data4.key1, " łukasz data1");
                assertEqual(data4.key, undefined);
            });
        } finally {
            await browser.close();
        }
    });

    //test custom headers are being sent when logged in and when not*****
    it("test with fetch that custom headers are being sent", async function() {
        await startST();
        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });
        try {
            const page = await browser.newPage();
            await page.goto(BASE_URL + "/index.html", { waitUntil: "load" });
            await page.addScriptTag({ path: `./bundle/bundle.js`, type: "text/javascript" });
            await page.evaluate(async () => {
                let BASE_URL = "http://localhost.org:8080";
                supertokens.init({
                    apiDomain: BASE_URL
                });
                let userId = "testing-supertokens-website";

                //send loing request
                let loginResponse = await fetch(`${BASE_URL}/login`, {
                    method: "post",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ userId })
                });
                assertEqual(await loginResponse.text(), userId);

                //send api request with custom headers and check that they are set
                let testResponse = await fetch(`${BASE_URL}/testing`, {
                    method: "post",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                        testing: "testValue"
                    }
                });

                // check that output is success
                assertEqual(await testResponse.text(), "success");
                //check that the custom headers are present
                assertEqual(await testResponse.headers.get("testing"), "testValue");

                //send logout request
                let logoutResponse = await fetch(`${BASE_URL}/logout`, {
                    method: "post",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ userId })
                });

                assertEqual(await logoutResponse.text(), "success");

                let testResponse2 = await fetch(`${BASE_URL}/testing`, {
                    method: "post",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                        testing: "testValue"
                    }
                });

                // check that output is success
                assertEqual(await testResponse2.text(), "success");
                //check that the custom headers are present
                assertEqual(await testResponse2.headers.get("testing"), "testValue");
            });
        } finally {
            await browser.close();
        }
    });

    //testing doesSessionExist works fine when user is logged in******
    it("test with fetch that doesSessionExist works fine when the user is logged in", async function() {
        await startST(5);
        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });
        try {
            const page = await browser.newPage();
            await page.goto(BASE_URL + "/index.html", { waitUntil: "load" });
            await page.addScriptTag({ path: `./bundle/bundle.js`, type: "text/javascript" });
            await page.evaluate(async () => {
                let BASE_URL = "http://localhost.org:8080";
                supertokens.init({
                    apiDomain: BASE_URL
                });
                let userId = "testing-supertokens-website";

                //send loing request
                let loginResponse = await fetch(`${BASE_URL}/login`, {
                    method: "post",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ userId })
                });
                assertEqual(await loginResponse.text(), userId);

                assertEqual(await supertokens.doesSessionExist(), true);
            });
        } finally {
            await browser.close();
        }
    });

    //session should not exist when user calls log out - use doesSessionExist & check localstorage is empty
    it("test with fetch session should not exist when user calls log out", async function() {
        await startST(5);
        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });
        try {
            const page = await browser.newPage();
            await page.goto(BASE_URL + "/index.html", { waitUntil: "load" });
            await page.addScriptTag({ path: `./bundle/bundle.js`, type: "text/javascript" });
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
                let loginResponse = await fetch(`${BASE_URL}/login`, {
                    method: "post",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ userId })
                });
                assertEqual(await loginResponse.text(), userId);

                assertEqual(await supertokens.doesSessionExist(), true);
                assertEqual(getAntiCSRFromCookie() !== null, true);

                let userIdFromToken = await supertokens.getUserId();
                assertEqual(userIdFromToken, userId);

                // send api request to logout
                let logoutResponse = await fetch(`${BASE_URL}/logout`, {
                    method: "post",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ userId })
                });

                assertEqual(await logoutResponse.text(), "success");
                assertEqual(await supertokens.doesSessionExist(), false);
                assertEqual(getAntiCSRFromCookie() === null, true);

                try {
                    await supertokens.getUserId();
                    throw new Error("test failed");
                } catch (err) {
                    assertEqual(err.message, "No session exists");
                }

                try {
                    await supertokens.getJWTPayloadSecurely();
                    throw new Error("test failed");
                } catch (err) {
                    assertEqual(err.message, "No session exists");
                }
            });
        } finally {
            await browser.close();
        }
    });

    // testing attemptRefreshingSession works fine******
    it("test with fetch that attemptRefreshingSession is working correctly", async function() {
        await startST(5);
        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });
        try {
            const page = await browser.newPage();
            await page.goto(BASE_URL + "/index.html", { waitUntil: "load" });
            await page.addScriptTag({ path: `./bundle/bundle.js`, type: "text/javascript" });
            await page.evaluate(async () => {
                let BASE_URL = "http://localhost.org:8080";
                supertokens.init({
                    apiDomain: BASE_URL
                });
                let userId = "testing-supertokens-website";

                // send api request to login
                let loginResponse = await fetch(`${BASE_URL}/login`, {
                    method: "post",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ userId })
                });
                assertEqual(await loginResponse.text(), userId);

                await delay(5);
                let attemptRefresh = await supertokens.attemptRefreshingSession();
                assertEqual(attemptRefresh, true);

                //check that the number of times the refresh API was called is 1
                assertEqual(await getNumberOfTimesRefreshCalled(), 1);

                let getSessionResponse = await fetch(`${BASE_URL}/`);
                assertEqual(await getSessionResponse.text(), userId);

                //check that the number of times the refresh API was called is still 1
                assertEqual(await getNumberOfTimesRefreshCalled(), 1);
            });
        } finally {
            await browser.close();
        }
    });

    // multiple API calls in parallel when access token is expired (100 of them) and only 1 refresh should be called*****
    it("test with fetch that multiple API calls in parallel when access token is expired, only 1 refresh should be called", async function() {
        await startST(15);
        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });
        try {
            const page = await browser.newPage();
            await page.goto(BASE_URL + "/index.html", { waitUntil: "load" });
            await page.addScriptTag({ path: `./bundle/bundle.js`, type: "text/javascript" });
            await page.evaluate(async () => {
                let BASE_URL = "http://localhost.org:8080";
                supertokens.init({
                    apiDomain: BASE_URL
                });
                let userId = "testing-supertokens-website";

                // send api request to login
                let loginResponse = await fetch(`${BASE_URL}/login`, {
                    method: "post",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ userId })
                });
                assertEqual(await loginResponse.text(), userId);
                assertEqual(await getNumberOfTimesRefreshCalled(), 0);

                // wait for 7 seconds so that the accesstoken expires
                await delay(17);

                let promises = [];
                let n = 100;

                // create an array of 100 get session promises
                for (let i = 0; i < n; i++) {
                    promises.push(
                        fetch(`${BASE_URL}/`, { method: "GET", headers: { "Cache-Control": "no-cache, private" } })
                    );
                }

                // send 100 get session requests
                let multipleGetSessionResponse = await Promise.all(promises);

                //check that reponse of all requests are success
                let noOfResponeSuccesses = 0;
                for (let i = 0; i < multipleGetSessionResponse.length; i++) {
                    assertEqual(await multipleGetSessionResponse[i].text(), userId);
                    noOfResponeSuccesses += 1;
                }

                //check that the number of times refresh is called is 1

                assertEqual(await getNumberOfTimesRefreshCalled(), 1);
                assertEqual(noOfResponeSuccesses, n);
            });
        } finally {
            await browser.close();
        }
    });

    // - Things should work if anti-csrf is disabled.******
    it("test with fetch that things should work correctly if anti-csrf is disabled", async function() {
        await startST(3, false);
        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });
        try {
            const page = await browser.newPage();
            await page.goto(BASE_URL + "/index.html", { waitUntil: "load" });
            await page.addScriptTag({ path: `./bundle/bundle.js`, type: "text/javascript" });
            await page.evaluate(async () => {
                let BASE_URL = "http://localhost.org:8080";
                supertokens.init({
                    apiDomain: BASE_URL
                });
                let userId = "testing-supertokens-website";

                // send api request to login
                let loginResponse = await fetch(`${BASE_URL}/login`, {
                    method: "post",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ userId })
                });
                assertEqual(await loginResponse.text(), userId);
                assertEqual(await supertokens.doesSessionExist(), true);
                assertEqual(await getNumberOfTimesRefreshCalled(), 0);

                await delay(5);

                let getSessionResponse = await fetch(`${BASE_URL}/`);

                assertEqual(await getSessionResponse.text(), userId);
                assertEqual(await getNumberOfTimesRefreshCalled(), 1);

                let logoutResponse = await fetch(`${BASE_URL}/logout`, {
                    method: "post",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ userId })
                });

                assertEqual(await supertokens.doesSessionExist(), false);
                assertEqual(await logoutResponse.text(), "success");
            });
        } finally {
            await browser.close();
        }
    });

    // if any API throws error, it gets propogated to the user properly (with and without interception)******
    it("test with fetch that if an api throws an error it gets propagated to the user with interception", async () => {
        await startST();
        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });
        try {
            const page = await browser.newPage();
            await page.goto(BASE_URL + "/index.html", { waitUntil: "load" });
            await page.addScriptTag({ path: "./bundle/bundle.js", type: "text/javascript" });
            await page.evaluate(async () => {
                let BASE_URL = "http://localhost.org:8080";
                supertokens.init({
                    apiDomain: BASE_URL
                });

                let val = await fetch(`${BASE_URL}/testError`);
                assertEqual(await val.text(), "test error message");
                assertEqual(val.status, 500);
            });
        } finally {
            await browser.close();
        }
    });

    // if any API throws error, it gets propogated to the user properly (with and without interception)******
    it("test with fetch that if an api throws an error it gets propagated to the user without interception", async () => {
        await startST();
        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });
        try {
            const page = await browser.newPage();
            await page.goto(BASE_URL + "/index.html", { waitUntil: "load" });
            await page.addScriptTag({ path: "./bundle/bundle.js", type: "text/javascript" });
            await page.evaluate(async () => {
                let BASE_URL = "http://localhost.org:8080";
                supertokens.init({
                    apiDomain: BASE_URL
                });

                let val = await fetch(`${BASE_URL}/testError`, {
                    method: "get"
                });
                assertEqual(await val.text(), "test error message");
                assertEqual(val.status, 500);
            });
        } finally {
            await browser.close();
        }
    });

    //    - Calling SuperTokens.init more than once works!*******
    it("test with fetch that calling SuperTokens.init more than once works", async () => {
        await startST();
        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });
        try {
            const page = await browser.newPage();
            await page.goto(BASE_URL + "/index.html", { waitUntil: "load" });
            await page.addScriptTag({ path: "./bundle/bundle.js", type: "text/javascript" });
            await page.evaluate(async () => {
                let BASE_URL = "http://localhost.org:8080";
                supertokens.init({
                    apiDomain: BASE_URL
                });
                supertokens.init({
                    apiDomain: BASE_URL
                });
                let userId = "testing-supertokens-website";

                let loginResponse = await fetch(`${BASE_URL}/login`, {
                    method: "post",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ userId })
                });

                assertEqual(await loginResponse.text(), userId);
                supertokens.init({
                    apiDomain: BASE_URL
                });

                let logoutResponse = await fetch(`${BASE_URL}/logout`, {
                    method: "post",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ userId })
                });

                assertEqual(await logoutResponse.text(), "success");

                //check that session does not exist
                assertEqual(await supertokens.doesSessionExist(), false);

                //check that login still works correctly
                loginResponse = await fetch(`${BASE_URL}/login`, {
                    method: "post",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ userId })
                });

                assertEqual(await loginResponse.text(), userId);
            });
        } finally {
            await browser.close();
        }
    });

    //If via interception, make sure that initially, just an endpoint is just hit twice in case of access token expiry*****
    it("test with fetch that if via interception, initially an endpoint is hit just twice in case of access token expiary", async () => {
        await startST(3);
        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });
        try {
            const page = await browser.newPage();
            await page.goto(BASE_URL + "/index.html", { waitUntil: "load" });
            await page.addScriptTag({ path: "./bundle/bundle.js", type: "text/javascript" });
            await page.evaluate(async () => {
                let BASE_URL = "http://localhost.org:8080";
                supertokens.init({
                    apiDomain: BASE_URL
                });
                let userId = "testing-supertokens-website";

                // send api request to login
                let loginResponse = await fetch(`${BASE_URL}/login`, {
                    method: "post",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ userId })
                });

                assertEqual(await loginResponse.text(), userId);

                //wait for 3 seconds such that the session expires
                await delay(5);

                let getSessionResponse = await fetch(`${BASE_URL}/`);
                assertEqual(await getSessionResponse.text(), userId);

                //check that the number of times getSession was called is 1
                assertEqual(await getNumberOfTimesGetSessionCalled(), 1);

                //check that the number of times refesh session was called is 1
                assertEqual(await getNumberOfTimesRefreshCalled(), 1);
            });
        } finally {
            await browser.close();
        }
    });

    //- If you make an api call without cookies(logged out) api throws session expired , then make sure that refresh token api is not getting called , get 401 as the output****
    it("test with fetch that an api call without cookies throws session expire, refresh api is not called and 401 is the output", async function() {
        await startST(5);
        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });
        try {
            const page = await browser.newPage();
            await page.goto(BASE_URL + "/index.html", { waitUntil: "load" });
            await page.addScriptTag({ path: "./bundle/bundle.js", type: "text/javascript" });
            await page.evaluate(async () => {
                let BASE_URL = "http://localhost.org:8080";
                supertokens.init({
                    apiDomain: BASE_URL
                });
                let userId = "testing-supertokens-website";

                let loginResponse = await fetch(`${BASE_URL}/login`, {
                    method: "post",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ userId })
                });

                assertEqual(await loginResponse.text(), userId);

                let logoutResponse = await fetch(`${BASE_URL}/logout`, {
                    method: "post",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ userId })
                });

                assertEqual(await logoutResponse.text(), "success");

                let getSessionResponse = await fetch(`${BASE_URL}/`);

                //check that the response to getSession without cookies is 401
                assertEqual(getSessionResponse.status, 401);

                assertEqual(await getNumberOfTimesRefreshCalled(), 0);
            });
        } finally {
            await browser.close();
        }
    });

    //    - If via interception, make sure that initially, just an endpoint is just hit once in case of access token NOT expiry*****
    it("test that via interception initially an endpoint is just hit once in case of valid access token", async function() {
        await startST(5);
        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });
        try {
            const page = await browser.newPage();
            await page.goto(BASE_URL + "/index.html", { waitUntil: "load" });
            await page.addScriptTag({ path: "./bundle/bundle.js", type: "text/javascript" });
            await page.evaluate(async () => {
                let BASE_URL = "http://localhost.org:8080";
                supertokens.init({
                    apiDomain: BASE_URL
                });
                let userId = "testing-supertokens-website";

                // send api request to login
                let loginResponse = await fetch(`${BASE_URL}/login`, {
                    method: "post",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ userId })
                });

                assertEqual(await loginResponse.text(), userId);

                let getSessionResponse = await fetch(`${BASE_URL}/`);
                assertEqual(await getSessionResponse.text(), userId);

                //check that the number of times getSession was called is 1
                assertEqual(await getNumberOfTimesGetSessionCalled(), 1);

                //check that the number of times refresh session was called is 0
                assertEqual(await getNumberOfTimesRefreshCalled(), 0);
            });
        } finally {
            await browser.close();
        }
    });

    //    - Interception should not happen when domain is not the one that they gave*******
    it("test with fetch interception should not happen when domain is not the one that they gave", async function() {
        await startST(5);
        AuthHttpRequest.init({
            apiDomain: BASE_URL
        });
        let userId = "testing-supertokens-website";

        // this is technically not doing interception, but it is equavalent to doing it since the inteceptor just calls the function below.
        await fetch(`https://www.google.com`);

        let verifyRequestState = await ProcessState.getInstance().waitForEvent(
            PROCESS_STATE.CALLING_INTERCEPTION_REQUEST,
            100
        );

        assert.deepEqual(verifyRequestState, undefined);

        let loginResponse = await fetch(`${BASE_URL}/login`, {
            method: "post",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ userId })
        });

        assert.deepEqual(await loginResponse.text(), userId);

        verifyRequestState = await ProcessState.getInstance().waitForEvent(
            PROCESS_STATE.CALLING_INTERCEPTION_REQUEST,
            5000
        );
        assert.notDeepEqual(verifyRequestState, undefined);
    });

    it("test with fetch interception should happen if api domain and website domain are the same and relative path is used", async function() {
        await startST(5);

        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });
        try {
            const page = await browser.newPage();
            await page.goto(BASE_URL + "/index.html", { waitUntil: "load" });
            await page.addScriptTag({ path: "./bundle/bundle.js", type: "text/javascript" });

            await page.evaluate(async () => {
                let BASE_URL = "http://localhost.org:8080";
                supertokens.init({
                    apiDomain: BASE_URL
                });
                let userId = "testing-supertokens-website";

                // send api request to login
                let loginResponse = await fetch(`/login`, {
                    method: "post",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ userId })
                });

                assertEqual(await loginResponse.text(), userId);

                assertEqual(await supertokens.doesSessionExist(), true);
            });
        } finally {
            await browser.close();
        }
    });

    it("test with fetch interception should not happen if api domain and website domain are different and relative path is used", async function() {
        await startST(5);

        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });
        try {
            const page = await browser.newPage();
            await page.goto(BASE_URL + "/index.html", { waitUntil: "load" });
            await page.addScriptTag({ path: "./bundle/bundle.js", type: "text/javascript" });

            await page.evaluate(async () => {
                let BASE_URL = "https://google.com";
                supertokens.init({
                    apiDomain: BASE_URL
                });
                let userId = "testing-supertokens-website";

                // send api request to login
                let loginResponse = await fetch(`/login`, {
                    method: "post",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ userId })
                });

                assertEqual(await loginResponse.text(), userId);

                assertEqual(document.cookie, "");
            });
        } finally {
            await browser.close();
        }
    });

    //cross domain login, userinfo, logout
    it("test with fetch cross domain", async () => {
        await startST(5);
        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });
        try {
            const page = await browser.newPage();
            await page.goto("http://localhost.org:8080/index.html", { waitUntil: "load" });
            await page.addScriptTag({ path: "./bundle/bundle.js", type: "text/javascript" });
            await page.evaluate(async () => {
                let BASE_URL = "http://localhost.org:8082";
                supertokens.init({
                    apiDomain: BASE_URL
                });
                let userId = "testing-supertokens-website";

                // send api request to login
                let loginResponse = await fetch(`${BASE_URL}/login`, {
                    method: "post",
                    credentials: "include",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ userId })
                });

                //check that the userId which is returned in the response is the same as the one we sent
                assertEqual(await loginResponse.text(), userId);

                // check that the session exists
                assertEqual(await supertokens.doesSessionExist(), true);

                // check that the number of times session refresh is called is zero
                assertEqual(await getNumberOfTimesRefreshCalled(BASE_URL), 0);

                //delay for 5 seconds so that we know accessToken expires

                await delay(5);
                // send a get session request , which should do a refresh session request
                let getSessionResponse = await fetch(`${BASE_URL}/`, {
                    method: "get",
                    credentials: "include"
                });

                // check that the getSession was successfull
                assertEqual(await getSessionResponse.text(), userId);

                // check that the refresh session was called only once
                assertEqual(await getNumberOfTimesRefreshCalled(BASE_URL), 1);

                // do logout
                let logoutResponse = await fetch(`${BASE_URL}/logout`, {
                    method: "post",
                    credentials: "include",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ userId })
                });
                assertEqual(await logoutResponse.text(), "success");

                //check that session does not exist
                assertEqual(await supertokens.doesSessionExist(), false);
            });
        } finally {
            await browser.close();
        }
    });

    //cross domain login, userinfo, logout
    it("test with fetch cross domain, auto add credentials", async () => {
        await startST(5);
        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });
        try {
            const page = await browser.newPage();
            await page.goto("http://localhost.org:8080/index.html", { waitUntil: "load" });
            await page.addScriptTag({ path: "./bundle/bundle.js", type: "text/javascript" });
            await page.evaluate(async () => {
                let BASE_URL = "http://localhost.org:8082";
                supertokens.init({
                    apiDomain: BASE_URL
                });
                let userId = "testing-supertokens-website";

                // send api request to login
                let loginResponse = await fetch(`${BASE_URL}/login`, {
                    method: "post",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ userId })
                });

                //check that the userId which is returned in the response is the same as the one we sent
                assertEqual(await loginResponse.text(), userId);

                // check that the session exists
                assertEqual(await supertokens.doesSessionExist(), true);

                // check that the number of times session refresh is called is zero
                assertEqual(await getNumberOfTimesRefreshCalled(BASE_URL), 0);

                //delay for 5 seconds so that we know accessToken expires

                await delay(5);
                // send a get session request , which should do a refresh session request
                let getSessionResponse = await fetch(`${BASE_URL}/`, {
                    method: "get"
                });

                // check that the getSession was successfull
                assertEqual(await getSessionResponse.text(), userId);

                // check that the refresh session was called only once
                assertEqual(await getNumberOfTimesRefreshCalled(BASE_URL), 1);

                // do logout
                let logoutResponse = await fetch(`${BASE_URL}/logout`, {
                    method: "post",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ userId })
                });
                assertEqual(await logoutResponse.text(), "success");

                //check that session does not exist
                assertEqual(await supertokens.doesSessionExist(), false);
            });
        } finally {
            await browser.close();
        }
    });

    //cross domain login, userinfo, logout
    it("test with fetch cross domain, no auto add credentials, fail", async () => {
        await startST(5);
        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });
        try {
            const page = await browser.newPage();
            await page.goto("http://localhost.org:8080/index.html", { waitUntil: "load" });
            await page.addScriptTag({ path: "./bundle/bundle.js", type: "text/javascript" });
            await page.evaluate(async () => {
                let BASE_URL = "http://localhost.org:8082";
                supertokens.init({
                    apiDomain: BASE_URL,
                    autoAddCredentials: false
                });
                let userId = "testing-supertokens-website";

                // send api request to login
                let loginResponse = await fetch(`${BASE_URL}/login`, {
                    method: "post",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ userId })
                });

                //check that the userId which is returned in the response is the same as the one we sent
                assertEqual(await loginResponse.text(), userId);

                // check that the session exists
                assertEqual(await supertokens.doesSessionExist(), true);

                // check that the number of times session refresh is called is zero
                assertEqual(await getNumberOfTimesRefreshCalled(BASE_URL), 0);

                //delay for 5 seconds so that we know accessToken expires

                await delay(5);

                let resp = await fetch(`${BASE_URL}/`, {
                    method: "get"
                });
                assertEqual(resp.status, 401);

                assertEqual(await supertokens.doesSessionExist(), false);

                await fetch(`${BASE_URL}/login`, {
                    method: "post",
                    credentials: "include",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ userId })
                });

                // send a get session request , which should do a refresh session request
                let getSessionResponse = await fetch(`${BASE_URL}/`, {
                    method: "get",
                    credentials: "include"
                });

                // check that the getSession was successfull
                assertEqual(await getSessionResponse.text(), userId);

                // check that the refresh session was called only once
                assertEqual(await getNumberOfTimesRefreshCalled(BASE_URL), 0);

                // do logout
                let logoutResponse = await fetch(`${BASE_URL}/logout`, {
                    method: "post",
                    credentials: "include",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ userId })
                });
                assertEqual(await logoutResponse.text(), "success");

                //check that session does not exist
                assertEqual(await supertokens.doesSessionExist(), false);
            });
        } finally {
            await browser.close();
        }
    });

    it("test with fetch that if multiple interceptors are there, they should all work", async function() {
        await startST(5);
        AuthHttpRequest.init({
            apiDomain: BASE_URL
        });
        let userId = "testing-supertokens-website";

        let myFetch = async (url, config) => {
            let testConfig = config;
            testConfig = {
                ...testConfig,
                headers: {
                    ...testConfig.headers,
                    interceptorHeader1: "value1",
                    interceptorHeader2: "value2"
                }
            };
            let response = await fetch(url, testConfig);
            let requestValue = await response.text();
            response = {
                ...response,
                headers: {
                    ...response.headers,
                    doInterception3: "value3",
                    doInterception4: "value4"
                },
                body: {
                    key: requestValue
                }
            };
            return response;
        };

        let multipleInterceptorResponse = await myFetch(`${BASE_URL}/multipleInterceptors`, {
            method: "post",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                doMultipleInterceptors: "true"
            },
            body: JSON.stringify({ userId })
        });
        assert.deepEqual(multipleInterceptorResponse.body.key, "success");
        assert.notDeepEqual(multipleInterceptorResponse.headers.doInterception3, undefined);
        assert.notDeepEqual(multipleInterceptorResponse.headers.doInterception4, undefined);
    });

    it("fetch check sessionDoes exist calls refresh API just once", async function() {
        await startST();
        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });
        try {
            const page = await browser.newPage();
            await page.goto(BASE_URL + "/index.html", { waitUntil: "load" });
            await page.addScriptTag({ path: `./bundle/bundle.js`, type: "text/javascript" });
            await page.evaluate(async () => {
                let BASE_URL = "http://localhost.org:8080";
                supertokens.init({
                    apiDomain: BASE_URL
                });

                let userId = "testing-supertokens-website";

                // check document cookie = ""
                assertEqual(document.cookie, "");

                // call sessionDoesExist
                assertEqual(await supertokens.doesSessionExist(), false);

                // check refresh API was called once + document.cookie has removed
                assertEqual(await getNumberOfTimesRefreshAttempted(), 1);
                assertEqual(await getNumberOfTimesRefreshCalled(), 0);
                assertEqual(document.cookie, "sIRTFrontend=remove");

                // call sessionDoesExist
                assertEqual(await supertokens.doesSessionExist(), false);
                // check refresh API not called
                assertEqual(await getNumberOfTimesRefreshAttempted(), 1);
                assertEqual(await getNumberOfTimesRefreshCalled(), 0);
                assertEqual(document.cookie, "sIRTFrontend=remove");

                await fetch(`/login`, {
                    method: "post",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ userId })
                });

                // call sessionDoesExist
                assertEqual(await supertokens.doesSessionExist(), true);
                // check refresh API not called
                assertEqual(await getNumberOfTimesRefreshAttempted(), 1);
                assertEqual(await getNumberOfTimesRefreshCalled(), 0);
                assertEqual(document.cookie !== "sIRTFrontend=remove", true);
            });
        } finally {
            await browser.close();
        }
    });

    it("fetch check clearing all frontend set cookies still works (without anti-csrf)", async function() {
        await startST(3, false);
        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });
        try {
            const page = await browser.newPage();
            await page.goto(BASE_URL + "/index.html", { waitUntil: "load" });
            await page.addScriptTag({ path: `./bundle/bundle.js`, type: "text/javascript" });
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
                assertEqual(document.cookie, "");

                await fetch(`/login`, {
                    method: "post",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ userId })
                });

                // call sessionDoesExist
                assertEqual(await supertokens.doesSessionExist(), true);
                // check refresh API not called
                assertEqual(await getNumberOfTimesRefreshAttempted(), 1); // it's one here since it gets called during login..
                assertEqual(await getNumberOfTimesRefreshCalled(), 0);
                assertEqual(document.cookie !== "sIRTFrontend=remove", true);

                // clear all cookies
                deleteAllCookies();
                // call sessionDoesExist (returns true) + call to refresh
                assertEqual(await supertokens.doesSessionExist(), true);
                assertEqual(await getNumberOfTimesRefreshAttempted(), 2);
                assertEqual(await getNumberOfTimesRefreshCalled(), 1);

                // call sessionDoesExist (returns true) + no call to refresh
                assertEqual(await supertokens.doesSessionExist(), true);
                assertEqual(await getNumberOfTimesRefreshAttempted(), 2);
                assertEqual(await getNumberOfTimesRefreshCalled(), 1);
            });
        } finally {
            await browser.close();
        }
    });

    it("fetch check clearing all frontend set cookies logs our user (with anti-csrf)", async function() {
        await startST();
        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });
        try {
            const page = await browser.newPage();
            await page.goto(BASE_URL + "/index.html", { waitUntil: "load" });
            await page.addScriptTag({ path: `./bundle/bundle.js`, type: "text/javascript" });
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
                assertEqual(document.cookie, "");

                await fetch(`/login`, {
                    method: "post",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ userId })
                });

                // call sessionDoesExist
                assertEqual(await supertokens.doesSessionExist(), true);
                // check refresh API not called
                assertEqual(await getNumberOfTimesRefreshAttempted(), 1); // it's one here since it gets called during login..
                assertEqual(await getNumberOfTimesRefreshCalled(), 0);
                assertEqual(document.cookie !== "sIRTFrontend=remove", true);

                // clear all cookies
                deleteAllCookies();
                // call sessionDoesExist (returns false) + call to refresh
                assertEqual(await supertokens.doesSessionExist(), false);
                assertEqual(await getNumberOfTimesRefreshAttempted(), 2);
                assertEqual(await getNumberOfTimesRefreshCalled(), 0);

                // call sessionDoesExist (returns false) + no call to refresh
                assertEqual(await supertokens.doesSessionExist(), false);
                assertEqual(await getNumberOfTimesRefreshAttempted(), 2);
                assertEqual(await getNumberOfTimesRefreshCalled(), 0);
            });
        } finally {
            await browser.close();
        }
    });

    it("test that unauthorised event is not fired on initial page load", async function() {
        await startST();
        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });
        try {
            const page = await browser.newPage();
            let consoleLogs = [];
            page.on("console", message => {
                if (message.text().startsWith("ST_")) {
                    consoleLogs.push(message.text());
                }
            });
            await page.goto(BASE_URL + "/index.html", { waitUntil: "load" });
            await page.addScriptTag({ path: `./bundle/bundle.js`, type: "text/javascript" });
            await page.evaluate(async () => {
                let BASE_URL = "http://localhost.org:8080";
                supertokens.init({
                    apiDomain: BASE_URL,
                    onHandleEvent: event => {
                        console.log("ST_" + event.action);
                    }
                });
                let userId = "testing-supertokens-website";

                let loginResponse = await fetch(`${BASE_URL}/login`, {
                    method: "post",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ userId })
                });

                assertEqual(await loginResponse.text(), userId);
            });
            assert(consoleLogs.length === 1);
            assert(consoleLogs[0] === "ST_SESSION_CREATED");
        } finally {
            await browser.close();
        }
    });

    it("test that unauthorised event is fired when calling protected route without a session", async function() {
        await startST();
        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });
        try {
            const page = await browser.newPage();
            let consoleLogs = [];
            page.on("console", message => {
                if (message.text().startsWith("ST_")) {
                    consoleLogs.push(message.text());
                }
            });
            await page.goto(BASE_URL + "/index.html", { waitUntil: "load" });
            await page.addScriptTag({ path: `./bundle/bundle.js`, type: "text/javascript" });
            await page.evaluate(async () => {
                let BASE_URL = "http://localhost.org:8080";
                supertokens.init({
                    apiDomain: BASE_URL,
                    onHandleEvent: event => {
                        console.log(`ST_${event.action}:${JSON.stringify(event)}`);
                    }
                });
                let response = await fetch(`${BASE_URL}/`);
                assertEqual(response.status, 401);
            });

            assert(consoleLogs.length === 1);

            const eventName = "ST_UNAUTHORISED";

            assert(consoleLogs[0].startsWith(eventName));
            const parsedEvent = JSON.parse(consoleLogs[0].substr(eventName.length + 1));
            assert(parsedEvent.sessionExpiredOrRevoked === false);
        } finally {
            await browser.close();
        }
    });

    it("test that after login, and clearing all cookies, if we query a protected route, it fires unauthorised event", async function() {
        await startST();
        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });
        try {
            const page = await browser.newPage();
            let consoleLogs = [];
            page.on("console", message => {
                if (message.text().startsWith("ST_")) {
                    consoleLogs.push(message.text());
                }
            });
            await page.goto(BASE_URL + "/index.html", { waitUntil: "load" });
            await page.addScriptTag({ path: `./bundle/bundle.js`, type: "text/javascript" });
            await page.evaluate(async () => {
                let BASE_URL = "http://localhost.org:8080";
                supertokens.init({
                    apiDomain: BASE_URL,
                    onHandleEvent: event => {
                        console.log(`ST_${event.action}:${JSON.stringify(event)}`);
                    }
                });
                let userId = "testing-supertokens-website";

                let loginResponse = await fetch(`${BASE_URL}/login`, {
                    method: "post",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ userId })
                });

                assertEqual(await loginResponse.text(), userId);
            });

            const client = await page.target().createCDPSession();
            await client.send("Network.clearBrowserCookies");
            await client.send("Network.clearBrowserCache");
            let cookies = await page.cookies();
            assert(cookies.length === 0);

            await page.evaluate(async () => {
                let BASE_URL = "http://localhost.org:8080";
                let response = await fetch(`${BASE_URL}/`);
                assertEqual(response.status, 401);
            });

            assert(consoleLogs.length === 2);

            assert(consoleLogs[0].startsWith("ST_SESSION_CREATED"));

            const eventName = "ST_UNAUTHORISED";
            assert(consoleLogs[1].startsWith(eventName));
            const parsedEvent = JSON.parse(consoleLogs[1].substr(eventName.length + 1));
            assert(parsedEvent.sessionExpiredOrRevoked === false);
        } finally {
            await browser.close();
        }
    });

    it("test that after login, and clearing only httpOnly cookies, if we query a protected route, it fires unauthorised event", async function() {
        await startST();
        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });
        try {
            const page = await browser.newPage();
            let consoleLogs = [];
            page.on("console", message => {
                if (message.text().startsWith("ST_")) {
                    consoleLogs.push(message.text());
                }
            });
            await page.goto(BASE_URL + "/index.html", { waitUntil: "load" });
            await page.addScriptTag({ path: `./bundle/bundle.js`, type: "text/javascript" });
            await page.evaluate(async () => {
                let BASE_URL = "http://localhost.org:8080";
                supertokens.init({
                    apiDomain: BASE_URL,
                    onHandleEvent: event => {
                        console.log(`ST_${event.action}:${JSON.stringify(event)}`);
                    }
                });
                let userId = "testing-supertokens-website";

                let loginResponse = await fetch(`${BASE_URL}/login`, {
                    method: "post",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ userId })
                });

                assertEqual(await loginResponse.text(), userId);
            });

            let originalCookies = (await page.cookies()).filter(
                c => c.name === "sFrontToken" || c.name === "sIRTFrontend" || c.name === "sAntiCsrf"
            );

            const client = await page.target().createCDPSession();
            await client.send("Network.clearBrowserCookies");
            await client.send("Network.clearBrowserCache");

            await page.setCookie(...originalCookies);
            let cookies = await page.cookies();
            assert(cookies.length === 3);

            await page.evaluate(async () => {
                let BASE_URL = "http://localhost.org:8080";
                let response = await fetch(`${BASE_URL}/`);
                assertEqual(response.status, 401);
            });

            assert(consoleLogs.length === 2);

            assert(consoleLogs[0].startsWith("ST_SESSION_CREATED"));

            const eventName = "ST_UNAUTHORISED";
            assert(consoleLogs[1].startsWith(eventName));
            const parsedEvent = JSON.parse(consoleLogs[1].substr(eventName.length + 1));
            assert(parsedEvent.sessionExpiredOrRevoked === true);
        } finally {
            await browser.close();
        }
    });

    it("refresh session with invalid tokens should clear all cookies", async function() {
        await startST();
        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });
        try {
            const page = await browser.newPage();
            await page.goto(BASE_URL + "/index.html", { waitUntil: "load" });
            await page.addScriptTag({ path: `./bundle/bundle.js`, type: "text/javascript" });
            await page.evaluate(async () => {
                let BASE_URL = "http://localhost.org:8080";
                supertokens.init({
                    apiDomain: BASE_URL
                });
                let userId = "testing-supertokens-website";
                let loginResponse = await fetch(`${BASE_URL}/login`, {
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
                await fetch(`${BASE_URL}/logout`, { method: "POST" });
            });

            // we set the old cookies without the access token
            originalCookies = originalCookies.filter(c => c.name !== "sAccessToken");
            await page.setCookie(...originalCookies);

            // now we expect a 401.
            await page.evaluate(async () => {
                let BASE_URL = "http://localhost.org:8080";
                let resp = await fetch(`${BASE_URL}/`, { method: "GET" });
                assertEqual(resp.status, 401);
            });

            // and we assert that the only cookie that exists is the sIRTFrontend with the value of "remove"
            let newCookies = (await page._client.send("Network.getAllCookies")).cookies;

            assert(newCookies.length === 1);
            assert(newCookies[0].name === "sIRTFrontend" && newCookies[0].value === "remove");
        } finally {
            await browser.close();
        }
    });
});
