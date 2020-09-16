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
let { AntiCsrfToken } = require("../index.js");
let { default: AuthHttpRequestFetch } = require("../lib/build/index");
let { default: AuthHttpRequest } = require("../axios.js");
let assert = require("assert");
let {
    delay,
    checkIfIdRefreshIsCleared,
    getNumberOfTimesRefreshCalled,
    startST,
    getNumberOfTimesGetSessionCalled,
    BASE_URL,
    BASE_URL_FOR_ST
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
        AuthHttpRequest.initCalled = false;
        global.document = {};
        ProcessState.getInstance().reset();
        let instance = axios.create();
        await instance.post(BASE_URL_FOR_ST + "/beforeeach");
        await instance.post("http://localhost.org:8082/beforeeach"); // for cross domain
        await instance.post(BASE_URL + "/beforeeach");
    });

    it("testing getDomain", async function() {
        AuthHttpRequestFetch.init({
            refreshTokenUrl: `https://hello.com/refresh`,
            viaInterceptor: false
        });
        assert.strictEqual(AuthHttpRequestFetch.getRefreshURLDomain(), "https://hello.com");
    });

    it("checking in fetch that methods exists", function(done) {
        assert.strictEqual(typeof AuthHttpRequestFetch.doRequest, "function");
        assert.strictEqual(typeof AuthHttpRequestFetch.attemptRefreshingSession, "function");
        assert.strictEqual(typeof AuthHttpRequestFetch.get, "function");
        assert.strictEqual(typeof AuthHttpRequestFetch.post, "function");
        assert.strictEqual(typeof AuthHttpRequestFetch.delete, "function");
        assert.strictEqual(typeof AuthHttpRequestFetch.put, "function");
        done();
    });

    it("testing with fetch for init check in doRequest", async function() {
        let failed = false;
        try {
            await AuthHttpRequestFetch.doRequest(async () => {});
            failed = true;
        } catch (err) {}

        if (failed) {
            throw Error("test failed");
        }
    });

    it("testing with fetch for init check in attemptRefreshingSession", async function() {
        let failed = false;
        try {
            await AuthHttpRequestFetch.attemptRefreshingSession();
            failed = true;
        } catch (err) {}

        if (failed) {
            throw Error("test failed");
        }
    });

    it("testing with fetch api methods without config", async function() {
        AuthHttpRequestFetch.init({
            refreshTokenUrl: `${BASE_URL}/refresh`,
            viaInterceptor: false
        });

        let getResponse = await AuthHttpRequestFetch.get(`${BASE_URL}/testing`);
        let postResponse = await AuthHttpRequestFetch.post(`${BASE_URL}/testing`);
        let deleteResponse = await AuthHttpRequestFetch.delete(`${BASE_URL}/testing`);
        let putResponse = await AuthHttpRequestFetch.put(`${BASE_URL}/testing`);
        let doRequestResponse = await AuthHttpRequestFetch.fetch(`${BASE_URL}/testing`, { method: "GET" });
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
        AuthHttpRequestFetch.init({
            refreshTokenUrl: `${BASE_URL}/refresh`,
            viaInterceptor: false
        });

        let testing = "testing";
        let getResponse = await AuthHttpRequestFetch.get(`${BASE_URL}/${testing}`, { headers: { testing } });
        let postResponse = await fetch(`${BASE_URL}/${testing}`, { method: "post", headers: { testing } });
        let deleteResponse = await AuthHttpRequestFetch.delete(`${BASE_URL}/${testing}`, { headers: { testing } });
        let putResponse = await AuthHttpRequestFetch.put(`${BASE_URL}/${testing}`, { headers: { testing } });
        let doRequestResponse1 = await fetch(`${BASE_URL}/${testing}`, {
            method: "GET",
            headers: { testing }
        });
        let doRequestResponse2 = await AuthHttpRequestFetch.fetch(`${BASE_URL}/${testing}`, {
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
        AuthHttpRequestFetch.init({
            refreshTokenUrl: `${BASE_URL}/refresh`,
            viaInterceptor: false
        });

        let getResponse = await AuthHttpRequestFetch.get(`${BASE_URL}/fail`);
        let postResponse = await AuthHttpRequestFetch.post(`${BASE_URL}/fail`);
        let deleteResponse = await AuthHttpRequestFetch.delete(`${BASE_URL}/fail`);
        let putResponse = await AuthHttpRequestFetch.put(`${BASE_URL}/fail`);
        let doRequestResponse1 = await AuthHttpRequestFetch.fetch(`${BASE_URL}/fail`, { method: "GET" });
        let doRequestResponse2 = await AuthHttpRequestFetch.fetch(`${BASE_URL}/fail`, { method: "GET" });
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
                supertokens.fetch.init({
                    refreshTokenUrl: `${BASE_URL}/refresh`
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

                //delay for 3 seconds for access token validity expiry
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
    //             supertokens.fetch.init({
    //                 refreshTokenUrl: `${BASE_URL}/refresh`
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
    //             let data = await supertokens.fetch.getJWTPayloadSecurely();
    //             assertEqual(await getNumberOfTimesRefreshCalled(), 1);
    //             assertEqual(data.key === "data", true);

    //             let data2 = await supertokens.fetch.getJWTPayloadSecurely();
    //             assertEqual(data2.key === "data", true);
    //             assertEqual(await getNumberOfTimesRefreshCalled(), 1);
    //         });
    //     } finally {
    //         await browser.close();
    //     }
    // });

    it("test update jwt data  with fetch", async function() {
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
                supertokens.fetch.init({
                    refreshTokenUrl: `${BASE_URL}/refresh`
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

                try {
                    // TODO: remove try catch
                    let data = await supertokens.fetch.getJWTPayloadSecurely();
                    assertEqual(Object.keys(data).length, 0);
                } catch (ignored) {}

                // update jwt data
                let testResponse1 = await fetch(`${BASE_URL}/update-jwt`, {
                    method: "post",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ key: "data" })
                });
                let data1 = await testResponse1.json();
                assertEqual(data1.key, "data");

                try {
                    // TODO: remove try catch
                    data = await supertokens.fetch.getJWTPayloadSecurely();
                    assertEqual(data.key, "data");
                } catch (ignored) {}

                // get jwt data
                let testResponse2 = await fetch(`${BASE_URL}/update-jwt`, { method: "get" });
                let data2 = await testResponse2.json();
                assertEqual(data2.key, "data");

                // update jwt data
                let testResponse3 = await fetch(`${BASE_URL}/update-jwt`, {
                    method: "post",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ key1: "data1" })
                });
                let data3 = await testResponse3.json();
                assertEqual(data3.key1, "data1");
                assertEqual(data3.key, undefined);

                try {
                    // TODO: remove try catch
                    data = await supertokens.fetch.getJWTPayloadSecurely();
                    assertEqual(data.key1, "data1");
                    assertEqual(data.key, undefined);
                } catch (ignored) {}

                // get jwt data
                let testResponse4 = await fetch(`${BASE_URL}/update-jwt`, { method: "get" });
                let data4 = await testResponse4.json();
                assertEqual(data4.key1, "data1");
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
                supertokens.fetch.init({
                    refreshTokenUrl: `${BASE_URL}/refresh`
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
                supertokens.fetch.init({
                    refreshTokenUrl: `${BASE_URL}/refresh`
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

                assertEqual(await supertokens.fetch.doesSessionExist(), true);
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
                supertokens.fetch.init({
                    refreshTokenUrl: `${BASE_URL}/refresh`
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

                assertEqual(await supertokens.fetch.doesSessionExist(), true);
                assertEqual(getAntiCSRFromCookie() !== null, true);
                try {
                    // TODO: remove this try catch after all drivers have implemented front-token
                    let userIdFromToken = supertokens.fetch.getUserId();
                    assertEqual(userIdFromToken, userId);
                } catch (ignored) {}

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
                assertEqual(await supertokens.fetch.doesSessionExist(), false);
                assertEqual(getAntiCSRFromCookie() === null, true);

                try {
                    supertokens.fetch.getUserId();
                    throw new Error("test failed");
                } catch (err) {
                    assertEqual(err.message, "No session exists");
                }

                try {
                    await supertokens.fetch.getJWTPayloadSecurely();
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
                supertokens.fetch.init({
                    refreshTokenUrl: `${BASE_URL}/refresh`
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
                let attemptRefresh = await supertokens.fetch.attemptRefreshingSession();
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
                supertokens.fetch.init({
                    refreshTokenUrl: `${BASE_URL}/refresh`
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
                supertokens.fetch.init({
                    refreshTokenUrl: `${BASE_URL}/refresh`
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
                assertEqual(await supertokens.fetch.doesSessionExist(), true);
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

                assertEqual(await supertokens.fetch.doesSessionExist(), false);
                assertEqual(await logoutResponse.text(), "success");
            });
        } finally {
            await browser.close();
        }
    });

    // device info tests******
    it("test with fetch that device info is sent", async function() {
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
                supertokens.fetch.init({
                    refreshTokenUrl: `${BASE_URL}/refresh`
                });
                let userId = "testing-supertokens-website";

                // send request to check if deviceInfo is beinf added to headers
                let deviceInfoIsAdded = await fetch(`${BASE_URL}/checkDeviceInfo`);

                let result = await deviceInfoIsAdded.text();
                result = result === "1" ? "true" : result;
                assertEqual(result, "true");
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
                supertokens.fetch.init({
                    refreshTokenUrl: `${BASE_URL}/refresh`
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
                supertokens.fetch.init({
                    refreshTokenUrl: `${BASE_URL}/refresh`,
                    viaInterceptor: false
                });

                let val = await supertokens.fetch.get(`${BASE_URL}/testError`);
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
                supertokens.fetch.init({
                    refreshTokenUrl: `${BASE_URL}/refresh`
                });
                supertokens.fetch.init({
                    refreshTokenUrl: `${BASE_URL}/refresh`
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
                supertokens.fetch.init({
                    refreshTokenUrl: `${BASE_URL}/refresh`,
                    viaInterceptor: true
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
                assertEqual(await supertokens.fetch.doesSessionExist(), false);

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
                supertokens.fetch.init({
                    refreshTokenUrl: `${BASE_URL}/refresh`,
                    viaInterceptor: true
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
                supertokens.fetch.init({
                    refreshTokenUrl: `${BASE_URL}/refresh`,
                    viaInterceptor: true
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
                supertokens.fetch.init({
                    refreshTokenUrl: `${BASE_URL}/refresh`,
                    viaInterceptor: true
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
        AuthHttpRequestFetch.init({
            refreshTokenUrl: `${BASE_URL}/refresh`,
            viaInterceptor: true
        });
        let userId = "testing-supertokens-website";

        // this is technically not doing interception, but it is equavalent to doing it since the inteceptor just calls the function below.
        await AuthHttpRequestFetch.fetch(`https://www.google.com`);

        let verifyRequestState = await ProcessState.getInstance().waitForEvent(
            PROCESS_STATE.CALLING_INTERCEPTION_REQUEST,
            100
        );

        assert.deepEqual(verifyRequestState, undefined);

        let loginResponse = await AuthHttpRequestFetch.fetch(`${BASE_URL}/login`, {
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
                supertokens.fetch.init({
                    refreshTokenUrl: `${BASE_URL}/refresh`,
                    viaInterceptor: true
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
                assertEqual(await supertokens.fetch.doesSessionExist(), true);

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
                assertEqual(await supertokens.fetch.doesSessionExist(), false);
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
                supertokens.fetch.init({
                    refreshTokenUrl: `${BASE_URL}/refresh`,
                    viaInterceptor: true
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
                assertEqual(await supertokens.fetch.doesSessionExist(), true);

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
                assertEqual(await supertokens.fetch.doesSessionExist(), false);
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
                supertokens.fetch.init({
                    refreshTokenUrl: `${BASE_URL}/refresh`,
                    viaInterceptor: true,
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
                assertEqual(await supertokens.fetch.doesSessionExist(), true);

                // check that the number of times session refresh is called is zero
                assertEqual(await getNumberOfTimesRefreshCalled(BASE_URL), 0);

                //delay for 5 seconds so that we know accessToken expires

                await delay(5);

                let resp = await fetch(`${BASE_URL}/`, {
                    method: "get"
                });
                assertEqual(resp.status, 401);

                assertEqual(await supertokens.axios.doesSessionExist(), false);

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
                assertEqual(await supertokens.fetch.doesSessionExist(), false);
            });
        } finally {
            await browser.close();
        }
    });

    it("test with fetch that if multiple interceptors are there, they should all work", async function() {
        await startST(5);
        AuthHttpRequestFetch.init({
            refreshTokenUrl: `${BASE_URL}/refresh`,
            viaInterceptor: true
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
            let response = await AuthHttpRequestFetch.fetch(url, testConfig);
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
});
