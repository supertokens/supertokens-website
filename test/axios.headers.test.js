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
let AuthHttpRequest = require("../index.js").default;
let AuthHttpRequestFetch = require("../lib/build/fetch").default;
let AuthHttpRequestAxios = require("../lib/build/axios").default;
let { interceptorFunctionRequestFulfilled, responseInterceptor } = require("../lib/build/axios");
let assert = require("assert");
let {
    delay,
    checkIfIdRefreshIsCleared,
    getNumberOfTimesRefreshCalled,
    startST,
    getNumberOfTimesGetSessionCalled,
    BASE_URL,
    BASE_URL_FOR_ST,
    getNumberOfTimesRefreshAttempted,
    resetAuthHttpRequestFetch
} = require("./utils");
const { spawn } = require("child_process");
let { ProcessState, PROCESS_STATE } = require("../lib/build/processState");

AuthHttpRequest.addAxiosInterceptors(axios);
/* TODO: 
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
*/

// this is intentionally skipped cause these tests should be in the interception.basic1.test.js test
// file so these are not needed, but we need to double check that these tests are all
// in there.
describe.skip("Axios AuthHttpRequest class tests header", function () {
    jsdom({
        url: "http://localhost.org"
    });

    before(async function () {
        spawn(
            "./test/startServer",
            [process.env.INSTALL_PATH, process.env.NODE_PORT === undefined ? 8080 : process.env.NODE_PORT],
            {
                stdio: "inherit"
            }
        );
        await new Promise(r => setTimeout(r, 1000));
    });

    after(async function () {
        let instance = axios.create();
        await instance.post(BASE_URL_FOR_ST + "/after");
        try {
            await instance.get(BASE_URL_FOR_ST + "/stop");
        } catch (err) {}
    });

    beforeEach(async function () {
        resetAuthHttpRequestFetch();
        global.document = {};
        ProcessState.getInstance().reset();
        let instance = axios.create();
        await instance.post(BASE_URL_FOR_ST + "/beforeeach");
        await instance.post("http://localhost.org:8082/beforeeach"); // for cross domain
        await instance.post(BASE_URL + "/beforeeach");
    });

    it("testing for init check in doRequest", async function () {
        let failed = false;
        try {
            await AuthHttpRequestAxios.doRequest(async () => {});
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

    it("testing for init check in attemptRefreshingSession", async function () {
        let failed = false;
        try {
            await AuthHttpRequest.attemptRefreshingSession();
            failed = true;
        } catch (err) {}

        if (failed) {
            throw Error("test failed");
        }
    });

    it("testing getDomain", async function () {
        AuthHttpRequest.init({
            apiDomain: BASE_URL,
            tokenTransferMethod: "header"
        });

        let getResponse = await axios.get(`${BASE_URL}/testing`);
        let postResponse = await axios.post(`${BASE_URL}/testing`);
        let deleteResponse = await axios.delete(`${BASE_URL}/testing`);
        let putResponse = await axios.put(`${BASE_URL}/testing`);
        let doRequestResponse = await axios({ method: "GET", url: `${BASE_URL}/testing` });
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

    it("testing api methods with config", async function () {
        AuthHttpRequest.init({
            apiDomain: BASE_URL,
            tokenTransferMethod: "header"
        });

        let testing = "testing";
        let getResponse = await axios.get(`${BASE_URL}/${testing}`, { headers: { testing } });
        let postResponse = await axios.post(`${BASE_URL}/${testing}`, undefined, {
            headers: { testing }
        });
        let deleteResponse = await axios.delete(`${BASE_URL}/${testing}`, { headers: { testing } });
        let putResponse = await axios.put(`${BASE_URL}/${testing}`, undefined, { headers: { testing } });
        let doRequestResponse1 = await axios({
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

    it("testing api methods that doesn't exists", async function () {
        AuthHttpRequest.init({
            apiDomain: BASE_URL,
            tokenTransferMethod: "header"
        });
        let expectedStatusCode = 404;
        try {
            await axios.get(`${BASE_URL}/fail`);
            throw Error();
        } catch (err) {
            if (err.response !== undefined) {
                assert.strictEqual(err.response.status, expectedStatusCode);
            } else {
                throw Error("test failed!!!");
            }
        }
        try {
            await axios.post(`${BASE_URL}/fail`);
            throw Error();
        } catch (err) {
            if (err.response !== undefined) {
                assert.strictEqual(err.response.status, expectedStatusCode);
            } else {
                throw Error("test failed!!!");
            }
        }
        try {
            await axios.delete(`${BASE_URL}/fail`);
            throw Error();
        } catch (err) {
            if (err.response !== undefined) {
                assert.strictEqual(err.response.status, expectedStatusCode);
            } else {
                throw Error("test failed!!!");
            }
        }
        try {
            await axios.put(`${BASE_URL}/fail`);
            throw Error();
        } catch (err) {
            if (err.response !== undefined) {
                assert.strictEqual(err.response.status, expectedStatusCode);
            } else {
                throw Error("test failed!!!");
            }
        }
        try {
            await axios({ url: `${BASE_URL}/fail`, method: "GET" });
            throw Error();
        } catch (err) {
            if (err.response !== undefined) {
                assert.strictEqual(err.response.status, expectedStatusCode);
            } else {
                throw Error("test failed!!!");
            }
        }
        try {
            await axios({ url: `${BASE_URL}/fail`, method: "GET" });
            throw Error();
        } catch (err) {
            if (err.response !== undefined) {
                assert.strictEqual(err.response.status, expectedStatusCode);
            } else {
                throw Error("test failed!!!");
            }
        }
    });

    it("refresh session", async function () {
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
                supertokens.addAxiosInterceptors(axios);
                supertokens.init({
                    apiDomain: BASE_URL,
                    tokenTransferMethod: "header",
                    enableDebugLogs: true
                });
                let userId = "testing-supertokens-website";
                let loginResponse = await axios.post(`${BASE_URL}/login`, JSON.stringify({ userId }), {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    }
                });
                let userIdFromResponse = loginResponse.data;
                assert.strictEqual(userId, userIdFromResponse);
                await delay(3);
                assert.strictEqual(await getNumberOfTimesRefreshCalled(), 0);
                let getResponse = await axios({ url: `${BASE_URL}/`, method: "GET" });
                assert.strictEqual(await getNumberOfTimesRefreshCalled(), 1);
                getResponse = await getResponse.data;
                assert.strictEqual(getResponse, userId);
            });
        } finally {
            await browser.close();
        }
    });

    it("test that unauthorised event is not fired on initial page load", async function () {
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
                supertokens.addAxiosInterceptors(axios);
                supertokens.init({
                    apiDomain: BASE_URL,
                    tokenTransferMethod: "header",
                    onHandleEvent: event => {
                        console.log("ST_" + event.action);
                    }
                });
                let userId = "testing-supertokens-website";
                let loginResponse = await axios.post(`${BASE_URL}/login`, JSON.stringify({ userId }), {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    }
                });
                let userIdFromResponse = loginResponse.data;
                assertEqual(userId, userIdFromResponse);
            });
            assert(consoleLogs.length === 1);
            assert(consoleLogs[0] === "ST_SESSION_CREATED");
        } finally {
            await browser.close();
        }
    });

    it("test that unauthorised event is fired when calling protected route without a session", async function () {
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
                supertokens.addAxiosInterceptors(axios);
                supertokens.init({
                    apiDomain: BASE_URL,
                    tokenTransferMethod: "header",
                    onHandleEvent: event => {
                        console.log(`ST_${event.action}:${JSON.stringify(event)}`);
                    }
                });
                try {
                    await axios({ url: `${BASE_URL}/`, method: "GET" });
                } catch (err) {
                    assertEqual(err.response.status, 401);
                }
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

    it("test that after login, and clearing localstorage, if we query a protected route, it fires unauthorised event", async function () {
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
                supertokens.addAxiosInterceptors(axios);
                supertokens.init({
                    apiDomain: BASE_URL,
                    tokenTransferMethod: "header",
                    onHandleEvent: event => {
                        console.log(`ST_${event.action}:${JSON.stringify(event)}`);
                    }
                });
                let userId = "testing-supertokens-website";
                let loginResponse = await axios.post(`${BASE_URL}/login`, JSON.stringify({ userId }), {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    }
                });
                let userIdFromResponse = loginResponse.data;
                assertEqual(userId, userIdFromResponse);
                deleteAllCookies();
                try {
                    await axios({ url: `${BASE_URL}/`, method: "GET" });
                } catch (err) {
                    assertEqual(err.response.status, 401);
                }
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

    it("test rid is there", async function () {
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
                supertokens.addAxiosInterceptors(axios);
                supertokens.init({
                    apiDomain: BASE_URL,
                    tokenTransferMethod: "header"
                });
                let userId = "testing-supertokens-website";
                let loginResponse = await axios.post(`${BASE_URL}/login`, JSON.stringify({ userId }), {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    }
                });
                let userIdFromResponse = loginResponse.data;
                assertEqual(userId, userIdFromResponse);

                let getResponse = await axios({ url: `${BASE_URL}/check-rid`, method: "GET" });

                assertEqual(await getResponse.data, "success");
            });
        } finally {
            await browser.close();
        }
    });

    it("signout with expired access token", async function () {
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
                supertokens.addAxiosInterceptors(axios);
                supertokens.init({
                    apiDomain: BASE_URL,
                    tokenTransferMethod: "header"
                });
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
                await supertokens.signOut();
                assertEqual(await getNumberOfTimesRefreshCalled(), 1);
                assertEqual(await supertokens.doesSessionExist(), false);
            });
        } finally {
            await browser.close();
        }
    });

    it("signout with not expired access token", async function () {
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
                supertokens.addAxiosInterceptors(axios);
                supertokens.init({
                    apiDomain: BASE_URL,
                    tokenTransferMethod: "header"
                });
                let userId = "testing-supertokens-website";
                let loginResponse = await axios.post(`${BASE_URL}/login`, JSON.stringify({ userId }), {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    }
                });
                let userIdFromResponse = loginResponse.data;
                assertEqual(userId, userIdFromResponse);

                assertEqual(await getNumberOfTimesRefreshCalled(), 0);
                await supertokens.signOut();
                assertEqual(await getNumberOfTimesRefreshCalled(), 0);
                assertEqual(await supertokens.doesSessionExist(), false);
            });
        } finally {
            await browser.close();
        }
    });

    // it("refresh session via reading of frontend info", async function () {
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
    //             supertokens.addAxiosInterceptors(axios);
    //             supertokens.init({
    //                 apiDomain: BASE_URL,
    //                 tokenTransferMethod: "header",
    //             });
    //             let userId = "testing-supertokens-website";
    //             let loginResponse = await axios.post(`${BASE_URL}/login`, JSON.stringify({ userId }), {
    //                 headers: {
    //                     Accept: "application/json",
    //                     "Content-Type": "application/json"
    //                 }
    //             });
    //             let userIdFromResponse = loginResponse.data;
    //             assertEqual(userId, userIdFromResponse);

    //             await axios.post(`${BASE_URL}/update-jwt`, { key: "data" });

    //             await delay(3);

    //             assertEqual(await getNumberOfTimesRefreshCalled(), 0);
    //             let data = await supertokens.getAccessTokenPayloadSecurely();
    //             assertEqual(await getNumberOfTimesRefreshCalled(), 1);
    //             assertEqual(data.key === "data", true);

    //             let data2 = await supertokens.getAccessTokenPayloadSecurely();
    //             assertEqual(data2.key === "data", true);
    //             assertEqual(await getNumberOfTimesRefreshCalled(), 1);
    //         });
    //     } finally {
    //         await browser.close();
    //     }
    // });

    //test custom headers are being sent when logged in and when not*****
    it("test that custom headers are being sent when logged in", async function () {
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
                supertokens.addAxiosInterceptors(axios);
                supertokens.init({
                    apiDomain: BASE_URL,
                    tokenTransferMethod: "header"
                });
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
                assertEqual(testResponse2.data, "success");
                //check that custom headers are present
                assertEqual(testResponse2.headers["testing"], "testValue");
            });
        } finally {
            await browser.close();
        }
    });

    //testing doesSessionExist works fine when user is logged in******
    it("test doesSessionExist works fine when user is logged in", async function () {
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
                supertokens.addAxiosInterceptors(axios);
                supertokens.init({
                    apiDomain: BASE_URL,
                    tokenTransferMethod: "header"
                });
                let userId = "testing-supertokens-website";

                // send api request to login
                let loginResponse = await axios.post(`${BASE_URL}/login`, JSON.stringify({ userId }), {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    }
                });
                assertEqual(userId, loginResponse.data);
                assertEqual(await supertokens.doesSessionExist(), true);
                let getSessionResponse = await axios.get(`${BASE_URL}/`);
                assertEqual(userId, getSessionResponse.data);
            });
        } finally {
            await browser.close();
        }
    });

    //session should not exist when user calls log out - use doesSessionExist & check localstorage is empty
    it("test session should not exist when user calls log out", async function () {
        await startST();
        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });
        try {
            const page = await browser.newPage();
            page.on("console", c => console.log(c.text()));
            await page.goto(BASE_URL + "/index.html", { waitUntil: "load" });
            await page.addScriptTag({ path: "./bundle/bundle.js", type: "text/javascript" });
            await page.evaluate(async () => {
                let BASE_URL = "http://localhost.org:8080";
                supertokens.addAxiosInterceptors(axios);
                supertokens.init({
                    apiDomain: BASE_URL,
                    tokenTransferMethod: "header"
                });
                let userId = "testing-supertokens-website";

                // send api request to login
                let loginResponse = await axios.post(`${BASE_URL}/login`, JSON.stringify({ userId }), {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    }
                });
                assertEqual(userId, loginResponse.data);
                assertEqual(await supertokens.doesSessionExist(), true);

                let userIdFromToken = await supertokens.getUserId();
                assertEqual(userIdFromToken, userId);

                // send api request to logout
                let logoutResponse = await axios.post(`${BASE_URL}/logout`, JSON.stringify({ userId }), {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    }
                });
                let sessionExists = await supertokens.doesSessionExist();

                assertEqual(logoutResponse.data, "success");
                assertEqual(sessionExists, false);

                try {
                    await supertokens.getUserId();
                    throw new Error("test failed");
                } catch (err) {
                    assertEqual(err.message, "No session exists");
                }

                try {
                    await supertokens.getAccessTokenPayloadSecurely();
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
    it("test that attemptRefreshingSession is working correctly", async function () {
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
                supertokens.addAxiosInterceptors(axios);
                supertokens.init({
                    apiDomain: BASE_URL,
                    tokenTransferMethod: "header"
                });
                let userId = "testing-supertokens-website";

                // send api request to login
                let loginResponse = await axios.post(`${BASE_URL}/login`, JSON.stringify({ userId }), {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    }
                });
                assertEqual(userId, loginResponse.data);

                await delay(7);
                let attemptRefresh = await supertokens.attemptRefreshingSession();
                assertEqual(attemptRefresh, true);

                //check that the number of times the refresh API called is 1
                assertEqual(await getNumberOfTimesRefreshCalled(), 1);

                let getSessionResponse = await axios.get(`${BASE_URL}/`);
                assertEqual(getSessionResponse.data, userId);

                //check that the number of times the refresh API called is still 1
                assertEqual(await getNumberOfTimesRefreshCalled(), 1);
            });
        } finally {
            await browser.close();
        }
    });

    // multiple API calls in parallel when access token is expired (100 of them) and only 1 refresh should be called*****
    it("test that multiple API calls in parallel when access token is expired, only 1 refresh should be called", async function () {
        await startST(15, true);
        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });
        try {
            const page = await browser.newPage();
            await page.goto(BASE_URL + "/index.html", { waitUntil: "load" });
            await page.addScriptTag({ path: "./bundle/bundle.js", type: "text/javascript" });
            await page.evaluate(async () => {
                let BASE_URL = "http://localhost.org:8080";
                supertokens.addAxiosInterceptors(axios);
                supertokens.init({
                    apiDomain: BASE_URL,
                    tokenTransferMethod: "header"
                });
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
                await delay(17);

                let promises = [];
                let n = 100;

                // create an array of 100 get session promises
                for (let i = 0; i < n; i++) {
                    promises.push(
                        axios({ url: `${BASE_URL}/`, method: "GET", headers: { "Cache-Control": "no-cache, private" } })
                    );
                }

                // send 100 get session requests
                let multipleGetSessionResponse = await axios.all(promises);

                //check that reponse of all requests are success
                let noOfResponeSuccesses = 0;
                multipleGetSessionResponse.forEach(element => {
                    assertEqual(element.data, userId);
                    noOfResponeSuccesses += 1;
                });

                //check that the number of times refresh is called is 1
                assertEqual(await getNumberOfTimesRefreshCalled(), 1);
                assertEqual(noOfResponeSuccesses, n);
            });
        } finally {
            await browser.close();
        }
    });

    // - Things should work if anti-csrf is disabled.******
    it("axios test that things should work correctly if anti-csrf is disabled", async function () {
        await startST(3, false);
        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });
        try {
            const page = await browser.newPage();
            await page.goto(BASE_URL + "/index.html", { waitUntil: "load" });
            await page.addScriptTag({ path: "./bundle/bundle.js", type: "text/javascript" });
            await page.evaluate(async () => {
                let BASE_URL = "http://localhost.org:8080";
                supertokens.addAxiosInterceptors(axios);
                supertokens.init({
                    apiDomain: BASE_URL,
                    tokenTransferMethod: "header"
                });
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
                assertEqual(await supertokens.doesSessionExist(), true);

                assertEqual(await getNumberOfTimesRefreshCalled(), 0);

                await delay(5);

                let getSessionResponse = await axios({ url: `${BASE_URL}/`, method: "GET" });
                assertEqual(getSessionResponse.data, userId);
                assertEqual(await getNumberOfTimesRefreshCalled(), 1);

                let logoutResponse = await axios.post(`${BASE_URL}/logout`, JSON.stringify({ userId }), {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    }
                });

                assertEqual(await supertokens.doesSessionExist(), false);
                assertEqual(logoutResponse.data, "success");
            });
        } finally {
            await browser.close();
        }
    });

    //test that calling addAxiosInterceptors many times is not a problem******
    it("test that calling addAxiosInterceptors multiple times is not a problem", async () => {
        await startST(3);
        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });
        try {
            const page = await browser.newPage();
            await page.goto(BASE_URL + "/index.html", { waitUntil: "load" });
            await page.addScriptTag({ path: "./bundle/bundle.js", type: "text/javascript" });
            await page.evaluate(async () => {
                supertokens.addAxiosInterceptors(axios);
                supertokens.addAxiosInterceptors(axios);
                let BASE_URL = "http://localhost.org:8080";
                supertokens.init({
                    apiDomain: BASE_URL,
                    tokenTransferMethod: "header"
                });
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
                assertEqual(await supertokens.doesSessionExist(), true);

                supertokens.addAxiosInterceptors(axios);
                // check that the number of times session refresh is called is zero
                assertEqual(await getNumberOfTimesRefreshCalled(), 0);

                //delay for 5 seconds so that we know accessToken expires

                await delay(5);
                // send a get session request , which should do a refresh session request

                let getSessionResponse = await axios({ url: `${BASE_URL}/`, method: "GET" });

                // check that the getSession was successfull
                assertEqual(getSessionResponse.data, userId);

                // check that the refresh session was called only once
                assertEqual(await getNumberOfTimesRefreshCalled(), 1);

                // do logout
                let logoutResponse = await axios.post(`${BASE_URL}/logout`, JSON.stringify({ userId }), {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    }
                });

                supertokens.addAxiosInterceptors(axios);
                assertEqual(logoutResponse.data, "success");

                //check that session does not exist
                assertEqual(await supertokens.doesSessionExist(), false);
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
            await page.goto(BASE_URL + "/index.html", { waitUntil: "load" });
            await page.addScriptTag({ path: "./bundle/bundle.js", type: "text/javascript" });
            await page.evaluate(async () => {
                supertokens.addAxiosInterceptors(axios);
                let BASE_URL = "http://localhost.org:8080";
                supertokens.init({
                    apiDomain: BASE_URL,
                    tokenTransferMethod: "header"
                });
                let userId = "testing-supertokens-website";

                let userConfigResponse = await axios.post(`${BASE_URL}/testUserConfig`, JSON.stringify({ userId }), {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    timeout: 1000
                });
                assertEqual(userConfigResponse.config.timeout, 1000);
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
            await page.goto(BASE_URL + "/index.html", { waitUntil: "load" });
            await page.addScriptTag({ path: "./bundle/bundle.js", type: "text/javascript" });
            await page.evaluate(async () => {
                let BASE_URL = "http://localhost.org:8080";
                supertokens.addAxiosInterceptors(axios);
                supertokens.init({
                    apiDomain: BASE_URL,
                    tokenTransferMethod: "header"
                });
                try {
                    await axios.get(`${BASE_URL}/testError`);
                    assertEqual(false, "should not have come here");
                } catch (error) {
                    assertEqual(error.response.data, "test error message");
                    assertEqual(error.response.status, 500);
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
            await page.goto(BASE_URL + "/index.html", { waitUntil: "load" });
            await page.addScriptTag({ path: "./bundle/bundle.js", type: "text/javascript" });
            await page.evaluate(async () => {
                let BASE_URL = "http://localhost.org:8080";
                supertokens.init({
                    apiDomain: BASE_URL,
                    tokenTransferMethod: "header"
                });
                try {
                    await axios.get(`${BASE_URL}/testError`);
                    assert(false, "should not have come here");
                } catch (error) {
                    assertEqual(error.response.data, "test error message");
                    assertEqual(error.response.status, 500);
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
            await page.goto(BASE_URL + "/index.html", { waitUntil: "load" });
            await page.addScriptTag({ path: "./bundle/bundle.js", type: "text/javascript" });
            await page.evaluate(async () => {
                let BASE_URL = "http://localhost.org:8080";
                supertokens.addAxiosInterceptors(axios);
                supertokens.init({
                    apiDomain: BASE_URL,
                    tokenTransferMethod: "header"
                });
                supertokens.init({
                    apiDomain: BASE_URL,
                    tokenTransferMethod: "header"
                });
                let userId = "testing-supertokens-website";

                let loginResponse = await axios.post(`${BASE_URL}/login`, JSON.stringify({ userId }), {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    }
                });
                assertEqual(userId, loginResponse.data);

                supertokens.init({
                    apiDomain: BASE_URL,
                    tokenTransferMethod: "header"
                });

                let logoutResponse = await axios.post(`${BASE_URL}/logout`, JSON.stringify({ userId }), {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    }
                });

                assertEqual(logoutResponse.data, "success");

                //check that session does not exist
                assertEqual(await supertokens.doesSessionExist(), false);

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

    //If via interception, make sure that initially, just an endpoint is just hit twice in case of access token expiry*****
    it("test that if via interception, initially an endpoint is hit just twice in case of access token expiary", async () => {
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
                supertokens.addAxiosInterceptors(axios);
                supertokens.init({
                    apiDomain: BASE_URL,
                    tokenTransferMethod: "header"
                });
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
                await delay(5);

                let getSessionResponse = await axios({ url: `${BASE_URL}/`, method: "GET" });
                assertEqual(getSessionResponse.data, userId);

                //check that the number of times getSession was called successfully is 1
                assertEqual(await getNumberOfTimesGetSessionCalled(), 1);

                //check that the number of times refesh session was called is 1
                assertEqual(await getNumberOfTimesRefreshCalled(), 1);
            });
        } finally {
            await browser.close();
        }
    });

    //    - Interception should not happen when domain is not the one that they gave*******
    it.skip("test interception should not happen when domain is not the one that they gave", async function () {
        await startST(5);
        AuthHttpRequest.init({
            apiDomain: BASE_URL,
            tokenTransferMethod: "header",
            enableDebugLogs: true
        });

        await axios.get(`https://www.google.com`);
        let verifyRequestState = await ProcessState.getInstance().waitForEvent(
            PROCESS_STATE.CALLING_INTERCEPTION_REQUEST,
            100
        );
        let verifyResponseState = await ProcessState.getInstance().waitForEvent(
            PROCESS_STATE.CALLING_INTERCEPTION_RESPONSE,
            100
        );

        assert.strictEqual(verifyRequestState, undefined);
        assert.strictEqual(verifyResponseState, undefined);

        let userId = "testing-supertokens-website";
        let loginResponse = await axios.post(`${BASE_URL}/login`, JSON.stringify({ userId }), {
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json"
            }
        });

        assert.strictEqual(await loginResponse.data, userId);

        verifyRequestState = await ProcessState.getInstance().waitForEvent(
            PROCESS_STATE.CALLING_INTERCEPTION_REQUEST,
            5000
        );
        verifyResponseState = await ProcessState.getInstance().waitForEvent(
            PROCESS_STATE.CALLING_INTERCEPTION_RESPONSE
        );

        console.log(verifyRequestState, verifyResponseState);
        assert.notStrictEqual(verifyRequestState, undefined);
        assert.notStrictEqual(verifyResponseState, undefined);
    });

    it("test with axios interception should happen if api domain and website domain are the same and relative path is used", async function () {
        await startST(5);

        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });
        try {
            const page = await browser.newPage();
            await page.goto(BASE_URL + "/index.html", { waitUntil: "load" });
            await page.addScriptTag({ path: "./bundle/bundle.js", type: "text/javascript" });

            await page.evaluate(async () => {
                supertokens.addAxiosInterceptors(axios);
                let BASE_URL = "http://localhost.org:8080";
                supertokens.init({
                    apiDomain: BASE_URL,
                    tokenTransferMethod: "header"
                });
                let userId = "testing-supertokens-website";

                let loginResponse = await axios.post(`/login`, JSON.stringify({ userId }), {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    }
                });

                assertEqual(loginResponse.data, userId);

                assertEqual(await supertokens.doesSessionExist(), true);
            });
        } finally {
            await browser.close();
        }
    });

    it("test with axios interception should not happen if api domain and website domain are different and relative path is used", async function () {
        await startST(5);

        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });
        try {
            const page = await browser.newPage();
            await page.goto(BASE_URL + "/index.html", { waitUntil: "load" });
            await page.addScriptTag({ path: "./bundle/bundle.js", type: "text/javascript" });

            await page.evaluate(async () => {
                supertokens.addAxiosInterceptors(axios);
                let BASE_URL = "https://google.com";
                supertokens.init({
                    apiDomain: BASE_URL,
                    tokenTransferMethod: "header"
                });
                let userId = "testing-supertokens-website";

                let loginResponse = await axios.post(`/login`, JSON.stringify({ userId }), {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    }
                });

                assertEqual(loginResponse.data, userId);
                assertEqual(localStorage.length, 0);
            });
        } finally {
            await browser.close();
        }
    });

    //- If you make an api call without cookies(logged out) api throws session expired , then make sure that refresh token api is not getting called , get 401 as the output****
    it("test that an api call without cookies throws session expire, refresh api is not called and 401 is the output", async function () {
        await startST(5);
        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });
        try {
            const page = await browser.newPage();
            await page.goto(BASE_URL + "/index.html", { waitUntil: "load" });
            await page.addScriptTag({ path: "./bundle/bundle.js", type: "text/javascript" });
            await page.evaluate(async () => {
                supertokens.addAxiosInterceptors(axios);
                let BASE_URL = "http://localhost.org:8080";
                supertokens.init({
                    apiDomain: BASE_URL,
                    tokenTransferMethod: "header"
                });
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
                    assertEqual(error.message, "Request failed with status code 401");
                }

                assertEqual(await getNumberOfTimesRefreshCalled(), 0);
            });
        } finally {
            await browser.close();
        }
    });

    //    - If via interception, make sure that initially, just an endpoint is just hit once in case of access token NOT expiry*****
    it("test that via interception initially an endpoint is just hit once in case of valid access token", async function () {
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
                supertokens.addAxiosInterceptors(axios);
                supertokens.init({
                    apiDomain: BASE_URL,
                    tokenTransferMethod: "header"
                });
                let userId = "testing-supertokens-website";

                // send api request to login
                let loginResponse = await axios.post(`${BASE_URL}/login`, JSON.stringify({ userId }), {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    }
                });
                assertEqual(userId, loginResponse.data);

                let getSessionResponse = await axios({ url: `${BASE_URL}/`, method: "GET" });
                assertEqual(getSessionResponse.data, userId);

                //check that the number of times getSession was called is 1
                assertEqual(await getNumberOfTimesGetSessionCalled(), 1);

                //check that the number of times refresh session was called is 0
                assertEqual(await getNumberOfTimesRefreshCalled(), 0);
            });
        } finally {
            await browser.close();
        }
    });

    //- if multiple interceptors are there, they should all work*****
    it("test that if multiple interceptors are there, they should all work", async function () {
        await startST();
        let testAxios = axios.create();
        addAxiosInterceptorsTest(testAxios);
        AuthHttpRequest.init({
            apiDomain: BASE_URL,
            tokenTransferMethod: "header"
        });
        let userId = "testing-supertokens-website";
        let multipleInterceptorResponse = await testAxios.post(
            `${BASE_URL}/multipleInterceptors`,
            JSON.stringify({ userId }),
            {
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json"
                }
            }
        );
        assert.deepEqual(multipleInterceptorResponse.data, "success");
        assert.notDeepEqual(multipleInterceptorResponse.headers.doInterception3, undefined);
        assert.notDeepEqual(multipleInterceptorResponse.headers.doInterception4, undefined);
    });

    //cross domain login, userinfo, logout
    it("cross domain", async () => {
        await startST(3);
        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });
        try {
            const page = await browser.newPage();
            await page.goto("http://localhost.org:8080/index.html", { waitUntil: "load" });
            await page.addScriptTag({ path: "./bundle/bundle.js", type: "text/javascript" });
            await page.evaluate(async () => {
                supertokens.addAxiosInterceptors(axios);
                let BASE_URL = "http://localhost.org:8082";
                supertokens.init({
                    apiDomain: BASE_URL,
                    tokenTransferMethod: "header"
                });
                let userId = "testing-supertokens-website";
                let loginResponse = await axios.post(`${BASE_URL}/login`, JSON.stringify({ userId }), {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    withCredentials: true
                });

                //check that the userId which is returned in the response is the same as the one we sent
                assertEqual(loginResponse.data, userId);

                // check that the session exists
                assertEqual(await supertokens.doesSessionExist(), true);

                // check that the number of times session refresh is called is zero
                assertEqual(await getNumberOfTimesRefreshCalled(BASE_URL), 0);
                //delay for 5 seconds so that we know accessToken expires

                await delay(5);
                // send a get session request , which should do a refresh session request

                let getSessionResponse = await axios.get(`${BASE_URL}/`, {
                    withCredentials: true
                });

                // check that the getSession was successfull
                assertEqual(getSessionResponse.data, userId);

                // check that the refresh session was called only once
                assertEqual(await getNumberOfTimesRefreshCalled(BASE_URL), 1);

                // do logout
                let logoutResponse = await axios.post(`${BASE_URL}/logout`, JSON.stringify({ userId }), {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    withCredentials: true
                });
                assertEqual(logoutResponse.data, "success");

                //check that session does not exist
                assertEqual(await supertokens.doesSessionExist(), false);
            });
        } finally {
            await browser.close();
        }
    });

    //cross domain login, userinfo, logout
    it("cross domain with auto add credentials", async () => {
        await startST(3);
        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });
        try {
            const page = await browser.newPage();
            await page.goto("http://localhost.org:8080/index.html", { waitUntil: "load" });
            await page.addScriptTag({ path: "./bundle/bundle.js", type: "text/javascript" });
            await page.evaluate(async () => {
                supertokens.addAxiosInterceptors(axios);
                let BASE_URL = "http://localhost.org:8082";
                supertokens.init({
                    apiDomain: BASE_URL,
                    tokenTransferMethod: "header"
                });
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
                assertEqual(await supertokens.doesSessionExist(), true);

                // check that the number of times session refresh is called is zero
                assertEqual(await getNumberOfTimesRefreshCalled(BASE_URL), 0);

                //delay for 5 seconds so that we know accessToken expires

                await delay(5);
                // send a get session request , which should do a refresh session request

                let getSessionResponse = await axios.get(`${BASE_URL}/`);

                // check that the getSession was successfull
                assertEqual(getSessionResponse.data, userId);

                // check that the refresh session was called only once
                assertEqual(await getNumberOfTimesRefreshCalled(BASE_URL), 1);

                // do logout
                let logoutResponse = await axios.post(`${BASE_URL}/logout`, JSON.stringify({ userId }), {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    }
                });
                assertEqual(logoutResponse.data, "success");

                //check that session does not exist
                assertEqual(await supertokens.doesSessionExist(), false);
            });
        } finally {
            await browser.close();
        }
    });

    //cross domain login, userinfo, logout
    it("cross domain with no auto add credentials should still work", async () => {
        await startST(3);
        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });
        try {
            const page = await browser.newPage();
            await page.goto("http://localhost.org:8080/index.html", { waitUntil: "load" });
            await page.addScriptTag({ path: "./bundle/bundle.js", type: "text/javascript" });
            await page.evaluate(async () => {
                supertokens.addAxiosInterceptors(axios);
                let BASE_URL = "http://localhost.org:8082";
                supertokens.init({
                    apiDomain: BASE_URL,
                    tokenTransferMethod: "header"
                });
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
                assertEqual(await supertokens.doesSessionExist(), true);

                // check that the number of times session refresh is called is zero
                assertEqual(await getNumberOfTimesRefreshCalled(BASE_URL), 0);

                //delay for 5 seconds so that we know accessToken expires

                await delay(5);
                // send a get session request , which should do a refresh session request

                await axios.get(`${BASE_URL}/`);

                assertEqual(await supertokens.doesSessionExist(), true);
            });
        } finally {
            await browser.close();
        }
    });

    it("cross domain with BaseURL", async () => {
        await startST(3);
        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });
        try {
            const page = await browser.newPage();
            await page.goto("http://localhost.org:8080/index.html", { waitUntil: "load" });
            await page.addScriptTag({ path: "./bundle/bundle.js", type: "text/javascript" });
            await page.evaluate(async () => {
                const http = axios.create({
                    baseURL: "http://localhost.org:8082",
                    withCredentials: true
                });
                supertokens.addAxiosInterceptors(http);
                let BASE_URL = "http://localhost.org:8082";
                supertokens.init({
                    apiDomain: BASE_URL,
                    tokenTransferMethod: "header"
                });
                let userId = "testing-supertokens-website";

                let loginResponse = await http.post(`login`, JSON.stringify({ userId }), {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    }
                });

                //check that the userId which is returned in the response is the same as the one we sent
                assertEqual(loginResponse.data, userId);

                // check that the session exists
                assertEqual(await supertokens.doesSessionExist(), true);

                // check that the number of times session refresh is called is zero
                assertEqual(await getNumberOfTimesRefreshCalled(BASE_URL), 0);

                //delay for 5 seconds so that we know accessToken expires

                await delay(5);
                // send a get session request , which should do a refresh session request

                let getSessionResponse = await http.get(`/`);

                // check that the getSession was successfull
                assertEqual(getSessionResponse.data, userId);

                // check that the refresh session was called only once
                assertEqual(await getNumberOfTimesRefreshCalled(BASE_URL), 1);

                // do logout
                let logoutResponse = await http.post(`/logout`, JSON.stringify({ userId }), {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    }
                });

                assertEqual(logoutResponse.data, "success");

                //check that session does not exist
                assertEqual(await supertokens.doesSessionExist(), false);
            });
        } finally {
            await browser.close();
        }
    });

    it("refresh session with baseURL", async function () {
        await startST();
        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });
        try {
            const page = await browser.newPage();
            await page.goto(BASE_URL + "/index.html", { waitUntil: "load" });
            await page.addScriptTag({ path: `./bundle/bundle.js`, type: "text/javascript" });
            await page.evaluate(async () => {
                const http = axios.create({
                    baseURL: "http://localhost.org:8080"
                });
                let BASE_URL = "http://localhost.org:8080";
                supertokens.addAxiosInterceptors(http);
                supertokens.init({
                    apiDomain: BASE_URL,
                    tokenTransferMethod: "header"
                });
                let userId = "testing-supertokens-website";
                let loginResponse = await http.post(`/login`, JSON.stringify({ userId }), {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    }
                });
                let userIdFromResponse = loginResponse.data;
                assertEqual(userId, userIdFromResponse);
                await delay(3);

                assertEqual(await getNumberOfTimesRefreshCalled(), 0);
                let getResponse = await http({ url: `/`, method: "GET" });
                assertEqual(await getNumberOfTimesRefreshCalled(), 1);
                getResponse = await getResponse.data;
                assertEqual(getResponse, userId);
            });
        } finally {
            await browser.close();
        }
    });

    it("check sessionDoes exist calls refresh API just once", async function () {
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
                supertokens.addAxiosInterceptors(axios);
                supertokens.init({
                    apiDomain: BASE_URL,
                    tokenTransferMethod: "header"
                });
                let userId = "testing-supertokens-website";

                // check document cookie = ""
                assertEqual(document.cookie, "");

                // call sessionDoesExist
                assertEqual(await supertokens.doesSessionExist(), false);

                // check refresh API was called once + localstorage has cleared
                assertEqual(await getNumberOfTimesRefreshAttempted(), 1);
                assertEqual(await getNumberOfTimesRefreshCalled(), 0);
                // assertEqual(document.cookie, "sIRTFrontend=remove");

                // call sessionDoesExist
                assertEqual(await supertokens.doesSessionExist(), false);
                // check refresh API not called
                assertEqual(await getNumberOfTimesRefreshAttempted(), 1);
                assertEqual(await getNumberOfTimesRefreshCalled(), 0);
                // assertEqual(document.cookie, "sIRTFrontend=remove");

                let loginResponse = await axios.post(`${BASE_URL}/login`, JSON.stringify({ userId }), {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    }
                });
                let userIdFromResponse = loginResponse.data;
                assertEqual(userId, userIdFromResponse);

                // call sessionDoesExist
                assertEqual(await supertokens.doesSessionExist(), true);
                // check refresh API not called
                assertEqual(await getNumberOfTimesRefreshAttempted(), 1);
                assertEqual(await getNumberOfTimesRefreshCalled(), 0);
                // assertEqual(document.cookie !== "sIRTFrontend=remove", true);
            });
        } finally {
            await browser.close();
        }
    });

    it("refresh session with invalid tokens should clear all cookies", async function () {
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
                supertokens.addAxiosInterceptors(axios);
                supertokens.init({
                    apiDomain: BASE_URL,
                    tokenTransferMethod: "header"
                });
                let userId = "testing-supertokens-website";
                let loginResponse = await axios.post(`${BASE_URL}/login`, JSON.stringify({ userId }), {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    }
                });
                let userIdFromResponse = loginResponse.data;
                assertEqual(userId, userIdFromResponse);
            });

            // we save the cookies..
            let originalCookies = (await page._client.send("Network.getAllCookies")).cookies;

            // we logout
            await page.evaluate(async () => {
                let BASE_URL = "http://localhost.org:8080";
                await axios({ url: `${BASE_URL}/logout`, method: "POST" });
            });

            // we set the old cookies with invalid access token
            originalCookies = originalCookies.map(c =>
                c.name === "sAccessToken" || c.name === "st-access-token" ? { ...c, value: "broken" } : c
            );
            await page.setCookie(...originalCookies);

            // now we expect a 401.
            await page.evaluate(async () => {
                let BASE_URL = "http://localhost.org:8080";
                let err;
                try {
                    await axios({ url: `${BASE_URL}/`, method: "GET" });
                } catch (ex) {
                    err = ex;
                }
                assertEqual(err.response.status, 401);
            });
            // and we assert that the only cookie that exists is the st-last-access-token-update
            let newCookies = (await page._client.send("Network.getAllCookies")).cookies;

            assert(newCookies.length === 1);
            assert(newCookies[0].name === "st-last-access-token-update");
        } finally {
            await browser.close();
        }
    });
});

function addAxiosInterceptorsTest(axiosInstance) {
    // test request interceptor1
    axiosInstance.interceptors.request.use(testRequestInterceptor, async function (error) {
        throw error;
    });

    // Add a request interceptor
    axiosInstance.interceptors.request.use(interceptorFunctionRequestFulfilled, async function (error) {
        throw error;
    });

    // test request interceptor2
    axiosInstance.interceptors.request.use(testRequestInterceptor, async function (error) {
        throw error;
    });

    // test response interceptor3
    axiosInstance.interceptors.response.use(
        async function (response) {
            response = {
                ...response,
                headers: {
                    ...response.headers,
                    doInterception3: "value 3"
                }
            };
            return response;
        },
        async function (error) {
            throw error;
        }
    );

    // Add a response interceptor
    axiosInstance.interceptors.response.use(responseInterceptor(axiosInstance));
    // test response interceptor4
    axiosInstance.interceptors.response.use(
        async function (response) {
            response = {
                ...response,
                headers: {
                    ...response.headers,
                    doInterception4: "value 4"
                }
            };
            return response;
        },
        async function (error) {
            throw error;
        }
    );
}

async function testRequestInterceptor(config) {
    let testConfig = config;
    if (testConfig.headers["interceptorHeader1"] === undefined) {
        testConfig = {
            ...testConfig,
            headers: {
                ...testConfig.headers,
                interceptorHeader1: "value1"
            }
        };
    } else {
        testConfig = {
            ...testConfig,
            headers: {
                ...testConfig.headers,
                interceptorHeader2: "value2"
            }
        };
    }
    return testConfig;
}
