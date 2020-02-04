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
let { default: AuthHttpRequest } = require("../axios.js");
let assert = require("assert");
let {
    delay,
    checkIfIdRefreshIsCleared,
    getNumberOfTimesRefreshCalled,
    startST,
    getNumberOfTimesGetSessionCalled
} = require("./utils");
const { spawn } = require("child_process");
let { ProcessState, PROCESS_STATE } = require("../lib/build/processState");

const BASE_URL = "http://localhost:8080";
AuthHttpRequest.makeSuper(axios);

/* TODO: 
    - device info tests******
    - multiple API calls in parallel when access token is expired (100 of them) and only 1 refresh should be called*****
    - session should not exist when user calls log out - use doesSessionExist & check localstorage is empty*****
    - session should not exist when user's session fully expires - use doesSessionExist & check localstorage is empty
    - while logged in, test that APIs that there is proper change in id refresh cookie
    - tests APIs that don't require authentication work after logout - with-credentials don't get sent.
    - test custom headers are being sent when logged in and when not*****
    - if not logged in, test that API that requires auth throws session expired
    - test that calling makeSuper many times is not a problem******
    - if any API throws error, it gets propogated to the user properly (with and without interception)******
    - if multiple interceptors are there, they should all work
    - testing attemptRefreshingSession works fine******
    - testing doesSessionExist works fine when user is logged in******
    - Test everything without and without interception
    - If user provides withCredentials as false or whatever, then app should not add it
    - Interception should not happen when domain is not the one that they gave*******
    - Calling SuperTokens.init more than once works!*******
    - Cross origin API requests to API that requires Auth
    - Cross origin API request to APi that doesn't require auth
    - Proper change in anti-csrf token once access token resets
    - User passed config should be sent as well******
    - Refresh API custom headers are working
    - Things should work if anti-csrf is disabled.******
    - If via interception, make sure that initially, just an endpoint is just hit once in case of access token expiry*****
    - If you make an api call without cookies(logged out) api throws session expired , then make sure that refresh token api is not getting called , get 440 as the output****
*/
describe("Axios AuthHttpRequest class tests", function() {
    jsdom({
        url: "http://localhost"
    });

    before(async function() {
        spawn("./test/startServer", [process.env.INSTALL_PATH]);
        await new Promise(r => setTimeout(r, 1000));
    });

    after(async function() {
        let instance = axios.create();
        await instance.post(BASE_URL + "/after");
        try {
            await instance.get(BASE_URL + "/stop");
        } catch (err) {}
    });

    beforeEach(async function() {
        AuthHttpRequest.initCalled = false;
        global.document = {};
        ProcessState.getInstance().reset();
        let instance = axios.create();
        await instance.post(BASE_URL + "/beforeeach");
    });

    it("checking that methods exists", function(done) {
        assert.strictEqual(typeof AuthHttpRequest.doRequest, "function");
        assert.strictEqual(typeof AuthHttpRequest.attemptRefreshingSession, "function");
        assert.strictEqual(typeof AuthHttpRequest.get, "function");
        assert.strictEqual(typeof AuthHttpRequest.post, "function");
        assert.strictEqual(typeof AuthHttpRequest.delete, "function");
        assert.strictEqual(typeof AuthHttpRequest.put, "function");
        done();
    });

    it("testing for init check in doRequest", async function() {
        let failed = false;
        try {
            await AuthHttpRequest.doRequest(async () => {});
            failed = true;
        } catch (err) {}

        if (failed) {
            throw Error("test failed");
        }
    });

    it("testing for init check in attemptRefreshingSession", async function() {
        let failed = false;
        try {
            await AuthHttpRequest.attemptRefreshingSession();
            failed = true;
        } catch (err) {}

        if (failed) {
            throw Error("test failed");
        }
    });

    it("testing api methods without config", async function() {
        AuthHttpRequest.init(`${BASE_URL}/refresh`);

        let getResponse = await AuthHttpRequest.get(`${BASE_URL}/testing`);
        let postResponse = await AuthHttpRequest.post(`${BASE_URL}/testing`);
        let deleteResponse = await AuthHttpRequest.delete(`${BASE_URL}/testing`);
        let putResponse = await AuthHttpRequest.put(`${BASE_URL}/testing`);
        let doRequestResponse = await AuthHttpRequest.axios({ method: "GET", url: `${BASE_URL}/testing` });
        getResponse = await getResponse.data;
        putResponse = await putResponse.data;
        postResponse = await postResponse.data;
        deleteResponse = await deleteResponse.data;
        doRequestResponse = await doRequestResponse.data;
        let expectedResponse = "success";

        assert.strictEqual(getResponse, expectedResponse);
        assert.strictEqual(putResponse, expectedResponse);
        assert.strictEqual(postResponse, expectedResponse);
        assert.strictEqual(deleteResponse, expectedResponse);
        assert.strictEqual(doRequestResponse, expectedResponse);
    });

    it("testing api methods with config", async function() {
        AuthHttpRequest.init(`${BASE_URL}/refresh`, 440);

        let testing = "testing";
        let getResponse = await AuthHttpRequest.get(`${BASE_URL}/${testing}`, { headers: { testing } });
        let postResponse = await axios.post(`${BASE_URL}/${testing}`, undefined, {
            headers: { testing }
        });
        let deleteResponse = await AuthHttpRequest.delete(`${BASE_URL}/${testing}`, { headers: { testing } });
        let putResponse = await axios.put(`${BASE_URL}/${testing}`, undefined, { headers: { testing } });
        let doRequestResponse1 = await AuthHttpRequest.axios({
            url: `${BASE_URL}/${testing}`,
            method: "GET",
            headers: { testing }
        });
        let doRequestResponse2 = await axios({
            url: `${BASE_URL}/${testing}`,
            method: "GET",
            headers: { testing }
        });
        let getResponseHeader = getResponse.headers[testing];
        getResponse = await getResponse.data;
        let putResponseHeader = putResponse.headers[testing];
        putResponse = await putResponse.data;
        let postResponseHeader = postResponse.headers[testing];
        postResponse = await postResponse.data;
        let deleteResponseHeader = deleteResponse.headers[testing];
        deleteResponse = await deleteResponse.data;
        let doRequestResponseHeader1 = doRequestResponse1.headers[testing];
        doRequestResponse1 = await doRequestResponse1.data;
        let doRequestResponseHeader2 = doRequestResponse2.headers[testing];
        doRequestResponse2 = await doRequestResponse2.data;
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

    it("testing api methods that doesn't exists", async function() {
        AuthHttpRequest.init(`${BASE_URL}/refresh`, 440);
        let expectedStatusCode = 404;
        try {
            await AuthHttpRequest.get(`${BASE_URL}/fail`);
            throw Error();
        } catch (err) {
            if (err.response !== undefined) {
                assert.strictEqual(err.response.status, expectedStatusCode);
            } else {
                throw Error("test failed!!!");
            }
        }
        try {
            await AuthHttpRequest.post(`${BASE_URL}/fail`);
            throw Error();
        } catch (err) {
            if (err.response !== undefined) {
                assert.strictEqual(err.response.status, expectedStatusCode);
            } else {
                throw Error("test failed!!!");
            }
        }
        try {
            await AuthHttpRequest.delete(`${BASE_URL}/fail`);
            throw Error();
        } catch (err) {
            if (err.response !== undefined) {
                assert.strictEqual(err.response.status, expectedStatusCode);
            } else {
                throw Error("test failed!!!");
            }
        }
        try {
            await AuthHttpRequest.put(`${BASE_URL}/fail`);
            throw Error();
        } catch (err) {
            if (err.response !== undefined) {
                assert.strictEqual(err.response.status, expectedStatusCode);
            } else {
                throw Error("test failed!!!");
            }
        }
        try {
            await AuthHttpRequest.axios({ url: `${BASE_URL}/fail`, method: "GET" });
            throw Error();
        } catch (err) {
            if (err.response !== undefined) {
                assert.strictEqual(err.response.status, expectedStatusCode);
            } else {
                throw Error("test failed!!!");
            }
        }
        try {
            await AuthHttpRequest.axios({ url: `${BASE_URL}/fail`, method: "GET" });
            throw Error();
        } catch (err) {
            if (err.response !== undefined) {
                assert.strictEqual(err.response.status, expectedStatusCode);
            } else {
                throw Error("test failed!!!");
            }
        }
    });

    it("refresh session", async function() {
        await startST();
        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });
        try {
            const page = await browser.newPage();
            await page.goto(BASE_URL + "/index", { waitUntil: "load" });
            await page.addScriptTag({ path: `./bundle/bundle.js`, type: "text/javascript" });
            await page.evaluate(async () => {
                let BASE_URL = "http://localhost:8080";
                supertokens.axios.makeSuper(axios);
                supertokens.axios.init(`${BASE_URL}/refresh`, 440);
                let userId = "testing-supertokens-website";
                let loginResponse = await axios.post(`${BASE_URL}/login`, JSON.stringify({ userId }), {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    }
                });
                let userIdFromResponse = loginResponse.data;
                assertEqual(userId, userIdFromResponse);
                await delay(3);

                assertEqual(await getNumberOfTimesRefreshCalled(), 0);
                let getResponse = await axios({ url: `${BASE_URL}/`, method: "GET" });
                assertEqual(await getNumberOfTimesRefreshCalled(), 1);
                getResponse = await getResponse.data;
                assertEqual(getResponse, "success");
            });
        } finally {
            await browser.close();
        }
    });

    //test custom headers are being sent when logged in and when not*****
    it("test that custom headers are being sent when logged in", async function() {
        await startST(5);
        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });
        try {
            const page = await browser.newPage();
            await page.goto(BASE_URL + "/index", { waitUntil: "load" });
            await page.addScriptTag({ path: "./bundle/bundle.js", type: "text/javascript" });
            await page.evaluate(async () => {
                let BASE_URL = "http://localhost:8080";
                supertokens.axios.makeSuper(axios);
                supertokens.axios.init(`${BASE_URL}/refresh`, 440);
                let userId = "testing-supertokens-website";

                // send api request to login
                let loginResponse = await axios.post(`${BASE_URL}/login`, JSON.stringify({ userId }), {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    }
                });
                assertEqual(userId, loginResponse.data);

                // send api request with custom headers and check that they are sent.
                let testResponse = await axios.post(`${BASE_URL}/testing`, JSON.stringify({ userId }), {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                        testing: "testValue"
                    }
                });
                assertEqual(testResponse.data, "success");
                //check that custom header values are sent
                assertEqual(testResponse.headers["testing"], "testValue");

                //send logout api request
                let logoutResponse = await axios.post(`${BASE_URL}/logout`, JSON.stringify({ userId }), {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    }
                });
                assertEqual(logoutResponse.data, "success");

                //send api request with custom headers
                let testResponse2 = await axios.post(`${BASE_URL}/testing`, JSON.stringify({ userId }), {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                        testing: "testValue"
                    }
                });
                //check that custom headers are present
                assertEqual(testResponse2.headers["testing"], "testValue");
            });
        } finally {
            await browser.close();
        }
    });

    //testing doesSessionExist works fine when user is logged in******
    it("test doesSessionExist works fine when user is logged in", async function() {
        await startST(5);
        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });
        try {
            const page = await browser.newPage();
            await page.goto(BASE_URL + "/index", { waitUntil: "load" });
            await page.addScriptTag({ path: "./bundle/bundle.js", type: "text/javascript" });
            await page.evaluate(async () => {
                let BASE_URL = "http://localhost:8080";
                supertokens.axios.makeSuper(axios);
                supertokens.axios.init(`${BASE_URL}/refresh`, 440);
                let userId = "testing-supertokens-website";

                // send api request to login
                let loginResponse = await axios.post(`${BASE_URL}/login`, JSON.stringify({ userId }), {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    }
                });
                assertEqual(userId, loginResponse.data);
                assertEqual(await supertokens.axios.doesSessionExist(), true);
            });
        } finally {
            await browser.close();
        }
    });

    //session should not exist when user calls log out - use doesSessionExist & check localstorage is empty*****
    it("test session should not exist when user calls log out", async function() {
        await startST(5);
        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });
        try {
            const page = await browser.newPage();
            await page.goto(BASE_URL + "/index", { waitUntil: "load" });
            await page.addScriptTag({ path: "./bundle/bundle.js", type: "text/javascript" });
            await page.evaluate(async () => {
                let BASE_URL = "http://localhost:8080";
                supertokens.axios.makeSuper(axios);
                supertokens.axios.init(`${BASE_URL}/refresh`, 440);
                let userId = "testing-supertokens-website";

                // send api request to login
                let loginResponse = await axios.post(`${BASE_URL}/login`, JSON.stringify({ userId }), {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    }
                });
                assertEqual(userId, loginResponse.data);
                assertEqual(await supertokens.axios.doesSessionExist(), true);
                assertEqual(window.localStorage.length, 1);

                // send api request to logout
                let logoutResponse = await axios.post(`${BASE_URL}/logout`, JSON.stringify({ userId }), {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    }
                });
                let sessionExists = await supertokens.axios.doesSessionExist();

                assertEqual(logoutResponse.data, "success");
                assertEqual(sessionExists, false);
                assertEqual(window.localStorage.length, 0);
            });
        } finally {
            await browser.close();
        }
    });

    // testing attemptRefreshingSession works fine******
    it("test that attemptRefreshingSession is working correctly", async function() {
        await startST(5);
        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });
        try {
            const page = await browser.newPage();
            await page.goto(BASE_URL + "/index", { waitUntil: "load" });
            await page.addScriptTag({ path: "./bundle/bundle.js", type: "text/javascript" });
            await page.evaluate(async () => {
                let BASE_URL = "http://localhost:8080";
                supertokens.axios.makeSuper(axios);
                supertokens.axios.init(`${BASE_URL}/refresh`, 440);
                let userId = "testing-supertokens-website";

                // send api request to login
                let loginResponse = await axios.post(`${BASE_URL}/login`, JSON.stringify({ userId }), {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    }
                });

                assertEqual(userId, loginResponse.data);
                let attemptRefresh = await supertokens.axios.attemptRefreshingSession();
                assertEqual(attemptRefresh, true);

                assertEqual(await getNumberOfTimesRefreshCalled(), 1);
            });
        } finally {
            await browser.close();
        }
    });

    // multiple API calls in parallel when access token is expired (100 of them) and only 1 refresh should be called*****
    it("test that multiple API calls in parallel when access token is expired, only 1 refresh should be called", async function() {
        await startST(5, true);
        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });
        try {
            const page = await browser.newPage();
            await page.goto(BASE_URL + "/index", { waitUntil: "load" });
            await page.addScriptTag({ path: "./bundle/bundle.js", type: "text/javascript" });
            await page.evaluate(async () => {
                let BASE_URL = "http://localhost:8080";
                supertokens.axios.makeSuper(axios);
                supertokens.axios.init(`${BASE_URL}/refresh`, 440);
                let userId = "testing-supertokens-website";

                // send api request to login
                let loginResponse = await axios.post(`${BASE_URL}/login`, JSON.stringify({ userId }), {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    }
                });
                assertEqual(loginResponse.data, userId);
                assertEqual(await getNumberOfTimesRefreshCalled(), 0);

                // wait for 7 seconds so that the accesstoken expires
                await delay(7);

                let promises = [];
                let n = 100;

                // create an array of 100 get session promises
                for (let i = 0; i < n; i++) {
                    promises.push(axios({ url: `${BASE_URL}/`, method: "GET" }));
                }

                // send 100 get session requests
                let multipleGetSessionResponse = await axios.all(promises);

                //check that reponse of all requests are success
                multipleGetSessionResponse.forEach(element => {
                    assertEqual(element.data, "success");
                });

                //check that the number of times refresh is called is 1
                assertEqual(await getNumberOfTimesRefreshCalled(), 1);
            });
        } finally {
            await browser.close();
        }
    });

    // - Things should work if anti-csrf is disabled.******
    it("test that things should work correctly if anti-csrf is disabled", async function() {
        await startST(1, false);
        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });
        try {
            const page = await browser.newPage();
            await page.goto(BASE_URL + "/index", { waitUntil: "load" });
            await page.addScriptTag({ path: "./bundle/bundle.js", type: "text/javascript" });
            await page.evaluate(async () => {
                let BASE_URL = "http://localhost:8080";
                supertokens.axios.makeSuper(axios);
                supertokens.axios.init(`${BASE_URL}/refresh`, 440);
                let userId = "testing-supertokens-website";
                // test out anti-csrf
                //check that login works correctly
                let loginResponse = await axios.post(`${BASE_URL}/login`, JSON.stringify({ userId }), {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    }
                });

                assertEqual(loginResponse.data, userId);
                assertEqual(await supertokens.axios.doesSessionExist(), true);

                assertEqual(await getNumberOfTimesRefreshCalled(), 0);

                await delay(3);

                let getSessionResponse = await axios({ url: `${BASE_URL}/`, method: "GET" });
                assertEqual(getSessionResponse.data, "success");
                assertEqual(await getNumberOfTimesRefreshCalled(), 1);

                let logoutResponse = await axios.post(`${BASE_URL}/logout`, JSON.stringify({ userId }), {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    }
                });

                assertEqual(await supertokens.axios.doesSessionExist(), false);
                assertEqual(logoutResponse.data, "success");
            });
        } finally {
            await browser.close();
        }
    });

    //    - device info tests******
    it("test device info being sent", async function() {
        await startST();
        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });
        try {
            const page = await browser.newPage();
            await page.goto(BASE_URL + "/index", { waitUntil: "load" });
            await page.addScriptTag({ path: "./bundle/bundle.js", type: "text/javascript" });
            await page.evaluate(async () => {
                let BASE_URL = "http://localhost:8080";
                supertokens.axios.makeSuper(axios);
                supertokens.axios.init(`${BASE_URL}/refresh`, 440);
                let userId = "testing-supertokens-website";

                let loginResponse = await axios.post(`${BASE_URL}/login`, JSON.stringify({ userId }), {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    }
                });

                assertEqual(loginResponse.data, userId);
                assertEqual(await supertokens.axios.doesSessionExist(), true);

                assertEqual(loginResponse.config.headers["supertokens-sdk-name"] !== undefined, true);
                assertEqual(loginResponse.config.headers["supertokens-sdk-version"] !== undefined, true);
            });
        } finally {
            await browser.close();
        }
    });

    //test that calling makeSuper many times is not a problem******
    it("test that calling makeSuper multiple times is not a problem", async () => {
        await startST();
        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });
        try {
            const page = await browser.newPage();
            await page.goto(BASE_URL + "/index", { waitUntil: "load" });
            await page.addScriptTag({ path: "./bundle/bundle.js", type: "text/javascript" });
            await page.evaluate(async () => {
                supertokens.axios.makeSuper(axios);
                let BASE_URL = "http://localhost:8080";
                supertokens.axios.init(`${BASE_URL}/refresh`, 440);
                let userId = "testing-supertokens-website";

                let loginResponse = await axios.post(`${BASE_URL}/login`, JSON.stringify({ userId }), {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    }
                });

                //check that the userId which is returned in the response is the same as the one we sent
                assertEqual(loginResponse.data, userId);

                // check that the session exists
                assertEqual(await supertokens.axios.doesSessionExist(), true);

                supertokens.axios.makeSuper(axios);
                // check that the number of times session refresh is called is zero
                assertEqual(await getNumberOfTimesRefreshCalled(), 0);

                //delay for 3 seconds so that we know accessToken expires
                await delay(3);

                // send a get session request , which should do a refresh session request

                let getSessionResponse = await axios({ url: `${BASE_URL}/`, method: "GET" });

                // check that the getSession was successfull
                assertEqual(getSessionResponse.data, "success");

                // check that the refresh session was called only once
                assertEqual(await getNumberOfTimesRefreshCalled(), 1);

                // do logout
                let logoutResponse = await axios.post(`${BASE_URL}/logout`, JSON.stringify({ userId }), {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    }
                });

                supertokens.axios.makeSuper(axios);
                assertEqual(logoutResponse.data, "success");

                //check that session does not exist
                assertEqual(await supertokens.axios.doesSessionExist(), false);
            });
        } finally {
            await browser.close();
        }
    });

    //    - User passed config should be sent as well******
    it("test that user passed config should be sent", async () => {
        await startST();
        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });
        try {
            const page = await browser.newPage();
            await page.goto(BASE_URL + "/index", { waitUntil: "load" });
            await page.addScriptTag({ path: "./bundle/bundle.js", type: "text/javascript" });
            await page.evaluate(async () => {
                supertokens.axios.makeSuper(axios);
                let BASE_URL = "http://localhost:8080";
                supertokens.axios.init(`${BASE_URL}/refresh`, 440);
                let userId = "testing-supertokens-website";

                let userConfigResponse = await axios.post(`${BASE_URL}/checkUserConfig`, {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    testConfigKey: "testConfigValue"
                });

                assertEqual(userConfigResponse.data, "testConfigValue");
            });
        } finally {
            await browser.close();
        }
    });
    // if any API throws error, it gets propogated to the user properly (with and without interception)******
    it("test that if an api throws an error it gets propagated to the user with interception", async () => {
        await startST();
        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });
        try {
            const page = await browser.newPage();
            await page.goto(BASE_URL + "/index", { waitUntil: "load" });
            await page.addScriptTag({ path: "./bundle/bundle.js", type: "text/javascript" });
            await page.evaluate(async () => {
                let BASE_URL = "http://localhost:8080";
                supertokens.axios.makeSuper(axios);
                supertokens.axios.init(`${BASE_URL}/refresh`, 440);
                try {
                    await axios.get(`${BASE_URL}/testError`);
                    assert(false, "should not have come here");
                } catch (error) {
                    assertEqual(error.message, "Request failed with status code 500");
                }
            });
        } finally {
            await browser.close();
        }
    });

    // if any API throws error, it gets propogated to the user properly (with and without interception)******
    it("test that if an api throws an error, it gets propergated to the user without interception", async () => {
        await startST();
        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });
        try {
            const page = await browser.newPage();
            await page.goto(BASE_URL + "/index", { waitUntil: "load" });
            await page.addScriptTag({ path: "./bundle/bundle.js", type: "text/javascript" });
            await page.evaluate(async () => {
                let BASE_URL = "http://localhost:8080";
                supertokens.axios(axios);
                supertokens.axios.init(`${BASE_URL}/refresh`, 440);
                try {
                    await axios.get(`${BASE_URL}/testError`);
                    assert(false, "should not have come here");
                } catch (error) {
                    assertEqual(error.message, "Request failed with status code 500");
                }
            });
        } finally {
            await browser.close();
        }
    });

    //    - Calling SuperTokens.init more than once works!*******
    it("test that calling SuperTokens.init more than once works", async () => {
        await startST();
        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });
        try {
            const page = await browser.newPage();
            await page.goto(BASE_URL + "/index", { waitUntil: "load" });
            await page.addScriptTag({ path: "./bundle/bundle.js", type: "text/javascript" });
            await page.evaluate(async () => {
                let BASE_URL = "http://localhost:8080";
                supertokens.axios.makeSuper(axios);
                supertokens.axios.init(`${BASE_URL}/refresh`, 440);
                let userId = "testing-supertokens-website";

                let loginResponse = await axios.post(`${BASE_URL}/login`, JSON.stringify({ userId }), {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    }
                });
                assertEqual(userId, loginResponse.data);

                supertokens.axios.init(`${BASE_URL}/refresh`, 440);

                let logoutResponse = await axios.post(`${BASE_URL}/logout`, JSON.stringify({ userId }), {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    }
                });

                assertEqual(logoutResponse.data, "success");

                //check that session does not exist
                assertEqual(await supertokens.axios.doesSessionExist(), false);

                //check that login still works correctly
                loginResponse = await axios.post(`${BASE_URL}/login`, JSON.stringify({ userId }), {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    }
                });
                assertEqual(userId, loginResponse.data);
            });
        } finally {
            await browser.close();
        }
    });

    //If via interception, make sure that initially, just an endpoint is just hit once in case of access token expiry*****
    it("test that if via interception, initially an endpoint is hit just once in case of access token expiary", async () => {
        await startST();
        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });
        try {
            const page = await browser.newPage();
            await page.goto(BASE_URL + "/index", { waitUntil: "load" });
            await page.addScriptTag({ path: "./bundle/bundle.js", type: "text/javascript" });
            await page.evaluate(async () => {
                let BASE_URL = "http://localhost:8080";
                supertokens.axios.makeSuper(axios);
                supertokens.axios.init(`${BASE_URL}/refresh`, 440);
                let userId = "testing-supertokens-website";

                // send api request to login
                let loginResponse = await axios.post(`${BASE_URL}/login`, JSON.stringify({ userId }), {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    }
                });
                assertEqual(userId, loginResponse.data);

                //wait for 3 seconds such that the session expires
                await delay(3);

                let getSessionResponse = await axios({ url: `${BASE_URL}/`, method: "GET" });
                assertEqual(getSessionResponse.data, "success");

                let getSessionNumber = await axios({ url: `${BASE_URL}/getSessionCalledTime`, method: "GET" });

                //check that the number of times getSession was called is 2
                assertEqual(getSessionNumber.data, 2);

                //check that the number of times refesh session was called is 1
                assertEqual(await getNumberOfTimesRefreshCalled(), 1);
            });
        } finally {
            await browser.close();
        }
    });

    //    - Interception should not happen when domain is not the one that they gave*******
    it("test interception should not happen when domain is not the one that they gave", async function() {
        await startST(5);
        AuthHttpRequest.init(`${BASE_URL}/refresh`, 440);

        await axios.get(`https://www.google.com`);
        let verifyState = await ProcessState.getInstance().waitForEvent(PROCESS_STATE.CALLING_INTERCEPTION, 1500);

        assert.strictEqual(verifyState, undefined);
    });

    //- If you make an api call without cookies(logged out) api throws session expired , then make sure that refresh token api is not getting called , get 440 as the output****
    it("test that an api call without cookies throws session expire, refresh api is not called and 440 is the output", async function() {
        await startST(5);
        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });
        try {
            const page = await browser.newPage();
            await page.goto(BASE_URL + "/index", { waitUntil: "load" });
            await page.addScriptTag({ path: "./bundle/bundle.js", type: "text/javascript" });
            await page.evaluate(async () => {
                supertokens.axios.makeSuper(axios);
                let BASE_URL = "http://localhost:8080";
                supertokens.axios.init(`${BASE_URL}/refresh`, 440);
                let userId = "testing-supertokens-website";

                let loginResponse = await axios.post(`${BASE_URL}/login`, JSON.stringify({ userId }), {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    }
                });
                assertEqual(loginResponse.data, userId);

                let logoutResponse = await axios.post(`${BASE_URL}/logout`, JSON.stringify({ userId }), {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    }
                });

                assertEqual(logoutResponse.data, "success");

                try {
                    await axios.get(`${BASE_URL}/`);
                    throw new Error("Should not have come here");
                } catch (error) {
                    assertEqual(error.message, "Request failed with status code 440");
                }

                assertEqual(await getNumberOfTimesRefreshCalled(), 0);
            });
        } finally {
            await browser.close();
        }
    });

    // it("anti-csrf test with refresh session", async function () {
    //     AuthHttpRequest.init(`${BASE_URL}/refresh`);
    //     let userId = "testing-supertokens-website";
    //     let loginResponse = await AuthHttpRequest.post(`${BASE_URL}/login`, JSON.stringify({ userId }), {
    //         headers: {
    //             Accept: "application/json",
    //             "Content-Type": "application/json"
    //         }
    //     });
    //     let userIdFromResponse = await loginResponse.data;
    //     let cookies = loginResponse.headers["set-cookie"];
    //     let sAccessTokenCookieFound = false;
    //     let sRefreshTokenCookieFound = false;
    //     let sIdRefreshTokenCookieFound = false;
    //     assert.strictEqual(Array.isArray(cookies), true);
    //     for (let i = 0; i < cookies.length; i++) {
    //         if (cookies[i].includes("sAccessToken=")) {
    //             sAccessTokenCookieFound = true;
    //         } else if (cookies[i].includes("sRefreshToken")) {
    //             sRefreshTokenCookieFound = true;
    //         } else if (cookies[i].includes("sIdRefreshToken")) {
    //             sIdRefreshTokenCookieFound = true;
    //         }
    //     }
    //     if (!sAccessTokenCookieFound || !sRefreshTokenCookieFound || !sIdRefreshTokenCookieFound) {
    //         throw Error("");
    //     }
    //     assert.strictEqual(userId, userIdFromResponse);

    //     assert.strictEqual(refreshCalled, false);
    //     window.localStorage.clear();
    //     AntiCsrfToken.removeToken();
    //     let getResponse = await AuthHttpRequest.get(`${BASE_URL}/`);
    //     assert.strictEqual(refreshCalled, true);
    //     getResponse = await getResponse.data;
    //     assert.strictEqual(getResponse, "success");
    // });

    // it("refresh session (multiple get call where access token is expired)", async function () {
    //     // TODO: Server was created with 10 in the arguments
    //     AuthHttpRequest.init(`${BASE_URL}/refresh`, 440, "localhost");
    //     let userId = "testing-supertokens-website";
    //     let loginResponse = await axios.post(`${BASE_URL}/login`, JSON.stringify({ userId }), {
    //         headers: {
    //             Accept: "application/json",
    //             "Content-Type": "application/json"
    //         }
    //     });
    //     let userIdFromResponse = await loginResponse.data;
    //     let cookies = loginResponse.headers["set-cookie"];
    //     let sAccessTokenCookieFound = false;
    //     let sRefreshTokenCookieFound = false;
    //     let sIdRefreshTokenCookieFound = false;
    //     assert.strictEqual(Array.isArray(cookies), true);
    //     for (let i = 0; i < cookies.length; i++) {
    //         if (cookies[i].includes("sAccessToken=")) {
    //             sAccessTokenCookieFound = true;
    //         } else if (cookies[i].includes("sRefreshToken")) {
    //             sRefreshTokenCookieFound = true;
    //         } else if (cookies[i].includes("sIdRefreshToken")) {
    //             sIdRefreshTokenCookieFound = true;
    //         }
    //     }
    //     if (!sAccessTokenCookieFound || !sRefreshTokenCookieFound || !sIdRefreshTokenCookieFound) {
    //         throw Error("");
    //     }
    //     assert.strictEqual(userId, userIdFromResponse);
    //     await delay(10);

    //     let startTime = Date.now();
    //     let promises = [];

    //     let N = 100;
    //     assert.strictEqual(refreshCalled, false);
    //     for (let i = 0; i < N; i++) {
    //         promises.push(axios.get(`${BASE_URL}/`));
    //     }
    //     let responses = [];
    //     let result = [];
    //     for (let i = 0; i < N; i++) {
    //         responses.push(await promises[i]);
    //     }
    //     for (let i = 0; i < N; i++) {
    //         result.push(await responses[i].data);
    //     }
    //     let endTime = Date.now();
    //     assert.strictEqual(refreshCalled, true);
    //     assert.strictEqual(noOfTimesRefreshCalledDuringTest, 1);
    //     assert.strictEqual(endTime - startTime < 6000, true);
    // });

    // it("refresh is not called when calling user info before access token expiry", async function () {
    //     // TODO: 10 in argument of server
    //     AuthHttpRequest.init(`${BASE_URL}/refresh`, 440);
    //     let userId = "testing-supertokens-website";
    //     let loginResponse = await axios.post(`${BASE_URL}/login`, JSON.stringify({ userId }), {
    //         headers: {
    //             Accept: "application/json",
    //             "Content-Type": "application/json"
    //         }
    //     });
    //     let userIdFromResponse = await loginResponse.data;
    //     let cookies = loginResponse.headers["set-cookie"];
    //     let sAccessTokenCookieFound = false;
    //     let sRefreshTokenCookieFound = false;
    //     let sIdRefreshTokenCookieFound = false;
    //     assert.strictEqual(Array.isArray(cookies), true);
    //     for (let i = 0; i < cookies.length; i++) {
    //         if (cookies[i].includes("sAccessToken=")) {
    //             sAccessTokenCookieFound = true;
    //         } else if (cookies[i].includes("sRefreshToken")) {
    //             sRefreshTokenCookieFound = true;
    //         } else if (cookies[i].includes("sIdRefreshToken")) {
    //             sIdRefreshTokenCookieFound = true;
    //         }
    //     }
    //     if (!sAccessTokenCookieFound || !sRefreshTokenCookieFound || !sIdRefreshTokenCookieFound) {
    //         throw Error("");
    //     }
    //     assert.strictEqual(userId, userIdFromResponse);
    //     let response = await axios.get(`${BASE_URL}/`);
    //     let responseData = await response.data;
    //     assert.strictEqual(responseData, "success");
    //     assert.strictEqual(refreshCalled, false);
    //     assert.strictEqual(noOfTimesRefreshCalledDuringTest, 0);
    // });

    // it("session should not exist after logout is called", async function () {
    //     // TODO: 10 in args of server
    //     AuthHttpRequest.init(`${BASE_URL}/refresh`, 440);
    //     let userId = "testing-supertokens-website";
    //     let loginResponse = await axios.post(`${BASE_URL}/login`, JSON.stringify({ userId }), {
    //         headers: {
    //             Accept: "application/json",
    //             "Content-Type": "application/json"
    //         }
    //     });
    //     let userIdFromResponse = await loginResponse.data;
    //     let cookies = loginResponse.headers["set-cookie"];
    //     let sAccessTokenCookieFound = false;
    //     let sRefreshTokenCookieFound = false;
    //     let sIdRefreshTokenCookieFound = false;
    //     assert.strictEqual(Array.isArray(cookies), true);
    //     for (let i = 0; i < cookies.length; i++) {
    //         if (cookies[i].includes("sAccessToken=")) {
    //             sAccessTokenCookieFound = true;
    //         } else if (cookies[i].includes("sRefreshToken")) {
    //             sRefreshTokenCookieFound = true;
    //         } else if (cookies[i].includes("sIdRefreshToken")) {
    //             sIdRefreshTokenCookieFound = true;
    //         }
    //     }
    //     if (!sAccessTokenCookieFound || !sRefreshTokenCookieFound || !sIdRefreshTokenCookieFound) {
    //         throw Error("");
    //     }
    //     assert.strictEqual(userId, userIdFromResponse);

    //     let logoutResponse = await axios.post(`${BASE_URL}/logout`, "", {
    //         headers: {
    //             Accept: "application/json",
    //             "Content-Type": "application/json"
    //         }
    //     });
    //     let logoutData = await logoutResponse.data;
    //     assert.strictEqual(logoutData, "success");
    //     assert.strictEqual(checkIfIdRefreshIsCleared(), true);
    // });

    // it("test that apis that dont require authentication work after logout", async function () {
    //     // TODO: 10 in args of server.
    //     AuthHttpRequest.init(`${BASE_URL}/refresh`, 440);
    //     let userId = "testing-supertokens-website";
    //     let loginResponse = await axios.post(`${BASE_URL}/login`, JSON.stringify({ userId }), {
    //         headers: {
    //             Accept: "application/json",
    //             "Content-Type": "application/json"
    //         }
    //     });
    //     let userIdFromResponse = await loginResponse.data;
    //     let cookies = loginResponse.headers["set-cookie"];
    //     let sAccessTokenCookieFound = false;
    //     let sRefreshTokenCookieFound = false;
    //     let sIdRefreshTokenCookieFound = false;
    //     assert.strictEqual(Array.isArray(cookies), true);
    //     for (let i = 0; i < cookies.length; i++) {
    //         if (cookies[i].includes("sAccessToken=")) {
    //             sAccessTokenCookieFound = true;
    //         } else if (cookies[i].includes("sRefreshToken")) {
    //             sRefreshTokenCookieFound = true;
    //         } else if (cookies[i].includes("sIdRefreshToken")) {
    //             sIdRefreshTokenCookieFound = true;
    //         }
    //     }
    //     if (!sAccessTokenCookieFound || !sRefreshTokenCookieFound || !sIdRefreshTokenCookieFound) {
    //         throw Error("");
    //     }
    //     assert.strictEqual(userId, userIdFromResponse);

    //     let logoutResponse = await axios.post(`${BASE_URL}/logout`, "", {
    //         headers: {
    //             Accept: "application/json",
    //             "Content-Type": "application/json"
    //         }
    //     });
    //     let logoutData = await logoutResponse.data;
    //     assert.strictEqual(logoutData, "success");

    //     let pingResponse = await axios.get(`${BASE_URL}/ping`);
    //     let pingText = await pingResponse.data;
    //     assert.strictEqual(pingText, "success");
    // });

    // it("test that user info after logout returns session expired", async function () {
    //     // TODO: 10 in args of server
    //     AuthHttpRequest.init(`${BASE_URL}/refresh`, 440);
    //     let userId = "testing-supertokens-website";
    //     let loginResponse = await axios.post(`${BASE_URL}/login`, JSON.stringify({ userId }), {
    //         headers: {
    //             Accept: "application/json",
    //             "Content-Type": "application/json"
    //         }
    //     });
    //     let userIdFromResponse = await loginResponse.data;
    //     let cookies = loginResponse.headers["set-cookie"];
    //     let sAccessTokenCookieFound = false;
    //     let sRefreshTokenCookieFound = false;
    //     let sIdRefreshTokenCookieFound = false;
    //     assert.strictEqual(Array.isArray(cookies), true);
    //     for (let i = 0; i < cookies.length; i++) {
    //         if (cookies[i].includes("sAccessToken=")) {
    //             sAccessTokenCookieFound = true;
    //         } else if (cookies[i].includes("sRefreshToken")) {
    //             sRefreshTokenCookieFound = true;
    //         } else if (cookies[i].includes("sIdRefreshToken")) {
    //             sIdRefreshTokenCookieFound = true;
    //         }
    //     }
    //     if (!sAccessTokenCookieFound || !sRefreshTokenCookieFound || !sIdRefreshTokenCookieFound) {
    //         throw Error("");
    //     }
    //     assert.strictEqual(userId, userIdFromResponse);

    //     let logoutResponse = await axios.post(`${BASE_URL}/logout`, "", {
    //         headers: {
    //             Accept: "application/json",
    //             "Content-Type": "application/json"
    //         }
    //     });
    //     let logoutData = await logoutResponse.data;
    //     assert.strictEqual(logoutData, "success");

    //     let failed = false;
    //     try {
    //         await axios.get(`${BASE_URL}/`);
    //         failed = true;
    //     } catch (e) {
    //         if (e.status === undefined || e.status !== 440) {
    //             failed = true;
    //         }
    //     }

    //     assert.strictEqual(failed, false);
    // });

    // it("test that custom headers are being sent", async function () {
    //     // TODO: 10 in args of server
    //     AuthHttpRequest.init(`${BASE_URL}/refresh`, 440, true);
    //     let response = await axios.get(`${BASE_URL}/testHeader`, {
    //         headers: {
    //             "st-custom-header": "st"
    //         }
    //     });
    //     let responseText = await response.data;
    //     assert.strictEqual(responseText.success, true);
    // });
});
