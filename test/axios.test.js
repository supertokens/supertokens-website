let axios = require("axios");

let puppeteer = require("puppeteer");
let jsdom = require("mocha-jsdom");
let { AntiCsrfToken } = require("../lib/build/index.js");
let { default: AuthHttpRequest } = require("../lib/build/axios.js");
let assert = require("assert");
let { delay, checkIfIdRefreshIsCleared, getNumberOfTimesRefreshCalled, startST } = require("./utils");
const { spawn } = require("child_process");

const BASE_URL = "http://localhost:8080";
AuthHttpRequest.makeSuper(axios);

// TODO: device info tests

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
