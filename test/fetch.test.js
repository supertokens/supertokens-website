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

    //test custom headers are being sent when logged in and when not*****
    it("test refresh session with fetch", async function() {
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
                supertokens.fetch.init(`${BASE_URL}/refresh`, 440, true);
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
                await delay(3);

                //check that the number of times the refreshAPI was called is 0
                assertEqual(await getNumberOfTimesRefreshCalled(), 0);

                let getResponse = await fetch(`${BASE_URL}/`);

                //check that the response to getSession was success
                assertEqual(await getResponse.text(), "success");

                //check that the number of time the refreshAPI was called is 1
                assertEqual(await getNumberOfTimesRefreshCalled(), 1);
            });
        } finally {
            await browser.close();
        }
    });

    //test custom headers are being sent when logged in and when not*****
    it("test with fetch that custom headers are being sent", async function() {
        await startST(5);
        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });
        try {
            const page = await browser.newPage();
            await page.goto(BASE_URL + "/index", { waitUntil: "load" });
            await page.addScriptTag({ path: `./bundle/bundle.js`, type: "text/javascript" });
            await page.evaluate(async () => {
                let BASE_URL = "http://localhost:8080";
                supertokens.fetch.init(`${BASE_URL}/refresh`, 440, true);
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
            await page.goto(BASE_URL + "/index", { waitUntil: "load" });
            await page.addScriptTag({ path: `./bundle/bundle.js`, type: "text/javascript" });
            page.on("console", consoleObj => console.log(consoleObj.text()));
            await page.evaluate(async () => {
                let BASE_URL = "http://localhost:8080";
                supertokens.fetch.init(`${BASE_URL}/refresh`, 440, true);
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
            await page.goto(BASE_URL + "/index", { waitUntil: "load" });
            await page.addScriptTag({ path: `./bundle/bundle.js`, type: "text/javascript" });
            page.on("console", consoleObj => console.log(consoleObj.text()));
            await page.evaluate(async () => {
                let BASE_URL = "http://localhost:8080";
                supertokens.fetch.init(`${BASE_URL}/refresh`, 440, true);
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
                assertEqual(window.localStorage.length, 1);

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
                assertEqual(window.localStorage.length, 0);
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
            await page.goto(BASE_URL + "/index", { waitUntil: "load" });
            await page.addScriptTag({ path: `./bundle/bundle.js`, type: "text/javascript" });
            page.on("console", consoleObj => console.log(consoleObj.text()));
            await page.evaluate(async () => {
                let BASE_URL = "http://localhost:8080";
                supertokens.fetch.init(`${BASE_URL}/refresh`, 440, true);
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

                let attemptRefresh = await supertokens.fetch.attemptRefreshingSession();
                assertEqual(attemptRefresh, true);

                assertEqual(await getNumberOfTimesRefreshCalled(), 1);
            });
        } finally {
            await browser.close();
        }
    });

    // multiple API calls in parallel when access token is expired (100 of them) and only 1 refresh should be called*****
    it("test with fetch that multiple API calls in parallel when access token is expired, only 1 refresh should be called", async function() {
        await startST(5);
        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });
        try {
            const page = await browser.newPage();
            await page.goto(BASE_URL + "/index", { waitUntil: "load" });
            await page.addScriptTag({ path: `./bundle/bundle.js`, type: "text/javascript" });
            await page.evaluate(async () => {
                let BASE_URL = "http://localhost:8080";
                supertokens.fetch.init(`${BASE_URL}/refresh`, 440, true);
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
                await delay(7);

                let promises = [];
                let n = 100;

                // create an array of 100 get session promises
                for (let i = 0; i < n; i++) {
                    promises.push(fetch(`${BASE_URL}/`));
                }

                // send 100 get session requests
                let multipleGetSessionResponse = await Promise.all(promises);

                //check that reponse of all requests are success
                let noOfResponeSuccesses = 0;
                for (let i = 0; i < multipleGetSessionResponse.length; i++) {
                    assertEqual(await multipleGetSessionResponse[i].text(), "success");
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
    //  it("test with fetch that things should work correctly if anti-csrf is disabled", async function() {
    //     await startST(5);
    //     const browser = await puppeteer.launch({
    //         args: ["--no-sandbox", "--disable-setuid-sandbox"]
    //     });
    //     try{
    //         const page = await browser.newPage();
    //         await page.goto(BASE_URL + "/index", { waitUntil: "load" });
    //         await page.addScriptTag({ path: `./bundle/bundle.js`, type: "text/javascript" });
    //         await page.evaluate(async () => {
    //             let BASE_URL = "http://localhost:8080";
    //             supertokens.fetch.init(`${BASE_URL}/refresh`, 440, true);
    //             let userId = "testing-supertokens-website";

    //         // send api request to login
    //         let loginResponse = await fetch(`${BASE_URL}/login`, {
    //             method: "post",
    //             headers: {
    //             Accept: "application/json",
    //             "Content-Type": "application/json",

    //         },
    //         body: JSON.stringify({ userId })
    //         });
    //         assertEqual(await loginResponse.text(),userId);
    //         assertEqual(await supertokens.fetch.doesSessionExist(), true);
    //         assertEqual(await getNumberOfTimesRefreshCalled(), 0);

    //         await delay(3);

    //         let getSessionResponse = await fetch(`${BASE_URL}/`);
    //         console.log(await getSessionResponse.text())
    //         // assertEqual(await getSessionResponse.text(), "success");
    //         // assertEqual(await getNumberOfTimesRefreshCalled(), 1);

    //         // let logoutResponse = await fetch(`${BASE_URL}/logout`, {
    //         //     method: "post",
    //         //     headers: {
    //         //     Accept: "application/json",
    //         //     "Content-Type": "application/json",

    //         // },
    //         // body: JSON.stringify({ userId })
    //         // });

    //         // assertEqual(await supertokens.fetch.doesSessionExist(), false);
    //         // assertEqual(await logoutResponse.text(), "success");

    //         });
    //     } finally {
    //         await browser.close();
    //     }
    // });
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
